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

async function fixPasswords() {
  try {
    // Generate fresh hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const studentHash = await bcrypt.hash('student123', 10);
    
    console.log('Generated hashes:');
    console.log('admin123:', adminHash);
    console.log('student123:', studentHash);
    
    // Update admin
    await pool.query('UPDATE class_users SET password = $1 WHERE username = $2', [adminHash, 'admin']);
    console.log('✅ Admin password updated');
    
    // Update all students
    const result = await pool.query('UPDATE class_users SET password = $1 WHERE is_admin = FALSE', [studentHash]);
    console.log(`✅ ${result.rowCount} student passwords updated`);
    
    // Verify
    const verify = await pool.query('SELECT id, username, password FROM class_users LIMIT 3');
    console.log('\nVerification:');
    verify.rows.forEach(u => {
      console.log(`${u.username}: ${u.password.substring(0, 30)}...`);
    });
    
    // Test login
    const admin = await pool.query('SELECT * FROM class_users WHERE username = $1', ['admin']);
    const valid = await bcrypt.compare('admin123', admin.rows[0].password);
    console.log('\nTest admin login with "admin123":', valid ? '✅ WORKS' : '❌ FAILS');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPasswords();