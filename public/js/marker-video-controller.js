(function (window) {
  window.MarkerVideoController = {
    init: function () {
      const scene = document.querySelector("a-scene");
      // Only manage the asset videos we control (avoid pausing the AR.js camera video)
      const assetVideos = document.querySelectorAll('video[id$="-video-ita"], video[id$="-video-eng"]');
      const markers = document.querySelectorAll("a-marker");
      let currentLanguage = "ITA";

      scene.addEventListener("loaded", () => {
        assetVideos.forEach((v) => v.pause());
      });

      // AUDIO CHANGE EVENT
      window.addEventListener("languageChanged", (e) => {
        const newLang = e && e.detail && e.detail.language ? e.detail.language : null;
        if (!newLang) return;
        currentLanguage = newLang;

        markers.forEach((marker) => {
          const plane = marker.querySelector("a-plane");
          const planeSrc = plane.getAttribute("src");

          // planeSrc expected like "#drago-video-ita"
          const base = planeSrc.replace('#', '').replace('-video-ita', '').replace('-video-eng', '');
          const idITA = base + '-video-ita';
          const idENG = base + '-video-eng';
          const videoITA = document.getElementById(idITA);
          const videoENG = document.getElementById(idENG);
          if (!videoITA && !videoENG) return;

          const currentlyPlaying = (videoITA && !videoITA.paused) ? videoITA : (videoENG && !videoENG.paused ? videoENG : null);

          // If nothing is playing for this marker, nothing to swap immediately
          if (!currentlyPlaying) return;

          const newActive = currentLanguage === 'ITA' ? videoITA : videoENG;
          // Pause only the asset videos we control (do not touch the camera/video element used by AR.js)
          document.querySelectorAll('video[id$="-video-ita"], video[id$="-video-eng"]').forEach((v) => v.pause());

          // Try to match currentTime
          try {
            newActive.currentTime = Math.min(newActive.duration || Infinity, currentlyPlaying.currentTime);
          } catch (err) {
            // ignore 
          }

          // Update plane to point to the new video and play it
          plane.setAttribute('src', '#' + newActive.id);
          const p = newActive.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
        });
      });

      markers.forEach((marker) => {
        const plane = marker.querySelector('a-plane'); //get the plane
        const planeSrc = plane.getAttribute('src') || ''; //get 
        const base = planeSrc.replace('#', '').replace('-video-ita', '').replace('-video-eng', ''); //get the base name of the video (like drago)
        const idITA = base + '-video-ita';
        const idENG = base + '-video-eng';
        const videoITA = document.getElementById(idITA); // get the video element for ita
        const videoENG = document.getElementById(idENG); // get the video element for eng

        let activeVideo = currentLanguage === 'ITA' ? videoITA : videoENG;

        marker.addEventListener('markerFound', () => {
          
          // Pause only asset videos (leave camera/video element alone)
          document.querySelectorAll('video[id$="-video-ita"], video[id$="-video-eng"]').forEach((v) => v.pause());

          // Re-evaluate which video should be active
          activeVideo = currentLanguage === 'ITA' ? videoITA : videoENG;
          const other = activeVideo === videoITA ? videoENG : videoITA;

          // If there's an other video playing, try to sync from it
          const source = other && !other.paused ? other : null;
          if (source && activeVideo) {
            try {
              activeVideo.currentTime = source.currentTime;
            } catch (err) {}
          }

          // Update the plane to point to the desired video
          if (activeVideo) plane.setAttribute('src', '#' + activeVideo.id);

          // Play the selected video
          if (activeVideo && activeVideo.paused) {
            const p = activeVideo.play();
            if (p && typeof p.then === 'function') p.catch(() => {});
          }
        });

        marker.addEventListener('markerLost', () => {
          // Pause both videos for this marker
          if (videoITA && !videoITA.paused) videoITA.pause();
          if (videoENG && !videoENG.paused) videoENG.pause();
        });
      });
    },
  };
})(window);