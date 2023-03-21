const express = require('express');
const { Pool } = require('pg');
const app = express();
const bp = require('body-parser'); 
const port = 3000;

// Set view engine to ejs
app.set('view engine', 'ejs');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

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
  res.render('index.ejs', { data: await getInvData() });
});

app.get('/view', async (req, res) => {

  res.render('view.ejs', { data: await getItemData(req.query.id) });
});

app.get('/delete', async (req, res) => {

  res.render('delete.ejs', { data: await getItemData(req.query.id) });
});

app.post('/delete_confirm', async (req, res) => {
  await deleteItemData(req.body.id);
  res.redirect('/');
});

app.post('/edit_confirm', async (req, res) => {
  var body = req.body;
  await editItemData(body.itemDesc. body.category, body.condition, body.possession, body.qty, body.id);
  res.redirect('/');
});
app.get('/edit', async (req, res) => {
  res.render('edit.ejs', { data: await getItemData(req.query.id) });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function getInvData(){
  var invData = [];
  // Select everything from inventory table
  try{
  invData =  (await pool.query('SELECT * FROM "inventory";' )).rows;}
  catch(e){
    throw e;
  }
  return invData;
}

async function editItemData(itemDesc, category, condition, possession, qty, id){
  var invData = [];
  // Select everything from inventory table
  try{
  invData =  (await pool.query(`UPDATE 'inventory' SET 'item_desc' = ${itemDesc}, 'category' = ${category}, 'condition' = ${condition}, 'possession' = ${possession}, 'qty' = ${qty} WHERE 'id' = ${id} ;` )).rows;}
  catch(e){
    throw e;
  }
  return invData;
}

async function getItemData(id){
  var itemData;
  // Select everything from inventory table
  try{
    itemData =  (await pool.query(`SELECT * FROM "inventory" WHERE "itemid" = ${id};` )).rows;}
  catch(e){
    throw e;
  }
  console.log(itemData);
  return itemData;
}

async function deleteItemData(id){
  // Select everything from inventory table
  console.log(id);
  try{
    await pool.query(`DELETE FROM "inventory" WHERE "itemid" = ${id}` );}
  catch(e){
    throw e;
  }
}