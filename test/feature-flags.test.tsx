import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { FEATURE_FLAGS, isFeatureEnabled } from '../src/config/featureFlags'

afterEach(() => vi.unstubAllGlobals())

describe('feature flags', () => {
  it('fails closed for unknown features', () => {
    expect(isFeatureEnabled('unknown')).toBe(false)
  })

  it('keeps Gallery out of the page and navigation while disabled', () => {
    expect(FEATURE_FLAGS.gallery).toBe(false)
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    render(<App />)

    expect(screen.queryByRole('link', { name: 'Gallery' })).not.toBeInTheDocument()
    expect(document.querySelector('#gallery')).toBeNull()
    expect(document.querySelector('img[src*="gallery-1.jpeg"]')).toBeNull()
  })
})
