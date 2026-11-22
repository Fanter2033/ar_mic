(function (window) {
  // How long a marker may disappear before its video is paused. AR tracking
  // flickers a lot (hand shake, reflections on the showcase glass); pausing
  // instantly makes the video stutter and restart its audio constantly.
  const MARKER_LOST_GRACE_MS = 700;

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  window.MarkerVideoController = {
    init: function () {
      const planes = document.querySelectorAll("a-plane");
      const overlay = document.getElementById("subtitle-overlay");
      let currentLanguage = "ITA";
      let subtitlesDatabase = {};
      let areSubtitlesEnabled = false;
      let audioEnabled = !(
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      );

      const planesInfos = Array.from(planes)
        .map((plane) => {
          const planeSrc = plane.getAttribute("src") || "";
          const base = planeSrc
            .replace(/^#/, "")
            .replace(/-video-(?:ita|eng)$/, "");
          return {
            marker: plane.closest("a-marker"),
            plane,
            base,
            videoITA: document.getElementById(base + "-video-ita"),
            videoENG: document.getElementById(base + "-video-eng"),
            visible: false,
            lostTimer: null,
          };
        })
        .filter((info) => info.marker && (info.videoITA || info.videoENG));

      const allContentVideos = Array.from(
        document.querySelectorAll(
          'video[id$="-video-ita"], video[id$="-video-eng"]',
        ),
      );

      // The marker whose video is currently shown
      let activeInfo = null;

      function videoFor(info) {
        return currentLanguage === "ITA"
          ? info.videoITA || info.videoENG
          : info.videoENG || info.videoITA;
      }

      function pauseAllVideos(except) {
        allContentVideos.forEach((v) => {
          if (v !== except && !v.paused) v.pause();
        });
      }

      function setPlaneSrc(info, video) {
        const src = "#" + video.id;
        // Avoid re-creating the video texture when nothing changed
        if (info.plane.getAttribute("src") !== src)
          info.plane.setAttribute("src", src);
      }

      // ── Buffering feedback ──
      function updateBuffering() {
        const v = activeInfo && videoFor(activeInfo);
        const buffering =
          !!v && activeInfo.visible && (v.readyState < 3 || v.seeking);
        emit("videoBuffering", { buffering });
      }
      allContentVideos.forEach((v) => {
        ["waiting", "playing", "canplay", "seeked", "pause"].forEach((ev) =>
          v.addEventListener(ev, updateBuffering),
        );
        v.addEventListener("playing", () => {
          emit("videoPlaying", { id: v.id, muted: v.muted });
        });
      });

      function play(video) {
        const p = video.play();
        if (!p || typeof p.then !== "function") return;
        p.catch((err) => {
          if (err && err.name === "NotAllowedError" && !video.muted) {
            // Autoplay with sound refused (no user gesture yet): play muted
            // instead of showing nothing, and let the UI offer "unmute".
            audioEnabled = false;
            allContentVideos.forEach((v) => (v.muted = true));
            emit("audioBlocked");
            if (activeInfo && videoFor(activeInfo) === video && activeInfo.visible)
              video.play().catch((e) => console.warn("Video play failed:", e));
          } else if (!err || err.name !== "AbortError") {
            console.warn("Video play failed:", err);
          }
        });
      }

      function show(info, syncFrom) {
        const video = videoFor(info);
        if (!video) return;
        activeInfo = info;
        pauseAllVideos(video);

        if (syncFrom && syncFrom !== video) {
          const target = syncFrom.currentTime;
          const seek = () => {
            try {
              video.currentTime = Math.min(
                isFinite(video.duration) ? video.duration : Infinity,
                target,
              );
            } catch (err) {
              console.warn("Could not sync video time:", err);
            }
          };
          // Seeking before metadata is known is ignored by some browsers
          if (video.readyState >= 1) seek();
          else video.addEventListener("loadedmetadata", seek, { once: true });
        }

        setPlaneSrc(info, video);
        video.muted = !audioEnabled;
        // play() starts the download by itself. Calling load() here (as
        // before) restarted any download in progress every time the marker
        // flickered, so slow connections could never finish buffering.
        if (video.paused) play(video);
        updateBuffering();
      }

      function emitVisibility() {
        emit("markerVisibility", {
          anyVisible: planesInfos.some((i) => i.visible),
        });
      }

      // Fetch subtitle database
      fetch("https://cdn.jsdelivr.net/gh/Fanter2033/ar_mic@main/public/media/subtitles/subtitles_db.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to load subtitles: " + response.statusText);
          }
          return response.json();
        })
        .then((data) => {
          subtitlesDatabase = data;
          updateSubtitle();
        })
        .catch((err) => {
          console.error("Errore caricamento sottotitoli:", err);
        });

      // Mute button listener
      window.addEventListener("muteBtnPressed", (e) => {
        audioEnabled = !!(e.detail && e.detail.isAudioEnabled);
        allContentVideos.forEach((v) => {
          v.muted = !audioEnabled;
          v.volume = 1.0;
        });
        // This runs inside the user's tap, so it is the moment browsers allow
        // sound: retry the visible video in case it had been blocked.
        if (activeInfo && activeInfo.visible) {
          const v = videoFor(activeInfo);
          if (v && v.paused) play(v);
        }
      });

      // Subtitle event listener
      window.addEventListener("subtitleToggle", (e) => {
        areSubtitlesEnabled = !!e.detail;
        updateSubtitle();
      });

      // Language change event listener
      window.addEventListener("languageChanged", (e) => {
        const newLang = e && e.detail && e.detail.language;
        if (!newLang) return;
        const previous = activeInfo && videoFor(activeInfo);
        currentLanguage = newLang;

        if (activeInfo && activeInfo.visible && previous) {
          show(activeInfo, previous);
        } else if (activeInfo) {
          // Not on screen: just point the plane at the new language
          const v = videoFor(activeInfo);
          if (v) setPlaneSrc(activeInfo, v);
        }
        updateSubtitle();
      });

      // MARKER DETECTION CYCLE
      planesInfos.forEach((info) => {
        info.marker.addEventListener("markerFound", () => {
          if (info.lostTimer) {
            // Came back within the grace period: keep playing seamlessly
            clearTimeout(info.lostTimer);
            info.lostTimer = null;
          }
          info.visible = true;
          emitVisibility();
          if (activeInfo !== info || videoFor(info).paused) show(info);
        });

        info.marker.addEventListener("markerLost", () => {
          if (info.lostTimer) clearTimeout(info.lostTimer);
          info.lostTimer = setTimeout(() => {
            info.lostTimer = null;
            info.visible = false;
            emitVisibility();
            if (info.videoITA) info.videoITA.pause();
            if (info.videoENG) info.videoENG.pause();

            // If another marker is still in view, resume it
            if (activeInfo === info) {
              const other = planesInfos.find((i) => i.visible);
              if (other) show(other);
              else updateBuffering();
            }
          }, MARKER_LOST_GRACE_MS);
        });
      });

      // Pause when the tab/app goes to background, resume when back
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          pauseAllVideos();
        } else if (activeInfo && activeInfo.visible) {
          show(activeInfo);
        }
      });

      // ── SUBTITLE SYNCHRONIZATION ENGINE ──
      // Driven by the video's own timeupdate events instead of a permanent
      // 200 ms timer, so nothing runs while subtitles are off or no video plays.
      let lastSubtitleText = "";

      function setSubtitle(text) {
        if (!overlay || text === lastSubtitleText) return;
        lastSubtitleText = text;
        overlay.textContent = text;
        overlay.style.display = text ? "block" : "none";
      }

      function updateSubtitle() {
        if (!areSubtitlesEnabled || !overlay) return setSubtitle("");
        const v = activeInfo && videoFor(activeInfo);
        if (!v || v.paused || v.ended) return setSubtitle("");
        const tracks = subtitlesDatabase[v.id];
        if (!tracks) return setSubtitle("");
        const t = v.currentTime;
        const cue = tracks.find((sub) => t >= sub.start && t <= sub.end);
        setSubtitle(cue ? cue.text : "");
      }

      allContentVideos.forEach((v) => {
        ["timeupdate", "pause", "playing", "seeked", "ended"].forEach((ev) =>
          v.addEventListener(ev, updateSubtitle),
        );
      });
    },
  };
})(window);
