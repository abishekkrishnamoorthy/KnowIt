const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
// Leaderboard template ID for completion, expiration, and near-expiration emails
const leaderboardTemplateId = import.meta.env.VITE_EMAILJS_LEADERBOARD_TEMPLATE_ID || 'template_mwmj7mv';
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const ensureEmailJsConfig = () => {
  const missing = [];
  if (!serviceId) missing.push('VITE_EMAILJS_SERVICE_ID');
  if (!templateId) missing.push('VITE_EMAILJS_TEMPLATE_ID');
  if (!publicKey) missing.push('VITE_EMAILJS_PUBLIC_KEY');
  
  if (missing.length > 0) {
    throw new Error(`EmailJS is not configured. Missing: ${missing.join(', ')}. Please set these in your .env file.`);
  }
};

/**
 * Send email using EmailJS API directly
 * @param {object} params - Email parameters
 * @returns {Promise<Response>}
 */
const sendEmailJSRequest = async (templateParams) => {
  return sendEmailJSRequestWithTemplate(templateParams, templateId);
};

/**
 * Test EmailJS configuration by sending a test email
 * @param {string} testEmail - Email address to send test to
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testEmailJSConfig = async (testEmail = 'test@example.com') => {
  try {
    const testParams = {
      user_name: 'Test User',
      user_email: testEmail,
      otp_code: '123456',
      // Include all common recipient parameter formats
      to_email: testEmail,
      to_name: 'Test User',
      email: testEmail,
      reply_to: testEmail
    };

    console.log('🧪 Testing EmailJS configuration:', {
      serviceId: serviceId || '❌ MISSING',
      templateId: templateId || '❌ MISSING',
      publicKey: publicKey ? `${publicKey.substring(0, 15)}...` : '❌ MISSING',
      testEmail
    });

    const response = await sendEmailJSRequest(testParams);
    
    if (response.status === 200 && response.text === 'OK') {
      return {
        success: true,
        message: 'EmailJS configuration is valid! Test email sent successfully.'
      };
    } else {
      return {
        success: false,
        message: `EmailJS test failed: Status ${response.status}, Text: ${response.text}`
      };
    }
  } catch (error) {
    console.error('EmailJS test error:', error);
    
    let errorMessage = 'EmailJS test failed: ';
    if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error';
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Format top scores as HTML for email template
 */
const formatTopScoresAsHTML = (topScores) => {
  if (!topScores || topScores.length === 0) {
    return '<p style="text-align: center; color: #6b7280; padding: 20px;">No attempts yet.</p>';
  }

  return topScores.map((score, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    const rankClass = rank === 1 ? 'first' : rank === 2 ? 'second' : 'third';
    
    // Format time taken
    const minutes = Math.floor(score.timeTaken / 60);
    const seconds = score.timeTaken % 60;
    const timeTaken = `${minutes}:${String(seconds).padStart(2, '0')}`;

    return `
      <div class="leaderboard-item ${rankClass}">
        <div class="rank">${rank}</div>
        <div class="medal">${medal}</div>
        <div class="user-info">
          <div class="user-name">${score.userName || 'Anonymous'}</div>
          <div class="user-score">${score.correctAnswers}/${score.totalQuestions} correct • ${timeTaken}</div>
        </div>
        <div class="score-badge">${score.score}%</div>
      </div>
    `;
  }).join('');
};

/**
 * Format top scores as plain text
 */
const formatTopScoresAsText = (topScores) => {
  if (!topScores || topScores.length === 0) {
    return 'No attempts yet.';
  }

  return topScores.map((score, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    return `${medal} ${rank}. ${score.userName || 'Anonymous'} - ${score.score}% (${score.correctAnswers}/${score.totalQuestions} correct)`;
  }).join('\n');
};

/**
 * Send expiration email with top scores (when quiz expires)
 */
