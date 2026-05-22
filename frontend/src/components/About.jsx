import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import schoolIcon from '@iconify/icons-mdi/school';
import trophyIcon from '@iconify/icons-mdi/trophy';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import starIcon from '@iconify/icons-mdi/star';
import './About.css';

const About = ({ isDarkTheme }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStudents(data.students);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  const specializations = [
    { name: 'Full Stack Development', count: 25, icon: '💻', color: '#7c3aed' },
    { name: 'Frontend Development', count: 18, icon: '🎨', color: '#3b82f6' },
    { name: 'Backend Development', count: 15, icon: '⚙️', color: '#10b981' },
    { name: 'UI/UX Design', count: 10, icon: '🎯', color: '#f59e0b' },
    { name: 'Mobile Development', count: 8, icon: '📱', color: '#ef4444' },
  ];

  const achievements = [
    { title: 'Best Class Project 2024', description: 'Awarded for outstanding collaborative project' },
    { title: 'Hackathon Winners', description: 'First place in National Coding Competition' },
    { title: '100% Completion Rate', description: 'All students successfully completed the program' },
    { title: 'Industry Partnerships', description: 'Partnerships with 5+ tech companies' },
  ];

  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>
            <Icon icon={schoolIcon} width="40" height="40" />
            About L3SOD Class
          </h1>
          <p>Discover our journey, mission, and the talented individuals who make our class exceptional</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-grid">
          <div className="mission-card">
            <div className="mission-icon">
              <Icon icon={schoolIcon} width="36" height="36" />
            </div>
            <h3>Our Mission</h3>
            <p>
              L3SOD (Level 3 Software Development) is dedicated to nurturing the next 
              generation of tech innovators. We focus on practical skills, collaborative 
              learning, and real-world project experience.
            </p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">
              <Icon icon={starIcon} width="36" height="36" />
            </div>
            <h3>Our Vision</h3>
            <p>
              To become the leading software development class, producing industry-ready 
              professionals who can tackle complex challenges and drive technological 
              innovation across Africa and beyond.
            </p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">
              <Icon icon={trophyIcon} width="36" height="36" />
            </div>
            <h3>Our Values</h3>
            <p>
              Collaboration, innovation, excellence, and continuous learning are the 
              core values that drive our class. We believe in the power of teamwork 
              and shared knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="specializations-section">
        <div className="section-header">
          <h2>Our Specializations</h2>
          <p>Diverse expertise across multiple domains of software development</p>
        </div>
        <div className="specs-grid">
          {specializations.map((spec, index) => (
            <div key={index} className="spec-card" style={{ '--spec-color': spec.color }}>
              <div className="spec-icon-wrapper">
                <span className="spec-emoji">{spec.icon}</span>
              </div>
              <h3>{spec.name}</h3>
              <div className="spec-count">
                <Icon icon={accountGroupIcon} width="16" height="16" />
                <span>{spec.count} Students</span>
              </div>
              <div className="spec-bar">
                <div 
                  className="spec-bar-fill" 
                  style={{ width: `${(spec.count / 25) * 100}%`, background: spec.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="achievements-section">
        <div className="section-header">
          <h2>Our Achievements</h2>
          <p>Milestones that make us proud</p>
        </div>
        <div className="achievements-grid">
          {achievements.map((achievement, index) => (
            <div key={index} className="achievement-card">
              <div className="achievement-number">{String(index + 1).padStart(2, '0')}</div>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Preview */}
      <section className="team-preview-section">
        <div className="section-header">
          <h2>Meet Our Class</h2>
          <p>{students.length} talented students and growing</p>
        </div>
        {loading ? (
          <div className="loading-grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="loading-card"></div>
            ))}
          </div>
        ) : (
          <div className="team-grid">
            {students.slice(0, 8).map(student => (
              <div key={student.id} className="team-member-card">
                <div className="member-avatar">
                  {student.photo ? (
                    <img src={student.photo} alt={student.full_name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {student.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <h3>{student.full_name}</h3>
                <p>{student.role || 'Student'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default About;