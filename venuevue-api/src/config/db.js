require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
  pool: {
    max: 50,
    min: 5,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed!', err);
    throw err;
  });

module.exports = {
  sql, poolPromise
};
