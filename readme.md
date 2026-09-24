# EventPulse: Find, Track & Share Events

EventPulse is a full-stack platform for finding local events, RSVPing to them and inviting friends. Event listings come from the **Ticketmaster Discovery API**. RSVPs, user profiles, reminder settings and invite tracking are stored in **MongoDB**. A **Socket.IO** connection updates the "Friends Attending" count live.

## Features

| Area | What it does |
|---|---|
| **Event Calendar** | A monthly grid that highlights dates with events and shows how many are on each day. Click a day to filter the list to it. |
| **Event Cards** | Title, venue, date, time, category and image, with an **Interested** button, a **Share link** button and a **Friends Attending** count. |
| **RSVP Dashboard** | All confirmed attendance, with a countdown, reminder settings, the share link and its click count, and a cancel option. |
| **Event Feed** | Live Ticketmaster listings, filtered by city, keyword, category and date, with pagination and a 5-minute server cache. |
| **Persistence** | MongoDB (Mongoose) stores users, RSVPs, reminder preferences, share links and link clicks. |
| **Friend Invite** | After RSVPing, a user can generate a share link. The backend counts **unique visitors** who click it and shows the total as **Friends Attending** on the event card, updated in real time. |

## Tech stack

- **Backend:** Node.js, Express 5, Mongoose, Socket.IO, express-validator, axios
- **Frontend:** React 19 (Vite), React Router, React Context, axios, socket.io-client
- **Database:** MongoDB Atlas

---

## Setup

### Prerequisites
- Node.js 18 or later (built with 22)
- A MongoDB connection string (Atlas free tier or local `mongod`)
- *(Optional)* A Ticketmaster API key from <https://developer.ticketmaster.com>. Without one, the app serves built-in mock events.

### 1. Clone
```bash
git clone https://github.com/am12an34/Unstop-Qantiphi.git
cd Unstop-Qantiphi
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # nodemon, http://localhost:5000
```

`backend/.env`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster/eventsapp` |
| `TM_API_KEY` | Ticketmaster Discovery API key (optional) | `abc123...` |
| `CLIENT_URL` | Frontend origin, used for CORS and invite redirects | `http://localhost:5173` |
| `SERVER_URL` | Public API origin, used to build share links | `http://localhost:5000` |

When the server starts, it logs whether events come from **Ticketmaster** or **mock data**. If `TM_API_KEY` is empty or still the placeholder, or a Ticketmaster request fails, the app uses mock events so it keeps working.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev               # http://localhost:5173
```

### Or run everything with Docker
```bash
docker compose up --build
```
This starts three containers: **mongo** (MongoDB 7), **backend** (Node, http://localhost:5000) and **frontend** (the React build served by nginx, http://localhost:5173).
- `backend/.env` is loaded if it exists, e.g. for `TM_API_KEY`.
- The bundled Mongo container is used by default. To use Atlas instead, run `MONGO_URI="mongodb+srv://..." docker compose up --build`.

**CI:** `.github/workflows/gitleaks.yml` scans the full git history for leaked secrets on every push and pull request.

### 4. Try the Friend Invite flow
1. Open <http://localhost:5173>, click **Sign in** and create a profile.
2. Click **Interested** on an event, then **Share link**. The link is copied to your clipboard.
3. Open the link in another browser or an incognito window. The **Friends Attending** count on the first window updates live, without a refresh.
4. Open **My RSVPs** to see the link's unique click count and to change reminder settings.

---

## Architecture

```
┌──────────────────────────┐        REST (axios, x-user-id)       ┌───────────────────────────────┐
│  React (Vite)            │ ───────────────────────────────────▶ │  Express API                  │
│  pages → hooks → api     │                                      │  routes → controllers →       │
│  Context: User / Socket  │ ◀──────── Socket.IO ──────────────── │  services → models            │
│           / Toast        │        friends:update                │                               │
└──────────────────────────┘                                      └──────┬──────────────┬─────────┘
                                                                         │              │
                                                               Mongoose  │              │ axios (cached)
                                                                         ▼              ▼
                                                                  ┌───────────┐  ┌──────────────────┐
                                                                  │  MongoDB  │  │ Ticketmaster API │
                                                                  └───────────┘  └──────────────────┘
