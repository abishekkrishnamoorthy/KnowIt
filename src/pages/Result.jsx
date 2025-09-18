import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';

export default function Result() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuiz();
  const { questions, userAnswers, score, quizConfig, isQuizCompleted } = state;

  useEffect(() => {
    // Redirect to home if quiz is not completed
    if (!isQuizCompleted || questions.length === 0) {
      navigate('/');
    }
  }, [isQuizCompleted, questions, navigate]);

  if (!isQuizCompleted || questions.length === 0) {
    return null;
  }

  const percentage = Math.round((score / questions.length) * 100);
  const correctAnswers = [];
  const incorrectAnswers = [];

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctAnswers.push({ question, userAnswer, index: index + 1 });
    } else {
      incorrectAnswers.push({
        question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        index: index + 1
      });
    }
  });

  const handleRetry = () => {
    dispatch({ type: 'RESET_QUIZ' });
    navigate('/');
  };

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (percentage >= 90) return 'Excellent! 🎉';
    if (percentage >= 80) return 'Great job! 👏';
    if (percentage >= 70) return 'Good work! 👍';
    if (percentage >= 60) return 'Not bad! 🙂';
    return 'Keep practicing! 💪';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
        <p className="text-gray-600">{quizConfig.topic} - {quizConfig.difficulty} level</p>
      </div>

      {/* Score Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
            {percentage}%
          </div>
          <div className="text-xl text-gray-700 mb-2">
            {score} out of {questions.length} correct
          </div>
          <div className="text-lg font-medium text-gray-600">
            {getScoreMessage()}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Correct Answers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            Correct Answers ({correctAnswers.length})
          </h2>
          <div className="space-y-3">
            {correctAnswers.length > 0 ? (
              correctAnswers.map((item) => (
                <div key={item.index} className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Question {item.index}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {item.question.question}
                  </div>
                  <div className="text-sm font-medium text-green-700">
                    ✓ {item.userAnswer}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No correct answers</p>
            )}
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            Incorrect Answers ({incorrectAnswers.length})
          </h2>
          <div className="space-y-3">
            {incorrectAnswers.length > 0 ? (
              incorrectAnswers.map((item) => (
                <div key={item.index} className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Question {item.index}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {item.question.question}
                  </div>
                  <div className="text-sm text-red-700 mb-1">
                    ✗ Your answer: {item.userAnswer || 'No answer'}
                  </div>
                  <div className="text-sm text-green-700">
                    ✓ Correct answer: {item.correctAnswer}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">All answers were correct!</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Take Another Quiz
        </button>
        <Link
          to="/"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}