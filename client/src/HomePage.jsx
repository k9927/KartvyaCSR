import React, { useState, useEffect } from 'react';

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

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWhySlide, setCurrentWhySlide] = useState(0);
  const [currentPartnerSlide, setCurrentPartnerSlide] = useState(0);

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
    <div>
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">CSR</span>
              <span className="text-xl text-gray-800">Connect</span>
            </a>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900 focus:outline-none">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop menu */}
            <div className="items-center hidden space-x-8 md:flex">
              <a href="/success-stories" className="text-gray-600 transition-colors hover:text-gray-900">Success Stories</a>
              <a href="/about-us" className="text-gray-600 transition-colors hover:text-gray-900">About Us</a>
              <a href="/login" className="text-gray-600 transition-colors hover:text-gray-900">Login</a>
              <a href="/register" className="px-4 py-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700">Register Now</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Slideshow */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden text-white hero-section">
        <div className="absolute inset-0 w-full h-full">
          <div className="relative w-full h-full">
            {heroSlides.map((slide, index) => (
              <img
                key={index}
                src={slide}
                alt={`Hero slide ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ 
                  minHeight: '100vh', 
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl px-4 mx-auto text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">Elevating Corporate Social Responsibility</h1>
          <p className="max-w-3xl mx-auto mb-8 text-xl md:text-2xl">
            CSR Connect is India's premier platform for aligning corporations with vetted NGOs, ensuring compliance, transparency, and measurable outcomes under the Companies Act, 2013.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#why-csr" className="px-8 py-3 text-lg font-semibold text-white transition-colors bg-green-600 rounded-md hover:bg-green-700">
              Explore CSR Benefits
            </a>
            <a href="/register" className="px-8 py-3 text-lg font-semibold text-white transition-colors border-2 border-white rounded-md hover:bg-white hover:text-gray-900">
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Why CSR Matters Section */}
      <section id="why-csr" className="py-16 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-blue-600 md:text-4xl">Why CSR Matters</h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-700">
                Corporate Social Responsibility (CSR) is not just a moral obligation—it's a strategic advantage. 
                Did you know that companies with strong CSR programs experience <strong className="text-blue-600">20% higher employee retention</strong> 
                and <strong className="text-blue-600">13% higher productivity</strong>? CSR also builds brand loyalty, with <strong className="text-blue-600">87% of consumers</strong> 
                more likely to support companies that advocate for social issues.
              </p>
              <a href="#how-it-works" className="inline-block px-6 py-3 font-semibold text-white transition-colors bg-green-600 rounded-md hover:bg-green-700">
                Learn More
              </a>
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg shadow-lg why-csr-section md:h-96">
              <div className="relative w-full h-full">
                {whySlides.map((slide, index) => (
                  <img
                    key={index}
                    src={slide}
                    alt={`Why CSR slide ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-in-out ${
                      index === currentWhySlide ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      maxWidth: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                ))}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Clients Section */}
      <section className="py-16 bg-gray-50">
        <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12">
            <h3 className="mb-4 text-3xl font-bold text-blue-600">Trusted By Leading Organizations</h3>
            <p className="text-lg text-gray-600">Collaborating with changemakers across industries</p>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentPartnerSlide * 100}%)` }}>
              {partnerLogos.map((slide, slideIndex) => (
                <div key={slideIndex} className="flex-shrink-0 w-full">
                  <div className="flex flex-wrap items-center justify-center">
                    {slide.map((logo, index) => (
                      <img 
                        key={slideIndex * 3 + index} 
                        src={logo} 
                        className="object-contain w-24 h-16 mx-2 transition-transform duration-300 md:w-32 md:h-20 md:mx-4 hover:scale-110" 
                        alt={`Partner ${slideIndex * 3 + index + 1}`} 
                        loading="lazy" 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Controls */}
            <button 
              className="absolute left-0 p-2 text-white transition-all transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full top-1/2 hover:bg-opacity-70"
              onClick={() => setCurrentPartnerSlide((prev) => (prev - 1 + partnerLogos.length) % partnerLogos.length)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              className="absolute right-0 p-2 text-white transition-all transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full top-1/2 hover:bg-opacity-70"
              onClick={() => setCurrentPartnerSlide((prev) => (prev + 1) % partnerLogos.length)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            <div className="p-4 text-center transition-transform duration-300 bg-white rounded-lg shadow-md md:p-8 hover:-translate-y-1 hover:shadow-lg">
              <h2 className="mb-2 text-2xl font-bold text-blue-600 md:text-4xl">500+</h2>
              <p className="text-sm text-gray-600 md:text-base">NGOs Registered</p>
            </div>
            <div className="p-4 text-center transition-transform duration-300 bg-white rounded-lg shadow-md md:p-8 hover:-translate-y-1 hover:shadow-lg">
              <h2 className="mb-2 text-2xl font-bold text-green-600 md:text-4xl">₹100Cr+</h2>
              <p className="text-sm text-gray-600 md:text-base">CSR Funds Facilitated</p>
            </div>
            <div className="p-4 text-center transition-transform duration-300 bg-white rounded-lg shadow-md md:p-8 hover:-translate-y-1 hover:shadow-lg">
              <h2 className="mb-2 text-2xl font-bold text-blue-600 md:text-4xl">200+</h2>
              <p className="text-sm text-gray-600 md:text-base">Corporate Partners</p>
            </div>
            <div className="p-4 text-center transition-transform duration-300 bg-white rounded-lg shadow-md md:p-8 hover:-translate-y-1 hover:shadow-lg">
              <h2 className="mb-2 text-2xl font-bold text-green-600 md:text-4xl">1000+</h2>
              <p className="text-sm text-gray-600 md:text-base">Projects Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-blue-600">What Our Partners Say</h3>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <p className="mb-6 italic text-gray-600">
                "Working with Project CSR has streamlined our funding process and allowed us to focus on high-impact projects. A truly transformative experience."
              </p>
              <h6 className="font-semibold text-gray-800">Jane Smith</h6>
              <p className="text-gray-500">Sara Khan</p>
            </div>
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <p className="mb-6 italic text-gray-600">
                "The AI-powered NGO-Corporate matching at Project CSR has helped us find partners aligned with our CSR goals. Highly recommend their services."
              </p>
              <h6 className="font-semibold text-gray-800">David Lee</h6>
              <p className="text-gray-500">Mohammed Ahmed</p>
            </div>
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <p className="mb-6 italic text-gray-600">
                "Project CSR has simplified our CSR journey, from finding NGOs to tracking our impact. A reliable and efficient platform."
              </p>
              <h6 className="font-semibold text-gray-800">Emily Chen</h6>
              <p className="text-gray-500">Lila Patel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-white bg-gray-900">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h5 className="mb-4 text-xl font-semibold">About CSR Connect</h5>
              <p className="text-gray-300">
                Bridging the gap between NGOs and Corporates to create meaningful social impact through efficient CSR collaboration.
              </p>
            </div>
            <div>
              <h5 className="mb-4 text-xl font-semibold">Quick Links</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">How It Works</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 text-xl font-semibold">Resources</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">FAQs</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 transition-colors hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 text-xl font-semibold">Newsletter</h5>
              <p className="mb-4 text-gray-300">Stay updated with the latest CSR news and success stories.</p>
              <form className="mb-4">
                <div className="flex">
                  <input 
                    type="email" 
                    className="flex-1 px-4 py-2 text-gray-900 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="Enter your email" 
                  />
                  <button className="px-4 py-2 text-white transition-colors bg-green-600 rounded-r-md hover:bg-green-700">
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
          <hr className="my-8 border-gray-700" />
          <div className="text-center text-gray-300">
            <small>&copy; 2024 CSR Connect. All rights reserved.</small>
          </div>
        </div>
      </footer>
    </div>
  );
}
