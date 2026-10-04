import { describe, expect, it } from 'vitest'
import { isTrustedAppsScriptOrigin } from '../src/services/rsvpService'

describe('Apps Script bridge origin validation', () => {
  it('accepts Apps Script and its redirected user-content hosts', () => {
    expect(isTrustedAppsScriptOrigin('https://script.google.com')).toBe(true)
    expect(isTrustedAppsScriptOrigin('https://script.googleusercontent.com')).toBe(true)
    expect(isTrustedAppsScriptOrigin('https://n-abc123-0lu-script.googleusercontent.com')).toBe(true)
  })

  it('rejects lookalike, unencrypted, and non-origin values', () => {
    expect(isTrustedAppsScriptOrigin('http://script.google.com')).toBe(false)
    expect(isTrustedAppsScriptOrigin('https://script.google.com.attacker.example')).toBe(false)
    expect(isTrustedAppsScriptOrigin('https://attacker-script.googleusercontent.com.example')).toBe(false)
    expect(isTrustedAppsScriptOrigin('null')).toBe(false)
  })
})
