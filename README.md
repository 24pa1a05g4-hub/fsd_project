# Splitly – Friend Expense Split Tracker

A polished full-stack app for tracking shared expenses among friends. It includes a modern dashboard, quick balance summaries, an expense form, and a backend API ready to deploy.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Styling: custom responsive CSS
- Deployment target: Render / Railway / any Node host

## Features

- Add friends to a group
- Record expenses with payer and split participants
- Overview of total spend and per-person average
- Real-time balance analysis for who owes or should receive money
- Clean dashboard UI optimized for desktop and mobile

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app in development mode:
   ```bash
   npm run dev
   ```

3. Open the frontend at:
   ```text
   http://localhost:5173
   ```

4. Backend API is available at:
   ```text
   http://localhost:3001/api
   ```

## Production build

```bash
npm run build
npm run start
```

The Express server serves the Vite production build from the `dist` folder.

## Deployment on Render

1. Push this project to GitHub.
2. Create a new Web Service on Render.
3. Set the build command:
   ```bash
   npm install && npm run build
   ```
4. Set the start command:
   ```bash
   npm run start
   ```
5. Render will serve the app using the production backend.

## Project structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── server/
│   └── index.js
├── dist/               # generated after build
├── Dockerfile
├── render.yaml
├── .env.example
└── README.md
```
