'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ShelfParams } from '@/components/shelf/ShelfVisualizer/types';
import type { CornerShelfParams } from '@/components/shelf/CornerShelfVisualizer/types';

const RenderedShelfView = dynamic(
  () => import('@/components/shelf/RenderedShelfView'),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface QuoteFlowProps {
  isCorner: boolean;
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
  onClose: () => void;
  saveDesign: (name: string, shelfType: 'flat' | 'corner', params: Record<string, number | boolean>, svgPreview?: string) => void;
  getSvgPreview: () => string;
  active: boolean;
}

function ShadowLabel({ children }: { children: string }) {
  return (
    <h2 className="text-3xl md:text-5xl font-bold font-neue-haas text-white mb-4 relative">
      <span className="absolute text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">{children}</span>
      <span className="relative z-10">{children}</span>
    </h2>
  );
}

function ShadowInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  rows,
  autoFocus,
  bottomHint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  rows?: number;
  autoFocus?: boolean;
  bottomHint?: string;
}) {
  const baseClasses = 'w-full px-4 py-3 bg-cream font-neue-haas font-medium text-xl focus:outline-none relative z-10 border-0 text-squarage-black';
  return (
    <div className="relative">
      {rows ? (
        <div className="relative z-10">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            className={`${baseClasses} resize-none ${bottomHint ? 'pb-8' : ''}`}
          />
          {bottomHint && !value && (
            <span className="absolute bottom-3 left-4 text-[14px] font-neue-haas font-medium text-neutral-400 pointer-events-none z-20">
              ({bottomHint})
            </span>
          )}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={baseClasses}
        />
      )}
      <div className="absolute top-0 left-0 w-full h-full bg-[#F5B74C] transform translate-x-2 translate-y-2" />
    </div>
  );
}

