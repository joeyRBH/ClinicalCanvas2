# Monitoring and Error Tracking Setup Guide

## Overview

Proper monitoring and error tracking are essential for:
- Detecting issues before users report them
- Understanding application performance
- Debugging production errors
- Meeting uptime SLAs
- HIPAA audit requirements

This guide covers setting up comprehensive monitoring for HealthCanvas.

---

## Table of Contents

1. [Monitoring Strategy](#monitoring-strategy)
2. [Vercel Analytics](#vercel-analytics)
3. [Sentry Error Tracking](#sentry-error-tracking)
4. [Uptime Monitoring](#uptime-monitoring)
5. [Database Monitoring](#database-monitoring)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Monitoring](#security-monitoring)
8. [Alerting](#alerting)

---

## Monitoring Strategy

### What to Monitor

| Component | Metrics | Tools |
|-----------|---------|-------|
| **Application** | Errors, Performance, Usage | Sentry, Vercel Analytics |
| **Uptime** | Availability, Response Time | UptimeRobot, Pingdom |
| **Database** | Connections, Query Performance | Provider Dashboard |
| **API Endpoints** | Response Time, Error Rate | Vercel Analytics |
| **Third-party Services** | SES, SNS, Stripe Status | Status Pages, Webhooks |
| **Security** | Failed Logins, Suspicious Activity | Custom Logs, Sentry |

---

## Vercel Analytics

### Built-in Monitoring

Vercel provides analytics automatically:

#### Step 1: Enable Analytics

1. Go to Vercel Dashboard → Your Project
2. Click "Analytics" tab
3. Analytics are enabled by default

#### Step 2: Review Metrics

**Web Analytics:**
- Page views
- Unique visitors
- Top pages
- Referrers
- Countries

**Speed Insights:**
- Real User Monitoring (RUM)
- Core Web Vitals:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)

**Function Logs:**
- API endpoint logs
- Execution duration
- Status codes
- Errors

#### Step 3: View Logs

1. Go to Project → Deployments
2. Click on deployment
3. Click "View Function Logs"
4. Filter by:
   - Status code (200, 400, 500)
   - Function path
   - Time range

### Vercel Log Retention

- **Hobby Plan:** 1 day
- **Pro Plan:** 7 days
- **Enterprise:** Custom

For longer retention, integrate with Sentry or external logging service.

---

## Sentry Error Tracking

Sentry provides real-time error tracking and performance monitoring.

### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Click "Sign Up"
3. Choose plan:
   - **Developer** (Free): 5k errors/month
   - **Team** ($26/month): 50k errors/month
   - **Business** ($80/month): 100k errors/month
4. Create account

### Step 2: Create Project

1. Click "Create Project"
2. Platform: **Node.js** (for API) and **JavaScript** (for frontend)
3. Project name: `healthcanvas`
4. Team: Select or create
5. Click "Create Project"
6. Copy DSN (Data Source Name):
   ```
   https://[key]@[org].ingest.sentry.io/[project]
   ```

### Step 3: Install Sentry

**For API (Backend):**

```bash
npm install @sentry/node @sentry/tracing
```

**For Frontend:**

```bash
npm install @sentry/browser @sentry/tracing
```

### Step 4: Configure Sentry

**Create `api/utils/sentry.js`:**

```javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions for performance

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data before sending
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers.authorization;
    }
    return event;
  }
});

module.exports = Sentry;
```

**Update API endpoints to use Sentry:**

```javascript
const Sentry = require('./utils/sentry');

module.exports = async (req, res) => {
  try {
    // Your endpoint code
    const result = await someFunction();
    res.status(200).json(result);

  } catch (error) {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/your-endpoint',
        user_id: req.user?.id
      },
      extra: {
        request_body: req.body,
        query: req.query
      }
    });

    // Send error response
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

**For Frontend (`public/app.js`):**

Add at the top of your app.js:

```javascript
// Initialize Sentry (Frontend)
if (window.location.hostname !== 'localhost') {
  Sentry.init({
    dsn: 'https://[key]@[org].ingest.sentry.io/[project]',
    environment: 'production',
    tracesSampleRate: 0.1,

    // Don't capture PHI
    beforeSend(event) {
      // Remove form data that might contain PHI
      if (event.request?.data) {
        delete event.request.data;
      }
      return event;
    }
  });
}
```

### Step 5: Add Environment Variables

Add to Vercel:

```
SENTRY_DSN = https://[key]@[org].ingest.sentry.io/[project]
```

### Step 6: Test Sentry

**Test error capture:**

```javascript
// Trigger test error
Sentry.captureException(new Error('Test error from HealthCanvas'));
```

Or visit: `https://your-app.vercel.app/api/sentry-test`

Create test endpoint:

```javascript
// api/sentry-test.js
const Sentry = require('./utils/sentry');

module.exports = (req, res) => {
  Sentry.captureException(new Error('Sentry test error'));
  res.json({ message: 'Test error sent to Sentry' });
};
```

Check Sentry dashboard for error.

### Step 7: Configure Alerts

1. In Sentry, go to Alerts
2. Create alert rules:

**Critical Errors:**
- Trigger: Any error in production
- Notification: Email, Slack
- Frequency: Immediate

**High Error Rate:**
- Trigger: >10 errors in 1 minute
- Notification: Email, SMS
- Frequency: At most once per hour

**Performance Degradation:**
- Trigger: P95 response time >3 seconds
- Notification: Email
- Frequency: Once per day

---

## Uptime Monitoring

Monitor application availability from multiple locations.

### Option 1: UptimeRobot (Free)

#### Setup

1. Go to https://uptimerobot.com
2. Sign up (free plan: 50 monitors, 5-min intervals)
3. Click "Add New Monitor"

**Monitor Configuration:**
- Monitor Type: **HTTP(s)**
- Friendly Name: `HealthCanvas - Homepage`
- URL: `https://your-app.vercel.app`
- Monitoring Interval: **5 minutes**
- Monitor Timeout: **30 seconds**

**Advanced:**
- Alert When: **Down**
- Alert Contacts: Add email, SMS, Slack

4. Click "Create Monitor"

**Additional Monitors to Create:**
- `/api/health` - Health check endpoint
- Login page availability
- API response time

#### Health Check Endpoint

Create `/api/health.js`:

```javascript
module.exports = (req, res) => {
  // Check database
  // Check critical services

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};
```

### Option 2: Pingdom (Paid, More Features)

- Website: https://www.pingdom.com
- Features: Uptime, Real User Monitoring, Page Speed
- Cost: $10/month starter plan

### Option 3: Better Uptime (Modern Alternative)

- Website: https://betteruptime.com
- Free tier: 10 monitors, 3-min checks
- Features: Status pages, on-call scheduling

---

## Database Monitoring

### Vercel Postgres Monitoring

1. Go to Vercel → Storage → Your Database
2. Click "Metrics" tab
3. Monitor:
   - Active connections
   - Query duration
   - Storage usage
   - CPU usage

**Set Alerts:**
- Connections near limit
- Slow queries (>1 second)
- Storage >80% full

### Neon Database Monitoring

1. Go to Neon Console → Project
2. Click "Monitoring"
3. View:
   - Connection metrics
   - Query performance
   - Storage trends

**Best Practices:**
- Monitor connection pool usage
- Set up slow query logging
- Alert on connection errors

---

## Performance Monitoring

### Core Web Vitals

Monitor user experience metrics:

**LCP (Largest Contentful Paint):**
- Target: <2.5 seconds
- Measures: Loading performance

**FID (First Input Delay):**
- Target: <100ms
- Measures: Interactivity

**CLS (Cumulative Layout Shift):**
- Target: <0.1
- Measures: Visual stability

**View in Vercel:**
1. Project → Speed Insights
2. See real user measurements
3. Identify slow pages

### API Performance

**Monitor Response Times:**

Add timing to API endpoints:

```javascript
module.exports = async (req, res) => {
  const startTime = Date.now();

  try {
    const result = await yourFunction();
    const duration = Date.now() - startTime;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.url} took ${duration}ms`);
      Sentry.captureMessage(`Slow API request: ${req.url}`, {
        level: 'warning',
        extra: { duration, endpoint: req.url }
      });
    }

    res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    Sentry.captureException(error, {
      extra: { duration, endpoint: req.url }
    });
    res.status(500).json({ error: 'Error' });
  }
};
```

---

## Security Monitoring

### Failed Login Attempts

Monitor suspicious login activity:

**In `/api/provider-auth.js` and `/api/client-auth.js`:**

```javascript
// Track failed attempts
const failedAttempts = new Map(); // In production, use Redis

function checkFailedLogins(email, ip) {
  const key = `${email}:${ip}`;
  const attempts = failedAttempts.get(key) || 0;

  if (attempts > 5) {
    // Alert security team
    Sentry.captureMessage('Multiple failed login attempts', {
      level: 'warning',
      tags: { security: 'auth' },
      extra: { email, ip, attempts }
    });

    // Consider rate limiting or blocking
    return false; // Block login
  }

  return true; // Allow
}

// On failed login:
failedAttempts.set(key, (failedAttempts.get(key) || 0) + 1);

// Clear after 15 minutes:
setTimeout(() => failedAttempts.delete(key), 15 * 60 * 1000);
```

### Unusual Activity

Monitor for:
- Mass data exports
- Unusual access patterns
- After-hours access (if unexpected)
- Access from new locations
- Multiple users from same IP

### HIPAA Audit Logging

Required for HIPAA compliance:

**Log these events:**
- PHI access (read, write, delete)
- User logins/logouts
- Permission changes
- Security incidents

**Implementation:**

```javascript
async function logAuditEvent(event) {
  await db.query(
    `INSERT INTO audit_logs
     (event_type, user_id, patient_id, ip_address, details, timestamp)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [event.type, event.userId, event.patientId, event.ip, event.details]
  );
}

// Usage:
await logAuditEvent({
  type: 'PHI_ACCESS',
  userId: user.id,
  patientId: patient.id,
  ip: req.connection.remoteAddress,
  details: { action: 'view_clinical_note', noteId: note.id }
});
```

---

## Alerting

### Alert Channels

Set up multiple notification channels:

**Email:**
- Primary contact
- Operations team
- On-call engineer

**SMS:**
- Critical alerts only
- On-call phone

**Slack (Recommended):**
- Create #healthcanvas-alerts channel
- Integrate Sentry, UptimeRobot, Vercel

**PagerDuty (Advanced):**
- For on-call rotation
- Escalation policies

### Alert Levels

**P1 - Critical (Immediate):**
- Application down
- Database unavailable
- Payment processing failing
- Data breach suspected

**P2 - High (Within 1 hour):**
- Elevated error rate (>5%)
- Slow performance (>5 seconds)
- Third-party service degraded

**P3 - Medium (Within 4 hours):**
- Non-critical feature broken
- Moderate error rate increase
- Storage approaching limits

**P4 - Low (Next business day):**
- UI bugs
- Minor performance degradation
- Feature requests

---

## Dashboards

### Create Monitoring Dashboard

**Option 1: Grafana Cloud (Free tier)**

1. Sign up at https://grafana.com
2. Create data sources:
   - Vercel (via API)
   - Sentry (via API)
   - UptimeRobot (via API)
3. Create dashboard with panels:
   - Uptime %
   - Error rate
   - Response time (P50, P95, P99)
   - Active users

**Option 2: Custom Dashboard**

Create simple status page:

```html
<!-- public/status.html -->
<div id="status-dashboard">
  <h1>HealthCanvas Status</h1>

  <div class="metric">
    <h2>Uptime (30 days)</h2>
    <div class="value">99.9%</div>
  </div>

  <div class="metric">
    <h2>Response Time</h2>
    <div class="value">245ms</div>
  </div>

  <div class="metric">
    <h2>Error Rate</h2>
    <div class="value">0.01%</div>
  </div>
</div>
```

---

## Monitoring Checklist

### Initial Setup
- [ ] Enable Vercel Analytics
- [ ] Set up Sentry account and projects
- [ ] Install Sentry SDK (frontend & backend)
- [ ] Add Sentry DSN to environment variables
- [ ] Create health check endpoint
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure database monitoring
- [ ] Set up alert notifications (email, Slack)
- [ ] Test all monitoring systems
- [ ] Document incident response procedures

### Daily Monitoring
- [ ] Check for new Sentry errors
- [ ] Review uptime reports
- [ ] Check application logs

### Weekly Monitoring
- [ ] Review performance trends
- [ ] Analyze error patterns
- [ ] Check security logs
- [ ] Review database performance

### Monthly Monitoring
- [ ] Generate uptime report
- [ ] Review all alert configurations
- [ ] Audit monitoring coverage
- [ ] Update runbooks
- [ ] Review and optimize slow queries

---

## Best Practices

### 1. Don't Log PHI

**Bad:**
```javascript
console.log('Patient data:', patient);
Sentry.captureException(error, { extra: { patient } });
```

**Good:**
```javascript
console.log('Patient ID:', patient.id);
Sentry.captureException(error, {
  extra: { patient_id: patient.id }
});
```

### 2. Use Appropriate Log Levels

```javascript
console.info('User logged in'); // Informational
console.warn('Slow query detected'); // Warning
console.error('Database connection failed'); // Error
```

### 3. Include Context

```javascript
Sentry.captureException(error, {
  tags: {
    endpoint: '/api/appointments',
    user_id: user.id
  },
  extra: {
    appointment_id: appointment.id,
    action: 'create'
  }
});
```

### 4. Set Up Proper Sampling

Don't send every event to Sentry (expensive):

```javascript
tracesSampleRate: 0.1, // 10% for performance
sampleRate: 1.0, // 100% for errors
```

---

## Incident Response

### When Alert Fires

1. **Acknowledge:** Confirm receipt of alert
2. **Assess:** Determine severity and impact
3. **Communicate:** Notify team and users if needed
4. **Investigate:** Check logs, Sentry, database
5. **Mitigate:** Fix or deploy workaround
6. **Verify:** Confirm issue is resolved
7. **Document:** Write postmortem
8. **Prevent:** Update monitoring to catch earlier next time

### Postmortem Template

```markdown
# Incident Postmortem

**Date:** 2025-11-13
**Duration:** 14 minutes
**Severity:** P2 (High)

## Summary
Brief description of what happened

## Timeline
- 14:00 - Alert fired
- 14:02 - On-call engineer acknowledged
- 14:05 - Root cause identified
- 14:10 - Fix deployed
- 14:14 - Verified resolved

## Root Cause
Detailed explanation

## Impact
- Users affected: ~50
- Revenue impact: None
- Data loss: None

## Resolution
How it was fixed

## Action Items
- [ ] Update monitoring to detect earlier
- [ ] Add automated tests
- [ ] Update runbook
```

---

**Last Updated:** November 13, 2025
**Next Review:** Quarterly