export const sendExpirationEmail = async ({ creatorName, creatorEmail, quizTitle, quizDifficulty, expirationDate, topScores, totalAttempts, appUrl }) => {
  try {
    ensureEmailJsConfig();

    const leaderboardHTML = topScores.length > 0 
      ? `<div class="leaderboard-section">
          <div class="leaderboard-title">Top Performers</div>
          ${formatTopScoresAsHTML(topScores)}
        </div>`
      : '<p style="text-align: center; color: #6b7280; padding: 20px;">No attempts were made on this quiz.</p>';

    const quizInfoHTML = `
      ${quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : ''}
      ${expirationDate ? `<p><strong>Expired:</strong> ${expirationDate}</p>` : ''}
      <p><strong>Total Attempts:</strong> ${totalAttempts}</p>
    `;

    const templateParams = {
      // Basic info
      user_name: creatorName,
      user_email: creatorEmail,
      to_email: creatorEmail,
      email_type: 'Challenge Quiz',
      
      // Quiz info
      quiz_title: quizTitle,
      quiz_difficulty: quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : '',
      expiration_date: expirationDate ? `<p><strong>Expired:</strong> ${expirationDate}</p>` : '',
      total_attempts: `<p><strong>Total Attempts:</strong> ${totalAttempts}</p>`,
      
      // Message
      main_message: `Your challenge quiz "${quizTitle}" has expired. Here are the top ${Math.min(3, topScores.length)} scores from participants.`,
      email_reason: 'you created a challenge quiz that has expired.',
      
      // HTML sections
      leaderboard_html: leaderboardHTML,
      expiration_notice_html: '',
      stats_html: '',
      cta_html: appUrl ? `<div style="text-align: center;"><a href="${appUrl}/leaderboard" class="cta-button">View Full Leaderboard</a></div>` : '',
      
      // App info
      app_url: appUrl || ''
    };

    console.log('📧 Sending expiration email:', {
      creatorEmail,
      quizTitle,
      topScoresCount: topScores.length
    });

    // Use leaderboard template ID if available, otherwise fallback to main template
    const response = await sendEmailJSRequestWithTemplate(templateParams, leaderboardTemplateId);
    
    if (response.status === 200 && response.text === 'OK') {
      console.log('✅ Expiration email sent successfully to:', creatorEmail);
      return { success: true, message: 'Expiration email sent successfully' };
    } else {
      throw new Error(`Unexpected response: ${response.text}`);
    }
  } catch (error) {
    console.error('Error sending expiration email:', error);
    throw error;
  }
};

/**
 * Send leaderboard email when user completes their own quiz
 */
export const sendLeaderboardEmail = async ({ userName, userEmail, quizTitle, quizDifficulty, yourScore, yourCorrect, totalQuestions, topScores, appUrl }) => {
  try {
    ensureEmailJsConfig();

    const leaderboardHTML = topScores.length > 0 
      ? `<div class="leaderboard-section">
          <div class="leaderboard-title">Top Performers</div>
          ${formatTopScoresAsHTML(topScores)}
        </div>`
      : '<p style="text-align: center; color: #6b7280; padding: 20px;">No other attempts yet.</p>';

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Your Score</div>
          <div class="stat-value">${yourScore}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Correct Answers</div>
          <div class="stat-value">${yourCorrect}/${totalQuestions}</div>
        </div>
      </div>
    `;

    const quizInfoHTML = `
      ${quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : ''}
      <p><strong>Total Attempts:</strong> ${topScores.length}</p>
    `;

    const templateParams = {
      // Basic info
      user_name: userName,
      user_email: userEmail,
      to_email: userEmail,
      email_type: 'Quiz Completion',
      
      // Quiz info
      quiz_title: quizTitle,
      quiz_difficulty: quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : '',
      expiration_date: '',
      total_attempts: `<p><strong>Total Attempts:</strong> ${topScores.length}</p>`,
      
      // Message
      main_message: `Congratulations on completing "${quizTitle}"! Here's how you ranked among other participants.`,
      email_reason: 'you completed a quiz.',
      
      // HTML sections
      leaderboard_html: leaderboardHTML,
      expiration_notice_html: '',
      stats_html: statsHTML,
      cta_html: appUrl ? `<div style="text-align: center;"><a href="${appUrl}/leaderboard" class="cta-button">View Full Leaderboard</a></div>` : '',
      
      // App info
      app_url: appUrl || ''
    };

    console.log('📧 Sending leaderboard email:', {
      userEmail,
      quizTitle,
      yourScore,
      topScoresCount: topScores.length
    });

    const response = await sendEmailJSRequestWithTemplate(templateParams, leaderboardTemplateId);
    
    if (response.status === 200 && response.text === 'OK') {
      console.log('✅ Leaderboard email sent successfully to:', userEmail);
      return { success: true, message: 'Leaderboard email sent successfully' };
    } else {
      throw new Error(`Unexpected response: ${response.text}`);
    }
  } catch (error) {
    console.error('Error sending leaderboard email:', error);
    throw error;
  }
};

