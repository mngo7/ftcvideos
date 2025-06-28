// render_video.js
// This module provides a function to render a YouTube video with a custom progress bar, play/pause button, and timestamp.
// Usage: renderYouTubeVideo(container, { videoId, startTime, endTime, title })

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
