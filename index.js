const express = require('express')
var https = require('https')
const fs = require('fs')
const path = require('path')
const app = express()
const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')));


const options = {
  key: fs.readFileSync('../localhost.key'),
  cert: fs.readFileSync('../localhost.crt')
};


app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});


https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});