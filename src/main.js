// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu} = require('electron');
const path = require('node:path');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

//DISABLE THE APPLICATION MENU
Menu.setApplicationMenu(null);

//INIT DEFAULT APP VARS
let withDevtools 	= false;
let appMode 		= 'dev';
let sshPassPath 	= '';
let platformMode 	= 'unknown';
let mainWindow;

//IDENTIFY THE PLATFORM
if(process.platform == 'linux') platformMode = 'linux';
else if(process.platform == 'win32') platformMode = 'win';
else if(process.platform == 'darwin') platformMode = 'mac';

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

let appMethods = {

	quit: (e, data) => {
		app.quit();
	},

	testSSH: (e, data) => {

		if(platformMode == 'win'){

			var d = {
				err: false,
				msg: 'connected successfully',
				eventHash: e.eventHash,
			}

			if(d.err){
				dialog.showErrorBox("Something went wrong", "An error occurred. Message: "+d.msg);
			}
			else{
				dialog.showMessageBoxSync({
					message: 'Hell yeah!',
					detail: 'Successfully connected to the server',
				})
			}

			e.event.sender.send('fromMain', {err: d.err, eventName: 'testSSH', msg: d.msg, eventHash: e.eventHash});
		}

		else if(platformMode == 'linux' || platformMode == 'mac'){
			var q = sshPassPath+" -v -p "+data.password+" ssh -ff -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -p "+data.port+" "+data.userName+"@"+data.host+" whoami";

			runBash(e, q, function(d){
				if(d.err){
					dialog.showErrorBox("Something went wrong", "An error occurred. Message: "+d.msg);
				}
				else{
					dialog.showMessageBoxSync({
						message: 'Hell yeah!',
						detail: 'Successfully connected to the server',
					})
				}
				e.event.sender.send('fromMain', {err: d.err, eventName: 'testSSH', msg: d.msg, eventHash: d.eventHash});
			});
		}


	},

	setWindowSize: (e, data) => {
		mainWindow.setSize(data.width, data.height, data.animate);
		mainWindow.center();
	},

	tryIt: (e, data) => {
		if(platformMode == 'linux'){
			require('child_process').exec('gnome-terminal -- ssh '+data.keyName, (err, stdout, stderr) => {
				var d = {
					err: err ? true : false,
					msg: err ? stderr : stdout,
					eventName: e.name,
					eventHash: e.eventHash
				};

				e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash});
			});
		}
		else if(platformMode == 'win'){
			var q = 'plink -ssh '+data.keyName;
			runBash(e, q, function(d){
				e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash});
			});
		}
		else if(platformMode == 'mac'){
			var tmpCommandName = '/tmp/tryit-'+Date.now()+".command";
			runBash(e,"echo \"#!/bin/bash\n\ssh "+data.keyName+"\" > "+tmpCommandName+"; chmod +x "+tmpCommandName+"; open "+tmpCommandName);

		}
	},

	unleashMagic: (e, data) => {
		var q = 'ssh-keygen -t rsa -f ~/.ssh/'+data.keyName+' -N ""';
		runBash(e, q, function(d){
			if(d.err){
				dialog.showErrorBox("Something went wrong", d.msg);
				e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash}); 
			}
			else {
				runBash(e, "ssh-add ~/.ssh/"+data.keyName, function(d){
					if(d.err){
						dialog.showErrorBox("Something went wrong", d.msg);
						e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash});
					} 
					else{            
						var q = sshPassPath+" -v -p '"+data.password+"' ssh-copy-id -f -i ~/.ssh/"+data.keyName+".pub -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -p "+data.port+" "+data.userName+"@"+data.host;
						runBash(e,q, function(d){
							if(d.err){
								dialog.showErrorBox("Something went wrong", d.msg);
								e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash});
							}
							else {
								runBash(e,"echo \"\nHost "+data.keyName+"\n\tHostName "+data.host+"\n\tUser "+data.userName+"\n\tIdentityFile ~/.ssh/"+data.keyName+"\n\tIdentitiesOnly yes\n\tPort "+data.port+"\" >> ~/.ssh/config", function(d){
									if(d.err) dialog.showErrorBox("Something went wrong", d.msg);
									else dialog.showMessageBoxSync({type: 'info', message: 'Nice!', detail: 'Successfully installed the new key'})
								})
								e.event.sender.send('fromMain', {err: d.err, eventName: e.name, msg: d.msg, eventHash: d.eventHash});
							}
						})
					}
				});        
			}
		})
	}
}

ipcMain.handle('dispatch', (event, name, args, eventHash) => {
	return appMethods[name]({event: event, name: name, eventHash: eventHash.eventHash}, args);
});



