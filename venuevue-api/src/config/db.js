const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  beforeConnect: (conn) => {
    // Set QUOTED_IDENTIFIER to ON to prevent SQL Server errors
    conn.on('connect', () => {
      conn.execSql(new sql.Request('SET QUOTED_IDENTIFIER ON'));
    });
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    
    // Set session options immediately after connection
    pool.request().query('SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;')
      .catch(err => console.log('Failed to set session options:', err));
    
    return pool;
  })
  .catch(err => console.log('Database Connection Failed!', err));

module.exports = {
  sql, poolPromise
};
