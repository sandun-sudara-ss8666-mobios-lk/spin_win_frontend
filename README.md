# Spin & Win frontend

Run `npm run dev` for local development. Vite selects `.env.development`, using the backend at `http://localhost:3010/` and Socket.IO at `http://localhost:3010/events`. Start the backend with `npm run start:dev` in its own directory, then open `http://localhost:5173`.

Run `npm run build` for production. Vite selects `.env.production`, using `https://spin-n-win.mobios.lk/api/v1/` and its `/events` endpoint. Serve or deploy the generated `dist` directory; `npm run preview` previews this production build locally and still connects to production.

The mode files override the generic `.env`. Restart Vite after editing development settings and rebuild after editing production settings. Exported shell variables override file values. For LAN testing, change both development URLs and the backend's `PUBLIC_MEDIA_BASE_URL` to the backend machine's LAN address. Keep these mode files limited to public settings; Vite embeds `VITE_*` values in the client bundle.

Uploaded image and video URLs come from the backend as complete URLs. Existing local paths remain supported for reward videos. Media files must exist on the server serving the returned URL.

The wheel display loads all waiting and selected visitors in pages of 100, newest registrations first. The queue refresh icon shows a loading spinner while the complete queue is fetched, including live updates. Completed visitors leave the spin queue.

See [Vite environment files and modes](https://vite.dev/guide/env-and-mode).
