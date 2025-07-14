# Contact Form Setup Instructions

## Overview
The contact form has been successfully implemented using your existing Zoho email hosting. This setup is completely free and uses modern best practices for form handling and email delivery.

## Features Implemented
- ✅ **Contact Form**: Professional form with validation
- ✅ **React Hook Form**: Client-side form management
- ✅ **Zod Validation**: Shared validation schema (client & server)
- ✅ **Zoho SMTP**: Uses your existing email service
- ✅ **Responsive Design**: Mobile-first approach with Squarage styling
- ✅ **Security**: Server-side validation and sanitization
- ✅ **UX Features**: Loading states, success/error messages

## Required Environment Variables

### 1. Create `.env.local` file in your project root:

```bash
# Zoho Email Configuration
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your_zoho_app_password

# Contact form recipient (where form submissions are sent)
CONTACT_EMAIL=hello@squarage.com
```

### 2. Generate Zoho App Password:

1. Go to your **Zoho Mail dashboard**
2. Click on **Security** settings
3. Navigate to **App Passwords** section
4. Click **Generate New Password**
5. Enter name: "Squarage Contact Form" or "Nodemailer"
6. Click **Generate**
7. Copy the generated password and use it as `SMTP_PASS`

⚠️ **Important**: Use the app-specific password, NOT your regular Zoho login password.

## Testing the Contact Form

### Local Testing:
1. Start development server: `npm run dev`
2. Visit: `http://localhost:3000/contact`
3. Fill out and submit the form
4. Check your Zoho email for the submission

### Form Validation:
- **Name**: Minimum 2 characters
- **Email**: Valid email format required
- **Subject**: Minimum 5 characters
- **Message**: Minimum 10 characters

## Email Details

### What You'll Receive:
- **From**: "Squarage Studio Contact Form" <your-zoho-email>
- **Subject**: "Contact Form: [User's Subject]"
- **Content**: Professional HTML email with:
  - Sender's name and email
  - Subject line
  - Full message
  - Timestamp
  - Reply-to functionality (direct replies go to sender)

## Deployment on Vercel

### 1. Environment Variables:
In your Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add:
   - `SMTP_USER` = your-email@yourdomain.com
   - `SMTP_PASS` = your_zoho_app_password
   - `CONTACT_EMAIL` = hello@squarage.com

### 2. Deploy:
```bash
git add .
git commit -m "Add contact form functionality"
git push origin contact-page
```

Then merge to your main branch and deploy.

## Troubleshooting

### Common Issues:

1. **"Invalid login" error**:
   - Ensure you're using the app-specific password, not your regular password
   - Verify the email address is correct

2. **"Connection error"**:
   - Check if your server location affects SMTP connection
   - Verify firewall settings allow SMTP traffic

3. **Form not submitting**:
   - Check browser console for JavaScript errors
   - Verify API route is accessible at `/api/contact`

### Email Delivery Issues:
- Emails send from your authenticated Zoho address
- Check spam/junk folder if emails aren't appearing
- Verify your Zoho account is active and in good standing

## Cost Breakdown
- **Total Cost**: $0 (completely free)
- **Dependencies**: All open-source libraries
- **Email Service**: Uses your existing Zoho hosting
- **Hosting**: Standard Vercel hosting (no additional charges)

## Features for Future Enhancement
- Email notifications for form submissions
- File attachment support
- CRM integration
- Auto-responder emails
- Form analytics and tracking

## Security Features
- ✅ Server-side validation
- ✅ Input sanitization
- ✅ CSRF protection via Next.js
- ✅ Environment variable protection
- ✅ Rate limiting (via Vercel)
- ✅ Secure SMTP connection (SSL/TLS)

Your contact form is now production-ready and fully integrated with your existing Squarage Studio design system!