export function linear(t: number): number {
  return t;
}

export function easeIn(t: number): number {
  return t * t * t;
}

export function easeOut(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
