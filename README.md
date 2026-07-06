# Ahimsa Wellness — Frontend

Patient & staff web app for **Ahimsa Wellness Centre** (React · Vite · Firebase Auth).

## Local development

```bash
npm install
npm run dev    # http://localhost:5173
```

Runs with Vite proxy to `http://localhost:4000` for `/v1` API calls. Start the backend separately.

## Deploy on Vercel

1. Import this repo in [Vercel](https://vercel.com).
2. Framework preset: **Vite** (auto-detected).
3. Set environment variable:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://your-app.up.railway.app` |

4. Add your Vercel domain to Firebase **Authorized domains**.
5. Set the backend `CLIENT_ORIGIN` to your Vercel URL (comma-separate multiple domains if needed).

Build command: `npm run build` · Output: `dist`

## Firebase

Project: `ahimsa-wellness`. Enable Google + Phone sign-in. For admin testing, add phone `+91 1234567890` with OTP `191001`.
