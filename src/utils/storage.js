import { ref, set, get, remove } from 'firebase/database';
import { database } from '../config/firebase';

export const storage = {
  getQuizzes: async () => {
    try {
      const quizzesRef = ref(database, 'quizzes');
      const snapshot = await get(quizzesRef);
      
      if (snapshot.exists()) {
        const quizzesData = snapshot.val();
        return Object.values(quizzesData);
      }
      return [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  },

  saveQuiz: async (quiz) => {
    try {
      const quizId = Date.now().toString();
      // Fix for Vercel: Use environment variable or construct URL safely
      const getOrigin = () => {
        if (typeof window !== 'undefined') {
          return window.location.origin;
        }
        // Fallback for SSR or when window is not available
        return import.meta.env.VITE_APP_URL || 'https://your-app.vercel.app';
      };
      
      const newQuiz = {
        ...quiz,
        id: quizId,
        createdAt: new Date().toISOString(),
        shareLink: `${getOrigin()}/quiz/${quizId}`,
        // Add expiration time for challenge mode
        expiresAt: quiz.expiresAt || null,
        expirationEmailSent: false, // Track if expiration email was sent
        nearExpirationEmailSent: false // Track if near-expiration email was sent
      };

      const quizRef = ref(database, `quizzes/${quizId}`);
      await set(quizRef, newQuiz);
      return newQuiz;
    } catch (error) {
      console.error('Error saving quiz:', error);
      throw error;
    }
  },

  getQuizById: async (id) => {
    try {
      const quizRef = ref(database, `quizzes/${id}`);
      const snapshot = await get(quizRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  },

  deleteQuiz: async (id) => {
    try {
      const quizRef = ref(database, `quizzes/${id}`);
      await remove(quizRef);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  getAttempts: async () => {
    try {
      const attemptsRef = ref(database, 'attempts');
      const snapshot = await get(attemptsRef);
      
      if (snapshot.exists()) {
        const attemptsData = snapshot.val();
        return Object.values(attemptsData);
      }
      return [];
    } catch (error) {
      console.error('Error fetching attempts:', error);
      return [];
    }
  },

  saveAttempt: async (attempt) => {
    try {
      const attemptId = Date.now().toString();
      const newAttempt = {
        ...attempt,
        id: attemptId,
        timestamp: new Date().toISOString()
      };

      const attemptRef = ref(database, `attempts/${attemptId}`);
      await set(attemptRef, newAttempt);
      return newAttempt;
    } catch (error) {
      console.error('Error saving attempt:', error);
      throw error;
    }
  },

  getLeaderboard: async (quizId = null) => {
    try {
      const attempts = await storage.getAttempts();
      let filtered = attempts;

      if (quizId) {
        filtered = attempts.filter(a => a.quizId === quizId);
      }

      return filtered
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // Get top N scores for a quiz
  getTopScores: async (quizId, limit = 3) => {
    try {
      const leaderboard = await storage.getLeaderboard(quizId);
      return leaderboard.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top scores:', error);
      return [];
    }
  },

  // Mark expiration email as sent
  markExpirationEmailSent: async (quizId) => {
    try {
      const quizRef = ref(database, `quizzes/${quizId}`);
      const snapshot = await get(quizRef);
      if (snapshot.exists()) {
        await set(quizRef, {
          ...snapshot.val(),
          expirationEmailSent: true
        });
      }
    } catch (error) {
      console.error('Error marking expiration email sent:', error);
      throw error;
    }
  },

  // Get expired quizzes that haven't had email sent
  getExpiredQuizzes: async () => {
    try {
      const quizzes = await storage.getQuizzes();
      const now = new Date().getTime();
      return quizzes.filter(quiz => {
        if (!quiz.expiresAt) return false;
        if (quiz.expirationEmailSent) return false;
        const expiresAt = new Date(quiz.expiresAt).getTime();
        return expiresAt <= now;
      });
    } catch (error) {
      console.error('Error fetching expired quizzes:', error);
      return [];
    }
  },

  // Get quizzes created by a specific user
  getQuizzesByCreator: async (userId) => {
    try {
      const quizzes = await storage.getQuizzes();
      return quizzes.filter(quiz => quiz.createdBy === userId);
    } catch (error) {
      console.error('Error fetching user quizzes:', error);
      return [];
    }
  },

  // Get attempts by a specific user
  getAttemptsByUser: async (userId) => {
    try {
      const attempts = await storage.getAttempts();
      return attempts.filter(attempt => attempt.userId === userId);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      return [];
    }
  },

  // Get unique quizzes that user has attempted
  getAttendedQuizzes: async (userId) => {
    try {
      const attempts = await storage.getAttemptsByUser(userId);
      const quizIds = [...new Set(attempts.map(a => a.quizId))];
      const quizzes = await Promise.all(
        quizIds.map(id => storage.getQuizById(id))
      );
      return quizzes.filter(q => q !== null);
    } catch (error) {
      console.error('Error fetching attended quizzes:', error);
      return [];
    }
  },

  // Delete user account and all related data
  deleteUserAccount: async (userId) => {
    try {
      // Delete user from users collection
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);

      // Delete user's quizzes
      const userQuizzes = await storage.getQuizzesByCreator(userId);
      for (const quiz of userQuizzes) {
        await storage.deleteQuiz(quiz.id);
      }

      // Delete user's attempts
      const userAttempts = await storage.getAttemptsByUser(userId);
      for (const attempt of userAttempts) {
        const attemptRef = ref(database, `attempts/${attempt.id}`);
        await remove(attemptRef);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
};
