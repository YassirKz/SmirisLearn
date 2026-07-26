import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('ne met pas à jour avant le délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Advance part of the delay
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('initial');
  });

  it('met à jour après le délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe('updated');
  });

  it('annule la mise à jour précédente si la valeur change avant le délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'v1', delay: 500 } }
    );

    // First change
    rerender({ value: 'v2', delay: 500 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('v1'); // not yet

    // Second change before timeout
    rerender({ value: 'v3', delay: 500 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('v1'); // v2 was cancelled, v3 not yet

    // Complete the delay for v3
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('v3'); // v3 applies, v2 was skipped
  });

  it('utilise le délai par défaut de 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('initial');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('updated');
  });

  it('fonctionne avec des valeurs non-string', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 42, delay: 100 } }
    );

    rerender({ value: 99, delay: 100 });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(99);
  });
});
