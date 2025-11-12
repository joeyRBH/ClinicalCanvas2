# HealthCanvas

> **Healthcare Practice Management EHR System**
> Combining HealthHub's modern UI with ClinicalCanvas's production-ready backend

---

## 🎯 Overview

HealthCanvas is a comprehensive Electronic Health Record (EHR) and practice management system designed for healthcare providers. It merges the superior user interface and experience of HealthHub with the robust, production-ready backend infrastructure of ClinicalCanvas.

### Key Features

- ✅ **Dashboard Analytics** - Real-time practice metrics and insights
- ✅ **Appointment Management** - Scheduling with telehealth support
- ✅ **Client Management** - Comprehensive patient records
- ✅ **Clinical Notes** - AI-powered note generation with HIPAA audit logging
- ✅ **Telehealth** - Integrated video consultations via WebRTC
- ✅ **Secure Messaging** - HIPAA-compliant patient-provider communication
- ✅ **Document Management** - Secure file storage and sharing
- ✅ **Billing & Payments** - Stripe integration for invoicing and subscriptions
- ✅ **Reports & Analytics** - Practice performance insights

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS with Custom Properties
- Font Awesome icons
- Google Fonts (Inter, Plus Jakarta Sans)

**Backend:**
- Node.js serverless functions (Vercel)
- PostgreSQL database
- JWT authentication with bcrypt

**Integrations:**
- **Payments:** Stripe (v14.0.0)
- **Notifications:** AWS SES (email) + SNS (SMS)
- **Telehealth:** WebRTC with WebSocket signaling
- **AI:** Clinical note generation

**Deployment:**
- Vercel (static frontend + serverless API)
- PostgreSQL (Crunchy Bridge)

---

## 📁 Project Structure

```
HealthCanvas/
├── api/                          # Serverless API endpoints
│   ├── appointments.js           # Appointment CRUD
│   ├── clients.js                # Client management
│   ├── clinical-notes.js         # Clinical notes with audit logs
│   ├── clinical-notes-sign.js    # Note signing system
│   ├── ai-generate-note.js       # AI note generation
│   ├── webrtc-signaling.js       # Telehealth video
│   ├── stripe-webhook.js         # Payment processing
│   ├── invoices.js               # Billing
│   ├── client-messages.js        # Secure messaging
│   ├── upload-document.js        # Document management
│   └── ... (40+ endpoints total)
│
├── api/utils/                    # Shared utilities
│   ├── database-connection.js    # PostgreSQL connection pool
│   ├── notifications.js          # AWS SES/SNS helpers
│   └── backblaze.js              # File storage
│
├── public/                       # Frontend static files
│   ├── index.html                # Main application
│   ├── styles.css                # Unified design system
│   └── app.js                    # Application logic
│
├── package.json                  # Dependencies
├── vercel.json                   # Deployment config
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Vercel account (for deployment)
- Stripe account (for payments)
- AWS account (for notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joeyRBH/HealthCanvas.git
   cd HealthCanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID=price_...

   # AWS
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   SES_SENDER_EMAIL=noreply@yourdomain.com
   SNS_PHONE_NUMBER=+1234567890

   # Application
   APP_URL=http://localhost:3000
   JWT_SECRET=your-secure-jwt-secret-here
   ```

4. **Initialize database**
   ```bash
   # Run database setup (creates tables)
   curl -X POST http://localhost:3000/api/setup-database
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- Primary: `#2C5F8D` (Professional Blue)
- Secondary: `#5EAE91` (Healthcare Green)
- Accent: `#E8A547` (Warm Orange)

**Functional Colors:**
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Info: `#3B82F6`

### Typography

- **Headings:** Plus Jakarta Sans (700 weight)
- **Body:** Inter (400-600 weights)
- **Signatures:** Kalam (for handwritten feel)

### Layout

- **Sidebar Navigation** - Intuitive left-side menu
- **Card-based Design** - Modern, clean component layout
- **Responsive Breakpoints** - Mobile-first design
  - Mobile: < 576px
  - Tablet: 576px - 768px
  - Desktop: > 768px

---

## 📊 API Endpoints

### Authentication
- `POST /api/create-account` - Create new account
- `POST /api/client-auth` - Client login

