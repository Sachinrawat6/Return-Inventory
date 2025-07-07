import axios from "axios";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Dashboard = () => {
  const [mergedRecords, setMergedRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [channel, setChannel] = useState("");

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

      // const shipRaw = shipRes.data.data || shipRes.data || [];
      // const shipData = Array.isArray(shipRaw)
      //   ? shipRaw.map((item) => ({ ...item, source: "Ship" }))
      //   : [];

      // const combined = [...pressData, ...returnData, ...inventoryData, ...shipData];
      const combined = [...pressData, ...returnData, ...inventoryData];
      setMergedRecords(combined);
      setFilteredRecords(combined);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRecords();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRecords(mergedRecords);
    } else {
      const filtered = mergedRecords.filter(
        (record) =>
          (record.styleNumber &&
            record.styleNumber
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (record.location &&
            record.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, mergedRecords]);

  //  upload file

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          try {
            const filteredData = results.data
              .map((row) => {
                const SKU = row["Sku Id"];
                // const ListingSkucode = row["Listing Sku Code"];
                const skuParts = SKU ? SKU.split("-") : [];
                // const skuParts = ProductSkuCode ? ProductSkuCode.split("-") : [];
                const size = skuParts[2] || "";
                const styleNumberRaw = skuParts[0] || "";
                const styleNumber = Number(styleNumberRaw);

                if (!styleNumber || !size) return null; // Skip malformed rows

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

               const brand = SKU?.startsWith("24") ? "Qurvii Desi" : "Qurvii";

                return {
                  SKU,
                  Brand:brand,
                  // ListingSkucode,
                  QTY: row["Good"] || "0",
                  rackSpace: row["Rack Space"] || "N/A",
                  PressTable: pressTableCount || "-",
                  ReturnTable: returnTableCount || "-",
                  Inventory: inventoryCartCount || "-",
                };
              })
              .filter(Boolean); // remove null rows

            setCsvData(filteredData);
            console.log(filteredData);
          } catch (parseError) {
            console.error("Error processing parsed data:", parseError);
          }
        },
        error: function (error) {
          console.error("CSV parsing failed:", error);
        },
      });
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  // // download file
  // const handleDownload = () => {
  //   // Step 1: Filter rows with rackSpace exactly "intransit" (case-insensitive)
  //   const intransitData = csvData.filter(row => {
  //     const value = row.rackSpace || "";
  //     return value.trim().toLowerCase() === "intransit";
  //   });

  //   // Step 2: Handle if no such data
  //   if (intransitData.length === 0) {
  //     alert("No records found with Rack Space = 'intransit'");
  //     return;
  //   }

  //   // Step 3: Convert to CSV and trigger download
  //   const csv = Papa.unparse(intransitData);
  //   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);

  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.setAttribute("download", "intransit_data.csv");
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleDownload = () => {
    // Step 1: Filter rows with rackSpace exactly "intransit" (case-insensitive)
    const intransitData = csvData.filter((row) => {
      const value = row.rackSpace || "";
      return value.trim().toLowerCase() === "intransit";
    });

    if (intransitData.length === 0) {
      alert("No records found with Rack Space = 'intransit'");
      return;
    }

    // ✅ Step 2: Sort csvData to push intransit at the end
    const sortedData = [...csvData].sort((a, b) => {
      const aIsIntransit = (a.rackSpace || "").toLowerCase() === "intransit";
      const bIsIntransit = (b.rackSpace || "").toLowerCase() === "intransit";
      return aIsIntransit - bIsIntransit;
    });

    const csv = Papa.unparse(sortedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "intransit_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (csvData.length === 0) {
      alert("No data available to export");
      return;
    }

    const doc = new jsPDF();

    const columns = [
      { header: "Sr.No", dataKey: "Sr_No" },
      { header: "SKU", dataKey: "SKU" },
      { header: "Qty", dataKey: "QTY" },
      { header: "Brand", dataKey: "Brand" },
      { header: "Rack Space", dataKey: "rackSpace" },
      { header: "Press ", dataKey: "PressTable" },
      { header: "Return ", dataKey: "ReturnTable" },
      { header: "Inventory Cart", dataKey: "Inventory" },
    ];

    // ✅ Sorted csvData: intransit rows at the end
    const sortedData = [...csvData].sort((a, b) => {
      const aIsIntransit =
        (a.rackSpace || "").toLowerCase() === "intransit" &&
        (a.rackSpace || "").toLowerCase() === "virtual";
      const bIsIntransit =
        (b.rackSpace || "").toLowerCase() === "intransit" &&
        (a.rackSpace || "").toLowerCase() === "virtual";
      return aIsIntransit - bIsIntransit;
    });

    const rows = sortedData.map((row, i) => ({
      Sr_No: i + 1,
      SKU: row.SKU,
      size: row.size,
      QTY: row.QTY,
      Brand:row.Brand,
      PressTable: row.PressTable,
      ReturnTable: row.ReturnTable,
      Inventory: row.Inventory,
      rackSpace: `[ ${row.rackSpace} ]`
    }));

    // Add title & metadata
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN");
    const formattedTime = now.toLocaleTimeString("en-IN");

    doc.setFontSize(12);
    doc.text("Pick List", 14, 15);

    doc.setFontSize(10);
    doc.text(`Channel: ${channel}`, 14, 25);
    doc.text(`Date: ${formattedDate}`, 14, 32);
    doc.text(`Time: ${formattedTime}`, 14, 39);

    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => row[col.dataKey] || "-")),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      startY: 45,
    });

    doc.save("PickList.pdf");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Inventory Stocks
          </h1>
          <div className="flex gap-4">
            <select
              className="border border-gray-200 py-2 px-4 cursor-pointer rounded outline-gray-400 accent-emerald-100"
              onChange={(e) => setChannel(e.target.value)}
              value={channel}
            >
              <option value="">Select Channel</option>
              <option value="Shopify">Shopify</option>
              {/* <option value="Myntra">Myntra </option> */}
              {/* <option value="Nykaa">Nykaa </option> */}
              {/* <option value="Tatacliq ">Tatacliq </option> */}
              {/* <option value="Ajio">Ajio </option> */}
              {/* <option value="Shoppersstop">Shoppersstop</option> */}
            </select>
            <input
              style={{ display: channel ? "block" : "none" }}
              onChange={handleFileUpload}
              accept=".csv"
              type="file"
              className="border border-gray-200 py-2 px-4 rounded  cursor-pointer"
            />

            {csvData.length > 0 && (
              <>
                <button
                  onClick={handleDownload}
                  className="bg-blue-500 text-white cursor-pointer px-4 py-2 rounded hover:bg-blue-600 mr-2"
                >
                  Download CSV
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="bg-[#222] text-white cursor-pointer px-4 py-2 rounded hover:bg-[#333]"
                >
                  Download Picklist
                </button>
              </>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by style or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Style Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Source
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No matching records found"
                        : "No data available"}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr
                      key={`${record._id}-${record.source}`}
                      className={`hover:bg-gray-50 transition-colors duration-15`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.styleNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.size || "-"}
                      </td>
                      <td
                        className={`${
                          record.location === "Shipped" ? " text-white" : ""
                        } px-6 py-4 whitespace-nowrap text-sm text-gray-500`}
                      >
                        <span
                          className={`${
                            record.location === "Shipped"
                              ? "bg-red-100  text-red-800"
                              : "bg-green-100 text-green-800 "
                          } rounded-2xl py-1 px-4 font-medium`}
                        >
                          {record.location || "-"}{" "}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.source === "Press"
                              ? "bg-blue-100 text-blue-800"
                              : record.source === "Return"
                              ? "bg-purple-100 text-purple-800"
                              : record.source === "Inventory"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {record.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.createdAt || record.dateAdded
                          ? new Date(
                              record.createdAt || record.dateAdded
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
