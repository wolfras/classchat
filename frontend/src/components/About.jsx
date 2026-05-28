import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import schoolIcon from '@iconify/icons-mdi/school';
import trophyIcon from '@iconify/icons-mdi/trophy';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import starIcon from '@iconify/icons-mdi/star';
import './About.css';
import { API_URL } from '../config';

const About = ({ isDarkTheme }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024
  );
  const [isLandscape, setIsLandscape] = useState(
    window.innerHeight < window.innerWidth
  );

  const sectionRefs = {
    hero: useRef(null),
    mission: useRef(null),
    specializations: useRef(null),
    achievements: useRef(null),
    team: useRef(null),
  };

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setIsLandscape(window.innerHeight < window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/students`);
        const data = await res.json();
        if (data.success) {
          setStudents(Array.isArray(data.students) ? data.students : []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Specializations data
  const specializations = [
    {
      name: 'Full Stack Development',
      count: 25,
      icon: '💻',
      color: '#7c3aed',
    },
    {
      name: 'Frontend Development',
      count: 18,
      icon: '🎨',
      color: '#3b82f6',
    },
    {
      name: 'Backend Development',
      count: 15,
      icon: '⚙️',
      color: '#10b981',
    },
    {
      name: 'UI/UX Design',
      count: 10,
      icon: '🎯',
      color: '#f59e0b',
    },
    {
      name: 'Mobile Development',
      count: 8,
      icon: '📱',
      color: '#ef4444',
    },
  ];

  // Achievements data
  const achievements = [
    {
      title: 'Best Class Project 2024',
      description: 'Awarded for outstanding collaborative project',
    },
    {
      title: 'Hackathon Winners',
      description: 'First place in National Coding Competition',
    },
    {
      title: '100% Completion Rate',
      description: 'All students successfully completed the program',
    },
    {
      title: 'Industry Partnerships',
      description: 'Partnerships with 5+ tech companies',
    },
  ];

  const handleImageError = (e, name) => {
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'User'
    )}&background=7c3aed&color=fff&size=128`;
  };

  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero" ref={sectionRefs.hero} aria-labelledby="hero-title">
        <div className="about-hero-content">
          <h1 id="hero-title">
            <Icon
              icon={schoolIcon}
              width="40"
              height="40"
              aria-hidden="true"
            />
            <span>About L3SOD Class</span>
          </h1>
          <p>
            Discover our journey, mission, and the talented individuals who make
            our class exceptional
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section
        className="mission-section"
        ref={sectionRefs.mission}
        aria-labelledby="mission-title"
      >
        <h2 id="mission-title" style={{ display: 'none' }}>
          Our Mission, Vision, and Values
        </h2>
        <div className="mission-grid">
          <article className="mission-card">
            <div className="mission-icon" aria-hidden="true">
              <Icon icon={schoolIcon} width="36" height="36" />
            </div>
            <h3>Our Mission</h3>
            <p>
              L3SOD (Level 3 Software Development) is dedicated to nurturing the
              next generation of tech innovators. We focus on practical skills,
              collaborative learning, and real-world project experience.
            </p>
          </article>

          <article className="mission-card">
            <div className="mission-icon" aria-hidden="true">
              <Icon icon={starIcon} width="36" height="36" />
            </div>
            <h3>Our Vision</h3>
            <p>
              To become the leading software development class, producing
              industry-ready professionals who can tackle complex challenges and
              drive technological innovation across Africa and beyond.
            </p>
          </article>

          <article className="mission-card">
            <div className="mission-icon" aria-hidden="true">
              <Icon icon={trophyIcon} width="36" height="36" />
            </div>
            <h3>Our Values</h3>
            <p>
              Collaboration, innovation, excellence, and continuous learning are
              the core values that drive our class. We believe in the power of
              teamwork and shared knowledge.
            </p>
          </article>
        </div>
      </section>

      {/* Specializations Section */}
      <section
        className="specializations-section"
        ref={sectionRefs.specializations}
        aria-labelledby="specializations-title"
      >
        <div className="section-header">
          <h2 id="specializations-title">Our Specializations</h2>
          <p>Diverse expertise across multiple domains of software development</p>
        </div>
        <div className="specs-grid" role="list">
          {specializations.map((spec, index) => (
            <article
              key={index}
              className="spec-card"
              style={{ '--spec-color': spec.color }}
              role="listitem"
            >
              <div className="spec-icon-wrapper" aria-hidden="true">
                <span className="spec-emoji">{spec.icon}</span>
              </div>
              <h3>{spec.name}</h3>
              <div className="spec-count">
                <Icon
                  icon={accountGroupIcon}
                  width="16"
                  height="16"
                  aria-hidden="true"
                />
                <span aria-label={`${spec.count} students`}>
                  {spec.count} Students
                </span>
              </div>
              <div className="spec-bar" aria-hidden="true">
                <div
                  className="spec-bar-fill"
                  style={{
                    width: `${(spec.count / 25) * 100}%`,
                    background: spec.color,
                  }}
                ></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Achievements Section */}
      <section
        className="achievements-section"
        ref={sectionRefs.achievements}
        aria-labelledby="achievements-title"
      >
        <div className="section-header">
          <h2 id="achievements-title">Our Achievements</h2>
          <p>Milestones that make us proud</p>
        </div>
        <div className="achievements-grid" role="list">
          {achievements.map((achievement, index) => (
            <article key={index} className="achievement-card" role="listitem">
              <div
                className="achievement-number"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Team Preview Section */}
      <section
        className="team-preview-section"
        ref={sectionRefs.team}
        aria-labelledby="team-title"
      >
        <div className="section-header">
          <h2 id="team-title">Meet Our Class</h2>
          <p>
            <span aria-live="polite">
              {loading ? 'Loading members...' : `${students.length} talented students and growing`}
            </span>
          </p>
        </div>

        {loading ? (
          <div
            className="loading-grid"
            role="status"
            aria-label="Loading student profiles"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="loading-card"
                aria-hidden="true"
              ></div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <p role="status" style={{ textAlign: 'center', padding: '2rem' }}>
            No students available at this time.
          </p>
        ) : (
          <div className="team-grid" role="list">
            {students.slice(0, isMobile ? 6 : 8).map((student) => (
              <article
                key={student.id}
                className="team-member-card"
                role="listitem"
              >
                <div className="member-avatar">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.full_name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) =>
                        handleImageError(e, student.full_name)
                      }
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {student.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}
                </div>
                <h3>{student.full_name}</h3>
                <p>{student.role || 'Student'}</p>
              </article>
            ))}
          </div>
        )}

        {!loading && students.length > (isMobile ? 6 : 8) && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '2rem',
              color: 'var(--text-secondary)',
            }}
          >
            Showing {isMobile ? 6 : 8} of {students.length} students
          </p>
        )}
      </section>
    </div>
  );
};

export default About;