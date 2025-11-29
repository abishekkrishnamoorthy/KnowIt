# EmailJS Leaderboard Template Setup Guide

## Overview

A single unified email template that works for both:
1. **Quiz Completion Email** - Sent when user completes their own quiz
2. **Expiration Email** - Sent when challenge quiz link expires (with top 3 scores)
3. **Near-Expiration Email** - Sent 24 hours before expiration (with top 3 scores)

## Template File

The template is located at: `src/templates/leaderboardEmailTemplate.html`

## Setting Up in EmailJS

### Step 1: Create New Template

1. Go to EmailJS Dashboard: https://dashboard.emailjs.com/
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Name it: "KnowIt Leaderboard Template"

### Step 2: Copy Template HTML

1. Open `src/templates/leaderboardEmailTemplate.html`
2. Copy the entire HTML content
3. Paste it into the EmailJS template editor

### Step 3: Configure Template Variables

EmailJS will automatically detect variables. The template uses these variables:

#### Required Variables:
- `{{user_name}}` - Recipient's name
- `{{user_email}}` - Recipient's email
- `{{to_email}}` - Recipient email (for dynamic recipients)
- `{{email_type}}` - Type of email (e.g., "Quiz Completion", "Challenge Quiz")
- `{{quiz_title}}` - Title of the quiz
- `{{main_message}}` - Main message content
- `{{email_reason}}` - Why they're receiving this email
- `{{app_url}}` - Your app URL

#### HTML Content Variables (pre-formatted HTML):
- `{{quiz_difficulty}}` - Difficulty info (HTML formatted)
- `{{expiration_date}}` - Expiration date (HTML formatted)
- `{{total_attempts}}` - Total attempts (HTML formatted)
- `{{leaderboard_html}}` - Complete leaderboard section (HTML)
- `{{expiration_notice_html}}` - Expiration notice (HTML, only for near-expiration)
- `{{stats_html}}` - Stats grid (HTML, only for completion emails)
- `{{cta_html}}` - Call-to-action button (HTML)

### Step 4: Configure Email Service

1. Go to **Email Services**
2. Select your service (or create a new one)
3. In **To Email** field, enter: `{{to_email}}` or `{{user_email}}`
4. This allows dynamic recipients

### Step 5: Get Template ID

1. After saving the template, copy the **Template ID**
2. Add it to your `.env` file:
   ```
   VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID=your_template_id_here
   ```

## Template Variables Explained

### For Quiz Completion Emails:
- `email_type`: "Quiz Completion"
- `main_message`: "Congratulations on completing..."
- `stats_html`: Shows user's score and correct answers
- `leaderboard_html`: Shows top performers
- `expiration_notice_html`: Empty (not shown)

### For Expiration Emails:
- `email_type`: "Challenge Quiz"
- `main_message`: "Your challenge quiz has expired..."
- `expiration_date`: When the quiz expired
- `leaderboard_html`: Shows top 3 scores
- `stats_html`: Empty (not shown)
- `expiration_notice_html`: Empty (not shown)

### For Near-Expiration Emails:
- `email_type`: "Challenge Reminder"
- `main_message`: "Your challenge quiz is about to expire..."
- `expiration_date`: When the quiz will expire
- `expiration_notice_html`: Shows countdown timer
- `leaderboard_html`: Shows current top 3
- `stats_html`: Empty (not shown)

## Testing

### Test Completion Email:
```javascript
// In browser console
import { sendLeaderboardEmail } from './src/utils/emailService';

await sendLeaderboardEmail({
  userName: 'Test User',
  userEmail: 'test@example.com',
  quizTitle: 'Test Quiz',
  quizDifficulty: 'medium',
  yourScore: 85,
  yourCorrect: 17,
  totalQuestions: 20,
  topScores: [
    { userName: 'User 1', score: 95, correctAnswers: 19, totalQuestions: 20, timeTaken: 300 },
    { userName: 'User 2', score: 90, correctAnswers: 18, totalQuestions: 20, timeTaken: 350 },
    { userName: 'Test User', score: 85, correctAnswers: 17, totalQuestions: 20, timeTaken: 400 }
  ],
  appUrl: 'https://your-app.vercel.app'
});
```

### Test Expiration Email:
```javascript
import { sendExpirationEmail } from './src/utils/emailService';

await sendExpirationEmail({
  creatorName: 'Creator',
  creatorEmail: 'creator@example.com',
  quizTitle: 'Test Quiz',
  quizDifficulty: 'medium',
  expirationDate: '2024-01-15 10:00 AM',
  topScores: [
    { userName: 'User 1', score: 95, correctAnswers: 19, totalQuestions: 20, timeTaken: 300 },
    { userName: 'User 2', score: 90, correctAnswers: 18, totalQuestions: 20, timeTaken: 350 },
    { userName: 'User 3', score: 85, correctAnswers: 17, totalQuestions: 20, timeTaken: 400 }
  ],
  totalAttempts: 3,
  appUrl: 'https://your-app.vercel.app'
});
```

## Features

✅ **Single Template** - Works for all three email types
✅ **Responsive Design** - Looks great on mobile and desktop
✅ **Beautiful UI** - Modern gradient design with medals for top 3
✅ **Dynamic Content** - Shows/hides sections based on email type
✅ **HTML Formatted** - Pre-formatted HTML sections for easy integration

## Notes

- The template uses inline CSS for maximum email client compatibility
- All HTML sections are pre-formatted by the code, so EmailJS just needs to insert them
- The template is mobile-responsive
- Top 3 scores get special styling (gold, silver, bronze)

