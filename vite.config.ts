import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wedding } from './src/content/wedding-details.ts'
import { toUrlSlug } from './src/lib/url-slug.ts'

const invitationSlug = `${toUrlSlug(wedding.couple.bride.displayName)}-and-${toUrlSlug(wedding.couple.groom.displayName)}`
const invitationBase = `/${invitationSlug}/`

export default defineConfig({
  base: invitationBase,
  plugins: [react()],
})
