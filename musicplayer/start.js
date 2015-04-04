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
var walker = require('async-walker');
var id3 = require('id3js');
var Q = require('q');
var mm = require('musicmetadata');
var lame = require('lame');
var Speaker = require('speaker');

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
            d("got the message", msg);
            if(msg.message.type == 'running') {
                startMP3Scan(win);
            }
            if(msg.message.type == 'method') {
                dispatchMethod(msg.message);
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

function dispatchMethod(msg) {
    d("dispatching",msg);
    var target = object_registry[msg.target];
    var method = target[msg.method];
    method.apply(target,msg.arguments);
}


function q_map(array,fun) {
    return Q.allSettled(array.map(fun));
}
function q_seq_map(array,fun) {
    var funcs = array.map(function(item) {
        return function() {
            return fun(item);
        }
    });
    return funcs.reduce(Q.when, Q(null));
}

var window = null;
function startMP3Scan(win) {
    window = win;
    var start_path = "/Users/josh/Music/iTunes/iTunes Media/Music";
    //var start_path = "/Volumes/PieHole/Mp3Archive/iTunes/Yes";
    console.log("scanning from ", start_path);

    walker.filter(start_path, function (file) {
        //skip anything in the itunes LP directories
        if (file.indexOf('.itlp') >= 0) return false;
        //only match mp3s
        if (file.indexOf('.mp3') >= 0) return true;
    }).then(function (files) {
        console.log("mp3 files to process = ", files.length);
        //generate promises
        //return q_map(files,qParseMP3);
        return q_seq_map(files, qParseMP3);
    }).then(function () {
        console.log("all done! database length =", songs.length);
    });

    function qParseMP3(file) {
        return Q.Promise(function (resolve, reject, notify) {
            console.log("starting");
            mm(fs.createReadStream(file), { duration: true}, function (err, metadata) {
                console.log(err);
                if (err) return reject(err);
                addMP3ToDatabase(file,metadata);
                console.log(metadata);
                resolve();
            });
            /*
            id3({file: file, type: id3.OPEN_LOCAL}, function (err, tags) {
                if (err) {
                    reject(err);
                    return;
                }
                addMP3ToDatabase(file, tags);
                //console.log("ending");
                resolve();
            });*/
        });
    }

    var songs = [];

    function generateUID() {
        return "id_"+Math.floor(Math.random()*1000*1000*1000);
    }

    function addMP3ToDatabase(file, info) {
        /*
        if (tags.title) tags.title = tags.title.replace(/\0/g, '');
        if (tags.artist) tags.artist = tags.artist.replace(/\0/g, '');
        if (tags.album) tags.album = tags.album.replace(/\0/g, '');
        */
        info.file = file;
        info.uid = generateUID();
        songs.push(info);
        if(win) win.remote({
            type:'song-added',
            song: info
        });
    }

}


//startMP3Scan(null);
startApp();
/*
dispatchMethod({
    target:"player",
    method:'play',
    arguments:["foo"]
});
*/