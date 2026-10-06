import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wedding } from './src/content/wedding-details.ts'
import { toUrlSlug } from './src/lib/url-slug.ts'
import { isFeatureEnabled } from './src/config/featureFlags.ts'

const invitationSlug = `${toUrlSlug(wedding.couple.bride.displayName)}-and-${toUrlSlug(wedding.couple.groom.displayName)}`
const invitationBase = isFeatureEnabled('coupleNamePath') ? `/${invitationSlug}/` : '/wedding-invitation/'

export default defineConfig({
  base: invitationBase,
  plugins: [react()],
})
