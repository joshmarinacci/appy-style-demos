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
                if (!msg.type == 'song-added') return;
                self.addSong(msg.song);
            });
        } else {
            for (var i = 0; i < 100; i++) {
                this.songs.push({title: 'foo bar baz mister foo bar baz and stuff', artist: 'bar', album: 'baz'});
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
                action:'play',
                song:song
            });
        };
    }
};

SongDatabase.init();

var SongTableRow = React.createClass({
    clicked: function(e) {
        e.preventDefault();
        SongDatabase.setSelected(this.props.song);
    },
    doubleClicked: function(e) {
        e.preventDefault();
        SongDatabase.playSong(this.props.song);
    },
    render: function() {
        var song = this.props.song;
        var selected = (SongDatabase.getSelected() == song);
        var cn = "";
        if(selected) {
            cn = "selected";
        }
        return <tr className={cn}
                   onClick={this.clicked}
                   onDoubleClick={this.doubleClicked}
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
            songs:songs
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
    render: function() {
        var rows = this.state.songs.map(function(song) {
            return <SongTableRow song={song} key={song.uid}/>;
        });
        return (
            <div id="wrapper">
                <table>
                    <thead>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Genre</th>
                    </thead>
                </table>
                <div id="body">
                    <table>
                        <tbody>
                        {rows}
                        </tbody>
                    </table>
                </div>
            </div>)
    }
});

React.render(<ScrollTable/>, document.getElementById("main-table"));