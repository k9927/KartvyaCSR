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

// Ensure auxiliary tables for corporate dashboards exist
const initializeCorporateTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS corporate_saved_ngos (
      id SERIAL PRIMARY KEY,
      corporate_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ngo_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (corporate_user_id, ngo_user_id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS project_messages (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sender_type VARCHAR(20),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS corporate_activity_log (
      id SERIAL PRIMARY KEY,
      corporate_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      icon VARCHAR(10) DEFAULT 'ℹ️',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

initializeCorporateTables().catch((error) => {
  console.error("Failed to initialize corporate tables", error);
});

const logCorporateActivity = async (corporateUserId, text, icon = "ℹ️") => {
  if (!corporateUserId || !text) return;
  try {
    await db.query(
      `INSERT INTO corporate_activity_log (corporate_user_id, text, icon) VALUES ($1, $2, $3)`,
      [corporateUserId, text, icon]
    );
  } catch (error) {
    console.error("Failed to log corporate activity", error);
  }
};

const parseFocusAreas = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

// Helper function to get placeholder logo for NGOs without uploaded images
const getPlaceholderLogo = (ngoId) => {
  const placeholders = [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop',
  ];
  return placeholders[Number(ngoId) % placeholders.length];
};

const transformNgoRow = (row) => {
  if (!row) return null;
  const focusAreas = parseFocusAreas(row.project_focus_area || row.focus_area);
  const fundsRequired = Number(row.project_budget_required || row.budget_required || 0);
  const ngoId = row.ngo_user_id || row.ngo_id || row.user_id;

  // Handle logo path - uploaded images vs placeholder images
  const logoPath = row.logo_path || row.logo_url || row.logo;
  let logo;
  if (logoPath) {
    // If it's an uploaded file (starts with /uploads), use full server URL
    if (logoPath.startsWith('/uploads/')) {
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      logo = `${serverUrl}${logoPath}`;
    } else if (logoPath.startsWith('http')) {
      // Already a full URL (online hosted image)
      logo = logoPath;
    } else if (logoPath.startsWith('/images/')) {
      // Placeholder image from /images/ folder (relative to frontend)
      logo = logoPath;
    } else {
      // Other relative path
      logo = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    }
  } else {
    // No logo, use placeholder
    logo = getPlaceholderLogo(ngoId);
  }

  return {
    id: String(row.project_id || row.id),
    ngoId: ngoId,
    name: row.ngo_name || row.organization_name || row.name || "NGO",
    location: row.project_location || row.location || row.region || "N/A",
    tagline: row.tagline || row.ngo_tagline || "",
    focusAreas,
    verified: Boolean(row.verified),
    logo: logo,
    contact: {
      email: row.contact_email || row.email || "",
      phone: row.contact_phone || row.phone || "",
    },
    project: {
      id: String(row.project_id || row.id),
      name: row.project_title || row.project_name || row.title || "Project",
      status: (row.project_status || row.status || "draft").toLowerCase(),
      description: row.project_description || row.description || "",
      funds: fundsRequired,
      fundsDisplay: row.project_budget_display || row.budget_display || null,
      beneficiaries: Number(row.project_beneficiaries_count || row.beneficiaries_count || 0),
      location: row.project_location || row.location || row.region || "N/A",
      durationMonths: row.project_duration_months || row.duration_months || null,
      startDate: row.project_start_date || row.start_date || null,
      endDate: row.project_end_date || row.end_date || null,
      updatedAt: row.project_updated_at || row.updated_at || null,
      focusAreas,
    },
    saved: Boolean(row.saved_id),
    shortlistId: row.saved_id || null,
  };
};

const buildCorporateNgoDirectory = async (corporateUserId, { search, focus_area, verified_only, page = 1, limit = 12 }) => {
  const offset = (page - 1) * limit;
  const params = [corporateUserId];
  let paramIndex = 2;

  let baseQuery = `
    SELECT
      p.id AS project_id,
      p.title AS project_title,
      p.status AS project_status,
      p.description AS project_description,
      p.focus_area AS project_focus_area,
      p.location AS project_location,
      p.target_region AS project_target_region,
      p.region AS project_region,
      p.budget_required AS project_budget_required,
      p.budget_display AS project_budget_display,
      p.beneficiaries_count AS project_beneficiaries_count,
      p.duration_months AS project_duration_months,
      p.start_date AS project_start_date,
      p.end_date AS project_end_date,
      p.updated_at AS project_updated_at,
      np.user_id AS ngo_user_id,
      np.organization_name,
      np.tagline,
      np.impact_score,
      np.verified,
      np.logo_path,
      np.contact_email,
      np.phone AS contact_phone,
      u.email,
      csn.id AS saved_id
    FROM projects p
    JOIN users u ON p.ngo_id = u.id
    JOIN ngo_profiles np ON np.user_id = p.ngo_id
    LEFT JOIN corporate_saved_ngos csn 
      ON csn.ngo_user_id = p.ngo_id 
     AND csn.corporate_user_id = $1
    WHERE u.user_type = 'ngo'
      AND p.status IN ('draft','open','active')
  `;

  if (search) {
    baseQuery += ` AND (p.title ILIKE $${paramIndex} OR np.organization_name ILIKE $${paramIndex} OR COALESCE(p.location, '') ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (verified_only === 'true') {
    baseQuery += ` AND np.verified = true`;
  }

  if (focus_area) {
    baseQuery += ` AND COALESCE(p.focus_area, '') ILIKE $${paramIndex}`;
    params.push(`%${focus_area}%`);
    paramIndex++;
  }

  baseQuery += ` ORDER BY np.verified DESC, p.updated_at DESC NULLS LAST, p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const ngos = await db.query(baseQuery, params);

  const countQueryParams = [];
  let countQuery = `
    SELECT COUNT(*) as total
    FROM projects p
    JOIN users u ON p.ngo_id = u.id
    JOIN ngo_profiles np ON np.user_id = p.ngo_id
    WHERE u.user_type = 'ngo'
      AND p.status IN ('draft','open','active')
  `;

  if (search) {
    countQuery += ` AND (p.title ILIKE $1 OR np.organization_name ILIKE $1 OR COALESCE(p.location, '') ILIKE $1)`;
    countQueryParams.push(`%${search}%`);
  }

  if (verified_only === 'true') {
    countQuery += ` AND np.verified = true`;
  }

  if (focus_area) {
    const index = countQueryParams.length + 1;
    countQuery += ` AND COALESCE(p.focus_area, '') ILIKE $${index}`;
    countQueryParams.push(`%${focus_area}%`);
  }

  const countResult = await db.query(countQuery, countQueryParams);

  const formatted = ngos.rows.map(transformNgoRow).filter(Boolean);

  return {
    ngos: formatted,
    total: parseInt(countResult.rows[0]?.total || 0),
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

const buildCorporateShortlist = async (corporateUserId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const shortlisted = await db.query(
    `SELECT 
        csn.id,
        csn.created_at,
        np.user_id,
        np.organization_name as name,
        np.tagline,
        np.verified,
        np.logo_path,
        np.contact_email,
        np.phone as contact_phone,
        p.id AS project_id,
        p.title AS project_title,
        p.status AS project_status,
        p.focus_area AS project_focus_area,
        p.description AS project_description,
        p.location AS project_location,
        p.budget_required AS project_budget_required,
        p.budget_display AS project_budget_display,
        p.beneficiaries_count AS project_beneficiaries_count,
        p.updated_at AS project_updated_at
     FROM corporate_saved_ngos csn
     JOIN ngo_profiles np ON csn.ngo_user_id = np.user_id
     LEFT JOIN projects p ON p.ngo_id = np.user_id AND p.status IN ('draft','open','active')
     WHERE csn.corporate_user_id = $1
     ORDER BY csn.created_at DESC, p.updated_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [corporateUserId, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM corporate_saved_ngos WHERE corporate_user_id = $1`,
    [corporateUserId]
  );

  return {
    ngos: shortlisted.rows.map(transformNgoRow).filter(Boolean),
    total: parseInt(countResult.rows[0]?.total || 0),
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

const mapCorporateRequestRow = (row) => {
  if (!row) return null;
  return {
    id: String(row.id),
    ngoId: row.ngo_user_id,
    ngo: row.ngo_name || row.organization_name || row.company_name || row.ngo || "NGO",
    status: row.status
      ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
      : "Pending",
    amount: Number(row.proposed_budget || row.amount || 0),
    focusAreas: parseFocusAreas(row.primary_focus_area),
    description: row.description || row.project_description || "",
    message: row.message || "",
    date: row.requested_at || row.created_at || row.updated_at || new Date().toISOString(),
    projectName: row.project_name || null,
  };
};



// JWT Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return sendErrorResponse(res, 401, "Access token is required", null, 'Authentication');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || decoded.user_type || null
    };
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
      `INSERT INTO users (email, password_hash, name, user_type, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, name`,
      [email, hashedPassword, name, 'user']
    );

    // Generate JWT token for auto-login
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
      'SELECT id, email, password_hash, name, user_type, created_at, last_login FROM users WHERE email = $1',
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
        email: userData.email,
        user_type: userData.user_type || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const refreshToken = jwt.sign(
      {
        id: userData.id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const loginData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        user_type: userData.user_type,
        created_at: userData.created_at,
        last_login: userData.last_login
      },
      token,
      refreshToken
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
  const client = await db.connect();
  try {
    await client.query('BEGIN');
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

    // Validate required fields (unchanged)
    if (!orgName || !panNumber || !email || !phone || !description || 
      !establishmentYear || !focusArea || !address || !city || 
      !state || !pincode || !password || !terms) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "All required fields must be provided", null, 'NGO Registration');
    }

    // Duplicate email check
    const existingEmail = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 409, "An account with this email already exists", null, 'NGO Registration');
    }

    // Duplicate PAN check
    const existingPAN = await client.query(
      'SELECT id FROM ngo_profiles WHERE pan_number = $1',
      [panNumber]
    );
    if (existingPAN.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 409, "An account with this PAN number already exists", null, 'NGO Registration');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const newUser = await client.query(
      `INSERT INTO users (email, password_hash, name, user_type, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, name, created_at`,
      [email, hashedPassword, orgName, 'ngo']
    );

    // Handle uploaded NGO image
    let logoPath = null;
    if (req.files && req.files.ngoImage && req.files.ngoImage[0]) {
      logoPath = `/uploads/${req.files.ngoImage[0].filename}`;
    }

    // Insert profile (make sure you have this table)
    await client.query(
      `INSERT INTO ngo_profiles (
        user_id, organization_name, pan_number, phone, description, establishment_year,
        focus_area, address, city, state, pincode, logo_path, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )`,
      [
        newUser.rows[0].id,
        orgName,
        panNumber,
        phone,
        description,
        establishmentYear,
        focusArea,
        address,
        city,
        state,
        pincode,
        logoPath
      ]
    );

    await client.query('COMMIT');

    // Generate JWT tokens
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        user_type: 'ngo'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      {
        id: newUser.rows[0].id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
      token,
      refreshToken
    };

    sendSuccessResponse(res, responseData, "NGO registration successful! Your account is under review.", 'NGO Registration');

  } catch (error) {
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Registration failed. Please try again later.", error, 'NGO Registration');
  } finally {
    client.release();
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
  const client = await db.connect();
  try {
    await client.query('BEGIN');
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

    // Validate required fields (unchanged)
    if (!companyName || !cinNumber || !email || !phone || !address ||
      !city || !state || !pincode || !csrBudget || !committeeSize ||
      !focusArea || !regions || !password || !terms) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "All required fields must be provided", null, 'Corporate Registration');
    }
    // Email duplicate check
    const existingEmail = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 409, "An account with this email already exists", null, 'Corporate Registration');
    }
    // Duplicate CIN check
    const existingCIN = await client.query(
      'SELECT id FROM corporate_profiles WHERE cin_number = $1',
      [cinNumber]
    );
    if (existingCIN.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 409, "An account with this CIN number already exists", null, 'Corporate Registration');
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const newUser = await client.query(
      `INSERT INTO users (email, password_hash, name, user_type, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, name, created_at`,
      [email, hashedPassword, companyName, 'corporate']
    );

    // Insert profile
    await client.query(
      `INSERT INTO corporate_profiles (
        user_id, company_name, cin_number, website, phone, address, city, state, pincode, csr_budget,
        committee_size, primary_focus_area, preferred_region, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, NOW(), NOW()
      )`,
      [
        newUser.rows[0].id,
        companyName,
        cinNumber,
        website || null,
        phone,
        address,
        city,
        state,
        pincode,
        csrBudget,             // <- now varchar!
        committeeSize,
        focusArea,
        regions
      ]
    );
    // All good, commit
    await client.query('COMMIT');

    // Tokens, response, etc. (unchanged)
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        user_type: 'corporate'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      {
        id: newUser.rows[0].id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Registration failed. Please try again later.", error, 'Corporate Registration');
  } finally {
    client.release();
  }
});

