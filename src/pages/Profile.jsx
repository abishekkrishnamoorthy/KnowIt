import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Trash2, 
  Edit,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { storage } from '../utils/storage';
import { isQuizExpired, getTimeRemaining } from '../utils/expirationService';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [attendedQuizzes, setAttendedQuizzes] = useState([]);
  const [userAttempts, setUserAttempts] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes', 'attended', 'leaderboard'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfileData();
  }, [user, navigate]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const [quizzes, attempts] = await Promise.all([
        storage.getQuizzesByCreator(user.id),
        storage.getAttemptsByUser(user.id)
      ]);

      setUserQuizzes(quizzes);
      setUserAttempts(attempts);

      // Get unique quizzes user has attended
      const quizIds = [...new Set(attempts.map(a => a.quizId))];
      const attended = await Promise.all(
        quizIds.map(id => storage.getQuizById(id))
      );
      setAttendedQuizzes(attended.filter(q => q !== null));
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { deleteAccount } = useAuth();

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account: ' + error.message);
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getModeBadge = (mode) => {
    return mode === 'challenge' 
      ? { text: 'Challenge', color: 'bg-blue-100 text-blue-700' }
      : { text: 'Self Assessment', color: 'bg-purple-100 text-purple-700' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const personalLeaderboard = userAttempts
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.timestamp) - new Date(b.timestamp);
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{user.email}</span>
                  </div>
                  {user.createdAt && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      Administrator
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{userQuizzes.length}</div>
            <div className="text-sm text-gray-600">Quizzes Created</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{attendedQuizzes.length}</div>
            <div className="text-sm text-gray-600">Quizzes Attended</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {userAttempts.length > 0 
                ? Math.max(...userAttempts.map(a => a.score))
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Best Score</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{userAttempts.length}</div>
            <div className="text-sm text-gray-600">Total Attempts</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'quizzes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Quizzes ({userQuizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('attended')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'attended'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Attended Quizzes ({attendedQuizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'leaderboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Leaderboard
            </button>
          </div>

          {/* My Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div>
              {userQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-6">You haven't created any quizzes yet</p>
                  <button
                    onClick={() => navigate('/create-quiz')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userQuizzes.map((quiz) => {
                    const expired = isQuizExpired(quiz);
                    const modeBadge = getModeBadge(quiz.mode);
                    return (
                      <div
                        key={quiz.id}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex-1 mr-2 line-clamp-2">
                            {quiz.title}
                          </h3>
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${modeBadge.color}`}>
                              {modeBadge.text}
                            </span>
                          </div>
                        </div>

                        {quiz.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
                        )}

                        <div className="flex items-center text-gray-600 text-sm mb-4">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{quiz.questions?.length || 0} questions</span>
                        </div>

                        {quiz.expiresAt && (
                          <div className="mb-4">
                            {expired ? (
                              <div className="flex items-center text-red-600 text-sm">
                                <XCircle className="w-4 h-4 mr-2" />
                                <span>Expired</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-blue-600 text-sm">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>Expires: {new Date(quiz.expiresAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/quiz/${quiz.id}?from=app`)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Take Quiz
                          </button>
                          {quiz.mode === 'challenge' && (
                            <button
                              onClick={() => navigate(`/quiz/${quiz.id}/share`)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                            >
                              Share
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Attended Quizzes Tab */}
          {activeTab === 'attended' && (
            <div>
              {attendedQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-6">You haven't attended any quizzes yet</p>
                  <button
                    onClick={() => navigate('/browse-quizzes')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse Quizzes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendedQuizzes.map((quiz) => {
                    const quizAttempts = userAttempts.filter(a => a.quizId === quiz.id);
                    const bestAttempt = quizAttempts.reduce((best, current) => 
                      current.score > best.score ? current : best, quizAttempts[0]
                    );
                    return (
                      <div
                        key={quiz.id}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="capitalize">{quiz.difficulty}</span>
                              <span>•</span>
                              <span>{quiz.questions?.length || 0} questions</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{bestAttempt?.score || 0}%</div>
                            <div className="text-xs text-gray-500">Best Score</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Attempted {quizAttempts.length} time{quizAttempts.length !== 1 ? 's' : ''}
                          </div>
                          <button
                            onClick={() => navigate(`/quiz/${quiz.id}?from=app`)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Personal Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              {personalLeaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-6">No attempts yet</p>
                  <button
                    onClick={() => navigate('/browse-quizzes')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Take a Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalLeaderboard.map((attempt, index) => {
                    const rank = index + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                    return (
                      <div
                        key={attempt.id}
                        className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                          rank <= 3
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 flex items-center justify-center">
                            {medal ? (
                              <span className="text-2xl">{medal}</span>
                            ) : (
                              <span className="text-xl font-bold text-gray-600">{rank}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{attempt.quizTitle}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(attempt.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Score</p>
                            <p className="text-2xl font-bold text-gray-900">{attempt.score}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Correct</p>
                            <p className="text-xl font-bold text-gray-900">
                              {attempt.correctAnswers}/{attempt.totalQuestions}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                Delete Account?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                This action cannot be undone. All your quizzes, attempts, and data will be permanently deleted.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

