const db = require('../db');

// Crear una venta
// Body: { customerId, items: [{productId, variant, qty, price}], total }
async function createSale(req, res) {
  const { customerId, items, total } = req.body;

  if (!customerId) return res.status(400).json({ error: 'customerId required' });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items required' });

  for (const it of items) {
    if (!it.productId || !Number.isInteger(it.qty) || it.qty <= 0)
      return res.status(400).json({ error: 'invalid item' });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Verificar cliente
    const customerCheck = await client.query('SELECT id FROM customers WHERE id=$1', [customerId]);
    if (!customerCheck.rows[0]) throw new Error('Customer not found');

    // Crear la venta
    const saleRes = await client.query(
      `INSERT INTO sales (user_id, customer_id, total)
       VALUES ($1, $2, $3)
       RETURNING id, total, created_at`,
      [req.user.id, customerId, total]
    );

    const saleId = saleRes.rows[0].id;

    // Insertar items y actualizar stock
    for (const it of items) {
      const p = await client.query(
        'SELECT stock FROM inventory WHERE product_id=$1 FOR UPDATE',
        [it.productId]
      );
      const stockRow = p.rows[0];
      if (!stockRow) throw new Error('No inventory row for product ' + it.productId);
      if (stockRow.stock < it.qty) throw new Error('Insufficient stock for product ' + it.productId);

      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, variant, qty, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, it.productId, it.variant || null, it.qty, it.price]
      );

      await client.query(
        `UPDATE inventory SET stock = stock - $1, updated_at = now() WHERE product_id = $2`,
        [it.qty, it.productId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: saleId,
      total,
      created_at: saleRes.rows[0].created_at,
      user_name: req.user.email || null,
      customer: { id: customerId },
      items,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

// Listar todas las ventas
async function list(req, res) {
  try {
    const r = await db.query(`
      SELECT s.id, s.user_id, u.email AS user_name,
             s.customer_id, c.name AS customer_name, s.total, s.created_at
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.id DESC
    `);

    const sales = r.rows.map(sale => ({
      id: sale.id,
      total: sale.total,
      created_at: sale.created_at,
      user_name: sale.user_name || null, // email del usuario
      customer: sale.customer_name
        ? { id: sale.customer_id, name: sale.customer_name }
        : null,
    }));

    res.json(sales);
  } catch (err) {
    console.error('Error listing sales:', err);
    res.status(500).json({ error: 'No se pudieron obtener las ventas' });
  }
}

// Obtener una venta con cliente e items
async function get(req, res) {
  try {
    const saleRes = await db.query(`
      SELECT s.id, s.user_id, u.email AS user_name,
             s.customer_id, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             s.total, s.created_at
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);

    const sale = saleRes.rows[0];
    if (!sale) return res.status(404).json({ error: 'Not found' });

    const itemsRes = await db.query(`
      SELECT si.id, si.product_id, p.name, si.variant, si.qty, si.price
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `, [req.params.id]);

    res.json({
      id: sale.id,
      total: sale.total,
      created_at: sale.created_at,
      user_name: sale.user_name || null,
      customer: sale.customer_name
        ? {
            id: sale.customer_id,
            name: sale.customer_name,
            email: sale.customer_email,
            phone: sale.customer_phone,
          }
        : null,
      items: itemsRes.rows,
    });
  } catch (err) {
    console.error('Error getting sale:', err);
    res.status(500).json({ error: 'No se pudo obtener la venta' });
  }
}

module.exports = { createSale, list, get };
