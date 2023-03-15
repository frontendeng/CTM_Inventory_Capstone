const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");

// Set view engine to ejs
app.set('view engine', 'ejs');
// This line is needed to load bootstrap correctly
app.use(express.static("views"));

app.use(express.json()); //add req.body
app.use(express.urlencoded({ extended: false }));
//app.use(bodyParser.json());


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
  res.render('index.ejs', { data: await getInvData() });
});


async function getInvData(){
  var invData = [];
  // Select everything from ctm_inventory table
  try{
    invData =  (await pool.query('SELECT * FROM "ctm_inventory";' )).rows;
  }
  catch(e){
    throw e;
  }
  return invData;
}


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


//add item
app.post("/inventory/add", async(req, res) => {
  try{
    const {item_desc, category, possession, condition, qty} = req.body;
    const newItem = await pool.query("INSERT INTO ctm_inventory (item_desc, category, possession, condition, qty) VALUES ($1, $2, $3, $4, $5) RETURNING *", [item_desc, category, possession, condition, qty]);
    res.json(newItem.rows[0]);
  } catch (err)
    {
       console.error(err.message) 
    }
});

//get all item
app.get("/inventory/get", async(req, res) => {
  try{
    const getItems = await pool.query("SELECT * FROM ctm_inventory");
    res.json(getItems.rows);
  } catch (err)
    {
       console.error(err.message) 
    }
});

//get one item
app.get("/inventory/get/:id", async(req, res) => {
  const { id } = req.params;
  try{
    const getItem = await pool.query("SELECT * FROM ctm_inventory WHERE item_id=$1", [id]);
    res.json(getItem.rows);
  } catch (err)
    {
       console.error(err.message) 
    }
});

//update an item
app.put("/inventory/:id", async(req, res) => {
  try{
    const { id } = req.params; 
    const { item_desc, category, possession, condition, qty } = req.body; 
    const getItem = await pool.query("UPDATE ctm_inventory SET item_desc= $1, category= $2, possession=$3, condition= $4, qty=$5 WHERE item_id=$6", [item_desc, category, possession, condition, qty, id]);
    res.json("Item was updated!");
  } catch (err)
    {
       console.error(err.message) 
    }
});

//delete an item
app.delete("/inventory/:id", async(req, res) => {
  try{
    const { id } = req.params; 
    const deleteItem = await pool.query("DELETE FROM ctm_inventory WHERE item_id=$1", [id]);
    res.json("Item was successfully deleted!");
  } catch (err)
    {
       console.error(err.message) 
    }
});

