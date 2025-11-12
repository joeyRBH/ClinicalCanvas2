# HealthCanvas - Vercel Deployment Guide

## 🚀 Quick Deploy

### Step 1: Import to Vercel

1. Visit **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select **joeyRBH/HealthCanvas**
4. Click **"Import"**

### Step 2: Configure Project

**Framework Preset:** Other (leave as detected)
**Root Directory:** `./` (keep default)
**Build Command:** Leave empty
**Output Directory:** `public`

### Step 3: Environment Variables

Click **"Environment Variables"** and add the following:

#### Database
```
DATABASE_URL = postgresql://username:password@hostname:5432/database
```

#### Stripe
```
STRIPE_SECRET_KEY = sk_live_... (or sk_test_...)
STRIPE_PUBLISHABLE_KEY = pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET = whsec_...
STRIPE_PRICE_ID = price_...
```

#### AWS
```
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
SES_SENDER_EMAIL = noreply@yourdomain.com
SNS_PHONE_NUMBER = +12345678900
```

#### Application
```
APP_URL = https://your-domain.vercel.app
JWT_SECRET = your_secure_jwt_secret_minimum_32_characters
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Visit your deployment URL

---

## 🔧 Post-Deployment Setup

### 1. Update Stripe Webhook

1. Go to **https://dashboard.stripe.com/webhooks**
2. Click **"Add endpoint"**
3. Enter URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** and update `STRIPE_WEBHOOK_SECRET` in Vercel

### 2. Initialize Database

Run these API endpoints to set up your database:

```bash
# 1. Create tables
curl -X POST https://your-domain.vercel.app/api/setup-database

# 2. Verify tables
curl https://your-domain.vercel.app/api/check-tables

# 3. Create admin account
curl -X POST https://your-domain.vercel.app/api/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "full_name": "Admin User"
  }'
```

### 3. Test the Application

1. Visit `https://your-domain.vercel.app`
2. Log in with your admin credentials
3. Verify dashboard loads
4. Test creating a client
5. Test creating an appointment

---

## 🔐 Security Checklist

Before going live with real patient data:

- [ ] All environment variables configured
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Stripe webhook verified
- [ ] Database backups configured
- [ ] AWS SES email verified
- [ ] Admin account created
- [ ] Test all critical features
- [ ] Review HIPAA compliance requirements
- [ ] Set up monitoring/alerts

---

## 📊 Vercel Settings

### Recommended Settings

**General:**
- Node.js Version: 18.x
- Regions: Auto (or select closest to users)

**Git:**
- Production Branch: `main`
- Automatic Deployments: Enabled

**Environment Variables:**
- Add to: Production, Preview, Development
- Sensitive variables: Mark as sensitive

---

## 🔄 Continuous Deployment

Every push to `main` branch will:
1. Trigger automatic deployment
2. Run build process
3. Deploy to production
4. Maintain previous deployment as rollback

To deploy:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 🐛 Troubleshooting

### Database Connection Errors

**Error:** "Failed to connect to database"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database allows connections from Vercel IPs
3. Test connection: `curl https://your-domain.vercel.app/api/health`

### Stripe Webhook Errors

**Error:** "Invalid signature"

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Ensure webhook URL is correct
3. Check webhook is configured for correct events

### API 500 Errors

**Solution:**
1. Check Vercel logs: `vercel logs`
2. Verify all environment variables are set
3. Check function timeout (max 10s on free tier)

---

## 📈 Monitoring

### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs your-domain.vercel.app
```

### Performance Metrics

Check in Vercel Dashboard:
- Function execution time
- API response times
- Error rates
- Bandwidth usage

---

## 💰 Pricing Considerations

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution: 100GB-hours
- 10 second function timeout
- Hobby projects

### Pro Tier ($20/month):
- 1TB bandwidth/month
- Unlimited function execution
- 60 second function timeout
- Commercial use
- Analytics

**Recommendation:** Start with free tier, upgrade as needed

---

## 🔗 Custom Domain

### Add Custom Domain

1. Go to Vercel Dashboard > Settings > Domains
2. Click "Add"
3. Enter your domain: `app.yourdomain.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic)

### Update Environment Variables

After adding domain:
```
APP_URL = https://app.yourdomain.com
```

Update Stripe webhook URL to new domain.

---

## 📱 Vercel CLI Commands

```bash
# Link project
vercel link

# Deploy to production
vercel --prod

# View environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View deployments
vercel ls

# Alias deployment
vercel alias set deployment-url.vercel.app custom-domain.com
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository pushed
- [ ] Vercel project created
- [ ] All environment variables added
- [ ] Database initialized
- [ ] Admin account created
- [ ] Stripe webhook configured
- [ ] Test login works
- [ ] Test API endpoints work
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

---

## 🎉 You're Live!

Once deployed, your HealthCanvas EHR system is ready for use at:
**https://your-domain.vercel.app**

---

**Need help?** Check Vercel docs: https://vercel.com/docs
