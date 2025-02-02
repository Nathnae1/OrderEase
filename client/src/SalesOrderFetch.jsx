import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './SalesOrderFetchStyle.css';

function SalesOrderFetch() {  

  const [soId, setSoId] = useState('');
  const [soDate, setSelectedsoDate] = useState('');
  const [soYear, setSoYear] = useState('');

  const [soData, setSoData] = useState([]); // State to hold the fetched data

  const [isLoading, setIsLoading] = useState(true); // State to manage loading state

  
  const [editingIndex, setEditingIndex] = useState(null); // Track which row is being edited

  const [total, setTotal] = useState(0);

  //Collect the selected row table ids
  const [selectedTableRowsID, setSelectedTableRowsID] = useState([]);

  // Define the navigate function
  const navigate = useNavigate();
  
  // hook to calculate the total
  useEffect(() => {
    const calculateTotal = () => {
      const totalBeforeVAT = soData.reduce((acc, row) => acc + (parseFloat(row.BeforeVAT) || 0), 0);
      setTotal(totalBeforeVAT);
    };

    calculateTotal();
  }, [soData]);

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
    setSelectedsoDate(formatDate(today));
  }, []);

 
  const handleSoFetch = async () => {
    try {
      const [year, month] = soDate.split('-'); // Split into year and month 
      const response = await axios.get(`http://localhost:5000/get_sales_order/${soId}?year=${year}`);
      setSoData(response.data)
      
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }

  // Function to handle eding of table row
  const handleChange = (e, index, field) => {
    const { value } = e.target;
    const updatedData = [...soData];
    updatedData[index] = { ...updatedData[index], [field]: value };

    // Calculate BeforeVAT if UnitPrice or QTY changes
    if (field === 'UnitPrice' || field === 'QTY') {
      const unitPrice = parseFloat(updatedData[index].UnitPrice) || 0;
      const qty = parseFloat(updatedData[index].QTY) || 0;
      updatedData[index].BeforeVAT = unitPrice * qty;
    }

    setSoData(updatedData);
  };

  //Table row selction
  const handleTableRowClick = (rowId) => {
    const newRowID = selectedTableRowsID.includes(rowId) ? selectedTableRowsID.filter((id) => id !== rowId) :
    [...selectedTableRowsID, rowId];
    setSelectedTableRowsID(newRowID);
  };

  // create delivery for all items
  const handleCreateDI = (e) => {
    // Set the programmatic access flag
    localStorage.setItem('fromSO', 'true');
    navigate(`/create_di?soToDI=${soId}&year=${soYear}`);
  }

  // create delivery for selected items
  const handleCreateSelectedDI = (e) => {
    localStorage.setItem('fromSO', 'true');
    const selectedRowsParam = selectedTableRowsID.join(',');
    console.log(selectedRowsParam);
    if(selectedRowsParam){
      navigate(`/create_di?soToDI=${soId}&year=${soYear}&selectedRowsID=${selectedRowsParam}`); 
    } else {
      console.log('Select ITems');
    }
  }

  // handle deletion of so items
  const handleDelete = async (itemId, rowIndex) => {
    const itemDate = new Date(soData[rowIndex].soDate);
    const year = itemDate.getFullYear();

    try {
      await axios.delete(`http://localhost:5000/delete_sales_order/${itemId}?year=${year}`);
      setSoData(soData.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting data:', error.message);
    }
  };
  // handle update of so items
  const handleSave = async (itemId, rowIndex) => {
    const itemDate = new Date(soData[rowIndex].soDate);
    const year = itemDate.getFullYear();
    
    const updatedRow = soData[rowIndex];
    console.log('this is so from react', updatedRow);
    
    try {
      await axios.put(`http://localhost:5000/update_sales_order/${itemId}?year=${year}`, updatedRow);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  };

  const handlePrint = () => {
    localStorage.setItem('SalesOrderPrint', 'true');
    const selectedDate = new Date(soDate);
    const year = selectedDate.getFullYear();
    navigate(`/sales_order/print/${soId}?year=${year}`)
  }


  return (
    <div>
      {soData.length > 0 && <div className='fetched-so-container'>
        <div className="get-top-section">
                <p>Ref No: {soData[0].soRefNum}</p>
                <p>Date: {soData[0].soDate.split('T')[0]}</p>
                <p>Name: {soData[0].Name}</p>
                <p>TIN: {soData[0].tin}</p>
        </div>

        <div>
          <h2>Bill To: {soData[0].BillTo}</h2>
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
                    {soData.map((soItem, index) => (
                        <tr key={soItem.id}
                          onClick={() => { 
                            if (editingIndex === null) {
                              handleTableRowClick(soItem.id)
                            }        
                          }} 
                          style={{
                            backgroundColor: selectedTableRowsID.includes(soItem.id) ? 'CornflowerBlue' : '',
                            cursor: editingIndex === null ? 'pointer' : 'not-allowed'
                          }}
                          >
                          <td className="no">{index + 1}</td>
                          <td className="size">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.Size}
                                onChange={(e) => handleChange(e, index, 'Size')}
                              />
                            ) : (
                              soItem.Size
                            )}
                          </td>
                          
                          <td className="description">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.itemDescription}
                                onChange={(e) => handleChange(e, index, 'itemDescription')}
                              />
                            ) : (
                              soItem.itemDescription
                            )}
                          </td>

                          <td className="itemCode">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.itemCode}
                                onChange={(e) => handleChange(e, index, 'itemCode')}
                              />
                            ) : (
                              soItem.itemCode
                            )}
                          </td>

                          <td className="colour">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.Colour}
                                onChange={(e) => handleChange(e, index, 'Colour')}
                              />
                            ) : (
                              soItem.Colour
                            )}
                          </td>

                          <td className="voltage">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.Volt}
                                onChange={(e) => handleChange(e, index, 'Volt')}
                              />
                            ) : (
                              soItem.Volt
                            )}
                          </td>
                          
                          <td className="unit">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.Unit}
                                onChange={(e) => handleChange(e, index, 'Unit')}
                              />
                            ) : (
                              soItem.Unit
                            )}
                          </td>

                          <td className="qty">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={soItem.QTY}
                                onChange={(e) => handleChange(e, index, 'QTY')}
                              />
                            ) : (
                              soItem.QTY
                            )}
                          </td>

                          <td className="packing">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={soItem.Packing}
                                onChange={(e) => handleChange(e, index, 'Packing')}
                              />
                            ) : (
                              soItem.Packing
                            )}
                          </td>
                          <td className="unit-price">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={soItem.UnitPrice}
                                onChange={(e) => handleChange(e, index, 'UnitPrice')}
                              />
                            ) : (
                              soItem.UnitPrice
                            )}
                          </td>
                          <td className="before-vat">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={soItem.BeforeVAT}
                                readOnly
                              />
                            ) : (
                              soItem.BeforeVAT
                            )}
                          </td>
                          <td className="actions">
                            {editingIndex === index ? (
                              <>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave(soItem.id, index)}}>
                                    Save
                                </button>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIndex(null)}}>
                                    Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIndex(index)}}>
                                  Edit
                                </button>
                                <button className="item-delete" onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(soItem.id, index)}}>
                                  Delete
                                </button>
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
      </div> }

      {soData.length === 0 && 
        <div>
          <p>No data available</p>
        </div>
      }

      <div className='so-fetching-container'>
        <label>Select Date </label>
        <input type="month" value={soDate} onChange={(e) => setSelectedsoDate(e.target.value)}  />

        <label>Input Sales Order number</label>
        <input type="text" value={soId} placeholder="Enter no" onChange={(e) => setSoId(e.target.value)}/>
        <button onClick={handleSoFetch}>Fetch</button>
      </div>
      
      {soData.length > 0 &&
        <div>
          <button className='di-print-button' onClick={handlePrint}>Print</button>
          <button className='create-di-button' onClick={(e) => handleCreateDI(e)}>Create DI</button>

          <button className='create-di-button' onClick={(e) => handleCreateSelectedDI(e)}>Create Selected DI</button>
        </div>
      }

    </div>
  );
}

export default SalesOrderFetch;
