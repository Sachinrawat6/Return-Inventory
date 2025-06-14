import React, { useState } from "react";

const IframeWithProduuctImage = () => {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState([]);
  const [nocodbData, setNocoDBDate] = useState([]);

  const API = "https://fastapi.qurvii.com";

    const fetchDataFromNocoDB = async (orderId) => {
    try {
      const response = await axios.post(`${API}/scan`, {
        user_id: 78,
        order_id: parseInt(orderId),
        user_location_id: 141,
      });
      const data = response.data.data;
      setApiResponse(data);
      handleFetchProduct();
    } catch (error) {
      console.log("Failed to scan data");
    }
  };

  const handleFetchProduct = async (formStyleNumber,nocoDbStyleNumber) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://inventorybackend-m1z8.onrender.com/api/product?style_code=${
          formStyleNumber || nocoDbStyleNumber
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



  return <div>
    <iframe src={`https://www.myntra.com/dresses/qurvii/qurvii-flared-sleeves-sequinned-georgette-a-line-midi-dress/${product?.style_id}/buy`} ></iframe>
  </div>;
};

export default IframeWithProduuctImage;
