import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Icon } from '@iconify/react';
import arrowRightIcon from '@iconify/icons-mdi/arrow-right';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import codeBracesIcon from '@iconify/icons-mdi/code-braces';
import rocketIcon from '@iconify/icons-mdi/rocket';
import chatIcon from '@iconify/icons-mdi/chat';
import circleIcon from '@iconify/icons-mdi/circle';
import briefcaseIcon from '@iconify/icons-mdi/briefcase';
import starIcon from '@iconify/icons-mdi/star';
import trendingUpIcon from '@iconify/icons-mdi/trending-up';
import certificateIcon from '@iconify/icons-mdi/certificate';
import emailIcon from '@iconify/icons-mdi/email';
import phoneIcon from '@iconify/icons-mdi/phone';
import mapMarkerIcon from '@iconify/icons-mdi/map-marker';
import linkedinIcon from '@iconify/icons-mdi/linkedin';
import githubIcon from '@iconify/icons-mdi/github';
import twitterIcon from '@iconify/icons-mdi/twitter';
import checkCircleIcon from '@iconify/icons-mdi/check-circle';
import { API_URL } from '../config';
import { SOCKET_URL } from '../config';
import './Home.css';

const Home = ({ isDarkTheme }) => {
  const [stats, setStats] = useState({
    students: 76,
    online: 0,
    messages: 0,
    projects: 12,
    avgGPA: 3.8,
    coursesCompleted: 24
  });

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({
    students: 0,
    online: 0,
    messages: 0,
    projects: 0
  });

  const [newsletter, setNewsletter] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  const [portfolio, setPortfolio] = useState({
    skillsShowcase: [
      { name: 'React', level: 90, category: 'Frontend' },
      { name: 'JavaScript', level: 95, category: 'Language' },
      { name: 'Node.js', level: 85, category: 'Backend' },
      { name: 'Python', level: 80, category: 'Language' },
      { name: 'Database Design', level: 85, category: 'Backend' }
    ],
    recentProjects: [
      { title: 'E-Commerce Platform', tech: 'MERN Stack', stars: 24 },
      { title: 'Chat Application', tech: 'React + Socket.io', stars: 18 },
      { title: 'Portfolio Website', tech: 'Next.js + Tailwind', stars: 15 }
    ],
    certifications: [
      { name: 'Full Stack Development', issuer: 'L3SOD Academy', date: '2024' },
      { name: 'React Advanced', issuer: 'Udemy', date: '2024' },
      { name: 'Database Design', issuer: 'Coursera', date: '2023' }
    ],
    testimonials: [
      {
        name: 'Ntirenganya Janvier',
        role: 'Full Stack Developer',
        text: 'This platform changed how our class collaborates. The chat feature is seamless!',
        avatar: '👨‍💻'
      },
      {
        name: 'Imanirumva Pacifique',
        role: 'Frontend Engineer',
        text: 'Amazing community! I found so much inspiration from my classmates\' projects.',
        avatar: '👨‍💻'
      },
      {
        name: 'Byiringiro Elie',
        role: 'UI/UX Designer',
        text: 'Perfect place to showcase work and connect with talented developers.',
        avatar: '👩‍🎨'
      }
    ]
  });

  const statsRef = useRef(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStatsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate numbers when stats become visible
  useEffect(() => {
    if (!isStatsVisible) return;

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimatedStats({
        students: Math.floor(stats.students * progress),
        online: Math.floor(stats.online * progress),
        messages: Math.floor(stats.messages * progress),
        projects: Math.floor(stats.projects * progress)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isStatsVisible, stats]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    fetch(`${API_URL}/api/students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const online = data.students.filter(s => s.status === 'online').length;
          setStats(prev => ({ ...prev, online, students: data.students.length }));
          setOnlineUsers(data.students.filter(s => s.status === 'online'));
        }
      })
      .catch(err => console.error('Error fetching stats:', err));

    newSocket.on('students_updated', (students) => {
      const online = students.filter(s => s.status === 'online').length;
      setStats(prev => ({ ...prev, online, students: students.length }));
      setOnlineUsers(students.filter(s => s.status === 'online'));
    });

    fetch(`${API_URL}/api/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(prev => ({ ...prev, messages: data.messages?.length || 0 }));
        }
      })
      .catch(() => {});

    return () => newSocket.disconnect();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletter.trim()) return;

    setNewsletterStatus('loading');
    setTimeout(() => {
      setNewsletterStatus('success');
      setNewsletter('');
      setTimeout(() => setNewsletterStatus(null), 3000);
    }, 1000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge hero-animate-badge">
            <Icon icon={rocketIcon} width="20" height="20" />
            <span>Level 3 Software Development</span>
          </div>

          <h1 className="hero-title">
            Welcome to <span className="highlight">L3SOD</span> Class
          </h1>

          <p className="hero-subtitle">
            Where Innovation Meets Code - Building the Future Together
          </p>

          <p className="hero-description">
            We are a dynamic class of <strong>{stats.students}</strong> talented software developers,
            designers, and tech enthusiasts. Explore our portfolio, view our gallery,
            and connect with us through our real-time chat.
          </p>

          <div className="hero-buttons">
            <Link to="/about" className="btn-primary btn-animate-1">
              <span>Learn More</span>
              <Icon icon={arrowRightIcon} width="20" height="20" />
            </Link>
            <Link to="/gallery" className="btn-secondary btn-animate-2">
              <Icon icon={accountGroupIcon} width="20" height="20" />
              <span>View Students</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1 card-animate">
            <Icon icon={codeBracesIcon} width="32" height="32" />
            <span>Full Stack</span>
          </div>
          <div className="floating-card card-2 card-animate">
            <Icon icon={accountGroupIcon} width="32" height="32" />
            <span>{stats.students} Members</span>
          </div>
          <div className="floating-card card-3 card-animate">
            <Icon icon={chatIcon} width="32" height="32" />
            <span>{stats.online} Online</span>
          </div>
          <div className="hero-circle"></div>

          <div className="glow-orb orb-1"></div>
          <div className="glow-orb orb-2"></div>
          <div className="glow-orb orb-3"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-grid">
          <div className="stat-card stat-animate stat-1">
            <div className="stat-icon">
              <Icon icon={accountGroupIcon} width="32" height="32" />
            </div>
            <h3>{animatedStats.students}</h3>
            <p>Total Students</p>
          </div>

          <div className="stat-card stat-animate stat-2">
            <div className="stat-icon online">
              <Icon icon={circleIcon} width="32" height="32" />
            </div>
            <h3>{animatedStats.online}</h3>
            <p>Online Now</p>
          </div>

          <div className="stat-card stat-animate stat-3">
            <div className="stat-icon">
              <Icon icon={codeBracesIcon} width="32" height="32" />
            </div>
            <h3>{animatedStats.projects}+</h3>
            <p>Projects</p>
          </div>

          <div className="stat-card stat-animate stat-4">
            <div className="stat-icon">
              <Icon icon={chatIcon} width="32" height="32" />
            </div>
            <h3>{animatedStats.messages}</h3>
            <p>Messages</p>
          </div>
        </div>
      </section>

      {/* Online Users Section */}
      {onlineUsers.length > 0 && (
        <section className="online-section">
          <h3 className="section-title">
            <Icon icon={circleIcon} width="16" height="16" style={{ color: '#10b981' }} />
            Online Now ({onlineUsers.length})
          </h3>
          <div className="online-users-list">
            {onlineUsers.slice(0, 12).map((user, i) => (
              <div
                key={i}
                className="online-user-badge user-badge-animate"
                style={{ '--animation-delay': `${i * 0.05}s` }}
                title={user.full_name}
              >
                {user.photo ? (
                  <img src={user.photo} alt={user.full_name} />
                ) : (
                  <div className="online-avatar-placeholder">
                    {user.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <span>{user.full_name?.split(' ')[0]}</span>
                <span className="online-dot"></span>
              </div>
            ))}
            {onlineUsers.length > 12 && (
              <span className="more-online">+{onlineUsers.length - 12} more</span>
            )}
          </div>
        </section>
      )}

      {/* Skills Section */}
      <section className="skills-section">
        <div className="section-header">
          <h2>Class Skills Showcase</h2>
          <p>Mastering modern technologies and development practices</p>
        </div>
        <div className="skills-grid">
          {portfolio.skillsShowcase.map((skill, i) => (
            <div
              key={i}
              className="skill-card skill-card-animate"
              style={{ '--animation-delay': `${i * 0.1}s` }}
            >
              <div className="skill-header">
                <h3>{skill.name}</h3>
                <span className="skill-category">{skill.category}</span>
              </div>
              <div className="skill-bar">
                <div className="skill-progress" style={{ '--skill-level': `${skill.level}%` }}></div>
              </div>
              <p className="skill-level-text">{skill.level}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section className="projects-section">
        <div className="section-header">
          <h2>Recent Class Projects</h2>
          <p>Innovative solutions built by our talented students</p>
        </div>
        <div className="projects-grid">
          {portfolio.recentProjects.map((project, i) => (
            <div
              key={i}
              className="project-card project-card-animate"
              style={{ '--animation-delay': `${i * 0.15}s` }}
            >
              <div className="project-icon">
                <Icon icon={codeBracesIcon} width="40" height="40" />
              </div>
              <h3>{project.title}</h3>
              <p className="project-tech">{project.tech}</p>
              <div className="project-stars">
                <Icon icon={starIcon} width="16" height="16" style={{ color: '#fbbf24' }} />
                <span>{project.stars} Stars</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section className="certifications-section">
        <div className="section-header">
          <h2>Class Certifications</h2>
          <p>Achievement and professional recognition</p>
        </div>
        <div className="certifications-grid">
          {portfolio.certifications.map((cert, i) => (
            <div
              key={i}
              className="cert-card cert-card-animate"
              style={{ '--animation-delay': `${i * 0.1}s` }}
            >
              <div className="cert-icon">
                <Icon icon={certificateIcon} width="40" height="40" />
              </div>
              <h3>{cert.name}</h3>
              <p className="cert-issuer">{cert.issuer}</p>
              <p className="cert-date">{cert.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Activity Section */}
      <section className="chat-activity-section">
        <div className="section-header">
          <h2>Class Chat Activity</h2>
          <p>Real-time engagement and conversations</p>
        </div>
        <div className="activity-grid">
          <div className="activity-card activity-card-animate">
            <div className="activity-icon">
              <Icon icon={chatIcon} width="32" height="32" />
            </div>
            <h3 className="activity-number">{stats.messages}</h3>
            <p>Total Messages</p>
            <p className="activity-subtitle">Growing conversation</p>
          </div>

          <div className="activity-card activity-card-animate activity-delay-1">
            <div className="activity-icon">
              <Icon icon={accountGroupIcon} width="32" height="32" />
            </div>
            <h3 className="activity-number">{stats.online}</h3>
            <p>Active Participants</p>
            <p className="activity-subtitle">Currently online</p>
          </div>

          <div className="activity-card activity-card-animate activity-delay-2">
            <div className="activity-icon">
              <Icon icon={trendingUpIcon} width="32" height="32" />
            </div>
            <h3 className="activity-number">24/7</h3>
            <p>Always Connected</p>
            <p className="activity-subtitle">Real-time updates</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2>What Our Students Say</h2>
          <p>Hear from members of our amazing class community</p>
        </div>
        <div className="testimonials-grid">
          {portfolio.testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="testimonial-card testimonial-animate"
              style={{ '--animation-delay': `${i * 0.15}s` }}
            >
              <div className="testimonial-header">
                <div className="testimonial-avatar">{testimonial.avatar}</div>
                <div className="testimonial-info">
                  <h4>{testimonial.name}</h4>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} icon={starIcon} width="16" height="16" style={{ color: '#fbbf24' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Complete Platform Features</h2>
          <p>Everything you need to connect, learn, and grow together</p>
        </div>
        <div className="features-grid">
          <Link to="/gallery" className="feature-card feature-card-animate feature-1">
            <div className="feature-icon">
              <Icon icon={accountGroupIcon} width="40" height="40" />
            </div>
            <h3>Student Profiles</h3>
            <p>Browse detailed profiles of all {stats.students} class members with portfolios.</p>
            <div className="feature-arrow">
              <Icon icon={arrowRightIcon} width="20" height="20" />
            </div>
          </Link>

          <div className="feature-card feature-card-animate feature-2">
            <div className="feature-icon">
              <Icon icon={briefcaseIcon} width="40" height="40" />
            </div>
            <h3>Portfolio Showcase</h3>
            <p>Display your projects, code snippets, skills, and creative work professionally.</p>
            <div className="feature-arrow">
              <Icon icon={arrowRightIcon} width="20" height="20" />
            </div>
          </div>

          <Link to="/chat" className="feature-card feature-card-animate feature-3">
            <div className="feature-icon">
              <Icon icon={chatIcon} width="40" height="40" />
            </div>
            <h3>Real-time Chat</h3>
            <p>Connect instantly with classmates. Group & private messaging with notifications.</p>
            <div className="feature-arrow">
              <Icon icon={arrowRightIcon} width="20" height="20" />
            </div>
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Stay Updated</h2>
          <p>Subscribe to get the latest updates, announcements, and class highlights</p>
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={newsletter}
              onChange={(e) => setNewsletter(e.target.value)}
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-btn" disabled={newsletterStatus === 'loading'}>
              {newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
            {newsletterStatus === 'success' && (
              <p className="newsletter-success">
                <Icon icon={checkCircleIcon} width="16" height="16" />
                Successfully subscribed!
              </p>
            )}
          </form>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title-animate">Ready to Connect?</h2>
          <p className="cta-subtitle-animate">Join {stats.online} classmates online and start collaborating today</p>
          <div className="cta-buttons">
            <Link to="/chat" className="btn-primary cta-btn-1">
              <Icon icon={chatIcon} width="20" height="20" />
              <span>Open Chat</span>
            </Link>
            <Link to="/gallery" className="btn-secondary cta-btn-2">
              <Icon icon={accountGroupIcon} width="20" height="20" />
              <span>View Gallery</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          {/* Footer Top */}
          <div className="footer-top">
            <div className="footer-section footer-brand">
              <h3>L3SOD Class</h3>
              <p>Level 3 Software Development - Building the future, one line of code at a time.</p>
              <div className="footer-socials">
                <a href="https://github.com/kalumeri" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                  <Icon icon={githubIcon} width="24" height="24" />
                </a>
                <a href="https://www.linkedin.com/in/mugishaishaq/" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                  <Icon icon={linkedinIcon} width="24" height="24" />
                </a>
                <a href="https://twitter.com/mugishaishaq/" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                  <Icon icon={twitterIcon} width="24" height="24" />
                </a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/gallery">Gallery</Link></li>
                <li><Link to="/chat">Chat</Link></li>
                <li><a href="#features">Features</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Contact</h4>
              <div className="contact-info">
                <p>
                  <Icon icon={emailIcon} width="18" height="18" />
                  <a href="mailto:wolfras87@gmail.com">wolfras87@gmail.com</a>
                </p>
                <p>
                  <Icon icon={phoneIcon} width="18" height="18" />
                  <a href="tel:+250793159478">+250 793159478</a>
                </p>
                <p>
                  <Icon icon={mapMarkerIcon} width="18" height="18" />
                  <span>Essa Nyarugunga, Kigali</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <p>&copy; {currentYear} L3SOD Class. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="footer-decoration"></div>
      </footer>
    </div>
  );
};

export default Home;