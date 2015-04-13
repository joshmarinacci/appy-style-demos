var React = require('react');
var TableRow = React.createClass({
    clicked: function(e) {
        e.preventDefault();
        this.props.setSelected(this.props.index);
        this.refs.row.getDOMNode().focus();
    },
    doubleClicked: function(e) {
        e.preventDefault();
        this.props.doubleClicked(this.props.item);
    },
    cellCustomizer: function(row, col) {
        return <td>{row[col.id]}</td>
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        //skip if the only change is selection and this row
        //isn't the old or new selected object
        if(this.props.item === nextProps.item) {
            if(this.props.index != this.props.selectedIndex &&
                this.props.index != nextProps.selectedIndex) {
                return false;
            }
        }
        return true;
    },
    render: function() {
        var item = this.props.item;
        var selected = this.props.index == this.props.selectedIndex;
        var cn = "";
        if(selected) {
            cn = "selected";
        }
        var self = this;
        var cust = this.cellCustomizer;
        if(this.props.cellCustomizer) {
            cust = this.props.cellCustomizer;
        }
        var cols = this.props.columnInfo.map(function(col) {
            var w = self.props.columnWidths[col.id];
            var cell = cust(item,col);
            return React.cloneElement(cell,{
                key:col.id,
                style: {
                    minWidth:w,
                    maxWidth:w
                }
            });
        });
        return <tr ref='row' tabIndex="1"
                   className={cn}
                   onClick={this.clicked}
                   onDoubleClick={this.doubleClicked}
            >{cols}</tr>;
    }
});


var ColumnHeader = React.createClass({
    orders: {
        asc: 'asc',
        des: 'des',
        non: 'non'
    },
    getInitialState:function() {
        return {
            dragging:false,
            order: this.orders.non
        }
    },
    clicked: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var order = this.state.order;
        switch(this.state.order) {
            case this.orders.non: order = this.orders.asc; break;
            case this.orders.asc: order = this.orders.des; break;
            case this.orders.des: order = this.orders.non; break;
        }
        this.setState({order: order});
        if(this.props.onSortChange) {
            this.props.onSortChange(this.props.column, order);
        }
    },
    onMouseDown: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(this.props.column.resizable === true) {
            this.setState({
                dragging: true
            });
        }
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
        this.props.onResize(this.props.column,nv);
        e.stopPropagation();
        e.preventDefault();
    },
    onMouseUp: function (e) {
        e.stopPropagation();
        e.preventDefault();
        this.setState({dragging:false});
    },
    render: function() {
        var sort_class = "fa";
        if(this.state.order == this.orders.non) {
            sort_class += " fa-sort";
        }
        if(this.state.order == this.orders.asc) {
            sort_class += " fa-sort-asc";
        }
        if(this.state.order == this.orders.des) {
            sort_class += " fa-sort-desc";
        }
        if(this.props.column.sortable === false) {
            sort_class = "";
        }
        var drag_class = "";
        if(this.props.column.resizable === true) {
            drag_class += "drag-handle";
        }
        return <th ref="header"
                   style={{
                        minWidth:this.props.width,
                        maxWidth:this.props.width,
                        position: 'relative'
                        }}
                   onMouseDown={this.clicked}
                ><span className='grow'>{this.props.column.title}</span>
            <i className={sort_class}
               style={{float: 'right'}}
                ></i>
            <i
                ref="handle"
                className={drag_class}
                style={{float: 'right'}}
                onMouseDown={this.onMouseDown}
            ></i></th>
    }
});

var ScrollTable = React.createClass({
    getInitialState: function() {
        return {
            selectedIndex:0,
            columnWidths:{}
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
            e.stopPropagation();
            e.preventDefault();
            if(this.props.onEnterPressed) {
                this.props.onEnterPressed(this.getSelectedItem());
            }
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
        this.props.onSelectRow(child.props.item);
    },
    getSelectedItem: function() {
        var child = this.refs['child'+this.state.selectedIndex];
        return child.props.item;
    },
    columnResized: function(col,width) {
        this.state.columnWidths[col.id] = width;
        this.setState({
            columnWidths:this.state.columnWidths
        })
    },
    componentWillReceiveProps: function(newProps) {
        if(newProps.columnInfo) {
            var widths = {};
            newProps.columnInfo.forEach(function(col) {
                widths[col.id] = col.width;
            });
            this.setState({
                columnWidths:widths
            });
        }
    },
    render: function() {
        var self = this;

        var headers = this.props.columnInfo.map(function(col) {
            return <ColumnHeader
                key={col.id}
                column={col}
                onResize={self.columnResized}
                width={self.state.columnWidths[col.id]}
                onSortChange={self.props.onSortChange}
                />
        });
        var rows = this.props.items.map(function(item,i) {
            return <TableRow
                item={item}
                key={i}
                ref={"child"+i}
                index={i}
                selectedIndex={self.state.selectedIndex}
                setSelected={self.setSelected}
                columnInfo={self.props.columnInfo}
                columnWidths={self.state.columnWidths}
                doubleClicked={self.props.doubleClicked}
                cellCustomizer={self.props.cellCustomizer}
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