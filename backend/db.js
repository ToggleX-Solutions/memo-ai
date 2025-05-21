const { Pool } = require('pg');
const config = require('../config/config.json');

const pool = new Pool({
  connectionString: config.database_url
});

module.exports = pool; 