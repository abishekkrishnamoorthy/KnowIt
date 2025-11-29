import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Brain, Sparkles } from 'lucide-react';
import { generateQuiz } from '../utils/aiQuizGenerator';
import { storage } from '../utils/storage';

export default function CreateQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    numQuestions: 5,
    mode: 'self',
    expirationDays: 7, // Default 7 days expiration
    expirationHours: 0
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to create a quiz');
      return;
    }
    
    setLoading(true);

    try {
      const questions = await generateQuiz(
        formData.title,
        formData.description,
        formData.difficulty,
        parseInt(formData.numQuestions)
      );

      // Calculate expiration date for challenge mode
      let expiresAt = null;
      if (formData.mode === 'challenge') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(formData.expirationDays || 7));
        expirationDate.setHours(expirationDate.getHours() + parseInt(formData.expirationHours || 0));
        expiresAt = expirationDate.toISOString();
      }

      const quiz = await storage.saveQuiz({
        ...formData,
        questions,
        createdBy: user.id,
        createdByName: user.name,
        expiresAt
      });

      if (formData.mode === 'self') {
        navigate(`/quiz/${quiz.id}`);
      } else {
        navigate(`/quiz/${quiz.id}/share`);
      }
    } catch (error) {
      alert('Failed to generate quiz: ' + error.message);
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create AI Quiz</h1>
          <p className="text-lg text-gray-600">
            Generate a custom quiz using artificial intelligence
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., JavaScript Fundamentals Quiz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brief Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe what this quiz is about..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: level })}
                    className={`px-4 py-3 rounded-lg font-medium capitalize transition-all ${
                      formData.difficulty === level
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                name="numQuestions"
                value={formData.numQuestions}
                onChange={handleChange}
                min="5"
                max="30"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'self' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.mode === 'self'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Self Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mode: 'challenge' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.mode === 'challenge'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Challenge Mode
                </button>
              </div>
            </div>

            {formData.mode === 'challenge' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Link Expiration Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Days</label>
                    <input
                      type="number"
                      name="expirationDays"
                      value={formData.expirationDays}
                      onChange={handleChange}
                      min="0"
                      max="365"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hours</label>
                    <input
                      type="number"
                      name="expirationHours"
                      value={formData.expirationHours}
                      onChange={handleChange}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  After expiration, top 3 scores will be emailed to you automatically.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Quiz...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Generate Quiz with AI</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
