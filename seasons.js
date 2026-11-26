// FTC seasons on the pages of FTCVideos. A season starts in September and is named by the year it
// starts: 2026 is 2026-27, as task.season_of() of the server. Pages show the current season by default;
// "All seasons" is the value '' in a select and season=all in the URL, so that a reload keeps it.
const Seasons = {
    START_MONTH: 9,

    current() {
        const now = new Date();
        return String(now.getMonth() + 1 >= Seasons.START_MONTH ? now.getFullYear() : now.getFullYear() - 1);
    },

    label(season) {
        const year = Number(season);
        return year ? `${year}-${String(year + 1).slice(2)}` : 'All seasons';
    },

    // Fills a <select> with the seasons from first to the current one, newest first, and "All seasons"
    // at the end when all is true. seasons: other seasons to list too, e.g. the ones that have data.
    fill(select, {first, all = false, seasons = [], label = Seasons.label} = {}) {
        const now = Number(Seasons.current());
        const years = new Set(seasons.map(Number).filter(Boolean));
        for (let year = first || now; year <= now; year++) years.add(year);
        const $select = $(select).empty();
        [...years].sort((a, b) => b - a).forEach(year => $select.append(new Option(label(year), String(year))));
        if (all) $select.append(new Option('All seasons', ''));
    },

    // The season of the URL: the current one when there is none, '' for all
    fromUrl(params = new URLSearchParams(window.location.search)) {
        if (!params.has('season')) return Seasons.current();
        const season = params.get('season');
        return season === 'all' ? '' : season;
    },

    // Selects the season of the URL; one the select does not list falls back to the current season
    select(select, params) {
        const season = Seasons.fromUrl(params);
        const $select = $(select);
        $select.val(season);
        if ($select.val() !== season) $select.val(Seasons.current());
        return $select.val();
    },

    // The URL parameter of a selected season
    param(season) {
        return season ? season : 'all';
    },

    // Keeps the season in the URL of the page without reloading it
    remember(season) {
        const params = new URLSearchParams(window.location.search);
        params.set('season', Seasons.param(season));
        history.replaceState(null, '', `${window.location.pathname}?${params}`);
    },
};
