import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Uploads = () => {
  const [csvData, setCsvData] = useState([]);
  const [mergedRecords, setMergedRecords] = useState([]);
  const [rackSpaceData, setRackSpaceData] = useState([]);
  const [channel, setChannel] = useState("");
  const [fileName, setFileName] = useState("");
  const [rackSpaceFileName, setRackSpaceFileName] = useState("");
  const [loading, setLoading] = useState(false);


  const BASE_URL = "https://return-inventory-backend.onrender.com";
  const PressTable_API = `${BASE_URL}/api/v1/press-table/get-records`;
  const ReturnTable_API = `${BASE_URL}/api/v1/return-table/get-records`;
  const Ship_API = `${BASE_URL}/api/v1/ship-record`;
  const Inventory_API = `${BASE_URL}/api/v1/inventory-table/get-records`;

  const fetchAllRecords = async () => {
    try {
      setLoading(true);

      const [pressRes, returnRes, inventoryRes, shipRes] = await Promise.all([
        axios.get(PressTable_API),
        axios.get(ReturnTable_API),
        axios.get(Inventory_API),
        axios.get(Ship_API),
      ]);

      const pressData = (pressRes.data.data || []).map((item) => ({
        ...item,
        source: "Press",
      }));

      const returnData = (returnRes.data.data || []).map((item) => ({
        ...item,
        source: "Return",
      }));

      const inventoryData = (inventoryRes.data.data || []).map((item) => ({
        ...item,
        source: "Inventory",
      }));

      

      // const combined = [...pressData, ...returnData, ...inventoryData, ...shipData];
      const combined = [...pressData, ...returnData, ...inventoryData];
      setMergedRecords(combined);
      
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRecords();
  }, []);


  // Handle main CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData = results.data
          .map((row) => {
            const SKU = row["Product Sku Code"] || "";
            const ListingSkuCode = row["Listing Sku Code"];
            const skuParts = SKU.split("-");
            const size = skuParts[2] || "";
            const styleNumber = parseInt(skuParts[0]) || 0;

            //   intransit counts
            const pressTableCount = mergedRecords.filter(
              (record) =>
                record.styleNumber === styleNumber &&
                record.size === size &&
                record.location === "Press Table"
            ).length;

            const returnTableCount = mergedRecords.filter(
              (record) =>
                record.styleNumber === styleNumber &&
                record.size === size &&
                record.location === "Return Table"
            ).length;

            const inventoryCartCount = mergedRecords.filter(
              (record) =>
                Number(record.styleNumber) === styleNumber &&
                record.size === size &&
                record.location.endsWith(" Cart")
            ).length;

            const brand =
              ListingSkuCode?.toString().startsWith("8") ||
              ListingSkuCode?.toString().startsWith("5")
                ? "Qurvii+"
                : ListingSkuCode?.toString().toLowerCase().startsWith("r")
                ? "Roadstar"
                : ListingSkuCode?.toString().toLowerCase().startsWith("24")
                ? "Qurvii Desi"
                : "Qurvii";

            return {
              SKU,
              QTY: row["Qty"] || "0",
              Brand: brand,
              size,
              styleNumber,
              PressTable: pressTableCount || "-",
              ReturnTable: returnTableCount || "-",
              Inventory: inventoryCartCount || "-",
            };
          })
          .filter((item) => item.styleNumber && item.size);

        setCsvData(processedData);
        setLoading(false);
      },
      error: () => {
        setLoading(false);
        alert("Error parsing main CSV file");
      },
    });
  };

  // Handle rack space CSV file upload
  const handleRackSpaceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRackSpaceFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData = results.data
          .map((row) => {
            return {
              styleNumber: parseInt(row["Sku Id"]?.split("-")[0]) || 0,
              size: row["Sku Id"]?.split("-")[2] || "",
              rackSpace: row["Rack Space"] || "N/A",
            };
          })
          .filter((item) => item.styleNumber && item.size);

        setRackSpaceData(processedData);
        setLoading(false);
      },
      error: () => {
        setLoading(false);
        alert("Error parsing rack space CSV file");
      },
    });
  };

  // Merge data when both files are loaded
  const mergedData = csvData.map((item) => {
    const matchingRackSpace = rackSpaceData.find(
      (rs) => rs.styleNumber === item.styleNumber && rs.size === item.size
    );

    return {
      ...item,
      rackSpace: matchingRackSpace ? matchingRackSpace.rackSpace : "N/A",
    };
  });

  // Export to CSV
  const exportToCSV = () => {
    if (mergedData.length === 0) {
      alert("No data to export");
      return;
    }

    const csv = Papa.unparse(mergedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rack_space_data_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
  if (mergedData.length === 0) {
    alert("No data to export");
    return;
  }

  if (rackSpaceData.length === 0) {
    alert("Please Upload rackSpace file first");
    return;
  }

  // Import jsPDF dynamically to avoid SSR issues
  import("jspdf").then((jsPDFModule) => {
    const { default: jsPDF } = jsPDFModule;
    import("jspdf-autotable").then((autoTableModule) => {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Pick List Report", 14, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.text(`Channel: ${channel || "N/A"}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 37);
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 14, 44);

      // Sort the data:
      // 1. Normal items first (ascending order)
      // 2. Then "intransit" items
      // 3. Finally "virtual" items at the end
      const sortedData = [...mergedData].sort((a, b) => {
        // Check if either item is "virtual"
        const aIsVirtual = a.rackSpace.toLowerCase() === "virtual";
        const bIsVirtual = b.rackSpace.toLowerCase() === "virtual";
        
        // Check if either item is "intransit"
        const aIsIntransit = a.rackSpace.toLowerCase() === "intransit";
        const bIsIntransit = b.rackSpace.toLowerCase() === "intransit";
        
        // Virtual items go to the end
        if (aIsVirtual && !bIsVirtual) return 1;
        if (!aIsVirtual && bIsVirtual) return -1;
        
        // Among virtual items, sort normally
        if (aIsVirtual && bIsVirtual) {
          return a.SKU.localeCompare(b.SKU);
        }
        
        // Intransit items go just before virtual
        if (aIsIntransit && !bIsIntransit) return 1;
        if (!aIsIntransit && bIsIntransit) return -1;
        
        // Among non-special items, sort by SKU
        return a.SKU.localeCompare(b.SKU);
      });

      // Prepare data for the table
      const tableData = sortedData.map((item, index) => [
        index + 1,
        item.SKU,
        item.QTY,
        item.Brand,
        item.rackSpace,
        item.PressTable,
        item.ReturnTable,
        item.Inventory
      ]);

      // Add table using autoTable
      autoTableModule.default(doc, {
        head: [
          [
            "Sr.No", 
            "SKU", 
            "Qty", 
            "Brand", 
            "Rack Space",
            "Press Table", 
            "Return Table", 
            "Inventory"
          ]
        ],
        body: tableData,
        startY: 50,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 }
        },
      });

      // Save the PDF
      doc.save(`picklist_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  });
};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r bg-gray-100 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-700">
              Rack Space Management
            </h1>
            <p className="text-gray-600">
              Upload and manage inventory rack spaces
            </p>
          </div>

          {/* Upload Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setChannel(e.target.value)}
                  value={channel}
                >
                  <option value="">Select Channel</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Nykaa">Nykaa</option>
                  <option value="Shopify">Shopify</option>
                  <option value="Tatacliq">Tatacliq</option>
                  <option value="Ajio">Ajio</option>
                  <option value="Shoppersstop">Shoppersstop</option>
                </select>
              </div>

              <div className="flex items-end space-x-4">
                {channel && (
                  <>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Packlog CSV
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="file-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="file-upload"
                          className={`block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer ${
                            loading
                              ? "bg-gray-100"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {fileName || "Choose file"}
                        </label>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rack Space CSV
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleRackSpaceFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="rack-space-upload"
                          disabled={loading}
                        />
                        <label
                          htmlFor="rack-space-upload"
                          className={`block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer ${
                            loading
                              ? "bg-gray-100"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {rackSpaceFileName || "Choose file"}
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : mergedData.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Inventory Data
                  </h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={exportToCSV}
                      className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      disabled={rackSpaceData.length === 0}
                      className={`  ${
                        rackSpaceData.length === 0
                          ? "cursor-not-allowed bg-red-100 text-red-800 "
                          : " hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 bg-red-600 cursor-pointer text-white"
                      }  inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm  `}
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Export Picklist
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sr.No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rack Space
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mergedData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.SKU}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.QTY}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.Brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.rackSpace.toLowerCase() === "intransit"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.rackSpace.toLowerCase() === "virtual"
                                  ? "bg-purple-100 text-purple-800"
                                  : item.rackSpace === "N/A"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.rackSpace}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No data
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload CSV files to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uploads;
