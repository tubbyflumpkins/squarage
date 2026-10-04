'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSavedDesigns, type SavedDesign, type ShelfVariant } from '@/stores/useSavedDesigns';
import { PRESET_DESIGNS } from '@/data/presetDesigns';
import { preloadAllTextures } from '@/components/shelf/RenderedShelfView/useWoodMaterial';
import { preloadAllEdgeTextures } from '@/components/shelf/RenderedShelfView/useEdgeMaterial';
import type { ResizableDimension } from '@/components/shelf/RenderedShelfView/DimensionOverlay';
import { useShelfWasm, computeDerivedParams } from '@/lib/shelfGeometryWasm';
import { useBoomerangRotation } from '@/hooks/useBoomerangRotation';
import { designKey } from '@/lib/warped/catalogDesigns';
import { SHELF_STYLES, SHELF_STYLE_IDS } from '@/lib/warped/shelfStyles';
import { cameraFor, designFromSaved, rangesFor, useDesign, type DimUnit, type WoodFinish } from './useDesign';
import { CountField, DimensionField, Panel, Segmented, TogglePill, focusRing } from './controls';
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

// The wood pills of the Warped collection page: the finish's own grain as the button
const WOOD_FINISHES: { name: WoodFinish; texture: string }[] = [
  { name: 'Walnut', texture: '/textures/walnut.webp' },
  { name: 'Oak', texture: '/textures/oak.webp' },
  { name: 'Birch', texture: '/textures/birch.webp' },
];

type PanelId = 'shape' | 'style' | 'size' | 'layout' | 'finish' | 'saved';

const viewerPill = `rounded-full border px-4 py-1.5 font-neue-haas text-[13px] font-medium backdrop-blur-sm transition-colors duration-200 md:text-sm ${focusRing}`;

