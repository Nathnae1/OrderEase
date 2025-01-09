import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from './api';
import { useNavigate } from 'react-router-dom';

function SalesOrderCreate() {
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

  const [soRefNumber, setSoRefNumber] = useState(null);
  const [soIsSubmitted, setSoIsSubmitted] = useState(false); 

  // Define the navigate function
  const navigate = useNavigate();

  // Clear the flag after the user enters the /create_so page:
  useEffect(() => {
    localStorage.removeItem('fromQuotation'); // Clear the programmatic access flag
  }, []);

  useEffect(() => {
    if (dateQo) {
      // Parse the date string to a Date object
      const date = new Date(dateQo);

      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        // Extract the year and month
        const extractedYear = date.getFullYear();
        // Add leading zero if month is less than 10 
        // getMonth() is zero-based, so we add 1
        const extractedMonth = (date.getMonth() + 1).toString().padStart(2, '0'); 
        
        setYear(extractedYear);
        setMonth(extractedMonth);
      } else {
        console.error("Invalid date format:", dateQo);
      }
    }
  }, [dateQo]);

  useEffect(() => {
    const fetchQuotationData = async () => {
      console.log('Getting data', qoToSoRef, year, month);
      if (!qoToSoRef || !year || !month) {
        return;
      }
  
      setIsLoading(true);
  
      try {
        let url = `${import.meta.env.VITE_API_BASE_URL}/get_quotation_for_so/${qoToSoRef}?year=${year}&month=${month}`;
        if (selectedRows) {
          url += `&filterIds=${selectedRows}`;
        }
  
        const response = await api.get(url);
  
        if (response.data.message === 'Record exists' && response.data.soNum) {
          // Display the record exists message with the SO number
          navigate(`/fetch_so`);
          window.alert(`Record exists with SO number: ${response.data.soNum}`);
        } else {
          // Set the fetched quotation data
          setQuotationData(response.data);
          console.log(response.data);
          console.log(quotationData);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchQuotationData();
  }, [qoToSoRef, year, month, selectedRows]);
  

  // hook to calculate the total
  useEffect(() => {
    const calculateTotal = () => {
      const totalBeforeVAT = quotationData.reduce((acc, row) => acc + (parseFloat(row.BeforeVAT) || 0), 0);
      setTotal(totalBeforeVAT);
    };

    calculateTotal();
  }, [quotationData]);


  // Function to format the date DD-MM-YYYY
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  // Remove Item before sending to DB
  const handleDelete = async (id, rowIndex) => {
    const updatedItems = [...quotationData];
    updatedItems.splice(rowIndex, 1); // Splice removes 1 element at the given index

    setQuotationData(updatedItems); // Update the state with the new array

  };

  // Handle so edit item save before sendig to DB
  const handleChange = (e, index, field) => {
    const { value } = e.target;
    const updatedData = [...quotationData];
    updatedData[index] = { ...updatedData[index], [field]: value };

    // Calculate BeforeVAT if UnitPrice or QTY changes
    if (field === 'UnitPrice' || field === 'QTY') {
      const unitPrice = parseFloat(updatedData[index].UnitPrice) || 0;
      const qty = parseFloat(updatedData[index].QTY) || 0;
      updatedData[index].BeforeVAT = unitPrice * qty;
    }

    setQuotationData(updatedData);
  };

  // function to save fetched data of SO to DB
  const handleSave = (id, rowIndex) => {
    setEditingIndex(null);
  }

  

  // Function to handle SO Data submission
  const handleSoSubmitToDB = async (e) => {

    try {
      // Check the data before sending to server
      const dataToSend = quotationData;
      // Use Axios to send a POST request
      const response = await api.post('/send_so_to_db', dataToSend);

      if (response.status === 201) {
        setSoRefNumber(response.data.soId)
        setSoIsSubmitted(true);
      
      } else {
        console.error('Error submitting data to the database');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePrint = () => {
    console.log('Print option clicked');
  }

  const handleEdit = () => {
    console.log('Eding Option pressed');
  }

  if (quotationData.length === 0) {
    return <div>No data available...</div>; // Display loading or no data message
  }

  return (
    <div>
      {!soIsSubmitted && <div className='so-on-creation'>
        <div>
          <h1>Sales Order to be Created</h1>
          <p>Qouotation Reference Number: {qoToSoRef}</p>
          <p>Selected Date: {dateQo}</p>
          
          {isLoading && <p>Loading...</p>}
          {error && <p>Error fetching data: {error}</p>}
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
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Packing</th>
                    <th>Unit Price</th>
                    <th>Total</th>
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
                        
                        <td className="unit">
                          {editingIndex === index ? (
                            <input
                              type="text"
                              value={quotation.unit}
                              onChange={(e) => handleChange(e, index, 'unit')}
                            />
                          ) : (
                            quotation.unit
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

        <div>
            Click to Send to DB
            <button className="submit-button" onClick={(e) => handleSoSubmitToDB(e)}>
              Send Data
            </button>
        </div>  
      </div>}

      {soIsSubmitted && <div className='so-after-creation'>
        <h1>Item Created Successfully!</h1>
        <p>Sales Order ID: {soRefNumber}</p>
        <button onClick={handlePrint}>Print</button>
        <button onClick={handleEdit}>Edit</button>
      </div>}
    </div>
  );
}

export default SalesOrderCreate;
