import { useEffect, useRef, useState, type ReactNode } from 'react'
import { invitationExperience, wedding } from '../content/wedding'

type OpeningState = 'closed' | 'opening' | 'opened'

function requestPlayback(audio: HTMLAudioElement, onRejected: () => void) {
  try {
    void audio.play().catch(onRejected)
  } catch {
    onRejected()
  }
}

export function InvitationExperience({ children }: { children: ReactNode }) {
  const [openingState, setOpeningState] = useState<OpeningState>('closed')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioAvailable, setAudioAvailable] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (openingState === 'opened') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    openButtonRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow }
  // Keep the lock through the closed -> opening transition; restore it only when revealed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingState === 'opened'])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updatePlayback = () => setIsPlaying(!audio.paused && !audio.ended)
    const markAvailable = () => setAudioAvailable(true)
    const markUnavailable = () => { setAudioAvailable(false); setIsPlaying(false) }
    audio.addEventListener('play', updatePlayback)
    audio.addEventListener('pause', updatePlayback)
    audio.addEventListener('ended', updatePlayback)
    audio.addEventListener('canplay', markAvailable)
    audio.addEventListener('error', markUnavailable)
    return () => {
      audio.removeEventListener('play', updatePlayback)
      audio.removeEventListener('pause', updatePlayback)
      audio.removeEventListener('ended', updatePlayback)
      audio.removeEventListener('canplay', markAvailable)
      audio.removeEventListener('error', markUnavailable)
    }
  }, [])

  const openInvitation = () => {
    if (openingState !== 'closed') return
    setOpeningState('opening')

    const audio = audioRef.current
    if (audio) {
      audio.volume = invitationExperience.music.volume
      requestPlayback(audio, () => setIsPlaying(false))
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.setTimeout(() => setOpeningState('opened'), reducedMotion ? 30 : invitationExperience.openingDurationMs)
  }

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio || !audioAvailable) return
    if (audio.paused) requestPlayback(audio, () => setIsPlaying(false))
    else audio.pause()
  }

  return (
    <>
      <div className="invitation-content" inert={openingState !== 'opened'}>
        {children}
      </div>
      <audio
        ref={audioRef}
        className="invitation-audio"
        src={invitationExperience.music.src}
        loop
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      {openingState !== 'opened' && (
        <div className={`envelope-intro${openingState === 'opening' ? ' envelope-intro--opening' : ''}`}>
          <div className="envelope-intro__content">
            <p className="eyebrow">A celebration awaits</p>
            <p className="envelope-intro__names" aria-label={`${wedding.couple.bride.displayName} and ${wedding.couple.groom.displayName}`}>
              {wedding.couple.bride.displayName} <span aria-hidden="true">&amp;</span> {wedding.couple.groom.displayName}
            </p>
            <button
              ref={openButtonRef}
              className="envelope-button"
              type="button"
              onClick={openInvitation}
              disabled={openingState !== 'closed'}
              aria-label="Open the wedding invitation"
            >
              <span className="envelope-card" aria-hidden="true">With joy, we invite you</span>
              <span className="envelope-shape" aria-hidden="true">
                <span className="envelope-flap" />
                <span className="envelope-seal">&amp;</span>
              </span>
              <span className="envelope-cta">{openingState === 'opening' ? 'Opening invitation…' : 'Open Invitation'}</span>
            </button>
            <p className="envelope-intro__hint">Tap anywhere on the envelope to open</p>
          </div>
        </div>
      )}
      {openingState === 'opened' && audioAvailable && (
        <button
          className="music-toggle"
          type="button"
          onClick={toggleMusic}
          aria-label={isPlaying ? 'Pause wedding music' : 'Play wedding music'}
          aria-pressed={isPlaying}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            {isPlaying ? <><path d="M16 9a5 5 0 0 1 0 6" /><path d="M18.5 6.5a8.5 8.5 0 0 1 0 11" /></> : <path d="m17 9 5 6m0-6-5 6" />}
          </svg>
        </button>
      )}
    </>
  )
}
