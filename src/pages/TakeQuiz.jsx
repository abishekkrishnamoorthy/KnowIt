import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { isQuizExpired, getTimeRemaining } from '../utils/expirationService';
import { sendLeaderboardEmail } from '../utils/emailService';

export default function TakeQuiz() {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showNameModal, setShowNameModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Check if accessed from within app (via query param or referrer)
  const isFromApp = () => {
    // Check query parameter
    if (searchParams.get('from') === 'app') return true;
    
    // Check referrer - if it's from the same origin, it's from within app
    if (typeof window !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const currentUrl = new URL(window.location.href);
        if (referrerUrl.origin === currentUrl.origin) return true;
      } catch (e) {
        // Invalid referrer URL
      }
    }
    
    return false;
  };

  useEffect(() => {
    const loadQuiz = async () => {
      const loadedQuiz = await storage.getQuizById(quizId);
      if (!loadedQuiz) {
        navigate('/browse-quizzes');
        return;
      }

      // Check if quiz is expired
      // If expired and accessed via direct link (not from app), block access
      // If expired but accessed from within app, allow access
      if (isQuizExpired(loadedQuiz) && loadedQuiz.mode === 'challenge') {
        const fromApp = isFromApp();
        if (!fromApp) {
          // Block access if expired and accessed via direct link
          setIsExpired(true);
          setQuiz(loadedQuiz);
          return;
        }
        // Allow access if from within app (expired quizzes can be taken from app)
      }

      // Calculate time remaining if expiration is set
      if (loadedQuiz.expiresAt) {
        const remaining = getTimeRemaining(loadedQuiz.expiresAt);
        setTimeRemaining(remaining);
      }

      setQuiz(loadedQuiz);

      // Wait for auth to finish loading before checking user status
      if (authLoading) {
        return;
      }

      // Check if this is a challenge mode quiz and user is not authenticated
      if (loadedQuiz.mode === 'challenge' && !user) {
        setShowNameModal(true);
      } else if (loadedQuiz.mode === 'self' && !user) {
        // Self-assessment mode requires authentication
        navigate('/login');
        return;
      }

      // Only initialize quiz if not showing name modal
      if (!(loadedQuiz.mode === 'challenge' && !user)) {
        setTimeLeft(loadedQuiz.questions.length * 60);
        setSelectedAnswers(new Array(loadedQuiz.questions.length).fill(null));
      }
    };
    loadQuiz();
  }, [quizId, navigate, user, authLoading]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    setNameError('');

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setNameError('Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    setShowNameModal(false);
    // Initialize quiz timer and answers after name is provided
    if (quiz) {
      setTimeLeft(quiz.questions.length * 60);
      setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    }
  };

  const handleFinish = useCallback(async () => {
    if (!quiz) return;
    
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
    setScore(finalScore);
    setIsFinished(true);

    try {
      // Determine user info based on authentication status
      let userId, userName;
      if (user) {
        userId = user.id;
        userName = user.name;
      } else {
        // Guest user for challenge mode
        userId = `guest-${Date.now()}`;
        userName = guestName.trim();
      }

      await storage.saveAttempt({
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: userId,
        userName: userName,
        score: finalScore,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        timeTaken: (quiz.questions.length * 60) - timeLeft
      });

      // Send leaderboard email if user completed their own quiz
      console.log('📧 Checking if quiz completion email should be sent...');
      console.log('User:', user ? { id: user.id, name: user.name, email: user.email } : 'Not logged in');
      console.log('Quiz creator:', quiz.createdBy);
      console.log('Is user the creator?', user && user.id === quiz.createdBy);
      
      if (user && user.id === quiz.createdBy) {
        console.log('✅ Conditions met - Sending quiz completion email...');
        try {
          const topScores = await storage.getTopScores(quiz.id, 3);
          console.log('📊 Top scores retrieved:', topScores.length, 'scores');
          const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
          
          console.log('📧 Sending email with params:', {
            userName: user.name,
            userEmail: user.email,
            quizTitle: quiz.title,
            yourScore: finalScore
          });
          
          const emailResult = await sendLeaderboardEmail({
            userName: user.name,
            userEmail: user.email,
            quizTitle: quiz.title,
            quizDifficulty: quiz.difficulty,
            yourScore: finalScore,
            yourCorrect: correctCount,
            totalQuestions: quiz.questions.length,
            topScores,
            appUrl
          });
          
          console.log('✅ Quiz completion email sent successfully!', emailResult);
        } catch (emailError) {
          console.error('❌ Error sending leaderboard email:', emailError);
          console.error('Error details:', {
            message: emailError.message,
            stack: emailError.stack
          });
          // Don't block the UI if email fails
        }
      } else {
        console.log('ℹ️ Quiz completion email NOT sent - Conditions not met:');
        if (!user) console.log('  - User is not logged in');
        if (user && user.id !== quiz.createdBy) {
          console.log('  - User is not the quiz creator');
          console.log('  - User ID:', user.id);
          console.log('  - Quiz creator ID:', quiz.createdBy);
        }
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  }, [quiz, selectedAnswers, user, guestName, timeLeft]);

  useEffect(() => {
    if (!quiz || isFinished || timeLeft <= 0 || showNameModal) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, isFinished, timeLeft, showNameModal, handleFinish]);

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Show loading while checking auth or loading quiz
  if (authLoading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show expired message
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This challenge quiz link has expired. The quiz creator has been notified with the top scores.
            <br />
            <br />
            You can still access this quiz from within the app by browsing quizzes.
          </p>
          <button
            onClick={() => navigate('/browse-quizzes')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Other Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Show name modal for challenge mode guests
  if (showNameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Your Name to Start</h1>
            <p className="text-gray-600">
              Please enter your name to participate in this challenge quiz
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setNameError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  nameError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
                autoFocus
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start Quiz
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const displayName = user?.name || guestName.trim();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Great job{displayName ? `, ${displayName}` : ''}!
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-2">{score}%</div>
            <p className="text-gray-600 text-lg">
              You got {selectedAnswers.filter((ans, i) => ans === quiz.questions[i].correctAnswer).length} out of {quiz.questions.length} correct
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Time Taken</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(((quiz.questions.length * 60) - timeLeft) / 60)}:{String(((quiz.questions.length * 60) - timeLeft) % 60).padStart(2, '0')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Difficulty</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{quiz.difficulty}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View Leaderboard
            </button>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {user ? (
              <button
                onClick={() => navigate('/browse-quizzes')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Exit Quiz</span>
              </button>
            ) : (
              <div className="text-sm text-gray-600">
                Guest: {guestName.trim()}
              </div>
            )}
            <div className="flex items-center space-x-2 text-lg font-medium">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className={timeLeft < 60 ? 'text-red-600' : 'text-gray-900'}>
                {minutes}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            <span className="text-gray-600 font-medium">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedAnswers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