// =============================================
// USER PROFILE APIs (For Dashboard)
// =============================================

// Get Current User Profile (for Dashboard)
app.get("/api/user/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    // Get base user info
    const userResult = await db.query(
      'SELECT id, email, name, user_type, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return sendErrorResponse(res, 404, "User not found", null, 'Get User Profile');
    }

    const user = userResult.rows[0];
    let profile = null;

    // Get profile based on user type
    if (userType === 'ngo') {
      const ngoProfile = await db.query(
        'SELECT * FROM ngo_profiles WHERE user_id = $1',
        [userId]
      );
      profile = ngoProfile.rows[0] || null;
    } else if (userType === 'corporate') {
      const corpProfile = await db.query(
        'SELECT * FROM corporate_profiles WHERE user_id = $1',
        [userId]
      );
      profile = corpProfile.rows[0] || null;
    }

    sendSuccessResponse(res, {
      user,
      profile
    }, "User profile retrieved successfully", 'Get User Profile');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve user profile", error, 'Get User Profile');
  }
});

// Get Dashboard Stats (NGO)
app.get("/api/ngo/dashboard-stats", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can access dashboard stats", null, 'NGO Dashboard Stats');
    }

    const userId = req.user.id;

    // Get project counts by status
    const projectStats = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       WHERE ngo_id = $1 
       GROUP BY status`,
      [userId]
    );

    // Get total projects
    const totalProjects = await db.query(
      'SELECT COUNT(*) as count FROM projects WHERE ngo_id = $1',
      [userId]
    );

    // Get pending CSR requests
    const pendingRequests = await db.query(
      'SELECT COUNT(*) as count FROM csr_requests WHERE ngo_user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    // Get active partnerships
    const activePartnerships = await db.query(
      'SELECT COUNT(*) as count FROM active_partnerships WHERE ngo_user_id = $1 AND status = $2',
      [userId, 'active']
    );

    sendSuccessResponse(res, {
      totalProjects: parseInt(totalProjects.rows[0].count),
      pendingRequests: parseInt(pendingRequests.rows[0].count),
      activePartnerships: parseInt(activePartnerships.rows[0].count),
      projectStats: projectStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {})
    }, "Dashboard stats retrieved successfully", 'NGO Dashboard Stats');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve dashboard stats", error, 'NGO Dashboard Stats');
  }
});

// Get Dashboard Stats (Corporate)
app.get("/api/corporate/dashboard-stats", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can access dashboard stats", null, 'Corporate Dashboard Stats');
    }

    const userId = req.user.id;

    const [
      pendingRequestsResult,
      activeProjectsResult,
      fundingStatsResult,
      shortlistResult,
      fundDistributionResult,
      monthlySpendingResult,
      activityResult
    ] = await Promise.all([
      db.query(
        'SELECT COUNT(*) as count FROM csr_requests WHERE corporate_user_id = $1 AND status = $2',
        [userId, 'pending']
      ),
      db.query(
        `SELECT COUNT(*) as count 
         FROM active_partnerships 
         WHERE corporate_user_id = $1 
           AND status IN ('active', 'in_progress', 'ongoing')`,
        [userId]
      ),
      db.query(
        `SELECT 
          COALESCE(SUM(amount_committed), 0) as total_committed,
          COALESCE(SUM(amount_disbursed), 0) as total_disbursed
         FROM csr_funding 
         WHERE corporate_id = $1`,
        [userId]
      ),
      db.query(
        'SELECT COUNT(*) as count FROM corporate_saved_ngos WHERE corporate_user_id = $1',
        [userId]
      ),
      db.query(
      `SELECT 
        COALESCE(NULLIF(TRIM(p.focus_area), ''), 'General') AS focus_area,
            COALESCE(SUM(ap.agreed_budget), 0) AS total_value
         FROM active_partnerships ap
         LEFT JOIN projects p ON ap.project_id = p.id
         LEFT JOIN ngo_profiles np ON ap.ngo_user_id = np.user_id
         WHERE ap.corporate_user_id = $1
         GROUP BY focus_area
         ORDER BY total_value DESC`,
        [userId]
      ),
      db.query(
        `SELECT 
            TO_CHAR(commitment_date, 'Mon') AS month_label,
            DATE_TRUNC('month', commitment_date) AS month_date,
            COALESCE(SUM(amount_committed), 0) AS committed
         FROM csr_funding
         WHERE corporate_id = $1
         GROUP BY month_label, month_date
         ORDER BY month_date DESC
         LIMIT 6`,
        [userId]
      ),
      db.query(
        `SELECT id, text, icon, created_at 
         FROM corporate_activity_log 
         WHERE corporate_user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [userId]
      )
    ]);

    const totalInvestment = parseFloat(fundingStatsResult.rows[0].total_committed || 0);
    const pendingRequests = parseInt(pendingRequestsResult.rows[0].count || 0);
    const activeProjectsCount = parseInt(activeProjectsResult.rows[0].count || 0);
    const shortlistCount = parseInt(shortlistResult.rows[0].count || 0);

    const fundDistribution = fundDistributionResult.rows.map((row) => ({
      name: row.focus_area || 'General',
      value: Number(row.total_value || 0),
    }));

    const monthlySpending = monthlySpendingResult.rows
      .map((row) => ({
        month: row.month_label,
        planned: parseFloat((row.committed || 0) / 100000), // convert to lakhs
        committed: parseFloat((row.committed || 0) / 100000),
        monthDate: row.month_date,
      }))
      .sort((a, b) => new Date(a.monthDate) - new Date(b.monthDate))
      .map(({ month, planned, committed }) => ({ month, planned, committed }));

    const recentActivity = activityResult.rows.map((entry) => ({
      id: entry.id,
      text: entry.text,
      icon: entry.icon || 'ℹ️',
      timestamp: entry.created_at,
      time: timeAgo(entry.created_at),
    }));

    sendSuccessResponse(
      res,
      {
        totalInvestment,
        pendingRequests,
        activeProjectsCount,
        shortlistCount,
        fundDistribution,
        monthlySpending,
        recentActivity,
      },
      "Dashboard stats retrieved successfully",
      'Corporate Dashboard Stats'
    );
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve dashboard stats", error, 'Corporate Dashboard Stats');
  }
});

