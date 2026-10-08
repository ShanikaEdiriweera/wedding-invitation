import { useEffect, useState } from 'react'
import { Countdown } from './Countdown'
import { RsvpForm } from './RsvpForm'
import { coupleDisplayName } from '../config/wedding'
import { rsvpService } from '../services/rsvpService'
import { SectionHeading } from './SectionHeading'
import type { PublicInvitation, RsvpRecord } from '../types/rsvp'
import { RsvpServiceNotConfiguredError } from '../services/rsvpService'

type LoadState = { status: 'loading' } | { status: 'not-configured' | 'not-found' | 'revoked' | 'error' } | { status: 'ready'; invitation: PublicInvitation; rsvp: RsvpRecord | null }

export function RsvpPage({ token, service = rsvpService, onGuestNameLoaded }: { token: string; service?: typeof rsvpService; onGuestNameLoaded?: (name: string) => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  useEffect(() => {
    const previousTitle = document.title
    let active = true
    document.title = `RSVP | ${coupleDisplayName}`
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots) }
    robots.content = 'noindex, nofollow, noarchive'
    async function load() {
      try {
        const result = await service.getInvitation(token)
        if (!active) return
        if (result.status !== 'active') { setState({ status: result.status }); return }
        onGuestNameLoaded?.(result.invitation.primaryGuestName)
        const response = await service.getRsvp(token)
        if (!active) return
        if (response.status !== 'active') { setState({ status: response.status }); return }
        setState({ status: 'ready', invitation: result.invitation, rsvp: response.rsvp })
      } catch (error) {
        if (active) setState({ status: error instanceof RsvpServiceNotConfiguredError ? 'not-configured' : 'error' })
      }
    }
    void load()
    return () => { active = false; document.title = previousTitle }
  }, [onGuestNameLoaded, service, token])

  return <section id="rsvp" className="rsvp rsvp--personalized" aria-labelledby="rsvp-title">
    <div className="rsvp__inner">
      <SectionHeading eyebrow="You’re invited" title="Kindly reply" id="rsvp-title" align="center" />
      <p>Please let us know if you can join us.</p>
      {state.status === 'loading' && <p className="rsvp-message" role="status">Loading your invitation…</p>}
      {state.status === 'not-configured' && <p className="rsvp-message" role="status">Online replies are not open yet. Please check back soon.</p>}
      {state.status === 'not-found' && <p className="rsvp-message" role="alert">This invitation link could not be found. Please contact the couple for help.</p>}
      {state.status === 'revoked' && <p className="rsvp-message" role="alert">This invitation is no longer active. Please contact the couple if you have questions.</p>}
      {state.status === 'error' && <p className="rsvp-message" role="alert">We couldn’t load your invitation. Please try again later.</p>}
      {state.status === 'ready' && <RsvpForm key={token} token={token} invitation={state.invitation} existing={state.rsvp} service={service} />}
      <div className="rsvp-page__event"><h2>Counting down to our special day</h2><Countdown /></div>
    </div>
  </section>
}
