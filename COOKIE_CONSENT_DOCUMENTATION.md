# Cookie Consent System Documentation

## Overview
Cookie consent system for Squarage Studio. **Opt-out model** (since 2026-07-27): all categories are granted by default and tracking fires immediately; the banner and preferences modal let visitors reject, and a stored rejection is always respected. Squarage is a US company not selling into the EU — flip `defaultConsentState` back to opt-in (or add geo-based defaults) before targeting EU customers, since GDPR requires opt-in.

> Why opt-out: the original opt-in defaults meant the Meta Pixel never fired for paid ad traffic (visitors don't touch the banner), so Meta reported clicks with zero tracked landings and couldn't optimize.

## Features
✅ **Legal Compliance**
- CCPA-compliant opt-out mechanism (US audience)
- Granular consent for 4 cookie categories
- Easy consent withdrawal

✅ **Functional Implementation**
- Blocks tracking scripts after an explicit rejection (client and server-side)
- Google Consent Mode v2 integration
- Microsoft Clarity conditional loading
- Persistent consent storage (localStorage + cookies)

✅ **User Experience**
- No banner (retired 2026-07-27): disclosure lives in the privacy policy, opt-out in the footer "Cookie Preferences" modal
- Clean design matching Squarage's aesthetic
- Clear, accessible UI with proper ARIA labels

## Cookie Categories

1. **Necessary Cookies** (Always ON)
   - Essential for website functionality
   - Shopping cart, authentication, security

2. **Functional Cookies** (On by default, opt-out)
   - User preferences and settings
   - Language, recently viewed products

3. **Analytics Cookies** (On by default, opt-out)
   - Google Analytics (GA4)
   - Microsoft Clarity
   - Site usage and performance metrics

4. **Marketing Cookies** (On by default, opt-out)
   - Meta Pixel + Conversions API (see `lib/metaPixel.ts` / `lib/metaCapi.ts`)

## File Structure

```
/context/CookieConsentContext.tsx    # Core consent state management
/components/ManageCookiesModal.tsx   # Preferences modal (opened from footer)
/components/ConsentAwareAnalytics.tsx # Conditional script loading
/lib/cookieCategories.ts            # Category definitions + defaults
/app/layout.tsx                     # Integration point
/components/Footer.tsx              # Cookie Preferences button
/components/CookieBanner.tsx         # RETIRED, unmounted; keep for EU pivot
/public/policies/privacy-policy.md   # Tracking disclosure lives here
```

## How It Works

### Initial Load
1. User visits site for first time
2. CookieConsentContext checks localStorage/cookies
3. No banner is shown; tracking is active immediately (opt-out default). The privacy policy discloses the tools and points to the footer Cookie Preferences opt-out.
4. Consent readers treat "no stored choice" as granted: `useHasConsent` (React), `hasMarketingConsent()` (client, non-React call sites), `hasMarketingConsentCookie()` (server, CAPI routes). Only an explicit stored rejection blocks.

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
- Default state mirrors `defaultConsentState` (granted under the opt-out model)
- Updates to "denied" when the user rejects
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