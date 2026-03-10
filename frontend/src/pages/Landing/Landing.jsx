import { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Optional: Uncomment this to auto-redirect if already logged in
    // But for now, we let users view the landing page even if logged in
    // if (user) {
    //   navigate("/dashboard");
    // }
  }, [user, navigate]);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="landing-page">
      {/* Navbar */}
      <nav id="landing-navbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: '1rem 2rem',
        background: scrolled ? 'rgba(10, 25, 47, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        boxShadow: scrolled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <span style={{
              background: 'linear-gradient(135deg, #3B82F6, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Campus Connect</span>
          </div>
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            gap: '2rem'
          }}>
            <li><a href="#home" onClick={() => scrollToSection("home")} style={{ color: '#fff', textDecoration: 'none', fontWeight: '500', position: 'relative' }}>Home</a></li>
            <li><a href="#about" onClick={() => scrollToSection("about")} style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>About</a></li>
            <li><a href="#features" onClick={() => scrollToSection("features")} style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>Features</a></li>
            <li><a href="#tech" onClick={() => scrollToSection("tech")} style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>Tech Stack</a></li>
            <li><a href="#contact" onClick={() => scrollToSection("contact")} style={{ color: '#fff', textDecoration: 'none', fontWeight: '500' }}>Contact</a></li>
          </ul>
          <button 
            onClick={user ? () => navigate("/dashboard") : handleLoginClick}
            style={{
              padding: '0.6rem 1.5rem',
              background: user ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #2563EB, #3B82F6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {user ? 'Go to Dashboard' : 'Login'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #0f172a 100%)',
        padding: '6rem 2rem 4rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ color: '#fff', maxWidth: '600px' }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              lineHeight: '1.2',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #fff 0%, #bfdbfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Smart University Event & Club Management System
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#94a3b8',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              A centralized platform to manage events, clubs, attendance, and academic activities
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleLoginClick}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 10px 30px rgba(37, 99, 235, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Get Started
              </button>
              <button 
                onClick={() => scrollToSection("about")}
                style={{
                  padding: '1rem 2rem',
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = '#fff';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{
        background: '#fff',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#0A192F'
          }}>About Campus Connect</h2>
          <p style={{
            textAlign: 'center',
            color: '#64748B',
            fontSize: '1.1rem',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            Campus Connect is a comprehensive platform designed to streamline university club and event management. 
            It provides a centralized system for students, teachers, and administrators to collaborate effectively.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        background: 'linear-gradient(180deg, #F8FAFC 0%, #fff 100%)',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#0A192F'
          }}>Key Features</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { icon: '🏛', title: 'Club Management', desc: 'Create and manage clubs with ease. Track members, activities, and club performance.' },
              { icon: '📅', title: 'Event Management', desc: 'Schedule, organize, and manage events. Track attendance and participation.' },
              { icon: '👥', title: 'Role Management', desc: 'Flexible role-based access for students, teachers, coordinators, and administrators.' },
              { icon: '📊', title: 'Analytics', desc: 'Comprehensive analytics and reporting for better decision making.' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#0A192F' }}>{feature.title}</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" style={{ background: '#fff', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '3rem', color: '#0A192F' }}>Technology Stack</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            {[
              { title: 'Frontend', items: ['React.js', 'JavaScript', 'CSS3', 'Azure AD'] },
              { title: 'Backend', items: ['Node.js', 'Express.js', 'MongoDB', 'REST API'] },
              { title: 'Authentication', items: ['Microsoft OAuth', 'JWT', 'Azure AD B2C'] }
            ].map((group, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0A192F', marginBottom: '1rem' }}>{group.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                  {group.items.map((item, j) => (
                    <span key={j} style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #0A192F, #1e3a5f)',
                      color: '#fff',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #2563EB, #7c3aed)',
        padding: '5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Transform Your Campus Management?</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', marginBottom: '2rem' }}>Join thousands of universities streamlining their event and club management</p>
          <button 
            onClick={handleLoginClick}
            style={{
              padding: '1.2rem 3rem',
              background: '#fff',
              color: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ background: '#0A192F', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <span style={{
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #3B82F6, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Campus Connect</span>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Smart University Event & Club Management System</p>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>© 2024 Campus Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
