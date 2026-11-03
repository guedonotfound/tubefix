// Tubefix — runs in the page's MAIN world so it can use YouTube's player API.
// Selectors live at the top: when YouTube changes its layout, fix them here.

(() => {
  const SELECTORS = {
    player: '#movie_player',
    watchFlexy: 'ytd-watch-flexy',
    theaterButton: '.ytp-size-button',
    descriptionExpand: '#description-inline-expander #expand',
  };

  const POLL_MS = 250;
  const TIMEOUT_MS = 10000;
  const PLAYING = 1;

  // Theater mode: YouTube reads this cookie when it builds the watch page,
  // so setting it this early avoids the layout jumping on first load.
  document.cookie = 'wide=1; domain=.youtube.com; path=/; max-age=31536000';

  // ---------- helpers ----------

  function waitFor(check, timeout = TIMEOUT_MS) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        let result = null;
        try {
          result = check();
        } catch {
          // element or API not ready yet
        }
        if (result) return resolve(result);
        if (Date.now() - start > timeout) return resolve(null);
        setTimeout(tick, POLL_MS);
      };
      tick();
    });
  }

  function currentVideoId() {
    return location.pathname === '/watch'
      ? new URLSearchParams(location.search).get('v')
      : null;
  }

  function getPlayer() {
    const p = document.querySelector(SELECTORS.player);
    return p && typeof p.getAvailableQualityLevels === 'function' ? p : null;
  }

  function isAdPlaying(player) {
    return player.classList.contains('ad-showing');
  }

  // ---------- features ----------

  async function enableTheater() {
    const flexy = await waitFor(() => document.querySelector(SELECTORS.watchFlexy));
    if (!flexy || flexy.hasAttribute('theater') || flexy.hasAttribute('fullscreen')) return;

    const button = await waitFor(() => document.querySelector(SELECTORS.theaterButton));
    if (button && !flexy.hasAttribute('theater')) button.click();
  }

  async function expandDescription() {
    const button = await waitFor(() => {
      const b = document.querySelector(SELECTORS.descriptionExpand);
      return b && b.offsetParent !== null ? b : null; // only if visible
    });
    button?.click();
  }

  function setBestQuality(player) {
    if (isAdPlaying(player)) return false;

    const levels = player.getAvailableQualityLevels() ?? [];
    const best = levels.find((q) => q !== 'auto');
    if (!best) return false;

    if (player.getPlaybackQuality?.() !== best) {
      player.setPlaybackQualityRange?.(best, best);
      player.setPlaybackQuality?.(best);
    }
    return true;
  }

  function disableCaptions(player) {
    try {
      if (typeof player.isSubtitlesOn === 'function') {
        if (player.isSubtitlesOn()) player.toggleSubtitles();
      } else {
        player.unloadModule?.('captions');
      }
    } catch {
      // captions module not loaded; nothing to turn off
    }
  }

  // ---------- per-video flow ----------

  let handledVideoId = null;

  // YouTube's player fires state changes for every video (and ads).
  // Re-check quality whenever real content starts playing, which covers
  // the switch from a pre-roll ad to the actual video.
  function hookPlayer(player) {
    if (player.__tubefixHooked) return;
    player.__tubefixHooked = true;

    player.addEventListener('onStateChange', (state) => {
      if (state === PLAYING && currentVideoId()) setBestQuality(player);
    });
  }

  async function apply() {
    const id = currentVideoId();
    if (!id) {
      handledVideoId = null;
      return;
    }
    if (id === handledVideoId) return;
    handledVideoId = id;

    enableTheater();
    expandDescription();

    const player = await waitFor(getPlayer);
    if (!player) return;
    hookPlayer(player);

    // Wait until the player has actually switched to this video.
    await waitFor(() => player.getVideoData?.().video_id === id);

    await waitFor(() => setBestQuality(player));
    disableCaptions(player);

    // Auto-generated and auto-translated captions can switch on late.
    setTimeout(() => disableCaptions(player), 1500);
    setTimeout(() => disableCaptions(player), 4000);
  }

  // YouTube is a single-page app: this fires on every navigation,
  // including the first page load.
  document.addEventListener('yt-navigate-finish', apply);
  apply();
})();