### Appointments
- `GET /api/appointments` - List appointments
- `GET /api/appointments?id=123` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments` - Update appointment
- `DELETE /api/appointments?id=123` - Delete appointment

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients?id=123` - Get single client
- `POST /api/clients` - Create client
- `PUT /api/clients` - Update client
- `DELETE /api/clients?id=123` - Delete client

### Clinical Notes
- `GET /api/clinical-notes` - List notes
- `POST /api/clinical-notes` - Create note
- `PUT /api/clinical-notes` - Update note
- `POST /api/clinical-notes-sign` - Sign note
- `GET /api/clinical-notes-audit` - Get audit log
- `POST /api/ai-generate-note` - Generate AI note

### Billing
- `POST /api/create-subscription` - Create Stripe subscription
- `POST /api/manage-subscription` - Manage subscription
- `POST /api/create-payment-intent` - One-time payment
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payment-methods` - List payment methods
- `POST /api/refunds` - Process refund

### Documents
- `POST /api/upload-document` - Upload file
- `GET /api/list-documents` - List documents
- `GET /api/download-document?id=123` - Download file
- `DELETE /api/delete-document?id=123` - Delete file

### Messaging
- `GET /api/client-messages` - Get messages
- `POST /api/client-messages` - Send message

### Telehealth
- `POST /api/webrtc-signaling` - WebRTC signaling server

### Notifications
- `POST /api/send-email` - Send email via AWS SES
- `POST /api/send-sms` - Send SMS via AWS SNS

### Webhooks
- `POST /api/stripe-webhook` - Stripe event handler

---

## 🔐 Security & HIPAA Compliance

### Security Features

- ✅ JWT authentication with bcrypt password hashing
- ✅ HTTPS encryption (enforced in production)
- ✅ CORS configuration
- ✅ XSS protection headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation and sanitization

### HIPAA Compliance

- ✅ **Audit Logging** - All clinical note access tracked
- ✅ **Encryption** - Data encrypted at rest and in transit
- ✅ **Access Controls** - Role-based authentication
- ✅ **Data Integrity** - Note signing and locking
- ✅ **Secure Messaging** - HIPAA-compliant communication

**Important:** This system is designed with HIPAA principles in mind, but full compliance requires:
- Business Associate Agreements (BAAs)
- Regular security audits
- Staff training
- Incident response procedures
- Physical security measures

---

## 🚀 Deployment

### Deploy to Vercel

1. **Connect repository to Vercel**
   ```bash
   vercel login
   vercel link
   ```

2. **Set environment variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add STRIPE_SECRET_KEY
   # ... add all required env vars
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Update Stripe webhook**
   - Go to Stripe Dashboard > Webhooks
   - Update endpoint URL to: `https://your-domain.vercel.app/api/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `customer.subscription.created`, etc.

---

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Repository setup
- [x] API endpoints migration
- [x] Frontend UI foundation
- [x] Authentication system

### Phase 2: Core Features (In Progress)
- [ ] Complete dashboard implementation
- [ ] Full appointment management
- [ ] Client management with search
- [ ] Clinical notes interface
- [ ] Document upload/management

### Phase 3: Advanced Features
- [ ] Telehealth video integration
- [ ] AI note generation UI
- [ ] Billing dashboard
- [ ] Reports and analytics
- [ ] Mobile app (React Native)

### Phase 4: Enterprise Features
- [ ] Multi-provider support
- [ ] Practice management
- [ ] Insurance verification
- [ ] E-prescribing integration
- [ ] Lab results integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **HealthHub** - Modern UI/UX design inspiration
- **ClinicalCanvas** - Production-ready backend infrastructure
- Built with healthcare professionals in mind
- Designed following WCAG accessibility guidelines

---

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Email: support@healthcanvas.app

---

## ⚠️ Disclaimer

This software is provided for practice management purposes only. It is not intended for:
- Medical diagnosis or treatment
- Emergency medical situations
- Life-critical healthcare decisions

Always consult with qualified healthcare professionals for medical advice.

For production use with real patient data, ensure:
- Full HIPAA compliance review
- Security audit completion
- Business Associate Agreements in place
- Staff training completed
- Incident response plan established

---

**Built with ❤️ for healthcare professionals**

Version 1.0.0 | Last Updated: November 2025
