import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdmin } from '@/lib/shopify-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Test connection first
    const connectionTest = await shopifyAdmin.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({ error: connectionTest.message }, { status: 500 })
    }
    
    // Create product
    const product = await shopifyAdmin.createProduct(body)
    
    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}