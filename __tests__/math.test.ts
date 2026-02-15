import { add, factorial } from '../src/math';

describe('add', () => {
  it('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add two negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should add a positive and a negative number', () => {
    expect(add(5, -3)).toBe(2);
  });

  it('should add zero to a number', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
  });

  it('should add two zeros', () => {
    expect(add(0, 0)).toBe(0);
  });

  it('should handle large numbers', () => {
    expect(add(1000000, 2000000)).toBe(3000000);
  });

  it('should handle decimal numbers', () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });

  it('should handle very small decimal numbers', () => {
    expect(add(0.0001, 0.0002)).toBeCloseTo(0.0003);
  });

  it('should return NaN when one argument is NaN', () => {
    expect(add(NaN, 5)).toBeNaN();
    expect(add(5, NaN)).toBeNaN();
  });

  it('should return NaN when both arguments are NaN', () => {
    expect(add(NaN, NaN)).toBeNaN();
  });

  it('should handle Infinity', () => {
    expect(add(Infinity, 5)).toBe(Infinity);
    expect(add(5, Infinity)).toBe(Infinity);
    expect(add(Infinity, Infinity)).toBe(Infinity);
  });

  it('should return NaN for Infinity + (-Infinity)', () => {
    expect(add(Infinity, -Infinity)).toBeNaN();
  });

  it('should handle -Infinity', () => {
    expect(add(-Infinity, -Infinity)).toBe(-Infinity);
  });

  it('should handle Number.MAX_SAFE_INTEGER', () => {
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle Number.MIN_SAFE_INTEGER', () => {
    expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
  });

  it('should handle negative zero', () => {
    expect(add(-0, 0)).toBe(0);
    expect(add(0, -0)).toBe(0);
  });

  it('should coerce undefined to NaN at runtime', () => {
    expect(add(undefined as unknown as number, 5)).toBeNaN();
  });

  it('should coerce null to 0 at runtime', () => {
    expect(add(null as unknown as number, 5)).toBe(5);
  });

  it('should concatenate strings when passed as arguments (runtime coercion)', () => {
    // In JavaScript, "1" + "2" = "12" (string concatenation)
    expect(add('1' as unknown as number, '2' as unknown as number)).toBe('12');
  });

  it('should handle mixed string and number (runtime coercion)', () => {
    // In JavaScript, 1 + "2" = "12" (string concatenation)
    expect(add(1, '2' as unknown as number)).toBe('12');
  });


it('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add two negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should add a positive and a negative number', () => {
    expect(add(5, -3)).toBe(2);
  });

  it('should add zero to a number', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
  });

  it('should add two zeros', () => {
    expect(add(0, 0)).toBe(0);
  });

  it('should handle large numbers', () => {
    expect(add(1000000, 2000000)).toBe(3000000);
  });

  it('should handle decimal numbers', () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });

  it('should handle very small decimal numbers', () => {
    expect(add(0.0001, 0.0002)).toBeCloseTo(0.0003);
  });

  it('should return NaN when one argument is NaN', () => {
    expect(add(NaN, 5)).toBeNaN();
    expect(add(5, NaN)).toBeNaN();
  });

  it('should return NaN when both arguments are NaN', () => {
    expect(add(NaN, NaN)).toBeNaN();
  });

  it('should handle Infinity', () => {
    expect(add(Infinity, 5)).toBe(Infinity);
    expect(add(5, Infinity)).toBe(Infinity);
    expect(add(Infinity, Infinity)).toBe(Infinity);
  });

  it('should return NaN for Infinity + (-Infinity)', () => {
    expect(add(Infinity, -Infinity)).toBeNaN();
  });

  it('should handle -Infinity', () => {
    expect(add(-Infinity, -Infinity)).toBe(-Infinity);
  });

  it('should handle Number.MAX_SAFE_INTEGER', () => {
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle Number.MIN_SAFE_INTEGER', () => {
    expect(add(Number.MIN_SAFE_INTEGER, 0)).toBe(Number.MIN_SAFE_INTEGER);
  });

  it('should handle negative zero', () => {
    expect(add(-0, 0)).toBe(0);
    expect(add(0, -0)).toBe(0);
  });

  it('should coerce undefined to NaN at runtime', () => {
    expect(add(undefined as unknown as number, 5)).toBeNaN();
  });

  it('should coerce null to 0 at runtime', () => {
    expect(add(null as unknown as number, 5)).toBe(5);
  });

  it('should concatenate strings when passed as arguments (runtime coercion)', () => {
    expect(add('1' as unknown as number, '2' as unknown as number)).toBe('12');
  });

  it('should handle mixed string and number (runtime coercion)', () => {
    expect(add(1, '2' as unknown as number)).toBe('12');
  });
});

