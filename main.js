'use strict';

/*
 * Created with @iobroker/create-adapter v1.26.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
 const fs = require("fs");

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
const adapterName    = require('./package.json').name.split('.').pop();
const dirPath        = '/opt/iobroker/iobroker-data/files/vis.0/';
const viewsJsonFile  = '/vis-views.json'

let adapter;

let viewFolder = 'Views';

let timerTout;
let i = 0;

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
    
    //Vis data Subscription
   
    // Create the adapter and define its methods
    return adapter = utils.adapter(Object.assign({}, options, {
        name: 'viewswitch',

        // The ready callback is called when databases are connected and adapter received configuration.
        // start here!
        ready: main, // Main method defined below for readability

        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: (callback) => {
            try {
                // Here you must clear all timeouts or intervals that may still be active
                // clearTimeout(timeout1);
                // clearTimeout(timeout2);
                // ...
                // clearInterval(interval1);

                callback();
            } catch (e) {
                callback();
            }
        },

        
        
        
        
        // If you need to react to object changes, uncomment the following method.
        // You also need to subscribe to the objects with `adapter.subscribeObjects`, similar to `adapter.subscribeStates`.
        // objectChange: (id, obj) => {
        //     if (obj) {
        //         // The object was changed
        //         adapter.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        //     } else {
        //         // The object was deleted
        //         adapter.log.info(`object ${id} deleted`);
        //     }
        // },

   
        // is called if a subscribed state changes
        stateChange: (id, state) => {
            if (state) {
                // The state was changed
                checkChanges(id,state.val); 
         
                adapter.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            } else {
                // The state was deleted
                adapter.log.info(`state ${id} deleted`);
            }
        },

        // If you need to accept messages in your adapter, uncomment the following block.
        // /**
        //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
        //  * Using this method requires "common.message" property to be set to true in io-package.json
        //  */
        // message: (obj) => {
        //     if (typeof obj === 'object' && obj.message) {
        //         if (obj.command === 'send') {
        //             // e.g. send email or pushover or whatever
        //             adapter.log.info('send command');

        //             // Send response in callback if required
        //             if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        //         }
        //     }
        // },
    }));
}


