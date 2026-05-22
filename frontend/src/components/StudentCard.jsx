import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import emailIcon from '@iconify/icons-mdi/email';
import accountIcon from '@iconify/icons-mdi/account';
import checkCircleIcon from '@iconify/icons-mdi/check-circle';
import circleOutlineIcon from '@iconify/icons-mdi/circle-outline';

const StudentCard = ({ student, isDarkTheme }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div 
        className="student-card"
        onClick={() => setShowDetail(true)}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)',
          textAlign: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.borderColor = 'var(--accent-purple)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          margin: '0 auto 1rem',
          border: '3px solid var(--accent-purple)'
        }}>
          {student.photo ? (
            <img 
              src={student.photo} 
              alt={student.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'var(--accent-purple)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.5rem'
            }}>
              {student.full_name?.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: student.status === 'online' ? '#10b981' : '#6b7280'
        }}></div>
        
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          {student.full_name}
        </h3>
        
        {student.role && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--accent-purple)',
            fontWeight: 500,
            marginBottom: '0.75rem'
          }}>
            <Icon icon={accountIcon} width="14" height="14" />
            {' '}{student.role}
          </p>
        )}
        
        {student.skills && student.skills.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {student.skills.slice(0, 3).map((skill, i) => (
              <span key={i} style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)'
              }}>
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowDetail(false)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-2xl)',
              padding: '2rem',
              maxWidth: '450px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto 1rem',
                border: '4px solid var(--accent-purple)'
              }}>
                {student.photo ? (
                  <img src={student.photo} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--accent-purple)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '2rem'
                  }}>
                    {student.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{student.full_name}</h2>
              <p style={{ color: 'var(--accent-purple)' }}>{student.role}</p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                marginTop: '0.5rem',
                background: student.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                color: student.status === 'online' ? '#10b981' : '#6b7280'
              }}>
                <Icon icon={student.status === 'online' ? checkCircleIcon : circleOutlineIcon} width="16" height="16" />
                {student.status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>

            {student.bio && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>About</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{student.bio}</p>
              </div>
            )}

            {student.email && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Contact</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  <Icon icon={emailIcon} width="16" height="16" />
                  {' '}{student.email}
                </p>
              </div>
            )}

            {student.skills && student.skills.length > 0 && (
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {student.skills.map((skill, i) => (
                    <span key={i} style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-light)'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StudentCard;