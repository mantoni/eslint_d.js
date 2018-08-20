'use strict';

const crypto = require('crypto');
const net = require('net');
const portfile = require('./portfile');
const linter = require('./linter');

const token = crypto.randomBytes(8).toString('hex');

let openConnections = [];

function forceClose(con) {
  con.write('Server is stopping...\n# exit 1');
  con.end();
}

const server = net.createServer({
  allowHalfOpen: true
}, (con) => {
  let data = '';
  con.on('data', (chunk) => {
    data += chunk;
  });
  con.on('end', () => {
    openConnections = openConnections.filter((c) => {
      return c !== con;
    });
    if (!data) {
      con.end();
      return;
    }
    const p = data.indexOf(' ');
    if (p === -1 || data.substring(0, p) !== token) {
      con.end();
      return;
    }
    data = data.substring(p + 1);
    if (data === 'stop') {
      con.end();
      server.close();
      openConnections.forEach(forceClose);
      return;
    }
    if (data === 'status') {
      con.write(linter.getStatus());
      con.end();
      return;
    }
    let cwd, args, text;
    if (data.substring(0, 1) === '{') {
      const json = JSON.parse(data);
      cwd = json.cwd;
      args = json.args;
      text = json.text;
    } else {
      const newlineIndex = data.indexOf('\n');
      if (newlineIndex >= 0) {
        text = data.slice(newlineIndex + 1);
        data = data.slice(0, newlineIndex);
      }
      const parts = data.split(' ');
      cwd = parts[0];
      args = parts.slice(1);
    }
    try {
      con.write(linter(cwd, args, text));
    } catch (e) {
      con.write(`${e.toString()}\n# exit 1`);
    }
    con.end();
  });
});

server.on('connection', (con) => {
  openConnections = openConnections.concat([con]);
});

server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  portfile.write(port, token);
});

process.on('exit', () => {
  portfile.unlink();
});
process.on('SIGTERM', () => {
  process.exit();
});
process.on('SIGINT', () => {
  process.exit();
});
