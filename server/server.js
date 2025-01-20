const express = require('express');
const dotenv = require('dotenv');

// for interacting with the mysql db
const mysql = require('mysql2')
//for enabling cross-origin requests
const cors = require('cors')
const path = require('path');

//JWT library for generating and verifing tokens
const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs')

// for parsing JSON bodies
const bodyParser = require('body-parser');
const { error, log } = require('console');
const { v4: uuidv4 } = require('uuid');

const app = express();

//Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Enable CORS
app.use(cors());

app.use(bodyParser.json());

// Parse JSON bodies
app.use(express.json());

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT;

// create a connection pool - not single connectin
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT),
  dateStrings: true  // This ensures that date fields are returned as strings
});

// Use the JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
// Refresh Secret
const REFRESH_SECRET = process.env.REFRESH_SECRET

// Middleware to handle conncetion errors

app.use((req, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({error: 'Database connection error'});
    }
    connection.release(); // Release connection back to the pool
    next();
  })
})

app.get("/", (req, res) =>{
  res.json("hello this is the backend");
})

function generateTableName(year, month) {
  return `quotation_${year}_${month}`;
}

function generateSoTableName(year) {
  return `sales_order_${year}`;
}

function generateDiTableName(year) {
  return `delivery_instruction_${year}`;
}

// Quotation route to fetch data
app.get("/get_quotation/:id", (req, res) => {
  const id = req.params.id;
  const year = req.query.year;
  const month = req.query.month;

  // Validate input
  if (!id || !year || !month) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const q = `SELECT * FROM ${escapedTableName} WHERE refNum= ?`;
  pool.query(q,[id], (err, data) => {
    console.log('backedn', data);
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })

})

