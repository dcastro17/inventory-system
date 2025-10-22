const db = require('../db');

async function list(req, res, next) {
  const r = await db.query('SELECT id,sku,name,description,price,active FROM products');
  res.json(r.rows);
}
async function get(req, res, next) {
  const r = await db.query('SELECT id,sku,name,description,price,active FROM products WHERE id=$1', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}
async function create(req, res, next) {
  const { sku, name, description, price, active } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name required' });
  const r = await db.query('INSERT INTO products (sku,name,description,price,active) VALUES ($1,$2,$3,$4,$5) RETURNING id,sku,name,description,price,active', [sku,name,description||'',price||0,active!==false]);
  // create inventory row
  await db.query('INSERT INTO inventory (product_id,stock) VALUES ($1,$2) ON CONFLICT (product_id) DO NOTHING', [r.rows[0].id, 0]);
  res.status(201).json(r.rows[0]);
}
async function update(req, res, next) {
  const { sku, name, description, price, active } = req.body;
  const id = req.params.id;
  await db.query('UPDATE products SET sku=$1,name=$2,description=$3,price=$4,active=$5 WHERE id=$6', [sku,name,description||'',price||0,active!==false,id]);
  const r = await db.query('SELECT id,sku,name,description,price,active FROM products WHERE id=$1', [id]);
  res.json(r.rows[0]);
}
async function remove(req, res, next) {
  await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}

module.exports = { list, get, create, update, remove };
