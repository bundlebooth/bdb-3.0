const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// Check if Windows Authentication should be used (no user/password provided)
const useWindowsAuth = !process.env.DB_USER || !process.env.DB_PASSWORD;

// Build connection string for msnodesqlv8
const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME};Trusted_Connection=yes;`;

const config = useWindowsAuth ? {
  connectionString: connectionString,
  driver: 'msnodesqlv8',
  pool: {
    max: 50,
    min: 5,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000
  }
} : {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  driver: 'msnodesqlv8',
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
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.log('Database Connection Failed!', err);
    throw err;
  });

module.exports = {
  sql, poolPromise
};
