const db = require('../db');

async function list(req, res, next) {
  const r = await db.query('SELECT p.id as product_id, p.sku, p.name, COALESCE(i.stock,0) as stock FROM products p LEFT JOIN inventory i ON p.id=i.product_id');
  res.json(r.rows);
}

async function adjust(req, res, next) {
  const pid = req.params.productId;
  const { stock } = req.body;
  if (typeof stock !== 'number') return res.status(400).json({ error: 'stock must be number' });
  await db.query('INSERT INTO inventory (product_id,stock) VALUES ($1,$2) ON CONFLICT (product_id) DO UPDATE SET stock=$2, updated_at=now()', [pid, stock]);
  const r = await db.query('SELECT product_id,stock FROM inventory WHERE product_id=$1', [pid]);
  res.json(r.rows[0]);
}

module.exports = { list, adjust };
