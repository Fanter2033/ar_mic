// Local preview server for testing changes on a phone before they reach main.
//
// index.html loads CSS, JS, videos and subtitles from jsDelivr "@main", so a
// plain server would show the code that is already on main. This server
// rewrites those URLs to the local files, so the phone gets this checkout.
//
// Usage:
//   npm install
//   node preview.js            (or: npm run preview)
//   ngrok http 3000            (camera access needs the https URL ngrok prints)

const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const MAIN_CDN = /https:\/\/cdn\.jsdelivr\.net\/gh\/Fanter2033\/ar_mic@main\//g;

const app = express();

// Never cache, so every reload on the phone picks up local edits
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function sendRewritten(file, type) {
  return (req, res) => {
    const text = fs.readFileSync(file, "utf8").replace(MAIN_CDN, "/");
    res.type(type).send(text);
  };
}

app.get("/", sendRewritten(path.join(ROOT, "index.html"), "html"));
app.get(/^\/public\/js\/[\w-]+\.js$/, (req, res, next) => {
  const file = path.join(ROOT, req.path);
  if (!fs.existsSync(file)) return next();
  sendRewritten(file, "js")(req, res);
});

// Videos, patterns, subtitles, CSS (range requests supported for seeking)
app.use("/public", express.static(path.join(ROOT, "public")));

// Files missing from this folder (e.g. markers and videos when only the code
// was copied) are unchanged on main, so fetch them from jsDelivr instead
app.use("/public", (req, res) => {
  console.log(`not found locally, using main: /public${req.path}`);
  res.redirect(302, `https://cdn.jsdelivr.net/gh/Fanter2033/ar_mic@main/public${req.path}`);
});

app.listen(PORT, () => {
  console.log(`Preview running at http://localhost:${PORT}`);
  console.log(`For the phone, run in another terminal:  ngrok http ${PORT}`);
});
