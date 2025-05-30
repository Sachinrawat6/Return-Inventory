import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRCodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const qrCodeRegionId = "qr-scanner";
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length) {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScanResult(decodedText);
            setIsScanning(false);
            stopScanner();
          }
        );
      } else {
        throw new Error("No camera found");
      }
    } catch (err) {
      console.error("Camera start error:", err.message);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop()
        .then(() => html5QrCodeRef.current.clear())
        .catch(() => {
          console.warn("Scanner was not running.");
        });
    }
  };

  useEffect(() => {
    if (isScanning) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {isScanning ? (
        <div id={qrCodeRegionId} className="w-full max-w-sm rounded border-gray-200 overflow-hidden shadow border" />
      ) : (
        <div className="bg-white p-4 rounded shadow-md w-full max-w-sm text-center">
          <p className="text-gray-700 text-lg break-words">
            <strong>Scanned:</strong> <br />
            {scanResult}
          </p>
        </div>
      )}

      <button
        onClick={() => setIsScanning(true)}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Rescan
      </button>
    </div>
  );
};

export default QRCodeScanner;
