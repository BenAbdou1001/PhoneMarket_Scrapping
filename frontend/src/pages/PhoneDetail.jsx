import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import MarketplaceBadge from '../components/MarketplaceBadge';
import { phoneAPI } from '../services/api';

function PhoneDetail() {
  const { id } = useParams();
  const [phone, setPhone] = useState(null);
  const [listings, setListings] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhoneDetails();
  }, [id]);

  const loadPhoneDetails = async () => {
    setLoading(true);
    try {
      const [phoneData, listingsData, historyData] = await Promise.all([
        phoneAPI.getPhoneById(id),
        phoneAPI.getPhoneListings(id),
        phoneAPI.getPriceHistory(id, 30)
      ]);

      setPhone(phoneData.data);
      setListings(listingsData.data);
      setPriceHistory(historyData.data);
    } catch (error) {
      console.error('Error loading phone details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const chartData = priceHistory.map(item => ({
    date: format(new Date(item.recorded_date), 'MMM dd'),
    price: parseFloat(item.price),
    marketplace: item.marketplace_name
  }));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="loading-skeleton h-96"></div>
        </div>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-600">Phone not found</p>
        <Link to="/" className="btn btn-primary mt-4">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6">
          <FiArrowLeft />
          <span>Back to Home</span>
        </Link>

        {/* Phone Details */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image */}
            <div>
              {phone.image_url ? (
                <img
                  src={phone.image_url}
                  alt={`${phone.brand} ${phone.model}`}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{phone.brand}</h1>
                <p className="text-xl text-gray-600">{phone.model}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <MarketplaceBadge marketplace={phone.marketplace_name} />
                <span className={`badge badge-${phone.condition}`}>
                  {phone.condition.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-3xl font-bold text-primary-600">{formatPrice(phone.price)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-lg font-medium capitalize">{phone.category.replace('_', ' ')}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="text-lg font-medium capitalize">
                    {phone.availability_status.replace('_', ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-medium">
                    {format(new Date(phone.scraped_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {phone.source_url && (
                <a
                  href={phone.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <span>View on {phone.marketplace_name}</span>
                  <FiExternalLink />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        {chartData.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Price History (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* All Listings */}
        {listings.length > 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              All Listings ({listings.length})
            </h2>
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <MarketplaceBadge marketplace={listing.marketplace_name} />
                    <div>
                      <p className="font-medium">{formatPrice(listing.price)}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {listing.condition.replace('_', ' ')} • {listing.availability_status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {listing.source_url && (
                    <a
                      href={listing.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <FiExternalLink />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhoneDetail;
