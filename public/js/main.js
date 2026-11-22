document.addEventListener("DOMContentLoaded", function () {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const contentVideos = document.querySelectorAll(
    'video[id$="-video-ita"], video[id$="-video-eng"]',
  );

  // index.html is deployed on the museum server and isn't updated, so fixes
  // that would normally go in the HTML are applied here.

  // Fix zho video sources
  const zhoIta = document.getElementById("zho-video-ita");
  if (zhoIta) zhoIta.setAttribute("src", "https://cdn.jsdelivr.net/gh/Fanter2033/ar_mic@main/public/media/zho/zho_ITA.webm");
  const zhoEng = document.getElementById("zho-video-eng");
  if (zhoEng) zhoEng.setAttribute("src", "https://cdn.jsdelivr.net/gh/Fanter2033/ar_mic@main/public/media/zho/zho_ENG.webm");

  // Let the layout use the full screen on notched phones (style.css keeps
  // buttons and subtitles clear of the notch with safe-area insets)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && !/viewport-fit/.test(viewport.content))
    viewport.content += ", viewport-fit=cover";

  // A-Frame >= 1.5 ignores vr-mode-ui (renamed xr-mode-ui), so its "Enter VR"
  // button was showing. Marker tracking doesn't use motion sensors either, so
  // skip A-Frame's iOS permission prompt. style.css also hides both.
  const arScene = document.querySelector("a-scene");
  if (arScene) {
    arScene.setAttribute("xr-mode-ui", "enabled: false");
    arScene.setAttribute("device-orientation-permission-ui", "enabled: false");
  }

  const fsIcon = document.getElementById("fullscreen-icon");
  if (fsIcon) fsIcon.setAttribute("aria-hidden", "true");

  // Nothing is downloaded up front: each video is ~8 MB, so preloading all of
  // them would compete with the camera/AR start-up on mobile data. Videos are
  // fetched only when their marker is first seen.
  contentVideos.forEach((v) => v.setAttribute("preload", "none"));

  // IOS stuff (mp4 + chroma)
  if (isIOS) {
    contentVideos.forEach((video) => {
      video.muted = true;
      video.setAttribute("muted", "");

      // Swap WebM to MP4 (iOS can't play VP9 with alpha); with preload="none"
      // the WebM is never fetched.
      const currentSrc = video.getAttribute("src");
      if (currentSrc && currentSrc.includes(".webm")) {
        video.setAttribute("src", currentSrc.replace(".webm", ".mp4"));
      }
    });

    // Update all planes to use chromakey material
    document.querySelectorAll("a-plane").forEach((plane) => {
      plane.setAttribute("material", {
        transparent: true,
        shader: "chromakey",
        color: "0.133 1 0.027",
        tolerance: 0.4,
        smoothness: 0.4,
      });
    });
  }

  if (window.UIControls) {
    window.UIControls.init();
  }

  if (window.MarkerVideoController) {
    window.MarkerVideoController.init();
  }

  // Loading overlay: stays up until the camera is actually streaming, and
  // turns into a readable error if camera access fails.
  const scene = document.querySelector("a-scene");
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;

  const overlayText = overlay.querySelector("p");
  const t = (it, en) =>
    (window.UIControls && window.UIControls.language === "ENG") ? en : it;

  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    overlay.classList.add("fade-out");
    overlay.addEventListener("transitionend", () => overlay.remove(), {
      once: true,
    });
    window.dispatchEvent(new CustomEvent("arReady"));
  };

  const onSceneLoaded = () => {
    if (overlayText && !hidden)
      overlayText.textContent = t("Avvio fotocamera...", "Starting camera...");
    // Safety net in case the camera event never arrives
    setTimeout(hide, 15000);
  };

  if (scene) {
    if (scene.hasLoaded) onSceneLoaded();
    else scene.addEventListener("loaded", onSceneLoaded, { once: true });
  }

  window.addEventListener("camera-init", () => setTimeout(hide, 300), {
    once: true,
  });
  window.addEventListener("arjs-video-loaded", () => setTimeout(hide, 300), {
    once: true,
  });

  window.addEventListener("camera-error", () => {
    hidden = true; // keep the overlay as the error screen
    // An element with this id stops AR.js from showing its own raw error popup
    if (!document.getElementById("error-popup")) {
      const stub = document.createElement("div");
      stub.id = "error-popup";
      stub.hidden = true;
      document.body.appendChild(stub);
    }
    overlay.classList.add("error");
    const spinner = overlay.querySelector(".spinner");
    if (spinner) spinner.remove();
    if (overlayText) {
      overlayText.textContent = t(
        "Impossibile accedere alla fotocamera. Consenti l'accesso alla fotocamera nelle impostazioni del browser e riprova.",
        "Unable to access the camera. Allow camera access in your browser settings and try again.",
      );
    }
    if (!overlay.querySelector("button")) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "retry-btn";
      retry.textContent = t("Riprova", "Try again");
      retry.addEventListener("click", () => location.reload());
      overlay.appendChild(retry);
    }
  });
});
