import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, PlusCircle, BookOpen, Trophy, BarChart3, Settings, User } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: PlusCircle,
      title: 'Create Quiz',
      description: 'Generate AI-powered quizzes on any topic',
      color: 'from-blue-500 to-blue-600',
      path: '/create-quiz'
    },
    {
      icon: BookOpen,
      title: 'Take Quiz',
      description: 'Test your knowledge with existing quizzes',
      color: 'from-green-500 to-green-600',
      path: '/browse-quizzes'
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'View top scorers and rankings',
      color: 'from-yellow-500 to-orange-500',
      path: '/leaderboard'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your progress and performance',
      color: 'from-purple-500 to-purple-600',
      path: '/analytics'
    }
  ];

  if (user?.role === 'admin') {
    features.push({
      icon: Settings,
      title: 'Admin Panel',
      description: 'Manage quizzes and view all data',
      color: 'from-red-500 to-red-600',
      path: '/admin'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">KnowIt</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg text-gray-600">
            What would you like to do today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(feature.path)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden p-8 text-left"
              >
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
