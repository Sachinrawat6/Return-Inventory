import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa6";

const ReturnTableRecords = () => {
  const [returnTableRecords, setReturnTableRecords] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [recordAddedResponse, setRecordAddedResponse] = useState("");
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [products, setProductsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [progress, setProgress] = useState(0);

  const BASE_URL = "https://return-inventory-backend.onrender.com";
  const PressTable_POST_API = `${BASE_URL}/api/v1/press-table/add-record`;

  const fetchReturnTableRecords = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/v1/return-table/get-records`
      );
      setReturnTableRecords(response.data.data);
    } catch (err) {
      setError("Failed to fetch records. Please try again later.");
      console.error("Error fetching return table records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (record) => {
    setSelectedRecords((prev) => {
      const exists = prev.find((r) => r._id === record._id);
      return exists
        ? prev.filter((r) => r._id !== record._id)
        : [...prev, record];
    });
  };

  const sendToPressTable = async () => {
    if (selectedRecords.length === 0) {
      alert("No records selected.");
      return;
    }

    setIsMoving(true);
    setProgress(0);

    try {
      for (let i = 0; i < selectedRecords.length; i++) {
        await axios.post(`${BASE_URL}/api/v1/press-table/add-record`, selectedRecords[i]);
        setProgress(((i + 1) / selectedRecords.length) * 100);
      }

      alert("✅ Selected records sent to Press Table.");
      setSelectedRecords([]);
      fetchReturnTableRecords();
    } catch (error) {
      console.error("Error sending to Press Table:", error);
      alert("❌ Failed to send records to Press Table.");
    } finally {
      setIsMoving(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        // "https://inventorybackend-m1z8.onrender.com/api/product"
        "https://inventorybackend-m1z8.onrender.com/api/v1/colors/get-colors"
      );
      console.log(response)
      setProductsData(response.data.data);
    } catch (error) {
      setError("Failed to fetch inventory products", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnTableRecords();
    fetchProducts();
  }, []);

  const downloadCSV = (records) => {
    const headers = [
      "DropshipWarehouseId",
      "Item SkuCode",
      "InventoryAction",
      "QtyIncludesBlocked",
      "Qty",
      "RackSpace",
      "Last Purchase Price",
      "Notes",
    ];

    const rows = returnTableRecords.map((record) => [
      "22784",
      `${record.styleNumber}-${
        products.find((p) => p.style_code === record.styleNumber)?.color ||
        record.color
      }-${record.size}`,
      "ADD",
      "",
      "1",
      "Intransit",
      "",
      "",
    ]);

    const toCSVRow = (row) => row.map((val) => `"${val}"`).join(",");

    const csvContent = [headers, ...rows].map(toCSVRow).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "UpdateInStockQtyAnd_orLastPurchasePrice.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-2xl font-semibold text-blue-600 mb-6">
          Return Table Records
        </h2>

        {/* Progress Bar */}
        {isMoving && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className="bg-green-500 h-2 rounded"
                style={{ width: `${progress}%`, transition: "width 0.3s ease" }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% completed</p>
          </div>
        )}

        <div className=" flex gap-2 mb-4 flex-row-reverse">
          <button
            className="bg-blue-500 py-2 px-4 flex gap-2 items-center rounded text-white cursor-pointer hover:bg-blue-600 duration-75 font-medium"
            onClick={downloadCSV}
          >
            <FaDownload /> Return Inventory
          </button>

          <button
            className={`py-2 px-4 flex gap-2 items-center rounded text-white font-medium ${
              selectedRecords.length === 0 || isMoving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={sendToPressTable}
            disabled={selectedRecords.length === 0 || isMoving}
          >
            Send to Press Table
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecords(returnTableRecords);
                        } else {
                          setSelectedRecords([]);
                        }
                      }}
                      checked={
                        selectedRecords.length === returnTableRecords.length &&
                        returnTableRecords.length > 0
                      }
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnTableRecords.length > 0 ? (
                  returnTableRecords.map((record, i) => (
                    <tr
                      key={record._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.some(
                            (r) => r._id === record._id
                          )}
                          onChange={() => toggleSelection(record)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {record.styleNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isLoading
                          ? "loading..."
                          : record.color?.toLowerCase() === "other"
                          ? products.find((p) => p.style_code === record.styleNumber)?.color || "?"
                          : record.color || "?"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.order_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnTableRecords;
