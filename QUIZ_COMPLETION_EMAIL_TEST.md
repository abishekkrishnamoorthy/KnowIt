# Quiz Completion Email Testing Guide

## Overview

This guide helps you test and verify that the quiz completion email is being sent correctly.

## When Quiz Completion Email is Sent

The quiz completion email is sent when **ALL** of the following conditions are met:

1. ✅ User is logged in (`user` exists)
2. ✅ User has an ID (`user.id` exists)
3. ✅ User has an email (`user.email` exists)
4. ✅ User has a name (`user.name` exists)
5. ✅ Quiz exists (`quiz` exists)
6. ✅ Quiz has a creator ID (`quiz.createdBy` exists)
7. ✅ **User is the creator of the quiz** (`user.id === quiz.createdBy`)

## Testing Methods

### Method 1: Browser Console Testing

1. **Open your app in the browser**
2. **Open browser console** (F12 or right-click → Inspect → Console)
3. **Check if test functions are available:**
   ```javascript
   // Should see these messages:
   // "EmailJS test function available..."
   // "Quiz completion email test functions available..."
   ```

4. **Test EmailJS Configuration:**
   ```javascript
   // Test basic EmailJS setup
   await window.testEmailJS('your-email@example.com')
   ```

5. **Test Quiz Completion Email with Sample Data:**
   ```javascript
   // Test with sample data
   await window.testQuizCompletionEmail('your-email@example.com', 'Your Name')
   ```

6. **Test with Real Quiz Data:**
   ```javascript
   // Test with a real quiz ID (replace with actual quiz ID)
   await window.testQuizCompletionEmail('your-email@example.com', 'Your Name', 'quiz-id-here')
   ```

7. **Check Conditions Before Taking Quiz:**
   ```javascript
   // In TakeQuiz page, check conditions
   // You'll need to get user and quiz objects first
   // This is mainly for debugging
   window.checkQuizCompletionEmailConditions(user, quiz)
   ```

### Method 2: Real Quiz Test

1. **Create a quiz** while logged in
2. **Take the quiz** (complete all questions)
3. **Check browser console** for detailed logs:
   - Look for: `📧 Checking if quiz completion email should be sent...`
   - Look for: `✅ Conditions met - Sending quiz completion email...`
   - Look for: `✅ Quiz completion email sent successfully!`

4. **Check your email inbox** for the quiz completion email

### Method 3: Check Console Logs

When you complete a quiz, the console will show:

**If conditions are met:**
```
📧 Checking if quiz completion email should be sent...
User: { id: "...", name: "...", email: "..." }
Quiz creator: "..."
Is user the creator? true
✅ Conditions met - Sending quiz completion email...
📊 Top scores retrieved: 3 scores
📧 Sending email with params: { userName: "...", userEmail: "...", ... }
📧 Sending leaderboard email: { userEmail: "...", quizTitle: "...", ... }
✅ Leaderboard email sent successfully to: your-email@example.com
✅ Quiz completion email sent successfully!
```

**If conditions are NOT met:**
```
📧 Checking if quiz completion email should be sent...
User: { id: "...", name: "...", email: "..." }
Quiz creator: "..."
Is user the creator? false
ℹ️ Quiz completion email NOT sent - Conditions not met:
  - User is not the quiz creator
  - User ID: user-id-here
  - Quiz creator ID: creator-id-here
```

## Common Issues

### Issue 1: Email Not Sent - User Not Creator

**Problem:** You're taking a quiz created by someone else.

**Solution:** Create your own quiz and take it.

### Issue 2: Email Not Sent - Not Logged In

**Problem:** You're taking the quiz as a guest.

**Solution:** Log in before taking the quiz.

### Issue 3: EmailJS Configuration Error

**Problem:** EmailJS environment variables are missing.

**Check:**
```javascript
// In browser console
console.log({
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  leaderboardTemplateId: import.meta.env.VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing'
})
```

**Solution:** Set these in your `.env` file:
```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID=your_leaderboard_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### Issue 4: EmailJS Template Not Configured

**Problem:** Leaderboard template ID is missing or incorrect.

**Solution:** 
1. Check EmailJS dashboard
2. Verify template ID matches `VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID`
3. Ensure template has all required variables (see `EMAIL_TEMPLATES_SUMMARY.md`)

## Verification Checklist

- [ ] EmailJS environment variables are set
- [ ] User is logged in
- [ ] User created the quiz (user.id === quiz.createdBy)
- [ ] Quiz has been completed
- [ ] Browser console shows success messages
- [ ] Email received in inbox (check spam folder too)

## Debugging Steps

1. **Check console logs** - Look for detailed logging messages
2. **Test EmailJS config** - Run `window.testEmailJS()`
3. **Test quiz completion email** - Run `window.testQuizCompletionEmail()`
4. **Check environment variables** - Verify all EmailJS vars are set
5. **Check EmailJS dashboard** - Verify template and service are active
6. **Check email spam folder** - Emails might be filtered

## Files Modified

- `src/pages/TakeQuiz.jsx` - Enhanced logging for email sending
- `src/utils/testQuizCompletionEmail.js` - New test utility
- `src/main.jsx` - Imported test utilities

## Next Steps

If email is still not sending:
1. Check EmailJS dashboard for error logs
2. Verify email service is active
3. Check template variables match
4. Test with a different email address
5. Check network tab for API errors

