var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');
var expresssession = require("express-session");
var sharedsession = require("express-socket.io-session");
// var cookieparser = require('cookie-parser');

/**
 *  Auxialiary Functions
 */

function clog(message) {
    console.log((new Date()) + ' -- ' + message); // change date format
}

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
// app.use(cookieparser()); // no need to use it...

// Use express-session middleware for express
app.use(session);

// regular middleware
app.use(function (req, res, next) {  
    clog(req.method + " " + req.url + " from " + req. ip + " (sid=" + req.sessionID + ")");
    // console.log((new Date()) + " -- " + req.method + " " + req.url + ID);
    // console.log(req.cookies);
    // console.log(req.session);    
    // var sid = req.cookies["sid"];
    // if (!sid) res.cookie("sid", "orel"); // set cookie on the very first time!
    // req.session.working = "yes!";        // set session data (on server side)
    next(); // let's continue with next middleware...
});

app.use('/', express.static(path.join(__dirname, 'public')));

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
        clog('Listen https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function () {
        clog('Listen http on port ' + opts.port);
    });
}

var io = server(httpserv, {
    path: '/socket.io'
});

// Use shared session middleware for socket.io
io.use(sharedsession(session, { autoSave:true }));

io.on('connection', function (socket) {
    var ID = '(addr=' + socket.handshake.address + ', sid=' + socket.handshake.sessionID +')';
    // var request = socket.request;
    clog('Web Socket connection accepted from ' + socket.handshake.address + ' (sid='+ socket.handshake.sessionID + ')');
    // console.log(socket);

    var term = pty.spawn('bash', [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30
    });

    clog("Launch terminal with pid=" + term.pid);

    term.on('data', function (data) {
        socket.emit('output', data);
    });

    term.on('exit', function (code) {
        clog("Exit terminal with pid=" + term.pid);
    });

    // // login
    // socket.on("login", function (userdata) {
    //     socket.handshake.session.userdata = userdata;
    //     socket.handshake.session.save();
    // });

    // // logout
    // socket.on("logout", function (userdata) {
    //     if (socket.handshake.session.userdata) {
    //         delete socket.handshake.session.userdata;
    //         socket.handshake.session.save();
    //     }
    // });

    socket.on('resize', function (data) {
        clog("Resize terminal " + data.col + "x" + data.row); // col x row
        term.resize(data.col, data.row);
    });

    socket.on('input', function (data) {
        term.write(data);
    });

    socket.on('disconnect', function () {
        clog("Connection closed from " + socket.handshake.address + ".");
        term.end(); // or term.kill();
    });

});