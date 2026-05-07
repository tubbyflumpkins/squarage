import type { ChairParams } from '@/components/chair/ChairVisualizer/types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolateChairParams(a: ChairParams, b: ChairParams, t: number): ChairParams {
  return {
    seatWidth: lerp(a.seatWidth, b.seatWidth, t),
    seatDepth: lerp(a.seatDepth, b.seatDepth, t),
    seatHeight: lerp(a.seatHeight, b.seatHeight, t),
    backHeight: lerp(a.backHeight, b.backHeight, t),
    backAngle: lerp(a.backAngle, b.backAngle, t),
    benchAngle: lerp(a.benchAngle, b.benchAngle, t),
    frameWidth: lerp(a.frameWidth, b.frameWidth, t),
    thickness: lerp(a.thickness, b.thickness, t),
    slatHeight: lerp(a.slatHeight, b.slatHeight, t),
    seatSlatCount: Math.round(lerp(a.seatSlatCount, b.seatSlatCount, t)),
    seatSlatCountFB: Math.round(lerp(a.seatSlatCountFB, b.seatSlatCountFB, t)),
    backSlatCount: Math.round(lerp(a.backSlatCount, b.backSlatCount, t)),
    backStart: lerp(a.backStart, b.backStart, t),
    benchStart: lerp(a.benchStart, b.benchStart, t),
    seatScoop: lerp(a.seatScoop, b.seatScoop, t),
    backCurve: lerp(a.backCurve, b.backCurve, t),
    scoopOffset: lerp(a.scoopOffset, b.scoopOffset, t),
    scoopSpread: lerp(a.scoopSpread, b.scoopSpread, t),
    cornerRadius: lerp(a.cornerRadius, b.cornerRadius, t),
    innerRadius: lerp(a.innerRadius, b.innerRadius, t),
    backLegRadius: lerp(a.backLegRadius, b.backLegRadius, t),
    frontBar: t < 0.5 ? a.frontBar : b.frontBar,
    sideBar: t < 0.5 ? a.sideBar : b.sideBar,
    footrestHeight: lerp(a.footrestHeight, b.footrestHeight, t),
  };
}
