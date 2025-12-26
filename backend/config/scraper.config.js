require('dotenv').config();

module.exports = {
  scraping: {
    delays: {
      min: parseInt(process.env.SCRAPE_DELAY_MIN) || 2000,
      max: parseInt(process.env.SCRAPE_DELAY_MAX) || 5000
    },
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    useProxy: process.env.USE_PROXY === 'true',
    proxyList: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : []
  },
  
  userAgents: process.env.USER_AGENTS 
    ? process.env.USER_AGENTS.split(',')
    : [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
  
  marketplaces: {
    ouedkniss: {
      baseUrl: 'https://www.ouedkniss.com',
      searchUrl: 'https://www.ouedkniss.com/telephones/1',
      scheduleHours: parseInt(process.env.OUEDKNISS_SCHEDULE_HOURS) || 6,
      enabled: true,
      // Featured phone stores in Algeria
      stores: [
        { id: 4105, name: 'AM Tech', url: 'https://www.ouedkniss.com/store/4105/am-tech/accueil' },
        { id: 6442, name: 'Abdou Cabba Store', url: 'https://www.ouedkniss.com/store/6442/abdou-cabba-store/accueil' },
        { id: 15321, name: 'Louail Phone', url: 'https://www.ouedkniss.com/store/15321/louail-phone/accueil' },
        { id: 13219, name: 'Mega Phone', url: 'https://www.ouedkniss.com/store/13219/mega-phone/accueil' },
        { id: 19137, name: 'Phone Lamine', url: 'https://www.ouedkniss.com/store/19137/phone-lamine/accueil' },
        { id: 17937, name: 'IT Device', url: 'https://www.ouedkniss.com/store/17937/it-device/accueil' },
        { id: 14223, name: 'AD Tech', url: 'https://www.ouedkniss.com/store/14223/ad-tech/accueil' },
        { id: 8063, name: 'Mobily', url: 'https://www.ouedkniss.com/store/8063/mobily/accueil' },
        { id: 29592, name: 'Destock Phone Algerie', url: 'https://www.ouedkniss.com/store/29592/destock-phone-algerie/accueil' },
        { id: 31741, name: 'Lempreinte de Telephone', url: 'https://www.ouedkniss.com/store/31741/lempreinte-de-telephone/accueil' }
      ]
    },
    jumia: {
      baseUrl: 'https://www.jumia.com.dz',
      searchUrl: 'https://www.jumia.com.dz/telephone-tablette/',
      scheduleHours: parseInt(process.env.JUMIA_SCHEDULE_HOURS) || 4,
      enabled: true
    },
    facebook: {
      baseUrl: 'https://www.facebook.com/marketplace',
      searchUrl: 'https://www.facebook.com/marketplace/category/cell-phones',
      scheduleHours: parseInt(process.env.FACEBOOK_SCHEDULE_HOURS) || 8,
      enabled: false, // Disabled: Facebook has strong anti-scraping protection
      credentials: {
        email: process.env.FACEBOOK_EMAIL,
        password: process.env.FACEBOOK_PASSWORD
      }
    }
  },
  
  dataRetention: {
    priceHistoryDays: parseInt(process.env.PRICE_HISTORY_RETENTION_DAYS) || 90,
    logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30
  }
};
