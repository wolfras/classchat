import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'class_users',
});

async function testLogin() {
  try {
    // Get admin user
    const result = await pool.query('SELECT * FROM class_users WHERE username = $1', ['admin']);
    const user = result.rows[0];
    
    console.log('User:', user.username);
    console.log('Hash:', user.password.substring(0, 30) + '...');
    
    // Test bcrypt compare
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('Password "admin123" valid?', isValid);
    
    // Generate a fresh hash for comparison
    const freshHash = await bcrypt.hash('admin123', 10);
    console.log('Fresh hash:', freshHash.substring(0, 30) + '...');
    const freshValid = await bcrypt.compare('admin123', freshHash);
    console.log('Fresh hash valid?', freshValid);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();