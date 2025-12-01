/**
 * Test utility for quiz completion email
 * This can be called from browser console or used in development
 */

import { sendLeaderboardEmail } from './emailService';
import { storage } from './storage';

/**
 * Test quiz completion email with sample data
 * @param {string} userEmail - Email to send test email to
 * @param {string} userName - Name of the user
 * @param {string} quizId - Optional quiz ID to get real top scores
 */
export const testQuizCompletionEmail = async (userEmail, userName = 'Test User', quizId = null) => {
  console.log('🧪 Testing Quiz Completion Email...');
  console.log('Email:', userEmail);
  console.log('Name:', userName);
  console.log('Quiz ID:', quizId || 'Using sample data');

  try {
    let topScores = [];
    
    // If quizId is provided, get real top scores
    if (quizId) {
      console.log('📊 Fetching top scores for quiz:', quizId);
      topScores = await storage.getTopScores(quizId, 3);
      console.log('Top scores found:', topScores.length);
    } else {
      // Use sample data
      topScores = [
        {
          userName: 'Alice',
          score: 95,
          correctAnswers: 19,
          totalQuestions: 20,
          timeTaken: 300
        },
        {
          userName: 'Bob',
          score: 85,
          correctAnswers: 17,
          totalQuestions: 20,
          timeTaken: 420
        },
        {
          userName: 'Charlie',
          score: 75,
          correctAnswers: 15,
          totalQuestions: 20,
          timeTaken: 500
        }
      ];
      console.log('Using sample top scores');
    }

    const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const result = await sendLeaderboardEmail({
      userName,
      userEmail,
      quizTitle: 'Test Quiz - Quiz Completion Email',
      quizDifficulty: 'Medium',
      yourScore: 90,
      yourCorrect: 18,
      totalQuestions: 20,
      topScores,
      appUrl
    });

    console.log('✅ Test email sent successfully!');
    console.log('Result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

/**
 * Check if quiz completion email conditions are met
 * @param {object} user - Current user object
 * @param {object} quiz - Quiz object
 */
export const checkQuizCompletionEmailConditions = (user, quiz) => {
  console.log('🔍 Checking Quiz Completion Email Conditions...');
  
  const checks = {
    userExists: !!user,
    userHasId: !!(user && user.id),
    quizExists: !!quiz,
    quizHasCreatedBy: !!(quiz && quiz.createdBy),
    userIsCreator: !!(user && quiz && user.id === quiz.createdBy),
    userHasEmail: !!(user && user.email),
    userHasName: !!(user && user.name)
  };

  console.log('Conditions:', checks);
  
  const allMet = Object.values(checks).every(v => v === true);
  
  if (allMet) {
    console.log('✅ All conditions met - Email should be sent');
  } else {
    console.log('❌ Some conditions not met - Email will NOT be sent');
    console.log('Missing conditions:');
    Object.entries(checks).forEach(([key, value]) => {
      if (!value) {
        console.log(`  - ${key}: ${value}`);
      }
    });
  }

  return { checks, allMet };
};

// Make available in browser console for testing
if (typeof window !== 'undefined') {
  window.testQuizCompletionEmail = testQuizCompletionEmail;
  window.checkQuizCompletionEmailConditions = checkQuizCompletionEmailConditions;
  console.log('📧 Quiz completion email test functions available:');
  console.log('  - window.testQuizCompletionEmail(email, name, quizId?)');
  console.log('  - window.checkQuizCompletionEmailConditions(user, quiz)');
}