export default function QuoteFlow({
  isCorner,
  flatParams,
  cornerParams,
  rotation,
  tilt,
  finish,
  width,
  height,
  depth,
  length,
  price,
  shelfCount,
  columnCount,
  roundLeft,
  roundRight,
  amplitude,
  shelfOffset,
  columnOffset,
  columnAngle,
  onClose,
  saveDesign,
  getSvgPreview,
  active,
}: QuoteFlowProps) {
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);

  const [designName, setDesignName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [svgPreview, setSvgPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const savedRef = useRef(false);

  // Notify navigation
  useEffect(() => {
    if (active) {
      window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: true } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: false } }));
    };
  }, [active]);

  // Reset on open
  useEffect(() => {
    if (active) {
      setStep(1);
      setDesignName('');
      setCustomerName('');
      setEmail('');
      setMessage('');
      setSvgPreview('');
      setSubmitting(false);
      setSubmitStatus('idle');
      setErrors({});
      savedRef.current = false;
    }
  }, [active]);

  // Auto-close after success: wait 1.5s then slide out
  useEffect(() => {
    if (submitStatus !== 'success') return;
    const timer = setTimeout(() => onClose(), 1500);
    return () => clearTimeout(timer);
  }, [submitStatus, onClose]);

  // Escape key
  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step > 1) goBack();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  const goForward = useCallback((nextStep: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 250);
  }, []);

  const goBack = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(1, s - 1));
      setAnimating(false);
    }, 250);
  }, []);

  const handleStep1 = useCallback(() => {
    if (!designName.trim()) {
      setErrors({ designName: 'Please name your design' });
      return;
    }
    setErrors({});
    const preview = getSvgPreview();
    setSvgPreview(preview);
    if (!savedRef.current) {
      const shelfType = isCorner ? 'corner' : 'flat';
      const params: Record<string, number | boolean> = {
        isCorner, width, height, depth, length,
        shelfCount, columnCount, roundLeft, roundRight,
        amplitude, shelfOffset, columnOffset,
        ...(isCorner ? { columnAngle, wallAlign: 1 } : {}),
      };
      saveDesign(designName.trim(), shelfType, params, preview);
      savedRef.current = true;
    }
    goForward(2);
  }, [designName, isCorner, width, height, depth, length, shelfCount, columnCount, roundLeft, roundRight, amplitude, shelfOffset, columnOffset, columnAngle, saveDesign, getSvgPreview, goForward]);

  const handleStep2 = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (customerName.trim().length < 2) newErrors.customerName = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Please enter a valid email';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    goForward(3);
  }, [customerName, email, goForward]);

  const handleStep3 = useCallback(() => {
    setErrors({});
    goForward(4);
  }, [goForward]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');
    const shelfType = isCorner ? 'corner' : 'flat';
    const savedDesignObj = {
      id: `design-${Date.now()}`,
      name: designName.trim(),
      shelfType,
      params: {
        isCorner, width, height, depth, length,
        shelfCount, columnCount, roundLeft, roundRight,
        amplitude, shelfOffset, columnOffset,
        ...(isCorner ? { columnAngle, wallAlign: 1 } : {}),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designName: designName.trim(),
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim(),
          specs: {
            shelfType, width, height, depth, length,
            shelfCount, columnCount, roundLeft, roundRight,
            finish, amplitude, shelfOffset, columnOffset,
            columnAngle, estimatedPrice: Math.round(price / 50) * 50,
          },
          savedDesignJson: JSON.stringify(savedDesignObj, null, 2),
        }),
      });
      if (res.ok) {
        setSubmitStatus('success');
      } else {
        const errData = await res.json().catch(() => null);
        let errorMsg = errData?.error || `Server error (${res.status})`;
        if (errData?.details?.length) {
          const fields = errData.details.map((d: { path: string[]; message: string }) => d.path?.join('.') || d.message).join(', ');
          errorMsg += ` (${fields})`;
        }
        setSubmitError(errorMsg);
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error('Quote submit failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Network error');
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  }, [designName, customerName, email, message, isCorner, width, height, depth, length, shelfCount, columnCount, roundLeft, roundRight, finish, amplitude, shelfOffset, columnOffset, columnAngle, price, onClose]);

  const animClass = animating
    ? 'animate-[fadeSlideOut_250ms_ease-out_forwards]'
    : 'animate-[fadeSlideIn_250ms_ease-out_forwards]';

  const specRows: [string, string][] = [
    ['Type', isCorner ? 'Corner Unit' : 'Standard'],
    ['Width', `${width}"`],
    ['Height', `${height}"`],
    ['Depth', `${depth}"`],
    ...(isCorner ? [['Length', `${length}"`] as [string, string]] : []),
    ['Shelves', String(shelfCount)],
    ['Columns', String(columnCount)],
    ['Finish', finish],
    ...(!isCorner ? [['Round Edges', `L: ${roundLeft ? 'Yes' : 'No'} / R: ${roundRight ? 'Yes' : 'No'}`] as [string, string]] : []),
  ];

  const dimStr = isCorner
    ? `${width}" x ${length}" x ${height}"`
    : `${width}" x ${height}" x ${depth}"`;

  const nextBtnClass = 'w-full py-4 bg-[#F5B74C] font-bold font-neue-haas text-2xl hover:bg-squarage-blue hover:scale-[1.02] transition-all duration-300 relative';
  const backBtnClass = 'text-white/60 hover:text-white text-[15px] font-medium font-neue-haas transition-colors cursor-pointer';

  const isReview = step === 4;

  const renderFormContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-6">
            <ShadowLabel>Name Your Design</ShadowLabel>
            <ShadowInput
              value={designName}
              onChange={(v) => { setDesignName(v); setErrors({}); }}
              placeholder="e.g. Living Room Shelves"
              autoFocus
            />
            {errors.designName && <p className="text-white font-neue-haas text-sm -mt-4">{errors.designName}</p>}
            <button onClick={handleStep1} className={nextBtnClass}>
              <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Next</span>
              <span className="relative z-10 text-white">Next</span>
            </button>
            <button onClick={onClose} className={backBtnClass}>Back</button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-6">
            <ShadowLabel>Tell Us About You</ShadowLabel>
            <div>
              <label className="block text-lg font-bold font-neue-haas text-white mb-2">Name</label>
              <ShadowInput
                value={customerName}
                onChange={(v) => { setCustomerName(v); setErrors((e) => { const { customerName: _, ...rest } = e; return rest; }); }}
                placeholder="Your name"
                autoFocus
              />
              {errors.customerName && <p className="text-white font-neue-haas text-sm mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-lg font-bold font-neue-haas text-white mb-2">Email</label>
              <ShadowInput
                value={email}
                onChange={(v) => { setEmail(v); setErrors((e) => { const { email: _, ...rest } = e; return rest; }); }}
                placeholder="you@email.com"
                type="email"
              />
              {errors.email && <p className="text-white font-neue-haas text-sm mt-1">{errors.email}</p>}
            </div>
            <button onClick={handleStep2} className={nextBtnClass}>
              <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Next</span>
              <span className="relative z-10 text-white">Next</span>
            </button>
            <button onClick={goBack} className={backBtnClass}>Back</button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <ShadowLabel>Add a Message</ShadowLabel>
            <ShadowInput
              value={message}
              onChange={setMessage}
              placeholder="Tell us about your space, timeline, or any custom requests..."
              rows={5}
              autoFocus
              bottomHint="optional"
            />
            <button onClick={handleStep3} className={nextBtnClass}>
              <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Review</span>
              <span className="relative z-10 text-white">Review</span>
            </button>
            <button onClick={goBack} className={backBtnClass}>Back</button>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-5">
            <ShadowLabel>Review &amp; Submit</ShadowLabel>

            {/* Receipt-style spec sheet */}
            <div className="relative">
              <div className="relative z-10 bg-cream px-5 py-5">
                {svgPreview && (
                  <div className="w-full h-[140px] md:h-[180px] mb-4 flex items-center justify-center">
                    <div
                      className="w-full h-full [&_svg]:w-full [&_svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: svgPreview }}
                    />
                  </div>
                )}
                <div className="border-b border-dashed border-squarage-black/20 mb-3" />
                <h3 className="text-xl font-bold font-neue-haas text-squarage-black mb-1">{designName}</h3>
                <p className="text-[13px] font-neue-haas text-squarage-black/50 mb-3 tabular-nums">{dimStr}</p>
                {specRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-[5px]">
                    <span className="text-[14px] font-neue-haas text-squarage-black/60">{k}</span>
                    <span className="text-[14px] font-medium font-neue-haas text-squarage-black tabular-nums">{v}</span>
                  </div>
                ))}
                <div className="border-b border-dashed border-squarage-black/20 my-3" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[16px] font-bold font-neue-haas text-squarage-black">Estimated Total</span>
                  <span className="text-2xl font-bold font-neue-haas text-squarage-black tabular-nums">${Math.round(price / 50) * 50}</span>
                </div>
                <div className="border-b border-dashed border-squarage-black/20 my-3" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[13px] font-neue-haas text-squarage-black/50">Customer</span>
                    <span className="text-[13px] font-medium font-neue-haas text-squarage-black">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[13px] font-neue-haas text-squarage-black/50">Email</span>
                    <span className="text-[13px] font-medium font-neue-haas text-squarage-black">{email}</span>
                  </div>
                  {message && (
                    <div className="pt-1">
                      <span className="text-[13px] font-neue-haas text-squarage-black/50">Note</span>
                      <p className="text-[13px] font-neue-haas text-squarage-black mt-0.5 italic">{message}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-[#F5B74C] transform translate-x-2 translate-y-2" />
            </div>

            {submitting ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-full h-[3px] bg-white/20 overflow-hidden">
                  <div className="h-full bg-white animate-[loading_1.2s_ease-in-out_infinite]" />
                </div>
                <span className="text-[15px] font-medium font-neue-haas text-white/60">Submitting...</span>
              </div>
            ) : submitStatus === 'success' ? (
              <div className="flex items-center justify-center gap-3 py-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="2" />
                  <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xl font-bold font-neue-haas text-white">Design Submitted</span>
              </div>
            ) : submitStatus === 'error' ? (
              <div className="flex flex-col gap-3">
                <p className="text-white font-neue-haas text-center py-2">Something went wrong. Please try again.{submitError && <span className="block text-white/50 text-xs mt-1">{submitError}</span>}</p>
                <button onClick={handleSubmit} className={nextBtnClass}>
                  <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Retry</span>
                  <span className="relative z-10 text-white">Retry</span>
                </button>
                <button onClick={goBack} className={backBtnClass}>Back</button>
              </div>
            ) : (
              <>
                <button onClick={handleSubmit} className={nextBtnClass}>
                  <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Submit Quote Request</span>
                  <span className="relative z-10 text-white">Submit Quote Request</span>
                </button>
                <button onClick={goBack} className={backBtnClass}>Back</button>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-squarage-green overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white text-2xl transition-colors"
        aria-label="Close"
      >
        &times;
      </button>

      {/* Body: steps 1-3 = two-column (3D left, form right), step 4 = centered */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* 3D rendered view — slides out left on step 4 */}
        <div
          className="hidden md:block transition-all duration-500 ease-out shrink-0 overflow-hidden"
          style={{
            width: isReview ? 0 : '50%',
            opacity: isReview ? 0 : 1,
            paddingLeft: isReview ? 0 : '8%',
          }}
        >
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
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
        </div>

        {/* Mobile: 3D view on top for steps 1-3, hidden on step 4 */}
        {!isReview && (
          <div className="md:hidden h-[35dvh] w-full shrink-0 absolute top-[72px] left-0">
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

        {/* Form content — right side on steps 1-3, centered on step 4 */}
        <div className={`flex-1 flex min-h-0 overflow-y-auto transition-all duration-500 ${
          isReview ? 'items-start justify-center pt-20 md:pt-4 pb-6' : 'items-center justify-center md:pt-0 pt-[calc(35dvh)]'
        }`}>
          <div className={`w-full max-w-md px-6 md:px-10 py-4 ${animClass}`}>
            {renderFormContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
