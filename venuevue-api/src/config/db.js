require('dotenv').config();

// Detect environment: use msnodesqlv8 only on Windows for local dev with Windows Auth
// Use standard tedious driver for production (Linux/Render) or when credentials are provided
const isWindows = process.platform === 'win32';
const useWindowsAuth = isWindows && (!process.env.DB_USER || !process.env.DB_PASSWORD);

// Load appropriate driver
const sql = useWindowsAuth ? require('mssql/msnodesqlv8') : require('mssql');

let config;

if (useWindowsAuth) {
  // Windows local development with Windows Authentication
  // For named instances, use format: Server\Instance
  const serverName = process.env.DB_SERVER || 'localhost';
  const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${process.env.DB_NAME};Trusted_Connection=yes;`;
  config = {
    connectionString: connectionString,
    driver: 'msnodesqlv8',
    pool: {
      max: 50,
      min: 5,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000
    }
  };
} else {
  // Production (Linux/Render) or SQL Server Authentication
  config = {
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
}

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
