import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import pg from "pg";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// ENHANCED ERROR HANDLING UTILITIES
// =============================================

// Enhanced error logging function
const logError = (operation, error, req = null) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    operation,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    }
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      user: req.user || null
    };
  }

  console.error('🚨 ERROR LOG:', JSON.stringify(errorInfo, null, 2));
};

// Enhanced success logging function
const logSuccess = (operation, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`✅ SUCCESS [${timestamp}] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
};

// Standardized error response function
const sendErrorResponse = (res, statusCode, message, error = null, operation = '') => {
  // Log error to terminal
  if (error) {
    logError(operation, error, res.req);
  } else {
    console.error(`❌ ${operation}: ${message}`);
  }

  // Send consistent error response to frontend
  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = {
      message: error.message,
      code: error.code,
      name: error.name
    };
  }

  res.status(statusCode).json(response);
};

// Standardized success response function
const sendSuccessResponse = (res, data = null, message = 'Success', operation = '') => {
  logSuccess(operation, data);
  
  const response = {
    success: true,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (data) {
    response.data = data;
  }

  res.json(response);
};


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));



// Database connection
const db = new pg.Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  });



// JWT Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return sendErrorResponse(res, 401, "Access token is required", null, 'Authentication');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return sendErrorResponse(res, 401, "Invalid or expired token", err, 'Authentication');
  }
};



// Basic test route
app.get("/", (req, res) => {
  res.send("PixelForge Nexus Server is running ✅");
});

// Register route
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return sendErrorResponse(res, 400, "Email, password, and name are required", null, 'User Registration');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, "Please provide a valid email address", null, 'User Registration');
    }

    // Validate password strength
    if (password.length < 8) {
      return sendErrorResponse(res, 400, "Password must be at least 8 characters long", null, 'User Registration');
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, "An account with this email already exists", null, 'User Registration');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, name, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id, email, name`,
      [email, hashedPassword, name]
    );

    // Generate JWT token for auto-login
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userData = {
          id: newUser.rows[0].id,
          email: newUser.rows[0].email,
      name: newUser.rows[0].name
    };

    sendSuccessResponse(res, { user: userData, token }, "Account created successfully! Welcome aboard!", 'User Registration');

  } catch (error) {
    sendErrorResponse(res, 500, "Registration failed. Please try again later.", error, 'User Registration');
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required", null, 'User Login');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, "Please provide a valid email address", null, 'User Login');
    }

    // Find user by email
    const user = await db.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 401, "Invalid email or password", null, 'User Login');
    }

    const userData = user.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return sendErrorResponse(res, 401, "Invalid email or password", null, 'User Login');
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userData.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const loginData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      token
    };

    sendSuccessResponse(res, loginData, "Welcome back! Login successful", 'User Login');

  } catch (error) {
    sendErrorResponse(res, 500, "Login failed. Please try again later.", error, 'User Login');
  }
});

// Protected route example
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, email, role, name, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, "User profile not found", null, 'Get User Profile');
    }

    sendSuccessResponse(res, { user: user.rows[0] }, "User profile retrieved successfully", 'Get User Profile');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve user profile", error, 'Get User Profile');
  }
});

// Wellness Sessions APIs

// GET /sessions - Public wellness sessions
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await db.query(
      `SELECT ws.*, u.name as author_name 
       FROM wellness_sessions ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.is_published = true
       ORDER BY ws.created_at DESC
       LIMIT 50`
    );

    sendSuccessResponse(res, { sessions: sessions.rows }, `Found ${sessions.rows.length} wellness sessions`, 'Get Public Sessions');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve wellness sessions", error, 'Get Public Sessions');
  }
});

