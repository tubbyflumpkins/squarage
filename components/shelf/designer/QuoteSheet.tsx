'use client';

import { useCallback, useEffect, useId, useRef, useState, type Ref } from 'react';
import dynamic from 'next/dynamic';
import { generateMetaEventId, trackMetaBrowserEvent } from '@/lib/metaPixel';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';
import { consoleSurfaceHeight } from '@/lib/warped/shelfLayout';
import type { ShelfVariant } from '@/stores/useSavedDesigns';
import { SHELF_STYLES, type ShelfStyle } from '@/lib/warped/shelfStyles';
import type { WoodFinish } from './useDesign';

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

interface QuoteSheetProps {
  isCorner: boolean;
  /** The media console: a flat shelf whose top is a surface (flatParams.consoleTop draws it). */
  isConsole: boolean;
  flatParams: ShelfParams;
  cornerParams: CornerShelfParams;
  rotation: number;
  tilt: number;
  finish: WoodFinish;
  width: number;
  height: number;
  depth: number;
  length: number;
  price: number;
  shelfCount: number;
  columnCount: number;
  roundLeft: boolean;
  roundRight: boolean;
  amplitude: number;
  shelfOffset: number;
  columnOffset: number;
  columnAngle: number;
  /** The layout that set the shelf count. labs opens the design in the same mode. */
  shelfStyle: ShelfStyle | null;
  /** The column count was worked out from the size. labs opens the design in the same mode. */
  autoColumns: boolean;
  onClose: () => void;
  saveDesign: (name: string, shelfType: 'flat' | 'corner', params: Record<string, number | boolean | string>, svgPreview?: string, variant?: ShelfVariant) => void;
  getSvgPreview: () => string;
  /** The sheet is on screen. It stays mounted while off it, so it can slide in. */
  active: boolean;
}

