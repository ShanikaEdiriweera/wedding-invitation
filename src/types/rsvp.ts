export type InvitationRecord = {
  invitationToken: string
  primaryGuestName: string
  invitedGuestNames: string[]
  email?: string
  maxGuests: number
  active: boolean
  createdAt: string
  revokedAt?: string
}

export type PublicInvitation = {
  primaryGuestName: string
  invitedGuestNames: string[]
  maxGuests: number
}

export type AttendingGuest = { name: string }

export type RsvpRecord = {
  invitationToken: string
  rsvpId: string
  submittedAt: string
  updatedAt: string
  attending: boolean
  guests: AttendingGuest[]
  dietaryRequirements: string
  songRequest: string
  message: string
}

export type RsvpSubmission = Omit<RsvpRecord, 'invitationToken' | 'rsvpId' | 'submittedAt' | 'updatedAt'> & {
  honeypot?: string
}

export type InvitationLookup =
  | { status: 'active'; invitation: PublicInvitation }
  | { status: 'not-found' }
  | { status: 'revoked' }

export type ExistingRsvpLookup =
  | { status: 'active'; rsvp: RsvpRecord | null }
  | { status: 'not-found' }
  | { status: 'revoked' }

export type SaveRsvpResult =
  | { status: 'saved'; rsvp: RsvpRecord }
  | { status: 'not-found' }
  | { status: 'revoked' }

export interface RsvpService {
  readonly isConfigured: boolean
  getInvitation(token: string): Promise<InvitationLookup>
  getRsvp(token: string): Promise<ExistingRsvpLookup>
  submitRsvp(token: string, data: RsvpSubmission): Promise<SaveRsvpResult>
}
