import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Award, Search, X, BookOpen, Clock } from 'lucide-react';
import { storage } from '../utils/storage';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [quizzes, setQuizzes] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const quizzesData = await storage.getQuizzes();
      setAllQuizzes(quizzesData);
      setQuizzes(quizzesData);
      setFilteredQuizzes(quizzesData);
      await loadLeaderboard('all');
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!quizSearchQuery.trim()) {
      setFilteredQuizzes(allQuizzes);
      return;
    }

    const query = quizSearchQuery.toLowerCase().trim();
    const filtered = allQuizzes.filter((quiz) => {
      const titleMatch = quiz.title?.toLowerCase().includes(query);
      const descriptionMatch = quiz.description?.toLowerCase().includes(query);
      const topicMatch = quiz.topic?.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || topicMatch;
    });
    setFilteredQuizzes(filtered);
  }, [quizSearchQuery, allQuizzes]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeaderboard(leaderboardData);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = leaderboardData.filter((attempt) => {
      const userNameMatch = attempt.userName?.toLowerCase().includes(query);
      const quizTitleMatch = attempt.quizTitle?.toLowerCase().includes(query);
      return userNameMatch || quizTitleMatch;
    });
    setFilteredLeaderboard(filtered);
  }, [searchQuery, leaderboardData]);

  const loadLeaderboard = async (quizId) => {
    const data = await storage.getLeaderboard(quizId === 'all' ? null : quizId);
    setLeaderboardData(data);
    setFilteredLeaderboard(data);
    setSelectedQuiz(quizId);
    setSearchQuery(''); // Clear search when changing quiz filter
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-orange-600" />;
      default: return <span className="text-gray-600 font-bold">{index + 1}</span>;
    }
  };

  const getRankBg = (index) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 1: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 2: return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default: return 'bg-white border-gray-200';
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-lg text-gray-600">
            Top performers across all quizzes
          </p>
        </div>

        {/* Quiz Cards Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Quiz
          </label>
          
          {/* Quiz Search Bar */}
          <div className="relative max-w-2xl mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={quizSearchQuery}
              onChange={(e) => setQuizSearchQuery(e.target.value)}
              placeholder="Search quizzes by title, description, or topic..."
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {quizSearchQuery && (
              <button
                onClick={() => setQuizSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* All Quizzes Card */}
            <div
              onClick={() => loadLeaderboard('all')}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-4 cursor-pointer border-2 ${
                selectedQuiz === 'all'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${selectedQuiz === 'all' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                  <Trophy className={`w-5 h-5 ${selectedQuiz === 'all' ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">All Quizzes</h3>
                  <p className="text-xs text-gray-500">View all attempts</p>
                </div>
              </div>
            </div>

            {/* Individual Quiz Cards */}
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => loadLeaderboard(quiz.id)}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-4 cursor-pointer border-2 ${
                  selectedQuiz === quiz.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm flex-1 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 text-xs mt-2">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{quiz.questions?.length || 0} questions</span>
                </div>
              </div>
            ))}
          </div>
          
          {filteredQuizzes.length === 0 && allQuizzes.length > 0 && (
            <div className="text-center py-8 bg-white rounded-xl shadow-lg mt-4">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No quizzes found</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your search query</p>
              <button
                onClick={() => setQuizSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name or quiz title..."
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {filteredLeaderboard.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {searchQuery ? (
              <>
                <p className="text-xl text-gray-600 mb-2">No results found</p>
                <p className="text-gray-500 mb-6">Try adjusting your search query</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <p className="text-xl text-gray-600 mb-6">No results yet</p>
                <button
                  onClick={() => navigate('/browse-quizzes')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Take a Quiz
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeaderboard.map((attempt, index) => (
              <div
                key={attempt.id}
                className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all hover:shadow-lg ${getRankBg(index)}`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index)}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{attempt.userName}</h3>
                    <p className="text-sm text-gray-600">{attempt.quizTitle}</p>
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
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-gray-600">Time</p>
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
  );
}
