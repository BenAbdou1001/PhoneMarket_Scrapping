import clsx from 'clsx';

function MarketplaceBadge({ marketplace, className }) {
  const getMarketplaceLabel = () => {
    const labels = {
      ouedkniss: 'Ouedkniss',
      jumia: 'Jumia',
      facebook: 'Facebook'
    };
    return labels[marketplace] || marketplace;
  };

  return (
    <span
      className={clsx(
        'marketplace-badge',
        `badge-${marketplace}`,
        className
      )}
    >
      {getMarketplaceLabel()}
    </span>
  );
}

export default MarketplaceBadge;