// GET /my-sessions - User's own sessions (draft + published)
app.get("/api/my-sessions", authenticate, async (req, res) => {
  try {
    const sessions = await db.query(
      `SELECT * FROM wellness_sessions 
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    sendSuccessResponse(res, { sessions: sessions.rows }, `Found ${sessions.rows.length} of your sessions`, 'Get User Sessions');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve your sessions", error, 'Get User Sessions');
  }
});

// GET /my-sessions/:id - View a single user session
app.get("/api/my-sessions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate session ID
    if (!id || isNaN(id)) {
      return sendErrorResponse(res, 400, "Valid session ID is required", null, 'Get Session');
    }
    
    const session = await db.query(
      `SELECT * FROM wellness_sessions 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (session.rows.length === 0) {
      return sendErrorResponse(res, 404, "Session not found or you don't have access to it", null, 'Get Session');
    }

    sendSuccessResponse(res, { session: session.rows[0] }, "Session retrieved successfully", 'Get Session');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve session", error, 'Get Session');
  }
});

// POST /my-sessions/save-draft - Save or update a draft session
app.post("/api/my-sessions/save-draft", authenticate, async (req, res) => {
  try {
    const { id, title, tags, content_url, content_data } = req.body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return sendErrorResponse(res, 400, "Session title is required", null, 'Save Draft');
    }

    if (title.length > 200) {
      return sendErrorResponse(res, 400, "Title must be less than 200 characters", null, 'Save Draft');
    }

    let result;
    
    if (id) {
      // Validate session ID
      if (isNaN(id)) {
        return sendErrorResponse(res, 400, "Valid session ID is required", null, 'Save Draft');
      }

      // Update existing session
      result = await db.query(
        `UPDATE wellness_sessions 
         SET title = $1, tags = $2, content_url = $3, content_data = $4, 
             is_draft = true, is_published = false, updated_at = NOW()
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [title.trim(), tags, content_url, JSON.stringify(content_data), id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return sendErrorResponse(res, 404, "Session not found or you don't have access to it", null, 'Save Draft');
      }
    } else {
      // Create new session
      result = await db.query(
        `INSERT INTO wellness_sessions (user_id, title, tags, content_url, content_data, is_draft, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())
         RETURNING *`,
        [req.user.id, title.trim(), tags, content_url, JSON.stringify(content_data)]
      );
    }

    const action = id ? 'updated' : 'created';
    sendSuccessResponse(res, { session: result.rows[0] }, `Draft ${action} successfully!`, 'Save Draft');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to save draft", error, 'Save Draft');
  }
});

// POST /my-sessions/publish - Publish a session
app.post("/api/my-sessions/publish", authenticate, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return sendErrorResponse(res, 400, "Session ID is required", null, 'Publish Session');
    }

    if (isNaN(id)) {
      return sendErrorResponse(res, 400, "Valid session ID is required", null, 'Publish Session');
    }

    const result = await db.query(
      `UPDATE wellness_sessions 
       SET is_published = true, is_draft = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, "Session not found or you don't have access to it", null, 'Publish Session');
    }

    sendSuccessResponse(res, { session: result.rows[0] }, "🎉 Session published successfully! It's now live for everyone to see.", 'Publish Session');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to publish session", error, 'Publish Session');
  }
});

// DELETE /my-sessions/:id - Delete a session
app.delete("/api/my-sessions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendErrorResponse(res, 400, "Valid session ID is required", null, 'Delete Session');
    }

    const result = await db.query(
      'DELETE FROM wellness_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, "Session not found or you don't have access to it", null, 'Delete Session');
    }

    sendSuccessResponse(res, null, "Session deleted successfully", 'Delete Session');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete session", error, 'Delete Session');
  }
});

// Logout route (client-side token removal)
app.post("/api/auth/logout", (req, res) => {
  sendSuccessResponse(res, null, "Logged out successfully. See you next time!", 'User Logout');
});

// =============================================
// NGO REGISTRATION API
// =============================================

