import { useState, useEffect } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

function FilterSidebar({ filters, onFilterChange, brands, priceRange }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      brand: '',
      category: '',
      marketplace: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      availability: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 btn btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
      >
        {isOpen ? <FiX size={24} /> : <FiFilter size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-full lg:h-auto
          w-80 bg-white shadow-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          lg:transform-none z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <button
              onClick={handleReset}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Reset All
            </button>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              value={localFilters.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              className="input"
            >
              <option value="">All Brands</option>
              {brands?.map((brand) => (
                <option key={brand.brand} value={brand.brand}>
                  {brand.brand} ({brand.count})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="smartphone">Smartphones</option>
              <option value="tablet">Tablets</option>
              <option value="feature_phone">Feature Phones</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>

          {/* Marketplace Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marketplace
            </label>
            <select
              value={localFilters.marketplace}
              onChange={(e) => handleChange('marketplace', e.target.value)}
              className="input"
            >
              <option value="">All Marketplaces</option>
              <option value="ouedkniss">Ouedkniss</option>
              <option value="jumia">Jumia</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={localFilters.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              className="input"
            >
              <option value="">All Conditions</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="used">Used</option>
              <option value="for_parts">For Parts</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (DZD)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
                className="input"
              />
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                className="input"
              />
            </div>
            {priceRange && priceRange.minPrice != null && priceRange.maxPrice != null && (
              <p className="text-xs text-gray-500 mt-1">
                Range: {Number(priceRange.minPrice).toFixed(0)} - {Number(priceRange.maxPrice).toFixed(0)} DZD
              </p>
            )}
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={localFilters.availability}
              onChange={(e) => handleChange('availability', e.target.value)}
              className="input"
            >
              <option value="">All</option>
              <option value="in_stock">In Stock</option>
              <option value="limited_stock">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
              className="input mb-2"
            >
              <option value="created_at">Newest First</option>
              <option value="price">Price</option>
              <option value="listing_count">Most Listed</option>
              <option value="brand">Brand</option>
            </select>
            <select
              value={localFilters.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value)}
              className="input"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full btn btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default FilterSidebar;
