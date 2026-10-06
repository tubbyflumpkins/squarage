// Checks for the two quote-request emails (lib/quoteEmails.ts): the one the studio gets,
// with a "Load into Squarage Labs" button that carries the design to labs' design page,
// and the confirmation the customer gets, which carries only the design's own numbers.
//
// Usage: npx tsx scripts/verifyQuoteEmails.ts
import { labsImportUrl, buildStudioQuoteEmail, buildCustomerQuoteEmail, type QuoteEmailInput } from '../lib/quoteEmails'

let checks = 0
let failures = 0
function check(name: string, ok: boolean, detail?: string) {
  checks++
  if (!ok) {
    failures++
    console.log(`  FAIL ${name}${detail ? `: ${detail}` : ''}`)
  }
}

const savedDesign = {
  id: 'design-1759700000000',
  name: 'Living room wall',
  shelfType: 'flat',
  collection: 'warped',
  variant: 'standard',
  params: {
    isCorner: false, width: 48, height: 60, depth: 10, length: 36,
    shelfCount: 5, columnCount: 4, roundLeft: true, roundRight: false,
    amplitude: 1.35, shelfOffset: 0.3, columnOffset: 0.42,
    shelfStyle: 'largeBooks', autoColumns: true,
  },
  createdAt: 1759700000000,
  updatedAt: 1759700000000,
}

const base: QuoteEmailInput = {
  designName: 'Living room wall',
  customerName: 'Jordan Rivera',
  email: 'jordan@example.com',
  message: 'Could it be a little deeper? <b>thanks</b>',
  specs: {
    shelfType: 'flat',
    variant: 'standard',
    width: 48, height: 60, depth: 10, length: 36,
    shelfCount: 5, columnCount: 4,
    roundLeft: true, roundRight: false,
    finish: 'Walnut',
    amplitude: 1.35, shelfOffset: 0.3, columnOffset: 0.42,
    estimatedPrice: 1450,
    shelfStyle: 'Large books',
  },
  savedDesignJson: JSON.stringify(savedDesign, null, 2),
  labsOrigin: 'https://labs.squarage.com',
}

function decodeImportParam(url: string): unknown {
  const param = new URL(url).searchParams.get('import')
  if (!param) return null
  return JSON.parse(Buffer.from(param, 'base64url').toString('utf8'))
}

console.log('the labs link')
{
  const url = labsImportUrl(base.labsOrigin, base.savedDesignJson)
  check('builds a link', url !== null)
  if (url) {
    check('points at the design page', url.startsWith('https://labs.squarage.com/design?import='), url)
    const decoded = decodeImportParam(url) as Record<string, unknown> | null
    check('the link carries the design name', decoded?.name === savedDesign.name)
    check('the link carries the shelf type, collection and variant', decoded?.shelfType === 'flat' && decoded?.collection === 'warped' && decoded?.variant === 'standard')
    check('the link carries every param', JSON.stringify(decoded?.params) === JSON.stringify(savedDesign.params))
    check('the link is url-safe', /^[A-Za-z0-9_-]+$/.test(new URL(url).searchParams.get('import') ?? ''))
    check('the link is short enough for a mail client', url.length < 1200, `${url.length} chars`)
  }
  check('a trailing slash on the origin is dropped', labsImportUrl('https://labs.squarage.com/', base.savedDesignJson)?.startsWith('https://labs.squarage.com/design?import=') === true)
  check('a unicode name survives', (decodeImportParam(labsImportUrl(base.labsOrigin, JSON.stringify({ ...savedDesign, name: 'Café “Nook” ☕' })) ?? '') as { name?: string })?.name === 'Café “Nook” ☕')
  check('no origin, no link', labsImportUrl(undefined, base.savedDesignJson) === null && labsImportUrl('', base.savedDesignJson) === null)
  check('unparseable design data, no link', labsImportUrl(base.labsOrigin, '{not json') === null)
  check('design data without params, no link', labsImportUrl(base.labsOrigin, JSON.stringify({ name: 'x', shelfType: 'flat' })) === null)
  check('design data without a name, no link', labsImportUrl(base.labsOrigin, JSON.stringify({ shelfType: 'flat', params: savedDesign.params })) === null)
}

