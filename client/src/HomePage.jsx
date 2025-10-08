import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from './components/Navbar';

// Import images using Vite's static asset handling
import ref1 from '/images/ref (1).jpg';
import ref2 from '/images/ref (2).jpg';
import ref3 from '/images/ref (3).jpg';
import ref4 from '/images/ref (4).jpg';
import ref5 from '/images/ref (5).jpg';
import logo1 from '/images/logo(1).jpg';
import logo2 from '/images/logo2.jpg';
import logo3 from '/images/logo3.jpg';
import logo4 from '/images/logo4.jpg';
import logo5 from '/images/log05.jpg';
import logo6 from '/images/logo6.jpg';
import logo7 from '/images/logo7.jpg';
import logo from '/images/logo.jpg';

// Enhanced styling for the home page
const styles = `

  /* Hero Section Enhancement */
  .hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .hero-overlay {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    padding: 2rem;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    line-height: 1.6;
    font-weight: 400;
  }

  .hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-hero-primary {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    border-radius: 2rem;
    padding: 1rem 2rem;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
  }

  .btn-hero-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.4);
    color: white;
    text-decoration: none;
  }

  .btn-hero-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
    border-radius: 2rem;
    padding: 1rem 2rem;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
  }

  .btn-hero-secondary:hover {
    background: white;
    color: #667eea;
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
    text-decoration: none;
  }

  /* Section Styling */
  .section-enhanced {
    padding: 5rem 0;
    position: relative;
  }

  .section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  .section-subtitle {
    font-size: 1.1rem;
    color: #495057;
    max-width: 600px;
    margin: 0 auto;
    font-weight: 500;
  }

  /* Why CSR Section */
  .why-csr-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }

  .why-csr-content {
    background: white;
    border-radius: 1.5rem;
    padding: 3rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
  }

  .why-csr-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }

  .why-csr-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #495057;
    margin-bottom: 2rem;
  }

  .highlight-text {
    color: #667eea;
    font-weight: 600;
  }

  /* Stats Section */
  .stats-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .stats-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }

  .stats-grid {
    position: relative;
    z-index: 2;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.5rem;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  }

  .stat-number {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  .stat-label {
    font-size: 1.1rem;
    font-weight: 500;
    opacity: 0.9;
  }

  /* Testimonials Section */
  .testimonials-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }

  .testimonial-card {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .testimonial-card::before {
    content: '"';
    position: absolute;
    top: -10px;
    left: 20px;
    font-size: 4rem;
    color: rgba(102, 126, 234, 0.1);
    font-family: serif;
  }

  .testimonial-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15);
  }

  .testimonial-text {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #495057;
    margin-bottom: 1.5rem;
    font-style: italic;
  }

  .testimonial-author {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
  }

  .testimonial-position {
    color: #495057;
    font-size: 0.9rem;
    font-weight: 500;
  }

  /* Partners Section */
  .partners-section {
    background: white;
  }

  .partner-logo {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e9ecef;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .partner-logo:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.15);
  }

  .partner-logo img {
    max-height: 80px;
    max-width: 100%;
    object-fit: contain;
  }

  /* Footer Enhancement */
  .footer-enhanced {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .footer-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="footer-grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23footer-grain)"/></svg>');
  }

  .footer-content {
    position: relative;
    z-index: 2;
  }

  .footer-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #ffffff;
  }

  .footer-link {
    color: #ecf0f1;
    text-decoration: none;
    transition: all 0.3s ease;
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 400;
  }

  .footer-link:hover {
    color: #ffffff;
    transform: translateX(5px);
    text-decoration: none;
  }

  .newsletter-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2rem;
    padding: 0.75rem 1.5rem;
    color: white;
    backdrop-filter: blur(10px);
  }

  .newsletter-input::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }

  .newsletter-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  }

  .newsletter-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 2rem;
    padding: 0.75rem 1.5rem;
    color: white;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .newsletter-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }
    
    .hero-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .section-title {
      font-size: 2rem;
    }
    
    .stat-number {
      font-size: 2.5rem;
    }
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWhySlide, setCurrentWhySlide] = useState(0);
  const [currentPartnerSlide, setCurrentPartnerSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Hero slideshow images - using imported images
  const heroSlides = [ref1, ref2, ref3];

  // Why CSR slideshow images - using imported images
  const whySlides = [ref4, ref5, ref1, ref2];

  // Partner logos for carousel - using imported images
  const partnerLogos = [
    [logo1, logo, logo3],
    [logo2, logo4, logo5],
    [logo6, logo7, logo3]
  ];

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance hero slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Auto-advance why CSR slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWhySlide((prev) => (prev + 1) % whySlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [whySlides.length]);

  // Auto-advance partner carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPartnerSlide((prev) => (prev + 1) % partnerLogos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [partnerLogos.length]);

  return (
    <>
      <style>{styles}</style>
      <div>
        <Navbar />

        {/* Enhanced Hero Section */}
        <section className="hero-section" style={{ paddingTop: '80px' }}>
          <div className="hero-overlay"></div>
          <div className="absolute inset-0 w-full h-full">
            <div className="relative w-full h-full">
              {heroSlides.map((slide, index) => (
                <img
                  key={index}
                  src={slide}
                  alt={`Hero slide ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    minHeight: '100vh', 
                    width: '100%',
                    height: '100vh',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="hero-content animate-fade-in-up">
            <h1 className="hero-title">Elevating Corporate Social Responsibility</h1>
            <p className="hero-subtitle">
              CSR Connect is India's premier platform for aligning corporations with vetted NGOs, 
              ensuring compliance, transparency, and measurable outcomes under the Companies Act, 2013.
            </p>
            <div className="hero-buttons">
              <a href="#why-csr" className="btn-hero-primary">
                <i className="fas fa-heart me-2"></i>
                Explore CSR Benefits
              </a>
              <Link to="/SelectType" className="btn-hero-secondary">
                <i className="fas fa-rocket me-2"></i>
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Why CSR Section */}
        <section id="why-csr" className="section-enhanced why-csr-section">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-6 mb-5 mb-lg-0">
                <div className="why-csr-content animate-fade-in-up">
                  <h2 className="why-csr-title">
                    <i className="fas fa-star me-3"></i>
                    Why CSR Matters
                  </h2>
                  <p className="why-csr-text">
                    Corporate Social Responsibility (CSR) is not just a moral obligation—it's a strategic advantage. 
                    Did you know that companies with strong CSR programs experience 
                    <span className="highlight-text"> 20% higher employee retention</span> 
                    and <span className="highlight-text">13% higher productivity</span>? 
                    CSR also builds brand loyalty, with <span className="highlight-text">87% of consumers</span> 
                    more likely to support companies that advocate for social issues.
                  </p>
                  <a href="#how-it-works" className="btn btn-primary-enhanced">
                    <i className="fas fa-arrow-right me-2"></i>
                    Learn More
                  </a>
                </div>
              </div>
              <div className="col-lg-6">
                <div 
                  className="position-relative overflow-hidden shadow-lg animate-float" 
                  style={{ 
                    height: '400px', 
                    borderRadius: '1rem',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <div className="position-relative w-100 h-100">
                    {whySlides.map((slide, index) => (
                      <img
                        key={index}
                        src={slide}
                        alt={`Why CSR slide ${index + 1}`}
                        className={`position-absolute w-100 h-100 transition-opacity duration-1000 ease-in-out ${
                          index === currentWhySlide ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          top: 0,
                          left: 0,
                          zIndex: 1
                        }}
                        onError={(e) => {
                          console.log('Image failed to load:', slide);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', slide);
                        }}
                      />
                    ))}
                    <div 
                      className="position-absolute w-100 h-100" 
                      style={{ 
                        top: 0, 
                        left: 0, 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 2
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="section-enhanced stats-section">
          <div className="container">
            <div className="section-header text-center text-white">
              <h2 className="section-title text-white">Our Impact in Numbers</h2>
              <p className="section-subtitle text-white-50">Transforming CSR collaboration across India</p>
            </div>
            <div className="stats-grid row g-4">
              <div className="col-6 col-lg-3">
                <div className="stat-card animate-fade-in-up">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">NGOs Registered</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card animate-fade-in-up">
                  <div className="stat-number">₹100Cr+</div>
                  <div className="stat-label">CSR Funds Facilitated</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card animate-fade-in-up">
                  <div className="stat-number">200+</div>
                  <div className="stat-label">Corporate Partners</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card animate-fade-in-up">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Projects Completed</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Partners Section */}
        <section className="section-enhanced partners-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-handshake me-3"></i>
                Trusted By Leading Organizations
              </h2>
              <p className="section-subtitle">Collaborating with changemakers across industries</p>
            </div>

            <div className="position-relative overflow-hidden">
              <div className="d-flex transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentPartnerSlide * 100}%)` }}>
                {partnerLogos.map((slide, slideIndex) => (
                  <div key={slideIndex} className="flex-shrink-0 w-100">
                    <div className="row justify-content-center">
                      {slide.map((logo, index) => (
                        <div key={slideIndex * 3 + index} className="col-md-4 col-lg-3 mb-4">
                          <div className="partner-logo text-center">
                            <img 
                              src={logo} 
                              className="img-fluid" 
                              alt={`Partner ${slideIndex * 3 + index + 1}`} 
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Carousel Controls */}
              <button 
                className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle p-3 shadow"
                onClick={() => setCurrentPartnerSlide((prev) => (prev - 1 + partnerLogos.length) % partnerLogos.length)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle p-3 shadow"
                onClick={() => setCurrentPartnerSlide((prev) => (prev + 1) % partnerLogos.length)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials */}
        <section className="section-enhanced testimonials-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-quote-left me-3"></i>
                What Our Partners Say
              </h2>
              <p className="section-subtitle">Real stories from real impact makers</p>
            </div>
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="testimonial-card animate-fade-in-up h-100 d-flex flex-column">
                  <p className="testimonial-text flex-grow-1">
                    "Working with CSR Connect has streamlined our funding process and allowed us to focus on high-impact projects. A truly transformative experience."
                  </p>
                  <div className="testimonial-author">Sara Khan</div>
                  <div className="testimonial-position">Director, Education First NGO</div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="testimonial-card animate-fade-in-up h-100 d-flex flex-column">
                  <p className="testimonial-text flex-grow-1">
                    "The AI-powered NGO-Corporate matching at CSR Connect has helped us find partners aligned with our CSR goals. Highly recommend their services."
                  </p>
                  <div className="testimonial-author">Mohammed Ahmed</div>
                  <div className="testimonial-position">CSR Head, TechCorp India</div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="testimonial-card animate-fade-in-up h-100 d-flex flex-column">
                  <p className="testimonial-text flex-grow-1">
                    "CSR Connect has simplified our CSR journey, from finding NGOs to tracking our impact. A reliable and efficient platform."
                  </p>
                  <div className="testimonial-author">Lila Patel</div>
                  <div className="testimonial-position">Sustainability Manager, GreenFuture Ltd</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="footer-enhanced py-5">
          <div className="container footer-content">
            <div className="row g-4">
              <div className="col-lg-3 col-md-6">
                <h5 className="footer-title">
                  <i className="fas fa-building me-2"></i>
                  About CSR Connect
                </h5>
                <p className="text-light">
                  Bridging the gap between NGOs and Corporates to create meaningful social impact through efficient CSR collaboration.
                </p>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="footer-title">
                  <i className="fas fa-link me-2"></i>
                  Quick Links
                </h5>
                <ul className="list-unstyled">
                  <li><a href="#" className="footer-link">Home</a></li>
                  <li><a href="#" className="footer-link">About Us</a></li>
                  <li><a href="#" className="footer-link">How It Works</a></li>
                  <li><a href="#" className="footer-link">Success Stories</a></li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="footer-title">
                  <i className="fas fa-book me-2"></i>
                  Resources
                </h5>
                <ul className="list-unstyled">
                  <li><a href="#" className="footer-link">FAQs</a></li>
                  <li><a href="#" className="footer-link">Blog</a></li>
                  <li><a href="#" className="footer-link">Contact Us</a></li>
                  <li><a href="#" className="footer-link">Privacy Policy</a></li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-6">
                <h5 className="footer-title">
                  <i className="fas fa-envelope me-2"></i>
                  Newsletter
                </h5>
                <p className="text-light mb-3">Stay updated with the latest CSR news and success stories.</p>
                <form className="mb-3">
                  <div className="input-group">
                    <input 
                      type="email" 
                      className="form-control newsletter-input" 
                      placeholder="Enter your email" 
                    />
                    <button className="btn newsletter-btn" type="submit">
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <hr className="my-4 border-secondary" />
            <div className="text-center text-light">
              <small>&copy; 2024 CSR Connect. All rights reserved.</small>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
