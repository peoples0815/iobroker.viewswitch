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

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
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

let viewFolder = 'Views.';


function createObjects(arr){
    let i = 0;
    arr.forEach(function(view) {
        adapter.setObjectNotExistsAsync(viewFolder + view + '.showIAV', {
            type: 'state',
            common: {
                name: 'View is shown in Autoview',
                type: 'boolean',
                def:  false,
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
        
        adapter.setObjectNotExistsAsync(viewFolder +view + '.sWSec', {
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
        adapter.setObjectNotExistsAsync(viewFolder +view + '.isLockView', {
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
        adapter.setObjectNotExistsAsync(viewFolder +view + '.isHomeView', {
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
}

let project = 'Wandtablet';

// Views einlesen
function readViews() { 
    let viewList;
    let jsonFile = dirPath + project+'/vis-views.json';
    if (fs.existsSync(jsonFile)) 
    {
        viewList = Object.keys(JSON.parse(fs.readFileSync(jsonFile, 'utf8')));
        viewList.shift();
        return(viewList);
    } else {
        adapter.log.error('Cannot find ' + configPath);
    }
}


// Intercept and categorize changes
function checkChanges(obj,newState) {
    let viewArr = readViews();
    let nmb = obj.split('.');
    if(nmb[0] == adapterName){
        if(nmb[2] == 'lockViewActive' && newState === true){
            adapter.getState('actualLockView', (err, state) => {
                if (!state || state.val === null) {
                    adapter.log.error('Error bei getting Value of actualLockView');
                } else {
                    let aLV = state.val;
                    adapter.getForeignState('vis.0.control.data', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of vis.0.control.instance');
                        } else {
                            if(state.val != project + '/' + aLV){
                                switchToViewImmediate(project+'/'+aLV);
                            }
                        }
                    });
                }
            });
        }
         // View suchen
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
    }
    if(nmb[0] == 'vis'){
        adapter.getState('lockViewActive', (err, state) => {
            if (!state || state.val === null) {
                adapter.log.error('Error bei getting Value of lockViewActive');
            } else {
                if(state.val === true){
//Timeout prüfen?
                    if(timerTout) clearTimeout(timerTout);
                    adapter.setState('switchTimer', 0);
                    adapter.getState('actualLockView', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of actualLockView');
                        } else {
                            if(state.val != newState.split('/').pop()){
                                switchToViewImmediate(project+'/'+state.val);
                            }
                        }
                    });
                } else {
//Timeout prüfen?
                    if(timerTout) clearTimeout(timerTout);
                    adapter.setState('switchTimer', 0);
                    adapter.getState(viewFolder + newState.split('/').pop() + '.sWSec', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of sWSec');
                        } else {
                            if(state.val !== 0 || state.val != '0'){
                                let timerVal = state.val;
                                adapter.getState('actualHomeView', (err, state) => {
                                    if (!state || state.val === null) {
                                        adapter.log.error('Error bei getting Value of actualHomeView');
                                    } else {
                                        if(state.val != newState.split('/').pop()){
                                            adapter.setState('switchTimer', timerVal);
                                            switchToHomeView();
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
};

// Umgehendes Umschalten zur Wunschview
function switchToViewImmediate(view){
    adapter.setForeignState('vis.0.control.instance', 'FFFFFFFF');
    adapter.setForeignState('vis.0.control.data', view);
    adapter.setForeignState('vis.0.control.command', 'changeView');
}

let timerTout;

// Zurück zu Homeview wechseln
function switchToHomeView() {
    timerTout = setTimeout(function () {
        adapter.getState('switchTimer', (err, state) => {
            if (!state || state.val === null) {
                adapter.log.error('Error by getting Value switchTimer');
            } else {
                let timer = parseInt(state.val, 10);
                if (timer > 1) {
                    adapter.getState('lockViewActive', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of lockViewActive');
                            } else {
                                if(state.val === true){
                //Timeout prüfen?
                                    if(timerTout) clearTimeout(timerTout);
                                    adapter.setState('switchTimer', 0);
                                    adapter.getState('actualLockView', (err, state) => {
                                        if (!state || state.val === null) {
                                            adapter.log.error('Error bei getting Value of actualLockView');
                                        } else {
                                            if(state.val != newState.split('/').pop()){
                                                switchToViewImmediate(project+'/'+state.val);
                                            }
                                        }
                                    });
                                } else {
                                    adapter.setState('switchTimer',timer - 1);
                                    switchToHomeView(); 
                                }
                            }
                    });
                }
                else{
                    adapter.setState('switchTimer', 0);
                   
                    adapter.getForeignState('vis.0.control.instance', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of vis.0.control.instance');
                        } else {
                            if(state.val == 'undefined') adapter.setForeignState('vis.0.control.instance', 'FFFFFFFF');
                        }
                    });
                    adapter.getState('actualHomeView', (err, state) => {
                        if (!state || state.val === null) {
                            adapter.log.error('Error bei getting Value of actualHomeView');
                        } else {
                            adapter.log.info(project + '/' + state.val)
                            adapter.setForeignState('vis.0.control.data', project + '/' + state.val);
                            adapter.setForeignState('vis.0.control.command', 'changeView');
                        }
                    });
                }
            }
        });
    }, 1000);
}




//View für Lockscreen ändern
function changeLockView(arr,activeLockView){
    arr.forEach(function(view) {
        if(activeLockView == view){
            adapter.log.info('**Active Lockview is now: '+ activeLockView);
            adapter.setState('actualLockView', activeLockView);
        }
        else{
            adapter.setState(viewFolder + view +'.isLockView',  false);
        }   
    });
}
//Home-View ändern
function changeHomeView(arr,activeHomeView){
    arr.forEach(function(view) {
        if(activeHomeView == view){
            adapter.log.debug('**Active Homeview is now: '+ activeHomeView);
            adapter.setState('actualHomeView', activeHomeView);
        }
        else{
            adapter.setState(viewFolder + view +'.isHomeView',  false);
        }   
    });
}








//adapter.getForeignState('javascript.0.Ordner.Datenpunkt', function (err, state) {


//adapter.subscribeForeignStates('vis.0.control.data'); 



async function main() {
    if(readViews()){
        adapter.log.info(readViews());
        createObjects(readViews());
    }
    
    
    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    //adapter.log.info('config option1: ' + adapter.config.option1);
    
    //adapter.log.info('config VisProjekt: ' + adapter.config.visprojekt);
    //adapter.log.info('Adaptername: ' + adapterName);
    
    
    
    
    
    /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
    */
    
    fs.readdir(dirPath, (err, files) => { 
      if (err) 
        adapter.log.info(err); 
      else { 
        files.forEach(file => { 
            let isDirExists = fs.existsSync(dirPath + file) && fs.lstatSync(dirPath + file).isDirectory();
            if(isDirExists === true){
                if(fs.existsSync(dirPath + file + viewsJsonFile)){
                    adapter.log.info('**********************************'); 
                    adapter.log.info(file);
                    adapter.log.info('**********************************'); 
                }
            }
        }) 
      } 
    }) 
   

    //ViewSwitch Folder Subscription
    adapter.subscribeStates(viewFolder +'*');
    
    //ViewSwitch Folder Subscription
    adapter.subscribeStates('lockViewActive');
    
    //Vis data Subscription
    adapter.subscribeForeignStates('vis.0.control.data'); 
 
    
    // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
    adapter.subscribeStates('testVariable');
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
        adapter.log.info('check user admin pw iobroker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', (res) => {
        adapter.log.info('check group user admin group admin: ' + res);
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