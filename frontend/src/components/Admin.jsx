import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import shieldIcon from '@iconify/icons-mdi/shield';
import accountPlusIcon from '@iconify/icons-mdi/account-plus';
import deleteIcon from '@iconify/icons-mdi/delete';
import uploadIcon from '@iconify/icons-mdi/upload';
import { API_URL } from '../config';
import './Admin.css';

const Admin = ({ isDarkTheme }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    email: '',
    bio: '',
    skills: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/students`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Max 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Uploading...');

    const formDataToSend = new FormData();
    formDataToSend.append('full_name', formData.full_name);
    formDataToSend.append('role', formData.role);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('skills', formData.skills);
    
    if (selectedFile) {
      formDataToSend.append('photo', selectedFile);
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/students`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage('Student added successfully!');
        setFormData({ full_name: '', role: '', email: '', bio: '', skills: '' });
        setSelectedFile(null);
        setShowAddForm(false);
        fetchStudents();
      } else {
        setMessage('Error: ' + data.message);
      }
    } catch (err) {
      setMessage('Connection error. Is the backend running?');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    
    try {
      await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchStudents();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Loading admin panel...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      color: 'var(--text-primary)'
    }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Icon icon={shieldIcon} width="32" height="32" style={{ color: '#7c3aed' }} />
        Admin Panel
      </h1>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={statCardStyle}>
          <h3 style={{ fontSize: '2rem', color: '#7c3aed' }}>{students.length}</h3>
          <p>Total Students</p>
        </div>
        <div style={statCardStyle}>
          <h3 style={{ fontSize: '2rem', color: '#10b981' }}>
            {students.filter(s => s.status === 'online').length}
          </h3>
          <p>Online Now</p>
        </div>
      </div>

      {/* Add Student Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}
      >
        <Icon icon={accountPlusIcon} width="20" height="20" />
        Add Student
      </button>

      {message && (
        <div style={{
          padding: '1rem',
          background: message.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: '1px solid ' + (message.includes('Error') ? '#ef4444' : '#10b981'),
          borderRadius: '10px',
          marginBottom: '1rem',
          color: message.includes('Error') ? '#ef4444' : '#10b981'
        }}>
          {message}
        </div>
      )}

      {/* Add Student Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add New Student</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Full Name *"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={inputStyle}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ ...inputStyle, marginBottom: '1rem' }}
          />
          
          <textarea
            placeholder="Bio"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows="3"
            style={{ ...inputStyle, marginBottom: '1rem', resize: 'vertical' }}
          />
          
          <input
            type="text"
            placeholder="Skills (comma separated)"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            style={{ ...inputStyle, marginBottom: '1rem' }}
          />

          {/* File Upload */}
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '1rem',
            cursor: 'pointer'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              <Icon icon={uploadIcon} width="32" height="32" style={{ color: '#7c3aed' }} />
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                {selectedFile ? selectedFile.name : 'Click to upload student photo'}
              </p>
            </label>
          </div>

          <button type="submit" style={{
            padding: '0.75rem 2rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem'
          }}>
            Add Student
          </button>
        </form>
      )}

      {/* Students List */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <h3 style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          All Students ({students.length})
        </h3>
        
        {students.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No students yet. Add your first student!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={thStyle}>Photo</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>
                      {student.photo ? (
                        <img 
                          src={student.photo} 
                          alt={student.full_name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#7c3aed',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          {student.full_name?.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{student.full_name}</td>
                    <td style={tdStyle}>{student.role || '-'}</td>
                    <td style={tdStyle}>{student.email || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        background: student.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                        color: student.status === 'online' ? '#10b981' : '#6b7280'
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(student.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.5rem'
                        }}
                      >
                        <Icon icon={deleteIcon} width="18" height="18" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const statCardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px',
  padding: '1.5rem',
  textAlign: 'center'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem'
};

const thStyle = {
  textAlign: 'left',
  padding: '1rem',
  color: 'var(--text-secondary)',
  fontWeight: 600
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--text-primary)'
};

export default Admin;