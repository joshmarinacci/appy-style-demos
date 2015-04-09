var React = require('react');
var moment = require('moment');
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
        var self = this;
        var cols = this.props.columnNames.map(function(col){
            var w = self.props.columnWidths[col];
            return <td key={col} style={{ minWidth:w, maxWidth:w}}>{song[col]}</td>
        });
        var dur = moment.duration(song.duration,'seconds');
        return <tr ref='row' tabIndex="1"
                   className={cn}
                   onClick={this.clicked}
                   onDoubleClick={this.doubleClicked}
            >{cols}
            <td>{dur.minutes()}:{dur.seconds()}</td>
        </tr>;
    }
});

var ColumnHeader = React.createClass({
    getInitialState: function() {
        return {
            dragging:false
        }
    },
    onMouseDown: function(e) {
        this.setState({
            dragging:true
        });
        e.preventDefault();
    },
    componentDidUpdate: function(prevProps, prevState) {
        if(this.state.dragging == true && prevState.dragging == false) {
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        }
        if(this.state.dragging == false && prevState.dragging == true) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
    },
    onMouseMove: function (e) {
        var rect = this.refs.header.getDOMNode().getBoundingClientRect();
        var style = window.getComputedStyle(this.refs.header.getDOMNode());
        var fl = parseFloat(style.paddingLeft.substring(0,style.paddingLeft.length-2));
        var fr = parseFloat(style.paddingLeft.substring(0,style.paddingLeft.length-2));
        var nv = e.pageX - rect.left - (fl+fr);
        this.props.onResize(this.props.name,nv);
        e.stopPropagation();
        e.preventDefault();
    },
    onMouseUp: function (e) {
        this.setState({dragging:false});
        e.stopPropagation();
        e.preventDefault();
    },
    render: function() {
        return <th ref="header"
                   style={{
                        minWidth:this.props.width,
                        maxWidth:this.props.width,
                        position: 'relative'
                        }}
                >{this.props.name} <i
                ref="handle"
                className="drag-handle"
                onMouseDown={this.onMouseDown}
            ></i></th>
    }
});

var ScrollTable = React.createClass({
    getInitialState: function() {
        return {
            selectedIndex:0,
            columnNames: ["title","duration","artist","album","genre"],
            columnWidths:{
                "title":200,
                "duration":200,
                "artist":200,
                "album":200,
                "genre":200
            }
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
    columnResized: function(col,width) {
        this.state.columnWidths[col] = width;
        this.setState({
            columnWidths:this.state.columnWidths
        })

    },
    render: function() {
        var self = this;
        var headers = this.state.columnNames.map(function(col) {
            return <ColumnHeader
                key={col} name={col}
                onResize={self.columnResized}
                width={self.state.columnWidths[col]}
                />
        });
        var rows = this.props.items.map(function(item,i) {
            return <SongTableRow
                song={item}
                key={i}
                ref={"child"+i}
                index={i}
                selectedIndex={self.state.selectedIndex}
                setSelected={self.setSelected}
                columnNames={self.state.columnNames}
                columnWidths={self.state.columnWidths}
                />;
        });
        return (
            <div id="wrapper">
                <table tabIndex="0">
                    <thead>{headers}</thead>
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


module.exports = ScrollTable;