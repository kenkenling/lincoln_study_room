# Lincoln Game Hub

This repository now hosts multiple browser games:

- `games/jungle-dash/` - 3D parkour platformer built with Three.js
- `games/math-explosion/` - fast 60-second math challenge
- `games/geometry-dashj/` - faster auto-run obstacle dash

Main hub page:
- `index.html`

## URLs (GitHub Pages)
- `https://kenkenling.github.io/lincoln_study_room/`
- `https://kenkenling.github.io/lincoln_study_room/games/jungle-dash/`
- `https://kenkenling.github.io/lincoln_study_room/games/math-explosion/`
- `https://kenkenling.github.io/lincoln_study_room/games/geometry-dashj/`

## Jungle Dash

`Lincoln's Jungle Dash` is a browser-based 3D platformer built with Three.js.

## Game Summary
- 10 progressively harder parkour levels
- Collect the banana and defeat at least one bird to clear each level
- Alligators and birds are active enemies (you can stomp them for points)
- Checkpoints save progress within each level
- Touch controls are available on mobile
- Three.js loads from `games/jungle-dash/three.min.js` when present, with a CDN fallback

## Controls
- Move: `A/D` or `Left/Right`
- Jump / Double Jump: `W`, `Up`, or `Space`
- Restart level: `R`
- Mobile: on-screen left, right, and jump buttons

## Scoring
- Stomp bird: `+100`
- Stomp alligator: `+50`

## Run
Run a local server from the project root:

```bash
cd /Users/lincoln/Documents/lincoln_workspace/codex_lincoln_workspace
python3 -m http.server 8000
```

Then visit:
- `http://localhost:8000/`
- `http://localhost:8000/games/jungle-dash/`
- `http://localhost:8000/games/math-explosion/`
- `http://localhost:8000/games/geometry-dashj/`

## Hub Availability

- Jungle Dash: available from the hub
- Math Explosion: available from the hub
- Geometry DashJ: available from the hub with no unlock requirement
