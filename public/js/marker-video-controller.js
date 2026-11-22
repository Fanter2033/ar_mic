(function (window) {
  window.MarkerVideoController = {
    init: function () {
      const planes = document.querySelectorAll("a-plane");
      const overlay = document.getElementById("subtitle-overlay");
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      let currentLanguage = "ITA";
      let subtitlesDatabase = {};
      let areSubtitlesEnabled = false;

      const planesInfos = Array.from(planes)
        .map((plane) => {
          const planeSrc =
            plane && plane.getAttribute("src") ? plane.getAttribute("src") : "";
          const base = planeSrc
            .replace(/^#/, "")
            .replace(/-video-(?:ita|eng)$/, "");
          const idITA = base + "-video-ita";
          const idENG = base + "-video-eng";
          const videoITA = document.getElementById(idITA);
          const videoENG = document.getElementById(idENG);
          const marker = plane ? plane.closest("a-marker") : null;

          return {
            marker,
            plane,
            base,
            idITA,
            idENG,
            videoITA,
            videoENG,
          };
        })
        .filter(
          (info) =>
            info.marker && info.plane && (info.videoITA || info.videoENG),
        );

      const allContentVideos = Array.from(
        document.querySelectorAll(
          'video[id$="-video-ita"], video[id$="-video-eng"]',
        ),
      );

      function pauseAllVideos() {
        allContentVideos.forEach((v) => v.pause());
      }

      // Fetch subtitle database
      fetch("https://cdn.jsdelivr.net/gh/Fanter2033/ar_mic@main/public/media/subtitles/subtitles_db.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Failed to load subtitles: " + response.statusText,
            );
          }
          return response.json();
        })
        .then((data) => {
          subtitlesDatabase = data;
        })
        .catch((err) => {
          console.error("Errore caricamento sottotitoli:", err);
        });

      // Mute button listener
      window.addEventListener("muteBtnPressed", (e) => {
        const enabled = e.detail && e.detail.isAudioEnabled;
        allContentVideos.forEach((v) => {
          v.muted = !enabled;
          v.volume = 1.0;
        });
      });

      // Subtitle event listener
      window.addEventListener("subtitleToggle", (e) => {
        areSubtitlesEnabled = e.detail;
        if (!areSubtitlesEnabled && overlay) {
          overlay.innerText = "";
          overlay.style.display = "none";
        }
      });

      // Audio change event listener
      window.addEventListener("languageChanged", (e) => {
        const newLang =
          e && e.detail && e.detail.language ? e.detail.language : null;
        if (!newLang) return;
        currentLanguage = newLang;

        planesInfos.forEach((info) => {
          const { plane, videoITA, videoENG } = info;
          const currentlyPlaying =
            videoITA && !videoITA.paused
              ? videoITA
              : videoENG && !videoENG.paused
                ? videoENG
                : null;
          if (!currentlyPlaying) return; // nothing to swap

          const newActive = currentLanguage === "ITA" ? videoITA : videoENG;
          if (!newActive) return;

          pauseAllVideos();

          // Sync timestamp
          try {
            newActive.currentTime = Math.min(
              newActive.duration || Infinity,
              currentlyPlaying.currentTime,
            );
          } catch (err) {
            console.warn("Could not sync video time:", err);
          }

          // Update plane source
          plane.setAttribute("src", "#" + newActive.id);

          // Play new video
          const playPromise = newActive.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch((err) => {
              console.warn("Video play failed:", err);
              if (isIOS && err.name === "NotAllowedError") {
                const unmuteBtn = document.getElementById("unmute-btn");
                if (unmuteBtn) unmuteBtn.style.display = "block";
              }
            });
          }
        });
      });

      // MARKER DETECTION CYCLE
      planesInfos.forEach((info) => {
        const { marker, plane, videoITA, videoENG } = info;

        marker.addEventListener("markerFound", () => {
          console.log(`Marker found: ${info.base}`);

          pauseAllVideos();

          const activeVideo = currentLanguage === "ITA" ? videoITA : videoENG;
          const other = activeVideo === videoITA ? videoENG : videoITA;

          // Sync time from other language if it was playing
          const source = other && !other.paused ? other : null;
          if (source && activeVideo) {
            try {
              activeVideo.currentTime = source.currentTime;
            } catch (err) {
              console.warn("Could not sync video time:", err);
            }
          }

          if (activeVideo) {
            plane.setAttribute("src", "#" + activeVideo.id);

            // Ensure video is loaded before playing
            if (activeVideo.readyState < 2) {
              activeVideo.load();
            }

            if (activeVideo.paused) {
              const playPromise = activeVideo.play();
              if (playPromise && typeof playPromise.then === "function") {
                playPromise.catch((err) => {
                  console.warn("Video play failed:", err);
                  if (isIOS && err.name === "NotAllowedError") {
                    const unmuteBtn = document.getElementById("unmute-btn");
                    if (unmuteBtn) unmuteBtn.style.display = "block";
                  }
                });
              }
            }
          }
        });

        marker.addEventListener("markerLost", () => {
          console.log(`Marker lost: ${info.base}`);
          if (videoITA && !videoITA.paused) videoITA.pause();
          if (videoENG && !videoENG.paused) videoENG.pause();
        });
      });

      // SUBTITLE SYNCHRONIZATION ENGINE
      let lastSubtitleText = "";
      setInterval(() => {
        if (!areSubtitlesEnabled || !overlay) {
          if (overlay && lastSubtitleText !== "") {
            overlay.textContent = "";
            overlay.style.display = "none";
            lastSubtitleText = "";
          }
          return;
        }

        // Find which video is playing
        let activeVideo = null;
        for (let i = 0; i < allContentVideos.length; i++) {
          const v = allContentVideos[i];
          if (!v.paused && !v.ended && v.currentTime > 0) {
            activeVideo = v;
            break;
          }
        }

        // If no video is playing, hide subtitles
        if (!activeVideo) {
          if (lastSubtitleText !== "") {
            overlay.textContent = "";
            overlay.style.display = "none";
            lastSubtitleText = "";
          }
          return;
        }

        // Get subtitles for this video
        const tracks = subtitlesDatabase[activeVideo.id];
        if (!tracks) {
          if (lastSubtitleText !== "") {
            overlay.textContent = "";
            overlay.style.display = "none";
            lastSubtitleText = "";
          }
          return;
        }

        // Find the right subtitle for current time
        const currentTime = activeVideo.currentTime;
        const currentSubtitle = tracks.find(
          (sub) => currentTime >= sub.start && currentTime <= sub.end,
        );

        // Only update DOM if text actually changed
        if (currentSubtitle) {
          if (lastSubtitleText !== currentSubtitle.text) {
            overlay.textContent = currentSubtitle.text;
            overlay.style.display = "block";
            lastSubtitleText = currentSubtitle.text;
          }
        } else if (lastSubtitleText !== "") {
          overlay.textContent = "";
          overlay.style.display = "none";
          lastSubtitleText = "";
        }
      }, 200); 
    },
  };
})(window);