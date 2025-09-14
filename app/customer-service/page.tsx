import { Metadata } from 'next'
import CustomerServicePage from '@/components/CustomerServicePage'

export const metadata: Metadata = {
  title: 'Customer Service | Squarage Studio',
  description: 'Customer service policies including returns, warranty, shipping, and more for Squarage Studio custom furniture.',
}

export default function CustomerService() {
  return <CustomerServicePage />
}