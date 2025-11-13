# AWS SES/SNS Setup Guide for Email and SMS Notifications

## Overview

HealthCanvas uses AWS (Amazon Web Services) for sending notifications:
- **SES (Simple Email Service):** For sending emails (appointment reminders, invoices, etc.)
- **SNS (Simple Notification Service):** For sending SMS text messages

This guide will walk you through setting up AWS for production use.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [SES Configuration (Email)](#ses-configuration-email)
4. [SNS Configuration (SMS)](#sns-configuration-sms)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [ ] AWS Account
- [ ] Credit card for AWS billing
- [ ] Domain name (for email verification)
- [ ] Access to Vercel dashboard

---

## AWS Account Setup

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email address and password
4. Choose account type: "Professional"
5. Enter business information
6. Add payment method
7. Verify phone number
8. Select support plan: "Basic" (free) is sufficient

### Step 2: Create IAM User (Recommended)

Instead of using root credentials, create a dedicated IAM user:

1. Sign in to AWS Console
2. Go to IAM (Identity and Access Management)
3. Click "Users" → "Add users"
4. User name: `healthcanvas-notifications`
5. Access type: ✅ Programmatic access
6. Click "Next: Permissions"

### Step 3: Set Permissions

1. Choose "Attach existing policies directly"
2. Select these policies:
   - ✅ `AmazonSESFullAccess`
   - ✅ `AmazonSNSFullAccess`
3. Click "Next: Tags"
4. Add tag (optional):
   - Key: `Application`
   - Value: `HealthCanvas`
5. Click "Next: Review"
6. Click "Create user"

### Step 4: Save Credentials

⚠️ **CRITICAL:** This is the only time you'll see the secret key!

1. Download CSV or copy:
   - **Access Key ID:** `AKIA...`
   - **Secret Access Key:** `...`
2. Store securely (password manager recommended)
3. Never commit to Git!

---

## SES Configuration (Email)

### Step 1: Choose AWS Region

1. In AWS Console, select a region (top right)
2. Recommended regions:
   - `us-east-1` (US East - N. Virginia) - Most common
   - `us-west-2` (US West - Oregon)
   - `eu-west-1` (Europe - Ireland)
3. **Remember your region** - you'll need it later

### Step 2: Verify Email Address

**For Testing (Sandbox Mode):**

1. Go to SES Console: https://console.aws.amazon.com/ses
2. Click "Email Addresses" (left sidebar)
3. Click "Verify a New Email Address"
4. Enter your email: `your-email@example.com`
5. Click "Verify This Email Address"
6. Check your inbox and click verification link
7. Repeat for any test recipient emails

**Important:** In sandbox mode, you can only send TO verified emails.

### Step 3: Move Out of Sandbox (Production)

To send emails to any address, request production access:

1. In SES Console, click "Sending Statistics"
2. Click "Edit your account details"
3. Or go to: https://console.aws.amazon.com/ses/home#/account
4. Click "Request production access"
5. Fill out the form:

**Mail Type:** Transactional
**Website URL:** `https://your-domain.com`
**Use Case Description:** (Example below)

```
We are a healthcare practice using an EHR system to send:
- Appointment reminders to patients
- Appointment confirmations
- Invoice and payment receipts
- Clinical document notifications
- Password reset emails

All emails are transactional (not marketing).
Emails are only sent to patients who have consented.
We comply with HIPAA regulations.

Expected volume: 100-500 emails per day
```

**Additional Contacts:** (Optional) Additional email addresses for AWS to contact
**Acknowledge:** ✅ Agree to comply with AWS policies

6. Click "Submit for review"
7. Wait for approval (usually 24-48 hours)

### Step 4: Verify Domain (Recommended)

Domain verification improves deliverability and enables DKIM:

1. Go to SES Console → "Domains"
2. Click "Verify a New Domain"
3. Enter your domain: `example.com`
4. ✅ Generate DKIM Settings
5. Click "Verify This Domain"
6. AWS will provide DNS records to add:

**DNS Records to Add:**
```
Type: TXT
Name: _amazonses.example.com
Value: [provided by AWS]

Type: CNAME (DKIM - 3 records)
Name: [provided by AWS]
Value: [provided by AWS]
```

7. Add these records to your DNS provider
8. Wait for verification (can take 24-72 hours)

### Step 5: Configure Sending

1. **Default From Email:**
   - Use verified email or domain
   - Example: `noreply@example.com`

2. **Reply-To Email:**
   - Use your practice email
   - Example: `contact@example.com`

3. **Email Templates** (Optional but recommended):
   - Create email templates in SES Console
   - Reusable templates for appointment reminders, etc.

---

## SNS Configuration (SMS)

### Step 1: Enable SMS in SNS

1. Go to SNS Console: https://console.aws.amazon.com/sns
2. Click "Text messaging (SMS)" in left sidebar
3. Click "Manage SMS settings"

### Step 2: Configure SMS Settings

**General Settings:**

1. **Default message type:**
   - Choose "Transactional" (higher priority, better delivery)

2. **Account spend limit:**
   - Default: $1.00/month
   - Recommended for healthcare: $50-100/month
   - To increase: Click "Request spend increase"

3. **Default sender ID:** (Optional)
   - Not supported in US
   - Can be used in other countries

4. **Delivery status logging:**
   - ✅ Enable for both successful and failed deliveries
   - Create IAM role if prompted
   - Helps troubleshooting

### Step 3: Request Production SMS Access

For the US, SMS is restricted to prevent spam:

1. Go to SNS Console → Text Messaging → "Mobile text messaging (SMS)"
2. Click "View SMS sandbox phone numbers"
3. Add test phone numbers (sandbox mode)
4. Request production access:
   - Go to AWS Support Center
   - Create case: "Service Limit Increase"
   - Case type: SNS SMS
   - Provide use case similar to email

**SMS Use Case Example:**
```
Healthcare practice sending appointment reminders:
- Two-factor authentication codes
- Appointment reminders (24-hour notice)
- Appointment confirmations
- Emergency notifications (rare)

Expected volume: 50-200 SMS per day
Target country: United States
Message content: Transactional only, HIPAA-compliant

Sample messages:
- "Your appointment with Dr. Smith is tomorrow at 2 PM. Reply CONFIRM or call 555-1234."
- "Your verification code is 123456"
```

### Step 4: Origination Numbers (Recommended for US)

For better deliverability in the US, use dedicated numbers:

1. **Toll-Free Number (Recommended):**
   - Go to Pinpoint Console: https://console.aws.amazon.com/pinpoint
   - Phone numbers → Request phone number
   - Choose "Toll-free" (costs ~$2/month)
   - Enable SMS
   - Wait for approval (1-2 weeks)

2. **10DLC (Long Code):**
   - Alternative to toll-free
   - Requires business registration
   - Better for high-volume (500+ daily)

---

## Environment Variables

Add these to Vercel environment variables:

### AWS Credentials

```
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
AWS_REGION = us-east-1
```

### Optional Email Settings

```
AWS_SES_FROM_EMAIL = noreply@yourdomain.com
AWS_SES_FROM_NAME = HealthCanvas
AWS_SES_REPLY_TO = contact@yourdomain.com
```

### Optional SMS Settings

```
AWS_SNS_SENDER_ID = [your-sender-id]  # Not for US
AWS_SNS_DEFAULT_PHONE = +18005551234  # Your toll-free number
```

### Configuration in Vercel

1. Go to Vercel Project → Settings → Environment Variables
2. Add each variable
3. Select environment: Production (or all)
4. Click "Save"
5. **Redeploy** your application

---

## Testing

### Test Email Sending

**Using Sandbox Mode (Verified Recipients Only):**

1. Verify your test email in SES
2. Test the API endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "verified-email@example.com",
    "subject": "Test Email",
    "body": "This is a test email from HealthCanvas"
  }'
```

3. Check your inbox
4. Check SES Console → "Email sending" → "Sending statistics"

**Using Production Mode:**

1. After approval, test with any email address
2. Monitor bounce and complaint rates
3. Keep rates low (<5% bounce, <0.1% complaint)

### Test SMS Sending

**Using Sandbox Mode:**

1. Add test phone number in SNS Console
2. Verify via SMS code
3. Test the API endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+15555551234",
    "message": "Test SMS from HealthCanvas"
  }'
```

4. Check your phone
5. Check SNS Console → "Text messaging (SMS)" → "Delivery reports"

### Email Testing Checklist

- [ ] Send to verified email (sandbox)
- [ ] Verify email received
- [ ] Check email formatting (HTML)
- [ ] Test with appointment reminder template
- [ ] Test with invoice template
- [ ] Check spam folder
- [ ] Verify links work
- [ ] Test unsubscribe link (if applicable)

### SMS Testing Checklist

- [ ] Send to verified number (sandbox)
- [ ] Verify SMS received
- [ ] Check message formatting
- [ ] Test with appointment reminder
- [ ] Test opt-out response (STOP)
- [ ] Verify delivery reports

---

## HIPAA Compliance

### Business Associate Agreement (BAA)

AWS offers HIPAA compliance for eligible services.

#### Step 1: Sign AWS BAA

1. Log in to AWS Console
2. Go to Artifact: https://console.aws.amazon.com/artifact
3. Click "Agreements"
4. Find "AWS Business Associate Addendum"
5. Review and accept
6. Download signed copy for your records

**Eligible Services:**
- ✅ Amazon SES
- ✅ Amazon SNS
- ✅ Other services (S3, RDS, etc.)

#### Step 2: Configure for HIPAA

**Minimize PHI in Messages:**

❌ **Bad - Contains PHI:**
```
Subject: Appointment Reminder - John Doe - Cancer Treatment
Body: Dear John, your chemotherapy appointment is tomorrow...
```

✅ **Good - Minimal PHI:**
```
Subject: Appointment Reminder
Body: You have an appointment tomorrow at 2 PM.
      Log in to view details: [secure link]
```

**Best Practices:**

1. **Use Secure Links Instead of PHI:**
   - Send link to patient portal
   - Include unique token in URL
   - Don't include diagnosis, treatment, or sensitive details

2. **Email Content:**
   ```
   Subject: You have a new message from [Practice Name]

   Dear Patient,

   You have a new message in your patient portal.
   Click here to view: https://app.example.com/messages?token=xxx

   This message will expire in 24 hours for security.

   [Practice Name]
   ```

3. **SMS Content:**
   ```
   Appointment reminder for tomorrow 2PM.
   Login to view details or call 555-1234.
   Reply STOP to opt out.
   ```

4. **Encryption:**
   - Email: Use TLS (SES enforces this)
   - SMS: Encrypted in transit by carriers
   - Never send passwords or sensitive data via SMS

5. **Opt-Out Mechanisms:**
   - Honor STOP requests for SMS
   - Provide unsubscribe for emails
   - Document preferences in patient record

---

## Code Integration

### Sending Email

**File:** `/api/send-email.js`

```javascript
// Example usage:
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    to: 'patient@example.com',
    subject: 'Appointment Reminder',
    body: 'You have an appointment tomorrow at 2 PM.',
    // Optional:
    html: '<p>You have an appointment tomorrow at <strong>2 PM</strong>.</p>',
    replyTo: 'contact@example.com'
  })
});
```

### Sending SMS

**File:** `/api/send-sms.js`

```javascript
// Example usage:
const response = await fetch('/api/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    phone: '+15555551234',
    message: 'Appointment reminder for tomorrow 2PM. Call 555-1234 to confirm.'
  })
});
```

---

## Monitoring and Metrics

### SES Metrics to Monitor

1. **Sending Statistics:**
   - Go to SES Console → "Sending statistics"
   - Monitor:
     - Emails sent
     - Bounces (<5% is good)
     - Complaints (<0.1% is good)

2. **Reputation Dashboard:**
   - Go to SES Console → "Reputation dashboard"
   - Monitor bounce and complaint rates
   - AWS will throttle or suspend if rates are high

3. **CloudWatch Metrics:**
   - Set up alarms for:
     - High bounce rate
     - High complaint rate
     - Send quota approaching

### SNS Metrics to Monitor

1. **SMS Delivery:**
   - Go to SNS Console → "Text messaging (SMS)"
   - Monitor:
     - Messages sent
     - Delivery success rate
     - Spend

2. **CloudWatch Logs:**
   - Review delivery status logs
   - Identify patterns in failures

### Cost Monitoring

**SES Pricing:**
- First 62,000 emails/month: FREE (from EC2)
- From Vercel/external: $0.10 per 1,000 emails
- Attachments: $0.12 per GB

**SNS SMS Pricing (US):**
- $0.00645 per SMS (transactional)
- Varies by country

**Set Budget Alerts:**
1. Go to AWS Billing → Budgets
2. Create budget: $20/month (adjust as needed)
3. Set alert at 80% of budget

---

## Troubleshooting

### Common Email Issues

#### 1. "Email address is not verified"

**Cause:** Trying to send to unverified email in sandbox mode
**Solution:**
- Verify recipient email in SES Console
- OR request production access

#### 2. Emails Going to Spam

**Causes:**
- Domain not verified
- No DKIM configured
- Poor email content (spammy words)

**Solutions:**
- Verify domain and enable DKIM
- Improve email content
- Add SPF record to DNS:
  ```
  v=spf1 include:amazonses.com ~all
  ```
- Warm up sending (gradually increase volume)

#### 3. High Bounce Rate

**Causes:**
- Invalid email addresses
- Typos in patient emails

**Solutions:**
- Validate emails on input
- Remove bounced emails from lists
- Use double opt-in for subscriptions

### Common SMS Issues

#### 1. SMS Not Delivered

**Causes:**
- Phone number in sandbox (not verified)
- Incorrect phone format
- Carrier blocking
- Spend limit reached

**Solutions:**
- Verify phone format: +1XXXXXXXXXX
- Check spend limit in SNS settings
- Use toll-free number for better deliverability
- Check delivery status logs

#### 2. "OptedOut" Error

**Cause:** Recipient previously replied STOP
**Solution:**
- Recipient must reply START to opt back in
- Or contact them via other means

---

## Best Practices

### Email Best Practices

1. **Authentication:**
   - ✅ Verify domain
   - ✅ Enable DKIM
   - ✅ Add SPF record

2. **Content:**
   - Use clear, professional subject lines
   - Include unsubscribe link
   - Avoid spam trigger words
   - Test emails before sending

3. **Deliverability:**
   - Start with low volume, increase gradually
   - Monitor bounce/complaint rates
   - Remove invalid emails promptly
   - Use double opt-in

4. **Security:**
   - Use TLS encryption (enabled by default)
   - Don't include PHI in plain text
   - Use secure links to patient portal

### SMS Best Practices

1. **Compliance:**
   - ✅ Get patient consent before sending
   - ✅ Provide opt-out mechanism (STOP)
   - ✅ Honor opt-out requests immediately
   - ✅ Send only during reasonable hours (8 AM - 9 PM)

2. **Content:**
   - Keep messages short (<160 characters ideal)
   - Include practice name
   - Provide callback number
   - Don't include sensitive PHI

3. **Timing:**
   - Send appointment reminders 24 hours in advance
   - Don't send too frequently
   - Respect time zones

---

## Checklist

### Initial Setup
- [ ] Create AWS account
- [ ] Create IAM user with SES/SNS permissions
- [ ] Save access keys securely
- [ ] Choose AWS region
- [ ] Verify email address (sandbox)
- [ ] Request SES production access
- [ ] Verify domain (recommended)
- [ ] Enable DKIM
- [ ] Configure SNS SMS settings
- [ ] Request SNS production access
- [ ] Add environment variables to Vercel
- [ ] Sign AWS HIPAA BAA
- [ ] Test email sending
- [ ] Test SMS sending

### Before Go-Live
- [ ] SES production access approved
- [ ] SNS production access approved
- [ ] Domain verified with DKIM
- [ ] SPF record added
- [ ] Toll-free number activated (if using)
- [ ] Email templates created
- [ ] Test all notification types
- [ ] Configure monitoring/alerts
- [ ] Set budget alerts
- [ ] Document opt-out procedures

---

**Last Updated:** November 13, 2025
**Next Review:** Quarterly
