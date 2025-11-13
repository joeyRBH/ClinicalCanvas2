# Backblaze B2 Cloud Storage Setup Guide

## Overview

HealthCanvas uses Backblaze B2 for secure document storage:
- Patient documents and files
- Clinical attachments
- Scanned records
- Images and lab results
- Consent forms and signed documents

Backblaze B2 is HIPAA-compliant, cost-effective, and S3-compatible.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backblaze Account Setup](#backblaze-account-setup)
3. [Bucket Configuration](#bucket-configuration)
4. [API Keys and Credentials](#api-keys-and-credentials)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [ ] Credit card for Backblaze billing
- [ ] Access to Vercel dashboard
- [ ] HealthCanvas deployed

---

## Backblaze Account Setup

### Step 1: Create Backblaze Account

1. Go to https://www.backblaze.com/b2/sign-up.html
2. Click "Sign Up"
3. Enter information:
   - Email address
   - Password
   - Business name: [Your Practice Name]
4. Click "Create Account"
5. Verify email address (check inbox)
6. Add payment method

### Step 2: Enable B2 Cloud Storage

1. Log in to Backblaze
2. In left sidebar, click "B2 Cloud Storage"
3. Review pricing:
   - Storage: $0.005/GB/month ($5 per TB/month)
   - Download: First 1GB/day free, then $0.01/GB
   - Uploads: FREE
4. Click "Get Started" or "Enable B2"

### Step 3: Review HIPAA Compliance

1. Go to: https://www.backblaze.com/b2/solutions/hipaa-compliant-cloud-storage.html
2. Review HIPAA features:
   - ✅ Encryption at rest (AES-256)
   - ✅ Encryption in transit (TLS)
   - ✅ Access logging
   - ✅ BAA available
3. Continue with setup

---

## Bucket Configuration

### Step 1: Create a Bucket

1. In B2 Cloud Storage dashboard, click "Buckets"
2. Click "Create a Bucket"
3. Configure bucket:

**Bucket Unique Name:** `healthcanvas-documents-[random]`
- Must be globally unique
- Use lowercase letters, numbers, hyphens
- Example: `healthcanvas-documents-prod-8f3a`

**Files in Bucket are:**
- Select: **Private** (recommended for PHI)
- Private = requires authentication to access

**Default Encryption:**
- Select: **Enable** (required for HIPAA)
- Encryption type: SSE-B2 (Server-Side Encryption)

**Object Lock:**
- Optional: Enable for immutable storage (prevents deletion)
- Recommended for audit compliance

**Lifecycle Settings:**
- Optional: Configure automatic deletion of old files
- Not recommended initially

4. Click "Create a Bucket"

### Step 2: Configure Bucket Settings

After creation:

1. Click on your bucket name
2. Review settings:

**CORS Rules (if needed for direct uploads):**
```json
[
  {
    "corsRuleName": "allowHealthCanvas",
    "allowedOrigins": [
      "https://your-domain.vercel.app"
    ],
    "allowedOperations": [
      "b2_download_file_by_id",
      "b2_download_file_by_name"
    ],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

**Lifecycle Rules (Optional):**
- Keep all files: No rules needed
- Auto-delete after X days: Create rule if needed

---

## API Keys and Credentials

### Step 1: Create Application Key

For security, create a restricted application key (not master):

1. In Backblaze dashboard, go to "App Keys"
2. Click "Add a New Application Key"
3. Configure:

**Name of Key:** `healthcanvas-production`

**Allow access to Bucket(s):**
- Select: **One bucket only**
- Choose your bucket: `healthcanvas-documents-prod-8f3a`

**Type of Access:**
- ✅ Read and Write (most common)
- OR ✅ Read only / ✅ Write only (if needed)

**Allow List All Bucket Names:**
- Not required (since we specified bucket)

**File name prefix:**
- Leave blank (allows all files)
- OR specify prefix like `patient-documents/`

**Duration:**
- Leave blank (no expiration)
- OR set expiration for rotation

4. Click "Create New Key"

### Step 2: Save Credentials

⚠️ **CRITICAL:** This is the only time you'll see the Application Key!

Copy and save securely:

```
keyID: [Your Key ID - similar to AWS access key]
applicationKey: [Your Application Key - similar to AWS secret key]
```

**Also note:**
```
Bucket Name: healthcanvas-documents-prod-8f3a
Bucket ID: [shown in bucket details]
Endpoint: s3.us-west-004.backblazeb2.com
```

---

## Environment Variables

Add these to Vercel environment variables:

### Required Variables

```
BACKBLAZE_KEY_ID = [Your Key ID]
BACKBLAZE_APPLICATION_KEY = [Your Application Key]
BACKBLAZE_BUCKET_NAME = healthcanvas-documents-prod-8f3a
BACKBLAZE_BUCKET_ID = [Your Bucket ID]
```

### Optional Variables

```
BACKBLAZE_REGION = us-west-004
BACKBLAZE_ENDPOINT = s3.us-west-004.backblazeb2.com
```

### Configuration in Vercel

1. Go to Vercel Project → Settings → Environment Variables
2. Add each variable
3. Select environment: Production
4. Click "Save"
5. **Redeploy** your application

---

## Testing

### Test File Upload

Use the API endpoint to test uploading:

```bash
curl -X POST https://your-app.vercel.app/api/upload-document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "patient_id=12345" \
  -F "document_type=lab_result"
```

Expected response:
```json
{
  "success": true,
  "file_id": "4_z...",
  "file_name": "test-document.pdf",
  "file_url": "https://..."
}
```

### Test File Download

```bash
curl -X GET "https://your-app.vercel.app/api/download-document?file_id=4_z..." \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded-file.pdf
```

### Test File List

```bash
curl -X GET "https://your-app.vercel.app/api/list-documents?patient_id=12345" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test File Delete

```bash
curl -X DELETE "https://your-app.vercel.app/api/delete-document?file_id=4_z..." \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testing Checklist

- [ ] Upload a test PDF
- [ ] Verify file appears in Backblaze dashboard
- [ ] Download the file
- [ ] Verify downloaded file is correct
- [ ] List files for a patient
- [ ] Delete a test file
- [ ] Verify file is deleted from Backblaze
- [ ] Test with different file types (images, docs, etc.)
- [ ] Test error handling (oversized file, wrong format)

---

## HIPAA Compliance

### Business Associate Agreement (BAA)

Backblaze offers HIPAA compliance with a signed BAA.

#### Step 1: Request BAA

1. Contact Backblaze support: https://www.backblaze.com/company/contact.html
2. Or email: hipaa@backblaze.com
3. Request HIPAA BAA for B2 Cloud Storage
4. Provide:
   - Business name
   - Contact information
   - Account email
   - Use case: Healthcare document storage

#### Step 2: Review and Sign BAA

1. Backblaze will send BAA via email or DocuSign
2. Review carefully
3. Sign and return
4. Keep signed copy for your records
5. BAA must be in place BEFORE storing PHI

### HIPAA Configuration Checklist

- [ ] Bucket encryption enabled (SSE-B2)
- [ ] Bucket is Private (not public)
- [ ] Application key has minimal permissions
- [ ] BAA signed with Backblaze
- [ ] Access logging enabled
- [ ] Regular audits scheduled

### Encryption

**At Rest:**
- ✅ SSE-B2 (Server-Side Encryption) enabled on bucket
- AES-256 encryption
- Managed by Backblaze

**In Transit:**
- ✅ TLS 1.2+ for all API calls
- HTTPS enforced

**Client-Side (Optional):**
- Can encrypt files before upload for additional security
- Manage encryption keys yourself

### Access Control Best Practices

1. **Principle of Least Privilege:**
   - Each application key has minimal permissions
   - Use bucket-specific keys (not master key)
   - Limit to specific prefixes if possible

2. **File Naming:**
   - Don't include PHI in filenames
   - Use unique IDs instead:
     - ❌ `john-doe-lab-results.pdf`
     - ✅ `12345/documents/67890.pdf`

3. **Metadata:**
   - Avoid PHI in file metadata
   - Store PHI in your database, not B2

4. **Access Logging:**
   - Enable bucket logging
   - Review logs regularly
   - Log who accessed what and when

---

## Code Integration

### Upload Document

**File:** `/api/upload-document.js`

```javascript
// Example usage from frontend:
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('patient_id', '12345');
formData.append('document_type', 'lab_result');

const response = await fetch('/api/upload-document', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Download Document

**File:** `/api/download-document.js`

```javascript
// Example usage:
const response = await fetch(`/api/download-document?file_id=${fileId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
```

### List Documents

**File:** `/api/list-documents.js`

```javascript
// Example usage:
const response = await fetch(`/api/list-documents?patient_id=12345`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// Returns array of documents
```

### Delete Document

**File:** `/api/delete-document.js`

```javascript
// Example usage:
const response = await fetch(`/api/delete-document?file_id=${fileId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## File Organization

### Recommended Folder Structure

Organize files using prefixes (virtual folders):

```
bucket-name/
├── patients/
│   ├── 12345/
│   │   ├── documents/
│   │   │   ├── abc123.pdf
│   │   │   └── def456.pdf
│   │   ├── images/
│   │   │   └── xray789.jpg
│   │   └── forms/
│   │       └── consent012.pdf
│   └── 67890/
│       └── ...
├── templates/
│   ├── consent-forms/
│   └── letterhead/
└── archives/
    └── 2024/
```

### File Naming Convention

```
{patient_id}/{category}/{unique_id}.{ext}

Examples:
12345/documents/f3a8b2c1.pdf
12345/images/a1b2c3d4.jpg
12345/forms/9f8e7d6c.pdf
```

### Metadata in Database

Store file info in your database:

```sql
documents table:
- id
- patient_id
- file_id (B2 file ID)
- file_name (original name)
- file_path (B2 path)
- file_type (PDF, JPG, etc.)
- category (lab_result, consent_form, etc.)
- uploaded_by (user ID)
- uploaded_at (timestamp)
- file_size
- description
```

---

## Monitoring and Costs

### Cost Estimation

**Storage Costs:**
- $0.005/GB/month
- Example: 100GB = $0.50/month

**Download Costs:**
- First 1GB/day free (30GB/month)
- Then $0.01/GB
- Example: 50GB downloads/month = 50-30 = 20GB × $0.01 = $0.20

**Upload Costs:**
- FREE

**Total for typical practice:**
- 100GB storage + 50GB downloads/month = ~$0.70/month

Much cheaper than AWS S3 (~$2.30/month for same usage)

### Monitoring Usage

1. Go to Backblaze dashboard
2. Click "Reports"
3. Review:
   - Storage used
   - Bandwidth used
   - API calls
   - Costs

### Set Up Billing Alerts

1. Go to Account Settings
2. Set spending limit (optional)
3. Configure email alerts

### Regular Audits

**Monthly:**
- [ ] Review storage usage
- [ ] Check costs
- [ ] Review access logs
- [ ] Verify backups (see below)

**Quarterly:**
- [ ] Audit file organization
- [ ] Remove unused files (per retention policy)
- [ ] Review access keys and rotate if needed

---

## Backup and Retention

### Backblaze as Backup

B2 IS your cloud backup, but consider:

1. **Versioning:**
   - B2 keeps file versions automatically
   - Configure retention in lifecycle settings
   - Keep versions for X days

2. **Replication (Advanced):**
   - Use Backblaze Replication for critical data
   - Replicate to second bucket or region
   - Additional cost but better redundancy

3. **Local Backup:**
   - Optional: Keep copy of critical documents locally
   - Use encrypted external drive
   - Store securely in locked cabinet

### Retention Policies

Follow HIPAA and state requirements:

**Medical Records:**
- Adults: 7 years minimum
- Minors: Until age 21 (or longer per state law)

**Billing Records:**
- 7 years minimum

**Audit Logs:**
- 6 years minimum (HIPAA)

### Implementing Retention

**Option 1: Lifecycle Rules in B2**
- Set "daysFromHidingToDeleting" in bucket lifecycle
- Automatically delete after X days

**Option 2: Manual Review**
- Query database for old documents
- Mark for deletion
- Delete via API after review

---

## Troubleshooting

### Common Issues

#### 1. "Unauthorized" or "Invalid Application Key"

**Causes:**
- Wrong key ID or application key
- Key expired
- Key doesn't have permission for bucket

**Solutions:**
- Verify credentials in Vercel env variables
- Check key permissions in Backblaze dashboard
- Create new key if needed

#### 2. "Bucket not found"

**Cause:** Wrong bucket name or ID
**Solution:**
- Verify BACKBLAZE_BUCKET_NAME in env variables
- Check bucket name in Backblaze dashboard (case-sensitive)

#### 3. File Upload Fails

**Causes:**
- File too large
- Insufficient permissions
- Network timeout

**Solutions:**
- Check file size limit (10MB default, increase if needed)
- Verify app key has write permission
- Implement retry logic for large files
- Consider chunked uploads for very large files

#### 4. Slow Downloads

**Causes:**
- Large files
- Geographic distance from B2 datacenter
- Many concurrent requests

**Solutions:**
- Use CDN (Backblaze + Cloudflare)
- Cache frequently accessed files
- Optimize file sizes (compress images)

### Getting Help

**Backblaze Support:**
- Help: https://help.backblaze.com
- Email: support@backblaze.com
- Phone: 1-650-352-3738
- Community: https://www.backblaze.com/blog/

---

## Advanced Features

### CDN Integration (Cloudflare)

For faster downloads, use Cloudflare CDN:

1. Enable Cloudflare Bandwidth Alliance (free)
2. Go to bucket settings → "Bucket Info"
3. Copy "Friendly URL"
4. Set up Cloudflare as described in Backblaze docs
5. Downloads via Cloudflare are FREE (no egress fees)

### Presigned URLs

For temporary access without authentication:

```javascript
// Generate presigned URL (valid for X hours)
const presignedUrl = await generatePresignedUrl(fileId, 24); // 24 hours
```

Use for:
- Patient portal downloads
- Sharing with external providers (temporarily)
- Email attachments (link expires)

### Versioning

B2 automatically keeps file versions:

1. Upload file: `document.pdf` (version 1)
2. Upload again: `document.pdf` (version 2)
3. Version 1 is hidden but still accessible
4. Lifecycle rules can auto-delete old versions

---

## Security Best Practices

### 1. Application Keys

- ✅ Use bucket-specific keys (not master key)
- ✅ Rotate keys periodically (annually)
- ✅ Delete unused keys
- ✅ Store keys securely (never in code)
- ❌ Never commit keys to Git
- ❌ Never share keys

### 2. Bucket Configuration

- ✅ Private buckets for PHI
- ✅ Encryption enabled
- ✅ Access logging enabled
- ❌ Don't make buckets public
- ❌ Don't disable encryption

### 3. File Access

- ✅ Authenticate all requests
- ✅ Audit access regularly
- ✅ Use presigned URLs for temporary access
- ✅ Implement access controls in your app
- ❌ Don't expose file IDs publicly
- ❌ Don't allow unauthenticated access

---

## Checklist

### Initial Setup
- [ ] Create Backblaze account
- [ ] Enable B2 Cloud Storage
- [ ] Create bucket (private, encrypted)
- [ ] Create application key
- [ ] Save credentials securely
- [ ] Add environment variables to Vercel
- [ ] Request and sign HIPAA BAA
- [ ] Test file upload
- [ ] Test file download
- [ ] Test file deletion
- [ ] Configure CORS (if needed)

### Before Go-Live
- [ ] BAA signed with Backblaze
- [ ] Encryption enabled on bucket
- [ ] Bucket is private
- [ ] Access logging enabled
- [ ] Application key has minimal permissions
- [ ] Test all file operations
- [ ] Document file organization structure
- [ ] Set up billing alerts
- [ ] Plan retention policies
- [ ] Train staff on document management

### Ongoing Maintenance
- [ ] Monitor storage usage monthly
- [ ] Review access logs monthly
- [ ] Rotate application keys annually
- [ ] Audit file organization quarterly
- [ ] Implement retention policy
- [ ] Review and optimize costs

---

**Last Updated:** November 13, 2025
**Next Review:** Quarterly
