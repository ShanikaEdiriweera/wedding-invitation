import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'
import { FEATURE_FLAGS, isFeatureEnabled } from '../src/config/featureFlags'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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

  it('shows the configured parents invitation and hides couple full names only when enabled', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    expect(FEATURE_FLAGS.parentsInvitation).toBe(false)
    const { unmount } = render(<App />)
    expect(screen.getByText('With joy, we invite you')).toBeInTheDocument()
    expect(screen.getByText('Thushara Ediriweera & Dakshin Abeykoon')).toBeInTheDocument()
    unmount()

    FEATURE_FLAGS.parentsInvitation = true
    try {
      render(<App />)
      expect(screen.getByText('Mr. & Mrs. Vijitha and Kamani Ediriweera together with Mr. Chandana Abeykoon & Dr. Malkanthi Jayasinghe, have the pleasure of inviting you to the wedding of their children,')).toBeInTheDocument()
      expect(screen.queryByText('With joy, we invite you')).not.toBeInTheDocument()
      expect(screen.getByText('Thushara')).toBeInTheDocument()
      expect(screen.getByText('Dakshin')).toBeInTheDocument()
      expect(screen.queryByText('Thushara Ediriweera & Dakshin Abeykoon')).not.toBeInTheDocument()
    } finally {
      FEATURE_FLAGS.parentsInvitation = false
    }
  })
})