describe('factorial', () => {
  it('should return 1 for n = 0', () => {
    expect(factorial(0)).toBe(1);
  });

  it('should return 1 for n = 1', () => {
    expect(factorial(1)).toBe(1);
  });

  it('should return 2 for n = 2', () => {
    expect(factorial(2)).toBe(2);
  });

  it('should return 6 for n = 3', () => {
    expect(factorial(3)).toBe(6);
  });

  it('should return 24 for n = 4', () => {
    expect(factorial(4)).toBe(24);
  });

  it('should return 120 for n = 5', () => {
    expect(factorial(5)).toBe(120);
  });

  it('should return 3628800 for n = 10', () => {
    expect(factorial(10)).toBe(3628800);
  });

  it('should return 479001600 for n = 12', () => {
    expect(factorial(12)).toBe(479001600);
  });

  it('should handle n = 20', () => {
    expect(factorial(20)).toBe(2432902008176640000);
  });

  it('should throw an error for negative input n = -1', () => {
    expect(() => factorial(-1)).toThrow('Negative input');
  });

  it('should throw an error for negative input n = -5', () => {
    expect(() => factorial(-5)).toThrow('Negative input');
  });

  it('should throw an error for negative input n = -100', () => {
    expect(() => factorial(-100)).toThrow('Negative input');
  });

  it('should throw Error type for negative input', () => {
    expect(() => factorial(-1)).toThrow(Error);
  });

  it('should return 1 for n = 0 (boundary between base case and negative)', () => {
    expect(factorial(0)).toBe(1);
  });

  it('should return 1 for n = 1 (boundary of n <= 1)', () => {
    expect(factorial(1)).toBe(1);
  });

  it('should recurse for n = 2 (boundary just above n <= 1)', () => {
    expect(factorial(2)).toBe(2);
  });

  it('should handle decimal inputs (runtime behavior)', () => {
    // factorial(1.5): 1.5 is not < 0, not <= 1, so returns 1.5 * factorial(0.5)
    // factorial(0.5): 0.5 is not < 0, 0.5 <= 1 is true, so returns 1
    // Result: 1.5 * 1 = 1.5
    expect(factorial(1.5)).toBe(1.5);
  });

  it('should handle 0.5 (runtime behavior with decimals)', () => {
    // 0.5 is not < 0, 0.5 <= 1 is true, so returns 1
    expect(factorial(0.5)).toBe(1);
  });

  it('should throw for -0.5', () => {
    expect(() => factorial(-0.5)).toThrow('Negative input');
  });

  it('should handle NaN input (runtime behavior)', () => {
    // NaN < 0 is false, NaN <= 1 is false, so it recurses: NaN * factorial(NaN - 1) = NaN * factorial(NaN)
    // This will cause infinite recursion and stack overflow
    expect(() => factorial(NaN)).toThrow();
  });

  it('should handle Infinity input (runtime behavior)', () => {
    // Infinity < 0 is false, Infinity <= 1 is false, so it recurses: Infinity * factorial(Infinity - 1) = Infinity * factorial(Infinity)
    // This will cause infinite recursion and stack overflow
    expect(() => factorial(Infinity)).toThrow();
  });

  it('should throw for -Infinity', () => {
    expect(() => factorial(-Infinity)).toThrow('Negative input');
  });

  it('should return Infinity for large enough inputs due to overflow', () => {
    // factorial(171) overflows to Infinity in JavaScript
    expect(factorial(171)).toBe(Infinity);
  });

  it('should return a finite number for n = 170', () => {
    expect(isFinite(factorial(170))).toBe(true);
  });

  it('should handle null input at runtime', () => {
    // null coerced: null < 0 is false, null <= 1 is true, returns 1
    expect(factorial(null as unknown as number)).toBe(1);
  });

  it('should handle undefined input at runtime', () => {
    // undefined: undefined < 0 is false, undefined <= 1 is false
    // recurses with NaN, causing stack overflow
    expect(() => factorial(undefined as unknown as number)).toThrow();
  });
});