const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Set view engine to ejs
app.set('view engine', 'ejs');

// Create a connection pool using the connection information provided on bit.io.
const pool = new Pool({
  user: 'Matt-Bruce111', // Username, Leave as Matt-Bruce111 for now
  host: 'db.bit.io', // Always db.bit.io
  database: 'Matt-Bruce111/inv1', // public database 
  password: 'v2_3zqF7_ptTKqKXWCFasAWNRcdeXPxU', // key from bit.io database page connect menu
  port: 5432,
  ssl: true,
});

app.get('/', async (req, res) => {
  // var invData = await getInvData();
  // ### Currently not displaying the data in the html page, believed to be an async issue as the page is being loaded before the data is fetched from bit.io
  res.render('index.ejs', { data: await getInvData() })
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function getInvData(){
  var invData = [];
  // Select everything from inventory table
  pool.query('SELECT * FROM "inventory";', (err, res) => {
    invData = res.rows;
    console.log(invData);
  })
  return invData;
}