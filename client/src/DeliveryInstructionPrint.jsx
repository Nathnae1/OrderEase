import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import './DeliveryInstructionPrintStyle.css'; // Add custom styles for printing

function DeliveryInstructionPrint() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const year = queryParams.get('year');
  

  const { diId } = useParams();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [hasPrinted, setHasPrinted] = useState(false); // Add a flag to track printing

  // Clear the flag after the user enters the /print page:
  useEffect(() => {
    localStorage.removeItem('DeliveryInstructionPrint'); // Clear the programmatic access flag
  }, []);

  useEffect(() => {
    const fetchDeliveryInstruction = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get_delivery_instruction/${diId}?year=${year}`);
        setData(response.data);
        console.log('This from print ', response.data);
      } catch (error) {
        console.error('Error fetching quotation:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveryInstruction();
  }, [diId]);


  // Trigger print dialog 
  useEffect(() => {
    console.log(isLoading, data.length,hasPrinted);
    if (!isLoading && data.length > 0 && !hasPrinted) {
      window.print();
      setHasPrinted(true); // Ensure print is triggered only once
    }
  }, [isLoading, data, hasPrinted]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {data.length > 0 && <div className="print-container">
        <div>
          <h3>Delivery Instruction</h3>
        </div>
        <div className="top-right-info">
          <p>Ref No: {data[0].soRefNum}</p>
          <p>Date: {data[0].soDate.split('T')[0]}</p>
          <p>Name: {data[0].Name}</p>
        </div>
        <div className="bill-to">
          <h2>Bill To: {data[0].BillTo}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Size</th>
              <th>Description</th>
              <th>Item Code</th>
              <th>Colour</th>
              <th>Volt</th>
              <th>Unit</th>
              <th>Ordered Qty</th>
              <th>Packing</th>
              <th>Actual Length</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.Size}</td>
                <td>{item.itemDescription}</td>
                <td>{item.itemCode}</td>
                <td>{item.Colour}</td>
                <td>{item.Volt}</td>
                <td>{item.Unit}</td>
                <td>{item.orderedQty}</td>
                <td>{item.Packing}</td>
                <td>{item.deliveredQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bottom-section">
          <div className="tolerance-note">
            
            <p>Delivered items are subject to +/-5% manufacturing tolerance</p>
            
          </div>

          <div className="remark">
            <p>Remark:</p>
            <p>Signature:______________</p>
          </div>
        </div>
      </div>}
    </div>
  );
}

export default DeliveryInstructionPrint;
