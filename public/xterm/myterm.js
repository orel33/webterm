

// var socket = io(location.origin, { path: '/wetty/socket.io' });
var socket = io(location.origin, { path: '/socket.io' });


Terminal.applyAddon(fit);     // Apply the `fit` addon

var term = new Terminal();
var content = document.getElementById('terminal');
term.open(content);
term.focus();
term.fit();

window.addEventListener('resize', resizeScreen, false);

function resizeScreen() {
    term.fit();
    socket.emit('resize', { col: term.cols, row: term.rows } );
}

term.on('data', function (data) {
    socket.emit('input', data)
});

socket.on('output', function (data) {
    term.write(data);
});

socket.on('connect', function () {
    // cursorBlink: (validator.isBoolean(req.query.cursorBlink + '') ? myutil.parseBool(req.query.cursorBlink) : config.terminal.cursorBlink);
    // scrollback: (validator.isInt(req.query.scrollback + '', { min: 1, max: 200000 }) && req.query.scrollback) ? req.query.scrollback : config.terminal.scrollback;
    // tabStopWidth: (validator.isInt(req.query.tabStopWidth + '', { min: 1, max: 100 }) && req.query.tabStopWidth) ? req.query.tabStopWidth : config.terminal.tabStopWidth;
    // bellStyle: ((req.query.bellStyle) && (['sound', 'none'].indexOf(req.query.bellStyle) > -1)) ? req.query.bellStyle : config.terminal.bellStyle;
    term.setOption('cursorBlink', 'true');
    // term.setOption('scrollback', '???'),
    // term.setOption('tabStopWidth', '???'),
    // term.setOption('bellStyle', '???'),
    socket.emit('resize', { col: term.cols, row: term.rows } );
});

socket.on('disconnect', function () {
    console.log("Socket.io connection closed");
});

socket.on('error', function (err) {
    console.log("Socket.io error" + err);
});
