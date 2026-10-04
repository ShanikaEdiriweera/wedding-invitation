import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { InvitationExperience } from '../src/components/InvitationExperience'

afterEach(() => { cleanup(); vi.useRealTimers() })

function mockAudio() {
  const play = vi.fn(function (this: HTMLAudioElement) {
    Object.defineProperty(this, 'paused', { configurable: true, value: false })
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  const pause = vi.fn(function (this: HTMLAudioElement) {
    Object.defineProperty(this, 'paused', { configurable: true, value: true })
    this.dispatchEvent(new Event('pause'))
  })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  return { play, pause }
}

describe('invitation opening experience', () => {
  it('covers the invitation until opened and restores scrolling after one activation', async () => {
    const { play } = mockAudio()
    vi.useFakeTimers()
    render(<InvitationExperience><main>Invitation content</main></InvitationExperience>)
    const opener = screen.getByRole('button', { name: 'Open the wedding invitation' })
    expect(opener).toHaveFocus()
    expect(screen.getByText('Invitation content').closest('[inert]')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(opener)
    fireEvent.click(opener)
    expect(play).toHaveBeenCalledTimes(1)
    expect(opener).toBeDisabled()
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.queryByRole('button', { name: 'Open the wedding invitation' })).not.toBeInTheDocument()
    expect(screen.getByText('Invitation content').closest('[inert]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('opens despite rejected playback and reflects pause/resume state', async () => {
    const { play, pause } = mockAudio()
    play.mockRejectedValueOnce(new Error('Autoplay denied'))
    vi.useFakeTimers()
    render(<InvitationExperience><main>Invitation content</main></InvitationExperience>)
    fireEvent.click(screen.getByRole('button', { name: 'Open the wedding invitation' }))
    expect(play).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.getByText('Invitation content')).toBeInTheDocument()

    const audio = document.querySelector('audio')!
    fireEvent(audio, new Event('canplay'))
    const toggle = screen.getByRole('button', { name: 'Play wedding music' })
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Pause wedding music' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Pause wedding music' }))
    expect(pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Play wedding music' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the invitation usable and hides controls after an audio error', () => {
    mockAudio()
    vi.useFakeTimers()
    render(<InvitationExperience><main>Invitation content</main></InvitationExperience>)
    fireEvent.click(screen.getByRole('button', { name: 'Open the wedding invitation' }))
    act(() => vi.advanceTimersByTime(1100))
    fireEvent(document.querySelector('audio')!, new Event('error'))
    expect(screen.getByText('Invitation content')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /wedding music/i })).not.toBeInTheDocument()
  })
})
