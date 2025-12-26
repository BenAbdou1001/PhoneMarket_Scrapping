import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PhoneDetail from './pages/PhoneDetail';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/phone/:id" element={<PhoneDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 Algerian Phone Market Scraper. All rights reserved.</p>
            <p className="text-sm text-gray-400 mt-2">
              Data aggregated from Ouedkniss, Jumia Algeria, and Facebook Marketplace
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
