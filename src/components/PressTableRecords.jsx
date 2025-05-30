import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa6";

const PressTableRecords = () => {
  const [pressTableRecords, setPressTableRecords] = useState([]);
  const [returnTableRecords, setReturnTableRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL ='https://return-inventory-backend.onrender.com'; 
  // return table records
  const fetchPressTableRecords = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/v1/press-table/get-records`);
      setPressTableRecords(response.data.data);
    } catch (err) {
      setError("Failed to fetch records. Please try again later.");
      console.error("Error fetching return table records:", err);
    } finally {
      setIsLoading(false);
    }
  };

// press table records
const fetchReturnTableRecords = async()=>{
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/v1/return-table/get-records`);
      setReturnTableRecords(response.data.data);
      
    } catch (err) {
      setError("Failed to fetch records. Please try again later.");
      console.error("Error fetching return table records:", err);
    } finally {
      setIsLoading(false);
    }
}

  useEffect(() => {
    fetchPressTableRecords();
    fetchReturnTableRecords();
  }, []);


  
// download add inventory csv file
const downloadCSV = (records) => {
  const headers = [
    "DropshipWarehouseId",
    "Item SkuCode",
    "InventoryAction",
    "QtyIncludesBlocked",
    "Qty",
    "RackSpace",
    "Last Purchase Price",
    "Notes"
  ];

  const rows = pressTableRecords.map((record) => [
    "22784",
    `${record.styleNumber}-${record.color}-${record.size}`,
    "ADD",
    "",
    "1",
    "Press Table",
    "",
    ""
  ]);

  // Helper to wrap each value in double quotes
  const toCSVRow = (row) => row.map(val => `"${val}"`).join(",");

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



// download reset inventory csv file
const downloadResetCSV = (pressTableRecords, returnTableRecords) => {
  const headers = [
    "DropshipWarehouseId",
    "Item SkuCode",
    "InventoryAction",
    "QtyIncludesBlocked",
    "Qty",
    "RackSpace",
    "Last Purchase Price",
    "Notes"
  ];

  // Filter out records that are present in returnTableRecords based on order_id
  const filteredRecords = pressTableRecords.filter(
    (record) => !returnTableRecords.some(returnRecord => returnRecord.order_id === record.order_id)
  );

  const rows = filteredRecords.map((record) => [
    "22784",
    `${record.styleNumber}-${record.color}-${record.size}`,
    "RESET",
    "",
    "0",
    "Return Table",
    "",
    ""
  ]);

  const toCSVRow = (row) => row.map(val => `"${val}"`).join(",");

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
        <h2 className="text-2xl font-semibold  mb-6 text-green-500">  Press Table Records</h2>
        <div className="absolute top-0 right-4 sm:flex gap-4 hidden ">
         <button 
            onClick={()=>downloadResetCSV(pressTableRecords,returnTableRecords)}
            className="bg-red-500 py-2 px-4 rounded text-white cursor-pointer hover:bg-red-600 duration-75 font-medium flex items-center gap-2"> <FaDownload/> Reset Inventory</button>
            <button 
            onClick={downloadCSV}
            className="bg-green-500 py-2 px-4 rounded text-white cursor-pointer hover:bg-green-600 duration-75 font-medium flex items-center gap-2"> <FaDownload/> Add Inventory</button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr.No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Style Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Id
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pressTableRecords.length > 0 ? (
                  pressTableRecords.map((record,i) => (
                    <tr key={record.order_id} className="hover:bg-gray-50 transition-colors duration-150">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {i+1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.styleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.color}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.location}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.order_id}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
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

export default PressTableRecords;