const express = require('express');
const axios = require("axios").default;
const { Pool } = require('pg');
const app = express();
const bp = require('body-parser');
require('dotenv').config();
// Auth0 Connect Library
const { auth } = require('express-openid-connect');
const port = 3000;

// Auth0 config
const config = {
  authRequired: false,
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
   console.log(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
   var user = req.oidc.user;
   getUserRole(user)
   // console.log(req.oidc.user)
   res.render('inventory/viewall.ejs', { 
     data: await getAllItems(), 
     isAuthenticated: req.oidc.isAuthenticated(),
     user: req.oidc.user
   });
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
  res.render('inventory/edit.ejs', { 
    data: await getOneItem(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user, 
    address: await getAllAddresses() 
  });
});

app.post('/edit_confirm', async (req, res) => {
  var body = req.body;
  console.log(body);
  await editItemData(body.id, body.itemdesc,/* body.condition,*/ body.qty, body.possession, body.category);
  res.redirect('/');
});

async function editItemData(id, itemDesc,/* condition, address_id,*/ qty, possession, category){
  var invData = [];
  // Select everything from inventory table
  try{
    if(address_id === "" ?? null){
      const newAddress = await pool.query("INSERT INTO address (street_line_1, street_line_2, city, state, postcode, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [line_1, line_2, city, state, post, country]);
      address_id = newAddress.address_id;
    }
  invData =  (await pool.query(`UPDATE ctm_inventory SET item_desc = '${itemDesc}', category = '${category}',`/* 'condition' = ${condition},*/+` 'address_id' = ${address_id}, possession = '${possession}', qty = ${qty} WHERE item_id = ${id} ;` )).rows;}
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


// Auth0 ManagementAPI Token
async function getManagementToken(){
  var options = {
    method: 'POST',
    url: 'https://dev-lbh35xzftxelxza1.us.auth0.com/oauth/token',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'ZOFyCniuZ1GI85bzfhbnq6Wl0SLQiRb2',
      client_secret: 'AXIyKkwvJr-Oh62VNvIkAwI8y5jiq-7TTOc_3YFqYkZJzAQHJdrvBP5GoTBNHJv6',
      audience: 'https://dev-lbh35xzftxelxza1.us.auth0.com/api/v2/'
    })
  };
  
  var token;
  
  // Make request to Auth0 Management API
  const response = await axios.request(options)
  
  // Get token from response
  token = response.data.access_token;
  
  // Return token
  return token;
}

// Get a user's role
async function getUserRole(user){
  // Fetch the Auth0 Management API token
  var token = await getManagementToken()
  //console.log(token)
  
  // If user is logged in, get their user id
  if(user){
    var userId = user.sub
    
    const options = {
      url: "https://dev-lbh35xzftxelxza1.us.auth0.com/api/v2/users/" + userId,
      method: 'GET',
      headers: { 
        'content-type': 'application/json', 
        'authorization': 'Bearer ' + token
      }
    }

    // Make request to Auth0 Management API 
    const response = await axios.request(options)
    console.log(response.data.app_metadata)
  } else {
    console.log("No user")
  }
  

}

getUserRole()

module.exports = app;
module.exports = { getOneItem };