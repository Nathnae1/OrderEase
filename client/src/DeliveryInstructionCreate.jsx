import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import api from './api';
import { useNavigate } from 'react-router-dom';

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

  const [diRefNumber, setDiRefNumber] = useState(null);
  const [diSubmitted, setDiSubmitted] = useState(false); 

  // Define the navigate function
  const navigate = useNavigate();

  //set delivered items data
  const [deliveredData, setDeliveredData] = useState([]);

  //set undelivered items data
  const [unDeliveredData, setunDeliveredData] = useState([]);

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
        if (response.data.message === 'Sales order data retrieved') {
          // Display the record exists message with the SO number
          // navigate(`/fetch_di`);
          console.log(response.data.deliveredItems);
          setDeliveredData(response.data.deliveredItems);
          setunDeliveredData(response.data.undeliveredItems);

          // Add `toBeDelivered` to each object in `undeliveredItems`
          const updatedSoData = response.data.undeliveredItems.map((item) => ({
            ...item,
            toBeDelivered: Number(item.QTY) - Number(item.deliveredQty), 
          }));

          setSoData(updatedSoData);
          // window.alert(`Record exists with DI number: ${response.data.deliveredCount}, ${response.data.deliveryStatus}`);
        } else {
          // Set the fetched quotation data
          
          console.log(response.data);
          console.log(quotationData);
        }  
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
    setEditingIndex(null);
  }
  const handleDelete = async (id, rowIndex) => {
    const updatedItems = [...soData];
    updatedItems.splice(rowIndex, 1); // Splice removes 1 element at the given index

    setSoData(updatedItems); // Update the state with the new array
  }


   // Function to handle SO Data submission
   const handleDIsubmitToDB = async (e) => {

    try {
      // Check the data before sending to server
      const dataToSend = soData;
      // Use Axios to send a POST request
      const response = await api.post('/send_di_to_db', dataToSend);

      if (response.status === 201) {
        setDiRefNumber(response.data.diId)
        setDiSubmitted(true);
      
      } else {
        console.error('Error submitting data to the database');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePrint = () => {
    localStorage.setItem('DeliveryInstructionPrint', 'true');
    const year = new Date().getFullYear();
    navigate(`/delivery_instruction/print/${diRefNumber}?year=${year}`)
  }

  const handleEdit = () => {
    console.log('Eding Option pressed');
  }


  return (
    <div>
      {/* {deliveredData && (
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              <h1>Delivered Data</h1>
              {JSON.stringify(deliveredData, null, 2)}
            </pre>
          )} */}

      {deliveredData.length > 0 && <div>
        <h2 style={{textAlign: "left" }}>Delivered Items</h2>
          <table border="1" style={{ width: "50%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Size</th>
                <th>Description</th>
                <th>Ordered Qty</th>
                <th>Delivered Qty</th>
              </tr>
            </thead>
            <tbody>
              {deliveredData.map((item) => (
                <tr key={item.id}  style={{ textAlign: "center" }}>
                  <td>{item.id}</td>
                  <td>{item.Size}</td>
                  <td>{item.itemDescription}</td>
                  <td>{item.QTY}</td>
                  <td>{item.deliveredQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      }

      {!diSubmitted && <div className='di-on-creation'>
        <div>
          {soData.length > 0 &&<h1>This is Create Delivery Instruction for SO {soToDi}</h1>}
          
          {isLoading && <p>Loading...</p>}
          
          {error && <p>Error: {error}</p>}
          
        </div>

        {soData.length > 0 && <div>
         
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
                          <th>To Be Delivered</th>
                          <th>Actions</th>
                        </tr>
                  </thead>
                      <tbody>
                      {soData.map((item, index) => (
                            <tr key={item.id}>
                              <td className="no">{index + 1}</td>
                              
                              <td className="size">{item.Size}</td>
                              <td className="itemDescription">{item.itemDescription}</td>
                              <td className="itemCode">{item.itemCode}</td>
                              <td className="colour">{item.Colour}</td>
                              <td className="voltage">{item.Volt}</td>
                              <td className="unit">{item.Unit}</td>
                              <td className="qty">{item.QTY}</td>

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
                              
                              <td className="to-be-delivered">
                                {editingIndex === index ? (
                                  <input
                                    type="number"
                                    value={item.toBeDelivered}
                                    onChange={(e) => handleChange(e, index, 'toBeDelivered')}
                                  />
                                ) : (
                                  item.toBeDelivered 
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
        </div> } 
      </div>}

      {diSubmitted && <div className='di-after-creation'>
        <h1>Item Created Successfully!</h1>
        <p>Delivery Instruction ID: {diRefNumber}</p>
        <button onClick={handlePrint}>Print</button>
        {/* <button onClick={handleEdit}>Edit</button> */}
      </div>}

    </div>
    
  );
}


export default DeliveryInstructionCreate;