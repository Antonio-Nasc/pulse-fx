import { describe, expect, it } from 'vitest';

import {
  createIndicatorPath,
  readIndicatorSlug,
} from './app-navigation';

describe('app navigation', () => {
  it('creates a detail path for an indicator', () => {
    expect(createIndicatorPath('usd-brl-ptax')).toBe(
      '/indicators/usd-brl-ptax',
    );
  });

  it('reads a valid indicator slug from the path', () => {
    expect(
      readIndicatorSlug('/indicators/selic-target'),
    ).toBe('selic-target');
  });

  it('accepts a trailing slash', () => {
    expect(
      readIndicatorSlug('/indicators/fed-funds/'),
    ).toBe('fed-funds');
  });

  it('rejects unrelated or invalid paths', () => {
    expect(readIndicatorSlug('/')).toBeNull();
    expect(
      readIndicatorSlug('/indicators/INVALID_SLUG'),
    ).toBeNull();
  });
});