import React from 'react';
import Navbar from './Navbar';

const AboutUs = () => {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <div className="container py-5">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h1 className="display-4 fw-bold text-primary mb-4">About CSR Connect</h1>
              <p className="lead text-muted">
                Bridging the gap between NGOs and Corporates to create meaningful social impact
              </p>
            </div>
          </div>
          
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 className="fw-bold text-primary mb-4">Our Mission</h2>
              <p className="lead mb-4">
                To revolutionize Corporate Social Responsibility in India by creating a seamless 
                platform that connects verified NGOs with corporate partners, ensuring transparency, 
                compliance, and measurable impact.
              </p>
              <p className="text-muted">
                We believe that effective CSR collaboration can drive sustainable development 
                and create lasting positive change in communities across India.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="bg-light p-4 rounded-3">
                <h3 className="fw-bold text-primary mb-3">Our Values</h3>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    <strong>Transparency:</strong> Complete visibility into project progress and impact
                  </li>
                  <li className="mb-3">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    <strong>Compliance:</strong> Ensuring adherence to Companies Act, 2013
                  </li>
                  <li className="mb-3">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    <strong>Impact:</strong> Focus on measurable and sustainable outcomes
                  </li>
                  <li className="mb-3">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    <strong>Innovation:</strong> Leveraging technology for better collaboration
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="row mt-5">
            <div className="col-12">
              <h2 className="fw-bold text-primary text-center mb-5">Our Team</h2>
              <div className="row g-4">
                <div className="col-lg-4 col-md-6 text-center">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="bg-primary rounded-circle mx-auto mb-3" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user text-white fs-3"></i>
                      </div>
                      <h5 className="card-title">Rahul Sharma</h5>
                      <p className="card-text text-muted">Founder & CEO</p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 text-center">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="bg-primary rounded-circle mx-auto mb-3" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user text-white fs-3"></i>
                      </div>
                      <h5 className="card-title">Priya Patel</h5>
                      <p className="card-text text-muted">Head of Operations</p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6 text-center">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="bg-primary rounded-circle mx-auto mb-3" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user text-white fs-3"></i>
                      </div>
                      <h5 className="card-title">Amit Kumar</h5>
                      <p className="card-text text-muted">Technology Lead</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUs;