console.log('the studio email')
{
  const mail = buildStudioQuoteEmail(base)
  const url = labsImportUrl(base.labsOrigin, base.savedDesignJson)!
  check('subject names the design and the customer', mail.subject === 'Warped Shelf Quote: "Living room wall" - from Jordan Rivera', mail.subject)
  check('html has the button', mail.html.includes('Load into Squarage Labs'))
  check('html links the button to labs', mail.html.includes(`href="${url}"`))
  check('html has no JSON block', !mail.html.includes('<pre') && !mail.html.includes('squarage-saved-designs') && !mail.html.includes('&quot;shelfCount&quot;'))
  check('text has the link', mail.text.includes(url))
  check('text has no JSON block', !mail.text.includes('"shelfCount"') && !mail.text.includes('squarage-saved-designs'))
  check('html keeps the customer', mail.html.includes('Jordan Rivera') && mail.html.includes('jordan@example.com'))
  check('html keeps the message, escaped', mail.html.includes('Could it be a little deeper? &lt;b&gt;thanks&lt;/b&gt;') && !mail.html.includes('<b>thanks</b>'))
  check('html keeps the specs', mail.html.includes('Large books') && mail.html.includes('Walnut') && mail.html.includes('L: Yes / R: No'))
  check('text keeps the specs', mail.text.includes('Style: Large books') && mail.text.includes('Finish: Walnut'))
  check('reply-to is the customer', mail.replyTo === 'jordan@example.com')

  const hostile = buildStudioQuoteEmail({ ...base, designName: '<script>alert(1)</script>', customerName: 'A & B' })
  check('html escapes the design name', !hostile.html.includes('<script>') && hostile.html.includes('&lt;script&gt;'))
  check('html escapes the customer name', hostile.html.includes('A &amp; B'))

  const console_ = buildStudioQuoteEmail({ ...base, specs: { ...base.specs, variant: 'console', height: 26, depth: 14, shelfCount: 3, shelfStyle: undefined } })
  check('a console reads its surface height', console_.html.includes('Surface Height') && console_.text.includes('Surface Height'))
  check('a console is labelled', console_.html.includes('Console'))

  const corner = buildStudioQuoteEmail({ ...base, specs: { ...base.specs, shelfType: 'corner', variant: 'corner', columnAngle: 12 } })
  check('a corner reads its length and column angle', corner.html.includes('Length') && corner.html.includes('Column Angle') && corner.html.includes('12.0'))
  check('a corner has no round edges row', !corner.html.includes('Round Edges'))

  const noLink = buildStudioQuoteEmail({ ...base, labsOrigin: undefined })
  check('without a labs origin the raw design data is kept instead of the button', !noLink.html.includes('Load into Squarage Labs') && noLink.html.includes('<pre') && noLink.html.includes('&quot;shelfCount&quot;'))
  check('without a labs origin the text keeps the raw design data', noLink.text.includes('"shelfCount"'))
}

console.log('the customer email')
{
  const mail = buildCustomerQuoteEmail(base)
  const url = labsImportUrl(base.labsOrigin, base.savedDesignJson)!
  check('goes to the customer', mail.to === 'jordan@example.com')
  check('subject', mail.subject === 'We got your Warped shelf quote request', mail.subject)
  check('html greets by first name', mail.html.includes('Jordan') && !mail.html.includes('Jordan Rivera'))
  check('html names the design', mail.html.includes('Living room wall'))
  check('html gives the type and size', mail.html.includes('Standard') && mail.html.includes('48') && mail.html.includes('60') && mail.html.includes('10'))
  check('html gives the finish', mail.html.includes('Walnut'))
  check('html says the studio will be in touch', /in touch/i.test(mail.html))
  check('html invites a reply', /reply/i.test(mail.html))
  check('html carries no labs link', !mail.html.includes('labs.squarage.com') && !mail.html.includes(url) && !mail.html.includes('import='))
  check('html carries no design data', !mail.html.includes('<pre') && !mail.html.includes('shelfCount'))
  check('html does not echo the message', !mail.html.includes('a little deeper') && !mail.html.includes('thanks'))
  check('text greets, names the design, no link, no message', mail.text.includes('Jordan') && mail.text.includes('Living room wall') && !mail.text.includes('labs.squarage.com') && !mail.text.includes('a little deeper'))
  check('text gives the size', mail.text.includes('48') && mail.text.includes('60'))

  const hostile = buildCustomerQuoteEmail({ ...base, designName: '<img src=x onerror=alert(1)>', customerName: '<b>Sam</b> Lee' })
  check('html escapes the design name', !hostile.html.includes('<img') && hostile.html.includes('&lt;img'))
  check('html escapes the first name', !hostile.html.includes('<b>') && hostile.html.includes('&lt;b&gt;Sam&lt;/b&gt;'))

  const corner = buildCustomerQuoteEmail({ ...base, specs: { ...base.specs, shelfType: 'corner', variant: 'corner', width: 45, length: 36, height: 72 } })
  check('a corner reads width x length x height', corner.html.includes('Corner') && corner.text.includes('45') && corner.text.includes('36') && corner.text.includes('72'))
  const console_ = buildCustomerQuoteEmail({ ...base, specs: { ...base.specs, variant: 'console', height: 26, depth: 14, shelfCount: 3 } })
  check('a console is called a console', console_.html.includes('Console'))

  const oneName = buildCustomerQuoteEmail({ ...base, customerName: 'Cher' })
  check('a single name greets as is', oneName.html.includes('Cher'))
}

console.log(`\n${checks} checks, ${failures} failures`)
if (failures > 0) process.exit(1)
