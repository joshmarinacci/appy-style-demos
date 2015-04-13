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
var stream = require('stream');
var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');
var DB = require('./songdatabase');
var util = require('util');

function d() {
    var args = Array.prototype.splice.call(arguments,0);
    args.forEach(function(arg) {
        dprint.apply(null, [arg]);
    });
}

function dprint(obj) {
    console.log(util.inspect(obj));
}


var window = null;
function startApp() {
    require('node-thrust')(function (err, api) {
        var url = 'file://' + __dirname + '/ui.html';
        console.log("opening", url);
        var win = api.window({root_url: url, size: {width: 1100, height: 700}, title:'Foo Tunes'});
        window = win;
        win.show();
        win.focus();
        win.on('closed', function () {
            console.log("the window was closed");
            process.exit();
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
function sendNotification(msg) {
    if(window) window.remote(msg);
}

var object_registry = {};

function TimeCounterTransform() {
    stream.Transform.call(this);
    this.total = 0;
    this.rate = 44100*2*2;
}
util.inherits(TimeCounterTransform,stream.Transform);
TimeCounterTransform.prototype._transform = function(chunk, encoding, done) {
    this.total += chunk.length;
    sendNotification({
        type:'current-time',
        time: (this.total/this.rate)
    });
    this.push(chunk);
    done();
};

object_registry.player = {
    play: function(song,cb) {
        if(song == null) {
            throw new Error("invalid song. null");
        }
        this.speaker = new Speaker();
        fs.createReadStream(song.file)
            .pipe(new lame.Decoder)
            .on('format', function() {
                if(cb) cb();
                sendNotification({
                    type:'status-update',
                    playing:true,
                    song: song
                });
            })
            .on('end', function() {
                sendNotification({
                    type:'status-update',
                    playing:false,
                    ended:true,
                    song: song
                });
            })
            .on('done', function() {
                console.log('done');
            })
            .on('close', function() {
                console.log('closed');
            })
            .pipe(new TimeCounterTransform())
            .pipe(this.speaker);
    },
    stop: function(cb) {
        if(this.speaker) {
            this.speaker.on('flush',function() {
                console.log("flush called");
            });
            this.speaker.on('close',function() {
                console.log("close called");
                cb();
                sendNotification({
                    type:'status-update',
                    playing:false
                });
            });
            this.speaker.end();
        }
    }
};
object_registry.database = DB;

function dispatchMethod(msg,win) {
    //d("dispatching",msg.target+"."+msg.method);
    var target = object_registry[msg.target];
    var method = target[msg.method];
    if(!method) {
        throw new Error("no such method " + msg.method);
    }
    if(!msg.arguments) {
        msg.arguments = [];
    }
    var cb = function(err,retval){
        //console.log("callback called");
        if(win) win.remote({
            type:'callback',
            method:msg.method,
            target:msg.target,
            callbackid:msg.id,
            value:retval,
            error:err
        });
    };
    msg.arguments.push(cb);
    method.apply(target,msg.arguments);
}


//DB.startMP3Scan(null);
startApp();
