# RSVP service setup (manual, after review)

The React application is disconnected until `VITE_RSVP_BRIDGE_URL` is provided in an untracked `.env.local`. No spreadsheet ID, Apps Script deployment URL, guest list, or token is stored in this repository.

## Invitation links and private data

Create a private JSON file outside version control with this shape:

```json
[
  { "primaryGuestName": "Guest name", "invitedGuestNames": ["Named household guest"], "email": "private@example.com", "maxGuests": 3 }
]
```

Run `node scripts/generate-invitations.mjs private-invitations.json invitation-import.csv`. The script generates 24 cryptographically random bytes per row and encodes each as 32 URL-safe characters. It writes import-ready CSV with restrictive local permissions. Do not commit the input, CSV, exported sheet, or tokens. The email is private to the `Invitations` sheet and is never returned to the browser. When the final site URL is known, each link is `<site-origin>/wedding-invitation/rsvp/<token>`.

These links are bearer credentials: anyone who receives or forwards a link can view and change that invitation’s reply. There is no identity verification, account, or email collection in the guest form. Keep the guest sheet private and revoke links by setting `Active` false.

## Google Sheet

Create a private spreadsheet with two tabs and these exact header rows:

`Invitations`: `Invitation Token`, `Primary Guest Name`, `Email`, `Invited Guest Names`, `Max Guests`, `Active`, `Created At`, `Revoked At`.

`Responses`: `Invitation Token`, `RSVP ID`, `Submitted At`, `Updated At`, `Attending`, `Guest Count`, `Guest Names`, `Dietary Requirements`, `Song Request`, `Message`.

Store `Invited Guest Names` and `Guest Names` as JSON arrays in cells (for example `["Alex"]`). Keep the sheet restricted to the couple and trusted administrators. `maxGuests` counts everyone including the primary invitee. The named guest list must fit within this number; remaining seats are unnamed guest slots.

## Apps Script installation

Source is in `scripts/google-apps-script/`. After reviewing it:

1. Create a standalone Apps Script project and copy `Code.gs`, `Validation.gs`, `Bridge.html`, and `appsscript.json` into it.
2. In **Project Settings → Script Properties**, set `SPREADSHEET_ID` to your spreadsheet ID and `ALLOWED_PARENT_ORIGIN` to the exact published site origin (scheme and host only, no path or trailing slash). These properties are intentionally blank in this repository.
3. Confirm both tabs and headers, then use **Deploy → New deployment → Web app**, execute as the deploying owner, and allow anonymous access for guests. This is required because guests do not sign in. Review that access choice carefully and keep the sheet private.
4. Put the resulting `/exec` URL in the local `.env.local` as `VITE_RSVP_BRIDGE_URL`, rebuild, and deploy the static site through GitHub Pages. Never commit `.env.local` or use a test deployment URL in production.

The iframe uses `google.script.run` RPC and validates the parent origin in both directions. `ALLOWALL` enables framing, so the exact trusted origin check in `Bridge.html` is required. The parent also checks the iframe's `event.source` and Apps Script origin. The server locks response upserts by invitation token; updates preserve the original submission ID/time. Validation is performed in browser and again on the server. No invitation email is sent to the client.

## API contract

The bridge supports `getInvitation({token})`, `getRsvp({token})`, and `submitRsvp({token, rsvp})`.

- Invitation lookup returns `active` with only primary name, named guest names, and max guests; `not-found` or `revoked` contains no invitation data.
- RSVP lookup returns `active` with a response or `null`; revoked and unknown invitations remain distinct.
- Submit returns `saved` with the stored response or an invitation state. Declines are stored as `attending: false` and an empty guest array. Acceptances require at least one named attendee.
- Name, dietary, song, and message limits are 100, 500, 120, and 1,000 characters. An invitation allows at most 20 total guests.

Guest-facing messages are generic and do not display technical errors. The Apps Script does not log guest data.

## Manual verification after setup

Use a separate test spreadsheet and test deployment, never the live guest sheet. Verify a new acceptance, partial named-household attendance, an unnamed guest, decline, edit existing response, revoked and unknown links, refresh on an RSVP link, and a deliberately failed service call. Check on a phone-sized viewport and confirm no technical details appear. The live iframe flow cannot be verified until you create that deployment; this implementation has only mocked service and server validation tests.
