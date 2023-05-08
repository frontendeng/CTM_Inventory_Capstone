const express = require('express');
const { Pool } = require('pg');
const app = express();
const bp = require('body-parser'); 
const port = 3000;

// Set view engine to ejs
//app.set('views', './backend/views');
app.set('view engine', 'ejs');
app.use(express.static("views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  res.render('viewall.ejs', { data: await getAllItems() });
});

// Get all item
app.get("/inventory/viewall", async(req, res) => {
  res.render('viewall.ejs', { data: await getAllItems() });
});

// Get all items function
async function getAllItems(){
  try{
    const allItems = (await pool.query("SELECT * FROM ctm_inventory ORDER BY item_id")).rows;
    return allItems;
  } catch (err)
  {
    console.error(err.message) 
  }
}

// Get one item
app.get("/inventory/viewone/:id", async(req, res) => {
  res.render('viewone.ejs', { data: await getOneItem(req) });
});

// Get one item function
async function getOneItem(req){
  const { id } = req.params;
  try{
    const getItem = (await pool.query("SELECT * FROM ctm_inventory WHERE item_id=$1", [id])).rows;
    //console.log(getItem);
    return getItem;
  } catch (err)
  {
    console.error(err.message) 
  }
}


// Add item
app.get('/inventory/add', async (req, res) => {
  res.render('add.ejs');
});

app.post('/inventory/add', async (req, res) => {
  console.log(req.body)
  await addItem(req);
  res.render('viewall.ejs', { data: await getAllItems() });
  
});

async function addItem(req){
  console.log("This is addItem", req.body);
  var invData = [];
  try{
    const {item_desc, category, possession, condition, qty} = req.body;
    const newItem = await pool.query("INSERT INTO ctm_inventory (item_desc, category, possession, condition, qty) VALUES ($1, $2, $3, $4, $5) RETURNING *", [item_desc, category, possession, condition, qty]);
  
  } catch (err)
    {
       console.error(err.message) 
    }
    return invData;
};


// Edit Item
app.get('/inventory/edit/:id', async (req, res) => {
  res.render('edit.ejs', { data: await getOneItem(req) });
});

app.post('/edit_confirm', async (req, res) => {
  var body = req.body;
  console.log(body);
  await editItemData(body.id, body.itemdesc,/* body.condition,*/ body.qty, body.possession, body.category);
  res.redirect('/');
});

async function editItemData(id, itemDesc, qty, possession, category){
  var invData = [];
  // Select everything from inventory table
  try{
  invData =  (await pool.query(`UPDATE ctm_inventory SET item_desc = '${itemDesc}', category = '${category}',`/* 'condition' = ${condition},*/ +`possession = '${possession}', qty = ${qty} WHERE item_id = ${id} ;` )).rows;}
  catch(e){
    throw e;
  }
  return invData;
}


// Delete an item
app.get('/inventory/delete/:id', async (req, res) => {
  res.render('delete.ejs', { data: await getOneItem(req) });
});

app.post('/delete_confirm', async (req, res) => {
  await deleteItem(req)
  res.redirect('/');
});

async function deleteItem(req){
  try{
    const id = req.body.id; 
    const deleteItem = await pool.query("DELETE FROM ctm_inventory WHERE item_id=$1", [id]);
    //res.json("Item was successfully deleted!");
  } catch (err)
  {
    console.error(err.message) 
  }
}


app.listen(port, () => {
  console.log(`CTM Inventory App, listening on port ${port}`);
});

module.exports = app;
module.exports = { getOneItem };