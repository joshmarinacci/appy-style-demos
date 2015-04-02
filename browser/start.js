/**
 * Created by josh on 4/2/15.
 */


require('node-thrust')(function(err, api) {
    var url = 'file://'+__dirname + '/ui.html';
    console.log("opening",url);
    api.window({ root_url: url }).show();
});