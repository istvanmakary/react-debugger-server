# Debugger Server

**This project is belongs to [react-native-debugger](https://github.com/istvanmakary/react-native-debugger).**

![Debugger server UI](http://makary.hu/debugger-server.jpg)

## Installation
**Local:**
- `git clone git@github.com:istvanmakary/react-debugger-server.git`
- `npm install`
- `npm start`

// it will create a debug server on http://localhost:3030/

**Heroku**

- create a new heroku app
- checkout `react-debugger-server` on your computer
- update [Config](#config)
- upload it to your Heroku app via GIT (instructions on Heroku webpage)
- open your app & enjoy 🙂

// it will create a debug server on your heroku e.g. https://your-heroku-app.com/

## Config
- **url** - the url of your server. Change this if you are not running on localhost (default: http://localhost:3030/)
- **limit** - limit of the stored logs on the server (default: 100)
- **port** - port of communication (default: 3030) if you use Heroku set it to 80
- **user** - baseauth user. Change this before deploying to public domain
- **password** - baseauth password. Change this before deploying to public domain

## Hash Generation
To generate the Authorization hash please Base64 encode your **user** and **password** in your configuration. 

Or use this site to get your secret key:
https://www.blitter.se/utils/basic-authentication-header-generator/ 

## Usage
Open your heroku app's url in a **Chrome** browser!

Set up your [react-native-debugger](https://github.com/istvanmakary/react-native-debugger) to transfer device events to your debugger server.

When the first log was transferred, the device will appear as a connected device in the **Connected devices** section of the debugger server UI.

To see device logs open **CONSOLE**!

## Export Device Logs
Each device device log can be downloaded from the debugger server by clicking on the **Download** button. It will gather the logs of the selected device and export it to a json file. These logs can be uploaded to the debugger server later.

## Upload Device Logs
 You can upload your previously downloaded logs, by clicking on upload log file input. The imported device will appear in the connected device list.