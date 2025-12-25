# KartvyaCSR - Corporate Social Responsibility Platform

A comprehensive full-stack web application that connects NGOs (Non-Governmental Organizations) with Corporations for effective CSR (Corporate Social Responsibility) collaboration, ensuring compliance, transparency, and measurable outcomes under the Companies Act, 2013.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)
- [Key Features Explained](#key-features-explained)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

KartvyaCSR is India's premier platform for aligning corporations with vetted NGOs, facilitating CSR fund allocation, project management, and impact tracking. The platform provides:

- **For NGOs**: Registration, project listing, partnership management, fund utilization tracking
- **For Corporations**: NGO discovery, partnership creation, CSR fund management, compliance tracking
- **For Both**: Secure messaging, document verification, dashboard analytics, and reporting

## ✨ Features

### Core Features
- 🔐 **User Authentication & Authorization**: Secure JWT-based authentication for NGOs and Corporations
- 📝 **Registration System**: Separate registration flows for NGOs and Corporate entities
- 📊 **Dual Dashboards**: Customized dashboards for NGOs and Corporations
- 🤝 **Partnership Management**: Create, manage, and track partnerships between NGOs and Corporations
- 💰 **Fund Management**: Track CSR fund allocation, commitment, and disbursement
- 📁 **Document Verification**: Automated document verification using Puppeteer
- 💬 **Messaging System**: In-app messaging for partnership communication
- 📈 **Analytics & Reporting**: Visual analytics using Recharts
- 📤 **Data Export**: CSV export functionality for reports
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and Bootstrap

### Advanced Features
- 🔍 **NGO Directory**: Searchable directory with filters (focus area, verification status)
- 📸 **File Uploads**: Secure file upload system for documents and images
- 🔔 **Notifications**: Real-time notification system
- 📅 **Meeting Scheduling**: Schedule and manage partnership meetings
- 📋 **Project Management**: Create, update, and track project progress
- 💾 **Fund Utilization Tracking**: Detailed tracking of how CSR funds are utilized

## 🛠 Technology Stack

### Frontend
- **React 19.1.0** - UI library
- **Vite 7.0.4** - Build tool and dev server
- **React Router DOM 7.7.1** - Client-side routing
- **Tailwind CSS 3.4.3** - Utility-first CSS framework
- **Bootstrap 5.3.8** - CSS framework
- **Recharts 3.2.1** - Charting library
- **React Hot Toast 2.5.2** - Toast notifications
- **Lucide React** - Icon library
- **AOS (Animate On Scroll)** - Scroll animations

### Backend
- **Node.js** - Runtime environment
- **Express 4.21.2** - Web framework
- **PostgreSQL** - Relational database
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Bcrypt 6.0.0** - Password hashing
- **Multer 1.4.5** - File upload handling
- **Puppeteer 24.23.0** - Document verification/automation
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.6.1** - Environment variable management

## 📁 Project Structure

```
KartvyaCSR/
├── client/                 # Frontend React application
│   ├── public/
│   │   └── images/        # Static images
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── NGO/
│   │   │   ├── Corporate/
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js     # API service layer
│   │   ├── styles/        # CSS files
│   │   ├── App.jsx        # Main app component
│   │   ├── HomePage.jsx   # Landing page
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Backend Node.js application
│   ├── docver/            # Document verification module
│   ├── uploads/           # Uploaded files directory
│   ├── index.js           # Main server file
│   └── package.json
│
└── README.md              # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Project-SoftwareEngineering/KartvyaCSR.git
cd KartvyaCSR
```

### Step 2: Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd ../server
npm install
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
PGUSER=your_postgres_username
PGHOST=localhost
PGDATABASE=kartvyacsr_db
PGPASSWORD=your_postgres_password
PGPORT=5432

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

**Important**: Replace the placeholder values with your actual configuration.

### Step 5: Database Setup

1. **Create PostgreSQL Database**:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kartvyacsr_db;

# Exit PostgreSQL
\q
```

2. **Initialize Database Tables**:

The application will automatically create necessary tables when you start the server for the first time. The tables include:
- `users` - User accounts
- `ngo_profiles` - NGO profile information
- `corporate_profiles` - Corporate profile information
- `projects` - NGO projects
- `active_partnerships` - Active partnerships
- `csr_funding` - CSR fund records
- `fund_utilization` - Fund utilization tracking
- `partnership_messages` - Messaging system
- And more...

## 🏃 Running the Application

### Development Mode

#### Terminal 1 - Start Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

#### Terminal 2 - Start Frontend Development Server

```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173` (default Vite port).

### Production Mode

#### Build Frontend

```bash
cd client
npm run build
```

#### Start Backend

```bash
cd server
npm start
```

## 🔐 Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PGUSER` | PostgreSQL username | `postgres` |
| `PGHOST` | PostgreSQL host | `localhost` |
| `PGDATABASE` | Database name | `kartvyacsr_db` |
| `PGPASSWORD` | PostgreSQL password | `your_password` |
| `PGPORT` | PostgreSQL port | `5432` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## 🗄️ Database Setup

### Manual Database Schema (Optional)

If you prefer to set up the database manually, you can run SQL scripts. However, the application automatically creates tables on first run.

### Key Database Tables

- **users**: Core user authentication and basic info
- **ngo_profiles**: Extended NGO profile data
- **corporate_profiles**: Extended corporate profile data
- **projects**: NGO project listings
- **active_partnerships**: Current partnerships between NGOs and corporates
- **csr_funding**: CSR fund commitments and disbursements
- **fund_utilization**: Detailed fund usage tracking
- **partnership_messages**: Communication between partners
- **user_notifications**: Notification system

## 📡 API Endpoints

### Authentication
- `POST /api/register/ngo` - Register NGO
- `POST /api/register/corporate` - Register Corporate
- `POST /api/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### NGO Endpoints
- `GET /api/ngo/dashboard` - Get NGO dashboard data
- `GET /api/ngo/projects` - Get NGO projects
- `POST /api/ngo/projects` - Create new project
- `PUT /api/ngo/projects/:id` - Update project
- `GET /api/ngo/partnerships` - Get NGO partnerships
- `GET /api/ngo/history` - Get partnership history

### Corporate Endpoints
- `GET /api/corporate/dashboard` - Get corporate dashboard data
- `GET /api/corporate/ngos` - Get NGO directory
- `POST /api/corporate/save-ngo` - Save NGO to shortlist
- `GET /api/corporate/saved-ngos` - Get saved NGOs
- `POST /api/corporate/create-partnership` - Create partnership
- `GET /api/corporate/partnerships` - Get corporate partnerships
- `GET /api/corporate/history` - Get partnership history

### File Upload
- `POST /api/upload` - Upload files (documents, images)

### Document Verification
- `POST /api/verify-document` - Verify uploaded documents

## 👥 User Roles

### NGO User
- Register and create profile
- Create and manage projects
- View partnership requests
- Track fund utilization
- Communicate with corporate partners
- View analytics and reports

### Corporate User
- Register and create company profile
- Browse and search NGO directory
- Save NGOs to shortlist
- Create partnerships
- Manage CSR fund allocation
- Track partnership progress
- View compliance reports

## 🔑 Key Features Explained

### 1. Document Verification
The platform uses Puppeteer for automated document verification, ensuring uploaded documents (registration certificates, 80G certificates, etc.) are valid.

### 2. Fund Utilization Tracking
Corporates can track how their CSR funds are being utilized by NGOs, with detailed breakdowns by category and supporting photos.

### 3. Partnership Management
Complete lifecycle management of partnerships from creation to completion, including messaging, meeting scheduling, and progress tracking.

### 4. Analytics Dashboard
Both NGOs and Corporates get comprehensive dashboards with:
- Partnership statistics
- Fund allocation charts
- Project progress tracking
- Activity logs

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Ensure PostgreSQL is running
- Verify database credentials in `.env` file
- Check if database exists: `psql -U postgres -l`

#### 2. Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution**: 
- Change `PORT` in `.env` file
- Or kill the process using the port: `lsof -ti:5000 | xargs kill`

#### 3. Module Not Found
```
Error: Cannot find module 'xxx'
```
**Solution**: 
- Run `npm install` in the respective directory (client or server)
- Delete `node_modules` and `package-lock.json`, then reinstall

#### 4. CORS Error
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution**: 
- Ensure CORS is properly configured in `server/index.js`
- Check that backend server is running

#### 5. JWT Token Error
```
Error: jwt malformed
```
**Solution**: 
- Clear browser localStorage
- Log out and log in again
- Verify `JWT_SECRET` is set in `.env`

### Getting Help

If you encounter issues not listed here:
1. Check the console logs (both browser and terminal)
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check database connection and table existence

## 📝 Notes for Teachers/Evaluators

### Accessing the Application

1. **Start the Application**:
   - Follow the [Installation & Setup](#installation--setup) guide
   - Ensure PostgreSQL is running
   - Start both frontend and backend servers

2. **Test Accounts** (if available):
   - Check if there are seed data scripts or test accounts
   - Otherwise, register new accounts through the UI

3. **Key Areas to Review**:
   - **Registration Flow**: Test both NGO and Corporate registration
   - **Dashboard Functionality**: Check analytics and data visualization
   - **Partnership Creation**: Test the complete partnership workflow
   - **File Upload**: Test document upload and verification
   - **Messaging System**: Test communication features
   - **Responsive Design**: Test on different screen sizes

4. **Code Structure**:
   - Frontend components are well-organized in `client/src/components/`
   - Backend API routes are in `server/index.js`
   - Database queries use parameterized statements for security

### Project Highlights

- **Full-stack application** with modern React frontend and Express backend
- **Secure authentication** using JWT tokens
- **Database-driven** with PostgreSQL
- **File handling** with Multer for document uploads
- **Document verification** using Puppeteer
- **Responsive UI** with Tailwind CSS and Bootstrap
- **Real-time features** like notifications and messaging

## 🤝 Contributing

This is a Software Engineering course project. For contributions or improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is created for educational purposes as part of a Software Engineering course.

## 👨‍💻 Development Team

Project developed for Software Engineering course at [Your Institution Name].

---

## 📞 Support

For questions or issues regarding this project, please contact the development team or refer to the project documentation.

---

**Note**: This README provides comprehensive information for accessing and understanding the KartvyaCSR platform. Ensure all prerequisites are met and environment variables are configured before running the application.

