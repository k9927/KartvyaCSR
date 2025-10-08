import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-white/90 backdrop-blur-sm shadow-sm'
    }`}>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center no-underline">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CSR
            </span>
            <span className="text-xl font-bold text-gray-800 ml-1">Connect</span>
          </Link>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="items-center hidden space-x-8 md:flex">
            {/* <Link 
              to="/success-stories" 
              className={`no-underline transition-all duration-200 px-3 py-2 rounded-md ${
                isActive('/success-stories') 
                  ? 'text-gray-600 bg-gray-200 shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Success Stories
            </Link> */}
            <Link 
              to="/about-us" 
              className={`no-underline transition-all duration-200 px-3 py-2 rounded-md ${
                isActive('/about-us') 
                  ? 'text-gray-600 bg-gray-200 shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              About Us
            </Link>
            <Link 
              to="/Login" 
              className={`no-underline transition-all duration-200 px-3 py-2 rounded-md ${
                isActive('/Login') 
                  ? 'text-gray-600 bg-gray-200 shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </Link>
            <Link 
              to="/SelectType" 
              className="no-underline px-4 py-2 text-white transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 rounded-md hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5 font-medium"
            >
              Register Now
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md rounded-lg shadow-lg mt-2 border border-gray-100">
              <Link 
                to="/success-stories" 
                className={`no-underline block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive('/success-stories') 
                    ? 'text-gray-600 bg-gray-200 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Success Stories
              </Link>
              <Link 
                to="/about-us" 
                className={`no-underline block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive('/about-us') 
                    ? 'text-gray-600 bg-gray-200 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                to="/Login" 
                className={`no-underline block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive('/Login') 
                    ? 'text-gray-600 bg-gray-200 shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/SelectType" 
                className="no-underline block px-3 py-2 text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-md text-base font-medium transition-all duration-200 hover:from-green-700 hover:to-emerald-700 mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
