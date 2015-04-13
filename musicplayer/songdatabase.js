/**
 * Created by josh on 4/6/15.
 */
var fs = require('fs');
var walker = require('async-walker');
var Q = require('q');
var mm = require('musicmetadata');
var Datastore = require('nedb');


//create/connect to the database first thing
var db;
function initDB() {
    db = new Datastore({
        filename:"./library.db",
        autoload:true
    });
    console.log("database initialized");

}

initDB();

var artists_index = {};

function calculateArtists() {
    return Q.Promise(function (resolve, reject, notify) {
        //fetch all songs w/ only the artist field
        db.find({},{artist:1}, function(err,docs) {
            docs.forEach(function(doc){
                var at = doc.artist[0];
                artists_index[at] = at;
            });
            resolve();
        });
    });
}
function finalizeLoading(win) {
    calculateArtists().then(function() {
        console.log("sending");
        if(win) win.remote({
            type:'database-loaded'
        });
    });
}


function q_map(array,fun) {
    return Q.allSettled(array.map(fun));
}
function q_seq_map(array,fun) {
    console.log("generating");
    var funcs = array.map(function(item) {
        return function() {
            return fun(item);
        }
    });
    return funcs.reduce(Q.when, Q(null));
}

exports.getArtists = function(cb) {
    var ret = [];
    for(var name in artists_index) {
        ret.push(name);
    }
    if(cb) cb(null, ret);
}

exports.getSongsForArtist = function(artist,cb) {
    db.find({artist:artist}).sort({'track.no':1}).exec(function(err, docs) {
        docs.forEach(function(doc) {
            //dont transfer picture metadata
            if(doc.picture) {
                delete doc.picture;
            }
        });
        if(cb) cb(null, docs);
    });
};

exports.getArchiveStats = function(cb) {
    db.find({}).exec(function(err,docs) {
        if(err) throw err;
        var filesize = 0;
        docs.forEach(function(doc) {
            if(doc.filesize) filesize += doc.filesize;
        });
        var stats = {
            count: docs.length,
            filesize: filesize
        };
        if(cb) cb(null, stats);
    });
};

exports.startMP3Scan = function(win) {
    var songs = [];
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
        return q_seq_map(files, qParseMP3)
            .then(q_seq_map(files,stripBadFields))
            .then(q_seq_map(files,checkSize));
        //return q_seq_map(files, stripBadFields);
    }).then(function () {
        console.log("all done! database length =", songs.length);
        finalizeLoading(win);
    }).fail(function(e) {
        console.log('an error happened',e);
    });

    function checkSize(file) {
        return Q.promise(function(resolve,reject,notify) {
            db.find({file:file}, function(err,docs) {
                if(err) throw err;
                if(docs.length <=0) return resolve();
                if(typeof docs[0].filesize == 'undefined') {
                    console.log("we need the file size for " + file);
                    fs.stat(file, function(err,stat) {
                        console.log(stat);
                        db.update({file:file},{$set:{ filesize:stat.size }}, function(err,num){
                            if(err)throw err;
                            console.log("updated",num);
                            resolve();
                            return;
                        });
                    });
                } else {
                    return resolve();
                }
            })
        });
    }

    function stripBadFields(file) {
        return Q.promise(function(resolve,reject,notify) {
            db.find({file:file}, function(err,docs) {
                if(err) throw err;
                //console.log("docs = ", docs);
                if(docs.length <= 0) {
                    resolve();
                    return;
                }

                if(typeof docs[0].picture !== 'undefined') {
                    console.log("updating");
                    db.update({file:file},{$unset:{picture:true}},{}, function(err,num) {
                        if(err)throw err;
                        console.log("updated",num);
                        resolve();
                        return;
                    });
                } else {
                    resolve();
                    return;
                }
            });
        });
    }
    function qParseMP3(file) {
        return Q.Promise(function (resolve, reject, notify) {
            db.find({file:file},function(err,docs) {
                if(err) throw err;
                if(docs.length >= 1) {
                    //console.log("already in database");
                    resolve();
                    return;
                }
                mm(fs.createReadStream(file), { duration: true}, function (err, metadata) {
                    //console.log("scanned " + file);
                    if(err) console.log('error',err);
                    //if (err) return reject(err);
                    if(err) {
                        console.log("skipping adding to the database");
                    } else {
                        addMP3ToDatabase(file, metadata);
                    }
                    //console.log(metadata);
                    resolve();
                });
            });
        });
    }

    function addMP3ToDatabase(file, info) {
        console.log('inserting',info.title);
        info.file = file;
        db.insert(info);
    }

}

