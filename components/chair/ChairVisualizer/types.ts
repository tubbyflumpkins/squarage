import { Point3D } from '@/components/shelf/ShelfVisualizer/types';

export interface ChairParams {
  seatWidth: number;      // left-right distance between side frames
  seatDepth: number;      // front-to-back
  seatHeight: number;     // floor to seat top
  backHeight: number;     // seat top to backrest top
  backAngle: number;      // degrees of recline from vertical
  benchAngle: number;     // degrees of seat tilt (pivot at backrest junction)
  frameWidth: number;     // structural rail width
  thickness: number;      // plywood thickness (for future use)
  slatHeight: number;     // slat cross-section tall dimension
  seatSlatCount: number;  // left-right seat slats
  seatSlatCountFB: number; // front-to-back seat slats
  backSlatCount: number;  // horizontal backrest slats
  backStart: number;      // air gap between seat top and first back slat (inches)
  benchStart: number;     // seat slat start offset from backrest (inches)
  // Ergonomic contour
  seatScoop: number;      // seat depression depth (inches)
  backCurve: number;      // backrest slat U-bend depth (inches)
  scoopOffset: number;    // how far behind center the deepest point sits (inches)
  scoopSpread: number;    // 0–1 fraction of seat area covered by the scoop
  cornerRadius: number;   // outer structural corner radius (inches)
  innerRadius: number;    // inner corner radius at seat rail junctions (inches)
  backLegRadius: number;  // radius at back leg bends (leg↔backrest, leg↔bench underside)
  frontBar: boolean;      // whether to show crossbeam footrest on front
  sideBar: boolean;       // whether to show crossbeam footrests on sides
  footrestHeight: number; // footrest crossbar bottom height from floor (inches)
}

export interface ChairPiece {
  type: 'sideFrame' | 'frontCrosspiece' | 'rearCrosspiece' | 'seatSlatLR' | 'seatSlatFB' | 'backSlat';
  outline: Point3D[];  // closed polygon (last point = first point)
  holes?: Point3D[][]; // interior cutouts (each closed, opposite winding to outline)
}

export interface ChairGeometry {
  pieces: ChairPiece[];
}
