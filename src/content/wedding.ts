import { wedding } from './wedding-details'
import { toUrlSlug } from '../lib/url-slug'

export { wedding }

export const invitationExperience = {
  music: {
    src: `${import.meta.env.BASE_URL}music/wedding-music.mp3`,
    volume: 0.3,
  },
  openingDurationMs: 4100,
} as const

export const coupleDisplayName = `${wedding.couple.bride.displayName} & ${wedding.couple.groom.displayName}`
export const coupleFullNames = `${wedding.couple.bride.fullName} & ${wedding.couple.groom.fullName}`
export const invitationSlug = `${toUrlSlug(wedding.couple.bride.displayName)}-and-${toUrlSlug(wedding.couple.groom.displayName)}`
