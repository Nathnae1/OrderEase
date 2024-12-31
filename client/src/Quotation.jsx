import { useState, useEffect } from "react";
import EditAddItem from './EditAddItem'
import './QuotationStyle.css'
import BillToSuggestions from "./BillToSuggestions";
import { useNavigate } from 'react-router-dom';
import api from './api';

function Quotation() {
  const [id, setId] = useState('');
  const [qoDate, setSelectedqoDate] = useState('');
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [isFailedReq, setIsFailedReq] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // Track which row is being edited

  const [addItem, setAddItem] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [noOfAddItems, setNoOfAddItems] = useState(0);

  // set Identity 
  const [identityEdit, setIdentityEdit] = useState({});
  const [billToEdit, setBillToEdit] = useState('');
  const [prevBillTo, setPrevBillTo] = useState('');

  //Collect the selected row table ids
  const [selectedTableRowsID, setSelectedTableRowsID] = useState([]);

  // send edit data to DB notifier
  const [sendEditdata, setSendEditData]  = useState(false);

  // Define the navigate function
  const navigate = useNavigate();

  useEffect(() => {
    // Function to format the date as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Set the current date
    const today = new Date();
    setSelectedqoDate(formatDate(today));
  }, []);

  const handleFetch = async () => {
    try {
      const selectedDate = new Date(qoDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

      const response = await api.get(`/get_quotation/${id}?year=${year}&month=${month}`);
      setData(response.data);
      setIsFailedReq(false);
      setIsFetched(true);
      setAddItem(false);
      setNoOfAddItems(0);
      setBillToEdit('');
    } catch (error) {
      setIsFailedReq(true);
      console.error('Error fetching data:', error.message);
    }
  };

  useEffect(() => {
    setIdentityEdit({});
    if (data.length > 0) {
        setIdentityEdit(
          {
          ref: data[0].refNum,
          name: data[0].Name,
          date: data[0].Date.split('T')[0],
          billTo: data[0].BillTo,
          salesId: data[0].sales_rep_id
          })
    }
  }, [data]);

  useEffect(() => {
    const calculateTotal = () => {
      const totalBeforeVAT = data.reduce((acc, row) => acc + (parseFloat(row.BeforeVAT) || 0), 0);
      setTotal(totalBeforeVAT);
    };

    calculateTotal();
  }, [data]);

  const handleChange = (e, index, field) => {
    const { value } = e.target;
    const updatedData = [...data];
    updatedData[index] = { ...updatedData[index], [field]: value };

    // Calculate BeforeVAT if UnitPrice or QTY changes
    if (field === 'UnitPrice' || field === 'QTY') {
      const unitPrice = parseFloat(updatedData[index].UnitPrice) || 0;
      const qty = parseFloat(updatedData[index].QTY) || 0;
      updatedData[index].BeforeVAT = unitPrice * qty;
    }

    setData(updatedData);
  };

  const handleSave = async (id, rowIndex) => {
    const itemDate = new Date(data[rowIndex].Date);
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    
    const updatedRow = data[rowIndex];
    
    
    console.log(updatedRow);
    try {
      await api.put(`/update_quotation/${id}?year=${year}&month=${month}`, updatedRow);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  };

  const handleDelete = async (id, rowIndex) => {
    const itemDate = new Date(data[rowIndex].Date);
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    
    try {
      await api.delete(`/delete_quotation/${id}?year=${year}&month=${month}`);
      setData(data.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting data:', error.message);
    }
  };

  const handleAddItem = () => {
    console.log('Entering add itme');
    setAddItem(true);
    setNoOfAddItems(noOfAddItems + 1);
  }

  const handleBillToEditChange = (newValue) => {
    setPrevBillTo(data[0].BillTo);
    if (newValue) {
      setBillToEdit(newValue.company_name);
    }

  }

  useEffect(() => {
    console.log('This is prev', prevBillTo);
    console.log('This is bill to edit', billToEdit);
  }, [prevBillTo, billToEdit]);

  const handleBillToEditCancel = () => {
    setBillToEdit('');
  }

  const handleBillToEditSave = () => {
    console.log('Saving Changes.....');
    handleBillToSave(data[0].refNum, 0);
    setBillToEdit('');
  }

  const handleBillToSave = async (ref, rowIndex) => {
    const itemDate = new Date(data[rowIndex].Date);
    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    
    const updatedBillTo = {billToEdit};
    
    console.log('This handle bill to --- ', updatedBillTo);
    try {
      await api.put(`/update_quotation/billto/${ref}?year=${year}&month=${month}`, updatedBillTo);
      
    } catch (error) {
      console.error('Error saving data:', error.message);
    }
  };

  // Function to refetch Data
  const fetchData = async () => {
    try {
      const selectedDate = new Date(qoDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

      const response = await api.get(`/get_quotation/${id}?year=${year}&month=${month}`);
      setData(response.data);
      setIsFailedReq(false);
      setIsFetched(true);
      setAddItem(false);
      setNoOfAddItems(0);
      setBillToEdit('');
    } catch (error) {
      setIsFailedReq(true);
      console.error('Error fetching data:', error.message);
    }
  };

  // useEffect to refetch data when sendEditData changes
  const [fetchTimestamp, setFetchTimestamp] = useState(Date.now()); // Add timestamp state
  useEffect(() => {
    if (sendEditdata) {
      fetchData();
      setFetchTimestamp(Date.now()); // Update timestamp to fetch new data
      // Check how many times fetches 
      console.log('Refetched');
    }
  }, [sendEditdata, fetchTimestamp]); // Dependency array includes sendEditData

  // Notifying Edit Component to send data to DB
  const handleEditAddData = () => {
    setSendEditData(true);
    console.log('Data Adding notified to edit component');
  }

  //Table row selction
  const handleTableRowClick = (rowId) => {
    const newRowID = selectedTableRowsID.includes(rowId) ? selectedTableRowsID.filter((id) => id !== rowId) :
    [...selectedTableRowsID, rowId];
    setSelectedTableRowsID(newRowID);
    console.log(selectedTableRowsID);
  };

  const handleCreateSO = (e) => {
    localStorage.setItem('fromQuotation', 'true'); // Set the programmatic access flag
    // React's navigate and the browser will automatically convert the qoDate Date object to a string when it's placed into the URL. 
    navigate(`/create_so?qoToSo=${id}&selectedDate=${qoDate}`);
  }

  const handleCreateSelectedSO = (e) => {
    localStorage.setItem('fromQuotation', 'true'); // Set the programmatic access flag
    const selectedRowsParam = selectedTableRowsID.join(',');

    if(selectedRowsParam){
      navigate(`/create_so?qoToSo=${id}&selectedDate=${qoDate}&selectedRowsID=${selectedRowsParam}`);
    } else {
      console.log('Select ITems');
    }
    
  }

  const handlePrint = () => {
    localStorage.setItem('QuotationPrint', 'true');
    const selectedDate = new Date(qoDate);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

    navigate(`/quotation/print/${id}?year=${year}&month=${month}`)
  }

  return (
    <>
      <div>
        {isFailedReq && <div>Error fetching data: Request failed with status code 404</div>}
      </div>
      {!isFailedReq && (
        <div>
          <div className="get-top-section">
            <p>Ref No: {data.length > 0 ? data[0].refNum : ''}</p>
            <p>Date: {data.length > 0 ? data[0].Date.split('T')[0] : ''}</p>
            <p>Name: {data.length > 0 ? data[0].Name : ''}</p>
          </div>
          <div className="get-bill-to">

            {billToEdit ? <p>Bill To: {billToEdit}</p> : <p>Bill To: {data.length > 0 ? data[0].BillTo : ''}</p>}

            {isFetched && data.length > 0 && <BillToSuggestions billToEditChange={handleBillToEditChange} />}

            { (isFetched && data.length > 0 && billToEdit) &&  
              <div>
                <button onClick={handleBillToEditSave}>Save Change</button>
                <button onClick={handleBillToEditCancel}>Cancel</button>
              </div>
            }
            
          </div>

          <div className="table-container">
            <div className="quotation-table">
              {data.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Size</th>
                      <th>Description</th>
                      <th>QTY</th>
                      <th>Colour</th>
                      <th>Packing</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((quotation, index) => (
                      <tr key={quotation.id} 
                      onClick={() => {
                        if (editingIndex === null) {
                          handleTableRowClick(quotation.id);
                        }
                      }}
                      style={{
                        backgroundColor: selectedTableRowsID.includes(quotation.id) ? 'CornflowerBlue' : '',
                        cursor: editingIndex === null ? 'pointer' : 'not-allowed', // Disable pointer for clarity
                      }}
                      >
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
                              <button
                                onClick={(e) => {
                                  // stops the click event from bubbling up to the row's onClick event, preventing row selection.
                                  e.stopPropagation();
                                  handleSave(quotation.id, index);
                                }}> Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  setEditingIndex(null);
                                }}> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  setEditingIndex(index);
                                }}> Edit
                              </button>
                              <button
                                className="item-delete"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  handleDelete(quotation.id, index);
                                }}> Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
          
          {addItem && <div>
            <EditAddItem noOfItems={noOfAddItems} identityData = {identityEdit} sendData={sendEditdata} setSendData={setSendEditData} />
          </div>}

          <div>
            <p>Total Before VAT: {total}</p>
            <p>VAT: {(total * 0.15).toFixed(2)}</p>
            <p>Total including VAT: {(total * 1.15).toFixed(2)}</p>
          </div>
          
          <label>Select Date</label>
          <input type="date" value={qoDate} onChange={(e) => setSelectedqoDate(e.target.value)}  />

          <label>Input Pro number</label>
          <input type="text" value={id} placeholder="Enter no" onChange={(e) => setId(e.target.value)}/>
          <button onClick={handleFetch}>Fetch</button>
          
          {isFetched && data.length > 0 && <div>
            <button className="print-button" onClick={handlePrint}>Print</button>

            <button className="add-item-button" onClick={handleAddItem}>Add Item</button>
            <button className="add-data-button" onClick={handleEditAddData}>Add Data</button>
            <button className="create-so-button" onClick={(e) => handleCreateSO(e)}>Create SO</button>

            <button className="create-so-button" onClick={(e) => handleCreateSelectedSO(e)}>Create Selected SO</button>

          </div>}
          
        </div>
      )}
    </>
  );
}

export default Quotation;
