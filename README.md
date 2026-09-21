# Saurabh's Sprint

Saurabh's Sprint is a high-performance, 3D endless runner web game built with Three.js and modern Web standards. Designed as a Progressive Web Application (PWA), the game delivers an arcade-style experience with smooth rendering, responsive keyboard and touch controls, procedural audio, character customization, dynamic missions, and an in-game upgrade shop.

## Live Demo

Play the live game directly in your browser:
https://lucent-lollipop-71a903.netlify.app/

---

## Key Features

- **3D Graphics and Procedural World Generation**: Built with Three.js WebGL rendering, featuring continuous track generation, dynamic obstacles (subway trains, barriers, traffic lights, archways), coin arcs, and real-time shadows.
- **9 Playable Characters**: Diverse roster of 3D rigged characters (both male and female styles) with unique color palettes, outfits, accessories, and unlockable progression.
- **Power-Up System**:
  - **Coin Magnet**: Automatically attracts all nearby coins towards the player.
  - **2X Multiplier**: Doubles score accumulation rate during active duration.
  - **Hoverboard**: Grants crash immunity and distinct visual particle trail with double-tap or hotkey activation.
  - **Jetpack**: Launches the player into the sky for aerial coin trails, bypassing all ground obstacles.
- **Upgrade Shop**: Permanent upgrades for power-up durations and consumable hoverboard inventory using in-game collected coins.
- **Missions and Milestone Progression**: Multi-tiered objectives tracking distance, score thresholds, coin counts, stunts, and power-up usage with coin rewards.
- **Dual Control Architecture**: Fully optimized for both desktop (Keyboard: Arrow Keys / WASD, Spacebar) and mobile/tablet devices (Touch gestures: Swipe left, right, up, down, double tap).
- **Procedural Web Audio Engine**: Zero-dependency sound effects synthesized in real-time via the Web Audio API with fallback support.
- **Progressive Web App (PWA)**: Full offline capability with Service Worker caching and installability on Android, iOS, Windows, and macOS.
- **Persistent Local Storage**: Automatically saves high scores, coin balance, mission states, character unlocks, and power-up levels.

---

## Controls and Gameplay

### Desktop / Keyboard Controls

| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| Move Left | Left Arrow | A |
| Move Right | Right Arrow | D |
| Jump / Leap | Up Arrow | W |
| Slide / Duck | Down Arrow | S |
| Activate Hoverboard | Spacebar | H |
| Pause / Resume | Escape | P |

### Mobile / Touch Controls

| Action | Touch Gesture |
| :--- | :--- |
| Move Left / Right | Swipe Left / Right |
| Jump | Swipe Up |
| Slide | Swipe Down |
| Activate Hoverboard | Double Tap Screen |

---

## Playable Characters

| Character | Role / Style | Gender | Unlock Cost |
| :--- | :--- | :--- | :--- |
| Saurabh | Leader (Default) | Male | Free |
| Rishav | Striker | Male | 400 Coins |
| Jaishika | Superstar | Female | 500 Coins |
| Kashish | Phantom | Male | 600 Coins |
| Bhoomi | Emerald | Female | 700 Coins |
| Muskaan | Blossom | Female | 800 Coins |
| Nikhil | Cyber Ace | Male | 900 Coins |
| Vicky | Blaze | Male | 1000 Coins |
| Aditya | Champion | Male | 1200 Coins |

---

## Power-Ups and Upgrades

| Power-Up | Functionality | Upgrade Benefit |
| :--- | :--- | :--- |
| Coin Magnet | Pulls all lane coins to the player | Extends magnet duration per tier |
| 2X Multiplier | Multiplies score accumulation by 2 | Extends multiplier duration per tier |
| Jetpack | Flight mode through high-altitude coin lanes | Extends flight duration per tier |
| Hoverboard | Shield protection against crash impacts | Increases starting stock capacity |

---

## Technology Stack

- **Graphics & Rendering**: Three.js (WebGL)
- **Programming Language**: Vanilla JavaScript (ES6+ Modular Architecture)
- **Audio Engine**: Web Audio API (Synthesized Audio Nodes)
- **UI & Styling**: HTML5, Modern CSS3 (Glassmorphism, Flexbox, CSS Grid)
- **PWA Capabilities**: Service Worker API, Web App Manifest
- **Build Tooling & Dev Server**: Vite / Node.js
- **Deployment Targets**: Netlify, Vercel, GitHub Pages, or any static hosting service

---

## Project Structure

```text
├── assets/
│   └── icons/              # PWA icons and favicons
├── css/
│   └── style.css           # Glassmorphism UI stylesheet and HUD styling
├── js/
│   ├── audio.js            # Web Audio API synthesizer and sound controller
│   ├── collectibles.js     # Coins and power-up spawn logic and physics
│   ├── input.js            # Keyboard, touch swipe, and pointer event handler
│   ├── main.js             # Core game loop, scene setup, and state machine
│   ├── missions.js         # Dynamic quest and achievement system
│   ├── player.js           # 3D character mesh builder, animations, and physics
│   ├── storage.js          # LocalStorage persistence manager
│   ├── ui.js               # HUD, menus, modals, and shop interface manager
│   └── world.js            # Procedural track, obstacles, and scenery manager
├── lib/
│   └── three.min.js        # Bundled Three.js library
├── index.html              # Main game entry point and UI overlay DOM
├── manifest.json           # Progressive Web App manifest
├── package.json            # Project dependencies and build scripts
├── server.js               # Optional local Node.js static server
├── sw.js                   # PWA Service Worker for caching and offline play
└── vercel.json             # Vercel deployment configuration
```

---

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher recommended)
- npm or npx

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "Saurabh's Sprint"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the local URL displayed in the terminal (typically `http://localhost:5173`) in your web browser.

### Standalone Local Execution

Alternatively, you can run the project without Node.js tooling by launching any local static HTTP server or running:
```bash
node server.js
```
Then visit `http://localhost:3000`.

---

## Production Build and Deployment

### Building the Project

To generate an optimized production bundle:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

### Deploying to Netlify / Vercel

The project is fully static and ready for instant deployment:
- **Netlify**: Link the repository and set the publish directory to `.` or `dist` (if using build scripts).
- **Vercel**: Pre-configured via `vercel.json`.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

Developed by **Saurabh**.
