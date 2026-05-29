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
// Login endpoint - FIXED
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('📝 Login attempt for:', email);
    console.log('📝 Password provided:', password);
    
    const result = await pool.query(
      'SELECT * FROM class_users WHERE username = $1 OR full_name = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const user = result.rows[0];
    console.log('👤 User found:', user.username, '| Stored password:', user.password);
    
    // SIMPLE COMPARISON - Plain text passwords
    if (password !== user.password) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    console.log('✅ Password matches!');
    
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
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});
    
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

// TEMPORARY - Password fix endpoint
app.get('/api/fix-passwords', async (req, res) => {
  try {
    // Update admin
    await pool.query(`UPDATE class_users SET password = 'adminL3SOD@2024' WHERE username = 'admin'`);
    
    // Update all students with their unique passwords
    const students = await pool.query(`SELECT id, full_name FROM class_users WHERE is_admin = FALSE OR (is_admin = TRUE AND username != 'admin')`);
    
    for (const s of students.rows) {
      const firstName = s.full_name.split(' ')[0].toLowerCase();
      const newPassword = firstName + 'L3SOD@' + s.id;
      await pool.query(`UPDATE class_users SET password = $1 WHERE id = $2`, [newPassword, s.id]);
    }
    
    // Update teachers
    await pool.query(`UPDATE class_users SET password = 'teacherL3SOD@2024' WHERE is_admin = TRUE AND username != 'admin'`);
    
    res.json({ success: true, message: 'All passwords updated!' });
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