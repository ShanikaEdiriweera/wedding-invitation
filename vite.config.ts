// @ts-expect-error Node built-ins are available to Vite's Node process; this project does not include @types/node.
import { cp, mkdir, readdir } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wedding } from './src/content/wedding-details.ts'
import { toUrlSlug } from './src/lib/url-slug.ts'

const invitationSlug = `${toUrlSlug(wedding.couple.bride.displayName)}-and-${toUrlSlug(wedding.couple.groom.displayName)}`
const invitationBase = `/${invitationSlug}/`

export default defineConfig({
  base: invitationBase,
  plugins: [react(), {
    name: 'copy-site-under-invitation-base',
    apply: 'build',
    async closeBundle() {
      const outputDir = './dist'
      const invitationDir = `${outputDir}/${invitationSlug}`
      await mkdir(invitationDir, { recursive: true })
      for (const entry of await readdir(outputDir)) {
        if (entry !== invitationSlug) {
          await cp(`${outputDir}/${entry}`, `${invitationDir}/${entry}`, { recursive: true })
        }
      }
    },
  }],
})
