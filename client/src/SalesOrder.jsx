import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function SalesOrder() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const qoToSoRef = queryParams.get('qoToSo'); // Get the reference number from the query params
  const dateQo = queryParams.get('selectedDate'); // Get the reference number from the query params
  const selectedRows = queryParams.get('selectedRowsID'); // Get the reference number from the query params

  // State to hold extracted year and month
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [quotationData, setQuotationData] = useState([]); // State to hold the fetched data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to manage error state
  const [editingIndex, setEditingIndex] = useState(null); // Track which row is being edited

  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (dateQo) {
      // Parse the date string to a Date object
      const date = new Date(dateQo);

      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        // Extract the year and month
        const extractedYear = date.getFullYear();
        const extractedMonth = date.getMonth() + 1; // getMonth() is zero-based, so we add 1

        setYear(extractedYear);
        setMonth(extractedMonth);
      } else {
        console.error("Invalid date format:", dateQo);
      }
    }
  }, [dateQo]);

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!qoToSoRef || !year || !month) {
        return;
      }
  
      setIsLoading(true);
  
      try {
        let url = `http://localhost:5000/get_quotation_for_so/${qoToSoRef}?year=${year}&month=${month}`;
        if (selectedRows) {
          url += `&filterIds=${selectedRows}`;
        }
        const response = await axios.get(url);
        setQuotationData(response.data);
        console.log(response.data);
        console.log(quotationData);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchQuotationData();
  }, [qoToSoRef, year, month, selectedRows]);

  if (quotationData.length === 0) {
    return <div>Loading or no data available...</div>; // Display loading or no data message
  }

  // hook to calculate the total
  // useEffect(() => {
  //   const calculateTotal = () => {
  //     const totalBeforeVAT = quotationData.reduce((acc, row) => acc + (parseFloat(row.BeforeVAT) || 0), 0);
  //     setTotal(totalBeforeVAT);
  //   };

  //   calculateTotal();
  // }, [quotationData]);

  // Function to format the date DD-MM-YYYY
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };



  return (
    <div>
      <div>
        <h1>Sales Order to be Created</h1>
        <p>Qouotation Reference Number: {qoToSoRef}</p>
        <p>Selected Date: {dateQo}</p>

        {isLoading && <p>Loading...</p>}
        {error && <p>Error fetching data: {error}</p>}
        {quotationData && (
          <div>
            <h2>Quotation Data</h2>
            <pre>{JSON.stringify(quotationData, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="get-top-section">
            <p>Ref No: {quotationData[0].refNum}</p>
            <p>Date: {formatDate(new Date())}</p>
            <p>Name: {quotationData[0].Name}</p>
            <p>TIN: {quotationData[0].tin}</p>
     </div>

      <div className="table-container">
        <div className="quotation-table">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Size</th>
                  <th>Description</th>
                  <th>Item Code</th>
                  <th>Colour</th>
                  <th>Volt</th>
                  <th>Qty(meter)</th>
                  <th>Packing</th>
                  <th>Unit Price</th>
                  <th>Before VAT</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotationData.map((quotation, index) => (
                    <tr key={quotation.id}>
                      <td className="no">{index + 1}</td>
                      <td className="size">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.Size}
                            onChange={(e) => handleChange(e, index, 'Size')}
                          />
                        ) : (
                          quotation.Size
                        )}
                      </td>
                      
                      <td className="description">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.Description}
                            onChange={(e) => handleChange(e, index, 'Description')}
                          />
                        ) : (
                          quotation.Description
                        )}
                      </td>

                      <td className="itemCode">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.itemCode}
                            onChange={(e) => handleChange(e, index, 'itemCode')}
                          />
                        ) : (
                          quotation.itemCode
                        )}
                      </td>

                      <td className="colour">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.Colour}
                            onChange={(e) => handleChange(e, index, 'Colour')}
                          />
                        ) : (
                          quotation.Colour
                        )}
                      </td>

                      <td className="voltage">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.voltage}
                            onChange={(e) => handleChange(e, index, 'voltage')}
                          />
                        ) : (
                          quotation.voltage
                        )}
                      </td>

                      <td className="qty">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={quotation.QTY}
                            onChange={(e) => handleChange(e, index, 'QTY')}
                          />
                        ) : (
                          quotation.QTY
                        )}
                      </td>

                      <td className="packing">
                        {editingIndex === index ? (
                          <input
                            type="text"
                            value={quotation.Packing}
                            onChange={(e) => handleChange(e, index, 'Packing')}
                          />
                        ) : (
                          quotation.Packing
                        )}
                      </td>
                      <td className="unit-price">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={quotation.UnitPrice}
                            onChange={(e) => handleChange(e, index, 'UnitPrice')}
                          />
                        ) : (
                          quotation.UnitPrice
                        )}
                      </td>
                      <td className="before-vat">
                        {editingIndex === index ? (
                          <input
                            type="number"
                            value={quotation.BeforeVAT}
                            readOnly
                          />
                        ) : (
                          quotation.BeforeVAT
                        )}
                      </td>
                      <td className="actions">
                        {editingIndex === index ? (
                          <>
                            <button onClick={() => handleSave(quotation.id, index)}>Save</button>
                            <button onClick={() => setEditingIndex(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingIndex(index)}>Edit</button>
                            <button className="item-delete" onClick={() => handleDelete(quotation.id, index)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

        </div>
      </div>

      <div>
            <p>Total Before VAT: {total}</p>
            <p>VAT: {(total * 0.15).toFixed(2)}</p>
            <p>Total including VAT: {(total * 1.15).toFixed(2)}</p>
      </div>
          
    </div>
  );
}

export default SalesOrder;
