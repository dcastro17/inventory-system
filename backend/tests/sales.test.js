const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

let token;
let productId;

beforeAll(async () => {
  // ensure migrations ran in CI environment
  await db.query("INSERT INTO products (sku,name,price,active) VALUES ('TEST-SKU','Test P',5,true) ON CONFLICT DO NOTHING");
  const p = await db.query("SELECT id FROM products WHERE sku='TEST-SKU'");
  productId = p.rows[0].id;
  await db.query('INSERT INTO inventory (product_id,stock) VALUES ($1,10) ON CONFLICT (product_id) DO UPDATE SET stock=10', [productId]);
  await request(app).post('/api/auth/register').send({ email: 'saleuser2@example.com', password: 'pass123', role: 'seller' });
  const res = await request(app).post('/api/auth/login').send({ email: 'saleuser2@example.com', password: 'pass123' });
  token = res.body.token;
});

test('create sale reduces stock', async () => {
  const saleBody = { items: [{ productId, qty: 2, price: 5 }], total: 10 };
  const r = await request(app).post('/api/sales').set('Authorization', `Bearer ${token}`).send(saleBody);
  expect(r.statusCode).toBe(201);
  const inv = await db.query('SELECT stock FROM inventory WHERE product_id=$1', [productId]);
  expect(inv.rows[0].stock).toBe(8);
});
