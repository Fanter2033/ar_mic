(function (window) {
  window.SubtitleController = {
    init: function () {
      const toggleBtn = document.getElementById("subtitles");
      const videos = document.querySelectorAll('video[id$="-video-ita"], video[id$="-video-eng"]');
      let areSubtitlesEnabled = false;

      videos.forEach((video)=>{
        for (const track of video.textTracks) {
          track.mode = "hidden";
        }
      })
      
      toggleBtn.addEventListener("click", ()=>{
        areSubtitlesEnabled = !areSubtitlesEnabled;
        toggleBtn.querySelector("span").innerText = areSubtitlesEnabled ? toggleBtn.querySelector("span").innerText + "(Attivati)" : "CC";

        window.dispatchEvent(
            new CustomEvent("subtitleEvent", { detail: { areSubtitlesEnabled } })
        );
      });
    },
  };
})(window);