// Quotation route to fetch data to make Sales Order
app.get("/get_quotation_for_so/:qoToSoRef", async (req, res, next) => {
  const ref = req.params.qoToSoRef;
  const year = req.query.year;
  const month = req.query.month;
  const idFilter = req.query.filterIds;

  // Convert the ids string back to an array
  const selectedIds = idFilter ? idFilter.split(',').map(id => parseInt(id)) : [];

  // Validate input
  if (!ref || !year || !month) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Checking SO table
  const soTableName = generateSoTableName(year);
  const escapedSoTableName = mysql.escapeId(soTableName);
  const soQ = `SELECT * FROM ${escapedSoTableName} WHERE qoRefNum = ?;`;

  try {
    const [soRows] = await pool.promise().query(soQ, [ref]);

    if (soRows.length > 0) {
      // If a record exists, return the associated SO number
      const soNum = soRows[0].soRefNum;
      return res.status(200).json({ message: 'Record exists', soNum });
    }

    // If no record exists, proceed to the next operation
    // Continue to the next part of the logic to fetch quotation data
    const tableName = generateTableName(year, month);
    const escapedTableName = mysql.escapeId(tableName);

    const q = `SELECT * FROM ${escapedTableName} WHERE refNum = ?;`;
    const q2 = "SELECT * FROM items";
    const q3 = `SELECT tin FROM companies WHERE company_name = ?;`;

    // Fetch quotation data and items
    try {
      const [dataItem] = await pool.promise().query(q2);
      const [dataQuotation] = await pool.promise().query(q, [ref]);

      // Set the company name
      let companyName = dataQuotation[0].BillTo;

      // Fetch the TIN number of the company
      const [dataTIN] = await pool.promise().query(q3, [companyName]);

      // If selectedIds is provided, filter the data
      let filteredData = dataQuotation;
      if (selectedIds.length > 0) {
        filteredData = dataQuotation.filter((quotation) => selectedIds.includes(quotation.id));
      }

      // Return the filtered or full data
      return res.json(dataForSo(filteredData, dataItem, dataTIN));
    } catch (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: 'Query error' });
    }

  } catch (err) {
    console.error('Database query error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


const dataForSo = (qoData, itemsData, companyTIN) => {
  
  const soData = qoData.map(qoItem => {
    // Find the corresponding item in itemsData based on the 'size' key
    let item = itemsData.find(item => item.size === qoItem.Size );
    
    // If a matching item is found, add itemCode and voltage to the qoItem
    if (item) {
      return {
        ...qoItem,  // Spread the qoItem data
        itemCode: item.itemCode,  // Add itemCode from itemsData
        unit: `METER`,
        voltage: item.voltage,     // Add voltage from itemsData
        tin: companyTIN[0].tin,
        soDate: new Date(),
        amd: 0
      };
    } else {
      // If no matching item is found, return the qoItem as is (or handle it differently)
      return qoItem;
    }
  });

  return soData;
};

// Sales Order route to fetch data
app.get("/get_sales_order/:soId", (req, res) => {
  const soId = req.params.soId;
  const year = req.query.year;

  // Validate input
  if (!soId || !year) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const tableName = generateSoTableName(year);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const q = `SELECT * FROM ${escapedTableName} WHERE soRefNum= ?`;
  pool.query(q,[soId], (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    
    return res.json(data);
  })

})

// Sales Order route to fetch data for di
app.get("/get_so_for_di/:soToDi", async (req, res) => {
  const soId = req.params.soToDi;
  const year = req.query.year;
  const idFilter = req.query.filterIds;

  // Convert the ids string back to an array
  const selectedIds = idFilter ? idFilter.split(',').map(id => parseInt(id)) : [];

  // Validate input
  if (!soId || !year) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Fetch DI data
  const diTableName = generateDiTableName(year);
  const escapedDiTableName = mysql.escapeId(diTableName);

  const diQ = `SELECT * FROM ${escapedDiTableName} WHERE soRefNum = ?;`;
  const soTableName = generateSoTableName(year);
  const escapedSoTableName = mysql.escapeId(soTableName);

  const soQ = `SELECT * FROM ${escapedSoTableName} WHERE soRefNum = ?;`;

  try {
    let diRows = [];
    try {
      [diRows] = await pool.promise().query(diQ, [soId]);
    } catch (diError) {
      // Handle case where the DI table does not exist
      if (diError.code === 'ER_NO_SUCH_TABLE') {
        console.warn(`DI table "${diTableName}" does not exist for year: ${year}`);
      } else {
        throw diError; // Re-throw if it's a different error
      }
    }

    let [soRows] = await pool.promise().query(soQ, [soId]);

    if(selectedIds.length > 0) {
      soRows = soRows.filter((item) => selectedIds.includes(item.id));
    }

    if (soRows.length === 0) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    // Combine sales order data with delivery data
    if(diRows) {
      const combinedData = soRows.map(soItem => {
        const diItem = diRows.find(di => di.soId === soItem.id);
        const deliveredQty = diItem ? diItem.deliveredQty : 0;

        return {
          ...soItem,
          deliveredQty,
          status: deliveredQty >= soItem.QTY ? 'delivered' : 'undelivered',
        };
      });
    

    // Filter delivered and undelivered items
    const deliveredItems = combinedData.filter(item => item.status === 'delivered');
    const undeliveredItems = combinedData.filter(item => item.status === 'undelivered');

    return res.status(200).json({
      message: 'Sales order data retrieved',
      deliveredItems,
      undeliveredItems,
      deliveredCount: deliveredItems.length,
      undeliveredCount: undeliveredItems.length,
    });
  } else {
    // when no di table
    return res.status(200).json({
      message: 'Sales order data retrieved',
      deliveredItems: [],
      undeliveredItems: soRows,
      deliveredCount: 0,
      undeliveredCount: 0,
    });
  }
}
  catch (err) {
    console.error('Database query error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
const dataForDi = (filteredData) => {
  
  const diData = filteredData.map(soItem => {

    const { BeforeVAT, AMD, tin, ...remainingFields } = soItem;
    // Tolerance is a factor that affects the delivery and fulfillment of the order, not the initial agreement.
    return {
      ...remainingFields,
      diDate: new Date(), // Add diDate
      "tolerancePercentage": 5,
      "deliveredQty": soItem.QTY,
      amd: 0, // Add amd with a fallback value
    };
  });

  return diData;
};


// Delivery Instruction route to fetch data
app.get("/get_delivery_instruction/:diId", (req, res) => {
  const diId = req.params.diId;
  const year = req.query.year;

  // Validate input
  if (!diId || !year) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const tableName = generateDiTableName(year);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const q = `SELECT * FROM ${escapedTableName} WHERE diRefNum= ?`;
  pool.query(q,[diId], (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    
    return res.json(data);
  })

})


// Delete quotation item route
app.delete("/delete_quotation/:id", (req, res) => {
  const id = req.params.id;
  const year = req.query.year;
  const month = req.query.month;

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const q = `DELETE FROM ${escapedTableName} WHERE id= ?`;
  pool.query(q,[id], (err, data) => {
    if(err) {
      console.error('Deleting error:', err);
      return res.status(500).json({error: 'Error deleting data' });
    } else{
      res.send({message: 'Data deleted successfully'})
    }
  })
});

// Delete sales order item route
app.delete("/delete_sales_order/:itemId", (req, res) => {
  const id = req.params.itemId;
  const year = req.query.year;

  const tableName = generateSoTableName(year);
  
  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);
  
  const q = `DELETE FROM ${escapedTableName} WHERE id= ?`;
  pool.query(q,[id], (err, data) => {
    if(err) {
      console.error('Deleting error:', err);
      return res.status(500).json({error: 'Error deleting data' });
    } else{
      res.send({message: 'Data deleted successfully'})
    }
  })
});

// Delete sales order item route
app.delete("/delete_delivery_instruction/:itemId", (req, res) => {
  const id = req.params.itemId;
  const year = req.query.year;

  const tableName = generateDiTableName(year);
  
  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);
  
  const q = `DELETE FROM ${escapedTableName} WHERE id= ?`;
  pool.query(q,[id], (err, data) => {
    if(err) {
      console.error('Deleting error:', err);
      return res.status(500).json({error: 'Error deleting data' });
    } else{
      res.send({message: 'Data deleted successfully'})
    }
  })
});


// Updadte quotation item route
app.put("/update_quotation/:id", (req, res) => {
  const id = req.params.id;
  const year = req.query.year;
  const month = req.query.month;

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const data = req.body;

  // checking for empty values
  Object.values(data).forEach((item) => {
    if (!item) {
           return res.status(400).json({ error: `${field} is required` });
         }
  })



  const q = `UPDATE ${escapedTableName} 
            SET refNum = ?, 
                sales_rep_id = ?, 
                Name = ?, 
                Date = ?, 
                BillTo = ?, 
                Size = ?, 
                Description = ?, 
                Qty = ?, 
                colour = ?, 
                Packing = ?, 
                UnitPrice = ?, 
                BeforeVAT = ? 
            WHERE id = ?`;

  const values = [
    data.refNum,
    data.sales_rep_id,
    data.Name,
    data.Date.split('T')[0], // Convert to date
    data.BillTo,
    data.Size,
    data.Description,
    data.QTY,
    data.Colour,
    data.Packing,
    data.UnitPrice,
    data.BeforeVAT,
    id
  ];

  pool.query(q,values, (err, data) => {
    if(err) {
      console.error('Updating error:', err);
      return res.status(500).json({error: 'Error Updating data' });
    } else{
      res.send({message: 'Data updated successfully'})
    }
  })
});

// Update quotation item Bill To
app.put("/update_quotation/billto/:ref", (req, res) => {
  const ref = req.params.ref;
  const year = req.query.year;
  const month = req.query.month;

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const data = req.body;

  // checking for empty values
  Object.values(data).forEach((item) => {
    if (!item) {
           return res.status(400).json({ error: `${field} is required` });
         }
  })

  const q = `UPDATE ${escapedTableName} 
            SET BillTo = ? 
            WHERE refNum = ?`;

  console.log('Data is', data);
  const values = [data.billToEdit, ref];



  pool.query(q,values, (err, data) => {
    if(err) {
      console.error('Updating error:', err);
      return res.status(500).json({error: 'Error Updating data' });
    } else{
      res.send({message: 'Data updated successfully'})
    }
  })
});

// Updadte sales order item route
app.put("/update_sales_order/:itemId", (req, res) => {
  const id = req.params.itemId;
  const year = req.query.year;

  const tableName = generateSoTableName(year);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const data = req.body;

  // checking for empty values
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') {
      // Return immediately to prevent further execution
      return res.status(400).json({ error: `${key} is required` });
    }
  }

  const q = `UPDATE ${escapedTableName} 
            SET qoId = ?,
                soRefNum = ?,
                qoRefNum = ?, 
                sales_rep_id = ?, 
                Name = ?, 
                qoDate = ?,
                soDate = ?, 
                BillTo = ?, 
                tin = ?,
                Size = ?, 
                itemDescription = ?,
                itemCode = ?,
                Colour = ?,
                Volt = ?,
                Unit = ?, 
                QTY = ?,
                Packing = ?, 
                UnitPrice = ?, 
                BeforeVAT = ?,
                AMD = ? 
            WHERE id = ?`;

  const values = [
    data.qoId,
    data.soRefNum,
    data.qoRefNum,
    data.sales_rep_id,
    data.Name,
    data.qoDate.split('T')[0], // Convert to date
    data.soDate.split('T')[0],
    data.BillTo,
    data.tin,
    data.Size,
    data.itemDescription,
    data.itemCode,
    data.Colour,
    data.Volt,
    data.Unit,
    data.QTY,
    data.Packing,
    data.UnitPrice,
    data.BeforeVAT,
    data.AMD,
    id
  ];

  pool.query(q,values, (err, data) => {
    if(err) {
      console.error('Updating error:', err);
      return res.status(500).json({error: 'Error Updating data' });
    } else{
      res.send({message: 'Data updated successfully'})
    }
  })
});

// Updadte delivery instruction item route
app.put("/update_delivery_instruction/:itemId", (req, res) => {
  const id = req.params.itemId;
  const year = req.query.year;

  const tableName = generateDiTableName(year);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const data = req.body;

  // checking for empty values
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') {
      // Return immediately to prevent further execution
      return res.status(400).json({ error: `${key} is required` });
    }
  }

  const q = `UPDATE ${escapedTableName} 
            SET qoId = ?,
                soId = ?,
                diRefNum = ?,
                soRefNum = ?,
                qoRefNum = ?, 
                sales_rep_id = ?, 
                Name = ?, 
                qoDate = ?,
                soDate = ?,
                diDate = ?, 
                BillTo = ?, 
                Size = ?, 
                itemDescription = ?,
                itemCode = ?,
                Colour = ?,
                Volt = ?,
                Unit = ?, 
                orderedQty = ?,
                deliveredQty = ?,
                Packing = ?, 
                UnitPrice = ?, 
                tolerance = ?,
                AMD = ? 
            WHERE id = ?`;

  const values = [
    data.qoId,
    data.soId,
    data.diRefNum,
    data.soRefNum,
    data.qoRefNum,
    data.sales_rep_id,
    data.Name,
    data.qoDate.split('T')[0],
    data.soDate.split('T')[0],
    data.diDate.split('T')[0],
    data.BillTo,
    data.Size,
    data.itemDescription,
    data.itemCode,
    data.Colour,
    data.Volt,
    data.Unit,
    data.orderedQty,
    data.deliveredQty,
    data.Packing,
    data.UnitPrice,
    data.tolerance,
    data.AMD,
    id
  ];

  pool.query(q,values, (err, data) => {
    if(err) {
      console.error('Updating error:', err);
      return res.status(500).json({error: 'Error Updating data' });
    } else{
      res.send({message: 'Data updated successfully'})
    }
  })
});

