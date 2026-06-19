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

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://chatclass.vercel.app',
];

const io = new Server(server, {
  cors: {
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

// Session configuration
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
    console.error('❌ Broadcast error:', error);
  }
}

// Health check endpoint
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
    console.error('❌ Error fetching members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== AUTH ROUTES ====================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM class_users WHERE username = $1 OR full_name = $1 OR email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Check if user is approved (for new registrations)
    if (user.approved === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval. Please wait for admin to approve your registration.' 
      });
    }
    
    // Simple comparison - Plain text passwords
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.is_admin;
    req.session.fullName = user.full_name;
    
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
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

app.post('/api/logout', (req, res) => {
  const userId = req.session.userId;
  
  if (userId) {
    pool.query("UPDATE students SET status = 'offline' WHERE id = $1", [userId])
      .then(() => broadcastStudentUpdate())
      .catch(err => console.error('❌ Logout update error:', err));
  }
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

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

// ==================== REGISTRATION ROUTES ====================

// Register new user (creates pending request)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if username or email already exists in class_users
    const existingUser = await pool.query(
      'SELECT id FROM class_users WHERE username = $1 OR email = $2',
      [username.toLowerCase(), email.toLowerCase()]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }
    
    // Check if there's already a pending request
    const existingRequest = await pool.query(
      'SELECT id FROM registration_requests WHERE username = $1 OR email = $2',
      [username.toLowerCase(), email.toLowerCase()]
    );
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A pending registration request already exists for this username or email' });
    }
    
    // Insert registration request
    await pool.query(
      'INSERT INTO registration_requests (username, password, full_name, email, status) VALUES ($1, $2, $3, $4, $5)',
      [username.toLowerCase(), password, fullName, email.toLowerCase(), 'pending']
    );
    
    res.json({ success: true, message: 'Registration request submitted. Please wait for admin approval.' });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Check registration status
app.get('/api/registration-status/:email', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, email, status, requested_at, approved_at FROM registration_requests WHERE email = $1 ORDER BY id DESC LIMIT 1',
      [req.params.email]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: true, found: false, message: 'No registration request found' });
    }
    
    res.json({ success: true, found: true, request: result.rows[0] });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    console.error('❌ Error fetching students:', error);
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
    console.error('❌ Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GROUP MESSAGE ROUTES ====================

app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, username, message_text, created_at FROM messages ORDER BY created_at ASC LIMIT 200'
    );
    
    console.log('📨 Fetched', result.rows.length, 'messages from database');
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text, userId, username } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    
    const result = await pool.query(
      'INSERT INTO messages (user_id, username, message_text, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, user_id, username, message_text, created_at',
      [userId || null, username || 'Anonymous', text.trim()]
    );
    
    if (result.rows.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to save message' });
    }
    
    const message = result.rows[0];
    console.log('✅ Message saved to DB:', message.id, 'by', message.username);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Error posting message:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== PRIVATE MESSAGE ROUTES ====================

