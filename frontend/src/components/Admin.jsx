import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import shieldIcon from '@iconify/icons-mdi/shield';
import accountPlusIcon from '@iconify/icons-mdi/account-plus';
import deleteIcon from '@iconify/icons-mdi/delete';
import keyIcon from '@iconify/icons-mdi/key';
import clipboardIcon from '@iconify/icons-mdi/clipboard-text';
import uploadIcon from '@iconify/icons-mdi/upload';
import downloadIcon from '@iconify/icons-mdi/download';
import pencilIcon from '@iconify/icons-mdi/pencil';
import searchIcon from '@iconify/icons-mdi/magnify';
import filterIcon from '@iconify/icons-mdi/filter';
import sortIcon from '@iconify/icons-mdi/sort';
import checkCircleIcon from '@iconify/icons-mdi/check-circle';
import closeCircleIcon from '@iconify/icons-mdi/close-circle';
import chartLineIcon from '@iconify/icons-mdi/chart-line';
import accountMultipleIcon from '@iconify/icons-mdi/account-multiple';
import accountCheckIcon from '@iconify/icons-mdi/account-check';
import accountClockIcon from '@iconify/icons-mdi/account-clock';
import accountCancelIcon from '@iconify/icons-mdi/account-cancel';
import { API_URL } from '../config';
import './Admin.css';

