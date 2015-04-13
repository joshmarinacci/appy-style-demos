/**
 * Created by josh on 4/3/15.
 */
var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');
var mm = require('musicmetadata');
var stream = require('stream');

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

var read_stream = fs.createReadStream(file);
var dec = new lame.Decoder();
var speaker = new Speaker;


var trans = new stream.Transform();
var total = 0;
//44khz * 16bit samples * 2 channels = stream bytes per second
var rate = 44100*2*2;
trans._transform = function(chunk, encoding, done) {
    total += chunk.length;
    console.log("time = ", (total/rate).toFixed(2));
    this.push(chunk);
    done();
};
//final bytes = 751
read_stream.pipe(dec)
    .on('format',function(err,fmt){
        console.log(err,fmt);
    })
    .pipe(trans).pipe(speaker);
