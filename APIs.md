# Public API Reference

## GET /list
Returns a list of FTC matches organized by events

Query parameters
- `season` - filters result based on `season_year`

Examples

- List all tasks (no season filter):
  curl 'https://ftcvideos.org/list'

- List only 2025 tasks:
  curl 'https://ftcvideos.org/list?season=2025'

---

## GET /matches
Returns the matches published per-event for a given season as pulled FTC events API.

Query parameters
- `season` (optional, default `2025`) - the season year
- `event` (optional) - an event code
- `region` (optional) - a region code

Examples
- Get all matches for season 2025:
  curl 'https://ftcvideos.org/matches?season=2025'

- Get matches for a specific event in 2024:
  curl 'https://ftcvideos.org/matches?season=2024&event=ROCMP'

---

## GET /add-video
Enqueue a YouTube video ID for downloading/processing by the background worker.

Query parameters
- `id` (required) - a YouTube video id (11-character string matching `[A-Za-z0-9_-]{11}`).

Response
- JSON: `{ "queued": true }` when the provided id matches the expected pattern and was enqueued; otherwise `{ "queued": false }`.

---

## GET /check-match
Checks whether a match with the specified teams exists

Query parameters
- `teams` (required) - comma-separated team ids (e.g. `7247,25674,22250,11260`).
- `season_year` (required) - the season to check (e.g. `2024` or `2025`). For matches that have an empty or missing `season_year`, the server treats them as `2024`.

Response shape
- JSON: `{ "status": "ok" }` if a match with exactly those teams (order-insensitive) is found for the given season; otherwise `{ "status": "not found" }`.

Example

  curl 'https://ftcvideos.org/check-match?teams=7247,25674,22250,11260&season_year=2025'


## /frame.html
Embeds an FTC match game video in your website.

Query parameters
- `teams` (required) - comma-separated team ids (e.g. `7247,25674,22250,11260`).
- `season_year` (required) - the season to check (e.g. `2024` or `2025`).

Example

  https://ftcvideos.org/frame.html?search=21229%2C%204054%2C%206427%2C%207732&season=2025
