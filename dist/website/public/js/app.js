var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var store = {};
var devices = [];
var displayedLogs = [];
var acitveDevice = '';
var socket = io(window.server_url);
var searchTerm = '';
function parseData(data) {
    try {
        return JSON.parse(data);
    }
    catch (e) {
        return data;
    }
}
function debugDevice(uuid) {
    acitveDevice = unescape(uuid);
    drawLogs(true);
    renderDevices();
}
var getActiveDevice = function () { return devices.find(function (d) { return d.id === acitveDevice; }); };
function downloadActive() {
    var date = new Date();
    var device = getActiveDevice();
    var text = "{\"date\": \"" + date + "\",\"device\": " + JSON.stringify(device) + ",\"events\": " + JSON.stringify(store[acitveDevice]) + "}";
    var anchor = document.createElement('a');
    anchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    document.body.appendChild(anchor);
    anchor.setAttribute('download', "logs-" + acitveDevice + "-" + date + ".txt");
    anchor.click();
    document.body.removeChild(anchor);
}
function drawLogs(shouldClear) {
    if (shouldClear) {
        console.clear();
        displayedLogs = [];
    }
    if (acitveDevice) {
        store[acitveDevice].forEach(function (event) {
            var eventID = event.label + '@' + event.date;
            if (!displayedLogs.includes(eventID) && (!searchTerm ||
                event.label.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
                event.type.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1)) {
                var color = '';
                switch (event.logType) {
                    case 'SUCCESS':
                        color = 'green';
                        break;
                    case 'ERROR':
                        color = 'red';
                        break;
                    default:
                        color = '#000';
                }
                displayedLogs.push(eventID);
                console.groupCollapsed('%c ' + event.type +
                    ' ' + event.label.substring(0, 50) +
                    ' @ ' + event.date, 'font-weight: bold; color: ' + color);
                console.log('%c label: ', 'font-weight: bold;', event.label);
                console.log('%c type: ', 'font-weight: bold;', event.type);
                console.log('%c status: ', 'font-weight: bold;', event.logType);
                console.log('%c payload: ', 'font-weight: bold;', event.data);
                console.groupEnd();
            }
        });
    }
}
function renderDevices() {
    var wrapper = document.querySelector('[data-device-list]');
    var activeDeviceWrapper = document.querySelector('[data-device-details]');
    var html = devices.map(function (_a) {
        var id = _a.id, name = _a.name;
        return ("<p>\n      <label>\n        <input \n          name=\"device\" \n          type=\"radio\" \n          value=\"\" \n          " + (acitveDevice === id ? 'checked' : '') + " \n          onChange=\"debugDevice('" + escape(id) + "')\"\n        />\n        " + name + " - " + id + "\n      </label> \n      " + (acitveDevice === id
            ? "<button type=\"button\" onClick=\"downloadActive()\">download</button>"
            : '') + "\n    </p>");
    });
    wrapper.innerHTML = html.join(' ');
    if (acitveDevice) {
        var acitveDevice_1 = getActiveDevice();
        activeDeviceWrapper.innerHTML = "\n      <h2>Device Details:</h2>\n      <p style=\"margin: 5px 0\">Platform: <b>" + acitveDevice_1.platform + "</b></p>\n      <p style=\"margin: 5px 0\">Name: <b>" + acitveDevice_1.name + "</b></p>\n      <p style=\"margin: 5px 0\">Device ID: <b>" + acitveDevice_1.id + "</b></p>\n      <p style=\"margin: 5px 0\">Bundle ID: <b>" + acitveDevice_1.bundleId + "</b></p>\n      <p style=\"margin: 5px 0\">Build Number: <b>" + acitveDevice_1.buildNumber + "</b></p>\n      <p style=\"margin: 5px 0\">Country: <b>" + acitveDevice_1.country + "</b></p>\n    ";
    }
}
var processSingleItem = function (data) {
    var _a = data.events, events = _a === void 0 ? [] : _a, device = data.device;
    events.forEach(function (event) {
        store[device.id] = (store[device.id] || []).concat([
            event,
        ]);
        if (!devices.find(function (d) { return d.id === device.id; })) {
            if (!acitveDevice) {
                acitveDevice = device.id;
            }
            devices.push(device);
        }
    });
};
socket.on('store', function (data) {
    (data || []).forEach(processSingleItem);
    renderDevices();
    drawLogs();
});
socket.on('event', function (data) {
    processSingleItem(data);
    renderDevices();
    drawLogs();
});
window.onload = function () {
    document.querySelector('[data-search]').addEventListener('keyup', function (e) {
        searchTerm = e.target.value;
        drawLogs(true);
    });
    document.querySelector('[data-upload]').addEventListener('change', function (e) {
        var files = [].map.call(e.target.files, function (file) { return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                var data = JSON.parse(evt.target.result);
                resolve(__assign({}, data, { device: __assign({}, data.device, { name: "UPLOAD - " + data.device.name }) }));
            };
            reader.onerror = function (evt) {
                reject("An error ocurred reading the file", evt);
            };
            reader.readAsText(file, "UTF-8");
        }); });
        Promise.all(files).then(function (data) {
            data.forEach(processSingleItem);
            renderDevices();
            drawLogs();
        });
    });
};
