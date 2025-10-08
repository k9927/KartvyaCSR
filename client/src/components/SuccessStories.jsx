import React from 'react';
import Navbar from './Navbar';

const SuccessStories = () => {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <div className="container py-5">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className="display-4 fw-bold text-primary mb-4">Success Stories</h1>
              <p className="lead text-muted mb-5">
                Discover how CSR Connect has transformed lives and communities across India
              </p>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-primary">Education Transformation</h5>
                  <p className="card-text">
                    How TechCorp India partnered with Education First NGO to provide digital 
                    learning tools to 500+ underprivileged students across rural Maharashtra.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Impact: 500+ students</small>
                    <span className="badge bg-success">Completed</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-primary">Healthcare Initiative</h5>
                  <p className="card-text">
                    GreenFuture Ltd's collaboration with HealthCare NGO resulted in mobile 
                    medical camps serving 2000+ villagers in remote areas of Karnataka.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Impact: 2000+ villagers</small>
                    <span className="badge bg-success">Completed</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title text-primary">Women Empowerment</h5>
                  <p className="card-text">
                    FinanceCorp's partnership with WomenEmpower NGO trained 300+ women 
                    in vocational skills, leading to sustainable income generation.
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Impact: 300+ women</small>
                    <span className="badge bg-success">Completed</span>
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

export default SuccessStories;
