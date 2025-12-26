import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../services/api';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function Analytics() {
  const [marketplaceStats, setMarketplaceStats] = useState([]);
  const [trending, setTrending] = useState([]);
  const [brandDistribution, setBrandDistribution] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [marketStats, trendingData, brandDist, catDist] = await Promise.all([
        analyticsAPI.getMarketplaceStats(),
        analyticsAPI.getTrending(10),
        analyticsAPI.getBrandDistribution(),
        analyticsAPI.getCategoryDistribution()
      ]);

      setMarketplaceStats(marketStats.data);
      setTrending(trendingData.data);
      setBrandDistribution(brandDist.data.slice(0, 10)); // Top 10 brands
      setCategoryDistribution(catDist.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading-skeleton h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

      {/* Marketplace Stats */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketplace Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {marketplaceStats.map((stat) => (
            <div key={stat.marketplace_name} className="p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">
                {stat.marketplace_name}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {stat.total_listings.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique Phones</p>
                  <p className="text-xl font-semibold">{stat.phone_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Price</p>
                  <p className="text-xl font-semibold">{formatPrice(stat.avg_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Scraped</p>
                  <p className="text-sm">{stat.last_scraped_at ? new Date(stat.last_scraped_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Phones */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Phones</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Brand</th>
                <th className="text-left py-3 px-4">Model</th>
                <th className="text-left py-3 px-4">Listings</th>
                <th className="text-left py-3 px-4">Avg Price</th>
                <th className="text-left py-3 px-4">Marketplaces</th>
              </tr>
            </thead>
            <tbody>
              {trending.map((phone, index) => (
                <tr key={phone.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold">{index + 1}</td>
                  <td className="py-3 px-4">{phone.brand}</td>
                  <td className="py-3 px-4">{phone.model}</td>
                  <td className="py-3 px-4">{phone.listing_count}</td>
                  <td className="py-3 px-4">{formatPrice(phone.avg_price)}</td>
                  <td className="py-3 px-4 text-sm">{phone.marketplaces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Distribution Chart */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Brands by Listings</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={brandDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="brand" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="listing_count" fill="#3b82f6" name="Listings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Distribution */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution.reduce((acc, item) => {
                  const existing = acc.find(i => i.category === item.category);
                  if (existing) {
                    existing.count += item.count;
                  } else {
                    acc.push({ category: item.category, count: item.count });
                  }
                  return acc;
                }, [])}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">By Marketplace</h3>
            {categoryDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{item.category}</p>
                  <p className="text-sm text-gray-600 capitalize">{item.marketplace_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.count} listings</p>
                  <p className="text-sm text-gray-600">{formatPrice(item.avg_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
