// Checks for the customer link contract (lib/sharedDesignServer.ts): what labs' public JSON
// must look like for /custom/[token] to render it. A shelf link (version 2, one or more
// options), the old single-design version 1, and an invoice link (one materials option).
//
// Usage: npx tsx scripts/verifySharedContract.ts
import { parseSharedPayload } from '../lib/sharedDesignServer'
import { classifyShare, invoiceSubtotalCents, lineTotalCents } from '../lib/sharedDesign'

let checks = 0
let failures = 0
function check(name: string, ok: boolean, detail?: string) {
  checks++
  if (!ok) {
    failures++
    console.log(`  FAIL ${name}${detail ? `: ${detail}` : ''}`)
  }
}

const TOKEN = 'Ab3_-Zz9Ab3_-Zz9Ab3_-Z'
const CHECKOUT = 'https://squarage-studio.myshopify.com/12345/invoices/abcdef'

const flat = {
  width: 74, height: 75, depth: 12, length: 12, amplitude: 3, shelfCount: 5, columnCount: 6,
  shelfOffset: 8, columnOffset: 6, roundLeft: false, roundRight: false, consoleTop: false, middleShelfShift: 0,
}
const camera = { initialRotationDeg: 350, minAngleDeg: -85, maxAngleDeg: -10, tiltDeg: 25 }
const shelfOption = (optionNumber: number) => ({
  optionNumber, status: 'open', price: { amountCents: 240000, currency: 'USD' }, shipping: { mode: 'calculated' },
  checkoutUrl: CHECKOUT, design: { collection: 'warped', finish: 'Oak', variant: 'standard', params: flat }, camera, svgPreview: '<svg/>',
})
const link = { token: TOKEN, status: 'open', customerName: 'Ada', customerEmail: 'ada@example.com', notes: 'Hi', updatedAt: '2026-10-07T00:00:00.000Z' }

// Royal Plywood's receipt, passed through at cost
const ITEMS = [
  { description: '12mm 4x8 Baltic Birch BB/BB plywood', quantity: 10, unitCents: 6336 },
  { description: 'Handling charge', quantity: 1, unitCents: 4500 },
  { description: 'Credit card fee (2%)', quantity: 1, unitCents: 1356 },
]
const invoiceOption = {
  optionNumber: 1, status: 'open', price: { amountCents: 69216, currency: 'USD' }, shipping: { mode: 'none' },
  checkoutUrl: CHECKOUT,
  design: { collection: 'materials', variant: 'materials', title: 'Baltic Birch Plywood', items: ITEMS, sheet: { widthIn: 48, lengthIn: 96, thicknessIn: 0.5, count: 10 } },
  camera: { initialRotationDeg: 25, minAngleDeg: -60, maxAngleDeg: 60, tiltDeg: 30 }, svgPreview: null,
}

// --- Version 2 shelf link
const v2 = parseSharedPayload({ version: 2, ...link, options: [shelfOption(2), shelfOption(1)] })
check('v2 shelf link parses', v2.status === 'ok', v2.status !== 'ok' ? v2.reason : '')
if (v2.status === 'ok') {
  check('v2 options are sorted by number', v2.share.options.map((o) => o.optionNumber).join() === '1,2')
  check('v2 is a shelf link', classifyShare(v2.share).kind === 'shelf')
}

// --- Version 1 single design
const v1 = parseSharedPayload({ version: 1, ...link, ...shelfOption(1) })
check('v1 link parses', v1.status === 'ok', v1.status !== 'ok' ? v1.reason : '')
if (v1.status === 'ok') {
  check('v1 becomes one option', v1.share.options.length === 1 && v1.share.options[0].optionNumber === 1)
  check('v1 is a shelf link', classifyShare(v1.share).kind === 'shelf')
}

// --- Invoice link
const inv = parseSharedPayload({ version: 2, ...link, customerName: 'International School of Los Angeles', options: [invoiceOption] })
check('invoice link parses', inv.status === 'ok', inv.status !== 'ok' ? inv.reason : '')
if (inv.status === 'ok') {
  const kind = classifyShare(inv.share)
  check('invoice link is an invoice', kind.kind === 'invoice')
  if (kind.kind === 'invoice') {
    const { design, shipping, price } = kind.option
    check('invoice carries its three lines', design.items.length === 3 && design.items[0].quantity === 10)
    check('line totals follow the receipt', lineTotalCents(design.items[0]) === 63360 && lineTotalCents(design.items[1]) === 4500 && lineTotalCents(design.items[2]) === 1356)
    check('subtotal is the receipt total', invoiceSubtotalCents(design.items) === 69216 && price.amountCents === 69216)
    check('nothing ships', shipping.mode === 'none')
    check('the sheet is a 4x8 half inch, ten of them', design.sheet?.widthIn === 48 && design.sheet.lengthIn === 96 && design.sheet.thicknessIn === 0.5 && design.sheet.count === 10)
    check('the title is kept', design.title === 'Baltic Birch Plywood')
  }
}
const paidInvoice = parseSharedPayload({ version: 2, ...link, status: 'paid', options: [{ ...invoiceOption, status: 'paid', checkoutUrl: null }] })
check('a paid invoice parses with no checkout', paidInvoice.status === 'ok' && paidInvoice.share.status === 'paid' && paidInvoice.share.options[0].checkoutUrl === null)
const noSheet = parseSharedPayload({ version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, sheet: null } }] })
check('an invoice without a sheet parses', noSheet.status === 'ok')

// --- What is refused
const BAD: [string, unknown][] = [
  ['an invoice with no lines', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, items: [] } }] }],
  ['a line with quantity 0', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, items: [{ ...ITEMS[0], quantity: 0 }] } }] }],
  ['a negative unit price', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, items: [{ ...ITEMS[0], unitCents: -1 }] } }] }],
  ['21 lines', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, items: Array(21).fill(ITEMS[1]) } }] }],
  ['an empty title', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, title: '' } }] }],
  ['a non-https checkout', { version: 2, ...link, options: [{ ...invoiceOption, checkoutUrl: 'http://evil.example/pay' }] }],
  ['an invoice beside a shelf option', { version: 2, ...link, options: [shelfOption(1), { ...invoiceOption, optionNumber: 2 }] }],
  ['a shelf option that ships nothing', { version: 2, ...link, options: [{ ...shelfOption(1), shipping: { mode: 'none' } }] }],
  ['a sheet count of 0', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, sheet: { ...invoiceOption.design.sheet, count: 0 } } }] }],
  ['an unknown variant', { version: 2, ...link, options: [{ ...invoiceOption, design: { ...invoiceOption.design, variant: 'lumber' } }] }],
  ['a bad token', { version: 2, ...link, token: 'short', options: [invoiceOption] }],
]
for (const [name, payload] of BAD) check(`refuses ${name}`, parseSharedPayload(payload).status === 'unavailable')

console.log(failures === 0 ? `All ${checks} checks passed` : `${failures} of ${checks} checks failed`)
process.exit(failures === 0 ? 0 : 1)