// Update item price by id
app.put('/api/items/update/price:id', (req, res) => {
  const itemId = req.params.id;
  const { price } = req.body;

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Invalid price value.' });
  }

  const query = 'UPDATE items SET price = ? WHERE idItems = ?';
  pool.query(query, [price, itemId], (err, result) => {
    if (err) {
      console.error('Error updating price:', err.message);
      return res.status(500).json({ error: 'Failed to update price.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json({ message: 'Price updated successfully.' });
  });
});


// Items size, desc and price route
app.get("/suggestions/items", (req,res) => {

  const q = "SELECT * FROM items";
  pool.query(q, (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })

})

// Get companies and it's info
app.get("/suggestions/billto",(req, res) => {
  const q = "SELECT * FROM companies";
  pool.query(q, (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })
})

// Get Sales info
app.get("/suggestions/sales/person",(req, res) => {
  const q = "SELECT sales_rep_id, first_name FROM sales_representative";
  pool.query(q, (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })
})

// Get Sales person contact info
app.get("/sales/person/contact/:salesId",(req, res) => {
  const idSales = req.params.salesId;
  const q = "SELECT * FROM sales_representative WHERE sales_rep_id = ?";
  pool.query(q, [idSales], (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })
})

// get last reference of the quotation table
// if table doesn't exist create it
async function getLastRef() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Dynamically generate the table name
  const tableName = generateTableName(year, month);
   
  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  try {
      // Check if the table exists
      const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
      const [result] = await pool.promise().query(checkTableQuery);

      if (result.length === 0) {
          // Table does not exist, create it
          const createTableQuery = `
              CREATE TABLE ${tableName} (
                  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
                  refNum INT NOT NULL,
                  sales_rep_id INT NOT NULL,
                  Name VARCHAR(100) NOT NULL,
                  Date DATE NOT NULL,
                  BillTo VARCHAR(255) NOT NULL,
                  Size VARCHAR(50) NOT NULL,
                  Description VARCHAR(50) NOT NULL,
                  QTY INT NOT NULL,
                  Colour VARCHAR(50) NOT NULL,
                  Packing VARCHAR(50) NOT NULL,
                  UnitPrice DECIMAL(10, 2) NOT NULL,
                  BeforeVAT DECIMAL(20, 2) NOT NULL
              );
          `;
          await pool.promise().query(createTableQuery);
      }

      // Table exists, get the last reference number
      const selectRefQuery = `SELECT refNum FROM ${tableName} ORDER BY refNum DESC LIMIT 1`;
      const [refResult] = await pool.promise().query(selectRefQuery);

      // Return the last refNum or 0 if none exists
      return refResult.length > 0 ? (++refResult[0].refNum) : 1;

  } catch (err) {
      console.error('Error in getLastRef:', err);
      return 0; // Return 0 on error
  }
}


// Add items to to quotation table
app.post("/create/quotation", async (req, res) => {

  try {
     // Fetch the last reference number
     const idRef = await getLastRef();

     // Ensure `req.body` is an array of objects
     const objectsArray = req.body.map((object) => ({
       ...object,
       ref: idRef, // Add idRef as refNum to each object
     }));

    // Get the current year and month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Format month as two digits

    // Dynamically generate the table name
    const tableName = generateTableName(year, month);
   
    // Escape table name for safety
    const escapedTableName = mysql.escapeId(tableName);

    // Map each object to a promise of the database insertion
    const insertionPromises = objectsArray.map(object => {
      const q = `INSERT INTO ${escapedTableName} (\`refNum\`, \`sales_rep_id\`, \`Name\`, \`Date\`, \`BillTo\`, \`Size\`, \`Description\`, \`Qty\`, \`colour\`, \`Packing\`, \`UnitPrice\`, \`BeforeVAT\`) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const values = [
        object.ref,
        object.salesRepId,
        object.name,
        new Date(object.date), // Convert date to ISO format if needed
        object.billTo,
        object.size,
        object.description,
        object.quantity,
        object.colour,
        object.packing,
        object.unitPrice,
        object.beforeVat
      ];

      return new Promise((resolve, reject) => {
        pool.query(q, values, (err, data) => {
          if (err) {
            reject(err); // Reject the promise if there is an error
          } else {
            resolve(data); // Resolve the promise if the query is successful
          }
        });
      });
    });

    // Wait for all insertion promises to complete
    await Promise.all(insertionPromises);

    // Send response after all insertions
     res.json({ message: "Proformas have been added", idRef });

  } catch (err) {
    // Handle any errors that occurred during insertion
    res.status(500).json({ error: err.message });
  }
});

// Add Additional items to quotation table
app.post("/add/edit", async (req, res) => {
  const objectsArray = req.body; // Ensure this is an array of objects

  const year = req.query.year;
  const month = req.query.month;

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  try {
    // Map each object to a promise of the database insertion
    const insertionPromises = objectsArray.map(object => {
      const q = `INSERT INTO ${escapedTableName} (\`refNum\`, \`sales_rep_id\`, \`Name\`, \`Date\`, \`BillTo\`, \`Size\`, \`Description\`, \`Qty\`, \`colour\`, \`Packing\`, \`UnitPrice\`, \`BeforeVAT\`) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const values = [
        object.ref,
        object.salesRepId,
        object.name,
        new Date(object.date), // Convert date to ISO format if needed
        object.billTo,
        object.size,
        object.description,
        object.quantity,
        object.colour,
        object.packing,
        object.unitPrice,
        object.beforeVat
      ];

      return new Promise((resolve, reject) => {
        pool.query(q, values, (err, data) => {
          if (err) {
            reject(err); // Reject the promise if there is an error
          } else {
            resolve(data); // Resolve the promise if the query is successful
          }
        });
      });
    });

    // Wait for all insertion promises to complete
    await Promise.all(insertionPromises);

    // Send response after all insertions
    res.json("Proformas have been added");

  } catch (err) {
    // Handle any errors that occurred during insertion
    res.status(500).json({ error: err.message });
  }
});

// Route to send so data to DB
app.post("/send_so_to_db", async (req, res) => {
  const today = new Date();
  const year = today.getFullYear();
  let soRefNumber;

  // Create table name dynamically based on the year
  const tableName = `sales_order_${year}`;

  // Utility function to handle database queries with promises
  const queryPromise = (query, values = []) => {
    return new Promise((resolve, reject) => {
      pool.query(query, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  try {
    // Check if the table exists
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    const tableExists = await queryPromise(checkTableQuery);

    // Process the incoming data (ensure it's an array of objects)
    const objectsArray = req.body;

    if (!Array.isArray(objectsArray)) {
      return res.status(400).json({ error: 'Expected an array of objects' });
    }


    // If the table does not exist, create it
    if (tableExists.length === 0) {
      // Create table
      const createTableQuery = `
        CREATE TABLE ${tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
          qoId INT NOT NULL,
          soRefNum INT NOT NULL,
          qoRefNum INT NOT NULL,
          sales_rep_id INT NOT NULL,
          Name VARCHAR(100) NOT NULL,
          qoDate DATE NOT NULL,
          soDate DATE NOT NULL,
          BillTo VARCHAR(255) NOT NULL,
          tin VARCHAR(50) NOT NULL,
          Size VARCHAR(50) NOT NULL,
          itemDescription VARCHAR(50) NOT NULL,
          itemCode VARCHAR(50) NOT NULL,
          Colour VARCHAR(50) NOT NULL,
          Volt VARCHAR(50) NOT NULL,
          Unit VARCHAR(50) NOT NULL,
          QTY INT NOT NULL,
          Packing VARCHAR(50) NOT NULL,
          UnitPrice DECIMAL(10, 2) NOT NULL,
          BeforeVAT DECIMAL(20, 2) NOT NULL,
          AMD INT NOT NULL
        );
      `;
      await queryPromise(createTableQuery);

      soRefNumber = 1;

    } else {
      // Table exists, get the last reference number (id)
      const selectRefQuery = `SELECT soRefNum FROM ${tableName} ORDER BY id DESC LIMIT 1`;
      const result = await queryPromise(selectRefQuery);
      if(result && result[0]) {
        soRefNumber = result[0].soRefNum + 1; // Increment the id to get the next reference number
      } else {
        soRefNumber = 1;
      }
    }

    // Prepare the insertion query
    const escapedTableName = mysql.escapeId(tableName); // Escape table name for security
    const insertionPromises = objectsArray.map(object => {
      const insertQuery = `INSERT INTO ${escapedTableName} (\`qoId\`, \`soRefNum\`, \`qoRefNum\`, \`sales_rep_id\`, \`Name\`, \`qoDate\`, \`soDate\`, \`BillTo\`, \`tin\`, \`Size\`, \`itemDescription\`, \`itemCode\`, \`Colour\`, \`Volt\`, \`Unit\`, \`QTY\`, \`Packing\`, \`UnitPrice\`, \`BeforeVAT\`, \`AMD\`) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      object.id,
      soRefNumber,
      object.refNum,
      object.sales_rep_id,
      object.Name,
      new Date(object.Date), // Convert date to ISO format if needed
      new Date(),
      object.BillTo,
      object.tin,
      object.Size,
      object.Description,
      object.itemCode,
      object.Colour,
      object.voltage,
      object.unit,
      object.QTY,
      object.Packing,
      object.UnitPrice,
      object.BeforeVAT,
      object.amd
      ];
      // Return the promise for insertion
      return queryPromise(insertQuery, values);
    });

    // Wait for all insertions to complete
    await Promise.all(insertionPromises);

    // Send the ID of the newly created item back
    res.status(201).json({ soId: soRefNumber});

  } catch (err) {
    // Handle any errors that occurred during the process
    console.error("Error occurred:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route to send di data db
app.post("/send_di_to_db", async (req, res) => {
  const today = new Date();
  const year = today.getFullYear();
  let diRefNumber;

  // Create table name dynamically based on the year
  const tableName = `delivery_instruction_${year}`;

  // Utility function to handle database queries with promises
  const queryPromise = (query, values = []) => {
    return new Promise((resolve, reject) => {
      pool.query(query, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  try {
    // Check if the table exists
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    const tableExists = await queryPromise(checkTableQuery);

    // Process the incoming data (ensure it's an array of objects)
    const objectsArray = req.body;

    if (!Array.isArray(objectsArray)) {
      return res.status(400).json({ error: 'Expected an array of objects' });
    }


    // If the table does not exist, create it
    if (tableExists.length === 0) {
      // Create table
      const createTableQuery = `
        CREATE TABLE ${tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
          qoId INT NOT NULL,
          soId INT NOT NULL,
          diRefNum INT NOT NULL,
          soRefNum INT NOT NULL,
          qoRefNum INT NOT NULL,
          sales_rep_id INT NOT NULL,
          Name VARCHAR(100) NOT NULL,
          qoDate DATE NOT NULL,
          soDate DATE NOT NULL,
          diDate DATE NOT NULL,
          BillTo VARCHAR(255) NOT NULL,
          Size VARCHAR(50) NOT NULL,
          itemDescription VARCHAR(50) NOT NULL,
          itemCode VARCHAR(50) NOT NULL,
          Colour VARCHAR(50) NOT NULL,
          Volt VARCHAR(50) NOT NULL,
          Unit VARCHAR(50) NOT NULL,
          orderedQty INT NOT NULL,
          deliveredQty INT NOT NULL,
          Packing VARCHAR(50) NOT NULL,
          UnitPrice DECIMAL(10, 2) NOT NULL,
          tolerance INT,
          AMD INT
        );
      `;
      await queryPromise(createTableQuery);

      diRefNumber = 1;

    } else {
      // Table exists, get the last reference number (id)
      const selectRefQuery = `SELECT diRefNum FROM ${tableName} ORDER BY id DESC LIMIT 1`;
      const result = await queryPromise(selectRefQuery);
      if(result && result[0]) {
        diRefNumber = result[0].diRefNum + 1; // Increment the id to get the next reference number
      } else {
        diRefNumber = 1;
      }
    }

    // Prepare the insertion query
    const escapedTableName = mysql.escapeId(tableName); // Escape table name for security
    const insertionPromises = objectsArray.map(object => {
      const insertQuery = `INSERT INTO ${escapedTableName} (\`qoId\`, \`soId\`,\`diRefNum\`, \`soRefNum\`, \`qoRefNum\`, \`sales_rep_id\`, \`Name\`, \`qoDate\`, \`soDate\`, \`diDate\`,\`BillTo\`, \`Size\`, \`itemDescription\`, \`itemCode\`, \`Colour\`, \`Volt\`, \`Unit\`, \`orderedQty\`, \`deliveredQty\`, \`Packing\`, \`UnitPrice\`, \`tolerance\`, \`AMD\`) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      object.qoId,
      object.id,
      diRefNumber,
      object.soRefNum,
      object.qoRefNum,
      object.sales_rep_id,
      object.Name,
      new Date(object.qoDate), // Convert date to ISO format if needed
      new Date(object.soDate),
      new Date(),
      object.BillTo,
      object.Size,
      object.itemDescription,
      object.itemCode,
      object.Colour,
      object.Volt,
      object.Unit,
      object.QTY,
      object.deliveredQty,
      object.Packing,
      object.UnitPrice,
      object.tolerancePercentage,
      object.amd
      ];
      // Return the promise for insertion
      return queryPromise(insertQuery, values);
    });

    // Wait for all insertions to complete
    await Promise.all(insertionPromises);

    // Send the ID of the newly created item back
    res.status(201).json({ diId: diRefNumber});

  } catch (err) {
    // Handle any errors that occurred during the process
    console.error("Error occurred:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add contacts
app.post("/api/add_contact", (req, res) => {
  const { company_name, region, city, tin, contact_person, phone_number, email_address, website_url, address, industry_sector, parent_company } = req.body;

  // Validation (you can enhance this part with better checks)
  if (!company_name || !contact_person || !phone_number || !email_address) {
    return res.status(400).json({ error: 'Company name, contact person, phone number, and email address are required.' });
  }

  // SQL query to insert the data into the database
  const query = `INSERT INTO companies (company_name, region, city, tin, contact_person, phone_number, email_address, website_url, address, industry_sector, parent_company)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Values to be inserted into the database
  const values = [
    company_name,
    region,
    city,
    tin,
    contact_person,
    phone_number,
    email_address,
    website_url,
    address,
    industry_sector,
    parent_company
  ];

  // Execute the query to insert data into the database
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data: ', err);
      return res.status(500).json({ error: 'Error adding the contact' });
    }

    // Return a success message if insertion is successful
    return res.status(201).json({
      message: 'Contact added successfully',
      data: {
        id: result.insertId, // Return the ID of the newly inserted contact
        company_name,
        contact_person
      }
    });
  });
});



// Middleware to verify token
// authenticateToken middleware verifies the JWT token sent in the Authorization header

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/// Endpoint to handle login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Execute a query to retrieve the user by email
    const results = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    
    const singleResult = results[0];
    const user = singleResult[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Error handling login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Example protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
