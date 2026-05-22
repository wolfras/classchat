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

async function updatePasswords() {
  try {
    // Generate hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const studentHash = await bcrypt.hash('student123', 10);
    
    console.log('Updating admin password...');
    await pool.query('UPDATE class_users SET password = $1 WHERE username = $2', [adminHash, 'admin']);
    
    console.log('Updating student passwords...');
    await pool.query('UPDATE class_users SET password = $1 WHERE is_admin = FALSE', [studentHash]);
    
    console.log('✅ All passwords updated successfully!');
    console.log('Admin password: admin123');
    console.log('Student password: student123');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

updatePasswords();