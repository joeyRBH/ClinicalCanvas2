// Provider/Admin Authentication API
// Handles provider login, logout, and session management

const { initDatabase, executeQuery } = require('./utils/database-connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // POST: Login
    if (req.method === 'POST') {
      const { email, password, username } = req.body;

      // Allow login with either email or username
      if ((!email && !username) || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email/username and password are required'
        });
      }

      // Get provider user
      const identifier = email || username;
      const query = email
        ? 'SELECT * FROM users WHERE email = $1'
        : 'SELECT * FROM users WHERE username = $1';

      const userResult = await executeQuery(query, [identifier.toLowerCase()]);

      if (userResult.data.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const user = userResult.data[0];

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account is inactive. Please contact support.'
        });
      }

      // Verify password
      // Handle both bcrypt and legacy SHA256 hashes
      let validPassword = false;

      if (user.password_hash.startsWith('$2')) {
        // Bcrypt hash
        validPassword = await bcrypt.compare(password, user.password_hash);
      } else {
        // Legacy SHA256 hash - convert and update
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        validPassword = sha256Hash === user.password_hash;

        // If valid, upgrade to bcrypt
        if (validPassword) {
          const bcryptHash = await bcrypt.hash(password, 10);
          await executeQuery(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [bcryptHash, user.id]
          );
        }
      }

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Get IP and user agent
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Update user login info
      await executeQuery(
        `UPDATE users
         SET last_login = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [user.id]
      );

      // Log audit event (if audit_log table exists)
      try {
        await executeQuery(
          `INSERT INTO audit_log (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent)
           VALUES ($1, 'provider', 'login', 'user', $2, $3, $4)`,
          [user.id, user.id, ipAddress, userAgent]
        );
      } catch (auditError) {
        // Audit log might not exist yet, continue without it
        console.log('Audit log not available:', auditError.message);
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    }

    // GET: Verify token / Get user info
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No authorization token provided'
        });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get fresh user data
        const userResult = await executeQuery(
          'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (userResult.data.length === 0 || !userResult.data[0].is_active) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or inactive account'
          });
        }

        const user = userResult.data[0];

        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role
          }
        });

      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Provider auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