const Admin = ({ isDarkTheme }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
  // Tabs
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'requests', or 'reset'
  
  // Registration Requests
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Password Reset
  const [resetResult, setResetResult] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSearchQuery, setResetSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Bulk actions
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit form
  const [editingStudent, setEditingStudent] = useState(null);
  
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
    fetchRegistrationRequests(); // FIX: Load requests count on mount
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRegistrationRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [students, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredStudents]);

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
      showMessage('Error fetching students', 'error');
      setLoading(false);
    }
  };

  const fetchRegistrationRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/registration-requests`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/approve-registration/${requestId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showMessage('User approved successfully!', 'success');
        fetchRegistrationRequests();
        fetchStudents();
      } else {
        showMessage(data.message || 'Approval failed', 'error');
      }
    } catch (err) {
      showMessage('Connection error', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Reject this registration request?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reject-registration/${requestId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Request rejected', 'success');
        fetchRegistrationRequests();
      } else {
        showMessage(data.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      showMessage('Connection error', 'error');
    }
  };

  // Password Reset Functions
  const handleGenerateResetToken = async (userId) => {
    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/generate-reset-token/${userId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setResetResult(data);
        showMessage('Reset token generated successfully!', 'success');
      } else {
        showMessage(data.message || 'Failed to generate token', 'error');
      }
    } catch (err) {
      showMessage('Connection error', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token).then(() => {
      showMessage('Token copied to clipboard!', 'success');
    }).catch(() => {
      showMessage('Failed to copy token', 'error');
    });
  };

  const filteredStudentsForReset = students.filter(s => {
    if (!resetSearchQuery) return true;
    const q = resetSearchQuery.toLowerCase();
    return s.full_name.toLowerCase().includes(q) ||
           (s.username && s.username.toLowerCase().includes(q)) ||
           (s.email && s.email.toLowerCase().includes(q));
  });

  const applyFiltersAndSort = () => {
    let filtered = [...students];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.username?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(s => s.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'name') { aVal = a.full_name; bVal = b.full_name; }
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredStudents(filtered);
    setSelectedStudents(new Set());
    setSelectAll(false);
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showMessage('File too large. Max 10MB.', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showMessage('Uploading...');

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
        showMessage('Student added successfully!', 'success');
        setFormData({ full_name: '', role: '', email: '', bio: '', skills: '' });
        setSelectedFile(null);
        setShowAddForm(false);
        fetchStudents();
      } else {
        showMessage('Error: ' + data.message, 'error');
      }
    } catch (err) {
      showMessage('Connection error. Is the backend running?', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    showMessage('Updating...');

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
      const res = await fetch(`${API_URL}/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend
      });

      const data = await res.json();

      if (data.success) {
        showMessage('Student updated successfully!', 'success');
        setFormData({ full_name: '', role: '', email: '', bio: '', skills: '' });
        setSelectedFile(null);
        setShowEditForm(false);
        setEditingStudent(null);
        fetchStudents();
      } else {
        showMessage('Error: ' + data.message, 'error');
      }
    } catch (err) {
      showMessage('Connection error', 'error');
    }
  };

  const startEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      role: student.role || '',
      email: student.email || '',
      bio: student.bio || '',
      skills: student.skills || ''
    });
    setShowEditForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;

    try {
      await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      showMessage('Student deleted successfully!', 'success');
      fetchStudents();
    } catch (err) {
      showMessage('Error deleting student', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) {
      showMessage('No students selected', 'error');
      return;
    }

    if (!window.confirm(`Delete ${selectedStudents.size} students?`)) return;

    for (const id of selectedStudents) {
      try {
        await fetch(`${API_URL}/api/admin/students/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }

    showMessage(`${selectedStudents.size} students deleted!`, 'success');
    setSelectedStudents(new Set());
    setSelectAll(false);
    fetchStudents();
  };

  const toggleSelectStudent = (id) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
      setSelectAll(false);
    } else {
      const pageStudents = getPaginatedData();
      const newSelected = new Set(pageStudents.map(s => s.id));
      setSelectedStudents(newSelected);
      setSelectAll(true);
    }
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Status', 'Skills'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(s =>
        [s.full_name, s.email || '', s.role || '', s.status, s.skills || '']
          .map(field => `"${field}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${Date.now()}.csv`;
    a.click();
    showMessage('Exported to CSV!', 'success');
  };

  const getRoleOptions = () => {
    const roles = new Set(students.map(s => s.role).filter(Boolean));
    return Array.from(roles);
  };

  // FIX: Safe date formatter to prevent crash on null/invalid dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Pagination
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = getPaginatedData();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin">
      {/* Header */}
      <div className="admin-header">
        <h1>
          <Icon icon={shieldIcon} width="32" height="32" />
          Admin Panel
        </h1>
        <p className="admin-subtitle">Manage students, approve registrations, and control the platform</p>
      </div>

      {/* Statistics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon">
            <Icon icon={accountMultipleIcon} width="24" height="24" />
          </div>
          <h3>{students.length}</h3>
          <p>Total Students</p>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon online">
            <Icon icon={checkCircleIcon} width="24" height="24" />
          </div>
          <h3>{students.filter(s => s.status === 'online').length}</h3>
          <p>Online Now</p>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon pending">
            <Icon icon={accountClockIcon} width="24" height="24" />
          </div>
          <h3>{registrationRequests.length}</h3>
          <p>Pending Requests</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`admin-message admin-message-${messageType}`}>
          <Icon icon={messageType === 'success' ? checkCircleIcon : closeCircleIcon} width="20" height="20" />
          {message}
        </div>
      )}

      {/* Tabs - UPDATED with Password Reset */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Icon icon={accountMultipleIcon} width="20" height="20" />
          Students
        </button>
        <button
          className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Icon icon={accountClockIcon} width="20" height="20" />
          Registration Requests
          {registrationRequests.length > 0 && (
            <span className="admin-tab-badge">{registrationRequests.length}</span>
          )}
        </button>
        <button
          className={`admin-tab ${activeTab === 'reset' ? 'active' : ''}`}
          onClick={() => setActiveTab('reset')}
        >
          <Icon icon={keyIcon} width="20" height="20" />
          Password Reset
        </button>
      </div>

      {/* ==================== STUDENTS TAB ==================== */}
      {activeTab === 'students' && (
        <>
          {/* Toolbar */}
          <div className="admin-toolbar">
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setEditingStudent(null);
                setFormData({ full_name: '', role: '', email: '', bio: '', skills: '' });
                setShowAddForm(!showAddForm);
              }}
            >
              <Icon icon={accountPlusIcon} width="18" height="18" />
              Add Student
            </button>

            <div className="admin-toolbar-right">
              <button className="admin-btn admin-btn-secondary" onClick={exportToCSV}>
                <Icon icon={downloadIcon} width="18" height="18" />
                Export CSV
              </button>

              {selectedStudents.size > 0 && (
                <button className="admin-btn admin-btn-danger" onClick={handleBulkDelete}>
                  <Icon icon={deleteIcon} width="18" height="18" />
                  Delete {selectedStudents.size}
                </button>
              )}
            </div>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || showEditForm) && (
            <div className="admin-form-container">
              <form onSubmit={showEditForm ? handleEditSubmit : handleSubmit} className="admin-form">
                <h3>{showEditForm ? 'Edit Student' : 'Add New Student'}</h3>

                <div className="admin-form-grid">
                  <input type="text" placeholder="Full Name *" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required className="admin-input" />
                  <input type="text" placeholder="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="admin-input" />
                </div>

                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="admin-input" />
                <textarea placeholder="Bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows="3" className="admin-input" />
                <input type="text" placeholder="Skills (comma separated)" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="admin-input" />

                <div className="admin-file-upload">
                  <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" />
                  <label htmlFor="file-upload">
                    <Icon icon={uploadIcon} width="32" height="32" />
                    <p>{selectedFile ? selectedFile.name : 'Click to upload student photo'}</p>
                  </label>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="admin-btn admin-btn-success">
                    {showEditForm ? 'Update Student' : 'Add Student'}
                  </button>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowAddForm(false); setShowEditForm(false); setEditingStudent(null); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter */}
          <div className="admin-search-bar">
            <div className="admin-search-input-wrapper">
              <Icon icon={searchIcon} width="20" height="20" className="admin-search-icon" />
              <input type="text" placeholder="Search by name, email, or username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="admin-search-input" />
            </div>
            <div className="admin-filters">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="admin-filter-select">
                <option value="all">All Roles</option>
                {getRoleOptions().map(role => (<option key={role} value={role}>{role}</option>))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-filter-select">
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-filter-select">
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
                <option value="status">Sort by Status</option>
              </select>
              <button className="admin-sort-toggle" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
                <Icon icon={sortIcon} width="18" height="18" />
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="admin-results-info">
            <p>Showing {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students</p>
            <div className="admin-items-per-page">
              <label>Per page:</label>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="admin-filter-select">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="admin-table-container">
            {filteredStudents.length === 0 ? (
              <div className="admin-empty-state">
                <Icon icon={accountMultipleIcon} width="48" height="48" />
                <p>No students found</p>
                <span>Try adjusting your filters or add a new student</span>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-th-checkbox"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="admin-checkbox" /></th>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map(student => (
                      <tr key={student.id} className="admin-tr">
                        <td className="admin-td-checkbox"><input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => toggleSelectStudent(student.id)} className="admin-checkbox" /></td>
                        <td className="admin-td-photo">
                          {student.photo ? <img src={student.photo} alt={student.full_name} /> : <div className="admin-avatar-placeholder">{student.full_name?.split(' ').map(n => n[0]).join('')}</div>}
                        </td>
                        <td className="admin-td-name">{student.full_name}</td>
                        <td className="admin-td-email">{student.email || '-'}</td>
                        <td className="admin-td-role"><span className="admin-role-badge">{student.role || '-'}</span></td>
                        <td className="admin-td-status"><span className={`admin-status-badge admin-status-${student.status}`}>{student.status}</span></td>
                        <td className="admin-td-actions">
                          <button className="admin-action-btn admin-edit-btn" onClick={() => startEdit(student)} title="Edit"><Icon icon={pencilIcon} width="16" height="16" /></button>
                          <button className="admin-action-btn admin-delete-btn" onClick={() => handleDelete(student.id)} title="Delete"><Icon icon={deleteIcon} width="16" height="16" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-pagination-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>← Previous</button>
              <div className="admin-pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} className={`admin-pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
              </div>
              <button className="admin-pagination-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ==================== REGISTRATION REQUESTS TAB ==================== */}
      {activeTab === 'requests' && (
        <div className="admin-requests-section">
          <h2>
            <Icon icon={accountClockIcon} width="24" height="24" />
            Pending Registration Requests
          </h2>

          {requestsLoading ? (
            <div className="admin-loading"><p>Loading requests...</p></div>
          ) : registrationRequests.length === 0 ? (
            <div className="admin-empty-state">
              <Icon icon={accountCheckIcon} width="48" height="48" />
              <p>No pending requests</p>
              <span>All registration requests have been processed</span>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationRequests.map(request => (
                    <tr key={request.id} className="admin-tr">
                      <td className="admin-td-name">{request.username}</td>
                      <td className="admin-td-name">{request.full_name}</td>
                      <td className="admin-td-email">{request.email}</td>
                      <td className="admin-td-email">{formatDate(request.requested_at)}</td>
                      <td className="admin-td-actions">
                        <button
                          className="admin-action-btn admin-approve-btn"
                          onClick={() => handleApproveRequest(request.id)}
                          title="Approve"
                        >
                          <Icon icon={checkCircleIcon} width="18" height="18" />
                        </button>
                        <button
                          className="admin-action-btn admin-delete-btn"
                          onClick={() => handleRejectRequest(request.id)}
                          title="Reject"
                        >
                          <Icon icon={closeCircleIcon} width="18" height="18" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== PASSWORD RESET TAB ==================== */}
      {activeTab === 'reset' && (
        <div className="admin-requests-section">
          <h2>
            <Icon icon={keyIcon} width="24" height="24" />
            Password Reset Tokens
          </h2>
          <p className="admin-subtitle">Generate reset tokens for students who forgot their password</p>

          {/* Generated Token Display */}
          {resetResult && (
            <div className="reset-token-display">
              <div className="reset-token-header">
                <Icon icon={checkCircleIcon} width="24" height="24" />
                <span>Token Generated Successfully</span>
              </div>
              <div className="reset-token-info">
                <p><strong>Student:</strong> {resetResult.fullName} (@{resetResult.username})</p>
                <div className="reset-token-box">
                  <span className="reset-token-label">Reset Token:</span>
                  <code className="reset-token-value">{resetResult.resetToken}</code>
                  <button 
                    className="admin-btn admin-btn-secondary"
                    onClick={() => handleCopyToken(resetResult.resetToken)}
                    title="Copy token"
                  >
                    <Icon icon={clipboardIcon} width="16" height="16" />
                    Copy
                  </button>
                </div>
                <p className="reset-token-instructions">
                  Give this token to the student. They can use it at the <strong>Forgot Password</strong> page to reset their password. This token expires in 1 hour.
                </p>
              </div>
            </div>
          )}

          {/* Search Students */}
          <div className="admin-search-bar" style={{ marginTop: '1.5rem' }}>
            <div className="admin-search-input-wrapper">
              <Icon icon={searchIcon} width="20" height="20" className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search students by name, username, or email..."
                value={resetSearchQuery}
                onChange={(e) => setResetSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>

          {/* Students List for Reset */}
          <div className="admin-table-container" style={{ marginTop: '1rem' }}>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentsForReset.slice(0, 20).map(student => (
                    <tr key={student.id} className="admin-tr">
                      <td className="admin-td-photo">
                        {student.photo ? (
                          <img src={student.photo} alt={student.full_name} />
                        ) : (
                          <div className="admin-avatar-placeholder">
                            {student.full_name?.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </td>
                      <td className="admin-td-name">{student.full_name}</td>
                      <td className="admin-td-name">{student.username || '-'}</td>
                      <td className="admin-td-email">{student.email || '-'}</td>
                      <td className="admin-td-actions">
                        <button
                          className="admin-btn admin-btn-primary"
                          onClick={() => handleGenerateResetToken(student.id)}
                          disabled={resetLoading}
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                        >
                          <Icon icon={keyIcon} width="14" height="14" />
                          Generate Token
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudentsForReset.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;