/**
 * Send near-expiration email with top 3 scores
 */
export const sendNearExpirationEmail = async ({ creatorName, creatorEmail, quizTitle, quizDifficulty, expirationDate, expirationTime, topScores, appUrl }) => {
  try {
    ensureEmailJsConfig();

    const top3Scores = topScores.slice(0, 3);
    const leaderboardHTML = top3Scores.length > 0 
      ? `<div class="leaderboard-section">
          <div class="leaderboard-title">Current Top 3</div>
          ${formatTopScoresAsHTML(top3Scores)}
        </div>`
      : '<p style="text-align: center; color: #6b7280; padding: 20px;">No attempts yet.</p>';

    const expirationNoticeHTML = `
      <div class="expiration-notice">
        <h3>⏰ Link Expiring Soon!</h3>
        <p>Your challenge quiz link will expire soon.</p>
        <div class="expiration-time">${expirationTime}</div>
      </div>
    `;

    const quizInfoHTML = `
      ${quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : ''}
      ${expirationDate ? `<p><strong>Expires:</strong> ${expirationDate}</p>` : ''}
      <p><strong>Total Attempts:</strong> ${topScores.length}</p>
    `;

    const templateParams = {
      // Basic info
      user_name: creatorName,
      user_email: creatorEmail,
      to_email: creatorEmail,
      email_type: 'Challenge Reminder',
      
      // Quiz info
      quiz_title: quizTitle,
      quiz_difficulty: quizDifficulty ? `<p><strong>Difficulty:</strong> ${quizDifficulty}</p>` : '',
      expiration_date: expirationDate ? `<p><strong>Expires:</strong> ${expirationDate}</p>` : '',
      total_attempts: `<p><strong>Total Attempts:</strong> ${topScores.length}</p>`,
      
      // Message
      main_message: `Your challenge quiz "${quizTitle}" is about to expire! Here are the current top 3 performers.`,
      email_reason: 'you created a challenge quiz that is near expiration.',
      
      // HTML sections
      leaderboard_html: leaderboardHTML,
      expiration_notice_html: expirationNoticeHTML,
      stats_html: '',
      cta_html: appUrl ? `<div style="text-align: center;"><a href="${appUrl}/leaderboard" class="cta-button">View Full Leaderboard</a></div>` : '',
      
      // App info
      app_url: appUrl || ''
    };

    console.log('📧 Sending near-expiration email:', {
      creatorEmail,
      quizTitle,
      expirationTime
    });

    const response = await sendEmailJSRequestWithTemplate(templateParams, leaderboardTemplateId);
    
    if (response.status === 200 && response.text === 'OK') {
      console.log('✅ Near-expiration email sent successfully to:', creatorEmail);
      return { success: true, message: 'Near-expiration email sent successfully' };
    } else {
      throw new Error(`Unexpected response: ${response.text}`);
    }
  } catch (error) {
    console.error('Error sending near-expiration email:', error);
    throw error;
  }
};

/**
 * Send email with specific template ID
 */
