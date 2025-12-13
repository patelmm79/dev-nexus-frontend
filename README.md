# Dev Nexus — Pattern Discovery Frontend

Small React + Vite frontend for the Pattern Discovery Agent System.

## Requirements
- Node.js 18+ and npm
- (Optional) Vercel CLI for deployments

## Local development
Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build & preview production bundle
```bash
npm run build
npm run preview
```

This produces a `dist/` folder. `npm run preview` serves the production build locally on port 4173.

## Vercel deployment
The project includes a `vercel.json` rewrite so client-side routes are served from `index.html`.

To deploy from your machine:

```bash
npm i -g vercel   # if needed
vercel --prod
```

If you see a blank page in production, try a hard refresh (Ctrl+Shift+R) or open in Incognito to bypass caching and extensions.

## Important config notes
- `vite.config.ts` has `base: './'` set so built assets use relative paths. Do not remove this unless you understand the hosting subpath implications.

## Backend CORS (common production issue)
If the frontend is blocked by CORS when calling the backend (`/health`, etc.), either enable CORS on the backend or add a server-side proxy.

Quick Node/Express snippet (paste into your server entry):

```js
// install: npm install cors
import express from 'express';
import cors from 'cors';
const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://your-vercel-url.vercel.app';
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.options('*', cors({ origin: FRONTEND_ORIGIN }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```

Quick Flask snippet (paste into `app.py`):

```py
# install: pip install flask-cors
from flask import Flask, jsonify
from flask_cors import CORS
import os
app = Flask(__name__)
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'https://your-vercel-url.vercel.app')
CORS(app, origins=[FRONTEND_ORIGIN])
@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    return jsonify({'status': 'ok'})
```

After updating backend, redeploy it and verify with:

```bash
curl -i https://your-backend/health
```

Look for `Access-Control-Allow-Origin` header and HTTP 200.

## Troubleshooting
- Blank page after deploy: verify `dist/index.html` uses `./assets/...` (relative paths) and redeploy. Hard refresh after deploy.
- Console runtime errors about `.filter` or `.map`: those generally mean the backend returned unexpected shape (null/undefined). The frontend now guards these cases, but confirm backend responses match expected types.
- Browser extension errors: test in Incognito to rule out extension interference.

## Where to look in this repo
- Frontend entry: `src/main.tsx`
- Router/pages: `src/pages/`
- Hooks calling backend: `src/hooks/usePatterns.ts`
- API client: `src/services/a2aClient.ts`

---
If you want, I can also add a Vercel serverless proxy in `api/` to avoid backend CORS changes — tell me and I will add it.
