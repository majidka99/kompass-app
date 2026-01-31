# 🏥 Kompass App - Local Development Guide

Complete setup guide for healthcare-compliant local development environment.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop running
- Node.js 18+ installed
- Supabase CLI installed (`brew install supabase/tap/supabase`)

### 1. Start Local Supabase

```bash
# Start all Supabase services (database, auth, storage, studio)
supabase start --ignore-health-check

# Check status
supabase status
```

### 2. Start Development Server

```bash
# Install dependencies (if not done)
npm install

# Start React development server
npm run dev
```

## 🔗 Local Services

| Service             | URL                                                     | Purpose                  |
| ------------------- | ------------------------------------------------------- | ------------------------ |
| **Your App**        | http://localhost:5173                                   | React development server |
| **Supabase Studio** | http://127.0.0.1:54323                                  | Database management UI   |
| **Supabase API**    | http://127.0.0.1:54321                                  | Backend API endpoints    |
| **Email Testing**   | http://127.0.0.1:54324                                  | Inbucket email viewer    |
| **Database Direct** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | PostgreSQL connection    |

## 🔐 Authentication Testing

### ✅ Complete Authentication Flow (WORKING)

1. **Start App**: http://localhost:5173 → Shows Landing Page
2. **Click "App starten"** → Redirects to Login Page (`/login`)
3. **Register New User**:
   - Click "Noch kein Konto? Hier registrieren"
   - Email: `test@example.com`
   - Password: `password123`
   - Click "Registrieren"
   - See success message: "Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse."
4. **Confirm Email**:
   - Open: http://127.0.0.1:54324 (Inbucket)
   - Find confirmation email for `test@example.com`
   - **Click confirmation link → Automatically redirects to http://localhost:5173/login**
5. **Login**: Now on login page, login with confirmed credentials
   - Email: `test@example.com`
   - Password: `password123`
   - Should successfully enter the main app
6. **Test Logout**: Click logout button in sidebar → Returns to Landing Page

### 🔧 Key Configuration Changes Made:

```toml
# supabase/config.toml
[auth]
site_url = "http://localhost:5173"  # Fixed from 127.0.0.1:3000
additional_redirect_urls = ["http://localhost:5173", "http://localhost:5173/login", "http://127.0.0.1:5173"]

[auth.email]
enable_confirmations = true  # Enabled email confirmations
```

### Manage Users in Studio

- Open: http://127.0.0.1:54323
- Go to **Authentication > Users**
- Create/delete/modify test users

## 🏥 Healthcare Database Features

### View Healthcare Tables

**Studio > Table Editor**:

- `user_profiles` - Encrypted user preferences
- `user_symptoms` - Encrypted symptom tracking
- `user_goals` - Encrypted goals and achievements
- `user_consent` - GDPR consent management
- `audit_logs` - Healthcare compliance audit trail

### Test GDPR Functions

**Studio > SQL Editor**:

```sql
-- Test German age verification
SELECT verify_digital_consent_age('2010-01-01');

-- Test data encryption
SELECT encrypt_health_data('sensitive data', 'user_key');

-- Test compliance reporting
SELECT generate_compliance_report('2024-01-01');
```

## 🛠️ Development Commands

### Supabase Management

```bash
# Start all services
supabase start --ignore-health-check

# Stop all services
supabase stop

# Reset database (reapply migrations)
supabase db reset

# Check service status
supabase status

# View logs
supabase logs
```

### Docker Management

```bash
# View running containers
claude ps --filter "name=supabase"

# View container logs
docker logs supabase_db_kompass-app
docker logs supabase_auth_kompass-app

# Restart specific service
docker restart supabase_studio_kompass-app
```

### Application Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Run tests
npm run test

# Type checking
npm run type-check
```

## 🔍 Troubleshooting

### Supabase Studio Not Loading

```bash
supabase stop
supabase start --ignore-health-check
```

### Authentication Issues

1. Check `.env` file contains local URLs:

   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Clear browser cache/storage
3. Check email confirmations in Inbucket: http://127.0.0.1:54324

### Login/Logout Issues

- **Logout not working**: Clear browser cache, check console for errors
- **Stuck on landing page**: Ensure you're logged out, try incognito mode
- **Can't access login**: Navigate directly to http://localhost:5173/login

### Database Connection Issues

```bash
# Test direct database connection
docker exec -it supabase_db_kompass-app psql -U postgres -d postgres

# Check if migrations applied
\dt
```

### Container Issues

```bash
# Check Docker daemon
docker info

# View all Supabase containers
docker ps -a --filter "name=supabase"

# Remove and restart clean
supabase stop
docker system prune -f
supabase start --ignore-health-check
```

## 📋 Environment Configuration

### Local Environment (.env)

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Supabase Local Keys

- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

## 🏥 Healthcare Compliance Features

### Encryption

- **Server-side**: pgcrypto extension enabled
- **Client-to-server**: TLS 1.3 (automatic)
- **At-rest**: AES-256 (Supabase native)

### GDPR Compliance

- **Article 15**: Right to Access (`gdpr_export_user_data`)
- **Article 17**: Right to Erasure (`gdpr_erase_user_data`)
- **Article 20**: Data Portability (`gdpr_export_portable_data`)

### German Compliance

- **Age Verification**: 16+ for digital consent
- **Parental Consent**: Required for <16 years
- **BDSG Compliance**: German data protection standards

### Audit Logging

- All healthcare data access logged
- Compliance reporting available
- Row Level Security enforced

## 🎯 Ready for Development!

Your local environment includes:

- ✅ Healthcare-grade encryption
- ✅ GDPR compliance functions
- ✅ German age verification
- ✅ Audit logging infrastructure
- ✅ Row Level Security
- ✅ Complete authentication flow

Start developing with confidence! 🚀
