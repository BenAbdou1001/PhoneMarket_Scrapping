const mysql = require('mysql2/promise');
const config = require('../config/database');

let pool;

const getConnection = async () => {
  if (!pool) {
    pool = mysql.createPool(config.database);
  }
  return pool;
};

const query = async (sql, params = []) => {
  const connection = await getConnection();
  try {
    // Use query() instead of execute() to avoid parameter binding issues
    const [results] = await connection.query(sql, params || []);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const transaction = async (callback) => {
  const connection = await getConnection();
  const conn = await connection.getConnection();
  
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  getConnection,
  query,
  transaction
};
