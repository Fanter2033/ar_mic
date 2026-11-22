(function (window) {
  const EXPAND_ICON =
    '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>';
  const CLOSE_ICON = '<path d="M18 6L6 18M6 6l12 12"/>';

  // Text for tutorial
  const textIT = [
    "Alza il volume del telefono e acconsenti all'accesso della webcam.",
    "Inquadra gli ideogrammi presenti nelle vetrine e rimani fermo.",
    'Puoi cambiare la lingua tramite il pulsante in alto a sinistra e attivare i sottotitoli tramite il pulsante "CC".',
    "Per una migliore esperienza, accedi al sito tramite il browser Chrome.",
    'Per gli utenti iOS, il video partirà senza audio. Clicca il tasto "Attiva Audio" per abilitarlo.',
  ];
  const textEN = [
    "Turn up your phone's volume and allow camera access.",
    "Point the camera at the ideograms in the showcases and hold still.",
    'You can change the language with the button at the top left and turn on subtitles with the "CC" button.',
    "For the best experience, open the website in the Chrome browser.",
    'On iOS, the video starts without audio. Tap "Unmute Audio" to enable it.',
  ];

  const STRINGS = {
    ITA: {
      mute: "Disattiva Audio",
      unmute: "Attiva Audio",
      switchLang: "Switch to English",
      subtitles: "Sottotitoli",
      fullscreen: "Schermo intero",
      exitFullscreen: "Esci da schermo intero",
      close: "Chiudi",
      start: "Inizia",
      scan: "Inquadra un ideogramma",
      buffering: "Caricamento video...",
    },
    ENG: {
      mute: "Mute Audio",
      unmute: "Unmute Audio",
      switchLang: "Passa all'italiano",
      subtitles: "Subtitles",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      close: "Close",
      start: "Start",
      scan: "Point at an ideogram",
      buffering: "Loading video...",
    },
  };

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      /* private mode etc. */
    }
  }

  window.UIControls = {
    language: "ITA",

    init: function () {
      const self = this;
      const changeLanguageBtn = document.getElementById("change-len-btn");
      const openBtn = document.getElementById("open_tutorial");
      const closeBtn = document.getElementById("close");
      const unmuteBtn = document.getElementById("unmute-btn");
      const subBtn = document.getElementById("sub-btn");
      const backdrop = document.getElementById("backdrop");
      const fullscreenBtn = document.getElementById("clean-fullscreen-btn");
      const fullscreenIcon = document.getElementById("fullscreen-icon");
      const tutorialList = document.getElementById("tutorial_list");
      const tutorialItems = tutorialList ? tutorialList.querySelectorAll("li") : [];
      const dialog = backdrop ? backdrop.querySelector(".dialog") : null;
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      let isClean = false;
      let isAudioEnabled = !isIOS;

      // ── Dynamic status elements (created here so older index.html works) ──
      const scanHint = document.createElement("div");
      scanHint.id = "scan-hint";
      scanHint.setAttribute("aria-live", "polite");
      document.body.appendChild(scanHint);

      const bufferIndicator = document.createElement("div");
      bufferIndicator.id = "video-buffering";
      bufferIndicator.innerHTML = '<div class="spinner small"></div><span></span>';
      document.body.appendChild(bufferIndicator);

      // "Start" button at the bottom of the tutorial
      let startBtn = null;
      if (dialog && !dialog.querySelector("#tutorial-start")) {
        startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.id = "tutorial-start";
        dialog.appendChild(startBtn);
      }

      [changeLanguageBtn, openBtn, closeBtn, unmuteBtn, subBtn, fullscreenBtn]
        .forEach((b) => b && b.setAttribute("type", "button"));
      if (backdrop) {
        // Lift the dialog out of #controls so it sits above every other
        // layer and stays reachable in clean mode
        if (backdrop.parentElement !== document.body)
          document.body.appendChild(backdrop);
        backdrop.setAttribute("role", "dialog");
        backdrop.setAttribute("aria-modal", "true");
      }

      function s(key) {
        return STRINGS[self.language][key];
      }

      function updateAudioButton() {
        if (!unmuteBtn) return;
        unmuteBtn.textContent = isAudioEnabled ? s("mute") : s("unmute");
        unmuteBtn.setAttribute("aria-pressed", String(!isAudioEnabled));
      }

      function applyLanguage() {
        document.documentElement.lang = self.language === "ITA" ? "it" : "en";
        if (changeLanguageBtn) {
          // The button shows the language you switch *to*
          changeLanguageBtn.textContent = self.language === "ITA" ? "ENG" : "ITA";
          changeLanguageBtn.setAttribute("aria-label", s("switchLang"));
          changeLanguageBtn.title = s("switchLang");
        }
        const source = self.language === "ITA" ? textIT : textEN;
        tutorialItems.forEach((li, i) => {
          if (source[i]) li.textContent = source[i];
        });
        if (subBtn) subBtn.setAttribute("aria-label", s("subtitles"));
        if (closeBtn) closeBtn.setAttribute("aria-label", s("close"));
        if (startBtn) startBtn.textContent = s("start");
        if (fullscreenBtn)
          fullscreenBtn.setAttribute(
            "aria-label",
            isClean ? s("exitFullscreen") : s("fullscreen"),
          );
        scanHint.textContent = s("scan");
        bufferIndicator.querySelector("span").textContent = s("buffering");
        updateAudioButton();
      }

      function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
      }

      function enterFullscreen(element = document.documentElement) {
        try {
          const req = element.requestFullscreen
            ? element.requestFullscreen()
            : element.webkitRequestFullscreen
              ? element.webkitRequestFullscreen()
              : null;
          if (req && req.catch) req.catch(() => {});
        } catch (e) {
          /* not supported (e.g. iPhone Safari): clean mode still hides UI */
        }
      }

      function exitFullscreen() {
        if (!isFullscreen()) return;
        try {
          const res = document.exitFullscreen
            ? document.exitFullscreen()
            : document.webkitExitFullscreen
              ? document.webkitExitFullscreen()
              : null;
          if (res && res.catch) res.catch(() => {});
        } catch (e) {
          /* ignore */
        }
      }

      function setCleanMode(clean) {
        isClean = clean;
        const elementsToHide = [
          document.getElementById("controls"),
          changeLanguageBtn,
        ];
        elementsToHide.forEach(
          (el) => el && el.classList.toggle("hidden-ui", isClean),
        );
        document.body.classList.toggle("clean-mode", isClean);
        if (fullscreenIcon)
          fullscreenIcon.innerHTML = isClean ? CLOSE_ICON : EXPAND_ICON;
        if (fullscreenBtn)
          fullscreenBtn.setAttribute(
            "aria-label",
            isClean ? s("exitFullscreen") : s("fullscreen"),
          );
      }

      // Change language event
      if (changeLanguageBtn) {
        changeLanguageBtn.addEventListener("click", () => {
          self.language = self.language === "ITA" ? "ENG" : "ITA";
          window.dispatchEvent(
            new CustomEvent("languageChanged", {
              detail: { language: self.language },
            }),
          );
          applyLanguage();
        });
      }

      // Fullscreen / clean mode
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", () => {
          setCleanMode(!isClean);
          if (isClean) enterFullscreen();
          else exitFullscreen();
        });
      }
      // Leaving fullscreen with the system gesture/back button restores the UI
      const onFsChange = () => {
        if (!isFullscreen() && isClean) setCleanMode(false);
      };
      document.addEventListener("fullscreenchange", onFsChange);
      document.addEventListener("webkitfullscreenchange", onFsChange);

      // Tutorial
      let lastFocus = null;
      function openTutorial() {
        if (!backdrop) return;
        lastFocus = document.activeElement;
        backdrop.style.display = "flex";
        if (dialog) dialog.scrollTop = 0;
        const target = startBtn || closeBtn;
        if (target) target.focus({ preventScroll: true });
      }
      function closeTutorial() {
        if (!backdrop || backdrop.style.display === "none") return;
        backdrop.style.display = "none";
        storageSet("ar_mic_tutorial_seen", "1");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      if (openBtn) openBtn.addEventListener("click", openTutorial);
      if (closeBtn) closeBtn.addEventListener("click", closeTutorial);
      if (startBtn) startBtn.addEventListener("click", closeTutorial);
      if (backdrop)
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) closeTutorial();
        });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeTutorial();
      });

      // Show the tutorial once per visit, as soon as the camera is ready.
      // Dismissing it is also the user gesture browsers need before they
      // allow videos to play with sound.
      window.addEventListener(
        "arReady",
        () => {
          if (!storageGet("ar_mic_tutorial_seen")) openTutorial();
          scanHint.classList.add("visible");
        },
        { once: true },
      );

      // Audio lock and unlock
      if (unmuteBtn) {
        unmuteBtn.style.display = "block";
        unmuteBtn.addEventListener("click", () => {
          isAudioEnabled = !isAudioEnabled;
          unmuteBtn.classList.remove("attention");
          window.dispatchEvent(
            new CustomEvent("muteBtnPressed", { detail: { isAudioEnabled } }),
          );
          updateAudioButton();
        });
      }

      // The browser refused to play with sound: the controller fell back to
      // muted playback, so reflect it and draw attention to the button.
      window.addEventListener("audioBlocked", () => {
        isAudioEnabled = false;
        updateAudioButton();
        if (unmuteBtn) unmuteBtn.classList.add("attention");
      });

      // Playing muted (e.g. iOS): nudge the user towards the audio button
      window.addEventListener("videoPlaying", (e) => {
        if (unmuteBtn && e.detail && e.detail.muted && !isAudioEnabled)
          unmuteBtn.classList.add("attention");
      });

      // Marker tracking and buffering feedback
      window.addEventListener("markerVisibility", (e) => {
        const anyVisible = e.detail && e.detail.anyVisible;
        scanHint.classList.toggle("tracking", !!anyVisible);
      });
      window.addEventListener("videoBuffering", (e) => {
        bufferIndicator.classList.toggle("visible", !!(e.detail && e.detail.buffering));
      });

      // Subtitle event
      if (subBtn) {
        const strike = document.getElementById("sub-btn-strike");
        subBtn.setAttribute("aria-pressed", "false");
        // Struck-through "CC" = subtitles off (the usual convention)
        if (strike) strike.classList.toggle("visible", subBtn.classList.contains("off"));
        subBtn.addEventListener("click", () => {
          const areSubtitlesEnabled = !subBtn.classList.toggle("off");
          if (strike) strike.classList.toggle("visible", !areSubtitlesEnabled);
          subBtn.setAttribute("aria-pressed", String(areSubtitlesEnabled));
          window.dispatchEvent(
            new CustomEvent("subtitleToggle", { detail: areSubtitlesEnabled }),
          );
        });
      }

      applyLanguage();
    },
  };
})(window);
