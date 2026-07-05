// Whole-dollar price formatting used across product cards, product pages,
// and the sticky add-to-cart bar.
export function formatPrice(price: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(price))
}
