# Email Templates Summary

## Overview

A unified email template system that handles three different email scenarios using a single template file.

## Template File

**Location:** `src/templates/leaderboardEmailTemplate.html`

This single template works for:
1. ✅ Quiz Completion Emails (when user completes their own quiz)
2. ✅ Expiration Emails (when challenge quiz link expires)
3. ✅ Near-Expiration Emails (24 hours before expiration)

## Email Types

### 1. Quiz Completion Email
**Trigger:** User completes their own quiz
**Shows:**
- User's score and stats
- Top performers leaderboard
- Call-to-action to view full leaderboard

**Function:** `sendLeaderboardEmail()` in `emailService.js`

### 2. Expiration Email
**Trigger:** Challenge quiz link expires
**Shows:**
- Top 3 scores
- Expiration date
- Total attempts

**Function:** `sendExpirationEmail()` in `emailService.js`

### 3. Near-Expiration Email
**Trigger:** 24 hours before quiz expiration
**Shows:**
- Current top 3 scores
- Expiration countdown timer
- Warning about upcoming expiration

**Function:** `sendNearExpirationEmail()` in `emailService.js`

## Implementation Details

### Files Modified/Created:

1. **`src/templates/leaderboardEmailTemplate.html`**
   - Single unified HTML template
   - Responsive design
   - Works with EmailJS variable substitution

2. **`src/utils/emailService.js`**
   - Added `sendLeaderboardEmail()` - for completion emails
   - Updated `sendExpirationEmail()` - uses new template format
   - Added `sendNearExpirationEmail()` - for near-expiration reminders
   - Helper functions to format scores as HTML

3. **`src/utils/expirationService.js`**
   - Added `checkAndSendNearExpirationEmails()` - checks and sends reminders
   - Updated to use new email service functions

4. **`src/pages/TakeQuiz.jsx`**
   - Added logic to send leaderboard email when user completes their own quiz
   - Automatically triggered after quiz completion

5. **`src/utils/storage.js`**
   - Added `nearExpirationEmailSent` field to track reminder emails

## Setup Steps

1. **Copy Template to EmailJS:**
   - Go to EmailJS Dashboard
   - Create new template
   - Copy content from `leaderboardEmailTemplate.html`
   - Save and get Template ID

2. **Configure Environment:**
   ```env
   VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID=your_template_id
   ```

3. **Configure Email Service:**
   - Set "To Email" field to: `{{to_email}}` or `{{user_email}}`
   - Enable dynamic recipients

## Automatic Triggers

### Quiz Completion Email
- ✅ Automatically sent when user completes their own quiz
- No additional setup needed

### Expiration Email
- ✅ Automatically sent when quiz expires
- Requires: Background job to check expired quizzes
- See: `EXPIRATION_SETUP.md`

### Near-Expiration Email
- ✅ Automatically sent 24 hours before expiration
- Requires: Background job to check near-expiration quizzes
- Function: `checkAndSendNearExpirationEmails()`

## Template Variables

All variables are pre-formatted as HTML by the code, so EmailJS just inserts them:

- `{{user_name}}` - Recipient name
- `{{user_email}}` - Recipient email
- `{{to_email}}` - For dynamic recipients
- `{{email_type}}` - Type of email
- `{{quiz_title}}` - Quiz title
- `{{main_message}}` - Main message
- `{{quiz_difficulty}}` - Pre-formatted HTML
- `{{expiration_date}}` - Pre-formatted HTML
- `{{total_attempts}}` - Pre-formatted HTML
- `{{leaderboard_html}}` - Complete leaderboard section (HTML)
- `{{expiration_notice_html}}` - Expiration notice (HTML)
- `{{stats_html}}` - Stats grid (HTML)
- `{{cta_html}}` - Call-to-action button (HTML)
- `{{app_url}}` - App URL
- `{{email_reason}}` - Why receiving email

## Testing

See `EMAILJS_LEADERBOARD_TEMPLATE_SETUP.md` for detailed testing instructions.

## Notes

- Template uses inline CSS for email client compatibility
- All HTML is pre-formatted by JavaScript code
- Template is mobile-responsive
- Top 3 scores get special styling (gold, silver, bronze medals)

