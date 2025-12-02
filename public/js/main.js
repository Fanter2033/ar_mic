/* Main initializer served from public/js: initializes modules */
document.addEventListener("DOMContentLoaded", function () {
  if (window.MarkerVideoController)
    window.MarkerVideoController.init();

  if (window.UIControls) 
    window.UIControls.init();
});
