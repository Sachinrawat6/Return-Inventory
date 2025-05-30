import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRCodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const qrCodeRegionId = "qr-scanner";
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      console.log("📷 Available Cameras:", cameras);

      if (cameras && cameras.length > 0) {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);

        await html5QrCodeRef.current.start(
          { facingMode: { exact: "environment" } }, // try back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("✅ QR Scanned:", decodedText);
            setScanResult(decodedText);
            setIsScanning(false);
            stopScanner();
          },
          (scanError) => {
            // Optional: console.log("Scan error:", scanError);
          }
        );
      } else {
        setCameraError("No camera devices found.");
      }
    } catch (err) {
      console.error("❌ Camera start error:", err);
      setCameraError(err.message || "Failed to start camera.");
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop()
        .then(() => html5QrCodeRef.current.clear())
        .catch((err) => {
          console.warn("⚠️ Scanner already stopped:", err.message);
        });
    }
  };

  useEffect(() => {
    if (isScanning) {
      setCameraError(null);
      startScanner();
    }
    return () => stopScanner();
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {cameraError && (
        <div className="bg-red-100 text-red-700 border border-red-300 p-3 mb-4 rounded w-full max-w-sm">
          <strong>Error:</strong> {cameraError}
        </div>
      )}

      {isScanning ? (
        <div id={qrCodeRegionId} className="w-full max-w-sm aspect-square border rounded shadow-md" />
      ) : scanResult ? (
        <div className="bg-white p-4 rounded shadow-md w-full max-w-sm text-center">
          <p className="text-gray-700 text-lg break-words">
            <strong>Scanned:</strong> <br />
            {scanResult}
          </p>
        </div>
      ) : null}

      <button
        onClick={() => {
          setScanResult(null);
          setIsScanning(true);
        }}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Rescan
      </button>
    </div>
  );
};

export default QRCodeScanner;
