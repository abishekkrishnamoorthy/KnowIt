# Challenge Mode Expiration Setup Guide

## Features Implemented

1. **Expiration Time Setup**: When creating a challenge mode quiz, you can set expiration time in days and hours
2. **Expiration Checking**: Quiz links automatically check if they're expired before allowing access
3. **Top 3 Scores Email**: When a quiz expires, the top 3 scores are automatically emailed to the quiz creator

## Configuration

### 1. Environment Variables

Add to your `.env` file:
```
VITE_APP_URL=https://your-app.vercel.app
```

This is used to generate share links correctly on Vercel.

### 2. EmailJS Template for Expiration Emails

You need to create a separate EmailJS template for expiration emails. The template should include these variables:

- `user_name`: Creator's name
- `user_email`: Creator's email
- `quiz_title`: Quiz title
- `expiration_date`: When the quiz expired
- `top_scores`: Formatted top 3 scores
- `total_attempts`: Number of attempts
- `message`: Full message with scores

**Template Example:**
```
Subject: Your Challenge Quiz Has Expired - {{quiz_title}}

Hi {{user_name}},

Your challenge quiz "{{quiz_title}}" expired on {{expiration_date}}.

Top Scores:
{{top_scores}}

Total Attempts: {{total_attempts}}

Thank you for using KnowIt!
```

### 3. Processing Expired Quizzes

To automatically process expired quizzes and send emails, you have two options:

#### Option A: Manual Trigger (For Testing)

Create a utility page or use browser console:
```javascript
import { checkAndProcessExpiredQuizzes } from './src/utils/expirationService';
checkAndProcessExpiredQuizzes();
```

#### Option B: Vercel Cron Job (Recommended)

1. Create a serverless function at `api/check-expired-quizzes.js`:
```javascript
// This would need to be a standalone function that doesn't import React code
// You can use a service like EasyCron or set up a separate Node.js service
```

2. Or use an external cron service:
   - EasyCron: https://www.easycron.com/
   - Cron-job.org: https://cron-job.org/
   - Set up to call: `https://your-app.vercel.app/api/check-expired-quizzes` (if you create the endpoint)

3. Schedule: Run every hour (or as needed)

### 4. Manual Processing Script

You can also create a simple script to run manually:

```javascript
// scripts/check-expired.js
import { checkAndProcessExpiredQuizzes } from '../src/utils/expirationService.js';

checkAndProcessExpiredQuizzes()
  .then(result => {
    console.log(`Processed ${result.processed} expired quiz(es)`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

Run with: `node scripts/check-expired.js`

## How It Works

1. **Creating Quiz**: When creating a challenge mode quiz, you set expiration time (days + hours)
2. **Expiration Date**: The expiration date is calculated and stored with the quiz
3. **Accessing Quiz**: When someone tries to access the quiz link, it checks if expired
4. **Expired Quiz**: Shows an expiration message instead of the quiz
5. **Processing**: Background job checks for expired quizzes and sends emails with top 3 scores
6. **Email Sent**: Once email is sent, the quiz is marked so it won't send again

## Testing

1. Create a challenge mode quiz with 1 hour expiration
2. Wait for expiration (or manually set expiration date in database)
3. Try to access the quiz link - should show expiration message
4. Run the expiration check function
5. Check creator's email for top 3 scores

## Notes

- Expiration emails are sent only once per quiz
- Top 3 scores are sorted by score (highest first), then by time (fastest first)
- If less than 3 attempts, all attempts are included
- Guest users' names are included in the leaderboard

