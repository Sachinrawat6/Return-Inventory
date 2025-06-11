import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa6";

const ShippedRecord = () => {
  const [shippedRecords, setShippedRecords] = useState([]);
  const [products,setProductsData] = useState([])
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const BASE_URL = 'https://return-inventory-backend.onrender.com';

  const fetchShippedRecords = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/v1/ship-record`);
      setShippedRecords(response.data.data);
    } catch (err) {
      setError("Failed to fetch records. Please try again later.");
      console.error("Error fetching return table records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippedRecords();
  }, []);
   const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://inventorybackend-m1z8.onrender.com/api/product"
        );
        const result = await response.json();
        setProductsData(result);
      } catch (error) {
        setError("Failed to fetch inventory products", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
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

    const rows = shippedRecords.map((record) => [
      "22784",
      `${record.styleNumber}-${
       record.color==="other"? products.find((p) => p.style_code === record.styleNumber)?.color :
        record.color
      }-${record.size}`,
      "RESET",
      "",
      "0",
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

  const toggleSelect = (record) => {
    const exists = selectedRecords.find((r) => r._id === record._id);
    if (exists) {
      setSelectedRecords(selectedRecords.filter((r) => r._id !== record._id));
    } else {
      setSelectedRecords([...selectedRecords, record]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === shippedRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(shippedRecords);
    }
  };

  const deleteShippedRecordById = async (_id) => {
    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/ship-record/delete-shipped-record`, { _id });
      if (response.status === 200) {
        setShippedRecords((prev) => prev.filter((record) => record._id !== _id));
      }
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      alert("Failed to delete record.");
    }
  };

  const deleteSelectedRecords = async () => {
    if (selectedRecords.length === 0) return alert("Please select at least one record.");
    const confirm = window.confirm(`Are you sure you want to delete ${selectedRecords.length} record(s)?`);
    if (!confirm) return;

    setIsDeleting(true);
    setDeleteProgress(0);

    try {
      for (let i = 0; i < selectedRecords.length; i++) {
        await axios.post(`${BASE_URL}/api/v1/ship-record/delete-shipped-record`, {
          _id: selectedRecords[i]._id,
        });
        const progress = Math.round(((i + 1) / selectedRecords.length) * 100);
        setDeleteProgress(progress);
      }

      setShippedRecords((prev) => prev.filter((r) => !selectedRecords.find((s) => s._id === r._id)));
      setSelectedRecords([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete selected records.");
    } finally {
      setTimeout(() => {
        setIsDeleting(false);
        setDeleteProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-2xl font-semibold mb-6 text-red-500">Shipped Records</h2>

        {selectedRecords.length > 0 && (
          <button
            onClick={deleteSelectedRecords}
            disabled={isDeleting}
            className="mb-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
          >
            Delete Selected ({selectedRecords.length})
          </button>
        )}
        <div className="flex flex-row-reverse">
            <button
                      className="bg-red-500 py-2  mb-4 px-4 flex gap-2 items-center rounded text-white cursor-pointer hover:bg-red-600 duration-75 font-medium"
                      onClick={downloadCSV}
                    >
                      <FaDownload /> Reset Inventory
                    </button>
        </div>

        {/* Progress Bar */}
        {isDeleting && (
          <div className="w-full bg-gray-200 h-4 rounded mb-6 overflow-hidden relative">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${deleteProgress}%` }}
            />
            <span className="absolute inset-0 text-center text-sm font-medium text-white leading-4">
              {deleteProgress}%
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={selectedRecords.length === shippedRecords.length && shippedRecords.length > 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sr.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Style Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippedRecords.length > 0 ? (
                  shippedRecords.map((record, i) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={!!selectedRecords.find((r) => r._id === record._id)}
                          onChange={() => toggleSelect(record)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{i + 1}</td>
                      <td className="px-6 py-4 text-sm text-blue-900">{record.styleNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.color}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.order_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteShippedRecordById(record._id)}
                          className="bg-red-500 py-2 px-4 rounded text-white hover:bg-red-600 duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
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

export default ShippedRecord;
