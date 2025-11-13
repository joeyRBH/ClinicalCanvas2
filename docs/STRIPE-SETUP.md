# Stripe Payment Processing Setup Guide

## Overview

HealthCanvas uses Stripe for payment processing, including:
- Patient billing and invoicing
- Payment method storage
- Subscription management
- Refund processing

This guide will walk you through setting up Stripe for production use.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Stripe Account Setup](#stripe-account-setup)
3. [API Keys Configuration](#api-keys-configuration)
4. [Webhook Configuration](#webhook-configuration)
5. [Product and Pricing Setup](#product-and-pricing-setup)
6. [Testing](#testing)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [ ] Active Stripe account
- [ ] Access to Vercel dashboard
- [ ] HealthCanvas deployed to Vercel

---

## Stripe Account Setup

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign Up" or "Start Now"
3. Complete business information:
   - Business type: Healthcare/Medical
   - Business name: [Your Practice Name]
   - Contact information
   - Tax ID (EIN)

### Step 2: Activate Your Account

1. Complete Stripe's identity verification
2. Add bank account for payouts
3. Set up business details
4. Accept Stripe's terms of service

### Step 3: Enable Required Features

In your Stripe Dashboard:

1. **Payment Methods**
   - Navigate to Settings → Payment Methods
   - Enable: Credit/Debit Cards, ACH Direct Debit (optional)

2. **Customer Portal** (for self-service)
   - Navigate to Settings → Customer Portal
   - Enable customer portal
   - Configure allowed actions (payment methods, invoices)

3. **Email Receipts**
   - Navigate to Settings → Emails
   - Enable payment receipts
   - Customize email branding

---

## API Keys Configuration

### Step 1: Obtain API Keys

#### For Testing (Development)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

#### For Production

1. Toggle to "Live mode" in Stripe Dashboard
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your keys:
   - **Publishable key:** `pk_live_...`
   - **Secret key:** `sk_live_...`

⚠️ **IMPORTANT:** Never commit secret keys to Git!

### Step 2: Add Keys to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

**For Production:**
```
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY = pk_live_xxxxxxxxxxxxx
```

**For Preview/Development (optional):**
```
STRIPE_SECRET_KEY = sk_test_xxxxxxxxxxxxx (Preview/Development only)
STRIPE_PUBLISHABLE_KEY = pk_test_xxxxxxxxxxxxx (Preview/Development only)
```

4. Click "Save"
5. Redeploy your application

### Step 3: Verify Configuration

1. After deployment, check your application logs
2. Test creating a payment (use test card: 4242 4242 4242 4242)
3. Verify payment appears in Stripe Dashboard

---

## Webhook Configuration

Webhooks allow Stripe to notify your application about events (successful payments, failed charges, etc.).

### Step 1: Create Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint"
3. Enter endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events to listen for:

**Recommended Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

5. Click "Add endpoint"

### Step 2: Get Webhook Signing Secret

1. Click on your newly created webhook
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to Vercel environment variables:

```
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxx
```

4. Redeploy your application

### Step 3: Test Webhook

1. In Stripe Dashboard, go to your webhook
2. Click "Send test webhook"
3. Select an event (e.g., `payment_intent.succeeded`)
4. Check your application logs to verify receipt

---

## Product and Pricing Setup

### Step 1: Create Products

1. Go to Stripe Dashboard → Products
2. Click "+ Add product"
3. Create products for your services:

**Example Products:**
```
- Initial Consultation
- Follow-up Visit (30 min)
- Follow-up Visit (60 min)
- Telehealth Appointment
- Treatment Session
- Lab Work Review
```

For each product:
- Name: [Service Name]
- Description: [Service Description]
- Pricing: Set your price
- Recurring: No (for one-time services)

### Step 2: Create Subscription Plans (Optional)

If offering subscription-based services:

1. Go to Stripe Dashboard → Products
2. Click "+ Add product"
3. Set as recurring:

**Example Subscriptions:**
```
- Monthly Membership - $XX/month
- Quarterly Package - $XX/quarter
- Annual Wellness Plan - $XX/year
```

Configure:
- Billing period: Monthly, Quarterly, or Yearly
- Trial period: Optional (e.g., 14 days)
- Pricing tiers: Optional

### Step 3: Get Product/Price IDs

1. Click on each product
2. Copy the Price ID (starts with `price_`)
3. Use these IDs in your application when creating payments

**Store in your application or environment variables:**
```
STRIPE_PRICE_CONSULTATION = price_xxxxxxxxxxxxx
STRIPE_PRICE_FOLLOWUP_30 = price_xxxxxxxxxxxxx
STRIPE_PRICE_MEMBERSHIP = price_xxxxxxxxxxxxx
```

---

## Testing

### Test Card Numbers

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0069 | Declined (expired card) |

**Test Details:**
- Expiration: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Test Checklist

- [ ] Create a test payment
- [ ] Verify payment appears in Stripe Dashboard
- [ ] Test payment with authentication required
- [ ] Test declined payment
- [ ] Verify invoice generation
- [ ] Test refund process
- [ ] Verify webhook events are received
- [ ] Test subscription creation (if applicable)
- [ ] Test subscription cancellation (if applicable)

---

## HIPAA Compliance

### Business Associate Agreement (BAA)

Stripe offers HIPAA compliance for eligible customers.

#### Step 1: Check Eligibility

- You must be on a paid Stripe plan
- You must handle Protected Health Information (PHI)
- Your business must be HIPAA-covered

#### Step 2: Sign BAA with Stripe

1. Contact Stripe support: https://support.stripe.com
2. Request HIPAA BAA
3. Complete required forms
4. Sign BAA electronically

#### Step 3: Enable HIPAA Features

After BAA is signed:

1. Minimize PHI in Stripe
   - Avoid storing unnecessary patient data
   - Use patient ID numbers instead of names when possible
   - Don't include diagnosis or treatment info in payment descriptions

2. Configure Metadata Carefully
   ```javascript
   // Good - no PHI
   metadata: {
     patient_id: "12345",
     service_code: "99213",
     provider_id: "67890"
   }

   // Bad - contains PHI
   metadata: {
     patient_name: "John Doe",
     diagnosis: "...",
     treatment: "..."
   }
   ```

3. Enable Enhanced Security
   - Require 3D Secure for cards
   - Enable radar fraud detection
   - Set up alerts for suspicious activity

---

## Code Integration

### Creating a Payment Intent

The application uses Payment Intents for one-time payments.

**File:** `/api/create-payment-intent.js`

```javascript
// Example usage from frontend:
const response = await fetch('/api/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 15000, // $150.00 in cents
    patient_id: '12345',
    service_type: 'consultation'
  })
});
```

### Creating a Subscription

**File:** `/api/create-subscription.js`

```javascript
// Example usage from frontend:
const response = await fetch('/api/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: '12345',
    price_id: 'price_xxxxxxxxxxxxx'
  })
});
```

### Processing Refunds

**File:** `/api/refunds.js`

```javascript
// Example usage from frontend:
const response = await fetch('/api/refunds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    payment_intent_id: 'pi_xxxxxxxxxxxxx',
    amount: 5000, // $50.00 partial refund (optional)
    reason: 'requested_by_customer'
  })
});
```

---

## Troubleshooting

### Common Issues

#### 1. "No such customer" Error

**Cause:** Customer ID doesn't exist in Stripe
**Solution:**
- Check customer was created successfully
- Verify customer ID is correct
- Check you're using the right API key (test vs. live)

#### 2. "Invalid API Key" Error

**Cause:** Wrong or expired API key
**Solution:**
- Verify API key in Vercel environment variables
- Ensure you're using the correct mode (test vs. live)
- Regenerate key in Stripe if needed

#### 3. Webhook Signature Verification Failed

**Cause:** Webhook secret mismatch
**Solution:**
- Verify STRIPE_WEBHOOK_SECRET in Vercel
- Check webhook endpoint URL is correct
- Ensure webhook is using the correct secret

#### 4. Payment Declined

**Cause:** Various (insufficient funds, fraud prevention, etc.)
**Solution:**
- Check decline reason in Stripe Dashboard
- Contact customer to update payment method
- Review fraud rules in Stripe Radar

### Getting Help

**Stripe Support:**
- Dashboard: https://dashboard.stripe.com/support
- Documentation: https://stripe.com/docs
- Email: support@stripe.com

**Check Integration:**
- Test in Stripe's test mode first
- Use Stripe CLI for local webhook testing
- Review Stripe logs in Dashboard

---

## Security Best Practices

### 1. API Key Security

- ✅ Store keys in environment variables only
- ✅ Never commit keys to Git
- ✅ Rotate keys if compromised
- ✅ Use separate keys for test and live modes
- ❌ Never expose secret keys in frontend code
- ❌ Never log secret keys

### 2. Payment Data

- ✅ Use Stripe.js for card collection (PCI compliant)
- ✅ Never store card numbers in your database
- ✅ Use Stripe's Payment Element for forms
- ❌ Never handle raw card data in your backend
- ❌ Never log card details

### 3. Webhook Security

- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints only
- ✅ Implement idempotency for webhook handlers
- ✅ Log webhook events for audit

---

## Monitoring and Reporting

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Go to Stripe Dashboard → Home
   - Review "Payments" chart
   - Investigate spikes in failures

2. **Revenue**
   - Go to Stripe Dashboard → Reports
   - Review gross volume, fees, net revenue
   - Export for accounting

3. **Failed Payments**
   - Go to Stripe Dashboard → Payments
   - Filter by "Failed"
   - Contact customers to update payment methods

4. **Refunds**
   - Track refund rate
   - Review refund reasons
   - Adjust policies if needed

### Reports

**Monthly Tasks:**
- [ ] Export payment data for accounting
- [ ] Review failed payments
- [ ] Check refund rate
- [ ] Monitor for fraudulent activity

**Quarterly Tasks:**
- [ ] Review pricing strategy
- [ ] Analyze payment method preferences
- [ ] Review Stripe fees
- [ ] Update product catalog

---

## Checklist

### Initial Setup
- [ ] Create Stripe account
- [ ] Activate account (verification complete)
- [ ] Obtain API keys (test and live)
- [ ] Add API keys to Vercel
- [ ] Configure webhooks
- [ ] Add webhook secret to Vercel
- [ ] Create products/pricing
- [ ] Sign HIPAA BAA with Stripe
- [ ] Test payments in test mode
- [ ] Switch to live mode

### Before Go-Live
- [ ] Verify live API keys are set
- [ ] Test live payment flow
- [ ] Verify webhook is receiving events
- [ ] Configure email receipts
- [ ] Set up customer portal
- [ ] Document pricing structure
- [ ] Train staff on refund process

---

**Last Updated:** November 13, 2025
**Next Review:** Monthly