// Create not existing Objects
async function createObjects(arr){
    let i = 0;
    arr.forEach(function(view) {
        adapter.setObjectNotExistsAsync(viewFolder, {
            type: 'folder',
            native: {},
        });
        adapter.setObjectNotExistsAsync(viewFolder + '.' + view, {
            type: 'folder',
            native: {},
        });
        adapter.setObjectNotExistsAsync(viewFolder + '.' + view + '.showIAV', {
            type: 'state',
            common: {
                name: 'View is shown in Autoview',
                type: 'boolean',
                def:  true,
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
        
        adapter.setObjectNotExistsAsync(viewFolder + '.' + view + '.sWSec', {
            type: 'state',
            common: {
                name: 'Time this View is shown',
                type: 'number',
                def:  '25',
                role: 'indicator',
                read: true,
                unit:  's',
                write: true,
            },
            native: {},
        });
        adapter.setObjectNotExistsAsync(viewFolder + '.' + view + '.isLockView', {
            type: 'state',
            common: {
                name: 'View to be shown if lock is active',
                type: 'boolean',
                def:  false,
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
        adapter.setObjectNotExistsAsync(viewFolder + '.' + view + '.isHomeView', {
            type: 'state',
            common: {
                name: 'Homeview of Project',
                type: 'boolean',
                def:  i===0?true:false,
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
    i++;        
    });
    adapter.setObjectNotExistsAsync('actualHomeView', {
        type: 'state',
        common: {
            name: 'View what is set as Home',
            type: 'string',
            role: 'indicator',
            read: true,
            write: true,
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('actualLockView', {
        type: 'state',
        common: {
            name: 'View what is set as Lockview',
            type: 'string',
            def:  false,
            role: 'switch',
            read: true,
            write: true,
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('lockViewActive', {
        type: 'state',
        common: {
            name: 'Forces Lockview to be shown',
            type: 'boolean',
            def:  false,
            role: 'switch',
            read: true,
            write: true,
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('switchAutomatic', {
        type: 'state',
        common: {
            name: 'Automatic change Views',
            type: 'boolean',
            def:  false,
            role: 'switch',
            read: true,
            write: true,
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('switchAutomaticTimer', {
        type: 'state',
        common: {
            name: 'Timer for automatic View Change',
            type: 'number',
            role: 'indicator',
            read: true,
            unit: 's',
            write: true,
           
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('switchTimer', {
        type: 'state',
        common: {
            name: 'Time to show actual View',
            type: 'number',
            role: 'indicator',
            read: true,
            unit: 's',
            write: true,
        },
        native: {},
    });
    adapter.setObjectNotExistsAsync('existingProjects', {
        type: 'state',
        common: {
            name: 'List of existing Projects',
            type: 'string',
            role: 'indicator',
            read: true,
            write: true,
        },
        native: {},
    });
}

// delete not longer existing views
async function deleteVisObjects(arr){
    try{
        const states = await adapter.getStatesAsync('Views' + '.*');
        for (const idS in states){
           let nmb = idS.split('.')[3];
            if(arr.includes(nmb)){
                adapter.log.debug('View exists in Json: '+idS)
            } else {
                adapter.log.debug('View does NOT exist in Json: '+idS)
                await adapter.delObject(idS);
            } 
        }
    } catch (err) {
        adapter.log.error(err);
    }
}

// read existing views
function readViews() { 
    let viewList;
        let jsonFile = dirPath + adapter.config.visProject+'/vis-views.json';
   
    
    if (fs.existsSync(jsonFile)) 
    {
        viewList = Object.keys(JSON.parse(fs.readFileSync(jsonFile, 'utf8')));
        viewList.shift();
        return(viewList);
    } else {
        adapter.log.error('Cannot find ' + dirPath + adapter.config.visProject+'/vis-views.json');
    }
}

// check the changed datapoints
async function checkChanges(obj,newState){
  try{
        const switchTimer = await adapter.getStateAsync('switchTimer');
        const lockViewActive = await adapter.getStateAsync('lockViewActive');
        const switchAutomatic = await adapter.getStateAsync('switchAutomatic')
        const actualLockView = await adapter.getStateAsync('actualLockView');
        const actualHomeView = await adapter.getStateAsync('actualHomeView');
        const switchAutomaticTimer = await adapter.getStateAsync('switchAutomaticTimer');
        const visData = await adapter.getForeignStateAsync('vis.0.control.data');
      
        let viewArr = readViews();
        let nmb = obj.split('.');
 /*     
        
if(nmb[0] == 'vis'){
            const sWSec = await adapter.getStateAsync(viewFolder + '.' + newState.split('/').pop() + '.sWSec');
            if(lockViewActive.val === false){
                if(sWSec.val !== 0 || sWSec.val != '0'){
                    if(actualHomeView.val != newState.split('/').pop()){
                        adapter.log.info('ahv: '+actualHomeView.val+'visdata:'+newState.split('/').pop())
                        await adapter.setStateAsync('switchTimer', sWSec.val);
                        switchToHomeView();
                         adapter.log.info('+++++++++++++ Hier sind wir +++++++++++++++++++')
                    }
                    else {
                        adapter.log.info('+++++++++++++ Homeview ist erreicht! +++++++++++++++++++')
                        if(timerTout) clearTimeout(timerTout);
                        adapter.setState('switchTimer', 0);
                    }
                } 
            }
        }
////////////////////////
*/      
        
        if(nmb[0] == adapter.name){
            if(nmb[2] == 'switchAutomatic'){
                if(switchAutomatic.val === true){
                    autoSwitchView(0);
                } else {
                    if(timerAutoSV) clearTimeout(timerAutoSV);
                    adapter.setState(switchTimer, 0);
                    switchToViewImmediate(adapter.config.visProject+'/'+actualHomeView.val);
                }
            } 
            // Standard Views festlegen
            if(viewArr.includes(nmb[nmb.length - 2]) === true){ 
                if(nmb[nmb.length - 1] == 'isLockView'){
                    if(newState === true){
                        changeLockView(readViews(),nmb[nmb.length - 2]);
                    }
                }
                if(nmb[nmb.length - 1] == 'isHomeView'){
                    if(newState === true){
                        changeHomeView(viewArr,nmb[nmb.length - 2]);
                    }
                }
            }
            if(nmb[2] == 'lockViewActive'){
                if(lockViewActive.val === true){
                    if(actualLockView.val == ''){
                        adapter.log.info('!!!First define your LockView!!!');
                        await adapter.setStateAsync('lockViewActive', false);
                    } else {
                        if(timerTout) clearTimeout(timerTout);
                        await adapter.setStateAsync('switchTimer', 0);
                        if(actualLockView.val != visData.val.split('/').pop()){
                            await adapter.setStateAsync(switchAutomaticTimer,0);
                            switchToViewImmediate(adapter.config.visProject+'/'+actualLockView.val);
                        }
                    }
                } else {
                    if(timerTout) clearTimeout(timerTout);
                    await adapter.setStateAsync('switchTimer', 0);
                    switchToHomeView();
                } 

            }
        }
        if(nmb[0] == 'vis'){
            const sWSec = await adapter.getStateAsync(viewFolder + '.' + newState.split('/').pop() + '.sWSec');
            if(lockViewActive.val === true){
                if(timerTout) clearTimeout(timerTout);
                await adapter.setStateAsync('switchTimer', 0);
                if(actualLockView.val != newState.split('/').pop()){
                    await adapter.setStateAsync(switchAutomaticTimer,0);
                    switchToViewImmediate(adapter.config.visProject+'/'+actualLockView.val);
                }
            } else {
                if(timerTout) clearTimeout(timerTout);
                await adapter.setStateAsync('switchTimer', 0);
                if(sWSec.val !== 0 || sWSec.val != '0'){
                    if(actualHomeView.val != newState.split('/').pop()){
                        await adapter.setStateAsync('switchTimer', sWSec);
                        switchToHomeView();
                    } 
                }
            }
        }
        
  } catch (error) {
    adapter.log.error('checkChanges:'+error);
  }
}

// Switch immediately to Wishview
function switchToViewImmediate(view){
    adapter.setForeignState('vis.0.control.instance', 'FFFFFFFF');
    adapter.setForeignState('vis.0.control.data', view);
    adapter.setForeignState('vis.0.control.command', 'changeView');
}



// Switch to configured Homeview
async function switchToHomeView() {
      try {
          const switchTimer = await adapter.getStateAsync('switchTimer');
          const lockViewActive = await adapter.getStateAsync('lockViewActive');
          const actualLockView = await adapter.getStateAsync('actualLockView');
          const actualHomeView = await adapter.getStateAsync('actualHomeView');
          const switchAutomatic = await adapter.getStateAsync('switchAutomatic');
          const visInstance = await adapter.getForeignStateAsync('vis.0.control.instance');
          
          if(switchAutomatic.val !== true){
                if(actualHomeView.val == ''){
                    adapter.log.info('!!!First define your HomeView!!!');
                } else {
                    timerTout = await setTimeout(async function () {
                         let timer = parseInt(switchTimer.val, 10)
                         if(timer > 1){
                             if(lockViewActive.val === true){
                                 if(timerTout) clearTimeout(timerTout);
                                 await adapter.setStateAsync('switchTimer', 0);
                                 if(actualLockView.val != actualLockView.val.split('/').pop()){
                                     switchToViewImmediate(adapter.config.visProject+'/'+actualLockView.val);
                                 }
                             } else {
                                await adapter.setStateAsync('switchTimer',timer - 1);
                                switchToHomeView(); 
                            }
                         } else {
                             await adapter.setStateAsync('switchTimer', 0);
                             if(visInstance.val == undefined) await adapter.setForeignStateAsync('vis.0.control.instance', 'FFFFFFFF');

                             await adapter.setForeignStateAsync('vis.0.control.data', adapter.config.visProject + '/' + actualHomeView.val);
                             await adapter.setForeignStateAsync('vis.0.control.command', 'changeView');

                         }
                    }, 1000); 
                }
          }
    } catch (error) {
      adapter.log.error(error);
    }
}

// Automatic switch the existing Views

//...... Not working yet 
// Timer läuft immer noch einmal durch

async function autoSwitchView(i){
    try{
        let viewArr = readViews();
        const switchTimer = await adapter.getStateAsync('switchTimer');
        const switchAutomatic = await adapter.getStateAsync('switchAutomatic');
        const switchAutomaticTimer = await adapter.getStateAsync('switchAutomaticTimer');
        const actualHomeView = await adapter.getStateAsync('actualHomeView');

        if(switchAutomatic.val === true){
            if(i == '') i = 0;
            if(i < viewArr.length){
                const showIAV = await adapter.getStateAsync(viewFolder + '.' + viewArr[i]+'.'+'showIAV');
                if(showIAV.val === true){
                    let timerAutoSV = await setTimeout(async function () {
                        //if(switchTimer.val === 0 || switchTimer.val == '0') adapter.setState(switchTimer, switchAutomaticTimer.val)
                        let timer = parseInt(switchTimer.val, 10);
                        if (timer > 1) {
                            await adapter.setStateAsync('switchTimer', timer -1);
                            //await adapter.setStateAsync('switchAutomaticTimer', timer - 1);
                            autoSwitchView(i);
                        }
                        else{
                            await adapter.setStateAsync('switchTimer', switchAutomaticTimer.val);
                            if(switchAutomatic.val === true) switchToViewImmediate(adapter.config.visProject+'/'+viewArr[i]);
                            autoSwitchView((i+1));
                        }
                    }, 1000);
                } else {
                    autoSwitchView((i+1));
                    adapter.log.info('For this View AV is disabled')
                }
            } else {
                autoSwitchView(0);
                adapter.log.info('Jump back to first AutoView')
            }
        } else {
            if(timerAutoSV) clearTimeout(timerAutoSV);
            await adapter.setStateAsync(switchTimer, 0);
            switchToViewImmediate(adapter.config.visProject+'/'+actualHomeView.val);
        }
    } catch (error) {
        adapter.log.error(error);
    }
}
           

//Change View for Lockscreen
function changeLockView(arr,activeLockView){
    arr.forEach(function(view) {
        if(activeLockView == view){
            adapter.log.info('**Active Lockview is now: '+ activeLockView);
            adapter.setState('actualLockView', activeLockView);
        }
        else{
            adapter.setState(viewFolder + '.' + view +'.isLockView',  false);
        }   
    });
}
//Change View for Homescreen
function changeHomeView(arr,activeHomeView){
    arr.forEach(function(view) {
        if(activeHomeView == view){
            adapter.log.debug('**Active Homeview is now: '+ activeHomeView);
            adapter.setState('actualHomeView', activeHomeView);
        }
        else{
            adapter.setState(viewFolder + '.' + view +'.isHomeView',  false);
        }   
    });
}
//////////////////////////////////
    
    
//Projekte auslesen

///////////////////////////////////////




 

function generateProjectList(dirPath, viewsJsonFile)
{
     let projectList = '';
     fs.readdir(dirPath, (err, files) => { 
      if (err) 
        adapter.log.err(err); 
      else { 
        files.forEach(file => { 
            let isDirExists = fs.existsSync(dirPath + file) && fs.lstatSync(dirPath + file).isDirectory();
            if(isDirExists === true){
                if(fs.existsSync(dirPath + file + viewsJsonFile)){
                    projectList += file+',';
                }
            }
        })
        adapter.setState('existingProjects', projectList.substr(0, projectList.length-1));
      }                             
    }) 
}

////////////////////////////////

async function main() {
    
    
    if(readViews()){
       // adapter.log.info(readViews());
        createObjects(readViews());
        deleteVisObjects(readViews());
    }
    
    
    generateProjectList(dirPath, viewsJsonFile)
    
    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    //adapter.log.info('config option1: ' + adapter.config.option1);
    

    //adapter.log.info('config VisProjekt: ' + adapter.config.visprojekt);
    //adapter.log.info('Adaptername: ' + adapterName);
    
    fs.watchFile(dirPath + adapter.config.visProjekt+'/vis-views.json', (curr, prev) => {
        createObjects(readViews());
        deleteVisObjects(readViews());
    });
    
    //generateProjectList(dirPath, viewsJsonFile);
    
   
   
    
   
    
    
    /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
    */
   
    
    //SwitchAutomatic Subscription
    adapter.subscribeStates('switchAutomatic')
    
    //ViewSwitch Folder Subscription
    adapter.subscribeStates(viewFolder + '.' +'*');
    
    //ViewSwitch Folder Subscription
    adapter.subscribeStates('lockViewActive');
    
    //Vis data Subscription
    adapter.subscribeForeignStates('vis.0.control.data'); 
    
    
   

    // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
    // adapter.subscribeStates('testVariable');
    // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
    // adapter.subscribeStates('lights.*');
    // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
    // adapter.subscribeStates('*');

    /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
    */
    // the variable testVariable is set to true as command (ack=false)
    await adapter.setStateAsync('testVariable', true);

    // same thing, but the value is flagged "ack"
    // ack should be always set to true if the value is received from or acknowledged from the target system
    await adapter.setStateAsync('testVariable', { val: true, ack: true });

    // same thing, but the state is deleted after 30s (getState will return null afterwards)
    await adapter.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', (res) => {
       // adapter.log.info('check user admin pw iobroker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', (res) => {
       // adapter.log.info('check group user admin group admin: ' + res);
    });
}



// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export startAdapter in compact mode
    module.exports = startAdapter;
} else {
    // otherwise start the instance directly
    startAdapter();
}