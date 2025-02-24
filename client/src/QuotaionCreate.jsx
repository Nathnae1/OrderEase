import React, { useEffect, useState } from 'react';
import Suggest from './Suggest';
import BillToSuggestions from './BillToSuggestions';
import ColorSelectionInput from './ColorSelectionInput';
import SalesInput from './SalesInput';
import api from './api';

// InputField component for rendering input fields
function InputField({ label, type = 'text', value, onChange }) {
  const isDateType = type === 'date';
  return (
    <div className="input-field">
      <label>{label}</label>
      <input className="identity-input" type={type} value={value} onChange={onChange} readOnly={isDateType}/>
    </div>
  );
}


// Add component for the form
function QuotationCreate() {
  // State variables for each input field
  const [ref, setRef] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [billTo, setBillTo] = useState('');
  const [size, setSize] = useState('');
  const [salesId, setSalesId] = useState('');
  const [total, setTotal] = useState(0);

  let itemIndex = 0;

  const [itemData, setItemData] = useState('');

  //Full line Data
  const [fullData, setFullData] = useState([{ ref: '',salesRepId: '', name: '', date: '', billTo: '', size: '', description: '', quantity: '', colour: 'Black', packing: 'DRUM', unitPrice: '', beforeVat: '' }]);

  // data keys
const dataKeys = ['ref','salesRepId','name', 'date','billTo','size', 'description', 'quantity','colour','packing', 'unitPrice','beforeVat'];

  // Checking data submisssion is succefull
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Checking if isPreview to print true
  const [printPreview, setPrintPreview] = useState(false);

  // NEW: Track rows with validation errors
  const [errorFields, setErrorFields] = useState([]); 

  // Function to validate required fields
  const validateFields = () => {
    const errors = fullData.map((row) => {
      // Check which fields are empty
      const invalidFields = {};
      dataKeys.forEach((key) => {
        if (key !== 'ref' && (!row[key] || row[key].toString().trim() === '')) {
          invalidFields[key] = true;
        }
      });
      console.log(errorFields);
      return invalidFields;
    });

    setErrorFields(errors);
    return errors.some((fields) => Object.keys(fields).length > 0); // Returns true if any row has errors
  };

   // Function to handle form submission
  const handleClick = async (e) => {

    // Validate fields before submission
    if (validateFields()) {
      alert('Please fill all required fields before submitting.');
      return;
    }

    try {
      // Check the data before sending to server
      const dataToSend = fullData;
      // Use Axios to send a POST request
      const response = await api.post('/create/quotation', dataToSend);

      if (response.status === 200) {
        setIsSubmitted(true);
        // Extract idRef from the response
        const { idRef } = response.data;

        // Display the idRef in a top popup
        window.alert(`Quotation created successfully with ID Reference: ${idRef}`);

        // Set a timeout to hide the success message after 10 seconds
        setTimeout(() => {
          setIsSubmitted(false);
        }, 2000);

        setFullData([{ ref: '', salesRepId: '', name: '', date: '', billTo: '', size: size, description: '', quantity: '', colour: 'Black', packing: 'DRUM', unitPrice: '', beforeVat: '' }]);
        setName('');
        setSize('')
        setBillTo('');
        setSalesId('');
        setErrorFields([]);
        itemIndex = 0;

      } else {
        console.error('Error submitting data to the database');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Set the date
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
        setDate(formatDate(today));
  }, []);
  

  const addSingleItem = (e) => {

    // Create new empty data
    const newSingleData = [{ ref: '', salesRepId: '', name: '', date: '', billTo: '', size: '', description: '', quantity: '', colour: 'Black', packing: 'DRUM', unitPrice: '', beforeVat: '' }];

    setFullData((prevItems) => [...prevItems, ...newSingleData]);
    setErrorFields((prevErrors) => [...prevErrors, {}]);
    
  }

  // Table handle cell change
  const handleCellChange = (rowIndex, colIndex, value) => {
    
    const updatedData = [...fullData];
    
    let tempKey = dataKeys[colIndex];
    updatedData[rowIndex][tempKey] = value;

    console.log(`See me ${ updatedData[rowIndex][tempKey]}`);

    if(tempKey == 'unitPrice' || tempKey == 'quantity'){
      let temp = parseFloat(updatedData[rowIndex].unitPrice) * 100;
      temp = (temp * parseInt(updatedData[rowIndex].quantity)) / 100;

      updatedData[rowIndex].beforeVat = temp;
    }

    setFullData(updatedData);
    
    // Clear the error for this field if it has been corrected
    const updatedErrors = [...errorFields];
    if (updatedErrors[rowIndex]) {
      delete updatedErrors[rowIndex][field];
      setErrorFields(updatedErrors);
    }

  }

  const handleColorChange = (currentRowIndex, colorValue) => {
    
    if (colorValue) {
      const updatedData = [...fullData];
      let tempKey = dataKeys[8];
      updatedData[currentRowIndex][tempKey] = colorValue.colorName;

      setFullData(updatedData);
      console.log(fullData);
    }
    
  }

  // Get the data from size input
  const handleSizeChange = (newValue, currentRowIndex)=> {
      setItemData(newValue);

      if (newValue) {
        if (newValue.size && newValue.itemDescription && newValue.price) {
          let refKey = dataKeys[0];
          let salesIdKey = dataKeys[1];
          let nameKey = dataKeys[2];
          let dateKey = dataKeys[3];
          let billToKey = dataKeys[4];
          let sizeKey = dataKeys[5];
          let descKey = dataKeys[6];
          let priceKey = dataKeys[10];
          
          setFullData((data) => {

              data[currentRowIndex][sizeKey] = newValue.size;
              data[currentRowIndex][descKey] = newValue.itemDescription;
              data[currentRowIndex][priceKey] = newValue.price;

              data[currentRowIndex][refKey] = ref;
              data[currentRowIndex][salesIdKey] = salesId;
              data[currentRowIndex][nameKey] = name;
              data[currentRowIndex][dateKey] = date;
              data[currentRowIndex][billToKey] = billTo;
              
              return data; 
            });
        }
      }

      if(currentRowIndex === 0) {
        setSize(newValue.size);
      }

      console.log('The values are', ref, name, date, billTo);

  };

  // Set the sales info data from drop down
  const handleSalesInfo = (infoSales) => {
    if (infoSales) {
      setName(infoSales.first_name);
      setSalesId(infoSales.sales_rep_id);
      
    // Update the sales info field for every row in fullData
    //{ ref: '',salesRepId: '', name: '', date: '', billTo: ''
    setFullData((prevData) =>
    prevData.map((row) => ({
      ...row,
      name: infoSales.first_name,
      salesRepId: infoSales.sales_rep_id
      }))
    );
    }
  }

  // Get the data form billTo Input
  const handleBillToChange = (newValue) => {
    setBillTo(newValue.company_name);
    // Update the billTo field for every row in fullData
    setFullData((prevData) =>
      prevData.map((row) => ({
      ...row,
      billTo: newValue.company_name, // Set the billTo field for each row
      }))
    );
  };

  // Handle the deletion of a single row
  const handleDeleteRow = (rowIndex) => {
    const newData = fullData.filter((row, index) => index !== rowIndex);
    const updatedErrors = errorFields.filter((_, index) => index !== rowIndex);
    setFullData(newData);
    setErrorFields(updatedErrors);
  }

  // calculate the total of the items
  useEffect(() => {
    const calculateTotal = () => {
      const totalBeforeVAT = fullData.reduce((acc, row) => acc + (parseFloat(row.beforeVat) || 0), 0);
      setTotal(totalBeforeVAT);
    };

    calculateTotal();
  }, [fullData]);

  return (
    <div className="add-item-container">
      <div className="top-section">
        {/* {isSubmitted && <div className="success-message"> Data submitted successfully! </div>} */}
      </div>
      
      <div className="add-identity">
        <div className="add-serial">
          <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <SalesInput onSalesInfo={handleSalesInfo}/>
        </div>

        <div className="add-bill-to">
          <BillToSuggestions onBillToChange={handleBillToChange}/>
        </div>
      </div>    

      <div className="table-input">
        <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Size</th>
                <th>Description</th>
                <th>QTY</th>
                <th>Colour</th>
                <th>Packing</th>
                <th>Unit Price</th>
                <th className="before-vat">Before VAT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>

              {fullData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((cell, colIndex) => (
                    colIndex === 0 ? (
                      <td key={colIndex}>{++itemIndex}</td>
                    ) : colIndex === 5 ? (
                      <td key={colIndex}>
                          <Suggest currentRowIndex = {rowIndex} onValueChange={handleSizeChange} className={
                            errorFields[rowIndex]?.[dataKeys[colIndex]] ? 'error' : ''
                          }/>
                      </td>
                    ) : colIndex === 1 || colIndex === 2 || colIndex === 3 || colIndex === 4  ? (
                      ''
                    ) : colIndex === 8 ? (
                      <td key={colIndex}>
                         <ColorSelectionInput currentRowIndex = {rowIndex} onColorChange={handleColorChange} />
                      </td>
                    ) : colIndex === 11 ? (
                      <td key={colIndex}>{row[dataKeys[colIndex]]}</td>
                    ) : (
                      <td key={colIndex}>
                        <input 
                          type="text" 
                          value={row[dataKeys[colIndex]]}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className={
                            errorFields[rowIndex]?.[dataKeys[colIndex]] ? 'error' : ''
                          }
                        />
                      </td>
                    )
                    
                  ))}
                  <td key={Object.keys(row).length}>
                    <button className="item-delete" onClick={() => handleDeleteRow(rowIndex)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}     
            
            </tbody>
        </table>
      </div>
                      
      {fullData && <div>
        <p>Total Before VAT: {total}</p>
        <p>VAT: {(total * 0.15).toFixed(2)}</p>
        <p>Total including VAT: {(total * 1.15).toFixed(2)}</p>
      </div>}
      <div className="add-btn-container">
        <button className="submit-button" onClick={(e) => addSingleItem(e)}>Add Item</button> 

        <button className="submit-button" onClick={(e) => handleClick(e)}>Add Data</button>

      </div>

    </div>
  );
}

export default QuotationCreate;