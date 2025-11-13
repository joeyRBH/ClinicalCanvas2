# Database Backup and Recovery Guide

## Overview

This guide covers database backup and disaster recovery procedures for HealthCanvas. Your database contains critical patient data and must be protected against data loss.

---

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Vercel Postgres / Neon Database Backups](#vercel-postgres--neon-database-backups)
3. [Manual Backup Procedures](#manual-backup-procedures)
4. [Restoration Procedures](#restoration-procedures)
5. [Testing Backups](#testing-backups)
6. [Retention Policy](#retention-policy)
7. [Disaster Recovery Plan](#disaster-recovery-plan)

---

## Backup Strategy

### 3-2-1 Backup Rule

Follow the industry-standard 3-2-1 rule:
- **3** copies of your data
- **2** different storage types
- **1** copy off-site

**Implementation:**
1. **Primary Database:** Production database (Vercel/Neon)
2. **Automated Backups:** Provider's backup system (Vercel/Neon)
3. **Manual Exports:** Periodic SQL dumps stored in Backblaze B2

### Backup Frequency

| Type | Frequency | Retention |
|------|-----------|-----------|
| Automated (Point-in-time) | Continuous | 30 days |
| Automated (Full backup) | Daily | 30 days |
| Manual Export | Weekly | 90 days |
| Compliance Archive | Quarterly | 7 years |

---

## Vercel Postgres / Neon Database Backups

### Automated Backups

Your database provider automatically backs up your data:

#### Vercel Postgres
1. Go to Vercel Dashboard → Storage → Your Database
2. Click "Backups" tab
3. View available backups:
   - Point-in-time recovery (last 30 days)
   - Daily snapshots (last 30 days)

#### Neon Database
1. Go to Neon Console → Your Project
2. Click "Backups" section
3. Features:
   - Continuous backup
   - Point-in-time restore
   - 30-day retention (free tier)
   - Extended retention (paid plans)

### Point-in-Time Recovery (PITR)

Restore database to any point in the last 30 days:

**Vercel Postgres:**
```bash
# Via Vercel CLI
vercel env pull
vercel postgres restore --to <timestamp>
```

**Neon:**
1. In Neon Console, go to project
2. Click "Restore" or "Branch"
3. Select timestamp
4. Create new branch or restore

### Monitoring Automated Backups

**Monthly Checklist:**
- [ ] Verify automated backups are running
- [ ] Check backup retention period
- [ ] Review storage usage
- [ ] Test restore process (see below)

---

## Manual Backup Procedures

### Weekly SQL Export

Perform manual exports for additional safety:

#### Step 1: Connect to Database

Get your database connection string:
```bash
# From Vercel
vercel env pull
# Check .env.local for DATABASE_URL
```

Or from Vercel Dashboard:
1. Go to Storage → Your Database
2. Copy connection string

#### Step 2: Create SQL Dump

**Using pg_dump (PostgreSQL):**

```bash
# Install PostgreSQL client if needed
# macOS:
brew install postgresql

# Linux:
sudo apt-get install postgresql-client

# Perform backup
pg_dump "postgres://user:pass@host/dbname?sslmode=require" \
  --no-owner \
  --no-privileges \
  --file=healthcanvas-backup-$(date +%Y%m%d).sql

# Or with compression:
pg_dump "postgres://user:pass@host/dbname?sslmode=require" \
  --no-owner \
  --no-privileges \
  | gzip > healthcanvas-backup-$(date +%Y%m%d).sql.gz
```

**Using psql (alternative):**

```bash
psql "postgres://user:pass@host/dbname?sslmode=require" \
  -c "\copy (SELECT * FROM patients) TO 'patients.csv' CSV HEADER"
```

#### Step 3: Encrypt Backup (Recommended)

```bash
# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 \
  healthcanvas-backup-20251113.sql.gz

# Creates: healthcanvas-backup-20251113.sql.gz.gpg
```

#### Step 4: Upload to Secure Storage

**Option 1: Backblaze B2**

```bash
# Install B2 CLI
pip install b2

# Authenticate
b2 authorize-account <keyID> <applicationKey>

# Upload
b2 upload-file healthcanvas-backups \
  healthcanvas-backup-20251113.sql.gz.gpg \
  backups/database/2025/11/healthcanvas-backup-20251113.sql.gz.gpg
```

**Option 2: Manual Upload**
1. Go to Backblaze web interface
2. Navigate to backups bucket
3. Upload encrypted file
4. Verify upload completed

#### Step 5: Verify Backup

```bash
# Verify file integrity
md5sum healthcanvas-backup-20251113.sql.gz.gpg

# Test decryption
gpg --decrypt healthcanvas-backup-20251113.sql.gz.gpg | zcat | head -20
```

#### Step 6: Document Backup

Keep log of backups:

```
Backup Log:
Date: 2025-11-13
Time: 02:00 UTC
File: healthcanvas-backup-20251113.sql.gz.gpg
Size: 15.3 MB
MD5: a1b2c3d4e5f6...
Location: B2://healthcanvas-backups/backups/database/2025/11/
Performed by: [Your name]
Verified: Yes
```

---

## Restoration Procedures

### Restore from Automated Backup

#### Vercel Postgres

**Using Dashboard:**
1. Go to Vercel Dashboard → Storage → Database
2. Click "Backups"
3. Select backup or timestamp
4. Click "Restore"
5. Confirm (WARNING: This will overwrite current data)

**Using CLI:**
```bash
vercel postgres restore --from <backup-id>
# or
vercel postgres restore --to <timestamp>
```

#### Neon Database

1. Go to Neon Console → Project
2. Click "Restore"
3. Select restore point
4. Choose:
   - **Restore to new branch** (safer, test first)
   - **Restore to current branch** (overwrites)
5. Confirm

### Restore from Manual SQL Dump

#### Step 1: Prepare

```bash
# Download backup from B2
b2 download-file-by-name healthcanvas-backups \
  backups/database/2025/11/healthcanvas-backup-20251113.sql.gz.gpg \
  restore-backup.sql.gz.gpg

# Decrypt
gpg --decrypt restore-backup.sql.gz.gpg > restore-backup.sql.gz

# Decompress
gunzip restore-backup.sql.gz
# Creates: restore-backup.sql
```

#### Step 2: Create Test Database (Recommended)

**In Vercel:**
1. Create new Postgres database for testing
2. Get connection string

**In Neon:**
1. Create new branch for testing
2. Get connection string

#### Step 3: Restore to Test Database

```bash
psql "postgres://user:pass@test-host/dbname?sslmode=require" \
  < restore-backup.sql
```

#### Step 4: Verify Restoration

```bash
# Connect to test database
psql "postgres://user:pass@test-host/dbname?sslmode=require"

# Check tables
\dt

# Count records
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM clinical_notes;

# Sample data
SELECT * FROM patients LIMIT 5;
```

#### Step 5: Apply to Production (If Verified)

⚠️ **WARNING:** This will overwrite production data!

```bash
# Backup current production first!
pg_dump "postgres://prod-connection-string" \
  > pre-restore-backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
psql "postgres://prod-connection-string" \
  < restore-backup.sql
```

---

## Testing Backups

### Monthly Restore Test

**Required by HIPAA:** Test your backup restoration quarterly minimum.

#### Test Procedure

1. **Select Random Backup:**
   - Choose a backup from last week
   - Could be automated or manual

2. **Restore to Test Environment:**
   - Create temporary database
   - Restore backup
   - Document time to restore

3. **Verify Data Integrity:**
   ```sql
   -- Check row counts match expected
   SELECT COUNT(*) FROM patients;

   -- Verify recent data is present
   SELECT * FROM appointments
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC LIMIT 10;

   -- Check relationships
   SELECT p.id, p.full_name, COUNT(a.id) as appointment_count
   FROM patients p
   LEFT JOIN appointments a ON p.id = a.patient_id
   GROUP BY p.id LIMIT 10;
   ```

4. **Test Application Functionality:**
   - Point test instance to restored database
   - Login and navigate
   - View patient records
   - Access clinical notes
   - Generate reports

5. **Document Results:**
   ```
   Backup Test Report:
   Date: 2025-11-13
   Backup Used: healthcanvas-backup-20251106.sql.gz
   Restore Duration: 3 minutes 42 seconds
   Data Verification: PASSED
   Application Test: PASSED
   Issues Found: None
   Tested By: [Your name]
   ```

6. **Clean Up:**
   - Delete test database
   - Document completion

---

## Retention Policy

### Backup Retention Schedule

| Backup Type | Retention Period | Reason |
|-------------|------------------|--------|
| Automated Daily | 30 days | Provider default |
| Weekly Manual | 90 days | Additional safety |
| Monthly Archive | 1 year | Compliance |
| Yearly Archive | 7 years | HIPAA requirement |

### Implementation

**Automated (Provider):**
- Handled automatically
- Check settings in provider dashboard

**Manual Exports:**
- Create lifecycle rule in B2 bucket
- Or manual deletion of old backups

**B2 Lifecycle Rule Example:**
```json
{
  "fileNamePrefix": "backups/database/weekly/",
  "daysFromUploadingToHiding": 90,
  "daysFromHidingToDeleting": 7
}
```

### HIPAA Requirements

- Medical records: 7 years minimum
- Some states require longer (check local laws)
- Minors: Until age 21 + 7 years

---

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target:** 4 hours

Maximum acceptable downtime before system must be restored.

### Recovery Point Objective (RPO)

**Target:** 24 hours

Maximum acceptable data loss (how old can restored data be).

### Disaster Scenarios

#### Scenario 1: Database Corruption

**Detection:**
- Application errors
- Data inconsistencies
- Provider alerts

**Recovery:**
1. Identify time of corruption
2. Restore from automated backup to point before corruption
3. Estimated time: 30 minutes

#### Scenario 2: Accidental Deletion

**Detection:**
- User reports missing data
- Audit logs show deletion

**Recovery:**
1. Identify what was deleted and when
2. If within 30 days: Point-in-time restore to new branch
3. Export deleted data
4. Import to production
5. Estimated time: 1-2 hours

#### Scenario 3: Complete Database Loss

**Detection:**
- Database unreachable
- Provider outage
- Catastrophic failure

**Recovery:**
1. Create new database instance
2. Restore from most recent manual backup
3. Apply any transaction logs if available
4. Verify data integrity
5. Update application connection string
6. Estimated time: 2-4 hours

#### Scenario 4: Provider Outage

**Detection:**
- Database connection failures
- Provider status page shows outage

**Response:**
1. Check provider status page
2. If prolonged:
   - Set up temporary database
   - Restore from backup
   - Point application to temporary database
3. When provider recovers:
   - Sync any new data
   - Switch back to primary

### Emergency Contacts

**Database Provider Support:**
- Vercel: https://vercel.com/support
- Neon: https://neon.tech/docs/introduction/support

**Internal Contacts:**
- Database Admin: [Name, Phone, Email]
- On-Call Engineer: [Name, Phone, Email]
- Practice Manager: [Name, Phone, Email]

---

## Automation

### Automated Weekly Backup Script

Create script to automate weekly backups:

**`backup-database.sh`:**
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/secure/backups"
DATE=$(date +%Y%m%d)
BACKUP_FILE="healthcanvas-backup-${DATE}.sql.gz"
GPG_PASSPHRASE="your-secure-passphrase"  # Use environment variable!
B2_BUCKET="healthcanvas-backups"

# Create backup
echo "Creating backup..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Encrypt
echo "Encrypting backup..."
gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
  --symmetric --cipher-algo AES256 \
  "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to B2
echo "Uploading to Backblaze B2..."
b2 upload-file "$B2_BUCKET" \
  "${BACKUP_DIR}/${BACKUP_FILE}.gpg" \
  "backups/database/$(date +%Y/%m)/${BACKUP_FILE}.gpg"

# Verify
echo "Verifying upload..."
b2 get-file-info "backups/database/$(date +%Y/%m)/${BACKUP_FILE}.gpg"

# Clean up local files older than 7 days
find "$BACKUP_DIR" -name "healthcanvas-backup-*.sql.gz*" -mtime +7 -delete

echo "Backup complete: ${BACKUP_FILE}.gpg"
```

**Schedule with cron:**
```bash
# Edit crontab
crontab -e

# Add weekly backup (Sundays at 2 AM)
0 2 * * 0 /path/to/backup-database.sh >> /var/log/healthcanvas-backup.log 2>&1
```

---

## Checklist

### Setup Checklist
- [ ] Verify automated backups are enabled
- [ ] Create secure backup storage (B2 bucket)
- [ ] Install database client tools (pg_dump)
- [ ] Create backup script
- [ ] Test manual backup procedure
- [ ] Set up encryption (GPG keys)
- [ ] Document backup procedures
- [ ] Schedule automated backups
- [ ] Test restoration procedure

### Monthly Tasks
- [ ] Verify automated backups completed
- [ ] Perform manual backup
- [ ] Check backup storage usage
- [ ] Review backup logs
- [ ] Verify backup encryption

### Quarterly Tasks
- [ ] **Test full restoration** (required)
- [ ] Review retention policy
- [ ] Audit backup security
- [ ] Update documentation
- [ ] Review disaster recovery plan
- [ ] Test emergency procedures

### Annual Tasks
- [ ] Create yearly archive
- [ ] Rotate encryption keys
- [ ] Review and update RPO/RTO
- [ ] Disaster recovery drill
- [ ] Update emergency contacts

---

**Last Updated:** November 13, 2025
**Next Review:** Quarterly
**Next Test Date:** February 13, 2026