function ShadowLabel({ children }: { children: string }) {
  return (
    <h2 className="relative font-neue-haas text-3xl font-bold text-white md:text-5xl">
      <span className="absolute translate-x-0.5 translate-y-0.5 text-[#F5B74C]" aria-hidden="true">{children}</span>
      <span className="relative z-10">{children}</span>
    </h2>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  optional?: boolean;
  error?: string;
  type?: string;
  autoComplete?: string;
  /** A number of rows makes it a text area. */
  rows?: number;
  inputRef?: Ref<HTMLInputElement>;
}

/** A cream field on its yellow shadow, with its label above and its error below. */
function Field({ label, value, onChange, placeholder, optional = false, error, type = 'text', autoComplete, rows, inputRef }: FieldProps) {
  const id = useId();
  const box = 'relative z-10 block w-full border-0 bg-cream px-4 py-2.5 font-neue-haas text-lg font-medium text-squarage-black placeholder:text-neutral-400 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  const shared = {
    id,
    value,
    placeholder,
    autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-neue-haas text-base font-bold text-white">
        {label}
        {optional && <span className="font-medium text-white/60"> (optional)</span>}
      </label>
      <div className="relative">
        {rows ? (
          <textarea {...shared} rows={rows} onChange={(e) => onChange(e.target.value)} className={`${box} resize-none`} />
        ) : (
          <input {...shared} ref={inputRef} type={type} onChange={(e) => onChange(e.target.value)} className={box} />
        )}
        <div className="absolute left-0 top-0 h-full w-full translate-x-1.5 translate-y-1.5 bg-[#F5B74C]" aria-hidden="true" />
      </div>
      {error && <p id={`${id}-error`} className="mt-2.5 font-neue-haas text-sm text-white">{error}</p>}
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Get Quote, on one page: who to send it to, an optional name for the design and an optional
 * note, then Submit. A sent request is answered with its receipt. The green sheet slides in over
 * the designer; the classic designer keeps the four-step flow (components/shelf/QuoteFlow).
 */
export default function QuoteSheet({
  isCorner, isConsole, flatParams, cornerParams, rotation, tilt, finish,
  width, height, depth, length, price, shelfCount, columnCount, roundLeft, roundRight,
  amplitude, shelfOffset, columnOffset, columnAngle, shelfStyle, autoColumns,
  onClose, saveDesign, getSvgPreview, active,
}: QuoteSheetProps) {
  const variant: ShelfVariant = isCorner ? 'corner' : isConsole ? 'console' : 'standard';
  const typeLabel = isCorner ? 'Corner' : isConsole ? 'Console' : 'Standard';

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [designName, setDesignName] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ customerName?: string; email?: string }>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  // What was sent, as the receipt shows it
  const [receipt, setReceipt] = useState<{ name: string; preview: string } | null>(null);
  const nameField = useRef<HTMLInputElement>(null);

  // The navigation changes its colours over the green sheet
  useEffect(() => {
    if (active) window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: true } }));
    return () => { window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: false } })); };
  }, [active]);

  // Each opening starts on the form. Who it is for is kept; a request already sent takes its
  // design name and note with it.
  useEffect(() => {
    if (!active) return;
    setErrors({});
    setSubmitError('');
    setStatus((previous) => {
      if (previous === 'sent') { setDesignName(''); setMessage(''); setReceipt(null); }
      return 'idle';
    });
    // With a mouse or trackpad, straight into the first field; on a phone that would only throw up the keyboard
    if (window.matchMedia('(pointer: fine)').matches) nameField.current?.focus({ preventScroll: true });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);

  // The render beside the form is a desktop thing, and is only built once the sheet has been opened
  const [wide, setWide] = useState(false);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => { if (active) setOpened(true); }, [active]);

  const dims = isCorner ? [width, length, height] : [width, height, depth];
  const dimStr = dims.map((v) => `${v}"`).join(' x ');

  const submit = useCallback(async () => {
    const problems: { customerName?: string; email?: string } = {};
    if (customerName.trim().length < 2) problems.customerName = 'Please enter your name.';
    if (!EMAIL.test(email.trim())) problems.email = 'Please enter a valid email.';
    setErrors(problems);
    if (problems.customerName || problems.email) return;

    setStatus('submitting');
    setSubmitError('');
    // A design left unnamed is called by what it is
    const name = designName.trim() || `${typeLabel} ${dims.join(' x ')}`;
    const preview = getSvgPreview();
    const shelfType = isCorner ? 'corner' : 'flat';
    const params: Record<string, number | boolean | string> = {
      isCorner, width, height, depth, length,
      shelfCount, columnCount, roundLeft, roundRight,
      amplitude, shelfOffset, columnOffset,
      ...(isCorner ? { columnAngle, wallAlign: 1 } : {}),
      ...(isConsole ? { consoleTop: true } : {}),
      ...(shelfStyle ? { shelfStyle } : {}),
      ...(autoColumns ? { autoColumns: true } : {}),
    };
    // collection + variant ride along so labs loads a console as a console
    const savedDesign = { id: `design-${Date.now()}`, name, shelfType, collection: 'warped', variant, params, createdAt: Date.now(), updatedAt: Date.now() };
    // Shared event id lets Meta dedupe the browser pixel event against the
    // Conversions API event the route sends (with hashed email) server-side.
    const metaEventId = generateMetaEventId();
    const estimatedPrice = Math.round(price / 50) * 50;
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designName: name,
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim(),
          specs: {
            shelfType, variant, width, height, depth, length,
            shelfCount, columnCount, roundLeft, roundRight,
            finish, amplitude, shelfOffset, columnOffset,
            columnAngle, estimatedPrice,
            ...(shelfStyle ? { shelfStyle: SHELF_STYLES[shelfStyle].label } : {}),
          },
          savedDesignJson: JSON.stringify(savedDesign, null, 2),
          metaEventId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSubmitError(body?.error || `Server error (${res.status})`);
        setStatus('error');
        return;
      }
      trackMetaBrowserEvent('Lead', { value: estimatedPrice, currency: 'USD', content_name: 'Warped Shelf Quote' }, metaEventId);
      // The design asked about is kept with the customer's saved designs, as it always was
      saveDesign(name, shelfType, params, preview, variant);
      setReceipt({ name, preview });
      setStatus('sent');
    } catch (err) {
      console.error('Quote submit failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dims and typeLabel follow the sizes and shape listed
  }, [customerName, email, designName, message, isCorner, isConsole, variant, width, height, depth, length, shelfCount, columnCount, roundLeft, roundRight, finish, amplitude, shelfOffset, columnOffset, columnAngle, shelfStyle, autoColumns, price, saveDesign, getSvgPreview]);

  // The console's end columns rise past its top, so the usable surface sits below the overall height
  const surfaceHeight = isConsole ? consoleSurfaceHeight(flatParams) : null;
  const specRows: [string, string][] = [
    ['Type', isCorner ? 'Corner Unit' : typeLabel],
    ['Width', `${width}"`],
    ['Height', `${height}"`],
    ...(surfaceHeight !== null ? [['Surface Height', `${surfaceHeight.toFixed(1)}"`] as [string, string]] : []),
    ['Depth', `${depth}"`],
    ...(isCorner ? [['Length', `${length}"`] as [string, string]] : []),
    ...(shelfStyle ? [['Layout', SHELF_STYLES[shelfStyle].label] as [string, string]] : []),
    ['Shelves', String(shelfCount)],
    ['Columns', String(columnCount)],
    ['Finish', finish],
    ...(!isCorner ? [['Round Edges', `L: ${roundLeft ? 'Yes' : 'No'} / R: ${roundRight ? 'Yes' : 'No'}`] as [string, string]] : []),
  ];

  const sent = status === 'sent' && receipt !== null;
  const submitting = status === 'submitting';
  const bigButton = 'relative w-full bg-[#F5B74C] py-4 font-neue-haas text-2xl font-bold transition-all duration-300 hover:scale-[1.02] hover:bg-squarage-blue disabled:hover:scale-100 disabled:hover:bg-[#F5B74C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  const quietButton = 'cursor-pointer font-neue-haas text-[15px] font-medium text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
  const bigLabel = (text: string) => (
    <>
      <span className="absolute inset-0 flex translate-x-0.5 translate-y-0.5 items-center justify-center text-[#F5B74C]" aria-hidden="true">{text}</span>
      <span className="relative z-10 text-white">{text}</span>
    </>
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-squarage-green">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-[68px] z-50 flex h-10 w-10 items-center justify-center text-3xl leading-none text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:right-6 md:top-[104px]"
      >
        &times;
      </button>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* The shelf beside the form on desktop. It slides away for the receipt. */}
        <div
          className="hidden shrink-0 overflow-hidden transition-all duration-500 ease-out md:block"
          style={{ width: sent ? 0 : '50%', opacity: sent ? 0 : 1, paddingLeft: sent ? 0 : '8%' }}
        >
          {wide && opened && (
            <div className="h-full w-full">
              <RenderedShelfView
                isCorner={isCorner}
                flatParams={flatParams}
                cornerParams={cornerParams}
                rotation={rotation + Math.PI / 4}
                tilt={tilt}
                finish={finish}
                width={width}
                height={height}
                depth={depth}
                length={length}
              />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 overflow-y-auto">
          {/* my-auto centres it while there is room and lets it scroll from the top when there is not.
              The top padding clears the site's navigation, which stays above the sheet. */}
          <div
            key={sent ? 'receipt' : 'form'}
            className={`mx-auto my-auto w-full max-w-md animate-[fadeSlideIn_250ms_ease-out_forwards] px-6 pb-8 pt-24 md:px-10 md:pt-28 ${sent ? 'md:max-w-4xl' : ''}`}
          >
            {sent ? (
              // A phone reads down: thanks, receipt, Done. Desktop puts the receipt beside the other two.
              <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-x-14 md:gap-y-7">
                <div className="md:col-start-1 md:row-start-1 md:self-end">
                  <ShadowLabel>Thank You</ShadowLabel>
                  <p className="mt-3 font-neue-haas text-lg font-medium text-white md:mt-4 md:text-xl">We&apos;ll be in touch shortly.</p>
                </div>

                {/* Receipt-style spec sheet */}
                <div className="relative md:col-start-2 md:row-span-2 md:row-start-1">
                  <div className="relative z-10 bg-cream px-5 py-5">
                    {receipt.preview && (
                      <div className="mb-4 flex h-[120px] w-full items-center justify-center md:h-[140px]">
                        <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: receipt.preview }} />
                      </div>
                    )}
                    <div className="mb-3 border-b border-dashed border-squarage-black/20" />
                    <h3 className="mb-1 font-neue-haas text-xl font-bold text-squarage-black">{receipt.name}</h3>
                    <p className="mb-3 font-neue-haas text-[13px] tabular-nums text-squarage-black/50">{dimStr}</p>
                    {specRows.map(([k, v]) => (
                      <div key={k} className="flex justify-between py-[5px]">
                        <span className="font-neue-haas text-[14px] text-squarage-black/60">{k}</span>
                        <span className="font-neue-haas text-[14px] font-medium tabular-nums text-squarage-black">{v}</span>
                      </div>
                    ))}
                    <div className="my-3 border-b border-dashed border-squarage-black/20" />
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="font-neue-haas text-[13px] text-squarage-black/50">Customer</span>
                        <span className="font-neue-haas text-[13px] font-medium text-squarage-black">{customerName.trim()}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-neue-haas text-[13px] text-squarage-black/50">Email</span>
                        <span className="break-all text-right font-neue-haas text-[13px] font-medium text-squarage-black">{email.trim().toLowerCase()}</span>
                      </div>
                      {message.trim() && (
                        <div className="pt-1">
                          <span className="font-neue-haas text-[13px] text-squarage-black/50">Note</span>
                          <p className="mt-0.5 whitespace-pre-wrap font-neue-haas text-[13px] italic text-squarage-black">{message.trim()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute left-0 top-0 h-full w-full translate-x-2 translate-y-2 bg-[#F5B74C]" aria-hidden="true" />
                </div>

                <button type="button" onClick={onClose} className={`${bigButton} mt-1 md:col-start-1 md:row-start-2 md:mt-0 md:self-start`}>{bigLabel('Done')}</button>
              </div>
            ) : (
              <form noValidate onSubmit={(e) => { e.preventDefault(); if (!submitting) submit(); }} className="flex flex-col gap-4">
                <div className="mb-1">
                  <ShadowLabel>Get a Quote</ShadowLabel>
                  <p className="mt-3 font-neue-haas text-base tabular-nums text-white/70">{typeLabel}, {dimStr}, {finish}</p>
                </div>
                <Field
                  label="Name"
                  value={customerName}
                  onChange={(v) => { setCustomerName(v); setErrors((e) => ({ ...e, customerName: undefined })); }}
                  placeholder="Your name"
                  autoComplete="name"
                  error={errors.customerName}
                  inputRef={nameField}
                />
                <Field
                  label="Email"
                  value={email}
                  onChange={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                  placeholder="you@email.com"
                  type="email"
                  autoComplete="email"
                  error={errors.email}
                />
                <Field label="Design name" optional value={designName} onChange={setDesignName} placeholder="e.g. Living Room Shelves" autoComplete="off" />
                <Field label="Notes" optional value={message} onChange={setMessage} placeholder="Your space, timeline, or any requests" rows={3} autoComplete="off" />

                {status === 'error' && (
                  <p role="alert" className="font-neue-haas text-base text-white">
                    That did not send. Please try again.
                    {submitError && <span className="mt-1 block text-xs text-white/60">{submitError}</span>}
                  </p>
                )}
                <button type="submit" disabled={submitting} className={`${bigButton} mt-2`}>
                  {bigLabel(submitting ? 'Sending...' : 'Submit')}
                </button>
                <button type="button" onClick={onClose} className={quietButton}>Back</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
