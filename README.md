# Project Atlas

MVP dashboard and landing page for AaryaRushi Automation Labs.

## Stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Supabase

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://127.0.0.1:5173
```

## Required Environment Variables

Project Atlas needs these frontend environment variables for the protected dashboard, uploads, DOCX storage, and History:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not expose a Supabase service role key in the frontend.

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this `Project_Atlas` folder to a GitHub repository.
2. Open Vercel and choose **Add New Project**.
3. Import the repository.
4. Set the framework preset to **Vite**.
5. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Add the required Supabase environment variables.
7. Deploy on the free plan.

The included `vercel.json` rewrites nested SPA routes to `index.html`, so dashboard routes can be refreshed directly.

After deployment, update the website placeholder and Open Graph URL in `index.html`.

## MVP Demo Limitations

- AR-CERT-PRO generates one DOCX at a time from the selected preview row.
- DOCX generation runs in the browser.
- Generated DOCX files can be stored privately and re-downloaded from History.
- PDF generation is not included yet.
- Batch generation is not included yet.
- Billing is not included yet.
- Teams/admin panel features are not included yet.

## Launch Checklist

Before a demo, run through `docs/MVP_LAUNCH_CHECKLIST.md`.
