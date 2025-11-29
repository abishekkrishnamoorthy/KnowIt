import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2, Share2, Clock } from 'lucide-react';
import { storage } from '../utils/storage';
import { getTimeRemaining } from '../utils/expirationService';

export default function ShareQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const loadQuiz = async () => {
      const loadedQuiz = await storage.getQuizById(quizId);
      if (loadedQuiz) {
        setQuiz(loadedQuiz);
        if (loadedQuiz.expiresAt) {
          const remaining = getTimeRemaining(loadedQuiz.expiresAt);
          setTimeRemaining(remaining);
        }
      }
    };
    loadQuiz();
  }, [quizId]);

  // Update time remaining every minute
  useEffect(() => {
    if (!quiz || !quiz.expiresAt) return;
    
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(quiz.expiresAt);
      setTimeRemaining(remaining);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [quiz]);

  const handleCopy = () => {
    // Fix for Vercel: Use environment variable or construct URL safely
    const getOrigin = () => {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return import.meta.env.VITE_APP_URL || '';
    };
    const shareLink = `${getOrigin()}/quiz/${quizId}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mb-4">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Created!</h1>
          <p className="text-lg text-gray-600">
            Share this quiz with others to challenge them
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="capitalize">{quiz.difficulty} difficulty</span>
              <span>•</span>
              <span>{quiz.questions?.length || 0} questions</span>
              {quiz.topic && (
                <>
                  <span>•</span>
                  <span className="capitalize">{quiz.topic}</span>
                </>
              )}
            </div>
            {quiz.description && (
              <p className="text-gray-600 mt-2">{quiz.description}</p>
            )}
            {quiz.expiresAt && timeRemaining && (
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  Link expires in: {timeRemaining.expired ? (
                    <span className="text-red-600 font-semibold">Expired</span>
                  ) : (
                    <span className="font-semibold">
                      {timeRemaining.days > 0 && `${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''} `}
                      {timeRemaining.hours > 0 && `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''} `}
                      {timeRemaining.minutes > 0 && `${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? 's' : ''}`}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={typeof window !== 'undefined' 
                  ? `${window.location.origin}/quiz/${quizId}`
                  : `${import.meta.env.VITE_APP_URL || ''}/quiz/${quizId}`}
                readOnly
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
              />
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/quiz/${quizId}`)}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Take Quiz Now
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
