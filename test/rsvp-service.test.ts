import { describe, expect, it, vi } from 'vitest'
import { GoogleAppsScriptBridge, isTrustedAppsScriptOrigin } from '../src/services/rsvpService'

describe('Google Apps Script bridge messaging', () => {
  it('sends requests to the nested Apps Script frame that initiated the nonce handshake', async () => {
    const bridge = new GoogleAppsScriptBridge('https://script.google.com/macros/s/test/exec')
    const postMessage = vi.fn()
    const nestedFrame = { postMessage } as unknown as Window
    const request = bridge.request('getInvitation', { token: 'a'.repeat(32) })
    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    const bridgeNonce = new URL(iframe!.src).searchParams.get('bridgeNonce')
    expect(bridgeNonce).toMatch(/^[A-Za-z0-9-]{20,80}$/)

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://n-abc123-0lu-script.googleusercontent.com',
      source: nestedFrame,
      data: { channel: 'wedding-rsvp-bridge', type: 'ready', nonce: bridgeNonce },
    }))
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledOnce())
    const [sentMessage, targetOrigin] = postMessage.mock.calls[0] as [Record<string, unknown>, string]
    expect(targetOrigin).toBe('https://n-abc123-0lu-script.googleusercontent.com')
    expect(sentMessage).toMatchObject({ channel: 'wedding-rsvp-bridge', type: 'request', nonce: bridgeNonce })

    window.dispatchEvent(new MessageEvent('message', {
      origin: targetOrigin,
      source: nestedFrame,
      data: { channel: 'wedding-rsvp-bridge', type: 'response', nonce: bridgeNonce, id: sentMessage.id, ok: true, result: { status: 'not-found' } },
    }))
    await expect(request).resolves.toEqual({ status: 'not-found' })
  })
})

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
