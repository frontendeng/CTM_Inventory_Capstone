const express = require('express');
const axios = require("axios").default;
const { Pool } = require('pg');
const app = express();
const bp = require('body-parser');
require('dotenv').config();
// Auth0 Connect Library
const { auth, requiresAuth } = require('express-openid-connect');
const port = 3000;

// Import middleware
const isAdmin = require('./middleware/auth.js');

// Auth0 config
const config = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASEURL,
  clientID: process.env.CLIENTID,
  issuerBaseURL: process.env.ISSUER
};

// Set view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static("views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// Create a connection pool using the connection information provided on bit.io.
const pool = new Pool({
  user: process.env.USER, // User
  host: process.env.HOST, // Always db.bit.io
  database: process.env.DATABASE, // public database name
  password: process.env.PASSWORD, // password
  port: process.env.PORT, 
  ssl: true,
});

app.get('/', async (req, res) => {
  // Log whether the user is logged in or not
  //console.log(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
  res.render('inventory/viewall.ejs', { 
    data: await getAllItems(), 
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

// The /profile route will show the user profile as JSON
// app.get('/profile', requiresAuth(), (req, res) => {
//   res.send(JSON.stringify(req.oidc.user, null, 2));
// });

// Get all item
app.get("/inventory/viewall", async(req, res) => {
  res.render('inventory/viewall.ejs', { 
    data: await getAllItems(),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user });
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
  res.render('inventory/viewone.ejs', { 
    data: await getOneItem(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

// Get one item function
async function getOneItem(req){
  const { id } = req.params;
  try{
    const getItem = (await pool.query("SELECT * FROM ctm_inventory INNER JOIN address ON ctm_inventory.address_id = address.address_id WHERE item_id=$1", [id])).rows;
    //console.log(getItem);
    return getItem;
  } catch (err)
  {
    console.error(err.message) 
  }
}


// Add item
app.get('/inventory/add', async (req, res) => {
  res.render('inventory/add.ejs', {
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user,
    address: await getAllAddresses() 
  });
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
  res.render('inventory/viewall.ejs', { 
    isAuthenticated: req.oidc.isAuthenticated(),
    user:req.oidc.user,
    data: await getAllItems() });
  
});

async function addItem(req){
  console.log("This is addItem", req.body);
  var invData = [];
  try{
    const {item_desc, category, possession, condition, qty, currentaddress, previousLocation} = req.body;
    const newItem = await pool.query("INSERT INTO ctm_inventory (item_desc, category, possession, condition, qty, address_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [item_desc, category, possession, condition, qty, parseInt(currentaddress)]);
    
  } catch (err)
    {
       console.error(err.message) 
    }
    return invData;
};


// Edit Item
app.get('/inventory/edit/:id', async (req, res) => {
  res.render('inventory/edit.ejs', { 
    data: await getOneItem(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user, 
    address: await getAllAddresses() 
  });
});

app.post('/edit_confirm', isAdmin, async (req, res) => {
  var body = req.body;
  console.log(body);
  console.log(body.currentaddress)
  await editItemData(body.id, body.itemdesc, body.currentaddress, /* body.condition,*/ body.qty, body.possession, body.category);
  res.redirect('/');
});

async function editItemData(id, itemDesc,/*condition, */ currentaddress, qty, possession, category){
  var invData = [];
  // Select everything from inventory table
  try{
    invData =  (await pool.query(`UPDATE ctm_inventory SET item_desc = '${itemDesc}', category = '${category}',`/* 'condition' = ${condition},*/+` address_id = ${currentaddress}, possession = '${possession}', qty = ${qty} WHERE item_id = ${id} ;` )).rows;}
  catch(e){
    throw e;
  }
  return invData;
}

// Delete an item
app.get('/inventory/delete/:id', async (req, res) => {
  res.render('inventory/delete.ejs', { 
    data: await getOneItem(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

app.post('/delete_confirm', isAdmin, async (req, res) => {
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

// Start the Server 
app.listen(port, () => {
  console.log(`CTM Inventory App, listening on port ${port}`);
});