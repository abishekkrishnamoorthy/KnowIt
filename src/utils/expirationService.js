import { storage } from './storage';
import { 
  sendExpirationEmail as sendExpirationEmailService,
  sendNearExpirationEmail,
  sendLeaderboardEmail
} from './emailService';
import { ref, get, set } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Send top 3 scores email to quiz creator when link expires
 */
export const sendExpirationEmail = async (quiz, topScores) => {
  try {
    // Get creator email from users collection
    const userRef = ref(database, `users/${quiz.createdBy}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      console.error('Quiz creator not found:', quiz.createdBy);
      return { success: false, message: 'Creator not found' };
    }

    const creator = userSnapshot.val();
    const creatorEmail = creator.email;
    const creatorName = creator.name || 'Quiz Creator';

    // Format top scores
    let scoresText = '';
    if (topScores.length === 0) {
      scoresText = 'No attempts were made on this quiz.';
    } else {
      scoresText = topScores.map((score, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        return `${medal} ${rank}. ${score.userName} - ${score.score}% (${score.correctAnswers}/${score.totalQuestions} correct)`;
      }).join('\n');
    }

    // Create email content
    const emailContent = {
      name: creatorName,
      email: creatorEmail,
      otp: 'EXPIRED' // Not an OTP, but we'll use a custom template
    };

    // Send expiration email via EmailJS
    const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    
    await sendExpirationEmailService({
      creatorName,
      creatorEmail,
      quizTitle: quiz.title,
      quizDifficulty: quiz.difficulty,
      expirationDate: new Date(quiz.expiresAt).toLocaleString(),
      topScores,
      totalAttempts: topScores.length,
      appUrl
    });

    // Mark email as sent
    await storage.markExpirationEmailSent(quiz.id);

    return { success: true, message: 'Expiration email sent' };
  } catch (error) {
    console.error('Error sending expiration email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check and process expired quizzes
 */
export const checkAndProcessExpiredQuizzes = async () => {
  try {
    const expiredQuizzes = await storage.getExpiredQuizzes();
    
    for (const quiz of expiredQuizzes) {
      const topScores = await storage.getTopScores(quiz.id, 3);
      await sendExpirationEmail(quiz, topScores);
    }

    return { processed: expiredQuizzes.length };
  } catch (error) {
    console.error('Error processing expired quizzes:', error);
    return { processed: 0, error: error.message };
  }
};

/**
 * Check if a quiz is expired
 */
export const isQuizExpired = (quiz) => {
  if (!quiz || !quiz.expiresAt) return false;
  const now = new Date().getTime();
  const expiresAt = new Date(quiz.expiresAt).getTime();
  return expiresAt <= now;
};

/**
 * Get time remaining until expiration
 */
export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const remaining = expires - now;
  
  if (remaining <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return { expired: false, days, hours, minutes };
};

/**
 * Check and send near-expiration emails (24 hours before expiration)
 */
export const checkAndSendNearExpirationEmails = async () => {
  try {
    const quizzes = await storage.getQuizzes();
    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    const nearExpirationQuizzes = quizzes.filter(quiz => {
      if (!quiz.expiresAt || quiz.mode !== 'challenge') return false;
      if (quiz.nearExpirationEmailSent) return false; // Already sent
      
      const expiresAt = new Date(quiz.expiresAt).getTime();
      const timeUntilExpiration = expiresAt - now;
      
      // Check if between 24-25 hours before expiration
      return timeUntilExpiration > 0 && timeUntilExpiration <= oneDayInMs && timeUntilExpiration > (oneDayInMs - 60 * 60 * 1000);
    });

    for (const quiz of nearExpirationQuizzes) {
      const userRef = ref(database, `users/${quiz.createdBy}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) continue;

      const creator = userSnapshot.val();
      const topScores = await storage.getTopScores(quiz.id, 3);
      const timeRemaining = getTimeRemaining(quiz.expiresAt);
      
      const expirationTime = timeRemaining.expired 
        ? 'Expired' 
        : `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}, ${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? 's' : ''}`;

      const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

      await sendNearExpirationEmail({
        creatorName: creator.name || 'Quiz Creator',
        creatorEmail: creator.email,
        quizTitle: quiz.title,
        quizDifficulty: quiz.difficulty,
        expirationDate: new Date(quiz.expiresAt).toLocaleString(),
        expirationTime,
        topScores,
        appUrl
      });

      // Mark as sent
      const quizRef = ref(database, `quizzes/${quiz.id}`);
      const snapshot = await get(quizRef);
      if (snapshot.exists()) {
        await set(quizRef, {
          ...snapshot.val(),
          nearExpirationEmailSent: true
        });
      }
    }

    return { processed: nearExpirationQuizzes.length };
  } catch (error) {
    console.error('Error processing near-expiration emails:', error);
    return { processed: 0, error: error.message };
  }
};

