# KGAT Frontend

## Run locally
```bash
npm install
npm run dev
```

## Connect to your backend (the ONE thing to configure)
Open `src/config.js`, set:
```js
export const API_BASE_URL = "https://your-backend-url-here";
```
Works with any backend that serves /summary, /records, /conflicts, /chat --
a Render deployment, a Colab tunnel URL, anything. Leave blank to run on
realistic sample data with no live connection.

## Deploy to Vercel
1. Push to GitHub
2. vercel.com -> New Project -> import repo
3. Deploy (Vite auto-detected, zero config needed)
