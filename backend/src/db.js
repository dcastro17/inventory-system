const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