```

### Backend layout
```
backend/src
├── server.js              # HTTP server, DB connection, Socket.IO startup
├── app.js                 # Express app, middleware, routes, /s/:token invite redirect
├── socket.js              # Socket.IO instance and emit helper
├── config/                # env loading (placeholder values ignored), MongoDB connection
├── middleware/            # currentUser (x-user-id), validate, errorHandler
├── routes/                # URL + validation rules (express-validator)
├── controllers/           # read the request, call a service, send the response
├── services/              # all business logic
│   ├── ticketmaster.service.js   # API client, normalisation, 5-min cache
│   ├── event.service.js          # date ranges, filtering, pagination, calendar aggregation
│   ├── user.service.js           # profile find-or-create and update
│   ├── rsvp.service.js           # RSVP rules, reminder calculation, dashboard data
│   └── share.service.js          # share links, unique click tracking, friends count
├── models/                # User, Rsvp, ShareLink, LinkClick
├── data/mockEvents.js     # fallback events used without Ticketmaster
└── utils/ApiError.js      # typed HTTP errors
```

Each layer has one job. **Routes** declare the URL and validation, **controllers** handle HTTP only, **services** hold the business rules, and **models** define the data.

### Frontend layout
```
frontend/src
├── api/                   # axios client (interceptors) + typed endpoint functions
├── context/               # UserContext, SocketContext (+ useSocketEvent), ToastContext
├── hooks/                 # useEvents (feed + live updates), useEventActions, useDebounce
├── components/            # Navbar, Calendar, EventCard, ProfileModal
├── pages/                 # EventsPage (discover + invite banner), DashboardPage
└── utils/format.js        # display formatting only
```

### Business logic stays on the server
The React app only displays data and sends user actions. The server does all of the following:
- validates every input (`express-validator`, Mongoose schemas and service checks)
- builds the calendar by grouping events by date
- works out `daysUntil`, `isPast`, `reminderAt` and `reminderDue` for each RSVP
- counts attendees and Friends Attending with MongoDB aggregations
- enforces the rules: no duplicate RSVPs, no RSVPs to past events, only the owner can edit or delete an RSVP, and sharing requires an RSVP
- after an RSVP, the client fetches the event again, so every count comes from the server

### Frontend optimisations
- **Route-level code splitting:** `React.lazy` + `Suspense` load each page only when it's visited.
- **Memoisation:** `EventCard` and `Calendar` use `React.memo`, handlers use `useCallback`, and the query and context values use `useMemo` to avoid unnecessary re-renders.
- **Debounced search:** the city and keyword filters wait 400 ms before sending a request.
- **Request cancellation:** `AbortController` cancels an old request when the filters change, so an outdated response can't overwrite a newer one.
- **One socket per app:** `SocketContext` shares a single connection, and `useSocketEvent` subscribes and cleans up per component.
- Images lazy-load, skeleton placeholders show while loading, and the layout adapts to phone screens.

---

## Data model

```
User        { name, email (unique), city, defaultReminderMinutes }
Rsvp        { user → User, eventId, event{title, venue, city, date, time, image, url, category},
              status: 'going', reminder{enabled, minutesBefore}, referredBy }
              unique index (user, eventId)
ShareLink   { token (unique), user → User, eventId, eventTitle, clickCount }
              unique index (user, eventId)   → one link per user per event
LinkClick   { shareLink → ShareLink, eventId, visitorHash }
              unique index (shareLink, visitorHash) → a visitor is counted once
```

- `Rsvp.event` stores a **copy of the event details**, so the dashboard loads without calling Ticketmaster again.
- **Friends Attending** for an event = the number of `LinkClick` documents for that `eventId`, i.e. unique visitors across all of that event's share links.

---

## API design

Base URL: `http://localhost:5000/api`. Requests and responses are JSON. Errors always have the form `{ "error": "message" }` with the matching HTTP status.

**Identity:** `POST /api/users` returns a profile. The client sends its `_id` in the `x-user-id` header. Endpoints marked 🔒 need this header; event endpoints accept it optionally, to add per-user fields.

### Events

| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | Event feed. Query: `month=YYYY-MM` or `from`/`to` (YYYY-MM-DD), `city`, `keyword`, `category`, `page`, `limit` (≤ 50) |
| GET | `/events/calendar?month=YYYY-MM` | Event count for each day of the month |
| GET | `/events/:id` | Single event |

