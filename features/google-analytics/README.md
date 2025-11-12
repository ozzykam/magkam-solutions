# Analytics Feature Module

A comprehensive, modular analytics solution supporting Google Analytics 4, Google Search Console, Bing Webmaster Tools, and Microsoft Clarity.

## 📊 Features

### Google Analytics 4 (GA4)
- Real-time visitor tracking
- E-commerce event tracking (view_item, add_to_cart, purchase)
- Traffic source analysis
- Page performance metrics
- Custom event tracking
- GDPR-compliant IP anonymization

### Google Search Console
- Search query performance
- Click-through rates (CTR)
- Average position tracking
- Indexing status monitoring
- Mobile vs desktop performance

### Bing Webmaster Tools
- Bing search performance
- Query analytics
- Indexing statistics
- Crawl error monitoring

### Microsoft Clarity (FREE!)
- Session recordings
- Heatmaps (click, scroll, area)
- Rage click detection
- Dead click detection
- Quick back detection
- JavaScript error tracking

### Core Web Vitals
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)
- Mobile vs Desktop comparison

## 🏗️ Architecture

### Modular Design
This feature is **self-contained** and can be easily removed for tier-based offerings:

```
features/google-analytics/
├── components/           # Client-side tracking components
├── admin/               # Admin dashboard & settings
├── services/            # API service layer
├── hooks/              # React hooks
├── types/              # TypeScript types
└── index.ts            # Export aggregator
```

### Feature Flags
Runtime control via Firestore settings:

```typescript
// Enable/disable entire feature
features.analytics.enabled = true/false

// Enable/disable specific platforms
features.analytics.google.enabled = true/false
features.analytics.bing.enabled = true/false
```

## 🚀 Setup Instructions

### 1. Basic Setup (Client-side only)

#### Google Analytics 4

1. **Create GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com)
   - Create a new GA4 property
   - Copy your Measurement ID (G-XXXXXXXXXX)

2. **Configure in Admin Panel**
   - Navigate to Admin → Analytics → Settings
   - Enable Google Analytics
   - Paste your Measurement ID
   - Enable e-commerce tracking (recommended)
   - Enable IP anonymization (GDPR compliance)

#### Google Search Console

1. **Add Your Site**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Add your website as a property

2. **Get Verification Code**
   - Choose "HTML tag" verification method
   - Copy the content value from the meta tag

3. **Add to Settings**
   - In Admin Panel → Analytics → Settings
   - Paste verification code in "Search Console Verification Code"
   - Save settings
   - Return to Search Console and verify

#### Bing Webmaster Tools

1. **Add Your Site**
   - Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - Add your website

2. **Get Verification Code**
   - Choose "HTML Meta Tag" method
   - Copy the content value

3. **Add to Settings**
   - In Admin Panel → Analytics → Settings
   - Enable Bing/Microsoft
   - Paste verification code
   - Save and verify in Bing

#### Microsoft Clarity

