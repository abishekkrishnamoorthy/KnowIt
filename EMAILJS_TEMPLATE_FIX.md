# EmailJS Template Fix Guide

## Problem: "One or more dynamic variables are corrupted"

This error occurs when the EmailJS template uses **Handlebars syntax** (`{{#if}}`, `{{#each}}`) which EmailJS doesn't support well, especially with pre-formatted HTML.

## Solution: Use Simple Variable Substitution

The code sends **pre-formatted HTML strings**, so the template should use **simple variable substitution** only (no Handlebars conditionals).

## Step-by-Step Fix

### Step 1: Copy the Correct Template

1. Open the file: `src/templates/leaderboardEmailTemplate.html`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)

### Step 2: Update EmailJS Template

1. Go to EmailJS Dashboard: https://dashboard.emailjs.com/
2. Navigate to **Email Templates**
3. Find your leaderboard template (the one with ID matching `VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID`)
4. Click **Edit**
5. **Delete all existing content**
6. **Paste** the content from `leaderboardEmailTemplate.html`
7. Click **Save**

### Step 3: Verify Template Variables

Make sure your template uses these variables (simple substitution, no conditionals):

**Required Variables:**
- `{{user_name}}` - User's name
- `{{user_email}}` - User's email
- `{{email_type}}` - Type of email (e.g., "Quiz Completion")
- `{{quiz_title}}` - Quiz title
- `{{main_message}}` - Main message
- `{{email_reason}}` - Why receiving email
- `{{app_url}}` - App URL

**HTML Content Variables (pre-formatted):**
- `{{quiz_difficulty}}` - Difficulty info (HTML, may be empty)
- `{{expiration_date}}` - Expiration date (HTML, may be empty)
- `{{total_attempts}}` - Total attempts (HTML)
- `{{leaderboard_html}}` - Complete leaderboard section (HTML, may be empty)
- `{{expiration_notice_html}}` - Expiration notice (HTML, may be empty)
- `{{stats_html}}` - Stats grid (HTML, may be empty)
- `{{cta_html}}` - Call-to-action button (HTML, may be empty)

### Step 4: Important Notes

**DO NOT USE:**
- ❌ `{{#if variable}}` - Handlebars conditionals
- ❌ `{{#each items}}` - Handlebars loops
- ❌ `{{/if}}` or `{{/each}}` - Handlebars closing tags

**USE INSTEAD:**
- ✅ `{{variable}}` - Simple variable substitution
- ✅ The code sends empty strings for optional sections
- ✅ Empty HTML strings won't break the email layout

### Step 5: Test

After updating the template:

1. **Test in browser console:**
   ```javascript
   await window.testQuizCompletionEmail('your-email@example.com', 'Your Name')
   ```

2. **Or complete a quiz** you created and check your email

3. **Check console logs** - should see success messages

## Why This Works

The code in `emailService.js` already formats everything as HTML:
- If a section should be shown, it sends formatted HTML
- If a section should be hidden, it sends an empty string `''`
- The template just inserts these pre-formatted strings

This approach:
- ✅ Works with EmailJS's simple variable substitution
- ✅ Avoids Handlebars parsing issues
- ✅ Ensures consistent email formatting
- ✅ Handles empty sections gracefully

## Template Structure

The correct template structure:

```html
<!-- Simple variable substitution -->
<div>{{user_name}}</div>

<!-- Pre-formatted HTML (may be empty) -->
{{leaderboard_html}}
{{stats_html}}
{{expiration_notice_html}}

<!-- Empty strings won't break layout -->
{{quiz_difficulty}}  <!-- Empty string if no difficulty -->
{{expiration_date}}  <!-- Empty string if no expiration -->
```

## Troubleshooting

### Still seeing Handlebars syntax in email?

1. **Clear EmailJS template cache:**
   - Delete the template
   - Create a new one
   - Paste the correct content
   - Save

2. **Verify template ID:**
   - Check `VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID` matches the template ID
   - Update environment variable if needed

3. **Check for hidden characters:**
   - Make sure there are no special characters
   - Copy from the file, not from browser

### Variables showing as `{{variable}}` in email?

- This means EmailJS isn't replacing the variables
- Check that variable names match exactly (case-sensitive)
- Verify template is saved and active

### Some sections missing?

- This is normal - empty sections send empty strings
- The code handles conditional display by sending empty HTML
- Check console logs to see what's being sent

## Quick Checklist

- [ ] Copied template from `src/templates/leaderboardEmailTemplate.html`
- [ ] Pasted into EmailJS template editor
- [ ] Removed all Handlebars syntax (`{{#if}}`, `{{#each}}`, etc.)
- [ ] Using only simple `{{variable}}` syntax
- [ ] Saved template in EmailJS
- [ ] Verified template ID matches environment variable
- [ ] Tested with browser console function
- [ ] Received properly formatted email

## Example: What NOT to Do

❌ **Wrong (Handlebars):**
```html
{{#if quiz_difficulty}}
  <p>Difficulty: {{quiz_difficulty}}</p>
{{/if}}
```

✅ **Correct (Simple substitution):**
```html
{{quiz_difficulty}}
```
(The code sends `<p>Difficulty: Medium</p>` or empty string)

