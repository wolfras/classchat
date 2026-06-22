-- ============================================
-- L3SOD CLASS PORTFOLIO - DATA RESTORE
-- Matches your ACTUAL live Railway schema
-- Temporary password for ALL accounts: changeme123
-- (Everyone should use Forgot Password to set their own after first login)
-- ============================================

-- ============================================
-- 1. INSERT INTO class_users
-- Schema requires: username, full_name, email, password, is_admin, approved
-- ============================================

INSERT INTO class_users (username, full_name, email, password, is_admin, approved) VALUES
('mugisha.ishaqa', 'Mugisha Ishaqa', 'wolfras87@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', TRUE, TRUE),
('izabayo.samuel', 'Izabayo Samuel', 'samuelislegend@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('janvier.yedid', 'Janvier Yedid', 'uwingabireesparance85@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('imanirumva.pacifique', 'Imanirumva Pacifique', 'imanirumvapacifique39@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('byiringiro.elie', 'Byiringiro Elie', 'byiringiroelie@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('gihozo.anny', 'Gihozo Anny', 'annygihozo5@gmail.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('musengamana.louange', 'Musengamana Louange', 'musengamana.louange@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('irambona.antoinette', 'Irambona Antoinette', 'irambona.antoinette@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('shami.caline', 'Shami Nice Caline', 'shami.caline@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('muneza.peter', 'Muneza Peter', 'muneza.peter@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('mucyo.kenedy', 'Mucyo Kenedy', 'mucyo.kenedy@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('caleb.nashukulu', 'Caleb Nashukulu', 'caleb.nashukulu@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('mukeshimana.kevin', 'Mukeshimana Kevin', 'mukeshimana.kevin@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('mugisha.ivan', 'Mugisha Ivan', 'mugisha.ivan@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('uwayezu.noella', 'Uwayezu Noella', 'uwayezu.noella@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('mugisha.emmanuel', 'Mugisha Emmanuel', 'mugisha.emmanuel@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE),
('mugisha.musabu', 'Mugisha Musabu', 'mugisha.musabu@class.l3sod.com', '$2b$10$BmZcyZwePN0RHEqnTX2TGedP4TJSrVM5W6A11r3/SZEsVftisarVm', FALSE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 2. INSERT INTO students
-- Schema requires: username, full_name, email, role, bio, skills, status
-- (username added so /api/sync-all-data can match it to class_users)
-- ============================================

INSERT INTO students (username, full_name, role, email, bio, skills, status) VALUES
('mugisha.ishaqa', 'Mugisha Ishaqa', 'Full Stack Developer & Class Leader', 'wolfras87@gmail.com', 'Passionate about building scalable web applications. Love working with React and Node.js.', ARRAY['React','Node.js','Python','MongoDB'], 'offline'),
('izabayo.samuel', 'Izabayo Samuel', 'UI/UX Designer', 'samuelislegend@gmail.com', 'Creative designer focused on user-centered design.', ARRAY['Figma','Adobe XD','CSS','Prototyping'], 'offline'),
('janvier.yedid', 'Janvier Yedid', 'Software Engineer', 'uwingabireesparance85@gmail.com', 'Data enthusiast with expertise in machine learning.', ARRAY['Vibe Coding','Canva','Python','Django','React'], 'offline'),
('imanirumva.pacifique', 'Imanirumva Pacifique', 'Front-end Developer', 'imanirumvapacifique39@gmail.com', 'Building beautiful user interfaces.', ARRAY['Agile','Scrum','Jira','Leadership'], 'offline'),
('byiringiro.elie', 'Byiringiro Elie', 'DevOps Engineer', 'byiringiroelie@gmail.com', 'Infrastructure automation expert.', ARRAY['Docker','Kubernetes','AWS','CI/CD'], 'offline'),
('gihozo.anny', 'Gihozo Anny', 'Mobile Developer', 'annygihozo5@gmail.com', 'Building beautiful mobile experiences.', ARRAY['React Native','Flutter','iOS','Android'], 'offline'),
('musengamana.louange', 'Musengamana Louange', 'Student', 'musengamana.louange@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('irambona.antoinette', 'Irambona Antoinette', 'Student', 'irambona.antoinette@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('shami.caline', 'Shami Nice Caline', 'Student', 'shami.caline@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('muneza.peter', 'Muneza Peter', 'Student', 'muneza.peter@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('mucyo.kenedy', 'Mucyo Kenedy', 'Student', 'mucyo.kenedy@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('caleb.nashukulu', 'Caleb Nashukulu', 'Student', 'caleb.nashukulu@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('mukeshimana.kevin', 'Mukeshimana Kevin', 'Student', 'mukeshimana.kevin@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('mugisha.ivan', 'Mugisha Ivan', 'Student', 'mugisha.ivan@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('uwayezu.noella', 'Uwayezu Noella', 'Student', 'uwayezu.noella@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('mugisha.emmanuel', 'Mugisha Emmanuel', 'Student', 'mugisha.emmanuel@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline'),
('mugisha.musabu', 'Mugisha Musabu', 'Student', 'mugisha.musabu@class.l3sod.com', 'Dedicated student of L3SOD.', ARRAY['HTML','CSS','JavaScript'], 'offline')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 3. VERIFY
-- ============================================
SELECT 'Restore complete!' AS status;
SELECT COUNT(*) AS total_users FROM class_users;
SELECT COUNT(*) AS total_students FROM students;
SELECT username, full_name, is_admin, approved FROM class_users ORDER BY id;