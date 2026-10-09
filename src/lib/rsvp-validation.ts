import type { PublicInvitation, RsvpSubmission } from '../types/rsvp'

export const RSVP_LIMITS = {
  maxGuestsPerInvitation: 20,
  guestName: 100,
  dietaryRequirements: 500,
  songRequest: 120,
  message: 1_000,
} as const

export type RsvpValidationErrors = Partial<Record<'attendance' | 'guests' | 'dietaryRequirements' | 'songRequest' | 'message', string>>

const clean = (value: string) => value.trim()
const normaliseName = (value: string) => clean(value).toLocaleLowerCase()

export function validateRsvpSubmission(
  token: string,
  invitation: PublicInvitation,
  data: RsvpSubmission,
): RsvpValidationErrors {
  const errors: RsvpValidationErrors = {}
  const validToken = /^[A-Za-z0-9_-]{32}$/.test(token)

  if (!validToken) errors.attendance = 'This invitation link is invalid.'
  if (!Number.isInteger(invitation.maxGuests) || invitation.maxGuests < 1 || invitation.maxGuests > RSVP_LIMITS.maxGuestsPerInvitation) {
    errors.guests = 'This invitation has an invalid guest limit. Please contact us for help.'
    return errors
  }
  if (data.honeypot?.trim()) errors.attendance = 'We could not save this RSVP. Please try again.'

  for (const guestName of [invitation.primaryGuestName, ...invitation.invitedGuestNames]) {
    if (!guestName.trim() || guestName.length > RSVP_LIMITS.guestName) {
      errors.guests = 'The invitation contains an invalid guest name. Please contact us for help.'
      return errors
    }
  }
  const namedInvitees = invitation.invitedGuestNames.length
    ? invitation.invitedGuestNames
    : [invitation.primaryGuestName]
  if (new Set(namedInvitees.map(normaliseName)).size !== namedInvitees.length) {
    errors.guests = 'The invitation contains duplicate guest names. Please contact us for help.'
    return errors
  }
  if (namedInvitees.length > invitation.maxGuests) {
    errors.guests = 'The invitation guest list exceeds its limit. Please contact us for help.'
    return errors
  }

  const additionalGuestSlots = invitation.maxGuests - namedInvitees.length
  const uniqueAttendingGuests = new Set(data.guests.map((guest) => normaliseName(guest.name)))

  if (data.attending) {
    if (data.guests.length < 1) errors.guests = 'Choose at least one person who will attend.'
    if (data.guests.length > invitation.maxGuests) errors.guests = `You can add up to ${invitation.maxGuests} attendees to this invitation.`
    if (uniqueAttendingGuests.size !== data.guests.length) errors.guests = 'Each attending guest must have a different name.'

    let additionalGuestCount = 0
    for (const guest of data.guests) {
      const name = clean(guest.name)
      if (!name) errors.guests = 'Enter a name for each attending guest.'
      else if (name.length > RSVP_LIMITS.guestName) errors.guests = `Guest names must be ${RSVP_LIMITS.guestName} characters or fewer.`
      else if (!namedInvitees.some((invited) => normaliseName(invited) === normaliseName(name))) additionalGuestCount += 1
    }
    if (additionalGuestCount > additionalGuestSlots) errors.guests = 'This invitation does not include that many additional guests.'
  } else if (data.guests.length > 0) {
    errors.guests = 'A declined RSVP cannot include attending guests.'
  }

  if (data.dietaryRequirements.length > RSVP_LIMITS.dietaryRequirements) errors.dietaryRequirements = `Use ${RSVP_LIMITS.dietaryRequirements} characters or fewer.`
  if (data.songRequest.length > RSVP_LIMITS.songRequest) errors.songRequest = `Use ${RSVP_LIMITS.songRequest} characters or fewer.`
  if (data.message.length > RSVP_LIMITS.message) errors.message = `Use ${RSVP_LIMITS.message} characters or fewer.`

  return errors
}

export function isValidInvitationToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(token)
}
