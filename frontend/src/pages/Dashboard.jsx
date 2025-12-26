import { useState, useEffect } from 'react';
import { FiSmartphone, FiShoppingCart, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import PhoneCard from '../components/PhoneCard';
import { phoneAPI, analyticsAPI } from '../services/api';

function Dashboard() {
  const [phones, setPhones] = useState([]);
  const [stats, setStats] = useState(null);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    marketplace: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    availability: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPhones();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [statsData, brandsData, rangeData] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        phoneAPI.getBrands(),
        phoneAPI.getPriceRange()
      ]);

      setStats(statsData.data);
      setBrands(brandsData.data);
      setPriceRange(rangeData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPhones = async () => {
    setLoading(true);
    try {
      const response = await phoneAPI.getPhones(filters);
      setPhones(response.data);
    } catch (error) {
      console.error('Error loading phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, search: query, offset: 0 }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Algerian Phone Market
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Compare prices across Ouedkniss, Jumia, and Facebook Marketplace
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FiSmartphone className="text-primary-600" size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Total Phones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalPhones)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiShoppingCart className="text-green-600" size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalListings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FiDollarSign className="text-orange-600" size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Avg Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.avgPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiTrendingUp className="text-blue-600" size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Recent Updates</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.recentUpdates)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            brands={brands}
            priceRange={priceRange}
          />
        </div>

        {/* Phone Listings */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="loading-skeleton h-48 mb-4"></div>
                  <div className="loading-skeleton h-6 mb-2"></div>
                  <div className="loading-skeleton h-4 mb-4"></div>
                  <div className="loading-skeleton h-8"></div>
                </div>
              ))}
            </div>
          ) : phones.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{phones.length}</span> phones
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {phones.map((phone) => (
                  <PhoneCard key={phone.id} phone={phone} />
                ))}
              </div>

              {phones.length >= filters.limit && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    className="btn btn-primary"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No phones found matching your criteria</p>
              <button
                onClick={() => handleFilterChange({
                  brand: '',
                  category: '',
                  marketplace: '',
                  condition: '',
                  minPrice: '',
                  maxPrice: '',
                  availability: '',
                  search: ''
                })}
                className="btn btn-primary mt-4"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
