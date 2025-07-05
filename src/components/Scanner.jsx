import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Select from "react-select";
import axios from "axios";

const QrScanner = () => {
  const [scannedData, setScannedData] = useState("");
  const [product, setProduct] = useState([]);
  const [apiResponse, setApiResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [mode, setMode] = useState("camera");
  const [showScanner, setShowScanner] = useState(true);
  let [depart, setDepart] = useState("");
  const [recordAddedResponse, setRecordAddedResponse] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [syncOrder, setSyncOrder] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [scanQr, setScanQr] = useState("");
  const [formData, setFormData] = useState({
    styleNumber: "",
    size: "",
  });

  const scannerRunning = useRef(false);
  const html5QrCodeRef = useRef(null);
  const qrRegionId = "qr-reader";
  const BASE_URL = "https://return-inventory-backend.onrender.com";
  const API = "https://fastapi.qurvii.com";
  const PressTable_POST_API = `${BASE_URL}/api/v1/press-table/add-record`;
  const ReturnTable_POST_API = `${BASE_URL}/api/v1/return-table/add-record`;
  const Ship_POST_API = `${BASE_URL}/api/v1/ship-record/ship`;

  // *************************************************************************************
  // ***************************** FETCH PRODCUT IMAGE ***********************************
  // *************************************************************************************

  const handleFetchProduct = async (e) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${
          formData.styleNumber || apiResponse?.style_number
        }`
      );
      const data = await response.json();
      setProduct(data[0]);
    } catch (error) {
      console.log("Failed to fetch prodcut details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.styleNumber.toString().length === 5 || apiResponse) {
      handleFetchProduct();
    }
  }, [formData.styleNumber, apiResponse]);

  //   *************************************************************************************
  //  ***************************** DEPARTMENT SETTING ***********************************
  //  *************************************************************************************

  const departCategory = {
    Press: PressTable_POST_API,
    Return: ReturnTable_POST_API,
    Ship: Ship_POST_API,
  };

  const postScanData = async (orderId) => {
    if (!depart) {
      setRecordAddedResponse("❌ Please select a department first.");
      return;
    }
    try {
      const response = await axios.post(`${API}/scan`, {
        user_id: 1019,
        order_id: parseInt(orderId),
        user_location_id: 141,
      });
      const data = response.data.data;
      setApiResponse(data);
    } catch (error) {
      console.log("Failed to scan data");
    }
  };

 

  const scanQrRef = useRef(null);

  const handleQrScan = (e) => {
    e.preventDefault();
    setScannedData(scanQr);
    postScanData(scanQr);
  };

  //   *************************************************************************************
  //  ***************************** QC PASS HANDLE ***********************************
  //  *************************************************************************************

  const handleQCPass = async () => {
    try {
      const post_data_response = await axios.post(departCategory[depart], {
        styleNumber: apiResponse?.style_number,
        size: apiResponse?.size,
        channel: apiResponse?.channel,
        color: apiResponse?.color,
        location: "Return Table",
        employee_name: apiResponse.employee_name,
        order_id: scanQr,
      });
      setRecordAddedResponse(`Record added to ${depart} database.`);
      console.log(post_data_response);
      scanQrRef.current.focus();
      scanQrRef.current.value="";
      setApiResponse([])
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Record already exists
        setRecordAddedResponse("❌ Record already exists in database.");
      } else {
        setRecordAddedResponse("❌ Failed to add record. Try again.");
      }
      scanQrRef.current.focus();
      scanQrRef.current.value="";
      setApiResponse([])
    }
    setTimeout(() => {
      setRecordAddedResponse("");
    }, 3000);
  };

  


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // auotmatic open size dropdown when style number length is equal to 5
  const styleNumberRef = useRef(null);
  const sizeRef = useRef(null);
  useEffect(() => {
    if (formData.styleNumber.length === 5) {
      setIsMenuOpen(true);
      sizeRef.current?.focus();
    }
  }, [formData.styleNumber]);

  // add sync order data to return table

  const syncAndAddToReturnTable = async (data) => {
    const response = await axios.post(departCategory[depart], {
      styleNumber: data.style_number,
      size: data.size,
      channel: data.channel,
      color: data.color || product?.color,
      location: `${depart} Table`,
      employee_name: data.employee_name || "Checker",
      order_id: data.order_id,
    });
    console.log(response.data);
  };

  // add order to press table
  const handleMoveToPress = async (e) => {
    try {
      e.preventDefault();
      const getRecordFromReturnTable = await axios.get(
        `${BASE_URL}/api/v1/return-table/get-records`
      );
      const data = getRecordFromReturnTable.data.data;
      const findAndAddToPressOrShip = data.find(
        (order) => order.order_id === Number(orderId)
      );
      const response = await axios.post(
        PressTable_POST_API,
        findAndAddToPressOrShip
      );
      console.log(response);
      setRecordAddedResponse("Order id moved to Press Table");
      setOrderId("");
    } catch (error) {
      console.log(`Failed to Add ${depart} Table `, error);
      setRecordAddedResponse("❌ Failed to move press table");
    }
  };

  // add order to press table
  const handleMoveToShip = async (e) => {
    try {
      e.preventDefault();
      const getRecordFromPressTable = await axios.get(
        `${BASE_URL}/api/v1/press-table/get-records`
      );
      const data = getRecordFromPressTable.data.data;
      const findAndAddToPressOrShip = data.find(
        (order) => order.order_id === Number(orderId)
      );
      const response = await axios.post(Ship_POST_API, findAndAddToPressOrShip);
      console.log(response);
      setRecordAddedResponse("");
      setOrderId("");
    } catch (error) {
      console.log(`Failed to Add ${depart} Table `, error);
      setRecordAddedResponse("❌ Failed to move ship");
    }
  };

  // add record to orders
  const handleSubmit = async (e) => {
    const validorders = {
      channel: depart,
      style_number: Number(formData.styleNumber),
      size: formData.size,
      color: product?.color || "",
      status: "return table",
      found_in_inventory: false,
    };
    try {
      e.preventDefault();
      const response = await axios.post(`${API}/sync-orders`, [validorders]);
      const data = response.data.all_orders[0];
      setSyncOrder(data);
      syncAndAddToReturnTable(data);
      setRecordAddedResponse("1 Record synced");
      setFormData({ styleNumber: "", size: "" });
      styleNumberRef.current.focus();
    } catch (error) {
      console.log("Failed to sync order ", error);
      setRecordAddedResponse("❌ Failed to sync");
    }
    setTimeout(() => {
      setRecordAddedResponse("");
    }, 2000);
  };

  return (
    <>
      <div className="absolute right-4 sm:top-20 top-4 ">
        <p
          className={` ${
            recordAddedResponse.startsWith("❌")
              ? "bg-red-200 text-red-800"
              : "bg-green-400"
          } py-2 px-4  text-gray-700 ${
            recordAddedResponse === "" ? "hidden" : "block"
          } `}
        >
          {recordAddedResponse !== "" ? recordAddedResponse : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4  container   rounded sm:shadow sm:mt-10 mx-auto p-4">
        <div className="left">
          <h1 className="text-2xl font-bold mb-4">Add return inventory</h1>

          <div className="mb-4">
            <select
              onChange={(e) => setDepart(e.target.value)}
              // onChange={(e)=>console.log(e.target.value)}
              className="border border-gray-100 bg-gray-50  py-2 px-4 rounded-md cursor-pointer outline-gray-100 w-full"
            >
              <option value="">Select Department</option>
              <option value="Return">Return</option>
              <option value="Press">Press</option>
              <option value="Ship">Ship</option>
            </select>
          </div>
          <div className={`${depart === "" ? "hidden" : "block"} p-2 mb-2 `}>
            {depart === "Return" ? (
              <form
                className="flex gap-4 items-center "
                onSubmit={handleSubmit}
              >
                <input
                  ref={styleNumberRef}
                  value={formData.styleNumber}
                  required
                  onChange={handleChange}
                  className="py-2 px-4 border-gray-100 border  bg-gray-50 rounded outline-gray-200"
                  name="styleNumber"
                  type="number"
                  placeholder="Enter style number..."
                />

                <Select
                  ref={sizeRef}
                  name="size"
                  required
                  className="w-full"
                  options={[
                    { label: "XXS", value: "XXS" },
                    { label: "XS", value: "XS" },
                    { label: "S", value: "S" },
                    { label: "M", value: "M" },
                    { label: "L", value: "L" },
                    { label: "XL", value: "XL" },
                    { label: "2XL", value: "2XL" },
                    { label: "3XL", value: "3XL" },
                    { label: "4XL", value: "4XL" },
                    { label: "5XL", value: "5XL" },
                  ]}
                  // menuIsOpen={isMenuOpen}
                  onMenuClose={() => setIsMenuOpen(false)}
                  value={
                    formData.size
                      ? { label: formData.size, value: formData.size }
                      : null
                  }
                  onChange={(selectedOption) => {
                    setFormData((prev) => ({
                      ...prev,
                      size: selectedOption.value,
                    }));
                  }}
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      maxHeight: "none",
                    }),
                    menuList: (provided) => ({
                      ...provided,
                      maxHeight: "none",
                    }),
                  }}
                />
                <input
                  type="submit"
                  value="QC PASS"
                  className="bg-[#222] text-white w-full py-2 px-4  rounded-lg  outline-none hover:bg-[#333] cursor-pointer"
                />
              </form>
            ) : (
              <form
                onSubmit={
                  depart === "Press" ? handleMoveToPress : handleMoveToShip
                }
                className="flex flex-col gap-2"
              >
                <input
                  type="number"
                  className="border border-gray-200 py-2 px-4 rounded outline-blue-500 "
                  onChange={(e) => setOrderId(e.target.value)}
                  value={orderId}
                  placeholder="Scan order id..."
                />
                <input
                  type="submit"
                  value={`Add To ${depart}`}
                  className="bg-[#222] text-white w-full py-2 px-4  rounded  outline-none hover:bg-[#333] cursor-pointer"
                />
              </form>
            )}
          </div>

          <div
            className={`${
              depart==="Return" ? "block" : "hidden"
            } flex flex-col mt-20 gap-2 `}
          >
            <p className=" font-medium ">Scan QR Code</p>
            <form onSubmit={handleQrScan}>
              <input
                ref={scanQrRef}
                onChange={(e) => setScanQr(e.target.value)}
                type="number"
                placeholder="Scan order id..."
                className=" py-2 w-full px-4 rounded-lg  border-2 border-red-200 mb-2 outline-red-500 "
              />
            </form>
          </div>



          {scannedData && apiResponse?.order_id && (
            <div className="bg-white rounded-lg overflow-hidden border border-gray-100 w-full mx-auto mb-6">
              <div className="bg-gray-50 px-4 py-1 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-green-400 flex items-center">
                  <svg
                    className="w-5 h-5 text-green-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Scan Successful
                </h2>
              </div>

              <div className="p-5">
               

                {apiResponse?.order_id ? (
                  <div className=" text-black p-2 rounded-md border border-gray-200 overflow-x-auto">
                    <h3 className="text-sm font-extrabold mb-3">
                      Product Details
                    </h3>
                    <table className="min-w-full text-sm border border-gray-200 rounded-md">
                      <thead>
                        <tr>
                          
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Style No.
                          </th>
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Size
                          </th>
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Color
                          </th>
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Channel
                          </th>
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Location
                          </th>
                          <th className="px-4 py-2 border border-gray-100 text-left font-medium ">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          
                          <td className="px-4 py-2 border border-gray-100  font-medium">
                            {apiResponse.style_number || "-"}
                          </td>
                          <td className="px-4 py-2 border border-gray-100  font-medium">
                            {apiResponse.size || "-"}
                          </td>
                          <td className="px-4 py-2 border border-gray-100  font-medium">
                            {apiResponse.color || "-"}
                          </td>
                          <td className="px-4 py-2 border border-gray-100  font-medium">
                            {apiResponse.channel || "-"}
                          </td>
                          <td className="px-4 py-2 border border-gray-100  font-medium">
                            {depart === "Return"
                              ? "Return Table"
                              : depart === "Press"
                              ? "Press Table"
                              : "Shipped"}
                          </td>
                          <td className="px-4 py-2 border border-gray-50  font-medium">
                            <button
                              onClick={handleQCPass}
                              className="bg-[#222] hover:bg-[#333] duration-75 ease-in cursor-pointer py-2 px-4 truncate font-medium rounded-md shadow text-white"
                            >
                              QC PASS
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : ""}
              </div>
            </div>
          )}
         
        </div>

        <div
          className={`right mt-10  px-6 rounded-2xl shadow-xs ${
            product?.style_id && !loading ? "block" : "hidden"
          }`}
        >
          <div className="overflow-hidden">
            <iframe
              style={{ display: !loading ? "block" : "none" }}
              className="w-full h-[100vh] -mt-48"
              src={`https://www.myntra.com/coats/qurvii/title/${product?.style_id}/buy`}
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
};

export default QrScanner;
