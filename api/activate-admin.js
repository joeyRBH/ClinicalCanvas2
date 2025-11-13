// Temporary endpoint to activate the admin user
import { initDatabase, executeQuery } from './utils/database-connection.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // Activate the admin user
    const result = await executeQuery(
      `UPDATE users SET is_active = true WHERE username = 'admin' RETURNING id, username, email, is_active`,
      []
    );

    if (!result.success || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found or update failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin user activated successfully',
      user: result.data[0]
    });
  } catch (error) {
    console.error('Activation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
