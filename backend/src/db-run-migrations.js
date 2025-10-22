const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const connection = process.env.DATABASE_URL;
if (!connection) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const init = fs.readFileSync(path.resolve(__dirname, '..', 'migrations', 'init.sql'), 'utf8');
const seed = fs.readFileSync(path.resolve(__dirname, '..', 'migrations', 'seed.sql'), 'utf8');

(async () => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: connection });
  try {
    console.log('Running migrations...');
    await pool.query(init);
    console.log('Running seed...');
    await pool.query(seed);
    console.log('Migrations and seed finished');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
