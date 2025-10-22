INSERT INTO users (email, password, role)
VALUES (
  'admin@example.com',
  '$2b$10$7Q.CQ2gfkphsmOT6pdmOOO60Ds9zFzv8ivFFpIjWaZImWcTMLHZkC', -- hash de "adminpass"
  'admin'
);

-- seed: 2 products, 1 admin user (password: adminpass)
INSERT INTO products (sku, name, description, price, active)
VALUES
('SKU-001','Producto A','Producto inicial A',10.00,true),
('SKU-002','Producto B','Producto inicial B',20.00,true)
ON CONFLICT DO NOTHING;

-- set inventory
INSERT INTO inventory (product_id, stock)
SELECT id, 10 FROM products WHERE sku='SKU-001' ON CONFLICT (product_id) DO NOTHING;
INSERT INTO inventory (product_id, stock)
SELECT id, 5 FROM products WHERE sku='SKU-002' ON CONFLICT (product_id) DO NOTHING;
