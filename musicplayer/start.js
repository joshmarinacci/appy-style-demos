/**
 * Created by josh on 4/3/15.
 */
var fs = require('fs');
var walker = require('async-walker');
var id3 = require('id3js');
var Q = require('q');

require('node-thrust')(function(err, api) {
    var url = 'file://'+__dirname + '/ui.html';
    console.log("opening",url);
    var win = api.window({ root_url: url });
    win.show();
    console.log(api);
    win.on('closed',function(){
        console.log("the window was closed");
        api.exit();
    });

    startMP3Scan(win);
});

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
//startMP3Scan(null);
function startMP3Scan(win) {
    window = win;
    var start_path = "/Users/josh/Music/iTunes/iTunes Media/Music";

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
            //console.log("starting");
            id3({file: file, type: id3.OPEN_LOCAL}, function (err, tags) {
                if (err) {
                    reject(err);
                    return;
                }
                addMP3ToDatabase(file, tags);
                //console.log("ending");
                resolve();
            });
        });
    }

    var songs = [];

    function addMP3ToDatabase(file, tags) {
        if (tags.title) tags.title = tags.title.replace(/\0/g, '');
        if (tags.artist) tags.artist = tags.artist.replace(/\0/g, '');
        if (tags.album) tags.album = tags.album.replace(/\0/g, '');
        var song = {
            title: tags.title,
            artist: tags.artist,
            album: tags.album
        };
        songs.push(song);
        win.remote({
            type:'song-added',
            song: song
        });
    }

}