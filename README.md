# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Live opportunity feeds

Hackathons are loaded from the documented Brabble.ai API. Create a key at
[brabble.ai/developers](https://brabble.ai/developers) and set `BRABBLE_API_KEY`
in `server/.env` (see `server/.env.example`). The key is sent only by the
backend; keep it private. Listings link to the organizer for registration and
credit Brabble.ai as their source.
The backend follows the API's pagination and loads all currently returned
hackathons (up to the API's 100,000-row offset limit). The Hackathons page has a
search field for titles, organizers, platforms, locations, and listing details.
The main dashboard shows up to six matching hackathons with a search field and
a link to browse the complete list.

The COER Hackathon 6.0 event page provided by the user does not expose a
documented public API. Its currently listed event is shown as a verified
official-page listing through Oct 10, 2026, with the event page and registration
links; it is not represented as API-fetched data.

Internship feeds currently use the existing public sources. The live-feed panel
also provides a direct LinkedIn internship search; LinkedIn listing data
requires access to an approved API product, so no unofficial API or scraper is
used.

Job listings are also loaded from the public [Arbeitnow Job Board API](https://www.arbeitnow.com/api/job-board-api).
Listings marked as internships are categorized separately; Arbeitnow is credited
on each listing and links lead to the original job post.
Adzuna India job listings use its official Search API. Register at
[developer.adzuna.com](https://developer.adzuna.com/) and set `ADZUNA_APP_ID`
and `ADZUNA_APP_KEY` in `server/.env` (see `server/.env.example`). Keep both
values private; requests are sent only by the backend. Up to 50 listings are
loaded per feed refresh, with internships categorized separately.

Findwork listings use the authenticated `/api/jobs/` endpoint. Set
`FINDWORK_API_TOKEN` in `server/.env`; the API token is sent only by the
backend. Up to five API pages are loaded per refresh, and listings identified
as internships are categorized separately.

LinkedIn jobs use the [LinkedIn Job Search API on RapidAPI](https://rapidapi.com/fantastic-jobs-fantastic-jobs-default/api/linkedin-job-search-api/playground/Get%20Jobs).
Subscribe to the API and set `LINKEDIN_RAPIDAPI_KEY` in `server/.env`. The
RapidAPI key is sent only by the backend. The integration requests up to 100
jobs from the last 24 hours for India and categorizes roles identified as
internships separately. Results follow the shared one-hour feed cache.

The Open Source section uses GitHub's public Search Issues API to show up to 100
recently updated, open issues labeled `good first issue`. No GitHub token is
required; results link to the issue and repository, and requests follow
GitHub's unauthenticated API rate limits.
