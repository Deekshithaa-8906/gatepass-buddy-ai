# Google Authentication Setup Guide

Google authentication has been integrated into your PassNTrack application. Follow these steps to complete the setup:

## 📋 What Was Implemented

✅ Installed `@react-oauth/google` package
✅ Created `.env` file with placeholder for Google Client ID
✅ Updated `AuthContext` to support Google login
✅ Wrapped app with `GoogleOAuthProvider` in `App.tsx`
✅ Added Google Sign-In button to Login page
✅ Auto-registration for new Google users (defaults to 'student' role)

## 🔧 Setup Instructions

### Step 1: Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application" as application type
   - Add **Authorized JavaScript origins**:
     - `http://localhost:8080`
     - `http://localhost:5173` (if using default Vite port)
   - Add **Authorized redirect URIs**:
     - `http://localhost:8080`
     - `http://localhost:5173`
   - Click "Create"
5. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Configure Environment Variable

1. Open the `.env` file in your project root
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
   ```
3. Save the file

### Step 3: Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## 🎯 How It Works

### User Flow:
1. User clicks "Sign in with Google" button on login page
2. Google authentication popup appears
3. User selects their Google account
4. On success:
   - If user email exists in system → Logs in with existing account
   - If new user → Auto-creates account with:
     - Name from Google profile
     - Email from Google account
     - Role: `student` (default)
     - No password required (OAuth user)
5. User is redirected to their dashboard based on role

### Auto-Registration Details:
- New Google users are automatically registered
- Default role: `student`
- Users can be found in localStorage under `gatepass_users`
- To change role: Update in localStorage or implement role selection UI

## 🔒 Security Notes

- `.env` file is already added to `.gitignore` - never commit your Client ID to Git
- Use `.env.example` as a template for other developers
- For production, use environment-specific Client IDs
- Consider adding authorized domains in Google Console for production URLs

## 📝 Additional Configuration (Optional)

### Change Default Role for Google Users
Edit `src/contexts/AuthContext.tsx` line ~49:
```typescript
role: 'student' as UserRole,  // Change to 'mentor', 'warden', etc.
```

### Add Role Selection UI
You can modify the auto-registration logic to:
1. Create a temporary account
2. Show a role selection modal
3. Update the user's role before final registration

### Production Setup
When deploying to production:
1. Create a new OAuth Client ID for production
2. Add production URLs to authorized origins
3. Set `VITE_GOOGLE_CLIENT_ID` in your hosting platform's environment variables

## 🐛 Troubleshooting

**"Invalid Client ID" error:**
- Verify Client ID in `.env` is correct
- Restart dev server after changing `.env`

**"Popup blocked" error:**
- Allow popups for localhost in browser settings

**"redirect_uri_mismatch" error:**
- Add your exact URL to authorized redirect URIs in Google Console
- URLs must match exactly (including port)

**Google button not appearing:**
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Clear browser cache and reload

## ✅ Testing

1. Open the login page: http://localhost:8080/login
2. You should see "Or continue with" divider
3. Google Sign-In button should appear below
4. Click it and test the authentication flow

---

**Need Help?** Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
