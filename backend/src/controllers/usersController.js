const db = require('../db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

async function list(req, res, next) {
  const r = await db.query('SELECT id,email,role,created_at FROM users');
  res.json(r.rows);
}
async function get(req, res, next) {
  const r = await db.query('SELECT id,email,role,created_at FROM users WHERE id=$1', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}
async function create(req, res, next) {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const r = await db.query('INSERT INTO users (email,password,role) VALUES ($1,$2,$3) RETURNING id,email,role', [email, hash, role || 'seller']);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'email exists' });
    next(err);
  }
}
async function update(req, res, next) {
  const { email, role, password } = req.body;
  const id = req.params.id;
  if (password) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query('UPDATE users SET email=$1, role=$2, password=$3 WHERE id=$4', [email, role, hash, id]);
  } else {
    await db.query('UPDATE users SET email=$1, role=$2 WHERE id=$3', [email, role, id]);
  }
  const r = await db.query('SELECT id,email,role FROM users WHERE id=$1', [id]);
  res.json(r.rows[0]);
}
async function remove(req, res, next) {
  await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}

module.exports = { list, get, create, update, remove };
