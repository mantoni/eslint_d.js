'use strict';

const crypto = require('crypto');
const net = require('net');
const portfile = require('./portfile');
const linter = require('./linter');

function fail(con, message) {
  try {
    con.end(`${message}\n# exit 1`);
  } catch (ignore) {
    // Nothing we can do
  }
}

function remove(connections, con) {
  const p = connections.indexOf(con);
  if (p !== -1) {
    connections.splice(p, 1);
  }
}

function parseData(data) {
  if (data.substring(0, 1) === '{') {
    return JSON.parse(data);
  }

  const newlineIndex = data.indexOf('\n');
  let text;
  if (newlineIndex >= 0) {
    text = data.slice(newlineIndex + 1);
    data = data.slice(0, newlineIndex);
  }
  const parts = data.split(' ');
  return {
    cwd: parts[0],
    args: parts.slice(1),
    text
  };
}

exports.start = function () {

  const token = crypto.randomBytes(8).toString('hex');
  const open_connections = [];

  const server = net.createServer({
    allowHalfOpen: true
  }, (con) => {
    let data = '';
    con.on('data', (chunk) => {
      data += chunk;
    });
    con.on('end', () => {
      remove(open_connections, con);
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
        open_connections.forEach((con) => fail(con, 'Server is stopping...'));
        con.end();
        server.close();
        return;
      }
      if (data === 'status') {
        con.end(linter.getStatus());
        return;
      }
      const { cwd, args, text } = parseData(data);
      let result;
      try {
        result = linter.lint(cwd, args, text);
      } catch (e) {
        fail(con, e.toString());
        return;
      }
      con.write(result);
      con.end();
    });
  });

  server.on('connection', (con) => {
    open_connections.push(con);
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    portfile.write(port, token);
  });

  return server;
};
