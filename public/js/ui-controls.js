/* UI controls served from public/js */
(function (window) {
  window.UIControls = {
    init: function () {
      const changeLanguageBtn = document.getElementById("change-len-btn");
      const openBtn = document.getElementById("open_tutorial");
      const closeBtn = document.getElementById("close");
      const backdrop = document.getElementById("backdrop");
      const fullscreenBtn = document.getElementById("clean-fullscreen-btn");
      let language = "ITA"; // the current one, not the one showed on the button
      let isClean = false;

      if (changeLanguageBtn) {
        changeLanguageBtn.addEventListener("click", () => {
          changeLanguageBtn.innerText = language;
          language = language === "ITA" ? "ENG" : "ITA";
          window.dispatchEvent(
            new CustomEvent("languageChanged", { detail: { language } })
          );
        });
      }

      function enterFullscreen(element = document.documentElement) {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen)
          element.webkitRequestFullscreen();
      }

      function exitFullscreen() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
          isClean = !isClean;

          const elementsToHide = [
            document.getElementById("controls"),
            document.getElementById("loading"),
            changeLanguageBtn,
          ];

          if (isClean) {
            elementsToHide.forEach((el) => el && el.classList.add("hidden-ui"));
            fullscreenBtn.textContent = "✕"; // exit icon
            enterFullscreen();
          } else {
            elementsToHide.forEach(
              (el) => el && el.classList.remove("hidden-ui")
            );
            fullscreenBtn.textContent = "⛶"; // enter fullscreen icon
            exitFullscreen();
          }
        });
      }

      if (openBtn && backdrop)
        openBtn.onclick = () => (backdrop.style.display = "flex");
      if (closeBtn && backdrop)
        closeBtn.onclick = () => (backdrop.style.display = "none");
      if (backdrop)
        backdrop.onclick = (e) => {
          if (e.target === backdrop) backdrop.style.display = "none";
        };
    },
  };
})(window);