1. **Create Project**
   - Go to [Microsoft Clarity](https://clarity.microsoft.com)
   - Create a new project (completely FREE!)
   - Copy your Project ID

2. **Add to Settings**
   - In Admin Panel → Analytics → Settings
   - Paste Clarity Project ID
   - Enable heatmaps and session recordings
   - Save settings

**That's it!** Analytics are now tracking on your site.

### 2. Advanced Setup (Server-side API access)

For the analytics dashboard to display data, configure server-side API access:

#### Google Analytics Data API

1. **Enable API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable "Google Analytics Data API"

2. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create a new service account
   - Download JSON key file

3. **Grant Access**
   - In Google Analytics, go to Admin → Property → Property Access Management
   - Add the service account email
   - Grant "Viewer" role

4. **Add Environment Variables**
   ```bash
   # .env.local
   GA4_PROPERTY_ID=123456789
   GOOGLE_ANALYTICS_ACCESS_TOKEN=<service-account-token>
   ```

#### Google Search Console API

1. **Enable API**
   - In Google Cloud Console, enable "Search Console API"

2. **Grant API Access**
   - In Search Console → Settings → Users and permissions
   - Add your service account email

3. **Add Environment Variables**
   ```bash
   # .env.local
   GOOGLE_SEARCH_CONSOLE_SITE_URL=https://yoursite.com
   GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN=<service-account-token>
   ```

#### Bing Webmaster API

1. **Get API Key**
   - In Bing Webmaster Tools → Settings → API Access
   - Generate API key

2. **Add Environment Variables**
   ```bash
   # .env.local
   BING_WEBMASTER_SITE_URL=https://yoursite.com
   BING_WEBMASTER_API_KEY=<your-api-key>
   ```

## 📈 Usage

### Automatic Tracking

Once enabled, the following events are tracked automatically:
- Page views on all route changes
- Core Web Vitals performance metrics
- User sessions and engagement

### Manual Event Tracking

Use the `useAnalytics` hook to track custom events:

```typescript
import { useAnalytics } from '@/features/google-analytics';

function ProductPage() {
  const { trackViewItem, trackAddToCart, trackPurchase } = useAnalytics();

  // Track product view
  trackViewItem({
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'prod_123',
      item_name: 'Product Name',
      price: 29.99,
      quantity: 1,
    }]
  });

  // Track add to cart
  trackAddToCart({
    currency: 'USD',
    value: 29.99,
    items: [{ /* ... */ }]
  });

  // Track purchase
  trackPurchase({
    transaction_id: 'order_123',
    currency: 'USD',
    value: 29.99,
    tax: 2.50,
    shipping: 5.00,
    items: [{ /* ... */ }]
  });
}
```

### Custom Events

```typescript
import { useAnalytics } from '@/features/google-analytics';

const { trackEvent } = useAnalytics();

trackEvent({
  action: 'newsletter_signup',
  category: 'engagement',
  label: 'footer_form',
  value: 1,
});
```

## 🎯 Tier-Based Implementation

### For Professional/Enterprise Clients

**Include the feature** - No changes needed. Feature is active and ready.

### For Starter Tier Clients

**Remove the feature** by following these steps:

1. **Delete the feature directory**
   ```bash
   rm -rf features/google-analytics
   ```

2. **Remove from layout**
   ```typescript
   // app/layout.tsx
   // Remove these imports and components:
   // - GoogleAnalyticsScript
   // - MicrosoftClarityScript
   // - VerificationMetaTags
   // - PageViewTracker
   // - PerformanceMetrics
   ```

3. **Remove admin pages**
   ```bash
   rm -rf app/(admin)/admin/analytics
   ```

4. **Remove navigation links**
   ```typescript
   // app/(admin)/layout.tsx
   // Remove the Analytics Section navigation links
   ```

5. **Remove API routes**
   ```bash
   rm -rf app/api/analytics
   ```

6. **Uninstall dependencies** (optional)
   ```bash
   npm uninstall web-vitals
   ```

That's it! The feature is completely removed with zero impact on the rest of the application.

## 📊 Admin Dashboard

Access the analytics dashboard at `/admin/analytics`

### Available Views

1. **Analytics Dashboard** (`/admin/analytics`)
   - Traffic overview (sessions, users, pageviews)
   - Revenue and conversions
   - Traffic sources breakdown
   - Top pages and products
   - Search engine performance (Google + Bing)

2. **Performance Metrics** (`/admin/analytics/performance`)
   - Core Web Vitals (mobile vs desktop)
   - Page speed insights
   - Performance recommendations

3. **Analytics Settings** (`/admin/analytics/settings`)
   - Enable/disable platforms
   - Configure tracking IDs
   - GDPR settings
   - Verification codes

## 🔒 Security & Privacy

### GDPR Compliance
- IP anonymization enabled by default
- Cookie consent banner (placeholder for future enhancement)
- Data retention controls
- User opt-out support

### Authentication
- All API routes require admin authentication
- Settings changes logged
- Secure token storage

## 🐛 Troubleshooting

### "Analytics not showing data"

1. **Check feature is enabled**
   - Go to Admin → Analytics → Settings
   - Ensure "Enable Analytics & SEO Tracking" is checked

2. **Verify tracking IDs are correct**
   - GA4 ID format: `G-XXXXXXXXXX`
   - Clarity ID format: alphanumeric string

3. **Check browser console for errors**
   - Look for `gtag` or tracking errors

### "Dashboard shows setup required"

1. **Verify environment variables are set**
   ```bash
   # Check .env.local file
   GA4_PROPERTY_ID=...
   GOOGLE_ANALYTICS_ACCESS_TOKEN=...
   ```

2. **Check service account permissions**
   - Service account must have "Viewer" role in GA4

3. **Test API connection**
   - Go to `/admin/analytics/setup-check`
   - Review what's missing

### "Verification not working"

1. **Save settings first**
   - Verification codes must be saved in admin panel
   - Scripts are automatically added to site

2. **Wait for indexing**
   - Google/Bing may take 24-48 hours to verify

3. **Check code is in HTML**
   - View page source
   - Look for `<meta name="google-site-verification" ...>`

## 🔄 Future Enhancements

Potential additions (not yet implemented):
- Cookie consent banner
- Custom dimension tracking
- Funnel analysis
- A/B test tracking
- Advanced segmentation
- Data export functionality
- Automated reporting emails

## 📝 Type Definitions

All types are exported from `features/google-analytics/types/analytics.ts`:

```typescript
import type {
  AnalyticsDashboardData,
  GAViewItem,
  GAAddToCart,
  GAPurchase,
  CoreWebVitals,
} from '@/features/google-analytics';
```

## 🤝 Support

For setup assistance:
- Google Analytics: [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- Search Console: [GSC Help](https://support.google.com/webmasters/answer/9008080)
- Bing Webmaster: [Bing Help](https://www.bing.com/webmasters/help/help-center-661b2d18)
- Microsoft Clarity: [Clarity Docs](https://docs.microsoft.com/en-us/clarity/)

## 📄 License

Part of the eCommerce template. Included in Professional and Enterprise tiers.