// =============================================
// NGO PROJECTS APIs
// =============================================

// Create NGO Project
app.post("/api/ngo/projects", authenticate, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    if (req.user.role !== 'ngo') {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 403, "Only NGOs can create projects", null, 'NGO Create Project');
    }

    const { name, title, description, focus_area, location, target_region, budget_required, beneficiaries_count, start_date, end_date, duration_months } = req.body;

    // Use title if provided, otherwise use name (for compatibility)
    const projectTitle = title || name;

    if (!projectTitle || !description || !focus_area || !location || !budget_required) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "Title/name, description, focus_area, location, and budget_required are required", null, 'NGO Create Project');
    }

    // Verify user exists in users table
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "User not found in database. Please log in again.", null, 'NGO Create Project');
    }

    // Ensure ngo profile exists (for completeness / validations)
    const ngoProfileCheck = await client.query('SELECT id FROM ngo_profiles WHERE user_id = $1', [req.user.id]);
    if (ngoProfileCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "NGO profile not found. Please complete your NGO registration.", null, 'NGO Create Project');
    }

    const ngoIdToUse = req.user.id; // projects.ngo_id references users.id

    const budgetDisplay = `₹ ${Number(budget_required).toLocaleString('en-IN')}`;
    const region = target_region || null;

    // Calculate duration_months from dates if available, otherwise use provided value or default to 12
    let calculatedDurationMonths = 12; // Default to 12 months
    
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
      calculatedDurationMonths = Math.max(1, months); // At least 1 month
    } else if (duration_months) {
      calculatedDurationMonths = parseInt(duration_months) || 12;
    }

    // Try with ngo_profiles.id first (most likely case)
    const result = await client.query(
      `INSERT INTO projects (ngo_id, title, description, focus_area, location, target_region, region, budget_required, budget_display, beneficiaries_count, duration_months, start_date, end_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', NOW(), NOW())
       RETURNING *`,
      [ngoIdToUse, projectTitle, description, focus_area, location, target_region, region, budget_required, budgetDisplay, beneficiaries_count || null, calculatedDurationMonths, start_date || null, end_date || null]
    );

    await client.query('COMMIT');
    sendSuccessResponse(res, { project: result.rows[0] }, "Project created successfully", 'NGO Create Project');

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Better error message for foreign key constraint violations
    if (error.code === '23503') {
      return sendErrorResponse(res, 400, `Foreign key constraint violation. User ID ${req.user.id} may not exist in the users table. Please log in again or contact support.`, error, 'NGO Create Project');
    }
    
    sendErrorResponse(res, 500, "Failed to create project", error, 'NGO Create Project');
  } finally {
    client.release();
  }
});

