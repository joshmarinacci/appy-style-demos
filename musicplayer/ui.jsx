var React = require('react');



var SongDatabase = {
    songs:[],
    cbs:[],
    selected:null,
    onChange: function(type,cb) {
        this.cbs.push(cb);
    },
    notify: function() {
        this.cbs.forEach(function(cb){
            cb();
        });
    },
    init: function() {
        var self = this;
        if(this.isThrust()) {
            THRUST.remote.listen(function (msg) {
                console.log("got message of type" + JSON.stringify(msg,null,'  '));
                if(msg.type == "player-status") {
                    self.setStatus(msg.status);
                    return;
                }
                if (msg.type !== 'song-added') return;
                self.addSong(msg.song);
            });
            THRUST.remote.send({type:'running'});
        } else {
            for (var i = 0; i < 100; i++) {
                this.songs.push({title: i+' foo bar baz mister foo bar baz and stuff', artist: 'bar', album: 'baz'});
            }
        }
    },
    isThrust: function() {
        return (typeof THRUST !== 'undefined');
    },
    addSong: function(song) {
        this.songs.push(song);
        this.notify();
    },
    getSongs: function() {
        return this.songs;
    },
    getSelected: function() {
        return this.selected;
    },
    setSelected: function(song) {
        this.selected = song;
        this.notify();
    },
    playSong: function(song) {
        if(this.isThrust()) {
            THRUST.remote.send({
                type:'method',
                target:'player',
                method:'play',
                arguments:[song]
            });
        };
    },
    status: null,
    setStatus: function(status) {
        console.log("new status = " + JSON.stringify(status,null,'  '));
        this.status = status;
        this.notify();
    },
    getStatus: function() {
        return this.status;
    },
    navNextSong: function(song) {
        var n = this.songs.indexOf(song);
        n++;
        var song = this.songs[n];
        this.selected = song;
        this.notify();
    }
};

SongDatabase.init();

var SongTableRow = React.createClass({
    clicked: function(e) {
        e.preventDefault();
        this.props.setSelected(this.props.index);
        //SongDatabase.setSelected(this.props.song);
        this.refs.row.getDOMNode().focus();
    },
    doubleClicked: function(e) {
        e.preventDefault();
        SongDatabase.playSong(this.props.song);
    },
    keypress: function(e) {
        //console.log("key pressed",e.key);
        //e.preventDefault();
        //e.stopPropagation();
    },
    keydown: function(e) {
        //console.log("keydown",e.key);
        if(e.key == 'ArrowDown') {
            //console.log('st = ',this.refs.row.getDOMNode().scrollTop);
            //console.log('off = ',this.refs.row.getDOMNode().offsetTop);
            //this.props.setSelected(this.props.index+1);
            //e.preventDefault();
            //SongDatabase.navNextSong(this.props.song);
            //return;
        }

    },
    render: function() {
        var song = this.props.song;
        var selected = this.props.index == this.props.selectedIndex;
        var cn = "";
        if(selected) {
            cn = "selected";
        }
        return <tr ref='row' tabIndex="1"
                   className={cn}
                   onClick={this.clicked}
                   onDoubleClick={this.doubleClicked}
                   onKeyPress={this.keypress}
                   onKeyDown={this.keydown}
            >
            <td>{song.title}</td>
            <td>00:00</td>
            <td>{song.artist}</td>
            <td>{song.album}</td>
            <td>{song.genre}</td>
        </tr>;
    }
});

var ScrollTable = React.createClass({
    getInitialState: function() {
        var songs = SongDatabase.getSongs();
        return {
            songs:songs,
            selectedIndex:0
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('song-added',function() {
            self.setState({
                songs: SongDatabase.getSongs()
            })
        });
    },
    keypress: function(e) {
        console.log("got a key event");
    },
    keydown: function(e) {
        console.log('table got key down',e.key);
        if(e.key == 'ArrowDown') {
            this.setSelected(this.state.selectedIndex+1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if(e.key == 'ArrowUp') {
            this.setSelected(this.state.selectedIndex-1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if(e.key == 'Enter') {
            console.log("playing the current song");
            e.stopPropagation();
            e.preventDefault();
            return;
        }
    },
    setSelected: function(n) {
        if(n < 0) n = 0;
        if(n >= this.state.songs.length) n = this.state.songs.length-1;
        this.setState({
            selectedIndex:n
        });

        var node = this.refs.body.getDOMNode();
        var st = this.refs.body.getDOMNode().scrollTop;
        var h = this.refs.body.getDOMNode().offsetHeight;
        var off = n * 34;
        if(off < node.scrollTop) {
            node.scrollTop = off;
        }
        if(off > h+node.scrollTop) {
            node.scrollTop = off-h;
        }
    },
    render: function() {
        var self = this;
        var rows = this.state.songs.map(function(song,i) {
            return <SongTableRow
                    song={song}
                    key={song.uid}
                    index={i}
                    selectedIndex={self.state.selectedIndex}
                    setSelected={self.setSelected}
                />;
        });
        return (
            <div id="wrapper">
                <table tabIndex="0">
                    <thead>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Genre</th>
                    </thead>
                </table>
                <div id="body" ref='body'>
                    <table
                        ref="tbody"
                        onKeyPress={this.keypress}
                        onKeyDown={this.keydown}
                        >
                        <tbody>
                        {rows}
                        </tbody>
                    </table>
                </div>
            </div>)
    }
});

React.render(<ScrollTable/>, document.getElementById("main-table"));

var MusicDisplay = React.createClass({
    getInitialState: function() {
        return {
            title:'---',
            artist:'---',
            album:'---'
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('player',function() {
            /*
            console.log("new status = ", SongDatabase.getStatus());
            var status = SongDatabase.getStatus();
            self.setState({
                title: status.song.title,
                artist: status.song.artist[0],
                album: status.song.album
            })*/
        })
    },
    render: function() {
        console.log("this state = ")
        return (<div className="vbox">
            <span className="grow" id="display-song">{this.state.title}</span>
            <span id="display-artist">{this.state.artist} - {this.state.album}</span>
            <progress min="0" max="100" value="20"/>
            </div>)
    }
});


React.render(<MusicDisplay/>, document.getElementById("music-display"));