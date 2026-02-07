export function add(a: number, b: number): number {
  return a + b;
}

export function factorial(n: number): number {
  if (n < 0) throw new Error('Negative input');
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new Error('min must be <= max');
  return Math.min(Math.max(value, min), max);
}