// List My Projects (NGO)
app.get("/api/ngo/projects", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can access their projects", null, 'NGO List Projects');
    }

    // Get ngo_profiles.id for this user (since foreign key likely references ngo_profiles.id)
    const ngoProfile = await db.query('SELECT id FROM ngo_profiles WHERE user_id = $1', [req.user.id]);
    
    // Use both user.id and ngo_profiles.id to find projects (covers both cases)
    let query, countQuery, params, countParams;
    
    if (ngoProfile.rows.length > 0) {
      const ngoProfileId = ngoProfile.rows[0].id;
      // Try both IDs: projects might use ngo_profiles.id OR users.id
      query = 'SELECT * FROM projects WHERE ngo_id = $1 OR ngo_id = $2';
      params = [req.user.id, ngoProfileId];
      countQuery = 'SELECT COUNT(*) FROM projects WHERE ngo_id = $1 OR ngo_id = $2';
      countParams = [req.user.id, ngoProfileId];
    } else {
      // Fallback: only use user.id if no ngo_profiles entry
      query = 'SELECT * FROM projects WHERE ngo_id = $1';
      params = [req.user.id];
      countQuery = 'SELECT COUNT(*) FROM projects WHERE ngo_id = $1';
      countParams = [req.user.id];
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
      countQuery += ' AND status = $' + (countParams.length + 1);
      countParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const projects = await db.query(query, params);
    const countResult = await db.query(countQuery, countParams);

    sendSuccessResponse(res, {
      projects: projects.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    }, `Found ${projects.rows.length} projects`, 'NGO List Projects');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve projects", error, 'NGO List Projects');
  }
});

// Update NGO Project
app.put("/api/ngo/projects/:projectId", authenticate, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    if (req.user.role !== 'ngo') {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 403, "Only NGOs can update projects", null, 'NGO Update Project');
    }

    const { projectId } = req.params;
    const updates = req.body;

    // Get ngo_profiles.id for this user
    const ngoProfile = await client.query('SELECT id FROM ngo_profiles WHERE user_id = $1', [req.user.id]);
    
    // Verify project belongs to this NGO (check both user.id and ngo_profiles.id)
    let existing;
    if (ngoProfile.rows.length > 0) {
      const ngoProfileId = ngoProfile.rows[0].id;
      existing = await client.query('SELECT id FROM projects WHERE id = $1 AND (ngo_id = $2 OR ngo_id = $3)', [projectId, req.user.id, ngoProfileId]);
    } else {
      existing = await client.query('SELECT id FROM projects WHERE id = $1 AND ngo_id = $2', [projectId, req.user.id]);
    }
    
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'NGO Update Project');
    }

    const allowedFields = ['title', 'description', 'focus_area', 'location', 'target_region', 'budget_required', 'beneficiaries_count', 'status', 'progress', 'start_date', 'end_date', 'duration_months'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }

    if (updates.budget_required !== undefined) {
      const budgetDisplay = `₹ ${Number(updates.budget_required).toLocaleString('en-IN')}`;
      updateFields.push(`budget_display = $${paramIndex}`);
      values.push(budgetDisplay);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "No valid fields to update", null, 'NGO Update Project');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(projectId);
    
    // Update WHERE clause to check both IDs
    let whereClause;
    if (ngoProfile.rows.length > 0) {
      const ngoProfileId = ngoProfile.rows[0].id;
      whereClause = `WHERE id = $${paramIndex} AND (ngo_id = $${paramIndex + 1} OR ngo_id = $${paramIndex + 2})`;
      values.push(req.user.id, ngoProfileId);
    } else {
      whereClause = `WHERE id = $${paramIndex} AND ngo_id = $${paramIndex + 1}`;
      values.push(req.user.id);
    }

    const result = await client.query(
      `UPDATE projects SET ${updateFields.join(', ')} ${whereClause} RETURNING *`,
      values
    );

    await client.query('COMMIT');
    sendSuccessResponse(res, { project: result.rows[0] }, "Project updated successfully", 'NGO Update Project');

  } catch (error) {
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Failed to update project", error, 'NGO Update Project');
  } finally {
    client.release();
  }
});

