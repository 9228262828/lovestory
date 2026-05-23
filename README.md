# Romantic Interactive Website (Architecture Bootstrap)

Minimal production-ready foundation for a modular romantic website with:

- React + Vite + TypeScript
- TailwindCSS
- Framer Motion
- Supabase
- Hidden admin routing
- Dynamic section rendering architecture
- GitHub Pages deployment workflow

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and update values:

```bash
cp .env.example .env
```

3. Run development server:

```bash
npm run dev
```

## Environment variables

```env
VITE_APP_BASE_PATH=/
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## Current routes

- `/` - public home (dynamic sections)
- `/login` - admin auth entry
- `/admin` - protected dashboard placeholder

## Current section data model

```ts
{
  id: string
  title: string
  type: string
  enabled: boolean
  order_index: number
  content: JsonValue
  created_at: string
}
```

## GitHub Pages notes

Workflow file: `.github/workflows/deploy-pages.yml`

Set repository secrets before enabling deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
