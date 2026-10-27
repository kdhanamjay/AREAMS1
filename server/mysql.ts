import mysql from 'mysql2/promise';

export function getMySQLConfig() {
  const host = process.env.MYSQL_HOST || process.env.MYSQL_SERVER || 'localhost';
  const database = process.env.MYSQL_DATABASE || 'eams_db';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306;

  if (!process.env.MYSQL_HOST && !process.env.MYSQL_USER) {
    return null;
  }

  return {
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

let pool: mysql.Pool | null = null;

export function getMySQLPool(): mysql.Pool | null {
  const config = getMySQLConfig();
  if (!config) return null;

  if (!pool) {
    try {
      pool = mysql.createPool(config);
    } catch (err) {
      console.error('❌ Failed to initialize MySQL Pool:', err);
      pool = null;
    }
  }
  return pool;
}

export async function testMySQLConnection(): Promise<{ connected: boolean; message: string; version?: string }> {
  try {
    const config = getMySQLConfig();
    if (!config) {
      return {
        connected: false,
        message: 'MySQL environment variables (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD) are not configured. Currently using local JSON store.'
      };
    }

    const currentPool = getMySQLPool();
    if (!currentPool) {
      return {
        connected: false,
        message: 'Unable to initialize MySQL 8.0 connection pool.'
      };
    }

    const [rows]: [any[], any] = await currentPool.query('SELECT VERSION() as version, DATABASE() as dbName');
    const version = rows[0]?.version || 'MySQL 8.0';
    const dbName = rows[0]?.dbName || config.database;

    return {
      connected: true,
      message: `Successfully connected to MySQL [${dbName}] (Version: ${version})`,
      version
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `MySQL Error: ${err?.message || err}`
    };
  }
}
