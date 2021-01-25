const { app, BrowserWindow, ipcMain, remote } = require('electron');
const path = require('path');
const robot = require("robotjs");

robot.setKeyboardDelay(0); //MAKES FOR NO DELAY IN BETWEEN KEY PRESSES


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}



const createWindow = () => {
  // Create the browser window.
    const mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    backgroundColor: '#3b3b40',
    fullscreenable: true,
    
    //icon: path.join(__dirname, 'index.html'),
    webPreferences: {        //allows for the use of node from browser window?
      nodeIntegration: true
    }

  });


  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));


  // Open the DevTools.
 // mainWindow.webContents.openDevTools();
};



//================IPC stuff=========================

//listens for events sent from the render process(web page)
var prevKey;
ipcMain.on('asynchronous-message', (event, arg) => {

  //press the key
  if(arg != null && arg != "" ){
    robot.keyToggle(arg, 'down');
    console.log(arg);
  }

     if(prevKey != null && prevKey != "" && prevKey != arg){
       robot.keyToggle(prevKey, 'up');
       console.log('up');
     }


  prevKey = arg;


  //console.log(arg); //
});

//==================================================

/*
robot.keyToggle('a', 'down');
console.log('down');
setTimeout(now, 10000);
function now(){
robot.keyToggle('a', 'up');
console.log("keyup");
}
*/

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
//console.log(apt.getVersion());
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
