var React = require('react');


var ScrollTable = React.createClass({
    getInitialState: function() {
        var songs = [];
        if(typeof THRUST === 'undefined') {
            for (var i = 0; i < 100; i++) {
                songs.push({title: 'foo bar baz mister foo bar baz and stuff', artist: 'bar', album: 'baz'});
            }
        }
        return {
            songs:songs
        }
    },
    componentDidMount: function() {
        var self = this;
        if(typeof THRUST !== 'undefined') {
            THRUST.remote.listen(function (msg) {
                if (!msg.type == 'song-added') return;
                self.addSong(msg.song);
            });
        }
    },
    addSong: function(song) {
        console.log('adding song ' + song.title);
        this.state.songs.push(song);
        this.setState({
            songs: this.state.songs
        })
    },
    render: function() {
        var rows = this.state.songs.map(function(song) {
            return <tr>
                <td>{song.title}</td>
                <td>00:00</td>
                <td>{song.artist}</td>
                <td>{song.album}</td>
                <td>{song.genre}</td>
            </tr>;
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