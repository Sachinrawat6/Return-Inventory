import axios from "axios";
import React, { useState } from "react";

const ShipProduct = () => {
  const [location, setLocation] = useState("");
  const [formData, setFormData] = useState({
    styleNumber: "",
    size: "",
  });
  const [orderID, setOrderID] = useState("");
  const [response, setResponse] = useState("");
  const BASE_URL = "https://return-inventory-backend.onrender.com";

  const shippedTo = {
    Return: `${BASE_URL}/api/v1/return-table/delete-record`,
    Press: `${BASE_URL}/api/v1/ship-record/ship`,
    Inventory: `${BASE_URL}/api/v1/inventory-table/inventory/ship`,
  };

  const handleShip = async (e) => {
    e.preventDefault();
    try {
      if (!orderID && (!formData.styleNumber || !formData.size)) {
        setResponse("Order ID or both style number and size are required.");
        return;
      }

      const payload = orderID
        ? { order_id: orderID }
        : location ==="Press" ? { style_number: Number(formData.styleNumber) , Size: formData.size} :  {styleNumber: Number(formData.styleNumber) , size: formData.size};

      await axios.post(shippedTo[location], payload);

      setResponse(`Product Shipped From ${location} Table`);
    } catch (error) {
      setResponse(error?.message ?"Product already shipped" : "Failed to shipped.");
      console.log(error);
    }
    setTimeout(() => {
      setResponse("");
    }, 3000);
  };

  return (
    <div className="container mx-auto mt-4 relative">
      <div className={` ${response ? "block" : "hidden"} w-md `}>
        <p className={` ${response.startsWith("Product Shipped") ? "bg-green-400 text-green-900":"bg-red-300 text-red-800"}  py-2 px-4 absolute left-0 rounded font-medium`}>
          {response}
        </p>
      </div>
      <h2 className="font-medium text-gray-700 text-[15px]">
        Ship Product By (Style Number and Size) | By Scanning Order Id
      </h2>
      <select
        onChange={(e) => setLocation(e.target.value)}
        className="border border-gray-200 bg-gray-50 py-2 px-4 rounded-lg mt-4 w-xl outline-gray-300"
      >
        <option value="">Select Location </option>
        <option value="Return">Return Table </option>
        <option value="Press">Press Table </option>
        <option value="Inventory">Inventory Cart</option>
      </select>

      <div className={`${location ? "block" : "hidden"}`}>
        <form className="flex gap-2 mt-6 w-xl" onSubmit={handleShip}>
          <input
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                styleNumber: e.target.value,
              }))
            }
            className="py-2 px-4 w-full bg-gray-50 rounded-lg outline-gray-300 border border-gray-300"
            type="number"
            placeholder="Enter style number"
          />

          <select
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                size: e.target.value,
              }))
            }
            className="py-2 px-4 w-full bg-gray-50 rounded-lg outline-gray-300 border border-gray-300"
          >
            <option value="">Select Size </option>
            <option value="XXS">XXS </option>
            <option value="XS">XS </option>
            <option value="S">S </option>
            <option value="M">M </option>
            <option value="L">L </option>
            <option value="XL">XL </option>
            <option value="2XL">2XL </option>
            <option value="3XL">3XL </option>
            <option value="4XL">4XL </option>
            <option value="5XL">5XL</option>
          </select>
          <input
            className="py-2 px-4 bg-[#222] text-white font-medium cursor-pointer duration-75 ease-in hover:bg-[#333] rounded-lg  outline-gray-300 border border-gray-300"
            type="submit"
            value={`Ship From ${location}`}
          />
        </form>
        <div 
        className={`${location==="Inventory"?"hidden":"block"} w-xl`}
        >
          <p className="text-center font-medium text-lg mt-3">OR</p>
        </div>
        <form onSubmit={handleShip}
          className={`${location==="Inventory"?"hidden":"block"}`}
        >
          <input
            onChange={(e) => setOrderID(e.target.value)}
            className="py-2 w-xl px-4 mt-3  bg-gray-50 rounded-lg outline-gray-300 border border-gray-300"
            type="number"
            placeholder="Scan order id..."
          />
        </form>
      </div>
    </div>
  );
};

export default ShipProduct;
