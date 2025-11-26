# KARTVYA CSR PLATFORM - PROJECT OVERVIEW

## 🎯 PROJECT SUMMARY

**Kartvya** is a comprehensive Corporate Social Responsibility (CSR) management platform that digitally connects Corporate entities with Non-Governmental Organizations (NGOs) to streamline CSR initiatives, facilitate transparent funding management, and enhance collaborative project execution.

---

## 📋 PROBLEM STATEMENT

Traditional CSR management faces critical challenges:

- **Fragmented Communication**: Lack of centralized platform for corporate-NGO collaboration
- **Limited Transparency**: Difficulty in tracking fund utilization and project progress
- **Inefficient Discovery**: Corporates struggle to identify suitable NGO partners for their CSR goals
- **Manual Processes**: Paper-based documentation leading to delays and errors
- **Compliance Gaps**: Challenges in maintaining regulatory compliance and audit trails

---

## 💡 SOLUTION

Kartvya provides an integrated web-based platform that:

- **Centralizes CSR Operations**: Single platform for project discovery, partnership management, and funding tracking
- **Enables Smart Matching**: Facilitates discovery of NGO projects aligned with corporate CSR focus areas and regions
- **Ensures Transparency**: Real-time tracking of funding commitments, disbursements, and project progress
- **Digitizes Workflows**: Automated document management, verification, and communication systems
- **Provides Insights**: Comprehensive analytics dashboards for data-driven CSR decision-making

---

## 🔑 KEY FEATURES

### For Corporates

- Browse and discover NGO projects by focus area, location, and region
- Submit CSR funding requests with budget proposals
- Track active partnerships and monitor project progress
- Manage fund disbursements and view utilization reports
- Access analytics dashboard with investment insights and partnership metrics

### For NGOs

- Create and manage multiple CSR projects with detailed information
- Receive, review, and accept/reject CSR funding requests
- Track active partnerships with corporate entities
- Upload fund utilization reports and project documentation
- Generate reports and view analytics on partnerships and funding

### Platform Capabilities

- **User Management**: Role-based authentication with document verification
- **Project Management**: Complete lifecycle management from creation to completion
- **Partnership Workflow**: Automated CSR request-acceptance-partnership pipeline
- **Communication System**: In-app messaging and notification system
- **Analytics & Reporting**: Real-time dashboards with charts and financial insights
- **Document Management**: Secure file upload, storage, and verification

---

## 🛠️ TECHNOLOGY STACK

| Component          | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Frontend**       | React 19.1.0, React Router, Tailwind CSS, Recharts, Lucide Icons |
| **Backend**        | Node.js, Express.js                                              |
| **Database**       | PostgreSQL (Neon Cloud)                                          |
| **Authentication** | JWT (JSON Web Tokens) with refresh tokens                        |
| **File Storage**   | Local file system with Multer                                    |
| **API Design**     | RESTful API architecture                                         |
| **UI/UX**          | Responsive design with modern, intuitive interface               |

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                        │
│  (Corporate Dashboard | NGO Dashboard | Authentication)  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
┌───────────────────────▼─────────────────────────────────┐
│              NODE.JS/EXPRESS BACKEND                     │
│   (API Routes | Business Logic | Authentication)         │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────┐  ┌──────▼────┐  ┌──────▼────┐
│ PostgreSQL │  │   File    │  │   JWT     │
│  Database  │  │  Storage  │  │  Service  │
└────────────┘  └───────────┘  └───────────┘
```

---

## 📊 CORE WORKFLOW

1. **Registration & Verification**: Corporates and NGOs register with document verification
2. **Project Creation**: NGOs create projects with funding requirements and details
3. **Project Discovery**: Corporates browse projects filtered by focus area, location, and region
4. **CSR Request**: Corporates submit funding requests for selected NGO projects
5. **Request Processing**: NGOs review and accept/reject CSR requests
6. **Partnership Activation**: Accepted requests create active partnerships
7. **Collaboration**: Real-time project tracking, fund utilization, and communication
8. **Reporting**: Analytics and reports for stakeholders and compliance

---

## 📈 PROJECT SCOPE & METRICS

- **Target Users**: Corporate CSR teams, NGO project managers, Platform administrators
- **Primary Focus Areas**: Healthcare, Education, Environment, Rural Development, Women Empowerment, Skill Development
- **Regions Covered**: Pan-India coverage with regional filtering capabilities
- **Key Deliverables**: Fully functional web application, responsive UI, RESTful API, comprehensive documentation

---

## ✨ DISTINGUISHING FEATURES

- **Dual Dashboard System**: Separate optimized interfaces for Corporates and NGOs
- **Real-time Analytics**: Interactive charts and graphs for data visualization
- **Complete Audit Trail**: Comprehensive history tracking for all partnerships and transactions
- **Fund Utilization Tracking**: Detailed tracking of CSR fund allocation and usage
- **Seamless Communication**: Built-in chat and messaging system for partnership collaboration
- **Document Management**: Secure storage and verification of registration documents, MoUs, and reports

---

## 🎓 PROJECT TYPE

**Web Application** - Corporate Social Responsibility Management System  
**Domain**: Social Impact, Corporate Governance, Non-Profit Technology

---

_This platform bridges the gap between corporate social responsibility goals and grassroots impact, enabling transparent, efficient, and measurable CSR initiatives._
