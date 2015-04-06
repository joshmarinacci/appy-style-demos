/**
 * Created by josh on 4/3/15.
 */


/*

make a generic method router

type: method,
target: 'player',
method:'play',
arguments:[]

maps to

object_registry.player.play(arguments)


player object
    play():  sends event on status change
    getState: returns state: song info, total time, current time, etc.
        repeat, shuffle, etc.

 */
var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');
var DB = require('./songdatabase');

function d() {
    var args = Array.prototype.splice.call(arguments,0);
    args.forEach(function(arg) {
        dprint.apply(null, [arg]);
    });
}

function dprint(obj) {
    console.log(JSON.stringify(obj,null,'  '));
}

function startApp() {
    require('node-thrust')(function (err, api) {
        var url = 'file://' + __dirname + '/ui.html';
        console.log("opening", url);
        var win = api.window({root_url: url});
        win.show();
        console.log(api);
        win.on('closed', function () {
            console.log("the window was closed");
            api.exit();
        });
        win.on('remote', function (msg) {
            //d("got the message", msg);
            if(msg.message.type == 'running') {
                DB.startMP3Scan(win);
            }
            if(msg.message.type == 'method') {
                dispatchMethod(msg.message,win);
            }
        });
    });
}

var object_registry = {};
object_registry.player = {
    play: function(song) {
        console.log("playing the song",song);
        if(this.stream) {
            this.stream.end();
        }
        this.stream = fs.createReadStream(song.file)
            .pipe(new lame.Decoder)
            .on('format', function(){
                if(window) window.remote({
                    type:'player-status',
                    source:'player',
                    status: {
                        playing:true,
                        song: song
                    }
                });
            })
            .pipe(new Speaker);
    }
};
object_registry.database = DB;

function dispatchMethod(msg,win) {
    //d("dispatching",msg);
    var target = object_registry[msg.target];
    var method = target[msg.method];
    if(!msg.arguments) {
        msg.arguments = [];
    }
    msg.arguments.push(function(err,retval){
        //console.log("callback called");
        if(win) win.remote({
            type:'callback',
            method:msg.method,
            target:msg.target,
            callbackid:msg.id,
            value:retval,
            error:err
        });

    });
    method.apply(target,msg.arguments);
}


//DB.startMP3Scan(null);
startApp();
