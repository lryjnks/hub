const ms = require('ms');
const once = require('once');
const createDebug = require('debug');
const pify = require('pify');
const joi = require('joi');
const { verify } = require('sodium-signatures');
const validators = require('./validators');

const validate = pify(joi.validate);
const debug = createDebug('u-wave-hub');

const removeTimeout = ms('1 day');

const bus = new Set();
const servers = new Map();

async function announceP(req, res) {
  const publicKey = Buffer.from(req.params.publicKey, 'hex');
  const data = Buffer.from(req.body.data, 'utf8');
  const signature = Buffer.from(req.body.signature, 'hex');

  const serverId = publicKey.toString('hex');

  if (!verify(data, signature, publicKey)) {
    debug('invalid signature from', serverId);
    throw new Error('Invalid signature');
  }

  let object;
  try {
    object = JSON.parse(data.toString('utf8'));
  } catch (err) {
    debug('invalid json from', serverId);
    err.message = `Invalid JSON: ${err.message}`;
    throw err;
  }

  object = await validate(object, validators.announceData, {
    allowUnknown: true,
    stripUnknown: true,
  });

  servers.set(serverId, {
    ping: Date.now(),
    data: object,
  });

  debug('announce', serverId);

  const server = servers.get(serverId);
  res.json({
    received: server.data,
  });

  bus.forEach((notify) => {
    notify(Object.assign({ publicKey: serverId }, server.data));
  });
}

exports.announce = function announce(req, res, next) {
  announceP(req, res).catch(next);
}

exports.list = function list(req, res) {
  const response = [];

  servers.forEach((server, publicKey) => {
    response.push(Object.assign(
      {},
      server.data,
      { publicKey, timeSincePing: Date.now() - server.ping }
    ));
  });

  res.json({
    servers: response,
  });
}

exports.events = function events(req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache'
  });

  let id = 0;
  res.write('retry:10000\n');

  bus.add(write);

  const remove = once(() => {
    bus.delete(write);
  });
  req.on('error', remove);
  res.on('error', remove);
  req.connection.on('close', remove);

  function write(event) {
    res.write(`id:${id++}\ndata:${JSON.stringify(event)}\n\n`);
  }
}

exports.prune = function prune() {
  debug('prune');
  servers.forEach((server, publicKey) => {
    if (server.ping + removeTimeout < Date.now()) {
      debug('prune', publicKey);
      servers.delete(publicKey);
    }
  });
}
