const { Connection, Request } = require('tedious');

const config = {
  server: process.env.DB_SERVER || 'your-azure-sql-server.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'your-username',
      password: process.env.DB_PASSWORD || 'your-password'
    }
  },
  options: {
    database: process.env.DB_NAME || 'EventBookingPlatform',
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
};

const getConnection = () => {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);
    connection.on('connect', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
    connection.connect();
  });
};

const executeQuery = async (query, parameters = []) => {
  const connection = await getConnection();
  
  return new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      connection.close();
      if (err) {
        reject(err);
      } else {
        resolve({ rowCount, rows });
      }
    });

    // Add parameters if any
    parameters.forEach(param => {
      request.addParameter(param.name, param.type, param.value);
    });

    connection.execSql(request);
  });
};

module.exports = {
  getConnection,
  executeQuery
};