// Delete NGO Project
app.delete("/api/ngo/projects/:projectId", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can delete projects", null, 'NGO Delete Project');
    }

    const { projectId } = req.params;

    // Get ngo_profiles.id for this user
    const ngoProfile = await db.query('SELECT id FROM ngo_profiles WHERE user_id = $1', [req.user.id]);
    
    // Verify project belongs to this NGO before deleting
    let existing;
    if (ngoProfile.rows.length > 0) {
      const ngoProfileId = ngoProfile.rows[0].id;
      existing = await db.query(
        'SELECT id, title FROM projects WHERE id = $1 AND (ngo_id = $2 OR ngo_id = $3)',
        [projectId, req.user.id, ngoProfileId]
      );
    } else {
      existing = await db.query(
        'SELECT id, title FROM projects WHERE id = $1 AND ngo_id = $2',
        [projectId, req.user.id]
      );
    }

    if (existing.rows.length === 0) {
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'NGO Delete Project');
    }

    // Actually delete the project from the database
    let result;
    if (ngoProfile.rows.length > 0) {
      const ngoProfileId = ngoProfile.rows[0].id;
      result = await db.query(
        'DELETE FROM projects WHERE id = $1 AND (ngo_id = $2 OR ngo_id = $3) RETURNING *',
        [projectId, req.user.id, ngoProfileId]
      );
    } else {
      result = await db.query(
        'DELETE FROM projects WHERE id = $1 AND ngo_id = $2 RETURNING *',
        [projectId, req.user.id]
      );
    }

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'NGO Delete Project');
    }

    sendSuccessResponse(res, { project: result.rows[0] }, "Project deleted successfully", 'NGO Delete Project');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to delete project", error, 'NGO Delete Project');
  }
});

// =============================================
// CORPORATE BROWSE & CSR REQUEST APIs
// =============================================

// Browse NGOs (for Corporate Dashboard - Discover page)
app.get("/api/corporate/browse-ngos", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can browse NGOs", null, 'Corporate Browse NGOs');
    }

    const { search, focus_area, verified_only, page = 1, limit = 12 } = req.query;
    const result = await buildCorporateNgoDirectory(req.user.id, {
      search,
      focus_area,
      verified_only,
      page,
      limit,
    });

    sendSuccessResponse(
      res,
      result,
      `Found ${result.ngos.length} NGOs`,
      'Corporate Browse NGOs'
    );
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve NGOs", error, 'Corporate Browse NGOs');
  }
});

app.get("/api/corporate/connections", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can browse connections", null, 'Corporate Connections');
    }

    const { shortlist, search, focus_area, verified = 'false', page = 1, limit = 12 } = req.query;
    let result;

    if (shortlist === 'true') {
      result = await buildCorporateShortlist(req.user.id, { page, limit });
    } else {
      result = await buildCorporateNgoDirectory(req.user.id, {
        search,
        focus_area,
        verified_only: verified,
        page,
        limit,
      });
    }

    sendSuccessResponse(
      res,
      result,
      shortlist === 'true'
        ? `Found ${result.ngos.length} shortlisted NGOs`
        : `Found ${result.ngos.length} NGOs`,
      'Corporate Connections'
    );
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve connections", error, 'Corporate Connections');
  }
});

app.post("/api/corporate/connections/:ngoId/save", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can save NGOs", null, 'Corporate Save NGO');
    }

    const { ngoId } = req.params;

    const ngoExists = await db.query('SELECT id FROM users WHERE id = $1 AND user_type = $2', [ngoId, 'ngo']);
    if (ngoExists.rows.length === 0) {
      return sendErrorResponse(res, 404, "NGO not found", null, 'Corporate Save NGO');
    }

    await db.query(
      `INSERT INTO corporate_saved_ngos (corporate_user_id, ngo_user_id)
       VALUES ($1, $2)
       ON CONFLICT (corporate_user_id, ngo_user_id) DO NOTHING`,
      [req.user.id, ngoId]
    );

    await logCorporateActivity(req.user.id, `Saved NGO ${ngoId} to shortlist`, "⭐");

    sendSuccessResponse(res, { saved: true }, "NGO added to shortlist", 'Corporate Save NGO');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to save NGO", error, 'Corporate Save NGO');
  }
});

app.delete("/api/corporate/connections/:ngoId/save", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can remove NGOs", null, 'Corporate Remove NGO');
    }

    const { ngoId } = req.params;

    await db.query(
      `DELETE FROM corporate_saved_ngos 
       WHERE corporate_user_id = $1 AND ngo_user_id = $2`,
      [req.user.id, ngoId]
    );

    await logCorporateActivity(req.user.id, `Removed NGO ${ngoId} from shortlist`, "🗑️");

    sendSuccessResponse(res, { saved: false }, "NGO removed from shortlist", 'Corporate Remove NGO');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to remove NGO", error, 'Corporate Remove NGO');
  }
});

// Get NGO Profile with Projects (for Corporate Dashboard - NGO Profile page)
app.get("/api/corporate/ngo/:ngoId", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view NGO profiles", null, 'Corporate View NGO');
    }

    const { ngoId } = req.params;

    // Get NGO profile
    const ngoProfile = await db.query(
      `SELECT np.*, u.email, CONCAT(np.city, ', ', np.state) as location
       FROM ngo_profiles np
       JOIN users u ON np.user_id = u.id
       WHERE np.user_id = $1 AND u.user_type = 'ngo'`,
      [ngoId]
    );

    if (ngoProfile.rows.length === 0) {
      return sendErrorResponse(res, 404, "NGO not found", null, 'Corporate View NGO');
    }

    const ngo = ngoProfile.rows[0];
    ngo.focusAreas = ngo.focus_area ? ngo.focus_area.split(',').map(f => f.trim()) : [];

    // Get NGO's open projects
    const projects = await db.query(
      `SELECT id, title as name, description, focus_area, location, target_region, budget_required, budget_display, beneficiaries_count, status, created_at
       FROM projects
       WHERE ngo_id = $1 AND status IN ('open', 'draft')
       ORDER BY created_at DESC`,
      [ngoId]
    );

    // Check if corporate already sent a request to this NGO
    const existingRequest = await db.query(
      `SELECT id, status FROM csr_requests 
       WHERE corporate_user_id = $1 AND ngo_user_id = $2 AND status = 'pending'`,
      [req.user.id, ngoId]
    );

    sendSuccessResponse(res, {
      ngo: ngo,
      projects: projects.rows,
      hasPendingRequest: existingRequest.rows.length > 0
    }, "NGO profile retrieved successfully", 'Corporate View NGO');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve NGO profile", error, 'Corporate View NGO');
  }
});

