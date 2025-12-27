# Algerian Phone Market Scraper

A vibe Coded Automated phone market scraper for Algerian marketplaces including Ouedkniss, Jumia Algeria, and Facebook Marketplace. This system provides real-time data aggregation, population tracking, price trend analysis, and comprehensive market insights.

## Features

- **Multi-Marketplace Scraping**: Automated scraping from Ouedkniss, Jumia Algeria, and Facebook Marketplace
- **Scheduled Automation**: Configurable scraping schedules for each marketplace
- **Population Tracking**: Track listing counts, stock levels, and availability across all marketplaces
- **Price Trend Analysis**: Historical price tracking and analysis
- **Advanced Search & Filtering**: Multi-dimensional filtering by brand, price, condition, marketplace, and more
- **Analytics Dashboard**: Visual insights into market trends and phone popularity
- **Admin Panel**: Control scraping jobs, view logs, and manage system health
- **Real-time Updates**: Fresh data with automated scheduling

## Tech Stack

### Backend
- Node.js & Express
- MySQL Database
- Puppeteer & Cheerio for scraping
- node-cron for scheduling
- Winston for logging

### Frontend
- React
- Vite
- TailwindCSS
- Recharts for data visualization
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd Scrapping
```

2. Install dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE phone_scraper;"

# Run migrations
npm run migrate
```

5. (Optional) Seed the database
```bash
npm run seed
```

## Usage

### Development Mode
```bash
# Run both backend and frontend
npm run dev

# Run only backend
npm run server:dev

# Run only frontend
npm run client:dev
```

### Production Mode
```bash
# Build frontend
npm run build

# Start server
npm start
```

### Scheduler
```bash
# Run the scheduler (for automated scraping)
npm run scheduler
```

### Manual Scraping
```bash
# Scrape specific marketplace
npm run scrape:ouedkniss
npm run scrape:jumia
npm run scrape:facebook

# Scrape all marketplaces
npm run scrape:all
```

## Project Structure

```
.
├── backend/
│   ├── server.js                  # Express server
│   ├── config/                    # Configuration files
│   │   ├── database.js
│   │   └── scraper.config.js
│   ├── database/                  # Database related
│   │   ├── migrations/
│   │   ├── connection.js
│   │   └── migrate.js
│   ├── models/                    # Database models
│   │   ├── Phone.js
│   │   ├── PhonePopulation.js
│   │   └── ...
│   ├── scrapers/                  # Scraper modules
│   │   ├── BaseScraper.js
│   │   ├── OuedknissScraper.js
│   │   ├── JumiaScraper.js
│   │   ├── FacebookScraper.js
│   │   └── runScraper.js
│   ├── scheduler/                 # Scheduling system
│   │   ├── index.js
│   │   └── jobManager.js
│   ├── services/                  # Business logic
│   │   ├── phoneService.js
│   │   ├── analyticsService.js
│   │   └── deduplicationService.js
│   ├── routes/                    # API routes
│   │   ├── phones.js
│   │   ├── analytics.js
│   │   └── admin.js
│   ├── middleware/                # Express middleware
│   │   ├── errorHandler.js
│   │   └── validation.js
│   └── utils/                     # Utility functions
│       ├── logger.js
│       └── notifications.js
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── package.json
```

## API Endpoints

### Phones
- `GET /api/phones` - Get all phones with filtering
- `GET /api/phones/:id` - Get phone details
- `GET /api/phones/:id/listings` - Get all listings for a phone
- `GET /api/phones/:id/price-history` - Get price history

### Analytics
- `GET /api/analytics/marketplace-stats` - Get marketplace statistics
- `GET /api/analytics/trending` - Get trending phones
- `GET /api/analytics/price-trends` - Get price trend analysis
- `GET /api/analytics/popularity` - Get popularity metrics

### Admin
- `GET /api/admin/jobs` - Get scraping jobs status
- `POST /api/admin/jobs/:marketplace/trigger` - Manually trigger scraping
- `GET /api/admin/logs` - Get system logs
- `PUT /api/admin/jobs/:id/schedule` - Update job schedule

## Scraping Schedules

Default scraping intervals:
- **Ouedkniss**: Every 6 hours
- **Jumia Algeria**: Every 4 hours
- **Facebook Marketplace**: Every 8 hours

Schedules can be configured via environment variables or admin panel.

## Database Schema

### Main Tables
- `phones` - Phone listings
- `phone_populations` - Population metrics tracking
- `marketplace_stats` - Aggregated marketplace data
- `scraping_jobs` - Scheduled job tracking
- `price_trends` - Historical price data

See database migrations for complete schema.

## Error Handling & Monitoring

- Comprehensive error logging with Winston
- Email notifications for scraping failures
- Retry mechanism with exponential backoff
- Health monitoring dashboard

## Performance Optimization

- Database indexing for fast queries
- Result caching
- Image lazy loading
- Pagination for large datasets
- Code splitting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
