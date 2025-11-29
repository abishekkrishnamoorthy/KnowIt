import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Target, Search, X } from 'lucide-react';
import { storage } from '../utils/storage';

export default function BrowseQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allQuizzes, setAllQuizzes] = useState([]);

  useEffect(() => {
    const loadQuizzes = async () => {
      const quizzesData = await storage.getQuizzes();
      // Filter to show only challenge mode quizzes (self-assessment are private to creator)
      const challengeQuizzes = quizzesData.filter(quiz => quiz.mode === 'challenge');
      setAllQuizzes(challengeQuizzes);
      setQuizzes(challengeQuizzes);
    };
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setQuizzes(allQuizzes);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allQuizzes.filter((quiz) => {
      const titleMatch = quiz.title?.toLowerCase().includes(query);
      const descriptionMatch = quiz.description?.toLowerCase().includes(query);
      const topicMatch = quiz.topic?.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || topicMatch;
    });
    setQuizzes(filtered);
  }, [searchQuery, allQuizzes]);

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Quizzes</h1>
          <p className="text-lg text-gray-600 mb-6">
            Choose a quiz to test your knowledge
          </p>

          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes by title, description, or topic..."
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

        {allQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-6">No quizzes available yet</p>
            <button
              onClick={() => navigate('/create-quiz')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Quiz
            </button>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No quizzes found</p>
            <p className="text-gray-500 mb-6">Try adjusting your search query</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.id}?from=app`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex-1 mr-2">
                    {quiz.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {quiz.description && (
                    <div className="text-gray-600 text-sm line-clamp-2">
                      {quiz.description}
                    </div>
                  )}
                  {!quiz.description && quiz.topic && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Target className="w-4 h-4 mr-2" />
                      <span className="capitalize">{quiz.topic}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created by {quiz.createdByName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
