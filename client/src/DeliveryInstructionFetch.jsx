import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from './api';

function DeliveryInstructionFetch() {

  const [diId, setDiId] = useState('');
  const [diDate, setDiSelectedDate] = useState('');
  const [diYear, setDiYear] = useState('');

  const [diData, setdiData] = useState([]); // State to hold the fetched data

  const [isLoading, setIsLoading] = useState(true); // State to manage loading state

  const [editingIndex, setEditingIndex] = useState(null); // Track which row is being edited

  // Define the navigate function
  const navigate = useNavigate();
  
  useEffect(() => {
    // Function to format the date as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}`;
    };

    // Set the current date
    const today = new Date();
    setDiSelectedDate(formatDate(today));
  }, []);

  const handleDiFetch = async () => {
    try {
      const selectedDate = new Date(diDate);
      const year = selectedDate.getFullYear();
      //Setting soYear for delivery Creation
      setDiYear(year);

      const response = await api.get(`/get_delivery_instruction/${diId}?year=${year}`);
      setdiData(response.data)
      
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  // handle change of each input of table row
  const handleChange = (e, index, field) => { 
    const { value } = e.target;
    const updatedData = [...diData];
    updatedData[index] = { ...updatedData[index], [field]: value };

    setdiData(updatedData);  
  };

  // handle update of di items
  const handleSave = async (itemId, rowIndex) => {
    const itemDate = new Date(diData[rowIndex].diDate);
    const year = itemDate.getFullYear();
    
    const updatedRow = diData[rowIndex];
    
    try {
      await api.put(`/update_delivery_instruction/${itemId}?year=${year}`, updatedRow);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  };

  // handle deletion of so items
  const handleDelete = async (itemId, rowIndex) => {
    const itemDate = new Date(diData[rowIndex].diDate);
    const year = itemDate.getFullYear();

    try {
      await api.delete(`/delete_delivery_instruction/${itemId}?year=${year}`);
      setdiData(diData.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting data:', error.message);
    }
  };

  const handlePrint = () => {
    localStorage.setItem('DeliveryInstructionPrint', 'true');
    const selectedDate = new Date(diDate);
    const year = selectedDate.getFullYear();
    

    navigate(`/delivery_instruction/print/${diId}?year=${year}`)
  }

  return (
    <div>
      {diData.length > 0 && <div className='fetched-di-container'>
        <div className="get-top-section">
                <p>Ref No: {diData[0].diRefNum}</p>
                <p>Date: {diData[0].diDate.split('T')[0]}</p>
                <p>Name: {diData[0].Name}</p>
        </div>

        <div>
          <h2>Bill To: {diData[0].BillTo}</h2>
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
                      <th>Ordered Qty</th>
                      <th>Packing</th>
                      <th>Actual length</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diData.map((diItem, index) => (
                        <tr key={diItem.id}
                          >
                          <td className="no">{index + 1}</td>
                          <td className="size">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.Size}
                                onChange={(e) => handleChange(e, index, 'Size')}
                              />
                            ) : (
                              diItem.Size
                            )}
                          </td>
                          
                          <td className="description">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.itemDescription}
                                onChange={(e) => handleChange(e, index, 'itemDescription')}
                              />
                            ) : (
                              diItem.itemDescription
                            )}
                          </td>

                          <td className="itemCode">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.itemCode}
                                onChange={(e) => handleChange(e, index, 'itemCode')}
                              />
                            ) : (
                              diItem.itemCode
                            )}
                          </td>

                          <td className="colour">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.Colour}
                                onChange={(e) => handleChange(e, index, 'Colour')}
                              />
                            ) : (
                              diItem.Colour
                            )}
                          </td>

                          <td className="voltage">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.Volt}
                                onChange={(e) => handleChange(e, index, 'Volt')}
                              />
                            ) : (
                              diItem.Volt
                            )}
                          </td>
                          
                          <td className="unit">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.Unit}
                                onChange={(e) => handleChange(e, index, 'Unit')}
                              />
                            ) : (
                              diItem.Unit
                            )}
                          </td>

                          <td className="ordered-qty">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={diItem.orderedQty}
                                onChange={(e) => handleChange(e, index, 'orderedQty')}
                              />
                            ) : (
                              diItem.orderedQty
                            )}
                          </td>

                          <td className="packing">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={diItem.Packing}
                                onChange={(e) => handleChange(e, index, 'Packing')}
                              />
                            ) : (
                              diItem.Packing
                            )}
                          </td>
                          
                          <td className="delivered-qty">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={diItem.deliveredQty}
                                onChange={(e) => handleChange(e, index, 'deliveredQty')}
                              />
                            ) : (
                              diItem.deliveredQty
                            )}
                          </td>
                          
                          <td className="actions">
                            {editingIndex === index ? (
                              <>
                                <button onClick={() => handleSave(diItem.id, index)}>Save</button>
                                <button onClick={() => setEditingIndex(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setEditingIndex(index)}>Edit</button>
                                <button className="item-delete" onClick={() => handleDelete(diItem.id, index)}>Delete</button>
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
                {/* <p>Tolerance</p> */}
          </div>  
      </div> }

      {diData.length === 0 && 
        <div>
          <p>No data available</p>
        </div>
      }

      <div className='so-fetching-container'>
        <label>Select Date </label>
        <input type="month" value={diDate} onChange={(e) => setDiSelectedDate(e.target.value)}  />

        <label>Input DI number</label>
        <input type="text" value={diId} placeholder="Enter no" onChange={(e) => setDiId(e.target.value)}/>
        <button onClick={handleDiFetch}>Fetch</button>
      </div>

      {diData.length > 0 &&
        <div>
           <button className='di-print-button' onClick={handlePrint}>Print</button>
        </div>
      }
      
      

    </div>
  );
}

export default DeliveryInstructionFetch;