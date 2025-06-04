import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa6";

const PressTableRecords = () => {
  const [pressTableRecords, setPressTableRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moveProgress, setMoveProgress] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  const [recordAddedResponse, setRecordAddedResponse] = useState("");

  const BASE_URL = "https://return-inventory-backend.onrender.com";
  const Ship_POST_API = `${BASE_URL}/api/v1/ship-record/ship`;

  const fetchPressTableRecords = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/v1/press-table/get-records`
      );
      setPressTableRecords(response.data.data);
    } catch (err) {
      setError("Failed to fetch records. Please try again later.");
      console.error("Error fetching press table records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPressTableRecords();
  }, []);

  // Toggle row selection
  const toggleRecordSelection = (record) => {
    const isSelected = selectedRecords.find((r) => r._id === record._id);
    if (isSelected) {
      setSelectedRecords(selectedRecords.filter((r) => r._id !== record._id));
    } else {
      setSelectedRecords([...selectedRecords, record]);
    }
  };

  // Move selected records to Ship Table
  const handleMoveToShip = async () => {
    try {
      if (selectedRecords.length === 0)
        return alert("Select at least one record");

      setIsMoving(true);
      setMoveProgress(0);

      for (let i = 0; i < selectedRecords.length; i++) {
        await axios.post(Ship_POST_API, selectedRecords[i]);
        setMoveProgress(((i + 1) / selectedRecords.length) * 100);
      }

      setRecordAddedResponse("✅ Selected records moved to Ship Table");
      setSelectedRecords([]);
      fetchPressTableRecords();
    } catch (error) {
      console.error("Failed to move to ship table", error);
      setRecordAddedResponse("❌ Failed to move records to ship");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-2xl font-semibold mb-4 text-green-500">
          Press Table Records
        </h2>

        {recordAddedResponse && (
          <div className="mb-4 text-blue-600 font-semibold">
            {recordAddedResponse}
          </div>
        )}
      <div className="flex-row-reverse flex">
        <button
          onClick={handleMoveToShip}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isMoving}
        >
          {isMoving ? "Moving..." : "Move Selected to Ship"}
        </button>

        {isMoving && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 transition-all duration-300"
              style={{ width: `${moveProgress}%` }}
            />
          </div>
        )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecords(pressTableRecords);
                        } else {
                          setSelectedRecords([]);
                        }
                      }}
                      checked={
                        selectedRecords.length === pressTableRecords.length
                      }
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr. No
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
                {pressTableRecords.map((record, i) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={
                          !!selectedRecords.find((r) => r._id === record._id)
                        }
                        onChange={() => toggleRecordSelection(record)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.styleNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.color}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PressTableRecords;
