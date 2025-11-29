import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Users, BookOpen, TrendingUp } from 'lucide-react';
import { storage } from '../utils/storage';

export default function Admin() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalAttempts: 0,
    avgScore: 0,
    totalUsers: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedQuizzes = await storage.getQuizzes();
    const loadedAttempts = await storage.getAttempts();

    setQuizzes(loadedQuizzes);
    setAttempts(loadedAttempts);

    const avgScore = loadedAttempts.length > 0
      ? Math.round(loadedAttempts.reduce((sum, a) => sum + a.score, 0) / loadedAttempts.length)
      : 0;

    const uniqueUsers = new Set(loadedAttempts.map(a => a.userId)).size;

    setStats({
      totalQuizzes: loadedQuizzes.length,
      totalAttempts: loadedAttempts.length,
      avgScore,
      totalUsers: uniqueUsers
    });
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      await storage.deleteQuiz(quizId);
      loadData();
    }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-lg text-gray-600">
            Manage quizzes and view platform analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgScore}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Quizzes</h2>

          {quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No quizzes created yet
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      {quiz.topic && (
                        <>
                          <span className="capitalize">{quiz.topic}</span>
                          <span>•</span>
                        </>
                      )}
                      <span className="capitalize">{quiz.difficulty}</span>
                      <span>•</span>
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>•</span>
                      <span>Created by {quiz.createdByName}</span>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Attempts</h2>

          {attempts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No attempts recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{attempt.userName}</h3>
                    <p className="text-sm text-gray-600">{attempt.quizTitle}</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-lg font-bold text-gray-900">{attempt.score}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Result</p>
                      <p className="text-lg font-bold text-gray-900">
                        {attempt.correctAnswers}/{attempt.totalQuestions}
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
