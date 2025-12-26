import { Link } from 'react-router-dom';
import MarketplaceBadge from './MarketplaceBadge';
import { FiExternalLink, FiTrendingUp } from 'react-icons/fi';

function PhoneCard({ phone }) {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getConditionBadge = (condition) => {
    const labels = {
      new: 'New',
      like_new: 'Like New',
      used: 'Used',
      for_parts: 'For Parts'
    };
    return labels[condition] || condition;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative mb-4">
        {phone.image_url ? (
          <img
            src={phone.image_url}
            alt={`${phone.brand} ${phone.model}`}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        
        {phone.listing_count > 1 && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
            <FiTrendingUp size={12} />
            <span>{phone.listing_count} listings</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Brand & Model */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{phone.brand}</h3>
          <p className="text-sm text-gray-600">{phone.model}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <MarketplaceBadge marketplace={phone.marketplace_name} />
          <span className={`badge badge-${phone.condition}`}>
            {getConditionBadge(phone.condition)}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-primary-600">
              {formatPrice(phone.price)}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {phone.availability_status === 'in_stock' ? (
              <span className="text-green-600 font-medium">In Stock</span>
            ) : phone.availability_status === 'limited_stock' ? (
              <span className="text-orange-600 font-medium">Limited Stock</span>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t">
          <Link
            to={`/phone/${phone.id}`}
            className="flex-1 btn btn-primary text-center text-sm"
          >
            View Details
          </Link>
          {phone.source_url && (
            <a
              href={phone.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-sm"
            >
              <FiExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhoneCard;
