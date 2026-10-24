# Job Hunt

A personal job-hunting workspace for iOS, Android and the web. It reads the
openings published by [`AbhinandanSW/job_board`](https://github.com/AbhinandanSW/job_board),
keeps an application pipeline, and drafts tailored cover letters with an
OpenAI-compatible model.

The web build replaces the old GitHub Pages dashboard and deploys to Pages from
this repository.

## What it does

- **Job feed** — `jobs.json` (matched roles) and `others.json` (everything else)
  with search, role/location/mode filters, saved/applied/hidden tabs, and a
  cached copy for offline use.
- **Application tracker** — saved, applied, interview, offer, rejected and
  hidden stages, notes, follow-up dates, and a timeline per application.
- **Quick apply** — opens the posting, marks it applied, and copies your contact
  block in one tap. It does not submit forms for you: generic auto-submit breaks
  most job-board terms and is easy to detect. Undo is always one tap away.
- **AI writing help** — cover letters and resume bullets generated from your
  profile and the posting. Drafts are editable, saved to the application, and
  never invented from thin air (the prompt forbids fabricating experience).
- **Private sync** — application state and profile live in one JSON file in a
  private repository. Every device merges per record by `updatedAt`, so offline
  edits reconcile cleanly.
- **Light and dark** — follow the system or lock either theme from Settings, with
  a quick toggle in the web header.
- **Old dashboard import** — bring the previous job_board Saved / Applied / Hidden
  flags into the tracker once, automatically on GitHub Pages or by pasting the
  JSON in Settings.

## Stack

- Expo SDK 58 / React Native 0.88, Expo Router
- `expo-secure-store` on native, `localStorage` on web for the PAT and AI key
- AsyncStorage for settings, the shared state cache, and the job feed cache
- GitHub Contents API for sync; GitHub Actions dispatch API for the scraper
- Static export (`web.output: "single"`) deployed to GitHub Pages

## Setup

### 1. Data repository

Create a private repository for sync, for example
`AbhinandanSW/job-hunt-data`. The app writes `state.json` there. Nothing else is
required in the repo.

Create a **fine-grained personal access token**:

- Repository access: only the data repository
- Permissions: **Contents → Read and write**
- Optional, only for the "Run job scan" button: add `job_board` and grant
  **Actions → Read and write**

Paste the token in **Settings → GitHub sync**. It stays on the device and is
never bundled into the web build.

### 2. Run locally

Node **22.13 or newer** is required by SDK 58.

```bash
npm install
npx expo start
```

- `w` opens the web build
- `a` opens Android (development build or emulator)
- `i` opens iOS (macOS only)

### 3. Web deployment

1. Push this repo to GitHub (`main` branch).
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. Run the **Deploy web** workflow, or push to `main`.

The workflow exports the app, copies `index.html` to `404.html` so client-side
routes survive a refresh, and deploys `dist/`. The base URL is derived from the
repository name (`https://<user>.github.io/<repo>/`).

For a custom domain, set `EXPO_BASE_URL` explicitly in the workflow.

### 4. Vercel

The web app can also be hosted on Vercel. `vercel.json` sets the build command,
output directory, and the SPA rewrite required by `web.output: "single"`.

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Confirm the settings from `vercel.json`:
   - **Install Command** — `npm ci`
   - **Build Command** — `npm run build:web`
   - **Output Directory** — `dist`
   - **Node.js Version** — `24.x` (Vercel default; `engines` requires `>=22.13.0`)
4. Do **not** set `EXPO_BASE_URL`; it is only needed for a GitHub Pages subpath.
5. Deploy.

Or deploy from the CLI:

```bash
npx vercel@latest
npx vercel@latest --prod
```

The feed comes directly from
`https://abhinandansw.github.io/job_board/jobs.json`, with `others.json` read
alongside it. GitHub Pages allows cross-origin reads, so the Vercel app can
fetch both files without a proxy or environment variable.

### 5. Mobile builds

The app uses `expo-secure-store`, so Expo Go is not enough for a production
build. Use a development build or EAS:

```bash
npx expo run:android
npx expo run:ios
# or
npx eas-cli build --profile development
```

## Configuration

Everything is edited in the app's **Settings** screen:

| Setting | Purpose |
| --- | --- |
| Profile | Contact block, headline, experience, links, resume text for AI |
| GitHub sync | Data repo owner/name/branch/path and PAT |
| AI assistant | Base URL (e.g. `https://api.openai.com/v1`), model, API key |
| Feed & automation | Read-only source info, refresh, and the "Run job scan" button |

The feed location is fixed in `src/lib/settings.ts` (`JOBS_URL`). The app reads
`jobs.json` directly and derives `others.json` from the same URL.

### AI provider

Any endpoint that implements `POST {baseUrl}/chat/completions` with the OpenAI
request shape works — OpenAI, OpenRouter, Groq, a local gateway, and so on. The
key and generated text are sent only to that provider.

## Importing the old dashboard

The previous GitHub Pages dashboard stored its Saved / Applied / Hidden flags in
the browser, not in the repository:

```js
localStorage["jobstatus:v1"]
```

When this app is served from `https://abhinandansw.github.io/tracker/`, it shares
an origin with the old dashboard and imports those flags automatically on first
load. Existing tracker records are never overwritten.

On Vercel (or another origin), open the old dashboard, run this in the browser
console, copy the result, and paste it into **Settings → Old dashboard → Import**:

```js
copy(localStorage.getItem("jobstatus:v1"))
```

The import keeps `saved`, `applied`, and `hidden`. Openings that have already left
the feed are still kept, with the original id as a fallback title.

## Privacy

- The web app stores tokens in the browser's `localStorage`. Use a scoped token
  and avoid shared computers.
- Native builds use the OS keychain/keystore via `expo-secure-store`.
- Application state is stored in your private repo, not on a server owned by
  this project.
- No analytics, accounts or telemetry.

## Scripts

```bash
npm run start       # Expo dev server
npm run web         # web dev server
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm run build:web   # static web export to dist/
```

## Project layout

```
src/app/(tabs)/index.tsx     Job feed
src/app/(tabs)/tracker.tsx   Application pipeline
src/app/(tabs)/settings.tsx  Settings
src/app/job/[id].tsx         Job detail, notes, AI drafts
src/components/              UI primitives and feature components
src/providers/               Settings, jobs, applications, toasts
src/lib/                     GitHub sync, AI, filtering, formatting
.github/workflows/deploy-web.yml
```
