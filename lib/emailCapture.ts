interface EmailSubscriptionRequest {
  email: string
  consentMarketing: boolean
}

interface EmailSubscriptionResponse {
  success: boolean
  message: string
  discountCode?: string
  isExisting?: boolean
  data?: {
    id: string
    email: string
    discountCode?: string
  }
}

export async function submitEmailSubscription({
  email,
  consentMarketing
}: EmailSubscriptionRequest): Promise<EmailSubscriptionResponse> {
  // Automatically use production URL in production, fall back to env variable for development
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://admin.squarage.com'
    : (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000')

  const apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY

  if (!apiKey) {
    console.error('Email API key missing')
    return {
      success: false,
      message: 'Service temporarily unavailable. Please try again later.'
    }
  }

  console.log(`Email API: Using ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} endpoint:`, apiUrl)

  try {
    const response = await fetch(`${apiUrl}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        email,
        consentMarketing
      })
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', response.status, response.statusText)
      return {
        success: false,
        message: 'Service temporarily unavailable. Please try again later.'
      }
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle error responses
      if (response.status === 400) {
        return {
          success: false,
          message: data.message || 'Please enter a valid email address.'
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Too many attempts. Please try again later.'
        }
      }

      return {
        success: false,
        message: data.message || 'Subscription failed. Please try again.'
      }
    }

    // Success response - use the message from the API
    // The API now returns friendly messages for both new and existing subscribers
    // Extract discount code from response (could be in root or in data object)
    const discountCode = data.discountCode || data.data?.discountCode

    return {
      success: true,
      message: data.message || 'Successfully subscribed!',
      discountCode: discountCode,
      isExisting: data.isExisting,
      data: data.data
    }
  } catch (error) {
    console.error('Email subscription error:', error)

    // Network error or other issues
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Connection error. Please check your internet and try again.'
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Something went wrong. Please try again.'
    }
  }
}