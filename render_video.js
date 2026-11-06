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

function renderYouTubeVideo(container, videoData, idx = 0) {
    let { videoId, startTime, endTime, title } = videoData;
    if (endTime && startTime) {
        endTime = Math.max(endTime, startTime + 170); // Ensure endTime is at least 160 seconds after startTime
    }
    const playerDivId = `yt-player-${idx}`;
    const progressId = `yt-progress-${idx}`;
    const timeId = `yt-time-${idx}`;
    const playPauseBtnId = `yt-playpause-${idx}`;
    const segmentLength =  endTime - startTime;

    const listItem = $('<li></li>').addClass('video-item');
    const titleDiv = $('<div></div>').addClass('video-title').text(title || '');
    const playerDiv = $(`<div></div>`).attr('id', playerDivId).css({width: '800px', maxWidth: '100%'});
    const progressBarWrapper = $(`<div style='display:flex;align-items:center;width:800px;max-width:100%;margin:10px 0 0 0;'></div>`);
    const playPauseBtn = $(`<button id='${playPauseBtnId}' style='margin-right:16px;'>Play</button>`);
    const progressBar = $(`<input type="range" min="0" max="${segmentLength}" value="0" id="${progressId}" style="flex:1; margin:0 16px;">`);
    const timeDisplay = $(`<div id="${timeId}" style="min-width:80px;text-align:center;font-size:0.9em;">0:00 / ${Math.floor(segmentLength/60)}:${(segmentLength%60).toString().padStart(2,'0')}</div>`);
    progressBarWrapper.append(playPauseBtn, progressBar, timeDisplay);
    listItem.append(titleDiv, playerDiv, progressBarWrapper);
    $(container).append(listItem);
    renderMatchRobots(listItem, title);

    let isPlaying = false;
    let playerInstance = null;
    const player = new YT.Player(playerDivId, {
        height: '450',
        width: '800',
        videoId: videoId,
        playerVars: {
            autoplay: 0,
            start: startTime || 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0
        },
        events: {
            'onReady': function(event) {
                playerInstance = event.target;
                $("#"+playPauseBtnId).on('click', function() {
                    if (isPlaying) {
                        playerInstance.pauseVideo();
                    } else {
                        playerInstance.playVideo();
                    }
                });
                event.target.addEventListener('onStateChange', function(e) {
                    if (e.data === YT.PlayerState.PLAYING) {
                        isPlaying = true;
                        $("#"+playPauseBtnId).text('Pause');
                    } else {
                        isPlaying = false;
                        $("#"+playPauseBtnId).text('Play');
                    }
                });
                let interval = setInterval(() => {
                    const current = event.target.getCurrentTime();
                    const segStart = startTime || 0;
                    let segEnd = segStart + segmentLength;
                    if (endTime !== undefined && !isNaN(endTime)) {
                        segEnd = endTime;
                    }
                    if (current < segStart) {
                        event.target.seekTo(segStart);
                    } else if (current > segEnd) {
                        event.target.pauseVideo();
                    }
                    const segCurrent = Math.max(0, Math.min(current - segStart, segmentLength));
                    $("#"+progressId).attr('max', segmentLength);
                    $("#"+progressId).val(segCurrent);
                    $("#"+timeId).text(`${Math.floor(segCurrent/60)}:${(Math.floor(segCurrent)%60).toString().padStart(2,'0')} / ${Math.floor(segmentLength/60)}:${(segmentLength%60).toString().padStart(2,'0')}`);
                }, 500);
                $(window).on('unload', () => clearInterval(interval));
            },
            'onStateChange': function(e) {
                if (e.data === YT.PlayerState.PLAYING) {
                    isPlaying = true;
                    $("#"+playPauseBtnId).text('Pause');
                } else {
                    isPlaying = false;
                    $("#"+playPauseBtnId).text('Play');
                }
            }
        }
    });
    $("#"+progressId).on('input', function(e) {
        const segStart = startTime || 0;
        const newTime = segStart + parseFloat(e.target.value);
        player.seekTo(newTime, true);
    });
}
