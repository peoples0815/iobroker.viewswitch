'use strict';


var fs = require("fs");
var dirPath        = '/opt/iobroker/iobroker-data/files/vis.0/';
var viewsJsonFile  = '/vis-views.json'

function generateProjectList(dirPath, viewsJsonFile){
    var text = '';
    fs.readdir(dirPath, (err, files) => { 
        if(err){
                console.log('Cannot parse views file "' + dirPath + file + 'vis-views.json"');
                window.alert('Cannot parse views file "' + dirPath + file + 'vis-views.json');
        } else { 
                files.forEach(file => { 
                    var isDirExists = fs.existsSync(dirPath + file) && fs.lstatSync(dirPath + file).isDirectory();
                    if(isDirExists === true){
                        if(fs.existsSync(dirPath + file + viewsJsonFile)){
                                //text += '<li class="ui-state-default project-select ' + (file + '/' === adapter.config.selprojekt ? 'ui-state-active' : '') +
                                //    ' menu-item" data-project="' + file + '"><a>' + file + '</a></li>\n';
                                    text += '<option value="Wandtablet" class="translate">'+file+'</option>';
                        }
                    }
                })
                $('#select_projects').html(text); 
        } 
    }) 
    window.alert('funktionier!'+dirPath+viewsJsonFile);
}