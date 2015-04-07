var React = require('react');
var CustomList = require('./CustomList.jsx');
var moment = require('moment');

function d() {
    var args = Array.prototype.splice.call(arguments,0);
    args.forEach(function(arg) {
        dprint.apply(null, [arg]);
    });
}

function dprint(obj) {
    console.log(JSON.stringify(obj,null,'  '));
}

var SongDatabase = {
    songs:[],
    artists_map:{"All":"All"},
    artists_list:["All"],
    cbs:{},
    progcbs:[],
    thrust_cbs:{},
    selected:null,
    onChange: function(type,cb) {
        if(!this.cbs[type]) {
            this.cbs[type] = [];
        }
        this.cbs[type].push(cb);
    },
    notify: function(type) {
        if(!this.cbs[type]) {
            console.log("WARNING. No callbacks of type " + type);
            return;
        }
        this.cbs[type].forEach(function(cb){
            cb();
        });
    },
    init: function() {
        var self = this;
        if(this.isThrust()) {
            THRUST.remote.listen(function (msg) {
                if(msg.type == 'callback') {
                    if(self.thrust_cbs[msg.callbackid]) {
                        self.thrust_cbs[msg.callbackid](msg.value);
                        delete self.thrust_cbs[msg.callbackid];
                    }
                    return;
                }
                if(msg.type == 'database-loaded') {
                    self.notify('database-loaded');
                    return;
                }
                if(msg.type == 'status-update') {
                    self.setStatusFromNotification(msg);
                    return;
                }
            });
            THRUST.remote.send({type:'running'});
        } else {
            var artists = ["foo","bar","baz"];
            var self = this;
            artists.forEach(function(artist) {
                for (var i = 0; i < 12; i++) {
                    self.addSong({title: i+' foo bar baz mister foo bar baz and stuff', artist: artist, album: 'baz'});
                }
            });
        }
    },
    isThrust: function() {
        return (typeof THRUST !== 'undefined');
    },

    sendThrustCallbackRequest: function(target, method, args, cb, fallback) {
        //console.log("calling " + target + "." + method);
        if(this.isThrust()) {
            var id = 'id_' + Math.random();
            this.thrust_cbs[id] = cb;
            THRUST.remote.send({
                id: id,
                type: 'method',
                target: target,
                method: method,
                arguments: args
            });
        } else {
            cb(fallback)
        }
    },

    getArtists: function(cb) {
        this.sendThrustCallbackRequest('database','getArtists',[],cb,[]);
    },
    getSongsForArtist: function(artist, cb) {
        this.sendThrustCallbackRequest('database','getSongsForArtist',[artist],cb, []);
    },

    playing: false,
    currentPlayset: [],
    playingSong:null,
    selectedSong: null,
    setCurrentPlayset: function(songs) {
        this.currentPlayset = songs;
    },
    setSelectedSong: function(song) {
        this.selectedSong = song;
    },
    setPlayingSong: function(song) {
        this.playingSong = song;
    },
    getPlayingSong: function() {
        if(this.playingSong == null) {
            return this.selectedSong;
        }
        return this.playingSong;
    },
    getPlayingSongIndex: function() {
        var cs = this.getPlayingSong();
        var n = -1;
        this.currentPlayset.forEach(function(item,i) {
            if(item._id == cs._id) {
                n = i;
            }
        });
        return n;
    },

    getSongAtIndex: function(n) {
        return this.currentPlayset[n];
    },
    playPreviousSong: function() {
        var n = this.getPlayingSongIndex();
        if(!n || n <= 0) {
            n = 0;
        } else {
            n--;
        }
        var ncs = this.getSongAtIndex(n);
        this.setPlayingSong(ncs);
        var self = this;
        this.sendThrustCallbackRequest('player','stop',[],function() {
            self.sendThrustCallbackRequest('player','play', [ncs],function() {
                //console.log("now the new song is really playing");
            },null);
        },null);
    },
    playNextSong: function() {
        var n = this.getPlayingSongIndex();
        if(!n || n <= 0) {
            n = 0;
        } else {
            n++;
        }
        var ncs = this.getSongAtIndex(n);
        this.setPlayingSong(ncs);
        var self = this;
        this.sendThrustCallbackRequest('player','stop',[],function() {
            console.log("now the song is really stopped");
            self.sendThrustCallbackRequest('player','play', [ncs],function() {
                console.log("now the song is really playing");
            },null);
        },null);
    },
    playSong: function(song) {
        var self = this;
        this.setPlayingSong(song);
        if(this.isPlaying()) {
            self.sendThrustCallbackRequest('player','stop',[],function() {
                self.sendThrustCallbackRequest('player','play', [self.getPlayingSong()],function() {
                    console.log("now the song is really playing");
                },null);
            },null);
        } else {
            self.sendThrustCallbackRequest('player','play', [self.getPlayingSong()],function() {
                console.log("now the song is really playing");
            },null);
        }
    },
    togglePlaySong: function() {
        var self = this;
        if(this.isPlaying()) {
            this.sendThrustCallbackRequest('player','stop',[],function() {
                console.log("now the song is really paused");
            },null);
        } else {
            this.sendThrustCallbackRequest('player','play', [this.getPlayingSong()],function() {
                console.log("now the song is really playing");
            },null);
        }
    },
    isPlaying: function() {
        return this.playing;
    },
    setVolume: function(vol) {
        this.volume = vol;
    },
    getVolume: function() {
        return this.volume;
    },
    setStatusFromNotification: function(msg) {
        d("status changed to ",msg);
        this.playing = msg.playing;
        if(msg.song) {
            this.playingSong = msg.song;
        }
        this.notify('status-update');
    }


};

