import { SectionHeading } from './SectionHeading'
import { RsvpPage } from './RsvpPage'

export function RSVPCallToAction({ token, onGuestNameLoaded }: { token?: string; onGuestNameLoaded?: (name: string) => void }) {
  if (token) return <RsvpPage token={token} onGuestNameLoaded={onGuestNameLoaded} />

  return (
    <section className="rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <div className="rsvp__inner">
        <SectionHeading eyebrow="We hope you can join us" title="Save a place for the celebration" id="rsvp-title" align="center" />
        <p className="scroll-reveal scroll-reveal--delay-1">If you received a personal invitation link, open it to reply here.</p>
        <p className="scroll-reveal scroll-reveal--delay-1">Please RSVP by 1st of December</p>
        <a className="button button--light scroll-reveal scroll-reveal--delay-2" href="#details">See the wedding details <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  )
}
