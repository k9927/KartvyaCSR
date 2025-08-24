import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import pg from "pg";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



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
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
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
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user without role column
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, name, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id, email, name`,
      [email, hashedPassword, name]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        name: newUser.rows[0].name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await db.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const userData = user.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
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

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
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
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: user.rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data"
    });
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

    res.json({
      success: true,
      sessions: sessions.rows
    });

  } catch (error) {
    console.error('Get public sessions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions"
    });
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

    res.json({
      success: true,
      sessions: sessions.rows
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get user sessions"
    });
  }
});

// GET /my-sessions/:id - View a single user session
app.get("/api/my-sessions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await db.query(
      `SELECT * FROM wellness_sessions 
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      session: session.rows[0]
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get session"
    });
  }
});

// POST /my-sessions/save-draft - Save or update a draft session
app.post("/api/my-sessions/save-draft", authenticate, async (req, res) => {
  try {
    const { id, title, tags, content_url, content_data } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    let result;
    
    if (id) {
      // Update existing session
      result = await db.query(
        `UPDATE wellness_sessions 
         SET title = $1, tags = $2, content_url = $3, content_data = $4, 
             is_draft = true, is_published = false
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [title, tags, content_url, JSON.stringify(content_data), id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }
    } else {
      // Create new session
      result = await db.query(
        `INSERT INTO wellness_sessions (user_id, title, tags, content_url, content_data, is_draft, is_published)
         VALUES ($1, $2, $3, $4, $5, true, false)
         RETURNING *`,
        [req.user.id, title, tags, content_url, JSON.stringify(content_data)]
      );
    }

    res.json({
      success: true,
      message: "Draft saved successfully",
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to save draft"
    });
  }
});

// POST /my-sessions/publish - Publish a session
app.post("/api/my-sessions/publish", authenticate, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    const result = await db.query(
      `UPDATE wellness_sessions 
       SET is_published = true, is_draft = false
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      message: "Session published successfully",
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Publish session error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to publish session"
    });
  }
});

// DELETE /my-sessions/:id - Delete a session
app.delete("/api/my-sessions/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM wellness_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      message: "Session deleted successfully"
    });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete session"
    });
  }
});

// Logout route (client-side token removal)
app.post("/api/auth/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
