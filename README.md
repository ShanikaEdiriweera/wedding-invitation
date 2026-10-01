# Wedding invitation website

React, TypeScript, and Vite single-page application for the wedding website. The site is statically hosted on GitHub Pages; personalized RSVP links open the full home page at its RSVP section, using tokenized paths without a client-side routing dependency.

## Development commands

Use Node.js 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

The Vite base path is `/wedding-invitation/`. `public/404.html` restores direct RSVP links and refreshes on GitHub Pages. The deploy workflow runs the tests, builds `dist`, and deploys with GitHub Actions. Set **Repository Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

## Project structure

```text
src/
  components/       Homepage sections, RSVP page/form, countdown
  content/          Wedding names, schedule, venue, event instant/timezone
  lib/              Countdown and shared RSVP validation
  services/         Apps Script bridge behind the RSVP service interface
  types/            Invitation and RSVP data types
  App.tsx           Homepage and lightweight path routing
scripts/
  generate-invitations.mjs
  google-apps-script/  Apps Script web bridge and server validation
test/               Mocked UI, service-boundary, and backend validation tests
docs/rsvp-setup.md  Private sheet setup, API contract, and manual deployment guide
```

## RSVP configuration

No Apps Script URL or Google Sheet is configured. The RSVP UI shows a friendly not-open state until `VITE_RSVP_BRIDGE_URL` is set in a local, untracked `.env.local`. Never commit guest data, generated tokens, spreadsheet IDs, or deployment URLs. Review [docs/rsvp-setup.md](docs/rsvp-setup.md) before creating the private sheet and test deployment. A live iframe flow still requires manual verification against a user-created test deployment and test sheet.
