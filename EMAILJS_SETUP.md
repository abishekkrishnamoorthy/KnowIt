# EmailJS Configuration Guide

## Fixing "The recipients address is empty" Error

This error occurs when your EmailJS service is not configured to accept dynamic recipient emails.

### Solution: Configure Dynamic Recipients in EmailJS Dashboard

1. **Go to EmailJS Dashboard**: https://dashboard.emailjs.com/

2. **Navigate to Email Services**:
   - Click on "Email Services" in the left sidebar
   - Find your service (service_lo8htbu)
   - Click on it to edit

3. **Configure the "To Email" Field**:
   
   **Option A: Use Template Parameter (Recommended)**
   - In the "To Email" field, enter: `{{to_email}}` or `{{email}}`
   - This allows the recipient to be passed dynamically from your code
   - Save the service

   **Option B: Use Static Email (For Testing)**
   - Enter a static email address in the "To Email" field
   - This will send all emails to that address (not recommended for production)

4. **Verify Template Parameters**:
   - Go to "Email Templates"
   - Open your template (template_bmgpm0l)
   - Ensure it uses: `{{user_name}}` and `{{otp_code}}`
   - The template should match the HTML in `src/templates/emailVerificationTemplate.html`

5. **Test the Configuration**:
   - Use the test function in browser console: `window.testEmailJS('your-email@example.com')`
   - Or try signing up with a real email address

### Current Template Parameters Being Sent

The code sends these parameters:
- `user_name`: User's name
- `user_email`: User's email
- `otp_code`: 6-digit verification code
- `to_email`: Recipient email (for dynamic recipients)
- `to_name`: Recipient name
- `email`: Alternative recipient email format
- `reply_to`: Reply-to email address

### Common Issues

1. **"Recipients address is empty"**: 
   - Fix: Configure "To Email" field in service settings to use `{{to_email}}` or `{{email}}`

2. **"Invalid template ID"**:
   - Fix: Verify template ID matches in `.env` and EmailJS dashboard

3. **"Invalid service ID"**:
   - Fix: Verify service ID matches in `.env` and EmailJS dashboard

4. **"Invalid public key"**:
   - Fix: Verify public key (user_id) matches in `.env` and EmailJS dashboard

### Environment Variables Required

Make sure your `.env` file has:
```
VITE_EMAILJS_SERVICE_ID=service_lo8htbu
VITE_EMAILJS_TEMPLATE_ID=template_bmgpm0l
VITE_EMAILJS_PUBLIC_KEY=kIV-PsHqxmMKdcjG1
```

### Testing

After configuring, test with:
```javascript
// In browser console
window.testEmailJS('your-email@example.com')
```

