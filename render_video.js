// render_video.js
// This module provides a function to render a YouTube video with a custom progress bar, play/pause button, and timestamp.
// Usage: renderYouTubeVideo(container, { videoId, startTime, endTime, title })

// Robot GIFs of a season, by team. Pages with a season dropdown follow it.
const robotsBySeason = {};

function loadRobots() {
    const season = $('#seasonSelect').val() || '';
    if (!robotsBySeason[season]) {
        robotsBySeason[season] = $.getJSON(`/robots?season=${encodeURIComponent(season)}`).then(robots => {
            const byTeam = {};
            robots.forEach(robot => { byTeam[robot.team] = robot; });
            return byTeam;
        });
    }
    return robotsBySeason[season];
}

function robotLink(robot, className) {
    const link = $('<a></a>').addClass(className).attr('href', `index.html?search=${robot.team}`);
    const image = $('<img>').attr({src: `/robot/${robot.season}/${robot.team}.gif?v=${robot.version}`, alt: `Robot of team ${robot.team}`, loading: 'lazy'});
    return link.append(image, $('<span></span>').text(robot.team));
}

// Shows the robots of a match below its video, teams are listed red alliance first
function renderMatchRobots(listItem, title) {
    const listed = (title || '').match(/(?:Red:|Teams:)(.*)$/);
    if (!listed) {
        return;
    }
    const teams = (listed[1].match(/\b\d{1,5}\b/g) || []).slice(0, 4);
    loadRobots().then(robots => {
        const row = $('<div></div>').css({display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0 0 0'});
        teams.forEach((team, i) => {
            if (robots[team]) {
                row.append(robotLink(robots[team], 'match-robot').css({
                    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '96px', fontSize: '0.8em',
                    textDecoration: 'none', color: 'inherit', borderBottom: `3px solid ${i < 2 ? '#e74c3c' : '#3498db'}`,
                }));
            }
        });
        row.find('img').css({width: '96px', height: '96px'});
        if (row.children().length) {
            listItem.append(row);
        }
    });
}

// Shows a team's robot above its search results
function renderTeamRobot(container, team) {
    loadRobots().then(robots => {
        if (robots[team]) {
            const item = $('<li></li>').addClass('video-item').css({textAlign: 'center'});
            item.append(robotLink(robots[team], 'team-robot').css({display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold', textDecoration: 'none', color: 'inherit'}));
            item.find('img').css({width: '200px', height: '200px', maxWidth: '100%'});
            $(container).prepend(item);
        }
    });
}

// A match is 2:30 plus the lead before it, a clip longer than this is a split error and is cut
const MIN_SEGMENT = 170;
const MAX_SEGMENT = 300;

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

let playerCount = 0;

function renderYouTubeVideo(container, videoData, idx = 0) {
    const { videoId, title } = videoData;
    const segStart = Math.floor(videoData.startTime || 0);
    const clipLength = (videoData.endTime || 0) - segStart;
    const segmentLength = Math.min(Math.max(clipLength, MIN_SEGMENT), MAX_SEGMENT);
    const segEnd = segStart + segmentLength;

    // A new id each time, so that a re-rendered list never reuses the id of a removed player
    const playerDivId = `yt-player-${idx}-${playerCount++}`;
    const listItem = $('<li></li>').addClass('video-item');
    const titleDiv = $('<div></div>').addClass('video-title').text(title || '');
    const playerDiv = $('<div></div>').attr('id', playerDivId).css({width: '800px', maxWidth: '100%'});
    const controls = $('<div></div>').css({display: 'flex', alignItems: 'center', width: '800px', maxWidth: '100%', margin: '10px 0 0 0'});
    const playPauseBtn = $('<button></button>').text('Play').css({marginRight: '16px'}).prop('disabled', true);
    const progressBar = $('<input type="range" min="0" step="1" value="0">').attr('max', segmentLength).css({flex: 1, margin: '0 16px'});
    const timeDisplay = $('<div></div>').css({minWidth: '80px', textAlign: 'center', fontSize: '0.9em'});
    controls.append(playPauseBtn, progressBar, timeDisplay);
    listItem.append(titleDiv, playerDiv, controls);
    $(container).append(listItem);
    renderMatchRobots(listItem, title);

    let player = null;
    let wantsPlay = false;  // the user pressed Play and has not paused, also true while buffering
    let dragging = false;
    let interval = null;

    function showTime(segCurrent) {
        progressBar.val(segCurrent);
        timeDisplay.text(`${formatTime(segCurrent)} / ${formatTime(segmentLength)}`);
    }
    showTime(0);

    function setPlaying(playing) {
        wantsPlay = playing;
        playPauseBtn.text(playing ? 'Pause' : 'Play');
    }

    function update() {
        // The list was re-rendered and this player is gone
        if (!document.body.contains(listItem[0])) {
            clearInterval(interval);
            player.destroy();
            return;
        }
        const current = player.getCurrentTime();
        if (wantsPlay && current >= segEnd) {
            player.pauseVideo();
            setPlaying(false);
        }
        if (!dragging) {
            showTime(Math.max(0, Math.min(current - segStart, segmentLength)));
        }
    }

    player = new YT.Player(playerDivId, {
        height: '450',
        width: '800',
        videoId: videoId,
        playerVars: {
            autoplay: 0,
            start: segStart,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            playsinline: 1
        },
        events: {
            'onReady': function() {
                playPauseBtn.prop('disabled', false);
                interval = setInterval(update, 250);
            },
            'onStateChange': function(e) {
                if (e.data === YT.PlayerState.PLAYING) {
                    setPlaying(true);
                } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                    setPlaying(false);
                }
                // Buffering and cued keep the button as it is, so that it does not flicker on a seek
            }
        }
    });

    playPauseBtn.on('click', function() {
        if (wantsPlay) {
            player.pauseVideo();
            setPlaying(false);
            return;
        }
        const current = player.getCurrentTime();
        // Play at the end of the match, or outside of it, starts the match again
        if (current >= segEnd - 1 || current < segStart) {
            player.seekTo(segStart, true);
        }
        player.playVideo();
        setPlaying(true);
    });

    // While dragging only the time is shown, the video seeks once on release
    progressBar.on('input', function() {
        dragging = true;
        timeDisplay.text(`${formatTime(parseFloat(this.value))} / ${formatTime(segmentLength)}`);
    });
    progressBar.on('change', function() {
        dragging = false;
        if (player && player.seekTo) {
            player.seekTo(segStart + parseFloat(this.value), true);
        }
    });
}
