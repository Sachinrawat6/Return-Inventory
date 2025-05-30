import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

const QrScanner = () => {
  const [scannedData, setScannedData] = useState("");
  const [apiResponse, setApiResponse] = useState([]);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [mode, setMode] = useState("camera");
  const [showScanner, setShowScanner] = useState(true);
  const [depart, setDepart] = useState("");
  const [recordAddedResponse, setRecordAddedResponse] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const scannerRunning = useRef(false);
  const html5QrCodeRef = useRef(null);
  const qrRegionId = "qr-reader";
  const fileInputRef = useRef(null);

  const API = "https://fastapi.qurvii.com/scan";
  const PressTable_POST_API = "/api/v1/press-table/add-record";
  const ReturnTable_POST_API = "/api/v1/return-table/add-record";
  const Ship_POST_API = "/api/v1/ship-record/ship";

  // Check if device is mobile
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  const postScanData = async (orderId) => {
    if (!depart) {
      setRecordAddedResponse("❌ Please select a department first.");
      return;
    }
    try {
      const response = await axios.post(API, {
        user_id: 6,
        order_id: parseInt(orderId),
        user_location_id: 139,
      });
      const data = response.data.data;
      setApiResponse(data);

      // setting departments
      const departCategory = {
        Press: PressTable_POST_API,
        Return: ReturnTable_POST_API,
        Ship: Ship_POST_API,
      };
      const post_data_response = await axios.post(departCategory[depart], {
        styleNumber: data.style_number,
        size: data.size,
        channel: data.channel,
        color: data.color,
        location: "Return Table",
        employee_name: data.employee_name,
        order_id: orderId,
      });
      console.log(post_data_response);
      setRecordAddedResponse(`Record added to ${depart} database.`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setRecordAddedResponse("❌ Record already exists in database.");
      } else {
        setRecordAddedResponse("❌ Failed to add record. Try again.");
        console.error("Post error:", error);
      }
    }
    setTimeout(() => {
      setRecordAddedResponse("");
    }, 3000);
  };

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices.length === 0) {
          setError("No camera devices found.");
        } else {
          const backCam = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment")
          );
          const chosenCam = backCam || devices[0];
          setCameras([chosenCam]);
          setSelectedCameraId(chosenCam.id);
        }
      })
      .catch((err) => {
        setError("Camera access error: " + err.message);
      });

    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (mode === "camera" && selectedCameraId && depart) {
      startScanner(selectedCameraId);
    }
    return () => stopScanner();
  }, [selectedCameraId, mode, depart]);

  const startScanner = (cameraId) => {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const qrElement = document.getElementById(qrRegionId);
    if (qrElement) qrElement.innerHTML = "";

    html5QrCodeRef.current = new Html5Qrcode(qrRegionId);

    html5QrCodeRef.current
      .start(
        cameraId,
        config,
        async (decodedText) => {
          if (!depart) {
            setError("Please select a department before scanning.");
            stopScanner();
            return;
          }

          setScannedData(decodedText);
          setShowScanner(false);
          await postScanData(decodedText);
          stopScanner();
        },
        () => {}
      )
      .then(() => {
        scannerRunning.current = true;
      })
      .catch((err) => {
        setError("Failed to start scanner: " + err.message);
      });
  };

  const stopScanner = () => {
    if (scannerRunning.current && html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          scannerRunning.current = false;
          html5QrCodeRef.current.clear();
        })
        .catch((err) => {
          console.warn("Stop error:", err.message);
        });
    }
  };

  const handleScanAgain = () => {
    setScannedData("");
    setApiResponse([]);
    setError("");
    setShowScanner(true);
    if (mode === "camera") {
      setTimeout(() => {
        startScanner(selectedCameraId);
      }, 300);
    }
  };

  const handleImageUpload = async (e) => {
    setScannedData("");
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    // Reset input to allow same file re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsScanning(true);

    try {
      // Create a new scanner instance
      const qrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = qrCode;

      // Mobile-specific handling
      if (isMobile) {
        // Step 1: Read the file as Data URL
        const imageDataUrl = await new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.onload = (event) => resolve(event.target.result);
          fileReader.onerror = (error) => reject(error);
          fileReader.readAsDataURL(file);
        });

        // Step 2: Create an image element to check dimensions
        const img = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (error) => reject(error);
          img.src = imageDataUrl;
        });

        // Step 3: Check if image needs resizing (mobile often has large images)
        const MAX_DIMENSION = 1000; // pixels
        let finalDataUrl = imageDataUrl;
        
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let newWidth, newHeight;
          if (img.width > img.height) {
            newWidth = MAX_DIMENSION;
            newHeight = (img.height / img.width) * MAX_DIMENSION;
          } else {
            newHeight = MAX_DIMENSION;
            newWidth = (img.width / img.height) * MAX_DIMENSION;
          }
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Get the resized image as data URL
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }

        // Step 4: Scan the (possibly resized) image
        const result = await qrCode.scanFile(finalDataUrl, false);
        setScannedData(result);
        await postScanData(result);
      } else {
        // Desktop - simpler approach
        const result = await qrCode.scanFile(file, false);
        setScannedData(result);
        await postScanData(result);
      }
    } catch (err) {
      setError(`Failed to scan image: ${err.message}`);
      console.error("Scan error:", err);
    } finally {
      setIsScanning(false);
      // Clean up
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (cleanupErr) {
          console.warn("Cleanup error:", cleanupErr);
        }
      }
    }
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
      <div className="flex flex-col items-center sm:w-100 w-[90vw]  justify-center sm:min-h-[50vh] min-h-[80vh]  rounded sm:shadow sm:mt-10 mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

        <div className="mb-4">
          <select
            onChange={(e) => setDepart(e.target.value)}
            className="border border-gray-200 py-2 px-4 rounded-md cursor-pointer outline-blue-100"
          >
            <option value="">Select Department</option>
            <option value="Return">Return</option>
            <option value="Press">Press</option>
            <option value="Ship">Ship</option>
          </select>
        </div>

        <div className={`${depart === "" ? "hidden" : "block"} mb-4`}>
          <button
            className={`px-4 py-2 mr-2 rounded ${
              mode === "camera" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => {
              stopScanner();
              setMode("camera");
              setScannedData("");
              setShowScanner(true);
            }}
          >
            Camera
          </button>
          <button
            className={`px-4 py-2 rounded ${
              mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => {
              stopScanner();
              setMode("upload");
              setScannedData("");
            }}
          >
            Upload
          </button>
        </div>

        {error && (
          <div
            className={`bg-red-100 text-red-700 p-3 rounded w-full max-w-md text-center mb-4 ${
              depart === "" ? "hidden" : "block"
            }`}
          >
            {error}
          </div>
        )}

        {mode === "camera" && !scannedData && showScanner && (
          <div
            id={qrRegionId}
            className={`${
              depart === "" ? "hidden" : "block"
            } w-64 h-64 rounded border border-gray-200 mb-4`}
          ></div>
        )}

        {mode === "upload" && !scannedData && (
          <div className="w-full max-w-xs mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isScanning}
              className="p-2 border rounded border-gray-200 w-full bg-white"
            />
            {isScanning && (
              <div className="mt-2 text-center text-blue-600">Scanning image...</div>
            )}
            <div id={qrRegionId} className="hidden" />
          </div>
        )}

        {scannedData && (
          <div className="bg-white rounded-lg overflow-hidden border border-gray-100 w-full max-w-md mx-auto mb-6">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
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
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Order ID
                </h3>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="break-all font-mono text-blue-600">
                    {scannedData}
                  </p>
                </div>
              </div>

              {apiResponse ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-extrabold text-blue-700 mb-3">
                      Product Details
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex gap-2">
                        <dt className="text-sm text-gray-500">
                          Style Number |
                        </dt>
                        <dd className="text-sm font-medium">
                          {apiResponse.style_number || "-"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-sm text-gray-500">Size |</dt>
                        <dd className="text-sm font-medium">
                          {apiResponse.size || "-"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-sm text-gray-500">Color |</dt>
                        <dd className="text-sm font-medium">
                          {apiResponse.color || "-"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-sm text-gray-500">Channel |</dt>
                        <dd className="text-sm font-medium">
                          {apiResponse.channel || "-"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-sm text-gray-500">Location |</dt>
                        <dd className="text-sm font-medium">
                          {depart === "Return"
                            ? "Return Table"
                            : depart === "Press"
                            ? "Press Table"
                            : "Shipped"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <p className="text-center animate-pulse">Loading data....</p>
              )}
            </div>
          </div>
        )}

        {scannedData && (
          <button
            onClick={handleScanAgain}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Scan Again
          </button>
        )}
      </div>
    </>
  );
};

export default QrScanner;