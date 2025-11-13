// Dashboard Statistics API
// Provides real-time practice metrics and insights

import { initDatabase, executeQuery } from './utils/database-connection.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDatabase();

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get start and end of current week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const weekEnd = endOfWeek.toISOString().split('T')[0];

    // 1. Today's Appointments Count
    const appointmentsResult = await executeQuery(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE appointment_date = $1
       AND status != 'cancelled'`,
      [today]
    );
    const appointmentsToday = parseInt(appointmentsResult.data[0]?.count || 0);

    // 2. Active Clients Count
    const clientsResult = await executeQuery(
      `SELECT COUNT(*) as count FROM clients`
    );
    const activeClients = parseInt(clientsResult.data[0]?.count || 0);

    // 3. Unread Messages Count
    const messagesResult = await executeQuery(
      `SELECT COUNT(*) as count
       FROM client_messages
       WHERE read_at IS NULL
       AND sender_type = 'client'`
    ).catch(() => ({ data: [{ count: 0 }] })); // Handle if table doesn't exist yet
    const unreadMessages = parseInt(messagesResult.data[0]?.count || 0);

    // 4. Weekly Revenue
    const revenueResult = await executeQuery(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM invoices
       WHERE status = 'paid'
       AND created_at >= $1
       AND created_at <= $2`,
      [weekStart, weekEnd]
    ).catch(() => ({ data: [{ total: 0 }] })); // Handle if table doesn't exist yet
    const weeklyRevenue = parseFloat(revenueResult.data[0]?.total || 0);

    // 5. Today's Appointment List (for dashboard display)
    const todayAppointments = await executeQuery(
      `SELECT
        a.id,
        a.appointment_time,
        a.duration,
        a.type,
        a.status,
        a.modality,
        c.name as client_name
       FROM appointments a
       LEFT JOIN clients c ON a.client_id = c.id
       WHERE a.appointment_date = $1
       AND a.status != 'cancelled'
       ORDER BY a.appointment_time ASC`,
      [today]
    );

    // 6. Recent Activity (last 10 actions)
    const recentActivity = [];

    // Get recent clients
    const recentClients = await executeQuery(
      `SELECT name, created_at
       FROM clients
       ORDER BY created_at DESC
       LIMIT 3`
    );
    recentClients.data.forEach(client => {
      recentActivity.push({
        type: 'client_added',
        icon: 'fa-user-plus',
        text: `New client registered: ${client.name}`,
        timestamp: client.created_at
      });
    });

    // Get recent appointments
    const recentAppointments = await executeQuery(
      `SELECT
        a.status,
        a.updated_at,
        c.name as client_name
       FROM appointments a
       LEFT JOIN clients c ON a.client_id = c.id
       WHERE a.status = 'completed'
       ORDER BY a.updated_at DESC
       LIMIT 3`
    );
    recentAppointments.data.forEach(apt => {
      recentActivity.push({
        type: 'appointment_completed',
        icon: 'fa-calendar-check',
        text: `Appointment completed with ${apt.client_name}`,
        timestamp: apt.updated_at
      });
    });

    // Get recent clinical notes
    const recentNotes = await executeQuery(
      `SELECT
        cn.signed_at,
        c.name as client_name
       FROM clinical_notes cn
       LEFT JOIN clients c ON cn.client_id = c.id
       WHERE cn.is_signed = true
       ORDER BY cn.signed_at DESC
       LIMIT 2`
    ).catch(() => ({ data: [] }));
    recentNotes.data.forEach(note => {
      recentActivity.push({
        type: 'note_signed',
        icon: 'fa-file-medical',
        text: `Clinical note signed for ${note.client_name}`,
        timestamp: note.signed_at
      });
    });

    // Get recent payments
    const recentPayments = await executeQuery(
      `SELECT amount, created_at
       FROM invoices
       WHERE status = 'paid'
       ORDER BY created_at DESC
       LIMIT 2`
    ).catch(() => ({ data: [] }));
    recentPayments.data.forEach(payment => {
      recentActivity.push({
        type: 'payment_received',
        icon: 'fa-dollar-sign',
        text: `Payment received: $${parseFloat(payment.amount).toFixed(2)}`,
        timestamp: payment.created_at
      });
    });

    // Sort activity by timestamp and limit to 10
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivity = recentActivity.slice(0, 10);

    // Return comprehensive dashboard data
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          appointments_today: appointmentsToday,
          active_clients: activeClients,
          unread_messages: unreadMessages,
          weekly_revenue: weeklyRevenue
        },
        today_appointments: todayAppointments.data || [],
        recent_activity: limitedActivity,
        metadata: {
          date: today,
          week_start: weekStart,
          week_end: weekEnd,
          generated_at: new Date().toISOString()
        }
      },
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics',
      message: error.message
    });
  }
}
