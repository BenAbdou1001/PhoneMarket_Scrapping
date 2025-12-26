import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBarChart2, FiSettings } from 'react-icons/fi';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              PM
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Phone Market</h1>
              <p className="text-xs text-gray-500">Algeria</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiHome size={20} />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              to="/analytics"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/analytics')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiBarChart2 size={20} />
              <span className="font-medium">Analytics</span>
            </Link>

            <Link
              to="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/admin')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiSettings size={20} />
              <span className="font-medium">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