app.get('/api/messages/private/:otherUserId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    const result = await pool.query(
      `SELECT id, sender_id, sender_name, receiver_id, receiver_name, message_text, is_read, created_at 
       FROM private_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY created_at ASC
       LIMIT 200`,
      [req.session.userId, req.params.otherUserId]
    );
    
    console.log('📨 Fetched', result.rows.length, 'private messages');
    
    // Mark as read
    await pool.query(
      `UPDATE private_messages SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [req.params.otherUserId, req.session.userId]
    );
    
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('❌ Error fetching private messages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.post('/api/messages/private', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  try {
    const { receiverId, receiverName, text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }
    
    const result = await pool.query(
      `INSERT INTO private_messages (sender_id, sender_name, receiver_id, receiver_name, message_text, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, sender_id, sender_name, receiver_id, receiver_name, message_text, is_read, created_at`,
      [req.session.userId, req.session.fullName || req.session.username, receiverId, receiverName || '', text.trim()]
    );
    
    if (result.rows.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to save message' });
    }
    
    const message = result.rows[0];
    console.log('✅ Private message saved to DB:', message.id);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Error sending private message:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

app.get('/api/admin/students', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id');
    
    const students = result.rows.map(student => ({
      ...student,
      photo: student.photo ? `data:${student.photo_mime_type};base64,${student.photo.toString('base64')}` : null
    }));
    
    res.json({ success: true, students });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
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
    console.error('❌ Error adding student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/students/:id', requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { full_name, role, email, bio, skills } = req.body;
    const photo = req.file ? req.file.buffer : null;
    const photoMimeType = req.file ? req.file.mimetype : null;
    
    const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [];
    
    let result;
    if (photo) {
      result = await pool.query(
        `UPDATE students SET full_name = $1, role = $2, email = $3, bio = $4, skills = $5, photo = $6, photo_mime_type = $7 
         WHERE id = $8 RETURNING *`,
        [full_name, role, email, bio, skillsArray, photo, photoMimeType, req.params.id]
      );
    } else {
      result = await pool.query(
        `UPDATE students SET full_name = $1, role = $2, email = $3, bio = $4, skills = $5 
         WHERE id = $6 RETURNING *`,
        [full_name, role, email, bio, skillsArray, req.params.id]
      );
    }
    
    console.log('✅ Student updated:', full_name);
    broadcastStudentUpdate();
    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating student:', error);
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
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ADMIN: REGISTRATION REQUESTS ====================

// Get all pending registration requests
app.get('/api/admin/registration-requests', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM registration_requests WHERE status = 'pending' ORDER BY requested_at DESC"
    );
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve a registration request - FIXED
app.post('/api/admin/approve-registration/:id', requireAdmin, async (req, res) => {
  try {
    const request = await pool.query('SELECT * FROM registration_requests WHERE id = $1', [req.params.id]);
    if (request.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    const r = request.rows[0];
    
    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM class_users WHERE username = $1', [r.username]);
    if (existingUser.rows.length > 0) {
      await pool.query('UPDATE registration_requests SET status = $1 WHERE id = $2', ['rejected', req.params.id]);
      return res.status(400).json({ success: false, message: 'Username already exists. Request automatically rejected.' });
    }
    
    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM class_users WHERE email = $1', [r.email]);
    if (existingEmail.rows.length > 0) {
      await pool.query('UPDATE registration_requests SET status = $1 WHERE id = $2', ['rejected', req.params.id]);
      return res.status(400).json({ success: false, message: 'Email already exists. Request automatically rejected.' });
    }
    
    // Create the user in class_users
    const result = await pool.query(
      'INSERT INTO class_users (username, password, full_name, email, is_admin, approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [r.username, r.password, r.full_name, r.email, false, true]
    );
    
    const newUserId = result.rows[0].id;
    
    // Add to students table - FIXED: using string literal for array
    await pool.query(
      "INSERT INTO students (id, full_name, role, email, bio, skills, status) VALUES ($1, $2, $3, $4, $5, '{HTML,CSS,JavaScript}', $6) ON CONFLICT (id) DO NOTHING",
      [newUserId, r.full_name, 'Student', r.email, 'L3SOD Student', 'offline']
    );
    
    // Update request status
    await pool.query(
      'UPDATE registration_requests SET status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3',
      ['approved', req.session.userId, req.params.id]
    );
    
    console.log('✅ User approved:', r.username, 'New ID:', newUserId);
    res.json({ success: true, message: 'User approved successfully!', userId: newUserId });
  } catch (error) {
    console.error('❌ Approval error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Reject a registration request
app.post('/api/admin/reject-registration/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE registration_requests SET status = $1 WHERE id = $2',
      ['rejected', req.params.id]
    );
    res.json({ success: true, message: 'Registration request rejected' });
  } catch (error) {
    console.error('❌ Rejection error:', error);
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
        
        // Send group message history
        try {
          const messages = await pool.query(
            'SELECT id, user_id, username, message_text, created_at FROM messages ORDER BY created_at ASC LIMIT 200'
          );
          console.log('📨 Sending', messages.rows.length, 'messages to client');
          socket.emit('message_history', messages.rows);
        } catch (error) {
          console.error('❌ Error fetching message history:', error);
          socket.emit('message_history', []);
        }
        
        // Send private message history
        try {
          const privateMsgs = await pool.query(
            `SELECT id, sender_id, sender_name, receiver_id, receiver_name, message_text, is_read, created_at 
             FROM private_messages 
             WHERE sender_id = $1 OR receiver_id = $1 
             ORDER BY created_at ASC LIMIT 200`,
            [userData.id]
          );
          console.log('📨 Sending', privateMsgs.rows.length, 'private messages to client');
          socket.emit('private_message_history', privateMsgs.rows);
        } catch (error) {
          console.error('❌ Error fetching private message history:', error);
          socket.emit('private_message_history', []);
        }
      }
    } catch (error) {
      console.error('❌ User join error:', error);
    }
  });

  // Handle group messages
  socket.on('send_message', async (messageData) => {
    try {
      console.log('📤 Received message from', messageData.username, ':', messageData.text.substring(0, 50));
      
      const result = await pool.query(
        'INSERT INTO messages (user_id, username, message_text, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, user_id, username, message_text, created_at',
        [messageData.userId || null, messageData.username || 'Anonymous', messageData.text]
      );
      
      if (result.rows.length === 0) {
        console.error('❌ Failed to insert message');
        socket.emit('message_error', { error: 'Failed to save message' });
        return;
      }
      
      const savedMessage = result.rows[0];
      console.log('✅ Message saved to database, ID:', savedMessage.id);
      
      // Broadcast to ALL clients
      io.emit('new_message', savedMessage);
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  // Handle private messages
  socket.on('private_message', async (data) => {
    console.log('📨 Private message from', data.fromName, 'to', data.toUserName);
    
    try {
      // Save to database FIRST
      const result = await pool.query(
        `INSERT INTO private_messages (sender_id, sender_name, receiver_id, receiver_name, message_text, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING id, sender_id, sender_name, receiver_id, receiver_name, message_text, is_read, created_at`,
        [data.from, data.fromName, data.toUserId, data.toUserName || '', data.text]
      );
      
      if (result.rows.length === 0) {
        console.error('❌ Failed to insert private message');
        socket.emit('private_message_error', { error: 'Failed to save message' });
        return;
      }
      
      const savedMessage = result.rows[0];
      console.log('✅ Private message saved to DB, ID:', savedMessage.id);
      
      // Find receiver's socket and deliver
      let delivered = false;
      for (let [socketId, user] of connectedUsers) {
        if (user.id === data.toUserId) {
          io.to(socketId).emit('private_message', savedMessage);
          delivered = true;
          console.log('📬 Delivered to:', user.name);
          break;
        }
      }
      
      // Always send confirmation to sender
      socket.emit('private_message_sent', {
        id: savedMessage.id,
        delivered: delivered,
        created_at: savedMessage.created_at
      });
      
      if (!delivered) {
        console.log('📭 Receiver offline, message saved to database');
      }
      
    } catch (error) {
      console.error('❌ Private message error:', error);
      socket.emit('private_message_error', { error: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      try {
        await pool.query(
          "UPDATE students SET status = 'offline' WHERE id = $1",
          [user.id]
        );
        await broadcastStudentUpdate();
        console.log('👋 User offline:', user.name);
      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
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

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Server running on http://localhost:' + PORT);
  console.log('📁 Upload limit: 10MB');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔗 Frontend origins:', allowedOrigins.join(', '));
  console.log('📨 Messages persisted to database: YES');
  console.log('📝 Registration system: ACTIVE');
  console.log('═══════════════════════════════════════════');
});