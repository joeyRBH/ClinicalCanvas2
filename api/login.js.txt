// Login API Endpoint
// Handles user authentication and returns JWT token

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initDatabase, executeQuery } from './utils/database-connection.js';

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, username } = req.body;

    // Validate required fields (accept either email or username)
    if (!password || (!email && !username)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email/username and password are required'
      });
    }

    // Initialize database connection
    const dbConnected = await initDatabase();

    if (!dbConnected) {
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Please try again later'
      });
    }

    // Find user by email or username
    let query;
    let params;

    if (email) {
      query = 'SELECT id, username, password_hash, email, full_name, role, is_active FROM users WHERE email = $1';
      params = [email];
    } else {
      query = 'SELECT id, username, password_hash, email, full_name, role, is_active FROM users WHERE username = $1';
      params = [username];
    }

    const userResult = await executeQuery(query, params);

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email/username or password'
      });
    }

    const user = userResult.data[0];

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email/username or password'
      });
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication system not properly configured'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login timestamp
    await executeQuery(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Return success with token and user info
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
}
