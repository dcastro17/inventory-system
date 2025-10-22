const db = require('../db');

// Listar productos con stock y precio
async function list(req, res, next) {
  try {
    const r = await db.query(`
      SELECT 
        p.id AS product_id, 
        p.sku, 
        p.name, 
        p.price,
        p.description,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.name
    `);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
}

// Ajustar stock de un producto
async function adjust(req, res, next) {
  try {
    const pid = req.params.productId;
    const { stock } = req.body;

    if (typeof stock !== 'number') 
      return res.status(400).json({ error: 'stock must be number' });

    await db.query(`
      INSERT INTO inventory (product_id, stock)
      VALUES ($1, $2)
      ON CONFLICT (product_id) DO UPDATE 
        SET stock=$2, updated_at=now()
    `, [pid, stock]);

    const r = await db.query('SELECT product_id, stock FROM inventory WHERE product_id=$1', [pid]);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, adjust };