// NGO Registration Route
app.post("/api/ngo/register", upload.fields([
  { name: 'ngoImage', maxCount: 1 },
  { name: 'FCRACert', maxCount: 1 },
  { name: '80gCert', maxCount: 1 },
  { name: '16ACert', maxCount: 1 },
  { name: 'TrustDeedCert', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      orgName,
      panNumber,
      email,
      phone,
      description,
      establishmentYear,
      focusArea,
      address,
      city,
      state,
      pincode,
      password,
      terms
    } = req.body;

    // Validate required fields
    if (!orgName || !panNumber || !email || !phone || !description || 
        !establishmentYear || !focusArea || !address || !city || 
        !state || !pincode || !password || !terms) {
      return sendErrorResponse(res, 400, "All required fields must be provided", null, 'NGO Registration');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, "Please provide a valid email address", null, 'NGO Registration');
    }

    // Validate password strength
    if (password.length < 8) {
      return sendErrorResponse(res, 400, "Password must be at least 8 characters long", null, 'NGO Registration');
    }

    // Check if email already exists
    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return sendErrorResponse(res, 409, "An account with this email already exists", null, 'NGO Registration');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (simplified for now)
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, name, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id, email, name, created_at`,
      [email, hashedPassword, orgName]
    );

    // Generate JWT tokens for auto-login after registration
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        user_type: 'ngo'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      {
        id: newUser.rows[0].id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    const responseData = {
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name,
        user_type: 'ngo',
        status: 'pending',
        created_at: newUser.rows[0].created_at
      },
      profile: {
        organization_name: orgName,
        pan_number: panNumber,
        phone: phone,
        address: address,
        city: city,
        state: state,
        pincode: pincode
      },
      documents: req.files ? Object.keys(req.files).map(key => ({
        type: key,
        filename: req.files[key][0].originalname,
        status: 'uploaded'
      })) : [],
      token,
      refreshToken
    };

    sendSuccessResponse(res, responseData, "NGO registration successful! Your account is under review.", 'NGO Registration');

  } catch (error) {
    sendErrorResponse(res, 500, "Registration failed. Please try again later.", error, 'NGO Registration');
  }
});

// =============================================
// CORPORATE REGISTRATION API
// =============================================

// Corporate Registration Route
app.post("/api/corporate/register", upload.fields([
  { name: 'registrationCert', maxCount: 1 },
  { name: 'csrPolicy', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      companyName,
      cinNumber,
      email,
      phone,
      website,
      address,
      city,
      state,
      pincode,
      csrBudget,
      committeeSize,
      focusArea,
      regions,
      password,
      terms
    } = req.body;

    // Validate required fields
    if (!companyName || !cinNumber || !email || !phone || !address || 
        !city || !state || !pincode || !csrBudget || !committeeSize || 
        !focusArea || !regions || !password || !terms) {
      return sendErrorResponse(res, 400, "All required fields must be provided", null, 'Corporate Registration');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(res, 400, "Please provide a valid email address", null, 'Corporate Registration');
    }

    // Validate password strength
    if (password.length < 8) {
      return sendErrorResponse(res, 400, "Password must be at least 8 characters long", null, 'Corporate Registration');
    }

    // Check if email already exists
    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return sendErrorResponse(res, 409, "An account with this email already exists", null, 'Corporate Registration');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (simplified for now)
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, name, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id, email, name, created_at`,
      [email, hashedPassword, companyName]
    );

    // Generate JWT tokens for auto-login after registration
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        user_type: 'corporate'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      {
        id: newUser.rows[0].id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' } // Long-lived refresh token
    );

    const responseData = {
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name,
        user_type: 'corporate',
        status: 'pending',
        created_at: newUser.rows[0].created_at
      },
      profile: {
        company_name: companyName,
        cin_number: cinNumber,
        website: website,
        phone: phone,
        address: address,
        city: city,
        state: state,
        pincode: pincode
      },
      documents: req.files ? Object.keys(req.files).map(key => ({
        type: key,
        filename: req.files[key][0].originalname,
        status: 'uploaded'
      })) : [],
      token,
      refreshToken
    };

    sendSuccessResponse(res, responseData, "Corporate registration successful! Your account is under review.", 'Corporate Registration');

  } catch (error) {
    sendErrorResponse(res, 500, "Registration failed. Please try again later.", error, 'Corporate Registration');
  }
});

// =============================================
// GLOBAL ERROR HANDLER
// =============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Global error handler middleware
app.use((error, req, res, next) => {
  logError('Global Error Handler', error, req);
  
  if (res.headersSent) {
    return next(error);
  }
  
  sendErrorResponse(res, 500, "An unexpected error occurred. Please try again later.", error, 'Global Error Handler');
});

// 404 handler for undefined routes
app.all('*', (req, res) => {
  sendErrorResponse(res, 404, `Route ${req.method} ${req.originalUrl} not found`, null, 'Route Not Found');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Enhanced error logging is enabled`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
