import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import './QuotationPrintStyle.css'; // Add custom styles for printing

function QuotationPrint() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const year = queryParams.get('year');
  const month = queryParams.get('month');

  const { id } = useParams();
  const [data, setData] = useState([]);
  const [salesContact, setSalesContact] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasPrinted, setHasPrinted] = useState(false); // Add a flag to track printing

  // Clear the flag after the user enters the /print page:
  useEffect(() => {
    localStorage.removeItem('QuotationPrint'); // Clear the programmatic access flag
  }, []);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get_quotation/${id}?year=${year}&month=${month}`);
        setData(response.data);
        console.log('This from print ', response.data);
      } catch (error) {
        console.error('Error fetching quotation:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  // Fetch contact address
  useEffect(() => {
    const fetchSalesPersonContact = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/sales/person/contact`);
        setSalesContact(response.data);
      } catch (error) {
        console.error('Error fetching quotation:', error.message);
      } 
    };
    fetchSalesPersonContact();
  }, []);

  useEffect(() => {
    const calculateTotal = () => {
      const totalBeforeVAT = data.reduce((acc, row) => acc + (parseFloat(row.BeforeVAT) || 0), 0);
      setTotal(totalBeforeVAT);
    };

    if (data.length > 0) {
      calculateTotal();
    }
  }, [data]);

  // Trigger print dialog only after total is calculated
  useEffect(() => {
    if (!isLoading && data.length > 0 && total > 0 && !hasPrinted) {
      window.print();
      setHasPrinted(true); // Ensure print is triggered only once
    }
  }, [isLoading, data, total, hasPrinted]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {data.length > 0 && <div className="print-container">
        <div className='top-section'>
          <div className='quotation-style'>
            <p className='qo-word'>Quotation</p>
            <p className='company-name'>Z Corp LTD</p>
          </div>
          <div className="top-right-info">
            <p>Ref No: qu/{data[0].refNum}/{new Date(data[0].Date).getFullYear()}</p>
            <p>Date: {data[0].Date.split('T')[0]}</p>
          </div>
        </div>
        <div className="bill-to">
          <p>Bill To: {data[0].BillTo}</p>
        </div>

        <table className='data-table'>
          <thead>
            <tr>
              <th>No</th>
              <th>Size</th>
              <th>Description</th>
              <th>QTY</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.Size}</td>
                <td>{item.Description}</td>
                <td>{item.QTY}</td>
                <td>{item.UnitPrice}</td>
                <td>{item.BeforeVAT}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bottom-section">
          <div className="tolerance-note">
            <p>The supplier keeps his right to change the price in case of non-collection within 1 week from the readiness notification</p>
            <p>Delivered items are subject to +/-5% manufacturing tolerance</p>
            <p>NOTE: The price is valid for the package</p>
          </div>

          <div className="total-prices">
            <p>Total Before VAT: {total}</p>
            <p>VAT: {(total * 0.15).toFixed(2)}</p>
            <p>Total including VAT: {(total * 1.15).toFixed(2)}</p>
          </div>
        </div>
        <div className='contact-address'>
          <p className='heading'>Contact Person</p>
          <p>Name: {data[0].Name}</p>
          {salesContact.length > 0 &&
           <div>
              <p>Mobile: {salesContact[0].phone_number}</p>
              <p>Email: {salesContact[0].email}</p>
           </div>
          }
        </div>
      </div>}
    </div>
  );
}

export default QuotationPrint;
