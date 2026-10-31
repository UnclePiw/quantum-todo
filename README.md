# The Quantum Todo List

A Thai-first to-do dashboard where ignored tasks grow into custom pixel monsters.

## Monster stages

| Task age | Stage | Color |
| --- | --- | --- |
| 0–2 days | ไข่ฟักใหม่ | Mint |
| 3–6 days | เริ่มกลายร่าง | Amber |
| 7+ days | บอสตัวใหญ่ | Coral |

The API recalculates each user's pending task levels when their task list loads. The browser also calculates age from the original creation timestamp while the app is open.

## Included

- Add, edit, complete, revive, and delete tasks, with optional due dates and times plus live overdue / due-soon labels
- Search and filter active, evolving, and completed tasks
- Oldest-first sorting, evolution progress, and completion stats
- Animated pixel monsters and an on-screen runner that patrols both ways and jumps when a task is completed; victory slash and sound effects with a mute control; responsive layout and reduced-motion support
- Optional Windows desktop companion: mirrors one animated pixel monster per pending local-app task, evolves each one as it ages, removes it when completed or deleted, and runs above the taskbar while remaining click-through
- Local browser persistence when the API mode is off
- Optional Express API with PostgreSQL, email/password authentication, secure session cookies, per-user task ownership, and rate-limited sign-in/sign-up

## Run the frontend locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **ลองดูตัวอย่าง** on the empty state to preview all three monster stages.

## Run the Windows desktop pet

Double-click `desktop-pet/Start-Desktop-Pet.cmd` to show the mascots over the primary display. Keep the local Quantum Todo page open while editing tasks so it can sync the active list to the companion; after switching to another website, the last synced monsters keep running. It runs for the current Windows session and does not change startup settings. Press **Ctrl+Shift+Q** or run `desktop-pet/Stop-QuantumTodoDesktopPet.ps1` to close it.

## Run with the API locally

Start a PostgreSQL database, create a database named `quantum_todo`, and apply the API environment values:

```bash
Copy-Item api/.env.example api/.env
```

Set `NEXT_PUBLIC_API_ENABLED=true` and `API_SERVER_URL=http://localhost:4000` in `.env.local`, install the API packages, then run both servers in separate terminals:

```bash
Copy-Item .env.example .env.local
```

```bash
cd api
npm install
npm run dev
```

```bash
npm run dev
```

The API creates its tables from `api/schema.sql` on startup. The Next.js rewrite proxies `/api/*` through the frontend origin so the HTTP-only session cookie stays first-party.

## Deploy

### GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the static frontend at `https://unclepiw.github.io/quantum-todo/` whenever `main` changes. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source once. The Pages build uses local browser storage; the Express API and account login require a separate server and are not available from this static deployment.

GitHub Free requires the source repository to be public for Pages. Private repositories can use Pages on eligible paid plans. This setup leaves the repository private and does not change its visibility.

`render.yaml` provisions the API and a Render Postgres database. Create a Render Blueprint from this repository, then set the API service's `WEB_ORIGIN` to the deployed Vercel site origin.

In Vercel, set these environment variables and redeploy:

```text
NEXT_PUBLIC_API_ENABLED=true
API_SERVER_URL=https://<your-render-api-host>
```

The Render blueprint uses free resources as a preview setup. Render's current documentation says free Postgres databases expire after 30 days and free services have runtime limits; upgrade to a paid database plan for data you need to keep. See [Render free instance limitations](https://render.com/docs/free).
