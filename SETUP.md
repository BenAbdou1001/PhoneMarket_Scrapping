# Setup Guide - Algerian Phone Market Scraper

## Prerequisites

- Node.js v16 or higher
- MySQL v8.0 or higher
- npm or yarn package manager

## Step-by-Step Installation

### 1. Clone and Navigate

```bash
cd "/Users/destockphonedz/Documents/Personal Projects/Scrapping"
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Configuration:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL database credentials
- `PORT` - Backend server port (default: 5000)
- Facebook credentials (optional, for Facebook Marketplace scraping)
- Email settings (optional, for notifications)

### 4. Set Up Database

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE phone_scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
npm run migrate
```

You should see output like:
```
Found 6 migration files
Executing 001_create_phones_table.sql...
✓ 001_create_phones_table.sql completed
...
All migrations completed successfully
```

### 5. Test the Setup

```bash
# Start the backend server
npm run server:dev

# In another terminal, start the frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 6. Run Your First Scrape (Optional)

```bash
# Test scraping from Ouedkniss
npm run scrape:ouedkniss

# Or test all marketplaces
npm run scrape:all
```

## Starting the Full Application

### Development Mode

```bash
# Run both frontend and backend together
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend dev server on http://localhost:3000

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Running the Scheduler

To enable automated scraping on schedule:

```bash
# In a separate terminal/process
npm run scheduler
```

This will:
- Start the scheduled scraping jobs
- Ouedkniss: every 6 hours
- Jumia: every 4 hours
- Facebook: every 8 hours

## Recommended Production Setup

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend server
pm2 start backend/server.js --name "phone-scraper-api"

# Start scheduler
pm2 start backend/scheduler/index.js --name "phone-scraper-scheduler"

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

### Serve Frontend

For production, you have several options:

1. **Using Nginx** (recommended):
   - Build frontend: `cd frontend && npm run build`
   - Configure Nginx to serve the `frontend/dist` folder
   - Proxy API requests to backend

2. **Using Express static**:
   - Uncomment the static serving code in `backend/server.js`

## Testing the Application

### 1. Check Database Tables

```bash
mysql -u root -p phone_scraper -e "SHOW TABLES;"
```

Expected tables:
- phones
- phone_populations
- marketplace_stats
- scraping_jobs
- price_trends
- scraping_logs
- migrations

### 2. Check API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Get phones
curl http://localhost:5000/api/phones

# Get dashboard stats
curl http://localhost:5000/api/analytics/dashboard-stats
```

### 3. Access Frontend

Open http://localhost:3000 in your browser and you should see:
- Hero section with search bar
- Statistics cards
- Filter sidebar
- Phone listings grid

## Common Issues & Solutions

### Issue: Database Connection Error

**Solution:**
1. Verify MySQL is running: `mysql --version`
2. Check credentials in `.env`
3. Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Issue: Port Already in Use

**Solution:**
```bash
# Check what's using the port
lsof -i :5000  # or :3000 for frontend

# Kill the process or change PORT in .env
```

### Issue: Puppeteer Installation Fails

**Solution:**
```bash
# Install Chromium dependencies (Linux)
sudo apt-get install -y libgbm-dev

# Or skip chromium download and use system Chrome
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

### Issue: Facebook Scraping Not Working

**Solution:**
- Facebook Marketplace scraping requires valid credentials
- You may need to handle 2FA manually
- Consider using cookies for authentication
- Facebook's structure changes frequently

### Issue: No Data After Scraping

**Solution:**
1. Check scraping logs: `tail -f logs/scraping.log`
2. Test scraper manually: `npm run scrape:ouedkniss`
3. Verify target websites are accessible
4. Check for rate limiting or blocking

## Monitoring & Maintenance

### View Logs

```bash
# All logs
tail -f logs/combined.log

# Scraping logs only
tail -f logs/scraping.log

# Error logs
tail -f logs/error.log
```

### Database Maintenance

```bash
# Clean old data (via API)
curl -X POST http://localhost:5000/api/admin/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days": 90}'
```

### Monitor Scraping Jobs

1. Open http://localhost:3000/admin
2. View job statuses, logs, and system health
3. Manually trigger scraping jobs

## Customization

### Adjust Scraping Frequency

Edit `.env`:
```
OUEDKNISS_SCHEDULE_HOURS=6
JUMIA_SCHEDULE_HOURS=4
FACEBOOK_SCHEDULE_HOURS=8
```

Or use the admin panel to update schedules dynamically.

### Add New Marketplace

1. Create new scraper in `backend/scrapers/` extending `BaseScraper`
2. Add configuration in `backend/config/scraper.config.js`
3. Update database enums if needed
4. Add to scheduler

### Customize Frontend

- Edit colors in `frontend/tailwind.config.js`
- Modify components in `frontend/src/components/`
- Add new pages in `frontend/src/pages/`

## Support

For issues:
1. Check logs in `logs/` directory
2. Review error messages in browser console
3. Test individual components
4. Check database connectivity

## Next Steps

1. Set up automated backups for MySQL database
2. Configure Nginx or Apache for production
3. Set up SSL certificates
4. Configure monitoring (e.g., Prometheus, Grafana)
5. Set up email notifications for scraping failures
6. Implement caching layer (Redis) for better performance

---

**Important Notes:**

- Respect websites' robots.txt and terms of service
- Implement rate limiting to avoid overwhelming servers
- Facebook scraping may require authentication
- Some sites may block automated access
- Always test scrapers before deploying to production
