const store = {};
const devices = [];
let displayedLogs = [];
let acitveDevice = '';
var socket = io(window.server_url);
let searchTerm = '';

function parseData(data) {
  try {
    return JSON.parse(data);
  } catch(e) {
    return data;
  }
}

function debugDevice(uuid) {
  acitveDevice = unescape(uuid);
  drawLogs(true);
  renderDevices();
}

const getActiveDevice = () => devices.find((d) => d.id === acitveDevice);

function downloadActive() {
  const date = new Date();
  const device = getActiveDevice();
  const text = `{"date": "${date}","device": ${JSON.stringify(device)},"events": ${JSON.stringify(store[acitveDevice])}}`;
  const anchor = document.createElement('a');
  anchor.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  document.body.appendChild(anchor);
  anchor.setAttribute('download', `logs-${acitveDevice}-${date}.txt`);
  anchor.click();
  document.body.removeChild(anchor);
}

function drawLogs(shouldClear) {
  if (shouldClear) {
    console.clear();
    displayedLogs = [];
  }

  if (acitveDevice) {
    store[acitveDevice].forEach((event) => {
      const eventID = event.label + '@' + event.date;
      if (
        !displayedLogs.includes(eventID) && (
          !searchTerm || 
          event.label.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
          event.type.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
        )
      ) {
        let color = '';

        switch(event.logType) {
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
        console.groupCollapsed(
          '%c ' + event.type + 
          ' ' + event.label.substring(0, 50) + 
          ' @ ' + event.date, 'font-weight: bold; color: ' + color
        );
        console.log('%c label: ' , 'font-weight: bold;', event.label);
        console.log('%c type: ' , 'font-weight: bold;', event.type);
        console.log('%c status: ' , 'font-weight: bold;', event.logType);
        console.log('%c payload: ' , 'font-weight: bold;', event.data);
        console.groupEnd();
      }
    });
  }
}

function renderDevices() {
  const wrapper = document.querySelector('[data-device-list]');
  const activeDeviceWrapper = document.querySelector('[data-device-details]');
  const html = devices.map(({ id, name }) => (
    `<p>
      <label>
        <input 
          name="device" 
          type="radio" 
          value="" 
          ${(acitveDevice === id ? 'checked' : '')} 
          onChange="debugDevice('${escape(id)}')"
        />
        ${name} - ${id}
      </label> 
      ${acitveDevice === id 
        ? `<button type="button" onClick="downloadActive()">download</button>` 
        : ''
      }
    </p>`
  ));
  wrapper.innerHTML = html.join(' ');

  if (acitveDevice) {
    const acitveDevice = getActiveDevice();
    activeDeviceWrapper.innerHTML = `
      <h2>Device Details:</h2>
      <p style="margin: 5px 0">Platform: <b>${acitveDevice.platform}</b></p>
      <p style="margin: 5px 0">Name: <b>${acitveDevice.name}</b></p>
      <p style="margin: 5px 0">Device ID: <b>${acitveDevice.id}</b></p>
      <p style="margin: 5px 0">Bundle ID: <b>${acitveDevice.bundleId}</b></p>
      <p style="margin: 5px 0">Build Number: <b>${acitveDevice.buildNumber}</b></p>
      <p style="margin: 5px 0">Country: <b>${acitveDevice.country}</b></p>
    `;

  }
}

const processSingleItem = (data) => {
  const {
    events = [],
    device = {},
  } = data;
  events.forEach((event) => {
    store[device.id] = [
      ...(store[device.id] || []),
      event,
    ];
    if (!devices.find((d) => d.id === device.id)) {
      if (!acitveDevice) {
        acitveDevice = device.id;
      }
      devices.push(device);
    }
  });
}

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


window.onload = () => {
  document.querySelector('[data-search]').addEventListener('keyup', (e) => {
    searchTerm = e.target.value;
    drawLogs(true);
  });

  document.querySelector('[data-upload]').addEventListener('change', (e) => {
    const files = [].map.call(e.target.files, (file) => new Promise((resolve, reject) => {
      var reader = new FileReader();
            
      reader.onload = function (evt) {
        const data = JSON.parse(evt.target.result);
        resolve({
          ...data,
          device: {
            ...data.device,
            name: `UPLOAD - ${data.device.name}`,
          },
        });
      };

      reader.onerror = function (evt) {
        reject("An error ocurred reading the file",evt);
      };

      reader.readAsText(file, "UTF-8");
    }));

    Promise.all(files).then((data) => {
      data.forEach(processSingleItem);
      renderDevices();
      drawLogs();
    });
  });
};