'use strict';
namespace:          'vis.0',


sendCommand:      function (instance, command, data, ack) {
        this.setState(this.namespace + '.control.instance', {val: instance || 'notdefined', ack: true});
        this.setState(this.namespace + '.control.data',     {val: data,    ack: true});
        this.setState(this.namespace + '.control.command',  {val: command, ack: ack === undefined ? true : ack});
    },
    _detectViews:     function (projectDir, callback) {
        this.readDir('/' + this.namespace + '/' + projectDir, function (err, dirs) {
            // find vis-views.json
            for (var f = 0; f < dirs.length; f++) {
                if (dirs[f].file === 'vis-views.json' && (!dirs[f].acl || dirs[f].acl.read)) {
                    return callback(err, {name: projectDir, readOnly: (dirs[f].acl && !dirs[f].acl.write), mode: dirs[f].acl ? dirs[f].acl.permissions : 0});
                }
            }
            callback(err);
        });
    },


readProjects:     function (callback) {
        var that = this;
        this.readDir('/' + this.namespace, function (err, dirs) {
            var result = [];
            var count = 0;
            for (var d = 0; d < dirs.length; d++) {
                if (dirs[d].isDir) {
                    count++;
                    that._detectViews(dirs[d].file, function (subErr, project) {
                        if (project) result.push(project);

                        err = err || subErr;
                        if (!(--count)) callback(err, result);
                    });
                }
            }
        });
    }



////////////////////////////////////////////////////
editFillProjects:       function () {
        var that = this;
        // fill projects
        this.conn.readProjects(function (err, projects) {
            var text = '';
            if (projects.length) {
                for (var d = 0; d < projects.length; d++) {
                    text += '<li class="ui-state-default project-select ' + (projects[d].name + '/' === that.projectPrefix ? 'ui-state-active' : '') +
                        ' menu-item" data-project="' + projects[d].name + '"><a>' + projects[d].name + (projects[d].readOnly ? ' (' + _('readOnly') + ')' : '') + '</a></li>\n';
                    if (projects[d].name + '/' === that.projectPrefix) {
                        $('#vis_access_mode').prop('checked', projects[d].mode & 0x60);
                    }
                }
                $('#menu_projects').html(text);
                $('.project-select').unbind('click').click(function () {
                    window.location.href = 'edit.html?' + $(this).attr('data-project');
                });
            } else {
                $('#li_menu_projects').hide();
            }
        });
    }