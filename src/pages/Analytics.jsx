import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { storage } from '../utils/storage';

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userAttempts, setUserAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    avgScore: 0,
    bestScore: 0,
    totalTimeSpent: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const loadAnalytics = async () => {
      const allAttempts = await storage.getAttempts();
      const attempts = allAttempts.filter(a => a.userId === user.id);
      setUserAttempts(attempts);

      if (attempts.length > 0) {
        const avgScore = Math.round(
          attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
        );
        const bestScore = Math.max(...attempts.map(a => a.score));
        const totalTime = attempts.reduce((sum, a) => sum + a.timeTaken, 0);

        setStats({
          totalAttempts: attempts.length,
          avgScore,
          bestScore,
          totalTimeSpent: totalTime
        });
      }
    };
    loadAnalytics();
  }, [user]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Analytics</h1>
          <p className="text-lg text-gray-600">
            Track your progress and performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Best Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.bestScore}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Time Spent</p>
            <p className="text-3xl font-bold text-gray-900">
              {Math.floor(stats.totalTimeSpent / 60)}m
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz History</h2>

          {userAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">No quiz attempts yet</p>
              <button
                onClick={() => navigate('/browse-quizzes')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Take Your First Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{attempt.quizTitle}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.timestamp).toLocaleDateString()} at{' '}
                      {new Date(attempt.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(attempt.score)}`}>
                        {attempt.score}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Correct</p>
                      <p className="text-xl font-bold text-gray-900">
                        {attempt.correctAnswers}/{attempt.totalQuestions}
                      </p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm text-gray-600 mb-1">Time</p>
                      <p className="text-xl font-bold text-gray-900">
                        {Math.floor(attempt.timeTaken / 60)}:{String(attempt.timeTaken % 60).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
