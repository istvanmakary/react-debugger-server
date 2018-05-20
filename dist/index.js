var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var socketIO = require('socket.io');
var Config = require('../config.json');
var storage = require('node-persist');
var basicAuth = require('express-basic-auth');
process.chdir('./dist');
var template = fs.readFileSync('./website/template.html', 'utf8')
    .replace(/\{\{url\}\}/, Config.url);
var port = process.env.PORT || Config.port;
var connections = [];
var Server = /** @class */ (function () {
    function Server() {
        var _this = this;
        this.log = function (_a, res) {
            var body = _a.body;
            if (Server.validateLog(body)) {
                _this.updateStore(body);
                _this.notifyClients(body).then(function () {
                    res.sendStatus(200);
                }, function (e) {
                    res.sendStatus(400);
                    console.warn(e);
                });
            }
        };
        this.notifyClients = function (data, event) { return new Promise(function (resolve) {
            resolve(connections.forEach(function (client) {
                client.emit(event || 'event', data);
            }));
        }); };
        this.handleNewClient = function (client) {
            connections.push(client);
            client.on('disconnect', function () {
                connections.splice(connections.indexOf(client), 1);
            });
            _this.updateClient(client);
        };
        this.updateClient = function (client) { return __awaiter(_this, void 0, void 0, function () {
            var store;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.values()];
                    case 1:
                        store = _a.sent();
                        client.emit('store', store);
                        return [2 /*return*/];
                }
            });
        }); };
        this.updateStore = function (log) { return __awaiter(_this, void 0, void 0, function () {
            var key, sotre;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = log.device.id;
                        return [4 /*yield*/, storage.getItem(key)];
                    case 1:
                        sotre = (_a.sent()) || {};
                        return [4 /*yield*/, storage.setItem(key, __assign({}, sotre, { events: (sotre.events || []).concat(log.events || []) }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.setup();
    }
    Server.prototype.setup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.setupStore();
                this.setupServer();
                this.setupSocket();
                return [2 /*return*/];
            });
        });
    };
    Server.prototype.setupStore = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.init({
                            dir: 'store',
                            expiredInterval: 7200000,
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Server.prototype.setupServer = function () {
        var app = express();
        app.use(bodyParser.json({ limit: '50mb' }));
        app.use(basicAuth({
            users: (_a = {},
                _a[Config.user] = Config.password,
                _a),
            challenge: true,
            realm: 'Imb4T3st4pp',
        }));
        app.use('/public', express.static(path.join(__dirname, 'website/public')));
        app.get('/', Server.returnTemplate);
        app.get('/socket-io', Server.sendSocketIOJS);
        app.post('/log', this.log);
        this.httpServer = app.listen(port, function () { return console.log("App is listening on " + port); });
        var _a;
    };
    Server.prototype.setupSocket = function () {
        var io = socketIO(this.httpServer);
        io.on('connection', this.handleNewClient);
    };
    Server.validateLog = function (log) {
        var isValidDevice = log.device && log.device.id;
        var isValidData = log.events
            && !log.events.find(function (event) { return (!event.label || !event.type || !event.logType || !event.id); });
        return isValidDevice && isValidData;
    };
    Server.returnTemplate = function (req, res) {
        res.send(template);
    };
    Server.sendSocketIOJS = function (req, res) {
        res.sendFile(__dirname + '/socket.io.js');
    };
    return Server;
}());
new Server();