```jsonc
// GET /api/events?month=2026-10&city=Agartala&limit=1
{
  "events": [{
    "id": "mock-1-11", "title": "Northeast Rock Fest", "category": "Music",
    "venue": "Swami Vivekananda Stadium", "city": "Agartala",
    "date": "2026-10-09", "time": "16:00", "image": "https://…", "url": null,
    "isInterested": true, "attendeeCount": 4, "friendsAttending": 3
  }],
  "page": 1, "limit": 1, "total": 2, "totalPages": 2
}

// GET /api/events/calendar?month=2026-10
{ "month": "2026-10", "totalEvents": 20, "days": { "2026-10-01": 1, "2026-10-09": 2 } }
```

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Find or create a profile by email. Body: `{ name, email, city? }`. Returns `201` if created, `200` if it already existed |
| GET 🔒 | `/users/me` | Current profile |
| PATCH 🔒 | `/users/me` | Update `name`, `city`, `defaultReminderMinutes` |

### RSVPs 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/rsvps` | RSVP to an event. Body: `{ eventId, ref? }`, where `ref` is the invite token if the user came from a share link |
| GET | `/rsvps?includePast=true` | Dashboard: `{ upcoming[], past[], stats }` |
| PATCH | `/rsvps/:id/reminder` | Body: `{ enabled?, minutesBefore? }`. `minutesBefore` must be one of `15, 60, 180, 1440, 4320` |
| DELETE | `/rsvps/:id` | Cancel an RSVP (owner only) |

```jsonc
// GET /api/rsvps → upcoming[0]
{
  "id": "…", "eventId": "mock-0-18",
  "event": { "title": "Bollywood Retro Night", "venue": "Phoenix Marketcity", "date": "2026-09-27", "time": "20:00" },
  "reminder": { "enabled": true, "minutesBefore": 1440 },
  "startsAt": "…", "daysUntil": 3, "isPast": false, "reminderAt": "…", "reminderDue": false,
  "share": { "token": "Ypv9-wBA", "url": "http://localhost:5000/s/Ypv9-wBA", "clicks": 3 },
  "friendsAttending": 3
}
```

### Friend Invite

| Method | Endpoint | Description |
|---|---|---|
| POST 🔒 | `/share` | Body: `{ eventId }`. Requires an RSVP (otherwise `403`). Returns the user's link for that event, creating it the first time: `{ token, url, clicks }` |
| GET | `/share/:token` | Invite details for the landing banner: `{ eventTitle, invitedBy, eventId }` |
| GET | **`/s/:token`** *(no `/api` prefix)* | The public share link: records the click and redirects to `CLIENT_URL/?event=…&ref=…` |

**How a click is counted** (`GET /s/:token`):
1. The visitor is identified by a `vid` cookie (a random UUID, set on their first visit).
2. A `LinkClick` document is inserted with `sha256(vid)`. The unique index `(shareLink, visitorHash)` rejects repeat clicks from the same visitor, so each person counts once.
3. On a new click, `ShareLink.clickCount` is incremented, Friends Attending is recalculated with an aggregation, and the server broadcasts:
   ```json
   { "event": "friends:update", "eventId": "…", "friendsAttending": 3, "token": "…", "linkClicks": 3 }
   ```
4. The browser is redirected to the event in the React app, which shows "*Aman invited you to …*".

### Status codes
`200` OK · `201` Created · `400` Validation error · `401` Missing/invalid `x-user-id` · `403` Not allowed (another user's RSVP, or sharing without an RSVP) · `404` Not found · `409` Duplicate RSVP · `502` Ticketmaster unavailable

---

## Assumptions & trade-offs

- **Lightweight identity:** a profile is found or created by email, and its id is kept in `localStorage` and sent as `x-user-id`. There are no passwords, given the time limit. The next step would be JWT authentication, and the middleware is already set up to swap in.
- **Unique clicks** rely on a browser cookie, so the same person on a different browser counts again. Adding IP and user-agent to the fingerprint, or counting only visitors who RSVP, would make it stricter.
- **Reminders:** the settings are stored and the reminder time is calculated (`reminderAt`, `reminderDue`). Actually sending reminders (by email or push, from a scheduled job) isn't built yet.
- **Ticketmaster** results are cached in memory for 5 minutes to stay within API rate limits. A shared cache such as Redis would be needed with more than one server.
