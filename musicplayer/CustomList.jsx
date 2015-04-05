var React = require('react');

var CustomListItem = React.createClass({
    click: function() {
        if(this.refs.item.props.disabled == true) return;
        this.props.setSelected(this.props.item);
    },
    render: function() {
        var cn = "";
        if(this.props.item == this.props.selected) {
            cn += " selected";
        }
        var elem =this.props.customizer(this.props.item);
        if(elem.props.className) {
            cn += " "+elem.props.className;
        }
        return React.cloneElement(elem,
            {
                className:cn,
                ref:'item',
                onClick:this.click
            }
        );
    }
});


var CustomList = React.createClass({
    getInitialState:function() {
        return {
            selected:null,
            selectedIndex:-1
        }
    },
    setSelected: function(item) {
        var n = this.props.items.indexOf(item);
        this.setState({
            selected: item,
            selectedIndex:n
        });
        this.refs.ul.getDOMNode().focus();
        if(this.props.onSelect) {
            this.props.onSelect(item,n);
        }
    },
    setSelectedIndex: function(n) {
        if(n < 0) n = 0;
        if(n > this.props.items.length-1) n = this.props.items.length-1;
        var item = this.props.items[n];
        this.setState({
            selected: item,
            selectedIndex: n
        });
        if(this.props.onSelect) {
            this.props.onSelect(item,n);
        }
        this.refs.ul.getDOMNode().focus();
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
    customizer: function(item) {
        return <li>{item.toString()}</li>
    },
    render: function() {
        var customizer = this.customizer;
        if(this.props.customizer) {
            customizer = this.props.customizer;
        }
        var self = this;
        var items = this.props.items.map(function(item,i) {
            return <CustomListItem key={i} ref={'child'+i}
                                   item={item} customizer={customizer}
                                   selected={self.state.selected}
                                   setSelected={self.setSelected}/>
        });
        return <ul ref='ul' className="list scroll grow" tabIndex="0" onKeyDown={this.keyDown}>{items}</ul>
    }
});


module.exports = CustomList;