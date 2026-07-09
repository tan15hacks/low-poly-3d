# Lantern Run - Low Poly 3D Prototype

A simple browser-based low-poly 3D survival game built with **Vite** and **Three.js**.

You are lost in a dark forest. Your lantern is your timer, health, and only defense. Collect fireflies to recharge it, avoid the shadow creature, and reach the shrine.

## Current prototype features

- Low-poly procedural forest scene
- First-person camera movement
- Android/tablet touch controls
- Keyboard and mouse controls
- Lantern fuel system
- Firefly pickups
- Shadow enemy that hunts the player
- Lantern blast ability
- Shrine win condition
- Start, game over, and win screens
- No external art assets needed yet

## Controls

### Android / tablet

- Use the left joystick to move.
- Drag on the right side of the screen to look around.
- Tap **Blast** to push the shadow enemy away.

### Keyboard / desktop

- **WASD** or **arrow keys** to move
- Mouse to look around
- **Space** to use lantern blast

## How to run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## How to deploy on Vercel

1. Go to Vercel.
2. Import this GitHub repository: `tan15hacks/low-poly-3d`.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

After that, every push to `main` can automatically update the live web version.

## Game loop

1. Start in the forest with 100% lantern fuel.
2. Fuel slowly drains over time.
3. Collect fireflies to restore fuel.
4. The shadow enemy chases you when close.
5. Use lantern blast to push the enemy away, but it costs fuel.
6. Collect enough fireflies and reach the shrine to win.
7. If fuel reaches 0 or the enemy catches you, you lose.

## Recommended next upgrades

### Version 0.2

- Add better terrain height variation
- Add collision with trees and rocks
- Add sound effects
- Add footstep sounds
- Add enemy warning audio
- Add main menu polish
- Add difficulty modes

### Version 0.3

- Add multiple shrine levels
- Add different enemy types
- Add stamina/sprint
- Add minimap or compass
- Add collectible upgrades
- Add pause menu

### Version 0.4

- Add low-poly custom models made in Blender or generated later
- Add WebGL performance settings for mobile
- Add saveable high score / fastest escape time
- Add story intro text

## Tech stack

- Vite
- Three.js
- Vanilla JavaScript
- CSS

## Project direction

This repo is intentionally lightweight so it can be built and tested from a cloud IDE or browser workflow while using an Android tablet.
