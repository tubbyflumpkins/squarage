'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type WoodFinish = 'Walnut' | 'Oak' | 'Birch';

interface QuoteFlowProps {
  isCorner: boolean;
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

// Step indicator — 4 circles connected by lines
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4 md:py-6 select-none">
      {[1, 2, 3, 4].map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold font-neue-haas transition-all duration-300 ${
              step < current
                ? 'bg-white text-squarage-red'
                : step === current
                  ? 'bg-[#F5B74C] text-white'
                  : 'border-2 border-white/40 text-white/40'
            }`}
          >
            {step < current ? (
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              step
            )}
          </div>
          {i < 3 && (
            <div className={`w-8 md:w-12 h-[2px] transition-colors duration-300 ${step < current ? 'bg-white' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Shadow label matching contact page style
function ShadowLabel({ children }: { children: string }) {
  return (
    <h2 className="text-3xl md:text-5xl font-bold font-neue-haas text-white mb-4 relative">
      <span className="absolute text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">{children}</span>
      <span className="relative z-10">{children}</span>
    </h2>
  );
}

// Input with yellow shadow box (contact page style)
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
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');

  // Form state
  const [designName, setDesignName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // SVG preview captured at save time
  const [svgPreview, setSvgPreview] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if design was saved
  const savedRef = useRef(false);

  // Notify navigation of quote flow state
  useEffect(() => {
    if (active) {
      window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: true } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('quoteflow', { detail: { open: false } }));
    };
  }, [active]);

  // Reset when opened
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

  // Escape key to go back / close
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
    setAnimDir('forward');
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 250);
  }, []);

  const goBack = useCallback(() => {
    setAnimDir('back');
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(1, s - 1));
      setAnimating(false);
    }, 250);
  }, []);

  // Step 1 → save design + advance
  const handleStep1 = useCallback(() => {
    if (!designName.trim()) {
      setErrors({ designName: 'Please name your design' });
      return;
    }
    setErrors({});
    // Capture SVG preview and save design
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

  // Step 2 validation
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

  // Step 3 → advance (optional)
  const handleStep3 = useCallback(() => {
    setErrors({});
    goForward(4);
  }, [goForward]);

  // Submit
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitStatus('idle');

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
            shelfType,
            width, height, depth, length,
            shelfCount, columnCount,
            roundLeft, roundRight,
            finish,
            amplitude, shelfOffset, columnOffset,
            columnAngle,
            estimatedPrice: price,
          },
          savedDesignJson: JSON.stringify(savedDesignObj, null, 2),
        }),
      });

      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => onClose(), 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  }, [designName, customerName, email, message, isCorner, width, height, depth, length, shelfCount, columnCount, roundLeft, roundRight, finish, amplitude, shelfOffset, columnOffset, columnAngle, price, onClose]);

  const animClass = animating
    ? 'animate-[fadeSlideOut_250ms_ease-out_forwards]'
    : 'animate-[fadeSlideIn_250ms_ease-out_forwards]';

  // Specs for review step
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

  // Dimension string
  const dimStr = isCorner
    ? `${width}" x ${length}" x ${height}"`
    : `${width}" x ${height}" x ${depth}"`;

  // Button styles
  const nextBtnClass = 'w-full py-4 bg-squarage-green font-bold font-neue-haas text-2xl hover:bg-squarage-blue hover:scale-[1.02] transition-all duration-300 relative';
  const backBtnClass = 'text-white/60 hover:text-white text-[15px] font-medium font-neue-haas transition-colors cursor-pointer';

  const renderStepContent = () => {
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

            {/* Receipt-style spec sheet inside a shadow box */}
            <div className="relative">
              <div className="relative z-10 bg-cream px-5 py-5">
                {/* SVG wireframe preview */}
                {svgPreview && (
                  <div className="w-full h-[140px] md:h-[180px] mb-4 flex items-center justify-center">
                    <div
                      className="w-full h-full [&_svg]:w-full [&_svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: svgPreview }}
                    />
                  </div>
                )}

                {/* Dashed separator */}
                <div className="border-b border-dashed border-squarage-black/20 mb-3" />

                {/* Design name */}
                <h3 className="text-xl font-bold font-neue-haas text-squarage-black mb-1">{designName}</h3>
                <p className="text-[13px] font-neue-haas text-squarage-black/50 mb-3 tabular-nums">{dimStr}</p>

                {/* Spec rows */}
                {specRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-[5px]">
                    <span className="text-[14px] font-neue-haas text-squarage-black/60">{k}</span>
                    <span className="text-[14px] font-medium font-neue-haas text-squarage-black tabular-nums">{v}</span>
                  </div>
                ))}

                {/* Dashed separator */}
                <div className="border-b border-dashed border-squarage-black/20 my-3" />

                {/* Estimated total */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[16px] font-bold font-neue-haas text-squarage-black">Estimated Total</span>
                  <span className="text-2xl font-bold font-neue-haas text-squarage-black tabular-nums">${Math.round(price)}</span>
                </div>

                {/* Dashed separator */}
                <div className="border-b border-dashed border-squarage-black/20 my-3" />

                {/* Customer info */}
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

            {/* Submit */}
            {submitStatus === 'success' ? (
              <div className="flex items-center justify-center gap-3 py-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#4A9B4E" strokeWidth="2" />
                  <path d="M8 14L12 18L20 10" stroke="#4A9B4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xl font-bold font-neue-haas text-white">Quote Sent!</span>
              </div>
            ) : submitStatus === 'error' ? (
              <div className="flex flex-col gap-3">
                <p className="text-white font-neue-haas text-center py-2">Something went wrong. Please try again.</p>
                <button onClick={handleSubmit} disabled={submitting} className={`${nextBtnClass} ${submitting ? 'opacity-50' : ''}`}>
                  <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">Retry</span>
                  <span className="relative z-10 text-white">Retry</span>
                </button>
              </div>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className={`${nextBtnClass} ${submitting ? 'opacity-50' : ''}`}>
                <span className="absolute inset-0 flex items-center justify-center text-[#F5B74C] transform translate-x-0.5 translate-y-0.5">
                  {submitting ? 'Sending...' : 'Submit Quote Request'}
                </span>
                <span className="relative z-10 text-white">
                  {submitting ? 'Sending...' : 'Submit Quote Request'}
                </span>
              </button>
            )}
            {submitStatus !== 'success' && (
              <button onClick={goBack} className={backBtnClass}>Back</button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-squarage-red overflow-hidden" style={{ animation: 'slideInRight 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards' }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white text-2xl transition-colors"
        aria-label="Close"
      >
        &times;
      </button>

      <StepIndicator current={step} />

      {/* Form content — centered vertically */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto">
        <div className={`w-full max-w-md px-6 md:px-10 py-4 ${animClass}`}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
