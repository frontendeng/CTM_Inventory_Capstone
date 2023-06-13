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
app.use(express.urlencoded({ extended: true }));

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
  // console.log(req.oidc.user)
  var userCompletedSignUp = await hasUserCompletedSignUp(req)
  
  // If user has not completed sign up process redirect them to the complete sign up page, otherwise show them the home page
  if (userCompletedSignUp == false) {
    res.redirect('user/complete_signup')
  } else {
    res.render('inventory/viewall.ejs', { 
      data: await getAllItems(), 
      isAuthenticated: req.oidc.isAuthenticated(),
      user: req.oidc.user
    });
  }
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
    const allItems = (await pool.query("SELECT item_id, item_desc, category, purchase_date, condition, item_qty, keywords, " +
    " u.first_name AS first_name, u.last_name AS last_name, c.street_line_1 AS c_street_line_1, c.street_line_2 AS c_street_line_2, c.city AS c_city, " + 
    " c.state AS c_state, c.country AS c_country, c.postcode AS c_postcode, p.street_line_1 AS p_street_line_, " +
    " p.street_line_2 AS p_street_line_2, p.city AS p_city, p.state AS p_state, p.country AS p_country, p.postcode AS p_postcode " +
    " FROM inventory AS i JOIN users u ON u.user_id = i.user_id JOIN address c ON c.address_id = i.current_address " +
    " LEFT JOIN address p ON p.address_id = i.previous_address  ORDER BY item_id;")).rows;
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
    const getItem = (await pool.query("SELECT item_id, item_desc, category, purchase_date, condition, item_qty, keywords, " +
    " u.first_name AS first_name, u.last_name AS last_name, c.street_line_1 AS c_street_line_1, c.street_line_2 AS c_street_line_2, c.city AS c_city," + 
    " c.state AS c_state, c.country AS c_country, c.postcode AS c_postcode, p.street_line_1 AS p_street_line_, " +
    " p.street_line_2 AS p_street_line_2, p.city AS p_city, p.state AS p_state, p.country AS p_country, p.postcode AS p_postcode " +
    " FROM inventory AS i JOIN users u ON u.user_id = i.user_id JOIN address c ON c.address_id = i.current_address " +
    " LEFT JOIN address p ON p.address_id = i.previous_address WHERE i.item_id=$1", [id])).rows;
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
    address: await getAllAddresses(),
    users: await getAllUsers()
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

async function getAllUsers(){
  try{
    const allUsers = (await pool.query("SELECT user_id, first_name, last_name FROM users ORDER BY first_name")).rows;
    return allUsers;
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
    const {item_desc, category, purchase_date, condition, item_qty, user_id, current_address, previous_address, keywords} = req.body;
    const newItem = await pool.query("INSERT INTO inventory (item_desc, category, purchase_date, condition, item_qty, user_id, current_address, previous_address, keywords) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *", [item_desc, category, purchase_date, condition, parseInt(item_qty), user_id, parseInt(current_address), previous_address ? parseInt(previous_address):null, keywords]);
    
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
    address: await getAllAddresses(),
    users: await getAllUsers()
  });
});

app.post('/edit_confirm', isAdmin, async (req, res) => {
  var body = req.body;
  await editItemData(req);
  res.redirect('/');
});

async function editItemData(req){
  var invData = [];
  // Select everything from inventory table
  const {item_desc, category, purchase_date, condition, item_qty, user_id, current_address, previous_address, keywords} = req.body;
  try{
    invData =  (await pool.query(`UPDATE inventory SET item_desc = '${item_desc}', category = '${category}', purchase_date = ${purchase_date} 'condition' = ${condition}, item_qty = ${item_qty}, user_id = '${user_id}', current_address = ${current_address}, previous_address = ${previous_address}, keywords = '${keywords}' WHERE item_id = ${id} ;` )).rows;}
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
    const deleteItem = await pool.query("DELETE FROM inventory WHERE item_id=$1", [id]);
    //res.json("Item was successfully deleted!");
  } catch (err)
  {
    console.error(err.message) 
  }
}

// Find address in database
async function findAddress(address){
  try {
    // Destructure the address data from the request body
    var { street_line_1, street_line_2, city, state, postcode, country } = address;
    
    // Query the database to see if the address already exists
    var address = await pool.query(`SELECT * FROM "address" WHERE street_line_1 = '${street_line_1}' AND street_line_2 = '${street_line_2}' AND city = '${city}' AND state = '${state}' AND postcode = '${postcode}' AND country = '${country}'`);
    address = address.rows[0];

    console.log("Checking if address exists")
    if(address == undefined){
      console.log(`Address does not exist`)
      return false
    } else {
      console.log(`Address already exists in database`)
      return address
    }
  } catch (err) {
    console.error(err.message);
  }
}

