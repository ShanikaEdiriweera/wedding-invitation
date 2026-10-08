import { describe, expect, it } from 'vitest'
import { isValidInvitationToken, validateRsvpSubmission } from '../src/lib/rsvp-validation'
const invitation = { primaryGuestName: 'Primary Guest', invitedGuestNames: ['Named Guest'], maxGuests: 3 }
const good = { attending: true, guests: [{ name: 'Primary Guest' }], dietaryRequirements: '', songRequest: '', message: '' }

describe('RSVP validation', () => {
  it('checks the token shape', () => {
    expect(isValidInvitationToken('a'.repeat(32))).toBe(true)
    expect(isValidInvitationToken('a'.repeat(31))).toBe(false)
    expect(isValidInvitationToken('x'.repeat(31) + '.')).toBe(false)
  })
  it('validates limits and text lengths', () => {
    expect(validateRsvpSubmission('a'.repeat(32), invitation, good)).toEqual({})
    expect(validateRsvpSubmission('a'.repeat(32), { ...invitation, invitedGuestNames: ['One', 'Two'], maxGuests: 1 }, good).guests).toMatch(/exceeds/i)
    expect(validateRsvpSubmission('a'.repeat(32), { ...invitation, maxGuests: 21 }, good).guests).toMatch(/invalid guest limit/i)
    expect(validateRsvpSubmission('a'.repeat(32), invitation, { ...good, message: 'x'.repeat(1001) }).message).toMatch(/characters/i)
    expect(validateRsvpSubmission('a'.repeat(32), invitation, { ...good, dietaryRequirements: 'x'.repeat(501) }).dietaryRequirements).toMatch(/characters/i)
    expect(validateRsvpSubmission('a'.repeat(32), invitation, { ...good, songRequest: 'x'.repeat(121) }).songRequest).toMatch(/characters/i)
    expect(validateRsvpSubmission('a'.repeat(32), invitation, { ...good, guests: [{ name: 'Primary Guest' }, { name: 'New One' }, { name: 'New Two' }] }).guests).toMatch(/additional guests/i)
    expect(validateRsvpSubmission('bad', invitation, good).attendance).toMatch(/invalid/i)
    expect(validateRsvpSubmission('a'.repeat(32), invitation, { ...good, attending: false, guests: [] })).toEqual({})
  })
})
