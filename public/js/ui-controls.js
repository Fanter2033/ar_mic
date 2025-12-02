(function (window) {
  window.UIControls = {
    init: function () {
      const changeLanguageBtn = document.getElementById("change-len-btn");
      const openBtn = document.getElementById("open_tutorial");
      const closeBtn = document.getElementById("close");
      const backdrop = document.getElementById("backdrop");
      const fullscreenBtn = document.getElementById("clean-fullscreen-btn");
      const tutorial_dialog = document.getElementById("tutorial_list");
      const tutorial_list = tutorial_dialog.querySelectorAll("li");
      let language = "ITA"; // the current one, not the one showed on the button :\
      let isClean = false;

      // Testi in italiano
      const textIT = [
        "Alzare il volume del telefono e acconsentire all'accesso della webcam.",
        "Inquadrare gli ideogrammi presenti nelle vetrine e rimanere fermi.",
        "Puoi cambiare la lingua tramite il pulsante in alto a sinistra",
      ];
      // Testi in inglese
      const textEN = [
        "Turn up your phone's volume and allow camera access.",
        "Point the camera at the ideograms in the showcases and stay still.",
        "You can change the language using the button at the top left.",
      ];

      if (changeLanguageBtn) {
        changeLanguageBtn.addEventListener("click", () => {
          changeLanguageBtn.innerText = language;
          language = language === "ITA" ? "ENG" : "ITA";
          window.dispatchEvent(
            new CustomEvent("languageChanged", { detail: { language } })
          );

          const source = language === "ITA" ? textIT : textEN;
          tutorial_list.forEach((li, i) => {
            li.textContent = source[i];
          });
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
