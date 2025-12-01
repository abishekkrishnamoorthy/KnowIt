# EmailJS Recipient Configuration Guide

## Problem: "The recipients address is empty" Error

If you're getting this error, it means EmailJS is not receiving the recipient email address. This is a **configuration issue** in your EmailJS dashboard.

## Solution: Configure Dynamic Recipients

### Step 1: Go to EmailJS Dashboard

1. Visit: https://dashboard.emailjs.com/
2. Navigate to **Email Services**
3. Select your email service (or create a new one)

### Step 2: Configure "To Email" Field

**IMPORTANT:** The "To Email" field must use a template variable, NOT a static email address.

#### Option A: Using `{{to_email}}` (Recommended)

1. In your EmailJS service settings, find the **"To Email"** field
2. Set it to: `{{to_email}}`
3. Save the service

#### Option B: Using `{{user_email}}`

1. In your EmailJS service settings, find the **"To Email"** field
2. Set it to: `{{user_email}}`
3. Save the service

#### Option C: Using `{{email}}`

1. In your EmailJS service settings, find the **"To Email"** field
2. Set it to: `{{email}}`
3. Save the service

### Step 3: Enable Dynamic Recipients (if available)

Some EmailJS services have an option to "Accept dynamic recipients":
1. Look for this checkbox in your service settings
2. Enable it if available
3. Save the service

### Step 4: Verify Template Variables

Make sure your EmailJS template includes the recipient variable:
- The template should have `{{to_email}}` or `{{user_email}}` or `{{email}}` in the "To Email" field
- The variable name must match what you set in Step 2

## Common EmailJS Service Providers

### Gmail
- Go to Email Services → Your Gmail Service
- "To Email" field: Set to `{{to_email}}`
- Save

### Outlook
- Go to Email Services → Your Outlook Service
- "To Email" field: Set to `{{to_email}}`
- Save

### Custom SMTP
- Go to Email Services → Your SMTP Service
- "To Email" field: Set to `{{to_email}}`
- Save

## Testing

After configuring:

1. **Test in browser console:**
   ```javascript
   await window.testQuizCompletionEmail('your-email@example.com', 'Your Name')
   ```

2. **Check console logs:**
   - Should see: `✅ Quiz completion email sent successfully!`
   - Should NOT see: "The recipients address is empty"

3. **Check your email inbox** (and spam folder)

## Troubleshooting

### Still getting "recipients address is empty"?

1. **Double-check the "To Email" field:**
   - It should be `{{to_email}}` (with curly braces)
   - NOT a static email like `user@example.com`
   - NOT empty

2. **Check template variable name:**
   - The variable in "To Email" must match what the code sends
   - Code sends: `to_email`, `user_email`, `email`
   - Use one of these in your service settings

3. **Verify service is active:**
   - Make sure your EmailJS service is active/enabled
   - Check for any service errors in the dashboard

4. **Check environment variables:**
   ```javascript
   // In browser console
   console.log({
     serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
     leaderboardTemplateId: import.meta.env.VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID,
     publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing'
   })
   ```

5. **Test with verification email:**
   - If verification emails work but leaderboard emails don't
   - The issue is likely with the leaderboard template ID
   - Verify `VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID` is correct

## Code Changes Made

The code now sends multiple recipient parameter formats for compatibility:
- `to_email` - Most common
- `user_email` - Alternative
- `email` - Alternative
- `reply_to` - Some services use this

Your EmailJS service "To Email" field should use one of these variables.

## Quick Fix Checklist

- [ ] EmailJS service "To Email" field is set to `{{to_email}}` (or `{{user_email}}` or `{{email}}`)
- [ ] Service is saved and active
- [ ] Template ID is correct (`VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID`)
- [ ] Service ID is correct (`VITE_EMAILJS_SERVICE_ID`)
- [ ] Public key is set (`VITE_EMAILJS_PUBLIC_KEY`)
- [ ] Tested with browser console test function
- [ ] Checked email inbox and spam folder

## Still Having Issues?

1. Check EmailJS dashboard for error logs
2. Verify all environment variables are set
3. Test with a different email address
4. Check network tab in browser DevTools for API response details
5. Review EmailJS documentation: https://www.emailjs.com/docs/

