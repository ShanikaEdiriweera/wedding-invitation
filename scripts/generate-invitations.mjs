#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/generate-invitations.mjs <private-input.json> <output.csv>')
  process.exit(2)
}
const guests = JSON.parse(await readFile(inputPath, 'utf8'))
if (!Array.isArray(guests)) throw new Error('Input must be a JSON array.')
const csv = (value) => {
  let text = String(value ?? '')
  if (/^[=+@\-]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
const rows = [['Invitation Token', 'Primary Guest Name', 'Email', 'Invited Guest Names', 'Max Guests', 'Active', 'Created At', 'Revoked At']]
for (const item of guests) {
  const primary = String(item.primaryGuestName ?? '').trim()
  const invitees = Array.isArray(item.invitedGuestNames) ? item.invitedGuestNames.map((name) => String(name).trim()) : []
  const max = Number(item.maxGuests)
  if (!primary || primary.length > 100 || invitees.some((name) => !name || name.length > 100)) throw new Error('Every invitee must have a name of 1–100 characters.')
  if (new Set([primary, ...invitees].map((name) => name.toLocaleLowerCase())).size !== invitees.length + 1) throw new Error('Names must be unique within each invitation.')
  if (!Number.isInteger(max) || max < invitees.length + 1 || max > 20) throw new Error('maxGuests must include all named invitees and be between 1 and 20.')
  const token = randomBytes(24).toString('base64url')
  rows.push([token, primary, String(item.email ?? ''), JSON.stringify(invitees), max, true, new Date().toISOString(), ''])
}
await writeFile(outputPath, rows.map((row) => row.map(csv).join(',')).join('\r\n') + '\r\n', { mode: 0o600 })
console.log(`Created ${guests.length} invitation rows at ${outputPath}. Keep this file private.`)
