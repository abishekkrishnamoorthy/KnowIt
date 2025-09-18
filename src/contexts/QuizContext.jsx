import React, { createContext, useContext, useReducer } from 'react';

const QuizContext = createContext();

const initialState = {
  quizConfig: {
    topic: '',
    difficulty: 'medium',
    numQuestions: 5
  },
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  score: 0,
  isQuizCompleted: false,
  loading: false,
  error: null
};

function quizReducer(state, action) {
  switch (action.type) {
    case 'SET_QUIZ_CONFIG':
      return {
        ...state,
        quizConfig: action.payload
      };
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'ANSWER_QUESTION':
      const newUserAnswers = [...state.userAnswers];
      newUserAnswers[state.currentQuestionIndex] = action.payload;
      return {
        ...state,
        userAnswers: newUserAnswers
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1
      };
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1)
      };
    case 'COMPLETE_QUIZ':
      const score = state.questions.reduce((acc, question, index) => {
        return acc + (state.userAnswers[index] === question.correctAnswer ? 1 : 0);
      }, 0);
      return {
        ...state,
        score,
        isQuizCompleted: true
      };
    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}