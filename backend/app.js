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
  user: 'HarleyMcDonald', // User
  host: 'db.bit.io', // Always db.bit.io
  database: 'Matt-Bruce111/inv1', // public database name
  password: 'v2_43hQz_rWPH2AtgmySamTsZAYgeCGw', // password
  port: 5432, 
  ssl: true,
});


app.get('/', async (req, res) => {
  res.render('inventory/viewall.ejs', { data: await getAllItems() });
});

// Get all item
app.get("/inventory/viewall", async(req, res) => {
  res.render('inventory/viewall.ejs', { data: await getAllItems() });
});

// Get all items function
async function getAllItems(){
  try{
    const allItems = (await pool.query("SELECT * FROM ctm_inventory INNER JOIN address ON address.address_id = ctm_inventory.address_id ORDER BY item_id")).rows;
    return allItems;
  } catch (err)
  {
    console.error(err.message) 
  }
}

// Get one item
app.get("/inventory/viewone/:id", async(req, res) => {
  res.render('inventory/viewone.ejs', { data: await getOneItem(req) });
});

// Get one item function
async function getOneItem(req){
  const { id } = req.params;
  try{
    const getItem = (await pool.query("SELECT * FROM ctm_inventory INNER JOIN address ON address_id = address_id WHERE item_id=$1", [id])).rows;
    //console.log(getItem);
    return getItem;
  } catch (err)
  {
    console.error(err.message) 
  }
}


// Add item
app.get('/inventory/add', async (req, res) => {
  res.render('inventory/add.ejs', {address: await getAllAddresses() });
});

async function getAllAddresses(){
  try{
    const allAddresses = (await pool.query("SELECT * FROM address ORDER BY city")).rows;
    return allAddresses;
  } catch (err)
  {
    console.error(err.message) 
  }
}

app.post('/inventory/add', async (req, res) => {
  console.log(req.body)
  await addItem(req);
  res.render('inventory/viewall.ejs', { data: await getAllItems() });
  
});

async function addItem(req){
  console.log("This is addItem", req.body);
  var invData = [];
  try{
    const {item_desc, category, possession, condition, qty, currentLocation, previousLocation} = req.body;
    const newItem = await pool.query("INSERT INTO ctm_inventory (item_desc, category, possession, condition, qty, address_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [item_desc, category, possession, condition, qty, currentLocation]);
    
  } catch (err)
    {
       console.error(err.message) 
    }
    return invData;
};


// Edit Item
app.get('/inventory/edit/:id', async (req, res) => {
  res.render('inventory/edit.ejs', { data: await getOneItem(req), address: await getAllAddresses()});
});

app.post('/edit_confirm', async (req, res) => {
  var body = req.body;
  console.log(body);
  await editItemData(body.id, body.itemdesc,/* body.condition, body.address_id, body.line_1, body.line_2, body.city, body.state, body.post, body.country,*/ body.qty, body.possession, body.category);
  res.redirect('/');
});

async function editItemData(id, itemDesc,/* condition, address_id, line_1, line_2, city, state, post, country,*/ qty, possession, category){
  var invData = [];
  // Select everything from inventory table
  try{
    if(address_id === "" ?? null){
      const newAddress = await pool.query("INSERT INTO address (street_line_1, street_line_2, city, state, postcode, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [line_1, line_2, city, state, post, country]);
      address_id = newAddress.address_id;
    }
  invData =  (await pool.query(`UPDATE ctm_inventory SET item_desc = '${itemDesc}', category = '${category}',`/* 'condition' = ${condition}, 'address_id' = ${address_id},*/ +`possession = '${possession}', qty = ${qty} WHERE item_id = ${id} ;` )).rows;}
  catch(e){
    throw e;
  }
  return invData;
}


// Delete an item
app.get('/inventory/delete/:id', async (req, res) => {
  res.render('inventory/delete.ejs', { data: await getOneItem(req) });
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