# Lincoln Game Hub

This repository now hosts multiple browser games:

- `games/jungle-dash/` - 3D parkour platformer built with Three.js
- `games/math-explosion/` - fast 60-second math challenge
- `games/geometry-dashj/` - auto-run obstacle dash (unlocked after Jungle Dash)

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
- 7 progressively harder parkour levels
- Collect the banana and defeat at least one bird to clear each level
- Alligators and birds are active enemies (you can stomp them for points)
- Checkpoints save progress within each level
- Beating Jungle Dash unlocks Geometry DashJ

## Controls
- Move: `A/D` or `Left/Right`
- Jump / Double Jump: `W`, `Up`, or `Space`
- Restart level: `R`

## Scoring
- Stomp bird: `+100`
- Stomp alligator: `+50`

## Run
Open `games/jungle-dash/index.html` in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit:
- `http://localhost:8000/`
- `http://localhost:8000/games/jungle-dash/`
- `http://localhost:8000/games/math-explosion/`
- `http://localhost:8000/games/geometry-dashj/`