// Adds new address to database as long as there isnt an exact match
async function addAddress(req){
  try{
    // Destructure the address data from the request body
    const { street_line_1, street_line_2, city, state, postcode, country } = req.body;
    
    // Create a new address object
    const newAddress = {
      //address_id: 1,
      street_line_1: street_line_1,
      street_line_2: street_line_2,
      city: city,
      state: state,
      country: country,
      postcode: postcode
    }
    
    // Query the database to see if the address already exists
    var doesAddressExist = await findAddress(newAddress);
    
    // If the address already exists, do not add it to the database
    if(!doesAddressExist){
      console.log(`Adding new address`)
      try {
        const addAddress = await pool.query("INSERT INTO address (street_line_1, street_line_2, city, state, postcode, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [street_line_1, street_line_2, city, state, postcode, country]);
        console.log(`Address added to database`)
      } catch (err) {
        console.error(err.message)
      }
    }
  } catch (err){
    console.error(err.message)
  }
}

// Checks if the current user has completed sign up process
async function hasUserCompletedSignUp(req){
  try {
    // Get the user id from the request
    const userId = req.oidc.user.sub;
    
    // May need to init signUpComplete to null
    var signUpComplete = null;
    
    // Query the database to see if the user already exists in the users table
    var signUpComplete = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    signUpComplete = signUpComplete.rows

    // If the user already exists, they have completed sign up
    if(signUpComplete.length == 1){
      console.log(`User has already completed sign up`)
      return true;
    } else {
      // If the user does not exist, return false, this will determine whether the user is redirected to the complete sign up page
      console.log(`User has not completed sign up`)
      return false;
    }
  } catch (err) {
    console.error(err.message)
  }
}

// Adds new user to database
async function completeSignUp(req){
  // Add the users address to the database
  await addAddress(req);
  
  // Find the address id of the address that was just added
  console.log("Finding address for user")
  const address = await findAddress(req.body);
  addressId = address.address_id;
  
  // Create a new user object
  const completedUser = {
    user_id: req.oidc.user.sub,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    contact_no: req.body.contact_no,
    address_id: addressId,
  }
  
  // Add the user to the database
  try {
    const addCompletedUser = await pool.query("INSERT INTO users (user_id, first_name, last_name, contact_no, address_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [completedUser.user_id, completedUser.first_name, completedUser.last_name, completedUser.contact_no, completedUser.address_id]);

    console.log(`User added to database`)
  } catch (err) {
    console.error(err.message);
  }
}

app.get('/user/complete_signup', async (req, res) => {
  res.render('inventory/complete_signup.ejs', { 
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  })
})

app.post('/user/complete_signup', async (req, res) => {
  await completeSignUp(req);
  
  res.redirect('/');
})


app.get('/test/add_address', async (req, res) => {
  res.render('inventory/add_address_temp.ejs', { 
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  })
})

app.post('/test/add_address', async (req, res) => {
  //console.log(req.body)
  await addAddress(req);
  res.redirect('/');
});

//users
app.get('/users', async (req, res) => {
  // Log whether the user is logged in or not
  //console.log(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
  res.render('users/administer_users.ejs', { 
    data: await getAllUsers(), 
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

// Get all users
app.get("/users/viewall_users", async(req, res) => {
  res.render('users/viewall_users.ejs', { 
    data: await getAllUsers(),
    //isAuthenticated: req.oidc.isAuthenticated(),
    //user: req.oidc.user 
  });
});

// Get all users function
async function getAllUsers(){
  try{
    const allUsers = (await pool.query("SELECT * FROM users")).rows;
    return allUsers;
  } catch (err)
  {
    console.error(err.message) 
  }
}

// Get one user
app.get("/users/viewone_user/:id", async(req, res) => {
  res.render('users/viewone_user.ejs', { 
    data: await getOneUser(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

// Get one user function
async function getOneUser(req){
  const { id } = req.params;
  try{
    const getUser = (await pool.query("SELECT * FROM users WHERE user_id=$1", [id])).rows;
    //console.log(getUser);
    return getUser;
  } catch (err)
  {
    console.error(err.message) 
  }
}

//edit user
app.get('/users/edit_user/:id', async (req, res) => {
  res.render('users/edit_user.ejs', { 
    data: await getOneUser(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user, 
  });
});

app.post('/edit_user', isAdmin, async (req, res) => {
  var body = req.body;
  console.log(req.body); 
  await editUser(body.id, body.firstname, body.lastname, body.phonenumber);
  res.redirect('/users/viewall_users');
});

async function editUser(id, firstName, lastName, phoneNumber){
  var userData = [];
  try{
    userData =  (await pool.query(`UPDATE users SET first_name = '${firstName}', last_name = '${lastName}', contact_no = ${phoneNumber} WHERE user_id = ${id};` )).rows;}
  catch(e){
    throw e;
  }
  return userData;
}

// Delete an user
app.get('/users/delete_user/:id', async (req, res) => {
  res.render('users/delete_user.ejs', { 
    data: await getOneUser(req),
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user
  });
});

app.post('/delete_user', isAdmin, async (req, res) => {
  await deleteUser(req)
  res.redirect('/users/viewall_users');
});

async function deleteUser(req){
  try{
    const id = req.body.id; 
    const deleteUser = await pool.query("DELETE FROM users WHERE user_id=$1", [id]);
    } catch (err)
  {
    console.error(err.message) 
  }
}


// Start the Server 
app.listen(port, () => {
  console.log(`CTM Inventory App, listening on port ${port}`);
});