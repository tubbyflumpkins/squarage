'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useSavedDesigns, type SavedDesign, type ShelfVariant } from '@/stores/useSavedDesigns';
import { PRESET_DESIGNS, type PresetDesign } from '@/data/presetDesigns';
import { preloadAllTextures } from '@/components/shelf/RenderedShelfView/useWoodMaterial';
import { preloadAllEdgeTextures } from '@/components/shelf/RenderedShelfView/useEdgeMaterial';
import { useShelfWasm, computeDerivedParams } from '@/lib/shelfGeometryWasm';
import { useBoomerangRotation } from '@/hooks/useBoomerangRotation';
import { PRESET_PRODUCT_HANDLES, designKey } from '@/lib/warped/catalogDesigns';
import { shopifyApi } from '@/lib/shopify';
import { formatPrice } from '@/lib/formatPrice';
import { cameraFor, designFromSaved, rangesFor, useDesign, type DimUnit, type WoodFinish } from './useDesign';
import { CountField, DimensionField, GroupHeading, Segmented } from './controls';
import { designSvgPreview } from './svgPreview';

const RenderedShelfView = dynamic(() => import('@/components/shelf/RenderedShelfView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="animate-pulse font-neue-haas text-base text-neutral-400">Loading 3D view</span>
    </div>
  ),
});

const QuoteFlow = dynamic(() => import('@/components/shelf/QuoteFlow'), { ssr: false });

/** Camera tilt, in degrees. The same view the classic designer and the shared links use. */
const TILT = 25;

const SHAPES: readonly { value: ShelfVariant; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'corner', label: 'Corner' },
  { value: 'console', label: 'Console' },
];

const UNITS: readonly { value: DimUnit; label: string }[] = [
  { value: 'in', label: 'in' },
  { value: 'cm', label: 'cm' },
];

const DESIGN_TABS: readonly { value: 'preset' | 'saved'; label: string }[] = [
  { value: 'preset', label: 'Our designs' },
  { value: 'saved', label: 'Saved' },
];

const WOOD_FINISHES: { name: WoodFinish; texture: string }[] = [
  { name: 'Walnut', texture: '/textures/swatches/walnut.webp' },
  { name: 'Oak', texture: '/textures/swatches/oak.webp' },
  { name: 'Birch', texture: '/textures/swatches/birch.webp' },
];

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-squarage-black';
const viewerButton = `border-2 px-3 py-1.5 font-neue-haas text-[13px] font-medium transition-colors duration-200 md:text-sm ${focusRing}`;

