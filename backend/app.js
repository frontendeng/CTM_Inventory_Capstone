const express = require('express');
const { Pool } = require('pg');
const app = express();
const bp = require('body-parser'); 
const port = 3000;

// Set view engine to ejs
app.set('views', './backend/views');
app.set('view engine', 'ejs');
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

// Create a connection pool using the connection information provided on bit.io.
const pool = new Pool({
  user: '', // User
  host: 'db.bit.io', // Always db.bit.io
  database: '', // public database name
  password: '', // password
  port: 5432, 
  ssl: true,
});

app.post('/edit_confirm', async (req, res) => {
  var body = req.body;
  console.log(body);
  await editItemData(body.id, body.itemdesc,/* body.condition,*/ body.qty, body.possession, body.category);
  res.redirect('/');
});
app.get('/edit', async (req, res) => {
  res.render('edit', { data: await getItemData(req.query.id) });
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
    console.log(getItem);
    return getItem;
  } catch (err)
  {
    console.error(err.message) 
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


// Add item
app.post("/inventory/add", async(req, res) => {
  try{
    const {item_desc, category, possession, condition, qty} = req.body;
    const newItem = await pool.query("INSERT INTO ctm_inventory (item_desc, category, possession, condition, qty) VALUES ($1, $2, $3, $4, $5) RETURNING *", [item_desc, category, possession, condition, qty]);
    res.json(newItem.rows[0]);
  } catch (err){
    console.error(err.message) 
  }
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
