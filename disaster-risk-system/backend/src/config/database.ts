import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'disaster_risk_db',
  user: process.env.DB_USER || 'disaster_user',
  password: process.env.DB_PASSWORD || '123456',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

// 创建数据库连接池
export const pool = new Pool(dbConfig);

// 数据库连接测试
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('数据库连接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

// 执行查询的通用方法
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('执行查询:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('查询执行失败:', { text, error });
    throw error;
  }
};

// 事务执行方法
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 优雅关闭数据库连接
export const closeConnection = async (): Promise<void> => {
  await pool.end();
  console.log('数据库连接池已关闭');
};