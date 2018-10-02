var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');
var expresssession = require("express-session");
var sharedsession = require("express-socket.io-session");
var cookieparser = require('cookie-parser');

var opts = require('optimist')
    .options({
        sslkey: {
            demand: false,
            description: 'path to SSL key'
        },
        sslcert: {
            demand: false,
            description: 'path to SSL certificate'
        },
        port: {
            demand: true,
            alias: 'p',
            description: 'wetty listen port'
        },
    }).boolean('allow_discovery').argv;

var runhttps = false;

if (opts.sslkey && opts.sslcert) {
    runhttps = true;
    opts['ssl'] = {};
    opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
    opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

process.on('uncaughtException', function (e) {
    console.error('Error: ' + e);
});

var httpserv;

var app = express();

var session = expresssession({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});

// need cookieParser middleware before we can do anything with cookies
app.use(cookieparser());

// Attach session
app.use(session);

// regular middleware
app.use(function (req, res, next) {
    console.log((new Date()) + " -- " + req.method + " " + req.url + '(sid=\"' + req.sessionID + '\")');
    console.log(req.cookies);
    // var sid = req.cookies["sid"];
    // if (!sid) res.cookie("sid", "orel"); // set cookie on the very first time!
    // req.session.working = "yes!";        // set session data (on server side)
    next(); // let's continue with next middleware...
});

app.use('/', express.static(path.join(__dirname, 'public')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
        console.log((new Date()) + ' -- https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function () {
        console.log((new Date()) + ' -- http on port ' + opts.port);
    });
}

var io = server(httpserv, { path: '/socket.io' });

// Share session with io sockets
io.use(sharedsession(session));

io.on('connection', function (socket) {
    var request = socket.request;
    console.log((new Date()) + ' -- Web Socket connection accepted (sid=\"' + socket.handshake.sessionID + '\")');

    var term = pty.spawn('bash', [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    });

    term.on('data', function (data) {
        socket.emit('output', data);
    });

    term.on('exit', function (code) {
        console.log((new Date()) + " -- terminal pid=" + term.pid + " ended")
    });

    socket.on('resize', function (data) {
        console.log((new Date()) + " -- resize terminal col=" + data.col + ", row=" + data.row);
        term.resize(data.col, data.row);
    });

    socket.on('input', function (data) {
        term.write(data);
    });

    socket.on('disconnect', function () {
        term.end();
    });

});
