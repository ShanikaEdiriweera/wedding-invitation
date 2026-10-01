import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RsvpPage } from '../src/components/RsvpPage'
import { Countdown } from '../src/components/Countdown'
import type { RsvpService } from '../src/types/rsvp'
import { RsvpServiceNotConfiguredError } from '../src/services/rsvpService'

const token = 'a'.repeat(32)
const invitation = { primaryGuestName: 'A Guest', invitedGuestNames: ['B Guest'], maxGuests: 3 }
const record = { invitationToken: token, rsvpId: 'id', submittedAt: '2026-01-01', updatedAt: '2026-01-01', attending: true, guests: [{ name: 'A Guest' }], dietaryRequirements: 'Veg', songRequest: '', message: '' }
let service: RsvpService
afterEach(() => { cleanup(); vi.useRealTimers() })

beforeEach(() => {
  service = {
    isConfigured: true,
    getInvitation: vi.fn().mockResolvedValue({ status: 'active', invitation }),
    getRsvp: vi.fn().mockResolvedValue({ status: 'active', rsvp: null }),
    submitRsvp: vi.fn().mockResolvedValue({ status: 'saved', rsvp: record }),
  }
})

describe('invitation RSVP page', () => {
  it('shows not configured, missing and revoked invitation states', async () => {
    ;(service.getInvitation as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'not-found' })
    const { unmount } = render(<RsvpPage token={token} service={service} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be found/i)
    unmount()
    ;(service.getInvitation as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'revoked' })
    render(<RsvpPage token={'b'.repeat(32)} service={service} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer active/i)
    cleanup()
    const off: RsvpService = { ...service, isConfigured: false, getInvitation: vi.fn().mockRejectedValue(new RsvpServiceNotConfiguredError()) }
    render(<RsvpPage token={token} service={off} />)
    expect(await screen.findByText(/not open yet/i)).toBeInTheDocument()
  })

  it('accepts partial attendance with an unnamed guest and creates a response', async () => {
    render(<RsvpPage token={token} service={service} />)
    await screen.findByText('For A Guest and B Guest')
    fireEvent.click(screen.getByLabelText('Joyfully accepts'))
    fireEvent.click(screen.getByLabelText('A Guest'))
    fireEvent.change(screen.getByPlaceholderText('Guest name'), { target: { value: 'C Guest' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }))
    await waitFor(() => expect(service.submitRsvp).toHaveBeenCalledWith(token, expect.objectContaining({ attending: true, guests: [{ name: 'A Guest' }, { name: 'C Guest' }] })))
    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i)
  })

  it('validates attendance and preserves form on submission failure', async () => {
    ;(service.submitRsvp as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'))
    render(<RsvpPage token={token} service={service} />)
    await screen.findByText('For A Guest and B Guest')
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/choose whether/i)
    fireEvent.click(screen.getByLabelText('Regretfully declines'))
    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/answers are still here/i)
    expect(screen.getByLabelText('Regretfully declines')).toBeChecked()
  })

  it('loads an existing response for updating', async () => {
    ;(service.getRsvp as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'active', rsvp: record })
    render(<RsvpPage token={token} service={service} />)
    expect(await screen.findByText(/we have your reply/i)).toBeInTheDocument()
    expect(screen.getByLabelText('A Guest')).toBeChecked()
    expect(screen.getByLabelText('Dietary requirements Optional')).toHaveValue('Veg')
    expect(screen.getByRole('button', { name: 'Update RSVP' })).toBeInTheDocument()
  })

  it('submits a decline without attendees when updating a prior acceptance', async () => {
    ;(service.getRsvp as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'active', rsvp: record })
    render(<RsvpPage token={token} service={service} />)
    await screen.findByText(/we have your reply/i)
    fireEvent.click(screen.getByLabelText('Regretfully declines'))
    fireEvent.click(screen.getByRole('button', { name: 'Update RSVP' }))
    await waitFor(() => expect(service.submitRsvp).toHaveBeenCalledWith(token, expect.objectContaining({ attending: false, guests: [] })))
  })
})

describe('countdown', () => {
  it('shows zero-safe completion message', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-28T03:30:00Z'))
    render(<Countdown />)
    expect(screen.getByText('Today is the day!')).toBeInTheDocument()
  })
})
