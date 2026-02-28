# lidcode

A playground project to test some ideas. Nothing too serious here — just a place to experiment, break things, and figure stuff out.

## What's in here

This is a monorepo (Turborepo + npm workspaces) with a few apps:

- **shortlid-server** — A URL shortener API built with NestJS, Drizzle, and Redis
- **shortlid-web** — The frontend for the shortener, React + Vite + Tailwind
- **home-site** — A landing page with Next.js
- **gateway** — Nginx reverse proxy tying it all together

## Running it

```bash
npm install
npm run dev
```

That's it. Have fun.
