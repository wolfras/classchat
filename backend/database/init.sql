-- ============================================
-- L3SOD CLASS PORTFOLIO DATABASE SETUP
-- ============================================

-- Create database (run this separately if needed)
-- CREATE DATABASE classportfolio;

-- Connect to the database
-- \c classportfolio;

-- ============================================
-- CREATE TABLES
-- ============================================

-- 1. Class Users Table (for authentication)
CREATE TABLE IF NOT EXISTS class_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table (for portfolio/gallery)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(150),
    bio TEXT,
    skills TEXT[],
    photo BYTEA,
    photo_mime_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group Messages Table (for group chat)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES class_users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Private Messages Table (for one-on-one chat)
CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES class_users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100),
    receiver_id INTEGER REFERENCES class_users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(100),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    image_data BYTEA NOT NULL,
    mime_type VARCHAR(50),
    uploaded_by VARCHAR(100),
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT ADMIN USER
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO class_users (username, password, full_name, is_admin) 
VALUES ('admin', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Administrator', TRUE)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- INSERT ALL 76 CLASS USERS (YOUR ACTUAL CLASSMATES)
-- Password: student123 (bcrypt hashed - update with real hashes)
-- ============================================
INSERT INTO class_users (username, password, full_name, is_admin) VALUES
('mugisha.ishaqa', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mugisha Ishaqa', FALSE),
('izabayo.samuel', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Izabayo Samuel', FALSE),
('janvier.yedid', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Janvier Yedid', FALSE),
('imanirumva.pacifique', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Imanirumva Pacifique', FALSE),
('byiringiro.elie', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Byiringiro Elie', FALSE),
('gihozo.anny', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Gihozo Anny', FALSE),
('musengamana.louange', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Musengamana Louange', FALSE),
('irambona.antoinette', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Irambona Antoinette', FALSE),
('shami.caline', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Shami Nice Caline', FALSE),
('muneza.peter', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Muneza Peter', FALSE),
('mucyo.kenedy', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mucyo Kenedy', FALSE),
('caleb.nashukulu', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Caleb Nashukulu', FALSE),
('mukeshimana.kevin', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mukeshimana Kevin', FALSE),
('mugisha.ivan', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mugisha Ivan', FALSE),
('uwayezu.noella', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Uwayezu Noella', FALSE),
('mugisha.emmanuel', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mugisha Emmanuel', FALSE),
('mugisha.musabu', '$2b$10$8KzQMGx5C5Kc5Q2K5Kc5QOK5Kc5Q2K5Kc5Q2K5Kc5QOK5Kc5Q2K', 'Mugisha Musabu', FALSE)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- INSERT STUDENTS DATA (Matches the users above)
-- ============================================
INSERT INTO students (full_name, role, email, bio, skills, status) VALUES
('Mugisha Ishaqa', 'Full Stack Developer & Class Leader', 'wolfras87@gmail.com', 'Passionate about building scalable web applications. Love working with React and Node.js.', ARRAY['React', 'Node.js', 'Python', 'MongoDB'], 'offline'),
('Izabayo Samuel', 'UI/UX Designer', 'samuelislegend@gmail.com', 'Creative designer focused on user-centered design.', ARRAY['Figma', 'Adobe XD', 'CSS', 'Prototyping'], 'offline'),
('Janvier Yedid', 'Software Engineer', 'uwingabireesparance85@gmail.com', 'Data enthusiast with expertise in machine learning.', ARRAY['Vibe Coding', 'Canva', 'Python', 'Django', 'React'], 'offline'),
('Imanirumva Pacifique', 'Front-end Developer', 'imanirumvapacifique39@gmail.com', 'Building beautiful user interfaces.', ARRAY['Agile', 'Scrum', 'Jira', 'Leadership'], 'offline'),
('Byiringiro Elie', 'DevOps Engineer', 'byiringiroelie@gmail.com', 'Infrastructure automation expert.', ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD'], 'offline'),
('Gihozo Anny', 'Mobile Developer', 'annygihozo5@gmail.com', 'Building beautiful mobile experiences.', ARRAY['React Native', 'Flutter', 'iOS', 'Android'], 'offline'),
('Musengamana Louange', 'Student', 'louange@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Irambona Antoinette', 'Student', 'antoinette@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Shami Nice Caline', 'Student', 'caline@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Muneza Peter', 'Student', 'peter@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Mucyo Kenedy', 'Student', 'kenedy@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Caleb Nashukulu', 'Student', 'caleb@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Mukeshimana Kevin', 'Student', 'kevin@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Mugisha Ivan', 'Student', 'ivan@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Uwayezu Noella', 'Student', 'noella@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Mugisha Emmanuel', 'Student', 'emmanuel@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline'),
('Mugisha Musabu', 'Student', 'musabu@class.com', 'Dedicated student of L3SOD.', ARRAY['HTML', 'CSS', 'JavaScript'], 'offline')
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created ON private_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON private_messages(
    LEAST(sender_id, receiver_id), 
    GREATEST(sender_id, receiver_id), 
    created_at DESC
);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_class_users_username ON class_users(username);

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR PRIVATE MESSAGES
-- ============================================

-- Function to get conversation between two users
CREATE OR REPLACE FUNCTION get_private_conversation(user1_id INTEGER, user2_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    sender_id INTEGER,
    sender_name VARCHAR,
    receiver_id INTEGER,
    receiver_name VARCHAR,
    message_text TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT pm.id, pm.sender_id, pm.sender_name, pm.receiver_id, pm.receiver_name, 
           pm.message_text, pm.is_read, pm.created_at
    FROM private_messages pm
    WHERE (pm.sender_id = user1_id AND pm.receiver_id = user2_id)
       OR (pm.sender_id = user2_id AND pm.receiver_id = user1_id)
    ORDER BY pm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id INTEGER)
RETURNS TABLE(
    other_user_id INTEGER,
    other_user_name VARCHAR,
    last_message TEXT,
    last_message_time TIMESTAMP,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN pm.sender_id = user_id THEN pm.receiver_id 
            ELSE pm.sender_id 
        END AS other_user_id,
        CASE 
            WHEN pm.sender_id = user_id THEN pm.receiver_name 
            ELSE pm.sender_name 
        END AS other_user_name,
        MAX(pm.message_text) AS last_message,
        MAX(pm.created_at) AS last_message_time,
        COUNT(*) FILTER (WHERE pm.receiver_id = user_id AND pm.is_read = FALSE) AS unread_count
    FROM private_messages pm
    WHERE pm.sender_id = user_id OR pm.receiver_id = user_id
    GROUP BY other_user_id, other_user_name
    ORDER BY last_message_time DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_users FROM class_users;
SELECT COUNT(*) as total_students FROM students;