const db = require('../db');

// Obtener lista de clientes
async function list(req, res, next) {
  try {
    const r = await db.query(
      'SELECT id, name, email, phone, address, created_at, updated_at FROM customers ORDER BY id DESC'
    );
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
}

// Obtener cliente por ID
async function get(req, res, next) {
  try {
    const r = await db.query(
      'SELECT id, name, email, phone, address, created_at, updated_at FROM customers WHERE id=$1',
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

// Crear nuevo cliente
async function create(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name y email son requeridos' });
    }

    const r = await db.query(
      `INSERT INTO customers (name, email, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, address, created_at, updated_at`,
      [name, email, phone || '', address || '']
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // Violación de restricción UNIQUE (email duplicado)
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    next(err);
  }
}

// Actualizar cliente existente
async function update(req, res, next) {
  try {
    const id = req.params.id;
    const { name, email, phone, address } = req.body;

    await db.query(
      `UPDATE customers 
       SET name=$1, email=$2, phone=$3, address=$4, updated_at=now() 
       WHERE id=$5`,
      [name, email, phone || '', address || '', id]
    );

    const r = await db.query(
      'SELECT id, name, email, phone, address, created_at, updated_at FROM customers WHERE id=$1',
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
}

// Eliminar cliente
async function remove(req, res, next) {
  try {
    await db.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
