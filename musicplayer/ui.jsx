var React = require('react');
var CustomList = require('./CustomList.jsx');

var SongDatabase = {
    songs:[],
    artists_map:{"All":"All"},
    artists_list:["All"],
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
                console.log("got message of type" + JSON.stringify(msg.type,null,'  '));
                if(msg.type == "player-status") {
                    self.setStatus(msg.status);
                    return;
                }
                if (msg.type !== 'song-added') return;
                self.addSong(msg.song);
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
    addSong: function(song) {
        this.songs.push(song);
        if(!this.artists_map[song.artist]) {
            this.artists_map[song.artist] = song.artist;
            this.artists_list.push(song.artist);
        }
        this.notify();
    },
    getArtists: function() {
        return this.artists_list;
    },
    getSongs: function() {
        return this.songs;
    },
    getFilteredSongs: function() {
        if(this.selectedArtist == null) {
            return this.songs;
        }
        if(this.selectedArtist == 'All') {
            return this.songs;
        }
        return this.getSongsForArtist(this.selectedArtist);
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
    },
    selectedArtist: null,
    setSelectedArtist: function(artist) {
        this.selectedArtist = artist;
        this.notify();
    },
    getSongsForArtist: function(artist) {
        return this.songs.filter(function(song) {
            return (song.artist.toString() == artist.toString())
        });
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
        var songs = SongDatabase.getFilteredSongs();
        return {
            songs:songs,
            selectedIndex:0
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('song-added',function() {
            self.setState({
                songs: SongDatabase.getFilteredSongs()
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

        var child = this.refs['child'+n];
        var dom = React.findDOMNode(child);
        dom.focus();
        /*
         //var node = this.refs.body.getDOMNode();
         //var h = this.refs.body.getDOMNode().offsetHeight;
        var off = dom.offsetTop;
        if(dom.offsetTop < node.scrollTop) {
            node.scrollTop = dom.offsetTop;
            console.log('moving up to ', node.scrollTop);
        }
        if(dom.offsetTop+dom.offsetHeight > h+node.scrollTop) {
            node.scrollTop = (dom.offsetTop+dom.offsetHeight)-h;
            console.log('moving down to ', node.scrollTop);
        }
        */
    },
    render: function() {
        var self = this;
        var rows = this.state.songs.map(function(song,i) {
            return <SongTableRow
                    song={song}
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
/*
var ScrollListItem = React.createClass({
    click: function() {
        this.props.setSelected(this.props.item);
    },
    render: function() {
        var cn = "";
        if(this.props.item == this.props.selected) {
            cn += " selected";
        }
        return <li className={cn} onClick={this.click}>{this.props.item.toString()}</li>
    }
});

var ScrollList = React.createClass({
    getInitialState:function() {
        return {
            items: SongDatabase.getArtists(),
            selected:null,
            selectedIndex:-1
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('song-added',function() {
            self.setState({
                songs: SongDatabase.getArtists()
            })
        });
    },
    setSelected: function(item) {
        var n = this.state.items.indexOf(item);
        this.setState({
            selected: item,
            selectedIndex:n
        });
        this.refs.ul.getDOMNode().focus();
        SongDatabase.setSelectedArtist(item);
    },
    setSelectedIndex: function(n) {
        if(n < 0) n = 0;
        if(n > this.state.items.length-1) n = this.state.items.length-1;
        var item = this.state.items[n];
        this.setState({
            selected: item,
            selectedIndex: n
        });
        this.refs.ul.getDOMNode().focus();
        SongDatabase.setSelectedArtist(item);
    },
    keyDown: function(e) {
        if(e.key == 'ArrowDown') {
            this.setSelectedIndex(this.state.selectedIndex+1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if(e.key == 'ArrowUp') {
            this.setSelectedIndex(this.state.selectedIndex-1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
    },
    render: function() {
        var self = this;
        var rows = this.state.items.map(function(item,i) {
            return <ScrollListItem
                key={i}
                item={item}
                ref={'child'+i}
                selected={self.state.selected}
                setSelected={self.setSelected}/>
        });
        return (
            <ul ref='ul' className="list scroll grow" tabIndex="0"
                onKeyDown={this.keyDown}
                >{rows}</ul>
        )
    }
});
*/

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
            album:'---'
        }
    },
    componentDidMount: function() {
        var self = this;
        SongDatabase.onChange('player',function() {
            var status = SongDatabase.getStatus();
            if(status) {
                self.setState({
                    title: status.song.title,
                    artist: status.song.artist[0],
                    album: status.song.album
                })
            }
        })
    },
    render: function() {
        return (<div className="vbox align-center" id="music-display">
            <span className="grow" id="display-song">{this.state.title}</span>
            <span id="display-artist">{this.state.artist} - {this.state.album}</span>
            <progress min="0" max="100" value="20"/>
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
   render: function() {
        return (<div className="vbox fill">
            <header id="main-header">
                <div className="group">
                    <button className="fa fa-backward no-bg" id="backward-button"></button>
                    <button className="fa fa-play no-bg" id="play-button"></button>
                    <button className="fa fa-forward no-bg" id="forward-button"></button>
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
                    <CustomList items={SongDatabase.getArtists()} onSelect={function(item,n) {
                        SongDatabase.setSelectedArtist(item);
                        console.log(item);
                        }} />
                </div>
                <div className='vbox grow'>
                    <ScrollTable/>
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