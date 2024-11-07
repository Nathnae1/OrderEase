const express = require('express');

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

const app = express();

//Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Enable CORS
app.use(cors());

app.use(bodyParser.json());

// Parse JSON bodies
app.use(express.json());

const port = 5000;

// create a connection pool - not single connectin
const pool = mysql.createPool({
  host: "localhost",
  connectionLimit: 10,
  user: "root",
  password: "password",
  database: "mydb"
})

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
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }
    return res.json(data);
  })

})

// Quotation route to fetch data to make Sales Order
app.get("/get_quotation_for_so/:qoToSoRef", (req, res) => {

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

  const tableName = generateTableName(year, month);

  // Escape table name for safety
  const escapedTableName = mysql.escapeId(tableName);

  const q = `SELECT * FROM ${escapedTableName} WHERE refNum= ?`;
  pool.query(q,[ref], (err, data) => {
    if(err) {
      console.error('Query error:', err);
      return res.status(500).json({error: 'Query error' });
    }

    if(selectedIds) {
      // Fetch and filter your data based on the selected IDs
        const filteredData = data.filter((quotation) => selectedIds.includes(quotation.id));

      // Return the filtered data
      return res.json(filteredData);
    }

    return res.json(data);
  })

})

// Delete quotatio item route
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


// Route for last quotation reference number
app.get("/get_ref", (req, res) => {

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Format month as two digits

  // Create table name dynamically based on the year and month
  const tableName = `quotation_${year}_${month}`;

  // Check if the table exists
  const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;

  pool.query(checkTableQuery, (err, result) => {
    if (err) {
      console.error('Error checking table existence:', err);
      return res.status(500).json({ error: 'Error checking table existence' });
    }

    // If the table does not exist, create it
    if (result.length === 0) {
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
          BeforeVAT DECIMAL(10, 2) NOT NULL
        );
      `;

      pool.query(createTableQuery, (err, result) => {
        if (err) {
          console.error('Error creating table:', err);
          return res.status(500).json({ error: 'Error creating table' });
        }

        console.log(`Table ${tableName} created successfully`);

        // After creating the table, insert the first reference number (refNum = 1)
        const insertRefQuery = `INSERT INTO ${tableName} (refNum) VALUES (1)`;

        pool.query(insertRefQuery, (err, result) => {
          if (err) {
            console.error('Error inserting reference number:', err);
            return res.status(500).json({ error: 'Error inserting reference number' });
          }
          console.log('Reference number 1 inserted');
          return res.json({ refNum: 1 });
        });
      });

    } else {
      // Table exists, get the last reference number
      const selectRefQuery = `SELECT refNum FROM ${tableName} ORDER BY refNum DESC LIMIT 1`;

      pool.query(selectRefQuery, (err, data) => {
        if (err) {
          console.error('Query error:', err);
          return res.status(500).json({ error: 'Query error' });
        }
        return res.json(data);
      });
    }
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


// Add items to to quotation table
app.post("/add", async (req, res) => {
  const objectsArray = req.body; // Ensure this is an array of objects

  try {
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
    res.json("Proformas have been added");

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


// Login code
//Use an environment variable in production
const JWT_SECRET = 'your_secret_key_1234';

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
  console.log('this is from react', email, password);

  try {
    // Execute a query to retrieve the user by email
    const results = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('this is results', results);

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