async function sendCorporateRequest(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (req.user.role !== 'corporate') {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 403, "Only corporates can send CSR requests", null, 'Corporate Send CSR Request');
    }

    const {
      ngo_user_id,
      ngo_id,
      project_id,
      proposed_budget,
      amount,
      message,
      description,
      focus_area,
    } = req.body;

    const ngoUserId = ngo_user_id || ngo_id;
    const budgetValue = proposed_budget ?? amount;

    if (!ngoUserId || !budgetValue) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "NGO user ID and proposed budget/amount are required", null, 'Corporate Send CSR Request');
    }

    const ngoCheck = await client.query(
      'SELECT np.user_id, np.organization_name, np.focus_area FROM ngo_profiles np WHERE np.user_id = $1',
      [ngoUserId]
    );
    if (ngoCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "NGO not found", null, 'Corporate Send CSR Request');
    }

    const existing = await client.query(
      `SELECT id FROM csr_requests 
       WHERE corporate_user_id = $1 AND ngo_user_id = $2 AND status = 'pending'`,
      [req.user.id, ngoUserId]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 409, "You already have a pending request with this NGO", null, 'Corporate Send CSR Request');
    }

    const budgetDisplay = `₹ ${Number(budgetValue).toLocaleString('en-IN')}`;
    const descriptionToUse = description || focus_area || message || null;

    const insertResult = await client.query(
      `INSERT INTO csr_requests (
         corporate_user_id,
         ngo_user_id,
         project_id,
         proposed_budget,
         budget_display,
         message,
         description,
         status,
         requested_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
       RETURNING *`,
      [
        req.user.id,
        ngoUserId,
        project_id || null,
        budgetValue,
        budgetDisplay,
        message || null,
        descriptionToUse,
      ]
    );

    await client.query('COMMIT');

    const ngoName = ngoCheck.rows[0].organization_name || "NGO";
    await logCorporateActivity(req.user.id, `Sent CSR request to ${ngoName}`, "📤");

    const mappedRequest = mapCorporateRequestRow({
      ...insertResult.rows[0],
      ngo_name: ngoName,
      focus_area: ngoCheck.rows[0].focus_area,
    });

    sendSuccessResponse(res, { request: mappedRequest }, "CSR request sent successfully", 'Corporate Send CSR Request');
  } catch (error) {
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Failed to send CSR request", error, 'Corporate Send CSR Request');
  } finally {
    client.release();
  }
}

async function getCorporateRequests(req, res) {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view their requests", null, 'Corporate View Requests');
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        cr.*,
        np.organization_name as ngo_name,
        np.logo_path as ngo_logo,
        np.focus_area,
        p.title as project_name,
        p.description as project_description
      FROM csr_requests cr
      JOIN ngo_profiles np ON cr.ngo_user_id = np.user_id
      LEFT JOIN projects p ON cr.project_id = p.id
      WHERE cr.corporate_user_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND cr.status = $2';
      params.push(status);
    }

    query += ` ORDER BY cr.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const requestsResult = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*) FROM csr_requests 
      WHERE corporate_user_id = $1 ${status ? 'AND status = $2' : ''}
    `;
    const countParams = status ? [req.user.id, status] : [req.user.id];
    const countResult = await db.query(countQuery, countParams);

    const formatted = requestsResult.rows.map((row) =>
      mapCorporateRequestRow({
        ...row,
        focus_area: row.focus_area,
      })
    ).filter(Boolean);

    sendSuccessResponse(res, {
      requests: formatted,
      total: parseInt(countResult.rows[0]?.count || 0),
      page: parseInt(page),
      limit: parseInt(limit),
    }, `Found ${formatted.length} requests`, 'Corporate View Requests');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve requests", error, 'Corporate View Requests');
  }
}

app.post("/api/corporate/requests", authenticate, async (req, res) => {
  await sendCorporateRequest(req, res);
});

app.post("/api/corporate/csr-requests", authenticate, async (req, res) => {
  req.body = { ...req.body, ngo_user_id: req.body.ngo_user_id || req.body.ngo_id };
  await sendCorporateRequest(req, res);
});

app.get("/api/corporate/requests", authenticate, async (req, res) => {
  await getCorporateRequests(req, res);
});

app.get("/api/corporate/csr-requests", authenticate, async (req, res) => {
  await getCorporateRequests(req, res);
});

app.get("/api/corporate/projects", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view projects", null, 'Corporate Projects');
    }

    const { status, search, sort = 'newest', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let paramIndex = 2;

    let query = `
      SELECT
        p.*,
        np.organization_name AS ngo_name,
        ap.status AS partnership_status,
        ap.created_at AS partnership_created_at
      FROM active_partnerships ap
      JOIN projects p ON ap.project_id = p.id
      LEFT JOIN ngo_profiles np ON np.user_id = p.ngo_id OR np.id = p.ngo_id
      WHERE ap.corporate_user_id = $1
    `;

    if (status && status !== 'all') {
      query += ` AND (LOWER(p.status) = LOWER($${paramIndex}) OR LOWER(ap.status) = LOWER($${paramIndex}))`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        p.title ILIKE $${paramIndex} OR
        p.name ILIKE $${paramIndex} OR
        np.organization_name ILIKE $${paramIndex} OR
        p.location ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    let orderClause = 'p.created_at DESC';
    if (sort === 'progress_desc') {
      orderClause = 'p.progress DESC NULLS LAST';
    } else if (sort === 'progress_asc') {
      orderClause = 'p.progress ASC NULLS FIRST';
    } else if (sort === 'oldest') {
      orderClause = 'p.created_at ASC';
    }

    query += ` ORDER BY ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM active_partnerships ap
      JOIN projects p ON ap.project_id = p.id
      WHERE ap.corporate_user_id = $1
      ${status && status !== 'all' ? `AND (LOWER(p.status) = LOWER('${status}') OR LOWER(ap.status) = LOWER('${status}'))` : ''}
      ${search ? `AND (
        p.title ILIKE '%${search}%' OR
        p.name ILIKE '%${search}%' OR
        p.location ILIKE '%${search}%'
      )` : ''}
    `;
    const countResult = await db.query(countQuery, [req.user.id]);

    const projects = result.rows.map((row) => ({
      id: row.id,
      name: row.title || row.name || 'Project',
      ngo: row.ngo_name || '',
      ngoId: row.ngo_id,
      status: (row.status || row.partnership_status || '').toLowerCase(),
      category: row.focus_area || row.category || '',
      location: row.location || 'N/A',
      duration_months: row.duration_months || null,
      funds: Number(row.budget_required || 0),
      funds_display: row.budget_display || `₹ ${Number(row.budget_required || 0).toLocaleString('en-IN')}`,
      progress: Number(row.progress || 0),
      beneficiaries: Number(row.beneficiaries_count || 0),
      start_date: row.start_date,
      end_date: row.end_date,
      description: row.description || '',
      created_at: row.created_at,
    }));

    sendSuccessResponse(
      res,
      {
        projects,
        total: parseInt(countResult.rows[0]?.total || 0),
        page: parseInt(page),
        limit: parseInt(limit),
      },
      `Found ${projects.length} projects`,
      'Corporate Projects'
    );
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve projects", error, 'Corporate Projects');
  }
});