function createWindow() {

  // Create the browser window.
	mainWindow = new BrowserWindow({
		width: withDevtools ? 900 : 600,
		height: withDevtools ? 1200 : 650,
		icon: path.join(__dirname, 'locksmith-icon.png'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: true,
		}
	});

	if(!withDevtools) mainWindow.setResizable(false);

  	//LOAD THE MAIN VIEW
	mainWindow.loadFile(path.join(__dirname, 'index.html'));

	//LISTEN FOR CONSOLE LOG FROM RENDERER
	mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
		try{
			var tmpMessage = JSON.parse(message);
			message = tmpMessage;
		}
		catch {
      		//SILENT
		}
		console.log(sourceId + " (" + line + ")", message);
	});

  	// CHECK IF DEVTOOL NEEDS TO BE DISPLAYED
	if(withDevtools) mainWindow.webContents.openDevTools();

	if(platformMode == 'unknown'){
		dialog.showErrorBox("Unsupported Operating System", "Locksmith only supports Windows, Linux, and MacOS");
		app.quit();		
	}
	

	//MAC AND LINUX REQUIRE SSHPASS
	if(platformMode == 'mac' || platformMode == 'linux'){

		//CHECK IF SSHPASS IS INSTALLED
		checkForSshPass();
	}

	//WINDOWS REQUIRES PLINK
	else{
		checkForPlink();
    	//check for plink
	}

	//CHECK IF THIS IS A COMPILED APP OR A DEV APP
	require('fs').access(process.resourcesPath+'/scripts/production-check', (err) => {
		appMode = err ? 'dev' : 'prod';
		withDevtools = appMode == 'prod' ? false : withDevtools;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  //if (process.platform !== 'darwin') app.quit()
	app.quit();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function runBash(...args) {

	var callback, eventName, cmd;
	var eventData = {event : null, eventName : null, eventHash : null};

	for(var x in args){
		if(typeof(args[x]) == 'function') callback = args[x];
		else if(typeof(args[x]) == 'string'){
			if(typeof(appMethods[x]) == 'function') eventData.eventName = args[x];
			else cmd = args[x];
		}
		else if(typeof(args[x]) == 'object') for(y in args[x]) for(z in eventData) if(z == y) eventData[z] = args[x][y];
	}

	e         = eventData.event;
	eventName = eventData.event;
	eventHash = eventData.eventHash; 

	if(!cmd){
		if(typeof(callback) == 'function') callback({err: true, eventHash: eventHash, eventName: eventName, msg: "No command supplied"});
		throw "No command supplied";
	}

	return require('child_process').execFile('/usr/bin/env', [ 'bash', '-c', cmd], (err, data, errMsg) => {
		var msg = data.toString();
		if(err && !errMsg.length && msg.length) err = false;
		if(err) msg = errMsg;
		if(typeof(callback) == 'function') callback({err: (err ? true : false), eventHash: eventHash, eventName: eventName, msg: msg});
	});
}

async function runWinCmd(...args) {

	var callback, eventName, cmd;
	var eventData = {event : null, eventName : null, eventHash : null};

	for(var x in args){
		if(typeof(args[x]) == 'function') callback = args[x];
		else if(typeof(args[x]) == 'string'){
			if(typeof(appMethods[x]) == 'function') eventData.eventName = args[x];
			else cmd = args[x];
		}
		else if(typeof(args[x]) == 'object') for(y in args[x]) for(z in eventData) if(z == y) eventData[z] = args[x][y];
	}

	e         = eventData.event;
	eventName = eventData.event;
	eventHash = eventData.eventHash;

	if(!cmd){
		if(typeof(callback) == 'function') callback({err: true, eventHash: eventHash, eventName: eventName, msg: "No command supplied"});
		throw "No command supplied";
	}
	let execFile = require('child_process').execFile;
	execFile = require('util').promisify(execFile);
	let response;

	execFile('cmd.exe', ['/c', cmd], {windowsHide: true}).then(
		(result) => {
			response = {err: false, eventHash: eventHash, eventName: eventName, msg: result.stdout};
			if(typeof(callback) == 'function') callback(response);
		},
		(err) => {
			response = {err: true, eventHash: eventHash, eventName: eventName, msg: err};
			if(typeof(callback) == 'function') callback(response);
		}
	);

	return response;

}

function checkForPlink(){

	var q = 'plink --help';

	runWinCmd(q, (d) => {
		if(d.err){

			//SHOW A DIALOG BOX
			dialog.showMessageBox({
				type 	: 'question',
				title 	: 'Waiting for install',
				message : "Putty is required to use Lockmith. Click okay to install it.",
				buttons : ['Okay','Cancel']
			})

			//HANDLE CONFIRM/DECLINE DIALOG BOX
			.then((result) => {
				if(result.response !== 0){
					app.quit()
				}
				else{

					let execFile = require('child_process').exec;
					execFile = require('util').promisify(execFile);
					let response;

					var puttyInstaller = (appMode == 'prod' ? process.resourcesPath : app.getAppPath()) +'\\scripts\\putty-64bit-0.82-installer.msi';

					execFile('msiexec.exe /i "'+puttyInstaller+'"').then(
						(result) => {
							console.log(result)
							response = {err: false, eventHash: d.eventHash, eventName: d.eventName, msg: result.stdout};
							if(typeof(callback) == 'function') callback(response);
						},
						(err) => {
							dialog.showErrorBox("Putty is required", "Please install putty and try again");
							app.quit();
						}
					);
				}
			});
		}
	});
}

//CHECK IF SSHPASS IS INSTALLED
function checkForSshPass(displayInstalled = false, initialCheck = true){

	//LUNUX VS MAC EXECUTABLE CHECK
	var permCheck = platformMode == 'linux' ? '-executable' : '-perm +111';

	//TRY TO FIND THE PATH TO SSHPASSS
	runBash('find /usr /opt -type f -name "sshpass" '+permCheck+' -print -quit 2>/dev/null', (d) => {

		//CHECK FOR A NON ERROR MESSAGE CONTAINING A PATH TO SSHPASS
		if(!d.err && d.msg.trim().length){

			//SPLIT THE LINES INTO AN ARRAY
			var msgParts = d.msg.split('\n');

			//LOOP THROUGH THE LINES
			for(var x in msgParts){

				//CHECK IF THE LINE IS NOT EMPTY
				if(msgParts[x].trim().length){

					//SET THE SSHPASSPATH
					sshPassPath = msgParts[x].trim();

					//BREAK OUT OF THE LOOP
					break;
				}
			}
		}

		//CHECK IF THE SSHPASSPATH VAR IS EMPTY
		if(sshPassPath == ''){

			//TELL THE USER THAT SSHPASS NEEDS TO BE INSTALLED
			dialog.showMessageBox({
				type 	: 'question',
				title 	: 'sshpass missing',
				message : "sshpass is required for Locksmith to work. Click okay to install",
				buttons : ['Okay', 'Cancel' ]
			})

			//HANDLE CONFIRM/DECLINE RESPONSE FROM THE DIALOG
			.then((result) => {

				//EXIT THE APP IF THE USER CLICKED CANCEL
				if (result.response === 1) app.quit();

				//CHECK IF THE OS IS LINUX
				if(platformMode == 'linux'){

					//OPEN A TERMINAL WINDOW TO INSTALL SSHPASSS
					require('child_process').exec('gnome-terminal -- sudo apt-get install sshpass', (err, stdout, stderr) => {

						//SHOW A DIALOG BOX
						dialog.showMessageBox({
							type 	: 'question',
							title 	: 'Waiting for install',
							message : "follow the prompt in the terminal window that just opened, then click okay once sshpass has finished installing.",
							buttons : ['Okay','Cancel']
						})

						//HANDLE CONFIRM/DECLINE DIALOG BOX
						.then((result) => { result.response !== 0 ?  app.quit() : checkForSshPass(true); });
					})
				}

				//THE PLATFORM IS MAC
				else{

					var tmpCommandName = "installsshpass-"+Date.now()+".command";
					var tmpCommandPath = '/tmp/'+tmpCommandName;

					var cmdString = "";
					cmdString += 'if [[ echo "$(command -v brew 2>&1)" | grep -q "brew" ]]; then'+"\n";
					cmdString += '  	sudo brew install esolitos/ipa/sshpass'+"\n";
					cmdString += 'else'+"\n";
					cmdString += '  	sudo curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh'+"\n";
					cmdString += '  	sudo brew install esolitos/ipa/sshpass'+"\n";
					cmdString += 'fi'+"\n";
					cmdString += 'osascript -e \'tell application "Terminal" to close (every window whose name contains "'+tmpCommandName+'")\' & exit;';

					runBash(e,"echo \"#!/bin/bash\n\ssh "+data.keyName+"\" > "+tmpCommandPath+"; chmod +x "+tmpCommandPath+"; open "+tmpCommandPath, (err, stdout, stderr) => {

						//SHOW A DIALOG BOX
						dialog.showMessageBox({
							type 		: 'question',
							title 	: 'Waiting for install',
							message : "follow the prompt in the terminal window that just opened, then click okay once sshpass has finished installing.",
							buttons : ['Okay','Cancel']
						})

						//HANDLE CONFIRM/DECLINE DIALOG BOX
						.then((result) => { result.response !== 0 ?  app.quit() : checkForSshPass(true); });

					});
				}
			});
		}

		//SSHPASS WAS INSTALLED SO SHOW A DIALOG
		else if(displayInstalled === true){
			dialog.showMessageBoxSync({
				type: 'info', 
				title: 'Nice!', 
				detail: "sshpass Successfully installed to: "+sshPassPath
			});
		}
	});
}