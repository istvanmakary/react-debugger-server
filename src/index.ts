const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const Config = require('../config.json');
const storage = require('node-persist');
const basicAuth = require('express-basic-auth');

process.chdir('./dist');

const template = fs.readFileSync('./website/template.html','utf8')
.replace(/\{\{url\}\}/, Config.url);
const port = process.env.PORT || Config.port;
let connections = [];

class Server {
  constructor() {
    this.setup();
  }

  async setup() {
    this.setupStore();
    this.setupServer();
    this.setupSocket();
  }

  async setupStore() {
    await storage.init({
      dir: 'store',
      expiredInterval: 7200000,
    });
  }

  static validateLog = (log) => {
    const isValidDevice = log.device && log.device.id;
    const isValidData = log.events 
    && !log.events.find((event) => (!event.label || !event.type || !event.logType || !event.id));

    return isValidDevice && isValidData;
  }

  setupServer() {
    const app = express();
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(basicAuth({
        users: { 
          [Config.user]: Config.password, 
        },
        challenge: true,
        realm: 'Imb4T3st4pp',
    }));
    app.use('/public', express.static(path.join(__dirname, 'website/public')));
    app.get('/', Server.returnTemplate);
    app.get('/socket-io', Server.sendSocketIOJS);
    app.post('/log', this.log);

    this.httpServer = app.listen(port, () => console.log(`App is listening on ${port}`));
  }

  static returnTemplate = (req, res) => {
    res.send(template);
  };

  static sendSocketIOJS = (req, res) => {
    res.sendFile(__dirname + '/socket.io.js');
  }

  log = ({ body }, res) => {
    if (Server.validateLog(body)) {
      this.updateStore(body);

      this.notifyClients(body).then(() => {
        res.sendStatus(200);
      }, (e) => {
        res.sendStatus(400);
        console.warn(e);
      });
    }
  }

  notifyClients = (data, event) => new Promise((resolve) => {
    resolve(connections.forEach((client) => {
      client.emit(event || 'event', data);
    }));
  })
  
  setupSocket() {
    var io = socketIO(this.httpServer);
    io.on('connection', this.handleNewClient);
  }

  handleNewClient = (client) => {
    connections.push(client);
    client.on('disconnect', () => {
      connections.splice(connections.indexOf(client), 1);
    });
    this.updateClient(client);
  }

  updateClient = async (client) => {
    const store = await storage.values();
    client.emit('store', store);
  }

  updateStore = async (log) => {
    const key = log.device.id;

    const sotre = await storage.getItem(key) || {};

    await storage.setItem(key, {
      ...sotre,
      events: [
        ...sotre.events || [],
        ...log.events || [],
      ],
    });
  }
}


new Server();
