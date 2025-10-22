const db = require('../db');

// Body: { items: [{productId, variant, qty, price}], total }
async function createSale(req, res, next) {
  const { items, total } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
  // basic validations
  for (const it of items) {
    if (!it.productId || !Number.isInteger(it.qty) || it.qty <= 0) return res.status(400).json({ error: 'invalid item' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const saleRes = await client.query('INSERT INTO sales (user_id,total) VALUES ($1,$2) RETURNING id, total, created_at', [req.user.id, total]);
    const saleId = saleRes.rows[0].id;
    // process items and decrement stock
    for (const it of items) {
      const p = await client.query('SELECT stock FROM inventory WHERE product_id=$1 FOR UPDATE', [it.productId]);
      const stockRow = p.rows[0];
      if (!stockRow) throw new Error('No inventory row for product ' + it.productId);
      if (stockRow.stock < it.qty) throw new Error('Insufficient stock for product ' + it.productId);
      await client.query('INSERT INTO sale_items (sale_id,product_id,variant,qty,price) VALUES ($1,$2,$3,$4,$5)', [saleId, it.productId, it.variant||null, it.qty, it.price]);
      await client.query('UPDATE inventory SET stock=stock-$1, updated_at=now() WHERE product_id=$2', [it.qty, it.productId]);
    }
    await client.query('COMMIT');
    res.status(201).json({ saleId, total, items });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function list(req, res, next) {
  const r = await db.query('SELECT id,user_id,total,created_at FROM sales ORDER BY id DESC');
  res.json(r.rows);
}
async function get(req, res, next) {
  try {
    // Traer info de la venta + email del usuario
    const sale = await db.query(`
      SELECT s.id, s.user_id, u.email AS user_email, s.total, s.created_at
      FROM sales s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [req.params.id]);

    if (!sale.rows[0]) return res.status(404).json({ error: 'Not found' });

    // Traer items con el nombre del producto
    const items = await db.query(`
      SELECT si.id, si.product_id, si.variant, si.qty, si.price, p.name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `, [req.params.id]);

    res.json({ ...sale.rows[0], items: items.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSale, list, get };