export default function ShelfDesigner() {
  const {
    design, set, setShape, load, finish, setFinish, unit, setUnit, fitLine, fmtLen,
    isCorner, isConsole, amplitude, shelfOffset, columnOffset, columnAngle,
    flatParams, cornerParams, opening, surfaceHeight,
  } = useDesign();
  const ranges = rangesFor(design.shape);

  const [showDimensions, setShowDimensions] = useState(true);
  const [showQuoteFlow, setShowQuoteFlow] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [designTab, setDesignTab] = useState<'preset' | 'saved'>('preset');
  const [moreOpen, setMoreOpen] = useState(false);

  // The idle sweep, drag to turn. Each shape opens at its own angle.
  const { rotation, handlers, reset } = useBoomerangRotation(cameraFor(design.shape));
  useEffect(() => { reset(cameraFor(design.shape).initialRotationDeg); }, [design.shape, reset]);

  const { designs, loadDesign, saveDesign, deleteDesign, loadDesigns, resetToNew } = useSavedDesigns();
  useEffect(() => { loadDesigns(); }, [loadDesigns]);

  // A product page's "Customize this design" arrives as ?design=<preset>: open on that design
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('design');
    const preset = key ? PRESET_DESIGNS.find((d) => designKey(d.id) === key) : undefined;
    if (preset) load(designFromSaved(preset.shelfType, preset.variant, preset.params));
  }, [load]);

  // Textures load per finish on demand; warm the full set while idle so the finish picker never
  // flashes the untextured fallback.
  useEffect(() => {
    const warm = () => { preloadAllTextures(); preloadAllEdgeTextures(); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 2000);
    return () => clearTimeout(t);
  }, []);

  // Presets that are catalog products carry that product's price
  const [catalogPrices, setCatalogPrices] = useState<Record<string, { amount: string; currencyCode: string }>>({});
  useEffect(() => {
    let cancelled = false;
    shopifyApi.getProductPrices(Object.values(PRESET_PRODUCT_HANDLES)).then((prices) => {
      if (!cancelled) setCatalogPrices(prices);
    });
    return () => { cancelled = true; };
  }, []);
  const presetPrice = (preset: PresetDesign): string | null => {
    const price = catalogPrices[PRESET_PRODUCT_HANDLES[preset.id]];
    return price ? formatPrice(price.amount, price.currencyCode) : null;
  };

  // The studio's rough estimate, sent with a quote request and never shown. WASM's formula.
  const wasmReady = useShelfWasm();
  const price = useMemo(() => {
    if (!wasmReady) return 0;
    return computeDerivedParams({
      isCorner, width: design.width, height: design.height, depth: design.depth, length: design.length,
      shelfCount: design.shelfCount, columnCount: design.columnCount,
    }).price;
  }, [wasmReady, isCorner, design]);

  const getSvgPreview = useCallback(
    () => designSvgPreview(design, flatParams, rotation, TILT),
    [design, flatParams, rotation],
  );

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    // The shape labs' importer reads: collection + variant ride along in the store
    const params: Record<string, number | boolean> = {
      isCorner, width: design.width, height: design.height, depth: design.depth, length: design.length,
      shelfCount: design.shelfCount, columnCount: design.columnCount,
      roundLeft: design.roundLeft, roundRight: design.roundRight,
      amplitude, shelfOffset, columnOffset,
      ...(isCorner ? { columnAngle, wallAlign: 1 } : {}),
      ...(isConsole ? { consoleTop: true } : {}),
    };
    saveDesign(name, isCorner ? 'corner' : 'flat', params, getSvgPreview(), design.shape);
    setSaveName('');
    setShowSaveInput(false);
    setDesignTab('saved');
  };

  const handleLoadSaved = (saved: SavedDesign) => {
    const loaded = loadDesign(saved.id);
    if (loaded) load(designFromSaved(saved.shelfType, loaded.variant, loaded.params));
  };

  const handleLoadPreset = (preset: PresetDesign) => {
    load(designFromSaved(preset.shelfType, preset.variant, preset.params));
    resetToNew();
  };

  const designCard = 'group relative h-28 w-28 shrink-0 border-2 border-gray-300 bg-white/40 transition-colors duration-200 hover:border-squarage-black';
  const designCardButton = `absolute inset-0 text-left ${focusRing}`;

  return (
    <div className="bg-cream md:pt-[90px] lg:pt-[98px]">
      {/* A phone has no header bar, only the floating logo and menu button. This strip holds
          their band so the page scrolls away beneath it and never shows above the pinned model. */}
      <div className="sticky top-0 z-20 h-[60px] bg-cream md:hidden" aria-hidden="true" />
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_460px]">

        {/* Viewer: pinned while the controls scroll */}
        <div className="sticky top-[60px] z-20 h-[42dvh] border-y-2 border-squarage-black bg-cream md:top-[90px] lg:top-[98px] lg:h-[calc(100dvh-98px)] lg:border-b-0 lg:border-r-2">
          <div className="relative h-full w-full" style={{ viewTransitionName: 'shelf-viewer' } as React.CSSProperties}>
            <div className="absolute inset-x-0 bottom-0 top-12 cursor-grab touch-none active:cursor-grabbing md:top-20" {...handlers}>
              <RenderedShelfView
                isCorner={isCorner}
                flatParams={flatParams}
                cornerParams={cornerParams}
                rotation={rotation + Math.PI / 4}
                tilt={TILT}
                finish={finish}
                width={design.width}
                height={design.height}
                depth={design.depth}
                length={design.length}
                dimensionUnit={showDimensions ? unit : undefined}
                cameraPadding={showDimensions ? (isCorner ? 0.56 : 0.5) : undefined}
              />
            </div>

            {/* Title: sits on the render, as on the /custom page */}
            <h1 className="pointer-events-none absolute left-3 top-3 z-10 flex select-none flex-wrap items-center gap-x-2 font-neue-haas text-xl font-bold leading-tight text-squarage-black md:left-6 md:top-5 md:gap-x-3 md:text-3xl lg:text-4xl">
              <span
                className="inline-block text-white"
                style={{ backgroundColor: '#4A9B4E', borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%', padding: '0.35em 0.5em 0.4em' }}
              >
                Warped
              </span>
              <span>Shelf Designer</span>
            </h1>

            <div className="absolute bottom-2 right-3 z-10 flex gap-2 md:bottom-auto md:right-5 md:top-5">
              <button
                type="button"
                aria-pressed={showDimensions}
                onClick={() => setShowDimensions((v) => !v)}
                className={`${viewerButton} ${
                  showDimensions
                    ? 'border-squarage-green bg-squarage-green text-white'
                    : 'border-squarage-black bg-cream text-squarage-black hover:text-squarage-green'
                }`}
              >
                Dimensions
              </button>
              <button
                type="button"
                onClick={() => setShowSaveInput((v) => !v)}
                className={`${viewerButton} border-squarage-black bg-cream text-squarage-black hover:text-squarage-green`}
              >
                {showSaveInput ? 'Cancel' : 'Save'}
              </button>
              {showSaveInput && (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                  className="absolute bottom-full right-0 mb-2 flex w-[calc(100vw-24px)] max-w-[340px] gap-3 border-2 border-squarage-black bg-cream p-3 md:bottom-auto md:top-full md:mb-0 md:mt-2"
                >
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name this design"
                    aria-label="Design name"
                    autoFocus
                    className="min-w-0 flex-1 border-0 border-b-2 border-squarage-black bg-transparent px-1 py-1.5 font-neue-haas text-base font-medium text-squarage-black outline-none placeholder:text-neutral-400 focus:border-squarage-green"
                  />
                  <button
                    type="submit"
                    disabled={!saveName.trim()}
                    className={`shrink-0 bg-squarage-green px-4 py-1.5 font-neue-haas text-sm font-bold text-white transition-colors duration-200 hover:bg-squarage-yellow disabled:bg-gray-400 ${focusRing}`}
                  >
                    Save design
                  </button>
                </form>
              )}
            </div>

            <span className="pointer-events-none absolute bottom-3 left-3 select-none font-neue-haas text-[12px] font-medium text-squarage-black/50 md:bottom-5 md:left-6 md:text-sm">
              <span className="hidden md:inline">Drag to rotate</span>
              <span className="md:hidden">Swipe to rotate</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div>
          {/* The rule under the header stays put while the controls scroll beneath it */}
          <div className="sticky top-[98px] z-10 hidden h-0 border-t-2 border-squarage-black lg:block" aria-hidden="true" />
          <div className="space-y-9 px-6 pb-10 pt-6 lg:px-10 lg:pt-8">

            <section>
              <GroupHeading aside={<Segmented compact label="Designs to start from" options={DESIGN_TABS} value={designTab} onChange={setDesignTab} />}>
                Start from
              </GroupHeading>
              {designTab === 'saved' && designs.length === 0 ? (
                <p className="font-neue-haas text-base text-gray-600">Nothing saved yet. Use Save on the model to keep a design in this browser.</p>
              ) : (
                <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 lg:-mx-10 lg:px-10">
                  {designTab === 'preset'
                    ? PRESET_DESIGNS.map((preset) => (
                        <div key={preset.id} className={designCard}>
                          <div className="h-full w-full p-2 pb-6" dangerouslySetInnerHTML={{ __html: preset.svgPreview }} />
                          <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-1 font-neue-haas text-[13px] font-medium text-squarage-black">{preset.name}</span>
                          {presetPrice(preset) && (
                            <span className="absolute right-1.5 top-1 font-neue-haas text-[13px] font-medium tabular-nums text-squarage-black/60">{presetPrice(preset)}</span>
                          )}
                          <button type="button" aria-label={`Start from ${preset.name}`} onClick={() => handleLoadPreset(preset)} className={designCardButton} />
                        </div>
                      ))
                    : designs.map((saved) => (
                        <div key={saved.id} className={designCard}>
                          {saved.svgPreview && <div className="h-full w-full p-2 pb-6" dangerouslySetInnerHTML={{ __html: saved.svgPreview }} />}
                          <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-1 font-neue-haas text-[13px] font-medium text-squarage-black">{saved.name}</span>
                          <button type="button" aria-label={`Open ${saved.name}`} onClick={() => handleLoadSaved(saved)} className={designCardButton} />
                          <button
                            type="button"
                            aria-label={`Delete ${saved.name}`}
                            onClick={() => deleteDesign(saved.id)}
                            className={`absolute right-0 top-0 flex h-7 w-7 items-center justify-center font-neue-haas text-base text-squarage-black transition-colors duration-200 hover:bg-squarage-black hover:text-white ${focusRing}`}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                </div>
              )}
            </section>

            <section>
              <GroupHeading>1. Shape</GroupHeading>
              <Segmented label="Shape" options={SHAPES} value={design.shape} onChange={setShape} />
            </section>

            <section>
              <GroupHeading aside={<Segmented compact label="Units" options={UNITS} value={unit} onChange={setUnit} />}>2. Size</GroupHeading>
              <div className="space-y-4">
                <DimensionField label="Width" value={design.width} range={ranges.width} unit={unit} onChange={(v) => set('width', v)} />
                {isCorner && (
                  <DimensionField label="Length" value={design.length} range={ranges.length} unit={unit} onChange={(v) => set('length', v)} />
                )}
                <DimensionField label="Height" value={design.height} range={ranges.height} unit={unit} onChange={(v) => set('height', v)} />
                <DimensionField label="Depth" value={design.depth} range={ranges.depth} unit={unit} onChange={(v) => set('depth', v)} />
              </div>
            </section>

            <section>
              <GroupHeading>3. Layout</GroupHeading>
              <div className="space-y-4">
                <CountField label="Shelves" value={design.shelfCount} range={ranges.shelfCount} onChange={(v) => set('shelfCount', v)} />
                <CountField label="Columns" value={design.columnCount} range={ranges.columnCount} onChange={(v) => set('columnCount', v)} />
              </div>
              {surfaceHeight !== null && (
                <p className="mt-4 border-l-2 border-squarage-green pl-3 font-neue-haas text-base text-squarage-black">
                  The top surface sits at <span className="font-medium tabular-nums">{fmtLen(surfaceHeight)}</span>.
                </p>
              )}
            </section>

            <section>
              <GroupHeading aside={<span className="font-neue-haas text-base text-gray-600">{finish}</span>}>4. Finish</GroupHeading>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {WOOD_FINISHES.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    aria-pressed={finish === f.name}
                    onClick={() => setFinish(f.name)}
                    className={`border-2 px-3 py-3 font-neue-haas text-sm font-medium transition-all md:px-4 md:text-base ${focusRing} ${
                      finish === f.name ? 'border-squarage-green bg-green-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 shrink-0 border border-gray-300 bg-cover bg-center" style={{ backgroundImage: `url(${f.texture})` }} />
                      <span>{f.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {!isCorner && (
              <section className="border-y border-squarage-black">
                <button
                  type="button"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`flex w-full items-center justify-between py-4 text-left ${focusRing}`}
                >
                  <span className="font-neue-haas text-lg font-medium text-squarage-black">More options</span>
                  {moreOpen ? <MinusIcon className="h-5 w-5 text-squarage-black" /> : <PlusIcon className="h-5 w-5 text-squarage-black" />}
                </button>
                {moreOpen && (
                  <div className="pb-5">
                    <p className="mb-3 font-neue-haas text-base text-squarage-black">
                      Rounded ends. A rounded end curves back to the wall.
                    </p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {([['roundLeft', 'Left end'], ['roundRight', 'Right end']] as const).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={design[key]}
                          onClick={() => set(key, !design[key])}
                          className={`border-2 px-3 py-3 font-neue-haas text-sm font-medium transition-all md:text-base ${focusRing} ${
                            design[key] ? 'border-squarage-green bg-green-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* The action. Fixed to the screen on a phone, pinned to the foot of the column on desktop. */}
          <div
            className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-squarage-black bg-cream px-4 pt-3 transition-opacity duration-300 lg:sticky lg:inset-x-auto lg:px-10 lg:pt-5 ${
              showQuoteFlow ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <p className="mb-2 text-center font-neue-haas text-[13px] font-medium text-squarage-black/70 lg:mb-3 lg:text-left lg:text-base">
              <span className="tabular-nums">{fmtLen(opening)}</span> openings. {fitLine}
            </p>
            <button
              type="button"
              onClick={() => setShowQuoteFlow(true)}
              className={`w-full bg-squarage-orange py-3 font-neue-haas text-xl font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-squarage-yellow lg:py-4 lg:text-2xl ${focusRing}`}
            >
              Get Quote
            </button>
            <p className="mt-3 hidden text-center font-neue-haas text-xs text-gray-500 lg:block lg:pb-2">
              Made to order in Los Angeles. Quotes are free.
            </p>
          </div>
          {/* Room for the fixed bar on a phone, so the last control can scroll clear of it */}
          <div className="h-32 lg:hidden" aria-hidden="true" />
        </div>
      </div>

      {/* Quote flow: always mounted, slides in over the page */}
      <div
        className="fixed inset-0 z-50"
        style={{
          transform: showQuoteFlow ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 500ms cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          pointerEvents: showQuoteFlow ? 'auto' : 'none',
        }}
      >
        <QuoteFlow
          isCorner={isCorner}
          isConsole={isConsole}
          flatParams={flatParams}
          cornerParams={cornerParams}
          rotation={rotation}
          tilt={TILT}
          finish={finish}
          width={design.width}
          height={design.height}
          depth={design.depth}
          length={design.length}
          price={price}
          shelfCount={design.shelfCount}
          columnCount={design.columnCount}
          roundLeft={design.roundLeft}
          roundRight={design.roundRight}
          amplitude={amplitude}
          shelfOffset={shelfOffset}
          columnOffset={columnOffset}
          columnAngle={columnAngle}
          onClose={() => setShowQuoteFlow(false)}
          saveDesign={saveDesign}
          getSvgPreview={getSvgPreview}
          active={showQuoteFlow}
        />
      </div>
    </div>
  );
}