SongDatabase.init();

var SongTableRow = React.createClass({
    clicked: function(e) {
        e.preventDefault();
        this.props.setSelected(this.props.index);
        this.refs.row.getDOMNode().focus();
        SongDatabase.setSelectedSong(this.props.song);
    },
    doubleClicked: function(e) {
        e.preventDefault();
        SongDatabase.playSong(this.props.song);
    },
    render: function() {
        var song = this.props.song;
        var selected = this.props.index == this.props.selectedIndex;
        var cn = "";
        if(selected) {
            cn = "selected";
        }
        var dur = moment.duration(song.duration,'seconds');
        return <tr ref='row' tabIndex="1"
                   className={cn}
                   onClick={this.clicked}
                   onDoubleClick={this.doubleClicked}
            >
            <td>{song.track.no}</td>
            <td>{song.title}</td>
            <td>{dur.minutes()}:{dur.seconds()}</td>
            <td>{song.artist}</td>
            <td>{song.album}</td>
            <td>{song.genre}</td>
        </tr>;
    }
});

var ScrollTable = React.createClass({
    getInitialState: function() {
        return {
            selectedIndex:0
        }
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
        if(n >= this.props.items.length) n = this.props.items.length-1;
        this.setState({
            selectedIndex:n
        });

        var child = this.refs['child'+n];
        var dom = React.findDOMNode(child);
        dom.focus();
        SongDatabase.setCurrentPlayset(this.props.items);
    },
    render: function() {
        var self = this;
        var rows = this.props.items.map(function(item,i) {
            return <SongTableRow
                    song={item}
                    key={i}
                    ref={"child"+i}
                    index={i}
                    selectedIndex={self.state.selectedIndex}
                    setSelected={self.setSelected}
                />;
        });
        return (
            <div id="wrapper">
                <table tabIndex="0">
                    <thead>
                    <th>Track #</th>
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

var SourcesCustomizer = function(item) {
    if(item.type == 'header') {
        return <li className='header' disabled={true}>{item.title}</li>;
    }
    return (<li className='indent'><i className={item.icon}></i> <span>{item.title}</span></li>);
};

var MusicDisplay = React.createClass({
    getInitialState: function() {
        return {
            title:'---',
            artist:'---',
            album:'---',
            playing: false
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('status-update',function() {
            var playing = SongDatabase.isPlaying();
            var song = SongDatabase.getPlayingSong();
            d("current song ",song,"playing",playing);
            self.setState({
                title: song.title,
                artist: song.artist,
                album: song.album,
                playing: playing
            });
        })
    },
    render: function() {
        return (<div className="vbox align-center" id="music-display">
            <span className="grow" id="display-song">{this.state.title}</span>
            <span id="display-artist">{this.state.artist} - {this.state.album}</span>
            <progress min="0" max="100" value="20"/>
            <span id='playing-state'>{this.state.playing?"playing":"still"}</span>
            </div>)
    }
});

var sources = [
    { type: 'header', title:'Library'},
    { type: 'source', title:'Music', icon:'fa fa-music fa-fw'},
    { type: 'source', title:'Movies', icon:'fa fa-film fa-fw'},
    { type: 'source', title:'Podcast', icon:'fa fa-rocket fa-fw'},
    { type: 'header', title:'Playlists'},
    { type: 'source', title:'Number One Hits', icon:'fa fa-gears fa-fw'},
    { type: 'source', title:'10 Most Played', icon:'fa fa-gears fa-fw'},
];

var MainView = React.createClass({
    getInitialState: function() {
        return {
            playing: false,
            artists: [],
            songs:[]
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange("database-loaded",function(){
            SongDatabase.getArtists(function(artists) {
                self.setState({
                    artists:artists
                })
            });
        });
        SongDatabase.onChange('status-update',function() {
            var playing = SongDatabase.isPlaying();
            self.setState({
                playing: playing
            });
        })
    },
    prevPressed: function() {
        SongDatabase.playPreviousSong();
    },
    nextPressed: function() {
        SongDatabase.playNextSong();
    },
    playPressed: function() {
        SongDatabase.togglePlaySong();
    },
    selectArtist: function(artist) {
        var self = this;
        SongDatabase.getSongsForArtist(artist, function(songs) {
            self.setState({
                songs: songs
            })
        });
    },
    render: function() {
       var playButtonClass = "fa no-bg";
       if(SongDatabase.isPlaying()) {
           playButtonClass += " fa-pause";
       } else {
           playButtonClass += " fa-play";
       }
        return (<div className="vbox fill">
            <header id="main-header">
                <div className="group">
                    <button onClick={this.prevPressed} className="fa fa-backward no-bg" id="backward-button"></button>
                    <button onClick={this.playPressed} className={playButtonClass}      id="play-button"></button>
                    <button onClick={this.nextPressed} className="fa fa-forward no-bg"  id="forward-button"></button>
                </div>
                <div className="group">
                    <label className="fa fa-volume-down"></label>
                    <input type="range" min="0" max="100" id="volume"/>
                    <label className="fa fa-volume-up"></label>
                </div>
                <span className="grow"></span>
                <MusicDisplay/>
                <span className="grow"></span>
                <span className="grow"></span>
                <input type="search" placeholder="albums, artists, songs" id="search-box"/>
            </header>
            <div className="hbox grow">
                <div className="vbox" id="sources-pane">
                    <header>Sources</header>
                    <CustomList items={sources} customizer={SourcesCustomizer}/>
                </div>
                <div className="vbox scroll" id="artists-pane">
                    <header>Artists</header>
                    <CustomList items={this.state.artists} onSelect={this.selectArtist}/>
                </div>
                <div className='vbox grow'>
                    <ScrollTable items={this.state.songs}/>
                </div>
            </div>
            <footer id="main-footer">
                <button className="fa fa-plus no-bg"></button>
                <button className="fa fa-random no-bg"></button>
                <button className="fa fa-repeat no-bg"></button>
                <span className="grow"></span>
                <span>3333 items, 105 hrs total time, 21GB</span>
                <span className="grow"></span>
                <button className="fa fa-eject no-bg"></button>
            </footer>
        </div>
     );
   }
});

React.render(<MainView/>, document.getElementById("main-view"));