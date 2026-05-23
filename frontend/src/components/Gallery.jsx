import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import imageIcon from '@iconify/icons-mdi/image';
import magnifyIcon from '@iconify/icons-mdi/magnify';
import emailIcon from '@iconify/icons-mdi/email';
import accountIcon from '@iconify/icons-mdi/account';
import circleIcon from '@iconify/icons-mdi/circle';
import closeIcon from '@iconify/icons-mdi/close';
import { API_URL } from '../config';
import './Gallery.css';

const Gallery = ({ isDarkTheme, currentUser }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('${API_URL}/api/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.role && student.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || 
                       (student.role && student.role.toLowerCase().includes(filterRole.toLowerCase()));
    return matchesSearch && matchesRole;
  });

  const roles = ['all', ...new Set(students.map(s => s.role).filter(Boolean))];

  return (
    <div className="gallery">
      {/* Hero Section */}
      <section className="gallery-hero">
        <h1>
          <Icon icon={imageIcon} width="36" height="36" />
          Student Gallery
        </h1>
        <p>Meet all {students.length} members of our class</p>
      </section>

      {/* Search and Filter */}
      <section className="gallery-controls">
        <div className="search-box">
          <Icon icon={magnifyIcon} width="20" height="20" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          {roles.slice(0, 8).map(role => (
            <button
              key={role}
              className={`filter-btn ${filterRole === role ? 'active' : ''}`}
              onClick={() => setFilterRole(role)}
            >
              {role === 'all' ? 'All' : role}
            </button>
          ))}
        </div>
      </section>

      {/* Students Grid */}
      <section className="students-grid-section">
        {loading ? (
          <div className="loading-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="loading-card"></div>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Icon icon={imageIcon} width="64" height="64" />
            <h3>No students found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="students-grid">
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="student-card"
                onClick={() => setSelectedStudent(student)}
              >
                {/* Square large photo */}
                <div className="student-photo-container">
                  {student.photo ? (
                    <img 
                      src={student.photo} 
                      alt={student.full_name}
                      className="student-photo"
                    />
                  ) : (
                    <div className="student-photo-placeholder">
                      <span className="student-initials">
                        {student.full_name?.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  {/* Online/Offline indicator */}
                  <div className={`student-status ${student.status === 'online' ? 'online' : 'offline'}`}>
                    <Icon icon={circleIcon} width="12" height="12" />
                  </div>
                </div>

                {/* Student Info */}
                <div className="student-info">
                  <h3 className="student-name">{student.full_name}</h3>
                  {student.role && (
                    <p className="student-role">
                      <Icon icon={accountIcon} width="14" height="14" />
                      {student.role}
                    </p>
                  )}
                  {student.email && (
                    <p className="student-email">
                      <Icon icon={emailIcon} width="14" height="14" />
                      {student.email}
                    </p>
                  )}
                </div>

                {/* Skills */}
                {student.skills && student.skills.length > 0 && (
                  <div className="student-skills">
                    {student.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                    {student.skills.length > 3 && (
                      <span className="skill-more">+{student.skills.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Click overlay */}
                <div className="student-card-overlay">
                  <span>View Profile</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="student-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>
              <Icon icon={closeIcon} width="24" height="24" />
            </button>

            {/* Large Square Photo in Modal */}
            <div className="modal-photo-container">
              {selectedStudent.photo ? (
                <img 
                  src={selectedStudent.photo} 
                  alt={selectedStudent.full_name}
                  className="modal-photo"
                />
              ) : (
                <div className="modal-photo-placeholder">
                  <span className="modal-initials">
                    {selectedStudent.full_name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-info">
              <h2>{selectedStudent.full_name}</h2>
              
              <div className={`modal-status ${selectedStudent.status}`}>
                <Icon icon={circleIcon} width="10" height="10" />
                {selectedStudent.status === 'online' ? 'Online' : 'Offline'}
              </div>

              {selectedStudent.role && (
                <p className="modal-role">
                  <Icon icon={accountIcon} width="18" height="18" />
                  {selectedStudent.role}
                </p>
              )}

              {selectedStudent.email && (
                <p className="modal-email">
                  <Icon icon={emailIcon} width="18" height="18" />
                  {selectedStudent.email}
                </p>
              )}

              {selectedStudent.bio && (
                <div className="modal-bio">
                  <h4>About</h4>
                  <p>{selectedStudent.bio}</p>
                </div>
              )}

              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div className="modal-skills">
                  <h4>Skills</h4>
                  <div className="modal-skills-list">
                    {selectedStudent.skills.map((skill, i) => (
                      <span key={i} className="skill-tag large">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;