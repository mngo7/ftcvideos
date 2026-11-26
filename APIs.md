# Public API Reference

## API v1, for other FTC sites

Read only. Every site may call it from a browser (`Access-Control-Allow-Origin: *`); answers are
cached for 10 minutes. Seasons are the year the season starts (`2025` is 2025-26), the same as
FIRST's API. A match has at most one video.

### Looking up a match

A match is named the way FIRST names it:

- `season` - e.g. `2025`, default the current season
- `event` - FIRST event code, e.g. `USWASAM1`
- `level` - `qual`, `playoff` or `practice` (FIRST's `QUALIFICATION`, `PLAYOFF`, and FTCScout's
  `Quals`, `DoubleElim` work too)
- `series` - playoffs only: the bracket match, e.g. `3` for "Upper Bracket Round 2 Match 3"
- `number` - the match number; in a playoff the game in the series, `1` unless it was replayed.
  `level=playoff&number=3` without `series` means bracket match 3.

Or, for a match without FIRST results such as a scrimmage, by its teams:

- `teams` - the 4 team numbers, e.g. `16655,23398,27393,21229`
- `red` (optional) - the 2 red teams, when the same 4 teams played on other sides too

### GET /api/v1/match
One match, `null` when there is no video of it.

    curl 'https://ftcvideos.org/api/v1/match?season=2025&event=USWASAM1&level=qual&number=2'

    {
      "season": "2025", "event": "USWASAM1", "eventName": "Salk League Meet 1",
      "level": "QUALIFICATION", "series": 0, "number": 2, "description": "Qualification 2",
      "red": ["16655", "23398"], "blue": ["21229", "27393"], "actualStartTime": "2025-11-01T11:47:37.452",
      "video": {"youtubeId": "CdzKeENztQs", "start": 1187, "end": 1368, "source": "ftcvideos",
                "url": "https://youtu.be/CdzKeENztQs?t=1187", "title": "WA Salk League Meet 1 - Decode"},
      "embedUrl": "https://ftcvideos.org/embed/match.html?season=2025&event=USWASAM1&level=qualification&series=0&number=2",
      "pageUrl": "https://ftcvideos.org/index.html?search=16655%2C+23398%2C+21229%2C+27393&season=2025"
    }

`video.source` is `first` for FIRST's own video of the match, which is the whole YouTube video
(`end` is `null`), else `ftcvideos` for a match cut out of an event's livestream.

### GET /api/v1/event?season=&event=
The matches of an event that have a video, in the order they were played: `{"season", "event", "matches": [...]}`.

### GET /api/v1/team?season=&team=
The matches of a team that have a video, its robot GIF and its Behind the Bot videos:
`{"season", "team", "robot", "behindTheBot": [...], "matches": [...]}`.

### GET /api/v1/video?season=&id=
The matches in a YouTube video, by their time in it: `{"season", "youtubeId", "matches": [...]}`.

### GET /api/v1/robot?season=&team=
The robot GIF of a team, `null` when there is none:

    {"team": "10084", "season": "2025", "gif": "https://ftcvideos.org/robot/2025/10084.gif?v=1794571380",
     "pageUrl": "https://ftcvideos.org/index.html?search=10084&season=2025"}

Show it as a link to its page: `<a href="{pageUrl}"><img src="{gif}" alt="Robot of team 10084"></a>`.

### GET /api/v1/behindthebot?team=&season=
The Behind the Bot videos of the [FUN Robotics Network](https://www.youtube.com/@FUNRoboticsNetwork), in
which a team shows its robot up close. All of them by default, else the ones of `team` and `season`.
Please credit FUN when you show them; `credit` says how.

    {"credit": {"name": "FUN Robotics Network", "url": "https://www.youtube.com/@FUNRoboticsNetwork",
                "series": "Behind the Bot", "site": "https://funroboticsnetwork.com"},
     "videos": [{"id": "277rmvv6BQg", "title": "10084 Team Calamari | Behind the Bot | FTC DECODE Robot",
                 "team": 10084, "teamName": "Team Calamari", "season": 2025, "game": "decode",
                 "duration": 879, "uploadDate": "20260514", "url": "https://www.youtube.com/watch?v=277rmvv6BQg",
                 "thumbnail": "https://i.ytimg.com/vi/277rmvv6BQg/hqdefault.jpg",
                 "robot": {"animation": ".../robot.webp", "poster": ".../robot.jpg", "orbit": ".../orbit.mp4",
                           "splat": ".../robot.splat", "view": ".../robot.json"}}]}

`robot` is what FTCVideos made of the video (`null` until it is made, see `docs/behind-the-bot.md`): an
animated WebP of the robot turning, a still, the same as an MP4, and a 3D Gaussian splat in the `.splat`
format with the view to start it from. The page `/behind-the-bot` shows them all.

### /embed/match.html
The video of one match in the FTCVideos player, for an iframe. Takes the match parameters above, and
shows "No video of this match yet" when there is none. The player fills the iframe; its controls and
a link to FTCVideos take 36 px below the video.

    <iframe src="https://ftcvideos.org/embed/match.html?season=2025&event=USWASAM1&level=qual&number=2"
            style="width:100%;aspect-ratio:16/10;border:0" allow="autoplay; encrypted-media"></iframe>

A site with a Content Security Policy needs `frame-src https://ftcvideos.org`.

### /watch
Redirects to the video of a match on YouTube, at its start. Takes the match parameters above, for
sites that only link: `https://ftcvideos.org/watch?season=2025&event=USWASAM1&level=qual&number=2`

---


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
Embeds the videos of all matches of some teams in your website. To show one match, use
`/embed/match.html` below.

Query parameters
- `search` (required) - comma-separated team numbers (e.g. `21229,4054,6427,7732`), or a YouTube video id.
- `season` (optional) - the season (e.g. `2025`).

Example

  https://ftcvideos.org/frame.html?search=21229%2C%204054%2C%206427%2C%207732&season=2025
