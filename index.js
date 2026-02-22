const express = require('express')
var https = require('https')
const fs = require('fs')
const path = require('path')
const app = express()
const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')));
const useHttp = process.argv.includes('--http')


app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

if(useHttp){
    //We assume that nginx is handling the TLS/SSL connection, so, we can ignore TLS/SSL
    app.listen(PORT, '127.0.0.1', () => {
        console.log(`HTTP server running at http://localhost:${PORT}`);
    });
} else {
    //No nginx connection here, the process is directly exposed - We must use local certificates.
    const options = {
        key: fs.readFileSync('../localhost.key'),
        cert: fs.readFileSync('../localhost.crt')
    };
    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS server running at https://localhost:${PORT}`);
    });
}