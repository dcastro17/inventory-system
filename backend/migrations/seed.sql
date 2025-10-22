INSERT INTO users (email, password, role)
VALUES (
  'admin@example.com',
  '$2b$10$7Q.CQ2gfkphsmOT6pdmOOO60Ds9zFzv8ivFFpIjWaZImWcTMLHZkC', -- hash de "adminpass"
  'admin'
);

-- seed: 2 products, 1 admin user (password: adminpass)
INSERT INTO products (sku, name, description, price, active)
VALUES
('001','Blusa Amarilla','Producto inicial A',20000,true),
('002','Pantalon Rojo','Producto inicial B',30000,true)
ON CONFLICT DO NOTHING;

-- set inventory
INSERT INTO inventory (product_id, stock)
SELECT id, 10 FROM products WHERE sku='001' ON CONFLICT (product_id) DO NOTHING;
INSERT INTO inventory (product_id, stock)
SELECT id, 5 FROM products WHERE sku='002' ON CONFLICT (product_id) DO NOTHING;

INSERT INTO customers (name, email, phone, address)
VALUES ('Diego Castro', 'diegocastro@example.com', '+506 83012768', 'Av. Central 123');