export default function ShelfDesigner() {
  const {
    design, set, setShape, setStyle, styleNote, load, finish, setFinish, unit, setUnit, inCm, fmtLen,
    isCorner, isConsole, amplitude, shelfOffset, columnOffset, columnAngle,
    flatParams, cornerParams, opening, surfaceHeight,
  } = useDesign();
  const ranges = rangesFor(design.shape);

  // The cards on the right open one at a time
  const [openPanel, setOpenPanel] = useState<PanelId | null>('style');
  const toggle = (id: PanelId) => setOpenPanel((current) => (current === id ? null : id));

  const [showDimensions, setShowDimensions] = useState(true);
  const [showQuoteFlow, setShowQuoteFlow] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');

  // The idle sweep, drag to turn. Each shape opens at its own angle, and the sweep holds still
  // while a measurement's dot is being dragged so the dot stays under the pointer.
  const [resizing, setResizing] = useState(false);
  const { rotation, handlers, reset } = useBoomerangRotation({ ...cameraFor(design.shape), paused: resizing });
  useEffect(() => { reset(cameraFor(design.shape).initialRotationDeg); }, [design.shape, reset]);
  const resize = useCallback((dimension: ResizableDimension, inches: number) => set(dimension, inches), [set]);

  const { designs, loadDesign, saveDesign, deleteDesign, loadDesigns } = useSavedDesigns();
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
    const params: Record<string, number | boolean | string> = {
      isCorner, width: design.width, height: design.height, depth: design.depth, length: design.length,
      shelfCount: design.shelfCount, columnCount: design.columnCount,
      roundLeft: design.roundLeft, roundRight: design.roundRight,
      amplitude, shelfOffset, columnOffset,
      ...(isCorner ? { columnAngle, wallAlign: 1 } : {}),
      ...(isConsole ? { consoleTop: true } : {}),
      // labs opens the design in the same mode, with the count the style worked out
      ...(design.style ? { shelfStyle: design.style } : {}),
    };
    saveDesign(name, isCorner ? 'corner' : 'flat', params, getSvgPreview(), design.shape);
    setSaveName('');
    setShowSaveInput(false);
    setOpenPanel('saved');
  };

  const handleLoadSaved = (saved: SavedDesign) => {
    const loaded = loadDesign(saved.id);
    if (loaded) load(designFromSaved(saved.shelfType, loaded.variant, loaded.params));
  };

  // What each closed card says about its contents
  const shownSizes = (isCorner ? [design.width, design.length, design.height] : [design.width, design.height, design.depth])
    .map((v) => (inCm ? Math.round(v * 2.54) : +v.toFixed(2)));
  const sizeSummary = `${shownSizes.join(' × ')} ${unit}`;
  const layoutSummary = `${design.shelfCount} shelves, ${design.columnCount} columns`;
  const style = design.style ? SHELF_STYLES[design.style] : null;
  // A length range in the customer's unit: "13 to 14.5 in", "33 to 37 cm"
  const fmtRange = (min: number, max: number) =>
    inCm ? `${Math.round(min * 2.54)} to ${Math.round(max * 2.54)} cm` : `${min} to ${max} in`;

  return (
    <div className="bg-cream md:pt-[90px] lg:pt-[98px]">
      {/* A phone has no header bar, only the floating logo and menu button. This strip holds
          their band so the page scrolls away beneath it and never shows above the pinned model. */}
      <div className="sticky top-0 z-20 h-[60px] bg-cream md:hidden" aria-hidden="true" />

      <div className="lg:relative lg:h-[calc(100dvh-98px)] lg:min-h-[640px]">

        {/* The model: pinned above the cards on a phone, filling the screen beside them on desktop */}
        <div className="sticky top-[60px] z-20 h-[calc(44dvh+3.5rem)] bg-cream md:top-[90px] md:h-[44dvh] lg:absolute lg:inset-y-0 lg:left-0 lg:right-[420px] lg:h-auto">
          <div className="relative h-full w-full" style={{ viewTransitionName: 'shelf-viewer' } as React.CSSProperties}>
            <div className="absolute inset-x-0 bottom-14 top-12 cursor-grab touch-none active:cursor-grabbing md:bottom-0 md:top-20" {...handlers}>
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
                onDimensionResize={resize}
                onDimensionResizeActive={setResizing}
                cameraPadding={showDimensions ? (isCorner ? 0.58 : 0.54) : undefined}
                floor
              />
            </div>

            {/* Title: sits on the render, as on the /custom page */}
            <h1 className="pointer-events-none absolute left-4 top-3 z-10 flex select-none flex-wrap items-center gap-x-2 font-neue-haas text-xl font-bold leading-tight text-squarage-black md:left-6 md:top-5 md:gap-x-3 md:text-3xl lg:text-4xl">
              <span
                className="inline-block text-white"
                style={{ backgroundColor: '#4A9B4E', borderRadius: '45% 55% 70% 30% / 60% 40% 60% 40%', padding: '0.35em 0.5em 0.4em' }}
              >
                Warped
              </span>
              <span>Shelf Designer</span>
            </h1>

            <div className="absolute bottom-3 right-4 z-10 flex gap-2 md:bottom-auto md:right-6 md:top-6">
              <button
                type="button"
                aria-pressed={showDimensions}
                onClick={() => setShowDimensions((v) => !v)}
                className={`${viewerPill} ${
                  showDimensions
                    ? 'border-squarage-green bg-squarage-green text-white'
                    : 'border-gray-300 bg-white/80 text-squarage-black hover:border-gray-400'
                }`}
              >
                Dimensions
              </button>
              <button
                type="button"
                onClick={() => setShowSaveInput((v) => !v)}
                className={`${viewerPill} border-gray-300 bg-white/80 text-squarage-black hover:border-gray-400`}
              >
                {showSaveInput ? 'Cancel' : 'Save'}
              </button>
              {showSaveInput && (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                  className="absolute bottom-full right-0 mb-2 flex w-[calc(100vw-32px)] max-w-[340px] gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_10px_30px_rgba(51,51,51,0.12)] md:bottom-auto md:top-full md:mb-0 md:mt-2"
                >
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name this design"
                    aria-label="Design name"
                    autoFocus
                    className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 font-neue-haas text-base text-squarage-black outline-none placeholder:text-neutral-400 focus:border-squarage-green focus:ring-2 focus:ring-squarage-green/20"
                  />
                  <button
                    type="submit"
                    disabled={!saveName.trim()}
                    className={`shrink-0 rounded-full bg-squarage-green px-4 py-2 font-neue-haas text-sm font-bold text-white transition-colors duration-200 hover:bg-squarage-yellow disabled:bg-gray-300 ${focusRing}`}
                  >
                    Save design
                  </button>
                </form>
              )}
            </div>

            <span className="pointer-events-none absolute bottom-4 left-4 select-none font-neue-haas text-[12px] text-squarage-black/45 md:bottom-5 md:left-6 md:text-sm">
              <span className="hidden md:inline">{showDimensions ? 'Drag to rotate. Drag a dot to resize.' : 'Drag to rotate.'}</span>
              <span className="md:hidden">{showDimensions ? 'Swipe to rotate. Drag a dot to resize.' : 'Swipe to rotate.'}</span>
            </span>
          </div>
        </div>

        {/* The cards: beneath the model on a phone, floating at the right on desktop */}
        <div className="lg:absolute lg:bottom-5 lg:right-6 lg:top-5 lg:flex lg:w-[380px] lg:flex-col">
          <div className="space-y-3 px-4 pb-4 pt-4 lg:-mx-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-3 lg:pb-6 lg:pt-1">

            <Panel title="Shape" value={SHAPES.find((s) => s.value === design.shape)?.label ?? ''} open={openPanel === 'shape'} onToggle={() => toggle('shape')}>
              <Segmented label="Shape" options={SHAPES} value={design.shape} onChange={setShape} />
              {!isCorner && (
                <div className="mt-5">
                  <p className="font-neue-haas text-base font-medium text-squarage-black">Rounded ends</p>
                  <p className="mb-3 font-neue-haas text-sm text-gray-500">A rounded end curves back to the wall.</p>
                  <div className="flex gap-2">
                    <TogglePill pressed={design.roundLeft} onChange={(v) => set('roundLeft', v)}>Left</TogglePill>
                    <TogglePill pressed={design.roundRight} onChange={(v) => set('roundRight', v)}>Right</TogglePill>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Style" value={style ? style.label : 'None'} open={openPanel === 'style'} onToggle={() => toggle('style')}>
              <p className="mb-3 font-neue-haas text-sm text-gray-500">Pick what goes on it. The shelves space themselves to suit.</p>
              <div className="flex flex-wrap gap-2">
                {SHELF_STYLE_IDS.map((id) => (
                  <TogglePill key={id} pressed={design.style === id} onChange={(on) => setStyle(on ? id : null)}>
                    {SHELF_STYLES[id].label}
                  </TogglePill>
                ))}
              </div>
              {style && (
                <p className="mt-4 font-neue-haas text-sm text-gray-500">
                  {style.label} want openings of {fmtRange(style.min, style.max)}. At this height that is{' '}
                  <span className="font-medium text-squarage-black">{design.shelfCount} shelves</span> with{' '}
                  <span className="font-medium tabular-nums text-squarage-black">{fmtLen(opening)}</span> openings.
                </p>
              )}
              {styleNote && (
                <p className="mt-2 font-neue-haas text-sm text-squarage-green">
                  {styleNote.height !== undefined && <>Height set to {fmtLen(styleNote.height)}, the least this style needs. </>}
                  {styleNote.depth !== undefined && <>Depth set to {fmtLen(styleNote.depth)} so they sit fully on the shelf.</>}
                </p>
              )}
            </Panel>

            <Panel title="Size" value={sizeSummary} open={openPanel === 'size'} onToggle={() => toggle('size')}>
              <div className="mb-3 flex justify-end">
                <Segmented compact label="Units" options={UNITS} value={unit} onChange={setUnit} />
              </div>
              <div className="space-y-3">
                <DimensionField label="Width" value={design.width} range={ranges.width} unit={unit} onChange={(v) => set('width', v)} />
                {isCorner && (
                  <DimensionField label="Length" value={design.length} range={ranges.length} unit={unit} onChange={(v) => set('length', v)} />
                )}
                <DimensionField label="Height" value={design.height} range={ranges.height} unit={unit} onChange={(v) => set('height', v)} />
                <DimensionField label="Depth" value={design.depth} range={ranges.depth} unit={unit} onChange={(v) => set('depth', v)} />
              </div>
            </Panel>

            <Panel title="Layout" value={layoutSummary} open={openPanel === 'layout'} onToggle={() => toggle('layout')}>
              <div className="space-y-3">
                {style ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-neue-haas text-base font-medium text-squarage-black">Shelves</span>
                    <span className="font-neue-haas text-base text-gray-500">
                      <span className="font-medium tabular-nums text-squarage-black">{design.shelfCount}</span>, set by the style
                    </span>
                  </div>
                ) : (
                  <CountField label="Shelves" value={design.shelfCount} range={ranges.shelfCount} onChange={(v) => set('shelfCount', v)} />
                )}
                <CountField label="Columns" value={design.columnCount} range={ranges.columnCount} onChange={(v) => set('columnCount', v)} />
              </div>
              {surfaceHeight !== null && (
                <p className="mt-4 font-neue-haas text-sm text-gray-500">
                  The top surface sits at <span className="font-medium tabular-nums text-squarage-black">{fmtLen(surfaceHeight)}</span>.
                </p>
              )}
            </Panel>

            <Panel title="Finish" value={finish} open={openPanel === 'finish'} onToggle={() => toggle('finish')}>
              <div className="grid grid-cols-3 gap-2 py-1">
                {WOOD_FINISHES.map((f) => {
                  const selected = finish === f.name;
                  return (
                    <button
                      key={f.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFinish(f.name)}
                      className={`relative overflow-hidden rounded-full border-2 bg-center py-2.5 font-neue-haas text-base font-medium transition-all duration-300 ${focusRing} ${
                        selected ? 'scale-105 border-squarage-green shadow-md' : 'border-transparent shadow-sm hover:scale-105 hover:shadow-md'
                      }`}
                      style={{ backgroundImage: `url(${f.texture})`, backgroundSize: '400%' }}
                    >
                      <span className={`relative z-10 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${selected ? 'text-[#a8d5a2]' : 'text-white'}`}>
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {designs.length > 0 && (
              <Panel title="Saved" value={designs.length === 1 ? '1 design' : `${designs.length} designs`} open={openPanel === 'saved'} onToggle={() => toggle('saved')}>
                <div className="grid grid-cols-3 gap-2">
                  {designs.map((saved) => (
                    <div key={saved.id} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors duration-200 hover:border-gray-400">
                      {saved.svgPreview && <div className="h-full w-full p-2 pb-6" dangerouslySetInnerHTML={{ __html: saved.svgPreview }} />}
                      <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-1.5 font-neue-haas text-[12px] font-medium text-squarage-black">{saved.name}</span>
                      <button type="button" aria-label={`Open ${saved.name}`} onClick={() => handleLoadSaved(saved)} className={`absolute inset-0 rounded-xl ${focusRing}`} />
                      <button
                        type="button"
                        aria-label={`Delete ${saved.name}`}
                        onClick={() => deleteDesign(saved.id)}
                        className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full font-neue-haas text-base leading-none text-gray-500 transition-colors duration-200 hover:bg-squarage-black hover:text-white ${focusRing}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* The action. A bar fixed to the screen on a phone, the foot of the cards on desktop. */}
          <div
            className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-cream/95 px-4 pt-3 backdrop-blur-sm transition-opacity duration-300 lg:static lg:shrink-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-3 lg:backdrop-blur-none ${
              showQuoteFlow ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => setShowQuoteFlow(true)}
              className={`w-full rounded-full bg-squarage-orange py-3 font-neue-haas text-xl font-bold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-squarage-yellow hover:shadow-md lg:py-3.5 lg:text-2xl ${focusRing}`}
            >
              Get Quote
            </button>
            <p className="mt-2 hidden text-center font-neue-haas text-xs text-gray-500 lg:block">
              Made to order in Los Angeles. Quotes are free.
            </p>
          </div>
          {/* Room for the fixed bar on a phone, so the last card can scroll clear of it */}
          <div className="h-24 lg:hidden" aria-hidden="true" />
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
          shelfStyle={design.style}
          onClose={() => setShowQuoteFlow(false)}
          saveDesign={saveDesign}
          getSvgPreview={getSvgPreview}
          active={showQuoteFlow}
        />
      </div>
    </div>
  );
}
