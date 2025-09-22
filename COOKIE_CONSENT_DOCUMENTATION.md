# Cookie Consent System Documentation

## Overview
A fully functional, legally compliant cookie consent system for Squarage Studio that meets GDPR and CCPA requirements.

## Features
✅ **Legal Compliance**
- GDPR-compliant opt-in system (all non-essential cookies OFF by default)
- CCPA-compliant opt-out mechanism
- Granular consent for 4 cookie categories
- Easy consent withdrawal

✅ **Functional Implementation**
- Actually blocks tracking scripts until consent is granted
- Google Consent Mode v2 integration
- Microsoft Clarity conditional loading
- Persistent consent storage (localStorage + cookies)

✅ **User Experience**
- Clean design matching Squarage's aesthetic
- Mobile-responsive banner and modal
- Footer link for managing preferences
- Clear, accessible UI with proper ARIA labels

## Cookie Categories

1. **Necessary Cookies** (Always ON)
   - Essential for website functionality
   - Shopping cart, authentication, security

2. **Functional Cookies** (Opt-in)
   - User preferences and settings
   - Language, recently viewed products

3. **Analytics Cookies** (Opt-in)
   - Google Analytics (GA4)
   - Microsoft Clarity
   - Site usage and performance metrics

4. **Marketing Cookies** (Opt-in)
   - Future advertising/remarketing services
   - Currently not implemented

## File Structure

```
/context/CookieConsentContext.tsx    # Core consent state management
/components/CookieBanner.tsx         # Bottom banner component
/components/ManageCookiesModal.tsx   # Preferences modal
/components/ConsentAwareAnalytics.tsx # Conditional script loading
/lib/cookieCategories.ts            # Category definitions
/app/layout.tsx                     # Integration point
/components/Footer.tsx              # Cookie preferences link
```

## How It Works

### Initial Load
1. User visits site for first time
2. CookieConsentContext checks localStorage/cookies
3. If no consent found, shows banner
4. Google/Clarity scripts held in "denied" state

### User Accepts All
1. All categories set to "granted"
2. Consent saved to localStorage and cookie
3. Google Consent Mode updated
4. Analytics scripts activate immediately

### User Manages Preferences
1. Modal opens with toggle switches
2. User selects desired categories
3. Preferences saved on "Save Preferences"
4. Scripts activate/deactivate based on choices

### Returning Visitors
1. Consent loaded from storage
2. Scripts initialized based on saved preferences
3. No banner shown unless consent expired

## Testing

1. **Clear Consent**: Delete localStorage key `squarage_cookie_consent`
2. **Test File**: Open `/test-cookie-consent.html` in browser
3. **Verify Scripts**: Check Network tab for GA/Clarity loading
4. **Mobile Test**: Use responsive mode in DevTools

## Google Analytics Setup

The system uses Google Consent Mode v2:
- Default state: "denied" for all categories
- Updates to "granted" when user consents
- GA4 ID: `G-ZCYJMQJLE1`
- Anonymized IPs enabled

## Microsoft Clarity Setup

- Only loads when analytics consent granted
- Project ID: `sy4kv4wk64`
- Dynamic script injection after consent

## Maintenance

### Adding New Tracking Scripts
1. Add category check in `ConsentAwareAnalytics.tsx`
2. Use `useHasConsent('analytics')` or appropriate category
3. Conditionally load script based on consent

### Updating Cookie Categories
1. Edit `/lib/cookieCategories.ts`
2. Update `ConsentState` type
3. Adjust UI in `ManageCookiesModal.tsx`

### Changing Design
- Colors defined in `tailwind.config.ts`
- Font: `font-neue-haas`
- Primary: `squarage-orange` (#ff962d)
- Background: `cream` (#fffaf4)

## Compliance Notes

- **Data Retention**: Consent stored for 365 days
- **Version Control**: Consent version tracked for updates
- **Audit Trail**: Timestamp saved with each consent
- **Server Access**: Cookie set for server-side checking

## Known Limitations

- Scripts using Google Consent Mode still load (but respect consent)
- Some metrics may be estimated when consent denied
- Cookie banner reappears if localStorage cleared

## Future Enhancements

- [ ] Add consent log/audit trail
- [ ] Implement geolocation-based defaults
- [ ] Add more granular marketing categories
- [ ] Server-side consent checking for SSR