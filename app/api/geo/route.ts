import { NextRequest, NextResponse } from 'next/server'

// Per-visitor data — never prerender or cache this route.
export const dynamic = 'force-dynamic'

// Approximate visitor location from Vercel's IP geolocation headers,
// used to prefill the delivery ZIP estimator. The headers only exist
// on Vercel deployments, so this returns nulls on localhost.
export function GET(request: NextRequest) {
  return NextResponse.json({
    country: request.headers.get('x-vercel-ip-country'),
    postalCode: request.headers.get('x-vercel-ip-postal-code'),
  })
}
