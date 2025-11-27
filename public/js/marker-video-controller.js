/* Marker / Video controller (served from public/js)
   - Pauses all videos on scene load
   - Plays the video associated to a marker when markerFound
   - Pauses the video when markerLost
*/
(function (window) {
  window.MarkerVideoController = {
    init: function () {
      const scene = document.querySelector("a-scene");
      const videos = document.querySelectorAll("video");
      const markers = document.querySelectorAll("a-marker");
      let currentLanguage = "ITA";

      if (!scene) return;

      scene.addEventListener("loaded", () => {
        videos.forEach((v) => v.pause());
      });

      // Listen for the event that change language
      window.addEventListener("languageChanged", (e) => {
        const newLang = e && e.detail && e.detail.language ? e.detail.language : null;
        if (!newLang) return;
        currentLanguage = newLang;

        // For each marker/video that is currently playing, swap to the new audio
        markers.forEach((marker) => {
          const plane = marker.querySelector("a-plane");
          if (!plane) return;

          const videoID = plane.getAttribute("src");
          const video = document.querySelector(videoID);
          if (!video) return;

          const audioITA = document.getElementById(
            video.id.replace("-video", "_audio_ita")
          );
          const audioENG = document.getElementById(
            video.id.replace("-video", "_audio_eng")
          );

          const newActive = currentLanguage === "ITA" ? audioITA : audioENG;
          if (!newActive) return;

          // If the video is playing, sync the new audio to the video's currentTime
          if (!video.paused) {
            document.querySelectorAll("audio").forEach((a) => a.pause());
            try {
              newActive.currentTime = Math.min(newActive.duration || Infinity, video.currentTime);
            } catch (err) {
              // Some browsers may throw if audio metadata isn't loaded;
            }
            newActive.play().catch(() => {});
          }
        });
      });

      markers.forEach((marker) => {
        const plane = marker.querySelector("a-plane");
        const videoID = plane.getAttribute("src");
        const video = document.querySelector(videoID);
        const audioITA = document.getElementById(
          video.id.replace("-video", "_audio_ita")
        );
        const audioENG = document.getElementById(
          video.id.replace("-video", "_audio_eng")
        );
        let activeAudio = audioITA;

        marker.addEventListener("markerFound", () => {
          videos.forEach((v) => v.pause());
          document.querySelectorAll("audio").forEach((a) => a.pause());

          activeAudio = currentLanguage == "ITA" ? audioITA : audioENG;
          if (activeAudio) {
            try {
              activeAudio.currentTime = video.currentTime; //match audio and video
            } catch (err) {}
          }
          if (video && video.paused) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.then === "function") {
              // After video starts (or immediately if resolved), play the audio
              playPromise
                .then(() => {
                  if (activeAudio) activeAudio.play().catch(() => {});
                })
                .catch(() => {
                  // If video couldn't autoplay, still attempt audio play
                  if (activeAudio) activeAudio.play().catch(() => {});
                });
            } else {
              if (activeAudio) activeAudio.play().catch(() => {});
            }
          }

        });

        marker.addEventListener("markerLost", () => {
          if (video && !video.paused) {
            video.pause();
            activeAudio.pause();
          }
        });
      });
    },
  };
})(window);