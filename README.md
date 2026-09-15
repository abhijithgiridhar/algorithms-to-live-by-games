# Algorithms to Live By — Class Games

Short, playable browser games for an intro algorithmic-thinking unit, loosely paired with chapters of *Algorithms to Live By* by Brian Christian & Tom Griffiths. Pure HTML/CSS/JS, no build step — just open `index.html` or serve the folder.

Play it live: https://abhijithgiridhar.github.io/algorithms-to-live-by-games/

## Games

- **Design a Search** (`games/search-algorithms/`) — Introduction chapter. Click through a sorted list to find (or rule out) a target number in as few clicks as possible, then compare your approach to linear vs. binary search.
- More games are added throughout the unit (optimal stopping, explore/exploit, sorting, ...).

## Adding a new game

1. Create a new folder under `games/<name>/` with its own `index.html`.
2. Link `../../assets/style.css` for consistent styling.
3. Add a card for it on the root `index.html`.
4. Commit and push — GitHub Pages redeploys automatically.