app.patch("/api/corporate/projects/:projectId/status", authenticate, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (req.user.role !== 'corporate') {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 403, "Only corporates can update projects", null, 'Corporate Update Project');
    }

    const { projectId } = req.params;
    const { status, progress, end_date, note } = req.body;

    const projectOwnership = await client.query(
      `SELECT p.id, p.title, p.status, np.organization_name
       FROM active_partnerships ap
       JOIN projects p ON ap.project_id = p.id
       LEFT JOIN ngo_profiles np ON np.user_id = p.ngo_id OR np.id = p.ngo_id
       WHERE ap.project_id = $1 AND ap.corporate_user_id = $2`,
      [projectId, req.user.id]
    );

    if (projectOwnership.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'Corporate Update Project');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      fields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (progress !== undefined) {
      fields.push(`progress = $${paramIndex}`);
      values.push(progress);
      paramIndex++;
    }

    if (end_date) {
      fields.push(`end_date = $${paramIndex}`);
      values.push(end_date);
      paramIndex++;
    }

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 400, "No valid fields to update", null, 'Corporate Update Project');
    }

    fields.push('updated_at = NOW()');
    values.push(projectId);

    await client.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (status) {
      await client.query(
        `UPDATE active_partnerships
         SET status = $1, updated_at = NOW()
         WHERE project_id = $2 AND corporate_user_id = $3`,
        [status, projectId, req.user.id]
      );
    }

    await client.query('COMMIT');

    const activityNote = note || `Updated project ${projectOwnership.rows[0].title}`;
    await logCorporateActivity(
      req.user.id,
      `${activityNote}${status ? ` (status: ${status})` : ''}`,
      "🛠️"
    );

    sendSuccessResponse(res, { projectId, status, progress, end_date }, "Project updated successfully", 'Corporate Update Project');
  } catch (error) {
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Failed to update project", error, 'Corporate Update Project');
  } finally {
    client.release();
  }
});

app.get("/api/corporate/projects/:projectId/messages", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view project messages", null, 'Corporate Project Messages');
    }

    const { projectId } = req.params;

    const ownership = await db.query(
      `SELECT ap.id FROM active_partnerships ap WHERE ap.project_id = $1 AND ap.corporate_user_id = $2`,
      [projectId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'Corporate Project Messages');
    }

    const messages = await db.query(
      `SELECT pm.*, u.name as sender_name
       FROM project_messages pm
       LEFT JOIN users u ON pm.sender_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.created_at DESC`,
      [projectId]
    );

    const formatted = messages.rows.map((msg) => ({
      id: msg.id,
      author: msg.sender_name || msg.sender_type || 'Partner',
      text: msg.message,
      timestamp: msg.created_at,
    }));

    sendSuccessResponse(res, { messages: formatted }, "Messages retrieved successfully", 'Corporate Project Messages');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve project messages", error, 'Corporate Project Messages');
  }
});

app.post("/api/corporate/projects/:projectId/messages", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can send messages", null, 'Corporate Project Messages');
    }

    const { projectId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return sendErrorResponse(res, 400, "Message text is required", null, 'Corporate Project Messages');
    }

    const ownership = await db.query(
      `SELECT ap.id FROM active_partnerships ap WHERE ap.project_id = $1 AND ap.corporate_user_id = $2`,
      [projectId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return sendErrorResponse(res, 404, "Project not found or you don't have permission", null, 'Corporate Project Messages');
    }

    const result = await db.query(
      `INSERT INTO project_messages (project_id, sender_id, sender_type, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, message, created_at`,
      [projectId, req.user.id, 'corporate', text.trim()]
    );

    await logCorporateActivity(req.user.id, `Sent a message on project ${projectId}`, "✉️");

    sendSuccessResponse(res, {
      message: {
        id: result.rows[0].id,
        author: 'Corporate',
        text: result.rows[0].message,
        timestamp: result.rows[0].created_at,
      },
    }, "Message sent successfully", 'Corporate Project Messages');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to send message", error, 'Corporate Project Messages');
  }
});

app.get("/api/corporate/activity", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view activity", null, 'Corporate Activity');
    }

    const { limit = 20 } = req.query;

    const activity = await db.query(
      `SELECT id, text, icon, created_at
       FROM corporate_activity_log
       WHERE corporate_user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    const formatted = activity.rows.map((entry) => ({
      id: entry.id,
      text: entry.text,
      icon: entry.icon || 'ℹ️',
      timestamp: entry.created_at,
      time: timeAgo(entry.created_at),
    }));

    sendSuccessResponse(res, { entries: formatted }, "Activity retrieved successfully", 'Corporate Activity');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve activity", error, 'Corporate Activity');
  }
});

async function handleCorporateDeleteRequest(req, res) {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can withdraw requests", null, 'Corporate Withdraw Request');
    }

    const { requestId } = req.params;

    const result = await db.query(
      `UPDATE csr_requests SET status = 'withdrawn', updated_at = NOW() 
       WHERE id = $1 AND corporate_user_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, req.user.id]
    );

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, "Request not found or cannot be withdrawn", null, 'Corporate Withdraw Request');
    }

    const mapped = mapCorporateRequestRow(result.rows[0]);
    await logCorporateActivity(req.user.id, `Withdrawn CSR request ${requestId}`, "🗑️");

    sendSuccessResponse(res, { request: mapped }, "Request withdrawn successfully", 'Corporate Withdraw Request');
  } catch (error) {
    sendErrorResponse(res, 500, "Failed to withdraw request", error, 'Corporate Withdraw Request');
  }
}

app.delete("/api/corporate/csr-requests/:requestId", authenticate, handleCorporateDeleteRequest);
app.delete("/api/corporate/requests/:requestId", authenticate, handleCorporateDeleteRequest);

// =============================================
// NGO CSR REQUEST MANAGEMENT APIs
// =============================================

