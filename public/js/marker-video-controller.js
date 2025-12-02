/* this stuff works only if the html follows the specific format and the correct id nomenclature, please be caraful >:( */
(function (window) {
  window.MarkerVideoController = {
    init: function () {
      const planes = document.querySelectorAll("a-plane"); // get all the planes
      let currentLanguage = "ITA";

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
            info.marker && info.plane && (info.videoITA || info.videoENG)
        );

      window.addEventListener("subtitleEvent", (e) => {
        areSubtitlesEnabled = e.detail;
        console.log(areSubtitlesEnabled);
      });

      // AUDIO CHANGE EVENT --> pause the videos, load the english version and match the timestamp
      window.addEventListener("languageChanged", (e) => {
        const newLang =
          e && e.detail && e.detail.language ? e.detail.language : null;
        if (!newLang) return;
        currentLanguage = newLang;

        planesInfos.forEach((info) => {
          const { plane, videoITA, videoENG, trackITA, trackENG } = info;
          const currentlyPlaying =
            videoITA && !videoITA.paused
              ? videoITA
              : videoENG && !videoENG.paused
              ? videoENG
              : null;
          if (!currentlyPlaying) return; // nothing to swap

          const newActive = currentLanguage === "ITA" ? videoITA : videoENG;
          if (!newActive) return;

          document
            .querySelectorAll(
              'video[id$="-video-ita"], video[id$="-video-eng"]'
            )
            .forEach((v) => v.pause());

          try {
            newActive.currentTime = Math.min(
              newActive.duration || Infinity,
              currentlyPlaying.currentTime
            );
          } catch (err) {}

          plane.setAttribute("src", "#" + newActive.id);
          const p = newActive.play();
          if (p && typeof p.then === "function") p.catch(() => {});
        });
      });

      // Default cicle
      planesInfos.forEach((info) => {
        const { marker, plane, videoITA, videoENG } = info;

        marker.addEventListener("markerFound", () => {
          // Pause all videos
          document
            .querySelectorAll(
              'video[id$="-video-ita"], video[id$="-video-eng"]'
            )
            .forEach((v) => v.pause());

          const activeVideo = currentLanguage === "ITA" ? videoITA : videoENG;
          const other = activeVideo === videoITA ? videoENG : videoITA;

          const source = other && !other.paused ? other : null;
          if (source && activeVideo) {
            try {
              activeVideo.currentTime = source.currentTime;
            } catch (err) {}
          }

          if (activeVideo) plane.setAttribute("src", "#" + activeVideo.id);

          if (activeVideo && activeVideo.paused) {
            const p = activeVideo.play();
            if (p && typeof p.then === "function") p.catch(() => {});
          }
        });

        marker.addEventListener("markerLost", () => {
          if (videoITA && !videoITA.paused) videoITA.pause();
          if (videoENG && !videoENG.paused) videoENG.pause();
        });
      });
    },
  };
})(window);
