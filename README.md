# Dhyan — Focus & Discipline App

A full-featured PWA built with **React + Tailwind CSS + GSAP + React Icons**.  
Works completely **offline** using IndexedDB for data storage.

---

## Tech Stack

| Tech | Purpose |
|------|---------|
| React 18 | UI framework |
| Tailwind CSS v3 | Styling |
| GSAP 3 | Animations (stagger, counter, arc, page transitions) |
| React Icons | All icons (react-icons/fi, hi, bs) |
| Recharts | Line + Bar charts in Dashboard |
| idb | IndexedDB helper (clean async/await) |
| Vite | Build tool |
| vite-plugin-pwa | PWA manifest + service worker auto-generation |

---

## Features

1. ✅ **Daily Habit Tracker** — streak, completion %, miss reason
2. ✅ **Task Management** — priority, status, deadline, filter
3. ✅ **Focus Timer** — 15/30/45/60 min + Pomodoro (25+5)
4. ✅ **Progress Dashboard** — line chart, habit bars, heatmap
5. ✅ **Goals System** — milestones with progress %
6. ✅ **Notes** — tag support (#ideas #mistakes #wins)
7. ✅ **Discipline Score** — /100 based on habits + tasks + focus
8. ✅ **Gamification** — 9 achievements with unlock system
9. ✅ **Weekly Review** — best/worst day, suggestions
10. ✅ **Offline PWA** — IndexedDB + service worker

---

## Project Structure

```
dhyan-app/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root component + routing
    ├── index.css             # Tailwind + custom classes
    ├── store/
    │   └── AppContext.jsx    # Global state (Context + useReducer)
    ├── hooks/
    │   ├── useGsap.js        # GSAP animation hooks
    │   ├── useTimer.js       # Focus timer logic
    │   └── useToast.js       # Toast notifications
    ├── utils/
    │   ├── db.js             # IndexedDB helpers (idb)
    │   ├── score.js          # Discipline score calculation
    │   └── date.js           # Date utilities
    ├── components/
    │   ├── TopNav.jsx        # Header with score pill
    │   ├── BottomNav.jsx     # Tab bar with GSAP indicator
    │   ├── FocusTimer.jsx    # Timer component
    │   └── ui/
    │       ├── Modal.jsx     # Bottom sheet modal
    │       ├── Toast.jsx     # Toast notification
    │       └── ScoreRing.jsx # Animated SVG score ring
    └── pages/
        ├── Home.jsx          # Habits + Score + Timer + Top3
        ├── Tasks.jsx         # Task list + filters
        ├── Dashboard.jsx     # Charts + achievements + review
        ├── Goals.jsx         # Goals + milestones
        └── Notes.jsx         # Notes + tags + reflection
```

---

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

---

## PWA Install

**Chrome/Edge (Desktop):**
- Open app → address bar → Install icon → Install

**Android (Chrome):**
- Open app → ⋮ menu → "Add to Home Screen"

**iPhone (Safari):**
- Open app → Share → "Add to Home Screen"

---

## Deploy (Free)

**Netlify:**
```bash
npm run build
# Drag & drop the 'dist' folder to netlify.com
```

**GitHub Pages:**
```bash
npm run build
# Push 'dist' folder contents to gh-pages branch
```

---

## Notes

- All data stored in **IndexedDB** — no internet needed after first load
- **GSAP** handles: page transitions, stagger lists, score ring arc, counter animations, nav indicator
- Score resets daily; habit streaks persist across days
- Add `public/icon-192.png` and `public/icon-512.png` for proper PWA icons
