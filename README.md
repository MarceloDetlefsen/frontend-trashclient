# EcoScan – Waste Detection Dashboard

EcoScan is an AI-powered waste detection and collection optimization web application. It allows users to upload images of waste sites, automatically classifies the waste types using Claude AI, stores the results with geographic coordinates, and visualises everything on an interactive map with heat maps and statistics.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Waste Categories](#waste-categories)
- [Key Design Decisions](#key-design-decisions)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Features

- 📸 **Image Upload & AI Analysis** – Upload a photo of a waste site and receive an instant breakdown of waste composition across 9 categories via Claude 3.5 Sonnet.
- 🗺️ **Interactive Map Dashboard** – View all recorded waste sites on a MapLibre GL map with colour-coded markers by dominant waste type.
- 🌡️ **Heat Map** – Geographic heat map aggregated by geohash for quick density visualisation.
- 📊 **Waste Breakdown Bars** – Horizontal progress bars showing the percentage of each waste type per record.
- 📍 **Geolocation Support** – Auto-detects coordinates via the browser's Geolocation API; manual override available.
- ☁️ **Image Storage** – Optional Cloudinary integration to persist uploaded images.
- 🔄 **Route Optimization Stub** – Endpoint scaffolded for future collection-route optimisation.
- ⚡ **Health Check Endpoint** – `/api/health` for monitoring uptime.

---

## Architecture

```
┌─────────────────────────────┐
│   Browser (Next.js 16)      │
│                             │
│  /dashboard  /upload        │
│  MapLibre GL map            │
│  WasteBar charts            │
└────────────┬────────────────┘
             │ fetch (same origin)
             ▼
┌─────────────────────────────┐
│  Next.js API Routes         │
│                             │
│  POST /api/analyze-image    │──────► OpenRouter (Claude 3.5 Sonnet)
│  GET  /api/trash            │
│  GET  /api/heatmap          │──────► ngeohash aggregation
│  GET  /api/health           │
│  GET  /api/routes/optimized │ (stub)
└────────────┬────────────────┘
             │ @libsql/client
             ▼
┌─────────────────────────────┐
│  Turso (libSQL / SQLite)    │
│  trash_records table        │
└─────────────────────────────┘
             │
             ▼ (optional)
┌─────────────────────────────┐
│  Cloudinary                 │
│  Image hosting (trash/)     │
└─────────────────────────────┘
```

The entire application is a single **Next.js** project. There is no separate Express backend – all server logic lives in Next.js API Routes (`app/api/`).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) | 16.1.6 |
| UI Library | [React](https://react.dev/) | 19.2.3 |
| Language | TypeScript (strict mode) | ^5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) via PostCSS | ^4 |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) | latest |
| Icons | [Lucide React](https://lucide.dev/) | ^0.577.0 |
| Mapping | [MapLibre GL](https://maplibre.org/) | ^5.19.0 |
| AI / LLM | [OpenRouter](https://openrouter.ai/) → Claude 3.5 Sonnet | via `@anthropic-ai/sdk` |
| Database | [Turso](https://turso.tech/) (libSQL / SQLite) | via `@libsql/client` (replaces the Prisma plan described in AGENTS.md) |
| Image Storage | [Cloudinary](https://cloudinary.com/) (optional) | ^2.9.0 |
| Geo Hashing | [ngeohash](https://github.com/sunng87/node-geohash) | ^0.6.3 |
| Font | [Geist](https://vercel.com/font) | via `next/font` |

---

## Project Structure

```
frontend-trashclient/
├── app/
│   ├── api/
│   │   ├── analyze-image/
│   │   │   └── route.ts          # POST – analyse image with Claude AI
│   │   ├── trash/
│   │   │   └── route.ts          # GET  – list all trash records
│   │   ├── heatmap/
│   │   │   └── route.ts          # GET  – aggregated heatmap buckets
│   │   ├── health/
│   │   │   └── route.ts          # GET  – health check
│   │   └── routes/optimized/
│   │       └── route.ts          # GET  – route optimisation (stub)
│   ├── components/
│   │   ├── DashboardMap.tsx      # Dynamic (SSR-disabled) map wrapper
│   │   ├── TrashMap.tsx          # MapLibre map with markers & popups
│   │   ├── WasteBar.tsx          # Horizontal waste-type progress bars
│   │   └── Navbar.tsx            # Global navigation bar
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (map + stats)
│   ├── upload/
│   │   └── page.tsx              # Image upload & analysis form
│   ├── lib/
│   │   ├── types.ts              # Shared TypeScript interfaces
│   │   ├── api.ts                # Fetch helpers (getTrashRecords, analyzeImage)
│   │   ├── analyze.ts            # Claude AI integration (OpenRouter)
│   │   ├── db.ts                 # Turso database client & queries
│   │   ├── cloudinary.ts         # Optional Cloudinary image uploads
│   │   └── utils.ts              # WASTE_TYPES, colour map, helper functions
│   ├── layout.tsx                # Root layout (Geist font, Navbar)
│   ├── page.tsx                  # Entry point → redirects to /dashboard
│   └── globals.css               # Tailwind v4 + custom theme tokens
├── components/
│   └── ui/
│       ├── button.tsx            # Base button component (shadcn)
│       └── map.tsx               # MapLibre wrapper component
├── lib/
│   └── utils.ts                  # cn() Tailwind merge utility
├── public/                       # Static assets
├── AGENTS.md                     # Architecture & conventions for AI agents
├── README.md                     # This file
├── components.json               # shadcn/ui configuration
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # Tailwind v4 PostCSS plugin
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# ─── App URLs ────────────────────────────────────────────
# Base URL of this app (used as OpenRouter HTTP-Referer header).
# The dev server runs on port 3001 (set in package.json) to avoid
# conflicts if a separate backend is ever run locally on port 3000.
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Base URL for API calls from client components.
# Leave empty to use the same origin (default for this unified app).
NEXT_PUBLIC_API_URL=

# ─── OpenRouter (Claude AI) ──────────────────────────────
# Obtain from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-...

# ─── Turso Database ──────────────────────────────────────
# Obtain from https://turso.tech/  (run: turso db show --url <db-name>)
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
# Obtain from: turso db tokens create <db-name>
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─── Cloudinary (optional – image hosting) ───────────────
# If any of these are absent, image uploads are skipped gracefully
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Never commit `.env.local`** – it is already listed in `.gitignore`.

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- A [Turso](https://turso.tech/) account with a database created
- An [OpenRouter](https://openrouter.ai/) API key
- *(Optional)* A [Cloudinary](https://cloudinary.com/) account for image storage

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MarceloDetlefsen/frontend-trashclient.git
cd frontend-trashclient

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local   # then fill in your values

# 4. Initialise the database table (run once)
#    The table is created automatically on first write if it does not exist,
#    or you can create it manually – see Database Schema below.

# 5. Start the development server (runs on http://localhost:3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3001 with hot reload |
| `npm run build` | Create an optimised production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint checks |

---

## API Reference

All API routes are Next.js Route Handlers located under `app/api/`.

### `POST /api/analyze-image`

Analyses an uploaded image with Claude AI and stores the result.

**Request** – `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | ✅ | JPEG, PNG, WebP, or GIF image |
| `latitude` | string | ✅ | Decimal latitude of the waste site |
| `longitude` | string | ✅ | Decimal longitude of the waste site |

**Response** – `200 OK`

```jsonc
{
  "trash": {
    "glassPercentage": 10,
    "plasticPercentage": 45,
    "paperPercentage": 20,
    "organicPercentage": 5,
    "metalPercentage": 10,
    "otherPercentage": 5,
    "eWastePercentage": 2,
    "hazardousPercentage": 1,
    "specialTreatmentPercentage": 2,
    "description": "Mixed urban waste site with predominantly plastic bottles.",
    "suggestedCleanup": "Use gloves and bags; sort plastics for recycling."
  },
  "id": "uuid-of-created-record"  // present when lat/lng provided
}
```

**Error responses**: `400 Bad Request` (missing fields), `500 Internal Server Error`.

---

### `GET /api/trash`

Returns all stored trash records ordered by most recent first.

**Response** – `200 OK`

```jsonc
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-03-15T10:30:00.000Z",
    "latitude": 14.6349,
    "longitude": -90.5069,
    "glassPercentage": 10,
    "plasticPercentage": 45,
    // … other waste percentages
    "description": "...",
    "suggestedCleanup": "...",
    "imageUrl": "https://res.cloudinary.com/...",
    "source": "claude"
  }
]
```

---

### `GET /api/heatmap`

Returns aggregated heatmap data grouped by geohash cell.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `precision` | number | `5` | Geohash precision (1–9). Higher = smaller cells, more buckets. |

**Response** – `200 OK`

```jsonc
[
  {
    "geohash": "d4e8u",
    "latitude": 14.6350,
    "longitude": -90.5070,
    "count": 12,
    "totalGlass": 120,
    "totalPlastic": 540,
    "totalPaper": 240,
    "totalOrganic": 60,
    "totalMetal": 120,
    "totalOther": 60,
    "totalEWaste": 24,
    "totalHazardous": 12,
    "totalSpecialTreatment": 24
  }
]
```

---

### `GET /api/health`

Simple health check.

**Response** – `200 OK`

```json
{ "status": "ok" }
```

---

### `GET /api/routes/optimized`

*(Stub – not yet implemented)* Planned endpoint for optimised waste collection routes.

---

## Database Schema

The application uses a single table `trash_records` in a Turso (libSQL/SQLite) database.

```sql
CREATE TABLE IF NOT EXISTS trash_records (
  id                          TEXT    PRIMARY KEY,         -- UUID
  created_at                  TEXT    NOT NULL,            -- ISO 8601 timestamp
  latitude                    REAL    NOT NULL,
  longitude                   REAL    NOT NULL,
  glass_percentage            REAL    NOT NULL DEFAULT 0,
  plastic_percentage          REAL    NOT NULL DEFAULT 0,
  paper_percentage            REAL    NOT NULL DEFAULT 0,
  organic_percentage          REAL    NOT NULL DEFAULT 0,
  metal_percentage            REAL    NOT NULL DEFAULT 0,
  other_percentage            REAL    NOT NULL DEFAULT 0,
  e_waste_percentage          REAL    NOT NULL DEFAULT 0,
  hazardous_percentage        REAL    NOT NULL DEFAULT 0,
  special_treatment_percentage REAL   NOT NULL DEFAULT 0,
  description                 TEXT,
  suggested_cleanup           TEXT,
  image_url                   TEXT,
  source                      TEXT    DEFAULT 'claude'
);
```

The table is created automatically on the first write if it does not already exist.

---

## Waste Categories

Claude AI classifies each image into nine waste categories. The percentages always sum to 100.

| Category | Property | Colour | Notes |
|---|---|---|---|
| 🫙 Glass | `glassPercentage` | `#38bdf8` Sky blue | Bottles, jars, broken glass |
| 🧴 Plastic | `plasticPercentage` | `#f97316` Orange | Bottles, bags, packaging |
| 📄 Paper | `paperPercentage` | `#eab308` Yellow | Cardboard, newspaper, packaging |
| 🌿 Organic | `organicPercentage` | `#22c55e` Green | Food waste, yard waste |
| 🔩 Metal | `metalPercentage` | `#94a3b8` Slate | Cans, scrap metal |
| ❓ Other | `otherPercentage` | `#a855f7` Purple | Mixed or unclassified waste |
| 💻 E-Waste | `eWastePercentage` | `#6366f1` Indigo | Electronics, batteries |
| ☣️ Hazardous | `hazardousPercentage` | `#ef4444` Red | Chemicals, paint, medical waste |
| ⚗️ Special Treatment | `specialTreatmentPercentage` | `#8b5cf6` Violet | Requires specialised disposal |

Map markers are colour-coded by the **dominant** waste type (the highest percentage category).

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Next.js API Routes instead of a separate Express backend** | Simplifies deployment to Vercel; one repo, one deploy. |
| **Turso (libSQL) instead of PostgreSQL + Prisma** | Zero-ops SQLite for MVP; easily upgradeable to full SQL. |
| **OpenRouter instead of direct Anthropic API** | Provider-agnostic; easy to swap models without code changes. |
| **Dynamic import for MapLibre (`ssr: false`)** | MapLibre requires browser APIs; dynamic import prevents SSR errors. |
| **Server Components by default** | Better performance; `"use client"` added only when necessary. |
| **ngeohash for heatmap aggregation** | Efficient spatial grouping without a PostGIS extension. |
| **Cloudinary optional** | Gracefully skipped when credentials are absent so the app works without image hosting. |
| **Tailwind v4 via PostCSS** | No `tailwind.config.js` needed; theme tokens live in `globals.css`. |

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project on [vercel.com](https://vercel.com/).
3. Add all required environment variables in the Vercel project settings (see [Environment Variables](#environment-variables)).
4. Deploy – Vercel auto-detects Next.js and builds accordingly.

### Other Platforms

```bash
# Build
npm run build

# Start (requires Node.js 20+)
npm start
```

Set the environment variables on your platform and ensure port `3000` (or your chosen port) is exposed.

---

## Roadmap

- [ ] **Time-series predictions** – Model waste accumulation over time per location.
- [ ] **Route optimization** – Compute optimal collection routes from stored records.
- [ ] **YOLO detector** – Add a YOLO-based visual detector as an alternative to Claude for real-time analysis.
- [ ] **Authentication** – API key or JWT authentication for the dashboard.
- [ ] **Aggregated geo tiles** – Server-side tile aggregation for large datasets.
- [ ] **Export** – CSV / GeoJSON export of trash records.
- [ ] **Mobile upload** – PWA or native mobile app integration.

---

## License

This project is private. All rights reserved.
