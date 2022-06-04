# Another Web Terminal Demo

Here is a simple demo of a web terminal (over HTTP or HTTPS). It was initially
based on the Wetty project. It uses WebSocket (socket.io) for "real-time"
communication between a backend command (e.g. bash) running on a *node.js*
server and a frontend presentation in your browser (based on xterm.js). An
*express* web server is also used on the 'node.js' server, to serve some static
pages.

## Download and Install

By default, "npm install" will install all modules listed as dependencies in 'package.json'.

```bash
git clone https://github.com/orel33/webterm.git
npm install
```

## Start this Demo

```bash
node app.js -p 3000
```

Then open <http://localhost:3000> with a modern browser...


## Dev Corner

### How to handle dependencies both on server-side (node.js)?

To build a default 'package.json', run npm init with the --yes or -y flag:

```bash
npm set init.author.email "aurelien.esnard@u-bordeaux.fr"
npm set init.author.name "orel33"
npm set init.license "GPL-3.0-only"
npm init -y
```

Let's install some dependencies and save it in the file 'package.json':

```bash
npm install xterm --save
npm install socket.io --save
npm install express --save
npm install node-pty --save
npm install optimist --save
```

## Related Projects

* https://www.npmjs.com/package/wetty (socket.io + hterm)
* https://www.npmjs.com/package/webssh2 (socket.io + xterm.js)
* https://saisandeepvaddi.com/blog/how-to-create-web-based-terminals

## Bugs and Todo List

* clean code (remove session, https, ...)
* try to use the lateste release of xterm.js (version "^4.18.0")
* clean code...


---
<aurelien.esnard@u-bordeaux.fr>
