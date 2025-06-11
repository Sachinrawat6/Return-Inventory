import axios from "axios";
import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [mergedRecords, setMergedRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

      const shipRaw = shipRes.data.data || shipRes.data || [];
      const shipData = Array.isArray(shipRaw)
        ? shipRaw.map((item) => ({ ...item, source: "Ship" }))
        : [];

      const combined = [...pressData, ...returnData, ...inventoryData, ...shipData];
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
            record.styleNumber.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
          (record.location &&
            record.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, mergedRecords]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Inventory Stocks</h1>
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
                      {searchTerm ? "No matching records found" : "No data available"}
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
                      <td className={`${record.location==="Shipped"? " text-white":""} px-6 py-4 whitespace-nowrap text-sm text-gray-500`}>
                       <span className={`${record.location==="Shipped"? "bg-red-100  text-red-800":"bg-green-100 text-green-800 "} rounded-2xl py-1 px-4 font-medium`}>{record.location || "-"} </span> 
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
                          ? new Date(record.createdAt || record.dateAdded).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }
                            )
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