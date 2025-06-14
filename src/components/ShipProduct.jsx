import axios from "axios";
import React, { useState, useEffect } from "react";

const ShipProduct = () => {
  const [location, setLocation] = useState("");
  const [product, setProduct] = useState([]);
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


     const handleFetchProduct = async () => {
      try {
        const response = await fetch(
          `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${formData?.styleNumber}`);
        const data = await response.json();
        setProduct(data[0]);
        console.log(data)
      } catch (error) {
        console.log("Failed to fetch prodcut details.");
      
    };
     }
    useEffect(() => {
      if (formData.styleNumber.toString().length === 5 ) {
        handleFetchProduct();
      }
    }, [formData.styleNumber]);

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
      setFormData({styleNumber:"",size:""})
      setOrderID("");
    } catch (error) {
      setResponse(error?.message ?"Product already shipped" : "Failed to shipped.");
      console.log(error);
      setFormData({styleNumber:"",size:""})
      setOrderID("");
    }
    setTimeout(() => {
      setResponse("");
    }, 3000);
  };



  
 

  
  

  return (
    <div className="container mx-auto mt-4 relative">
      <div className="grid grid-cols-2 gap-4  rounded sm:shadow sm:mt-10 mx-auto p-4">
        <div className="left">
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
        className="border border-gray-200 bg-gray-50 py-2 px-4 rounded-lg w-full mt-4 xs:w-3xl outline-gray-300"
      >
        <option value="">Select Location </option>
        <option value="Return">Return Table </option>
        <option value="Press">Press Table </option>
        <option value="Inventory">Inventory Cart</option>
      </select>

      <div className={`${location ? "block" : "hidden"}`}>
        <form className="flex gap-2 mt-6 xs:w-3xl" onSubmit={handleShip}>
          <input
          name="styleNumber"
          value={formData.styleNumber}
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
          value={formData.size}
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
            className="py-2 xs:w-3xl px-4 mt-3 w-full bg-gray-50 rounded-lg outline-gray-300 border border-gray-300"
            type="number"
            placeholder="Scan order id..."
            value={orderID}
          />
        </form>
      </div>
        </div>


        
           <div
          className={`right mt-10 ${product?.style_id ? "block":"hidden"}  px-6 rounded-2xl shadow-xs `}
        >
          <div className="overflow-hidden ">
            <iframe
              // style={{ display: !loading ? "block" : "none" }}
              className="w-full h-[100vh] -mt-48"
              src={`https://www.myntra.com/dresses/qurvii/qurvii-flared-sleeves-sequinned-georgette-a-line-midi-dress/${product?.style_id}/buy`}
              frameborder="0"
            ></iframe>
          </div>
        </div>
        </div>
      
    
    </div>
  );
};

export default ShipProduct;
