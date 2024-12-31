import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import api from './api';

function DeliveryInstructionCreate() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const soToDi = queryParams.get('soToDI'); // Get the reference number from the query params
  const year = queryParams.get('year');

  // State to manage error state
  const [error, setError] = useState(null); 

   // State to manage loading state
  const [isLoading, setIsLoading] = useState(true);
  // state to hold fetched so data for delivery
  const [soData, setSoData] = useState([]);
  // Get the selected rows ID if selected
  const selectedRows = queryParams.get('selectedRowsID');

  const [editingIndex, setEditingIndex] = useState(null); // Track which row is being edited

  const [diRefNumber, setSoRefNumber] = useState(null);
  const [diSubmitted, setDiSubmitted] = useState(false); 


  // Clear the flag after the user enters the /create_so page:
  useEffect(() => {
    localStorage.removeItem('fromSO'); // Clear the programmatic access flag
  }, []);

  // Fetch SO data for delivery

  useEffect(() => {
    const fetchSalesOrderData = async () => {
     
      if (!year || !soToDi) {
        return;
      }
  
      setIsLoading(true);
  
      try {
        let url = `${import.meta.env.VITE_API_BASE_URL}/get_so_for_di/${soToDi}?year=${year}`;
        if (selectedRows) {
          url += `&filterIds=${selectedRows}`;
        }
        const response = await axios.get(url);
        setSoData(response.data);
       
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchSalesOrderData();
  }, [year, soToDi]);

  // Handle so edit item save before sendig to DB
  const handleChange = (e, index, field) => {
    const { value } = e.target;
    const updatedData = [...soData];
    updatedData[index] = { ...updatedData[index], [field]: value };

    // Calculate BeforeVAT if UnitPrice or QTY changes
    

    setSoData(updatedData);
  };

  const handleSave = () => {
    console.log('save button');
  }
  const handleDelete = () => {
    console.log('Handle Delete');
  }


   // Function to handle SO Data submission
   const handleDIsubmitToDB = async (e) => {

    try {
      // Check the data before sending to server
      const dataToSend = soData;
      // Use Axios to send a POST request
      const response = await api.post('/send_di_to_db', dataToSend);

      if (response.status === 201) {
        setSoRefNumber(response.data.diId)
        setDiSubmitted(true);
      
      } else {
        console.error('Error submitting data to the database');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePrint = () => {
    console.log('Pring option clicked');
  }

  const handleEdit = () => {
    console.log('Eding Option pressed');
  }


  return (
    <div>
      {!diSubmitted && <div className='di-on-creation'>
        <div>
          <h1>This is Create Delivery Instruction for SO {soToDi} and year {year}</h1>
          
          {isLoading && <p>Loading...</p>}
          
          {error && <p>Error: {error}</p>}
          
          {/* {!isLoading && !error && (
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(soData, null, 2)}
            </pre>
          )} */}
        </div>

        <div className='table-container'>
            <div className='di-table'>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {soData.map((item, index) => (
                        <tr key={item.id}>
                          <td className="no">{index + 1}</td>
                          <td className="size">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.Size}
                                onChange={(e) => handleChange(e, index, 'Size')}
                              />
                            ) : (
                              item.Size
                            )}
                          </td>
                          
                          <td className="description">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.itemDescription}
                                onChange={(e) => handleChange(e, index, 'itemDescription')}
                              />
                            ) : (
                              item.itemDescription
                            )}
                          </td>

                          <td className="itemCode">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.itemCode}
                                onChange={(e) => handleChange(e, index, 'itemCode')}
                              />
                            ) : (
                              item.itemCode
                            )}
                          </td>

                          <td className="colour">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.Colour}
                                onChange={(e) => handleChange(e, index, 'Colour')}
                              />
                            ) : (
                              item.Colour
                            )}
                          </td>

                          <td className="voltage">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.Volt}
                                onChange={(e) => handleChange(e, index, 'Volt')}
                              />
                            ) : (
                              item.Volt
                            )}
                          </td>
                          
                          <td className="unit">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.Unit}
                                onChange={(e) => handleChange(e, index, 'Unit')}
                              />
                            ) : (
                              item.Unit
                            )}
                          </td>

                          <td className="qty">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={item.QTY}
                                onChange={(e) => handleChange(e, index, 'QTY')}
                              />
                            ) : (
                              item.QTY
                            )}
                          </td>

                          <td className="packing">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={item.Packing}
                                onChange={(e) => handleChange(e, index, 'Packing')}
                              />
                            ) : (
                              item.Packing
                            )}
                          </td>
                          
                          <td className="final-delivered-qty">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={item.deliveredQty}
                                readOnly
                              />
                            ) : (
                              item.deliveredQty
                            )}
                          </td>
                          <td className="actions">
                            {editingIndex === index ? (
                              <>
                                <button onClick={() => handleSave(item.id, index)}>Save</button>
                                <button onClick={() => setEditingIndex(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingIndex(index)}>Edit</button>
                                <button className="item-delete" onClick={() => handleDelete(item.id, index)}>Delete</button>
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
          Click to Send to DB
          <button className="submit-button" onClick={(e) => handleDIsubmitToDB(e)}>
            Send Data
          </button>
        </div>  
      </div>}

      {diSubmitted && <div className='di-after-creation'>
        <h1>Item Created Successfully!</h1>
        <p>Delivery Instruction ID: {diRefNumber}</p>
        <button onClick={handlePrint}>Print</button>
        <button onClick={handleEdit}>Edit</button>
      </div>}

    </div>
    
  );
}


export default DeliveryInstructionCreate;