const sendEmailJSRequestWithTemplate = async (templateParams, customTemplateId = null) => {
  const templateToUse = customTemplateId || templateId;
  
  const requestData = {
    service_id: serviceId,
    template_id: templateToUse,
    user_id: publicKey,
    template_params: templateParams
  };

  console.log('📧 EmailJS API Request:', {
    service_id: serviceId,
    template_id: templateToUse,
    user_id: publicKey ? `${publicKey.substring(0, 15)}...` : '❌ MISSING'
  });

  const response = await fetch(EMAILJS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  const responseText = await response.text();
  
  console.log('📧 EmailJS API Response:', {
    status: response.status,
    statusText: response.statusText,
    text: responseText
  });

  if (!response.ok) {
    throw new Error(`EmailJS API error: ${response.status} ${response.statusText} - ${responseText}`);
  }

  if (response.status === 200 && responseText === 'OK') {
    return { status: 200, text: 'OK' };
  } else {
    throw new Error(`Unexpected EmailJS response: ${responseText}`);
  }
};

export const sendVerificationEmail = async ({ name, email, otp }) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address format');
    }

    // Validate OTP format (should be 6 digits)
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new Error('Invalid OTP format');
    }

    // Template parameters must match exactly what's in your EmailJS template
    // EmailJS services need the recipient email - try multiple common parameter names
    const templateParams = {
      user_name: name || 'User',
      user_email: email,
      otp_code: otp,
      // Try multiple recipient parameter formats that EmailJS services commonly use
      to_email: email,        // Most common for dynamic recipients
      to_name: name || 'User', // Recipient name
      email: email,           // Alternative format
      reply_to: email,       // Some services use reply_to
      // Note: If your EmailJS service is configured with a static recipient,
      // you may need to configure it in the EmailJS dashboard to accept dynamic recipients
    };

    console.log('📧 Sending verification email with EmailJS API:', {
      serviceId: serviceId || '❌ MISSING',
      templateId: templateId || '❌ MISSING',
      publicKey: publicKey ? `${publicKey.substring(0, 15)}...` : '❌ MISSING',
      email,
      hasOtp: !!otp,
      otpLength: otp?.length
    });

    const response = await sendEmailJSRequest(templateParams);
    
    // EmailJS returns status 200 and text 'OK' on success
    if (response.status === 200 && response.text === 'OK') {
      console.log('✅ Email sent successfully to:', email);
      return { success: true, message: 'Verification email sent successfully' };
    } else {
      const errorMsg = `EmailJS returned unexpected response: Status ${response.status}, Text: ${response.text || 'Unknown'}`;
      console.error('❌ EmailJS error:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('EmailJS send error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Provide user-friendly error messages
    if (error.message.includes('EmailJS is not configured')) {
      throw new Error('Email service is not configured. Please contact support.');
    } else if (error.message.includes('recipients address is empty') || error.message.includes('recipient')) {
      throw new Error(
        'EmailJS recipient address is not configured. ' +
        'Please configure your EmailJS service to accept dynamic recipients. ' +
        'In your EmailJS dashboard, go to your service settings and either: ' +
        '1) Set a default "To Email" field, or ' +
        '2) Enable "Accept dynamic recipients" and use {{to_email}} or {{email}} in the "To Email" field.'
      );
    } else if (error.message.includes('Invalid template ID') || error.message.includes('template_id')) {
      throw new Error('Email template is not configured correctly. Please contact support.');
    } else if (error.message.includes('Invalid service ID') || error.message.includes('service_id')) {
      throw new Error('Email service is not configured correctly. Please contact support.');
    } else if (error.message.includes('user_id') || error.message.includes('public key')) {
      throw new Error('Email service authentication failed. Please check your public key.');
    } else if (error.message.includes('400')) {
      throw new Error('Invalid request. Please check your EmailJS configuration.');
    } else if (error.message.includes('422')) {
      throw new Error(`EmailJS validation error: ${error.message}. Please check your EmailJS service and template configuration.`);
    } else if (error.message) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    } else {
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }
};

