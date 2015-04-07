/**
 * Created by josh on 4/3/15.
 */
var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');
var mm = require('musicmetadata');

/*
fs.createReadStream(process.argv[2])
    .pipe(new lame.Decoder)
    .on('format', console.log)
    .pipe(new Speaker);
    */
/*
var parser = mm(fs.createReadStream(process.argv[2]), { duration: true}, function (err, metadata) {
    if (err) throw err;
    console.log(metadata);
});
*/

/*

length in seconds is 248
bitrate is 160kbs
sample rate 44100

248*160000/8 = 4,960,000  = 4.9mb
4,960,000 * 8 / 160,000 = 248seconds

bitrate = 160kbs


 */


var file = "/Users/josh/Music/iTunes/iTunes Media/Music/ABBA/Gold/09 Money, Money, Money.mp3";

var speaker = new Speaker;
var read_stream = fs.createReadStream(file);
read_stream.pipe(new lame.Decoder()).pipe(speaker);


setTimeout(function() {
    console.log("pausing",read_stream.isPaused());
    //read_stream.pause();
},2000);