// Get Incoming CSR Requests (NGO - Connections page)
app.get("/api/ngo/csr-requests", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can view CSR requests", null, 'NGO View Requests');
    }

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        cr.*,
        cpf.company_name,
        cpf.primary_focus_area,
        p.title as project_name,
        p.description as project_description
      FROM csr_requests cr
      JOIN corporate_profiles cpf ON cr.corporate_user_id = cpf.user_id
      LEFT JOIN projects p ON cr.project_id = p.id
      WHERE cr.ngo_user_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND cr.status = $2';
      params.push(status);
    }

    query += ` ORDER BY cr.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const requests = await db.query(query, params);

    const countQuery = `
      SELECT COUNT(*) FROM csr_requests 
      WHERE ngo_user_id = $1 ${status ? 'AND status = $2' : ''}
    `;
    const countParams = status ? [req.user.id, status] : [req.user.id];
    const countResult = await db.query(countQuery, countParams);

    sendSuccessResponse(res, {
      requests: requests.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    }, `Found ${requests.rows.length} requests`, 'NGO View Requests');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve requests", error, 'NGO View Requests');
  }
});

// Accept CSR Request
app.post("/api/ngo/csr-requests/:requestId/accept", authenticate, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    if (req.user.role !== 'ngo') {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 403, "Only NGOs can accept requests", null, 'NGO Accept Request');
    }

    const { requestId } = req.params;
    const { response } = req.body;

    // Get the CSR request
    const csrRequest = await client.query(
      `SELECT * FROM csr_requests WHERE id = $1 AND ngo_user_id = $2 AND status = 'pending'`,
      [requestId, req.user.id]
    );

    if (csrRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendErrorResponse(res, 404, "Request not found or already processed", null, 'NGO Accept Request');
    }

    const request = csrRequest.rows[0];

    // Update request status
    await client.query(
      `UPDATE csr_requests SET status = 'accepted', ngo_response = $1, responded_at = NOW() WHERE id = $2`,
      [response || null, requestId]
    );

    // Create active partnership
    const partnershipResult = await client.query(
      `INSERT INTO active_partnerships (
        csr_request_id, project_id, corporate_user_id, ngo_user_id,
        partnership_name, agreed_budget, budget_display, start_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'active')
      RETURNING *`,
      [
        requestId,
        request.project_id || null,
        request.corporate_user_id,
        request.ngo_user_id,
        request.description || 'Partnership',
        request.proposed_budget,
        request.budget_display
      ]
    );

    // Create csr_funding record
    await client.query(
      `INSERT INTO csr_funding (corporate_id, project_id, amount_committed, funding_status, commitment_date)
       VALUES ($1, $2, $3, 'committed', NOW())`,
      [request.corporate_user_id, request.project_id, request.proposed_budget]
    );

    // Update project status if project_id exists
    if (request.project_id) {
      await client.query(
        `UPDATE projects SET status = 'active' WHERE id = $1`,
        [request.project_id]
      );
    }

    await client.query('COMMIT');
    sendSuccessResponse(res, {
      request: { ...request, status: 'accepted' },
      partnership: partnershipResult.rows[0]
    }, "CSR request accepted. Partnership created successfully!", 'NGO Accept Request');

  } catch (error) {
    await client.query('ROLLBACK');
    sendErrorResponse(res, 500, "Failed to accept request", error, 'NGO Accept Request');
  } finally {
    client.release();
  }
});

// Reject CSR Request
app.post("/api/ngo/csr-requests/:requestId/reject", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can reject requests", null, 'NGO Reject Request');
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE csr_requests SET status = 'rejected', ngo_response = $1, responded_at = NOW() 
       WHERE id = $2 AND ngo_user_id = $3 AND status = 'pending'
       RETURNING *`,
      [reason || null, requestId, req.user.id]
    );

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, "Request not found or already processed", null, 'NGO Reject Request');
    }

    sendSuccessResponse(res, { request: result.rows[0] }, "CSR request rejected", 'NGO Reject Request');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to reject request", error, 'NGO Reject Request');
  }
});

// =============================================
// ACTIVE PARTNERSHIPS APIs (Both Sides)
// =============================================

// Get Active Partnerships (NGO)
app.get("/api/ngo/partnerships", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return sendErrorResponse(res, 403, "Only NGOs can view partnerships", null, 'NGO View Partnerships');
    }

    const { status = 'active', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const partnerships = await db.query(
      `SELECT 
        ap.*,
        cpf.company_name,
        cpf.primary_focus_area,
        p.title as project_name,
        p.description as project_description
      FROM active_partnerships ap
      JOIN corporate_profiles cpf ON ap.corporate_user_id = cpf.user_id
      LEFT JOIN projects p ON ap.project_id = p.id
      WHERE ap.ngo_user_id = $1 AND ap.status = $2
      ORDER BY ap.created_at DESC
      LIMIT $3 OFFSET $4`,
      [req.user.id, status, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM active_partnerships WHERE ngo_user_id = $1 AND status = $2`,
      [req.user.id, status]
    );

    sendSuccessResponse(res, {
      partnerships: partnerships.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    }, `Found ${partnerships.rows.length} partnerships`, 'NGO View Partnerships');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve partnerships", error, 'NGO View Partnerships');
  }
});

// Get Active Partnerships (Corporate)
app.get("/api/corporate/partnerships", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'corporate') {
      return sendErrorResponse(res, 403, "Only corporates can view partnerships", null, 'Corporate View Partnerships');
    }

    const { status = 'active', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const partnerships = await db.query(
      `SELECT 
        ap.*,
        np.organization_name as ngo_name,
        np.focus_area,
        p.title as project_name,
        p.description as project_description
      FROM active_partnerships ap
      JOIN ngo_profiles np ON ap.ngo_user_id = np.user_id
      LEFT JOIN projects p ON ap.project_id = p.id
      WHERE ap.corporate_user_id = $1 AND ap.status = $2
      ORDER BY ap.created_at DESC
      LIMIT $3 OFFSET $4`,
      [req.user.id, status, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM active_partnerships WHERE corporate_user_id = $1 AND status = $2`,
      [req.user.id, status]
    );

    sendSuccessResponse(res, {
      partnerships: partnerships.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    }, `Found ${partnerships.rows.length} partnerships`, 'Corporate View Partnerships');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to retrieve partnerships", error, 'Corporate View Partnerships');
  }
});

// Update Partnership Progress
app.put("/api/partnerships/:partnershipId/progress", authenticate, async (req, res) => {
  try {
    const { partnershipId } = req.params;
    const { progress } = req.body;

    if (!progress || progress < 0 || progress > 100) {
      return sendErrorResponse(res, 400, "Progress must be between 0 and 100", null, 'Update Partnership Progress');
    }

    // Verify user has access to this partnership
    const partnership = await db.query(
      `SELECT * FROM active_partnerships 
       WHERE id = $1 AND (corporate_user_id = $2 OR ngo_user_id = $2)`,
      [partnershipId, req.user.id]
    );

    if (partnership.rows.length === 0) {
      return sendErrorResponse(res, 404, "Partnership not found or you don't have permission", null, 'Update Partnership Progress');
    }

    const result = await db.query(
      `UPDATE active_partnerships SET progress = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [progress, partnershipId]
    );

    // Update project progress if linked
    if (partnership.rows[0].project_id) {
      await db.query(
        `UPDATE projects SET progress = $1, updated_at = NOW() WHERE id = $2`,
        [progress, partnership.rows[0].project_id]
      );
    }

    sendSuccessResponse(res, { partnership: result.rows[0] }, "Progress updated successfully", 'Update Partnership Progress');

  } catch (error) {
    sendErrorResponse(res, 500, "Failed to update progress", error, 'Update Partnership Progress');
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
  console.log('🗄️  Database target:', {
    PGHOST: process.env.PGHOST,
    PGDATABASE: process.env.PGDATABASE,
    PGUSER: process.env.PGUSER,
    PGPORT: process.env.PGPORT
  });
});
