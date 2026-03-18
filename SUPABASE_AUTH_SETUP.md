# 🔐 Supabase Authentication Setup Guide

## Task 0E-01: Configure Supabase Auth

### Step 1: Enable Email/Password Authentication

1. **Go to Supabase Dashboard** → Your Project → Authentication → Settings
2. **Auth Providers section**:
   - ✅ Enable "Email" provider
   - ✅ Confirm signup: Enabled
   - ✅ Enable email confirmations: Enabled

### Step 2: Configure Email Templates

Navigate to **Authentication** → **Email Templates**

#### Invitation Email Template:
```
Subject: You've been invited to GenPlatform.ai

Body:
You've been invited to join GenPlatform.ai as a team member. 

Click the link below to set your password and get started:

{{ .ConfirmationURL }}

This invitation expires in 24 hours.

Best regards,
GenPlatform.ai Team
```

#### Signup Confirmation Template:
```
Subject: Confirm your GenPlatform.ai account

Body:
Please confirm your account by clicking the link below:

{{ .ConfirmationURL }}

If you didn't create an account, you can safely ignore this email.

Best regards,
GenPlatform.ai Team
```

#### Password Reset Template:
```
Subject: Reset your GenPlatform.ai password

Body:
Someone requested a password reset for your GenPlatform.ai account.

Click the link below to reset your password:

{{ .ConfirmationURL }}

If you didn't request this, you can safely ignore this email.

Best regards,
GenPlatform.ai Team
```

### Step 3: Configure URLs

**Site URL**: `https://genplatform-six.vercel.app`
**Redirect URLs**: 
- `https://genplatform-six.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback` (for development)

### Step 4: Security Settings

1. **JWT expiry**: 3600 seconds (1 hour)
2. **Refresh token expiry**: 2592000 seconds (30 days)
3. **Password requirements**:
   - Minimum length: 8 characters
   - Require special characters: ✅
   - Require numbers: ✅
   - Require uppercase: ✅

### Step 5: Rate Limiting

- **Sign-ups per hour**: 100
- **Password resets per hour**: 30
- **Email sends per hour**: 100

### Environment Variables Required

Add to Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Verification

After setup, test:
1. User signup flow
2. Email confirmation
3. Password reset
4. Team member invitation
5. Session management

## Next Steps

Once Supabase Auth is configured, the GenPlatform.ai application will support:
- ✅ Owner login (existing cookie-based system)
- ✅ Team member login (Supabase Auth)
- ✅ Email invitations for team members
- ✅ Role-based access control
- ✅ Secure session management