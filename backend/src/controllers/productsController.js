const db = require('../db');

async function list(req, res, next) {
  try {
    const r = await db.query(`
      SELECT 
        p.id, p.sku, p.name, p.description, p.price, p.active,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.active = true
      ORDER BY p.name
    `);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const r = await db.query(`
      SELECT 
        p.id, p.sku, p.name, p.description, p.price, p.active,
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

async function get(req, res, next) {
  try {
    const r = await db.query(`
      SELECT 
        p.id, p.sku, p.name, p.description, p.price, p.active,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { sku, name, description, price, active } = req.body;
    if (!sku || !name) return res.status(400).json({ error: 'sku and name required' });

    const r = await db.query(`
      INSERT INTO products (sku, name, description, price, active)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, sku, name, description, price, active
    `, [sku, name, description || '', price || 0, active !== false]);

    // Crear fila en inventory con stock inicial 0
    await db.query(`
      INSERT INTO inventory (product_id, stock)
      VALUES ($1, 0)
      ON CONFLICT (product_id) DO NOTHING
    `, [r.rows[0].id]);

    // Devolver producto con stock
    const product = await db.query(`
      SELECT 
        p.id, p.sku, p.name, p.description, p.price, p.active,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `, [r.rows[0].id]);

    res.status(201).json(product.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { sku, name, description, price, active, stock } = req.body;
    const id = req.params.id;

    await db.query(`
      UPDATE products SET sku=$1, name=$2, description=$3, price=$4, active=$5
      WHERE id=$6
    `, [sku, name, description || '', price || 0, active !== false, id]);

    // Opcional: actualizar stock si se envía
    if (stock !== undefined) {
      await db.query(`
        INSERT INTO inventory (product_id, stock)
        VALUES ($1, $2)
        ON CONFLICT (product_id) DO UPDATE SET stock = $2
      `, [id, stock]);
    }

    const r = await db.query(`
      SELECT 
        p.id, p.sku, p.name, p.description, p.price, p.active,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `, [id]);

    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listAll, get, create, update, remove };
