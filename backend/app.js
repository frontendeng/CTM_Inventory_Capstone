const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Set view engine to ejs
app.set('view engine', 'ejs');
// This line is needed to load bootstrap correctly
app.use(express.static("views"));

// Create a connection pool using the connection information provided on bit.io.
const pool = new Pool({
  user: '', // User
  host: 'db.bit.io', // Always db.bit.io
  database: '', // public database name
  password: '', // password
  port: 5432, 
  ssl: true,
});

app.get('/', async (req, res) => {
  res.render('viewall.ejs', { data: await getInvData() });
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function getInvData(){
  var invData = [];
  // Select everything from inventory table
  try{
    invData =  (await pool.query('SELECT * FROM "inventory";' )).rows;
  }
  catch(e){
    throw e;
  }
  return invData;
}