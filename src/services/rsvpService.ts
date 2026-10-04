import type {
  ExistingRsvpLookup,
  InvitationLookup,
  RsvpService,
  RsvpSubmission,
  SaveRsvpResult,
} from '../types/rsvp'
import { isValidInvitationToken } from '../lib/rsvp-validation'

export type BridgeMethod = 'getInvitation' | 'getRsvp' | 'submitRsvp'
export type BridgeTransport = {
  request<T>(method: BridgeMethod, payload: Record<string, unknown>): Promise<T>
}

export class RsvpServiceNotConfiguredError extends Error {
  constructor() {
    super('RSVP service is not configured.')
    this.name = 'RsvpServiceNotConfiguredError'
  }
}

export class RsvpServiceError extends Error {
  constructor() {
    super('The RSVP service could not complete the request.')
    this.name = 'RsvpServiceError'
  }
}

export function createRsvpService(transport: BridgeTransport, isConfigured = true): RsvpService {
  function ensureConfigured() {
    if (!isConfigured) throw new RsvpServiceNotConfiguredError()
  }

  return {
    isConfigured,
    async getInvitation(token) {
      ensureConfigured()
      if (!isValidInvitationToken(token)) return { status: 'not-found' }
      return transport.request<InvitationLookup>('getInvitation', { token })
    },
    async getRsvp(token) {
      ensureConfigured()
      if (!isValidInvitationToken(token)) return { status: 'not-found' }
      return transport.request<ExistingRsvpLookup>('getRsvp', { token })
    },
    async submitRsvp(token, data: RsvpSubmission) {
      ensureConfigured()
      if (!isValidInvitationToken(token)) return { status: 'not-found' }
      return transport.request<SaveRsvpResult>('submitRsvp', { token, rsvp: data })
    },
  }
}

const appsScriptGoogleusercontentHost = /^[a-z0-9-]+-script\.googleusercontent\.com$/i

type BridgeEnvelope = {
  channel: 'wedding-rsvp-bridge'
  type: 'ready' | 'response'
  id?: string
  ok?: boolean
  result?: unknown
}

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timeoutId: number
}

class GoogleAppsScriptBridge implements BridgeTransport {
  private iframe: HTMLIFrameElement | null = null
  private frameOrigin: string | null = null
  private readyPromise: Promise<void> | null = null
  private pending = new Map<string, PendingRequest>()

  constructor(private readonly bridgeUrl: string) {
    window.addEventListener('message', this.handleMessage)
  }

  request<T>(method: BridgeMethod, payload: Record<string, unknown>): Promise<T> {
    return this.ensureReady().then(() => new Promise<T>((resolve, reject) => {
      const id = window.crypto.randomUUID()
      const timeoutId = window.setTimeout(() => {
        this.pending.delete(id)
        reject(new RsvpServiceError())
      }, 20_000)

      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timeoutId })
      try {
        this.iframe?.contentWindow?.postMessage({
          channel: 'wedding-rsvp-bridge',
          type: 'request',
          id,
          method,
          payload,
        }, this.frameOrigin!)
      } catch {
        window.clearTimeout(timeoutId)
        this.pending.delete(id)
        reject(new RsvpServiceError())
      }
    }))
  }

  private ensureReady(): Promise<void> {
    if (this.frameOrigin) return Promise.resolve()
    if (this.readyPromise) return this.readyPromise

    this.readyPromise = new Promise<void>((resolve, reject) => {
      let checkReady: (event: MessageEvent<BridgeEnvelope>) => void
      const timeoutId = window.setTimeout(() => {
        this.readyPromise = null
        window.removeEventListener('message', checkReady)
        this.iframe?.remove()
        this.iframe = null
        reject(new RsvpServiceError())
      }, 20_000)

      const iframe = document.createElement('iframe')
      iframe.title = 'RSVP service connection'
      iframe.hidden = true
      iframe.src = `${this.bridgeUrl}${this.bridgeUrl.includes('?') ? '&' : '?'}parentOrigin=${encodeURIComponent(window.location.origin)}`
      iframe.addEventListener('load', () => {
        // The bridge sends its authenticated ready message after its Apps Script client is available.
      }, { once: true })
      this.iframe = iframe
      document.body.appendChild(iframe)

      checkReady = (event: MessageEvent<BridgeEnvelope>) => {
        if (event.source !== iframe.contentWindow || event.data?.channel !== 'wedding-rsvp-bridge' || event.data.type !== 'ready') return
        if (!isTrustedAppsScriptOrigin(event.origin)) return
        window.clearTimeout(timeoutId)
        this.frameOrigin = event.origin
        window.removeEventListener('message', checkReady)
        resolve()
      }

      window.addEventListener('message', checkReady)
    })
    return this.readyPromise
  }

  private handleMessage = (event: MessageEvent<BridgeEnvelope>) => {
    if (event.source !== this.iframe?.contentWindow || !this.frameOrigin || event.origin !== this.frameOrigin) return
    const message = event.data
    if (!message || message.channel !== 'wedding-rsvp-bridge' || message.type !== 'response' || !message.id) return
    const pendingRequest = this.pending.get(message.id)
    if (!pendingRequest) return
    window.clearTimeout(pendingRequest.timeoutId)
    this.pending.delete(message.id)
    if (message.ok) pendingRequest.resolve(message.result)
    else pendingRequest.reject(new RsvpServiceError())
  }
}

const bridgeUrl = import.meta.env.VITE_RSVP_BRIDGE_URL?.trim() ?? ''
const bridgeTransport = bridgeUrl ? new GoogleAppsScriptBridge(bridgeUrl) : null

export const rsvpService: RsvpService = bridgeTransport
  ? createRsvpService(bridgeTransport)
  : createRsvpService({ request: async () => { throw new RsvpServiceNotConfiguredError() } }, false)

export function isTrustedAppsScriptOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.protocol !== 'https:' || url.origin !== origin) return false
    return url.hostname === 'script.google.com'
      || url.hostname === 'script.googleusercontent.com'
      || appsScriptGoogleusercontentHost.test(url.hostname)
  } catch {
    return false
  }
}
