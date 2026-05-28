import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import session from 'express-session';
import pg from 'pg';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

// Production check
const isProduction = process.env.NODE_ENV === 'production';

// Database connection - Supports both local and Render PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'class_users',
  // If DATABASE_URL is provided (Render), use it as fallback
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
});

// Test database connection on startup
pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Database connected successfully at:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

const app = express();
const server = createServer(app);

// Allowed origins for CORS (local + production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://chatclass.vercel.app',
];

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return allowed === origin;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.set('trust proxy', 1);

// Session configuration - Updated for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'l3sod-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Trust proxy for Render/Heroku
if (isProduction) {
  app.set('trust proxy', 1);
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Connected users tracking
const connectedUsers = new Map();

// Helper function to get all students and emit
async function broadcastStudentUpdate() {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id');
    const students = result.rows.map(s => ({
      ...s,
      photo: s.photo ? `data:${s.photo_mime_type};base64,${s.photo.toString('base64')}` : null
    }));
    io.emit('students_updated', students);
    return students;
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}


// Health check endpoint (NEW - for Render uptime monitoring)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    onlineUsers: connectedUsers.size
  });
});

// ==================== MEMBERS ROUTE ====================
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, is_admin FROM class_users ORDER BY id'
    );
    
    const members = result.rows.map(user => ({
      id: user.id,
      name: user.full_name,
      username: user.username,
      role: user.is_admin ? 'Administrator' : 'Student',
      isAdmin: user.is_admin,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=7c3aed&color=fff&size=200`
    }));
    
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== AUTH ROUTES ====================

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('📝 Login attempt for:', email);
    
    const result = await pool.query(
      'SELECT * FROM class_users WHERE username = $1 OR full_name = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = result.rows[0];
    
    let validPassword = false;
    
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      validPassword = (password === user.password);
    }
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }
    
    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.is_admin;
    req.session.fullName = user.full_name;
    
    console.log('✅ Login successful:', user.username, '| Admin:', user.is_admin);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('🔥 Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const userId = req.session.userId;
  
  if (userId) {
    pool.query("UPDATE students SET status = 'offline' WHERE id = $1", [userId])
      .then(() => broadcastStudentUpdate())
      .catch(err => console.error('Logout update error:', err));
  }
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Session check
app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        fullName: req.session.fullName,
        isAdmin: req.session.isAdmin
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// ==================== STUDENT ROUTES ====================

app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, role, email, bio, skills, photo, photo_mime_type, status FROM students ORDER BY id'
    );
    
    const students = result.rows.map(student => ({
      ...student,
      photo: student.photo ? `data:${student.photo_mime_type};base64,${student.photo.toString('base64')}` : null
    }));
    
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const student = {
      ...result.rows[0],
      photo: result.rows[0].photo ? 
        `data:${result.rows[0].photo_mime_type};base64,${result.rows[0].photo.toString('base64')}` : null
    };
    
    res.json({ success: true, student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GROUP MESSAGE ROUTES ====================

app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages ORDER BY created_at DESC LIMIT 100'
    );
    
    res.json({ success: true, messages: result.rows.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.session.userId || 0;
    const username = req.session.username || req.body.username || 'Anonymous';
    
    const result = await pool.query(
      'INSERT INTO messages (user_id, username, message_text) VALUES ($1, $2, $3) RETURNING *',
      [userId, username, text]
    );
    
    io.emit('new_message', result.rows[0]);
    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== PRIVATE MESSAGE ROUTES ====================

// Get conversation between two users
app.get('/api/messages/private/:otherUserId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    const result = await pool.query(
      `SELECT * FROM private_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY created_at ASC
       LIMIT 100`,
      [req.session.userId, req.params.otherUserId]
    );
    
    // Mark messages as read
    await pool.query(
      `UPDATE private_messages SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [req.params.otherUserId, req.session.userId]
    );
    
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Error fetching private messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all conversations for current user
app.get('/api/conversations', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    const result = await pool.query(
      `SELECT 
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END AS other_user_id,
        CASE 
          WHEN sender_id = $1 THEN receiver_name 
          ELSE sender_name 
        END AS other_user_name,
        (SELECT message_text FROM private_messages pm2 
         WHERE (pm2.sender_id = $1 AND pm2.receiver_id = 
            CASE WHEN private_messages.sender_id = $1 THEN private_messages.receiver_id ELSE private_messages.sender_id END) 
            OR (pm2.sender_id = 
            CASE WHEN private_messages.sender_id = $1 THEN private_messages.receiver_id ELSE private_messages.sender_id END 
            AND pm2.receiver_id = $1) 
         ORDER BY pm2.created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM private_messages pm2 
         WHERE (pm2.sender_id = $1 AND pm2.receiver_id = 
            CASE WHEN private_messages.sender_id = $1 THEN private_messages.receiver_id ELSE private_messages.sender_id END) 
            OR (pm2.sender_id = 
            CASE WHEN private_messages.sender_id = $1 THEN private_messages.receiver_id ELSE private_messages.sender_id END 
            AND pm2.receiver_id = $1) 
         ORDER BY pm2.created_at DESC LIMIT 1) AS last_message_time,
        (SELECT COUNT(*) FROM private_messages pm2 
         WHERE pm2.sender_id = 
            CASE WHEN private_messages.sender_id = $1 THEN private_messages.receiver_id ELSE private_messages.sender_id END 
         AND pm2.receiver_id = $1 AND pm2.is_read = FALSE) AS unread_count
      FROM private_messages
      WHERE sender_id = $1 OR receiver_id = $1
      GROUP BY 
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END,
        CASE WHEN sender_id = $1 THEN receiver_name ELSE sender_name END
      ORDER BY last_message_time DESC NULLS LAST`,
      [req.session.userId]
    );
    
    res.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send private message via REST API
app.post('/api/messages/private', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    const { receiverId, receiverName, text } = req.body;
    
    const result = await pool.query(
      `INSERT INTO private_messages (sender_id, sender_name, receiver_id, receiver_name, message_text) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.session.userId, req.session.fullName || req.session.username, receiverId, receiverName || '', text]
    );
    
    const savedMessage = result.rows[0];
    
    // Emit to receiver if online
    for (let [socketId, user] of connectedUsers) {
      if (user.id === receiverId) {
        io.to(socketId).emit('private_message', {
          id: savedMessage.id,
          sender_id: req.session.userId,
          sender_name: req.session.fullName || req.session.username,
          receiver_id: receiverId,
          receiver_name: receiverName || '',
          message_text: text,
          is_read: false,
          created_at: savedMessage.created_at
        });
        break;
      }
    }
    
    res.json({ success: true, message: savedMessage });
  } catch (error) {
    console.error('Error sending private message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Mark messages as read
app.put('/api/messages/private/read/:senderId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    await pool.query(
      `UPDATE private_messages SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [req.params.senderId, req.session.userId]
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required. Please login as admin.' 
    });
  }
  next();
};

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const studentCount = await pool.query('SELECT COUNT(*) FROM students');
    const userCount = await pool.query('SELECT COUNT(*) FROM class_users');
    
    res.json({
      success: true,
      stats: {
        totalStudents: parseInt(studentCount.rows[0].count),
        totalUsers: parseInt(userCount.rows[0].count),
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/students', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id');
    
    const students = result.rows.map(student => ({
      ...student,
      photo: student.photo ? `data:${student.photo_mime_type};base64,${student.photo.toString('base64')}` : null
    }));
    
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/students', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { full_name, role, email, bio, skills } = req.body;
    const photo = req.file ? req.file.buffer : null;
    const photoMimeType = req.file ? req.file.mimetype : null;
    
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [];
    
    const result = await pool.query(
      `INSERT INTO students (full_name, role, email, bio, skills, photo, photo_mime_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [full_name, role, email, bio, skillsArray, photo, photoMimeType]
    );
    
    console.log('✅ Student added:', full_name);
    broadcastStudentUpdate();
    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/students/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    console.log('🗑️ Student deleted:', req.params.id);
    broadcastStudentUpdate();
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GALLERY ROUTES ====================

app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gallery_images ORDER BY created_at DESC');
    
    const images = result.rows.map(img => ({
      ...img,
      image_data: img.image_data ? 
        `data:${img.mime_type};base64,${img.image_data.toString('base64')}` : null
    }));
    
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/gallery', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const uploadedBy = req.session.username || 'Anonymous';
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const result = await pool.query(
      `INSERT INTO gallery_images (title, description, image_data, mime_type, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title || 'Untitled', description || '', req.file.buffer, req.file.mimetype, uploadedBy]
    );
    
    const image = {
      ...result.rows[0],
      image_data: `data:${result.rows[0].mime_type};base64,${result.rows[0].image_data.toString('base64')}`
    };
    
    io.emit('gallery_updated', image);
    res.json({ success: true, image });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Handle user joining
  socket.on('user_join', async (userData) => {
    try {
      if (userData && userData.id) {
        // Store with socket id
        connectedUsers.set(socket.id, {
          id: userData.id,
          name: userData.name || userData.username,
          socketId: socket.id
        });
        
        await pool.query(
          "UPDATE students SET status = 'online' WHERE id = $1",
          [userData.id]
        );
        
        await broadcastStudentUpdate();
        
        console.log('👤 User online:', userData.name, '(ID:', userData.id, ')');
        console.log('📋 Connected users:', [...connectedUsers.entries()].map(([sid, u]) => `${u.name}(ID:${u.id})`));
      }
      
      // Send group message history
      const messages = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
      socket.emit('message_history', messages.rows.reverse());
      
      // Send private message history for this user
      const privateMsgs = await pool.query(
        `SELECT * FROM private_messages 
         WHERE sender_id = $1 OR receiver_id = $1 
         ORDER BY created_at DESC LIMIT 100`,
        [userData?.id]
      );
      socket.emit('private_message_history', privateMsgs.rows.reverse());
      
    } catch (error) {
      console.error('User join error:', error);
    }
  });

  // Handle group messages
  socket.on('send_message', async (messageData) => {
    try {
      const result = await pool.query(
        'INSERT INTO messages (user_id, username, message_text) VALUES ($1, $2, $3) RETURNING *',
        [messageData.userId || 0, messageData.username || 'Anonymous', messageData.text]
      );
      
      // Broadcast to ALL clients EXCEPT the sender
      socket.broadcast.emit('new_message', result.rows[0]);
      
      // Send back to sender with confirmed flag
      socket.emit('new_message', {
        ...result.rows[0],
        confirmed: true
      });
      
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Handle private messages
  socket.on('private_message', async (data) => {
    console.log('📨 Private message:', data.fromName, '→', data.toUserName);
    
    try {
      // Save to database
      const result = await pool.query(
        `INSERT INTO private_messages (sender_id, sender_name, receiver_id, receiver_name, message_text) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.from, data.fromName, data.toUserId, data.toUserName || '', data.text]
      );
      
      const savedMessage = result.rows[0];
      console.log('✅ Private message saved to DB, ID:', savedMessage.id);
      
      // Find receiver's socket
      let delivered = false;
      for (let [socketId, user] of connectedUsers) {
        if (user.id === data.toUserId) {
          // Send to receiver
          io.to(socketId).emit('private_message', {
            id: savedMessage.id,
            sender_id: data.from,
            sender_name: data.fromName,
            receiver_id: data.toUserId,
            receiver_name: data.toUserName || '',
            message_text: data.text,
            is_read: false,
            created_at: savedMessage.created_at
          });
          delivered = true;
          console.log('📬 Delivered to:', user.name);
          break;
        }
      }
      
      if (!delivered) {
        console.log('📭 Receiver not online, message saved for later');
      }
      
      // Send confirmation to sender (ONLY confirmation, not the full message)
      socket.emit('private_message_sent', {
        id: savedMessage.id,
        delivered: delivered,
        created_at: savedMessage.created_at
      });
      
    } catch (error) {
      console.error('❌ Private message error:', error);
      socket.emit('private_message_error', { error: 'Failed to send message' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      await pool.query(
        "UPDATE students SET status = 'offline' WHERE id = $1",
        [user.id]
      );
      
      await broadcastStudentUpdate();
      
      console.log('👋 User offline:', user.name);
      connectedUsers.delete(socket.id);
    }
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error: ' + err.message 
  });
});

// ==================== RENDER DB SETUP ====================
app.get('/api/setup-render-db', async (req, res) => {
  try {
    // Create tables
    await pool.query(`CREATE TABLE IF NOT EXISTS class_users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, full_name VARCHAR(100), is_admin BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS students (id SERIAL PRIMARY KEY, full_name VARCHAR(100) NOT NULL, role VARCHAR(100), email VARCHAR(150), bio TEXT, skills TEXT[], photo BYTEA, photo_mime_type VARCHAR(50), status VARCHAR(20) DEFAULT 'offline', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, user_id INTEGER, username VARCHAR(100), message_text TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS private_messages (id SERIAL PRIMARY KEY, sender_id INTEGER, sender_name VARCHAR(100), receiver_id INTEGER, receiver_name VARCHAR(100), message_text TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    
    // Delete old data
    await pool.query(`DELETE FROM private_messages`); await pool.query(`DELETE FROM messages`);
    await pool.query(`DELETE FROM students`); await pool.query(`DELETE FROM class_users`);
    
    // Insert admin
    await pool.query(`INSERT INTO class_users (id,username,password,full_name,is_admin) VALUES (1,'admin','adminL3SOD@2024','Administrator',TRUE)`);
    
    // Insert all students
    const students = [
      [2,'abijuru.hosiane','hosianeL3SOD@2','ABIJURU Hosiane'],[3,'aganze.dany','danyL3SOD@3','AGANZE Dany Leamer'],
      [4,'agasaro.queen','queenL3SOD@4','AGASARO Queen'],[5,'akaliza.hobine','hobineL3SOD@5','AKALIZA Hobine'],
      [6,'akashemeza.allen','allenL3SOD@6','AKASHEMEZA Allen'],[7,'bizimana.hope','hopeL3SOD@7','BIZIMANA UWASE Hope'],
      [8,'byiringiro.elie','elieL3SOD@8','BYIRINGIRO Elie'],[9,'chayuot.tut','chayuotL3SOD@9','CHAYUOT TUT LUENG'],
      [10,'cyubahiro.alain','alainL3SOD@10','CYUBAHIRO Alain'],[11,'cyuzuzo.kelly','kellyL3SOD@11','CYUZUZO Kelly'],
      [12,'dushimimana.yvan','yvanL3SOD@12','DUSHIMIMANA YVAN'],[13,'gihozo.anny','annyL3SOD@13','GIHOZO Anny'],
      [14,'gisa.vassily','vassilyL3SOD@14','GISA Vassily'],[15,'gisubizo.frank','frankL3SOD@15','GISUBIZO KAREGEYA Frank'],
      [16,'igena.meira','meiraL3SOD@16','IGENA Meira Dania'],[17,'igihozo.inesta','inestaL3SOD@17','IGIHOZO SHUKURU Inesta'],
      [18,'ihabwicyubahiro.celia','celiaL3SOD@18','IHABWICYUBAHIRO CELIA'],[19,'imanirumva.pacifique','pacifiqueL3SOD@19','IMANIRUMVA Pacifique'],
      [20,'ineza.peace','peaceL3SOD@20','INEZA Peace Sandra'],[21,'ineza.caline','calineL3SOD@21','INEZA SHAMI NICE CALINE'],
      [22,'irakoze.yves','yvesL3SOD@22','IRAKOZE MUGISHA Yves Chris'],[23,'irambona.antoinette','antoinetteL3SOD@23','IRAMBONA Antoinette'],
      [24,'iranzi.dorcas','dorcasL3SOD@24','IRANZI Dorcas Ketia'],[25,'irera.ayana','ayanaL3SOD@25','IRERA AYANA'],
      [26,'irera.tracy','tracyL3SOD@26','IRERA KAZE TRACY Etoile'],[27,'isheja.gaella','gaellaL3SOD@27','ISHEJA RENE Gaella'],
      [28,'ishimwe.bonnette','bonnetteL3SOD@28','ISHIMWE DENYSE BONNETTE'],[29,'ishimwe.donel','donelL3SOD@29','ISHIMWE EUKERI JOE DONEL'],
      [30,'iyakaremye.blaise','blaiseL3SOD@30','IYAKAREMYE Blaise'],[31,'izabayo.samuel','samuelL3SOD@31','IZABAYO Samuel'],
      [32,'kamanzi.liza','lizaL3SOD@32','KAMANZI IKIREZI LIZA Ornella'],[33,'keza.precious','preciousL3SOD@33','KEZA PRECIOUS'],
      [34,'keza.sabrine','sabrineL3SOD@34','KEZA Sabrine'],[35,'kimenyi.merveille','merveilleL3SOD@35','KIMENYI Merveille'],
      [36,'kirenga.regis','regisL3SOD@36','KIRENGA NTAGANDA Regis'],[37,'majyambere.naomie','naomieL3SOD@37','MAJYAMBERE Ornella Naomie'],
      [38,'mucyo.kennedy','kennedyL3SOD@38','MUCYO Kennedy'],[39,'mugisha.ishaq','ishaqL3SOD@39','MUGISHA Ishaq'],
      [40,'mugisha.ivan','ivanL3SOD@40','MUGISHA IVAN'],[41,'mugisha.musabu','musabuL3SOD@41','MUGISHA Musabu'],
      [42,'mugwaneza.shania','shaniaL3SOD@42','MUGWANEZA Shania'],[43,'muhire.loic','loicL3SOD@43','MUHIRE MANZI Prince Loic'],
      [44,'muhorakeye.godelive','godeliveL3SOD@44','MUHORAKEYE KIRENZI Godelive'],[45,'mukeshimana.kevin','kevinL3SOD@45','MUKESHIMANA Kevin'],
      [46,'muneza.peter','peterL3SOD@46','MUNEZA Peter'],[47,'munyana.justine','justineL3SOD@47','MUNYANA Justine'],
      [48,'musengamana.louange','louangeL3SOD@48','MUSENGAMANA Louange'],[49,'musoni.chanella','chanellaL3SOD@49','MUSONI Chanella'],
      [50,'mutoniwase.kelia','keliaL3SOD@50','MUTONIWASE Belyse Kelia'],[51,'ngabire.moreen','moreenL3SOD@51','NGABIRE Moreen'],
      [52,'niyonsenga.honorine','honorineL3SOD@52','NIYONSENGA Honorine'],[53,'nsengiyumva.arafat','arafatL3SOD@53','NSENGIYUMVA Arafat'],
      [54,'nshuti.benitha','benithaL3SOD@54','NSHUTI Benitha'],[55,'ntakirutimana.sabrine','sabrineL3SOD@55','NTAKIRUTIMANA IHIMBAZWE Sabrine'],
      [56,'ntirenganya.janvier','janvierL3SOD@56','NTIRENGANYA Janvier'],[57,'nyiramahirwe.debora','deboraL3SOD@57','NYIRAMAHIRWE Debora'],
      [58,'rukerereza.edisa','edisaL3SOD@58','RUKEREREZA Edisa'],[59,'sharangabo.kevin','kevinL3SOD@59','SHARANGABO Kevin'],
      [60,'sinibagiwe.assouman','assoumanL3SOD@60','SINIBAGIWE Assouman'],[61,'tuyubahe.odile','odileL3SOD@61','TUYUBAHE Odile'],
      [62,'ufiteyezu.caleb','calebL3SOD@62','UFITEYEZU CALEB NASHUKULU'],[63,'umugwaneza.johnson','johnsonL3SOD@63','UMUGWANEZA Johnson Hartier'],
      [64,'umwamikazi.angel','angelL3SOD@64','UMWAMIKAZI MUSONERA Angel'],[65,'umwiza.patience','patienceL3SOD@65','UMWIZA Patience'],
      [66,'uwajambo.faustine','faustineL3SOD@66','UWAJAMBO KABERA Faustine'],[67,'uwamwezi.doreen','doreenL3SOD@67','UWAMWEZI Doreen'],
      [68,'uwantege.nailah','nailahL3SOD@68','UWANTEGE NAILAH'],[69,'uwarugira.danny','dannyL3SOD@69','UWARUGIRA Danny'],
      [70,'uwayezu.noella','noellaL3SOD@70','UWAYEZU Ange Noella'],[71,'uwangabire.henriette','henrietteL3SOD@71','UWINGABIRE Henriette'],
      [72,'uwiragiye.jennifer','jenniferL3SOD@72','UWIRAGIYE Jennifer'],[73,'uyisabye.divine','divineL3SOD@73','UYISABYE Divine'],
      [74,'ntihinduka.elissa','teacherL3SOD@2024','NTIHINDUKA ELISSA'],[75,'iraba.arsene','teacherL3SOD@2024','IRABA ARSENE'],
      [76,'muberarugo.noella','teacherL3SOD@2024','MUBERARUGO NOELLA']
    ];
    
    for (const [id, username, password, full_name] of students) {
      await pool.query(`INSERT INTO class_users (id,username,password,full_name,is_admin) VALUES ($1,$2,$3,$4,FALSE) ON CONFLICT DO NOTHING`, [id,username,password,full_name]);
    }
    
    // Insert into students table
    await pool.query(`INSERT INTO students (id,full_name,role,email,bio,skills,status) VALUES (1,'Administrator','Admin','admin@class.com','System Admin',ARRAY['Admin'],'offline') ON CONFLICT DO NOTHING`);
    
    for (const [id, , , full_name] of students) {
      await pool.query(`INSERT INTO students (id,full_name,role,email,bio,skills,status) VALUES ($1,$2,'Student',$3,'L3SOD Student',ARRAY['HTML','CSS','JavaScript'],'offline') ON CONFLICT DO NOTHING`, [id, full_name, full_name.toLowerCase().replace(/ /g,'.')+'@class.com']);
    }
    
    // Reset sequences
    await pool.query(`SELECT setval('class_users_id_seq', 76)`);
    await pool.query(`SELECT setval('students_id_seq', 76)`);
    
    const userCount = await pool.query(`SELECT COUNT(*) FROM class_users`);
    const studentCount = await pool.query(`SELECT COUNT(*) FROM students`);
    
    res.json({ success: true, users: parseInt(userCount.rows[0].count), students: parseInt(studentCount.rows[0].count) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('📁 Upload limit: 10MB');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Frontend origins:', allowedOrigins.join(', '));
  console.log('📨 Private messages: Saved to database');
  console.log('═══════════════════════════════════════');
});