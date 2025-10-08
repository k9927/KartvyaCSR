import React from 'react';
import { Link } from 'react-router-dom';

const SelectType = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link className="flex items-baseline space-x-1 text-2xl font-semibold" to="/">
            <span className="text-blue-600 font-bold">CSR</span>
            <span className="text-green-600">Connect</span>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-4xl font-extrabold tracking-tight mb-12">
            Choose Your Registration Type
          </h2>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {/* NGO */}
            <div className="flex">
              <div className="flex flex-col w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 min-h-[520px]">
                {/* Title + subtitle block fixed height so both cards balance */}
                <div className="text-center mb-6 min-h-[110px] flex flex-col justify-center">
                  <h3 className="text-2xl font-semibold mb-2">I'm an NGO</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Register your organization and connect with
                    corporate partners
                  </p>
                </div>

                {/* Features */}
                <ul className="list-none text-gray-800 space-y-3 leading-relaxed mb-8">
                  <li>✓ List your projects</li>
                  <li>✓ Receive CSR funding</li>
                  <li>✓ Track project progress</li>
                  <li>✓ Generate impact reports</li>
                </ul>

                {/* CTA pinned bottom */}
                <div className="mt-auto">
                  <Link
                    to="/ngo"
                    className="inline-flex justify-center items-center w-full py-3 px-4 text-white bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium"
                  >
                    Register as NGO
                  </Link>
                </div>
              </div>
            </div>

            {/* Corporate */}
            <div className="flex">
              <div className="flex flex-col w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-8 min-h-[520px]">
                <div className="text-center mb-6 min-h-[110px] flex flex-col justify-center">
                  <h3 className="text-2xl font-semibold mb-2">I'm a Corporate</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Find and fund impactful CSR projects
                  </p>
                </div>

                <ul className="list-none text-gray-800 space-y-3 leading-relaxed mb-8">
                  <li>✓ Discover verified NGOs</li>
                  <li>✓ Monitor fund utilization</li>
                  <li>✓ Get detailed reports</li>
                  <li>✓ Measure social impact</li>
                </ul>

                <div className="mt-auto">
                  <Link
                    to="/corporate"
                    className="inline-flex justify-center items-center w-full py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-medium"
                  >
                    Register as Corporate
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Login */}
          <div className="text-center mt-10">
            <p className="text-gray-700">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectType;
