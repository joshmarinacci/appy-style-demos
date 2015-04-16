var React = require('react');
var ListModel = require('./ListModel');


var ListItem = React.createClass({
    getInitialState: function() {
        return {
            dragging: false,
            under:false
        }
    },
    clicked: function(e) {
        e.preventDefault();
        this.props.setSelected(this.props.index);
    },
    dragStart: function(e) {
        e.dataTransfer.setData('text/plain', this.props.item.id);
        this.setState({
            dragging:true
        });
    },
    dragEnd: function(e) {
        e.preventDefault();
    },
    drop: function(e) {
        var rect = this.refs.item.getDOMNode().getBoundingClientRect();
        this.props.onDrop({
            itemid: e.dataTransfer.getData('text/plain'),
            clientX:e.clientX,
            clientY:e.clientY,
            bounds: rect,
            dropid: this.props.item.id
        });
    },
    dragOver: function(e) {
        e.preventDefault();
        var rect = this.refs.item.getDOMNode().getBoundingClientRect();
        this.props.onDragOver({
            item: this.props.item,
            clientX:e.clientX,
            clientY:e.clientY,
            bounds: rect
        });
    },
    toggleCompleted: function() {
        ListModel.toggleCompleted(this.props.item.id);
    },
    setToday: function() {
        ListModel.setScheduled(this.props.item.id,'today');
    },
    setTomorrow: function() {
        ListModel.setScheduled(this.props.item.id,'tomorrow');
    },
    setLater: function() {
        ListModel.setScheduled(this.props.item.id,'later');
    },
    render: function() {
        var cn = "";
        if(this.props.dropTarget == this.props.item) {
            if(this.props.dropY <= 30) {
                cn += ' drop-target-top';
            } else {
                cn += ' drop-target-bottom';
            }
        }
        if(this.props.index == this.props.selectedIndex) {
            cn += " selected";
        }
        return <li
            ref="item"
            draggable="true"
            onDragStart={this.dragStart}
            onDragEnd={this.dragEnd}
            onDragOver={this.dragOver}
            onDrop={this.drop}
            onClick={this.clicked}
            tabIndex="1"
            className={cn}
            >
            <input type='checkbox'
                   checked={this.props.item.completed}
                   onChange={this.toggleCompleted}
                ></input>
            <div className="contents">
                <div className="contents">
                    <div className="text">{this.props.item.text}</div>
                    <div className="tags">
                        <i className="fa fa-tag"></i> {this.props.item.tags.map(function(tag) {
                        return <span key={tag}> {tag}, </span>
                    })}
                    </div>
                </div>
            </div>
            <div className="group">
                <input type='radio'
                       name={this.props.item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star"
                       value=""
                       checked={this.props.item.scheduled=='today'}
                       onChange={this.setToday}
                    ></input>
                <input type='radio'
                       name={this.props.item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star-half-empty"
                       checked={this.props.item.scheduled=='tomorrow'}
                       onChange={this.setTomorrow}
                       value=""
                    ></input>
                <input type='radio'
                       name={this.props.item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star-o"
                       checked={this.props.item.scheduled=='later'}
                       onChange={this.setLater}
                       value=""
                    ></input>
            </div>
        </li>
    }
});

var CustomList = React.createClass({
    getInitialState: function() {
        return {
            dragging:false,
            dropTarget:null,
            selectedIndex:0
        }
    },
    setSelected: function(index) {
        if(index <0) index = 0;
        var len = this.props.items.length;
        if(index > len -1) {
            index = len-1;
        }
        this.setState({
            selectedIndex:index
        });
        var child = this.refs['child'+index];
        var dom = React.findDOMNode(child);
        dom.focus();
    },
    getSelectedItem: function() {
        var index = this.state.selectedIndex;
        var child = this.refs['child'+index];
        return child.props.item;
    },
    dragOver: function(info) {
        this.setState({
            dragging:true,
            dropTarget:info.item,
            dropY:info.clientY-info.bounds.top
        });
    },
    dragEnd: function(info) {
        //console.log("drag ended",info);
        //console.log("target item = ", info.item.text);
    },
    drop: function(info) {
        //console.log("dropped", info);
        var dropY = info.clientY - info.bounds.top;
        if(dropY < info.bounds.height/2) {
            ListModel.moveItemBefore(info.itemid,info.dropid);
        } else {
            ListModel.moveItemAfter(info.itemid,info.dropid);
        }
        this.setState({
            dragging:false,
            dropTarget:null,
            dropy:-1
        })
    },
    keyPressed: function(e) {
        if(e.metaKey == true && e.key == 'ArrowDown') {
            var len = this.props.items.length;
            if(this.state.selectedIndex >= len-1) return;
            var index = this.state.selectedIndex;
            var child = this.refs['child'+index];
            var sid = child.props.item.id;
            child = this.refs['child'+(index+1)];
            var tid = child.props.item.id;
            ListModel.moveItemAfter(sid,tid);
            this.setSelected(this.state.selectedIndex+1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        if(e.metaKey == true && e.key == 'ArrowUp') {
            if(this.state.selectedIndex <= 0) return;
            var index = this.state.selectedIndex;
            var child = this.refs['child'+index];
            var sid = child.props.item.id;
            child = this.refs['child'+(index-1)];
            var tid = child.props.item.id;
            ListModel.moveItemBefore(sid,tid);
            this.setSelected(this.state.selectedIndex-1);
            e.stopPropagation();
            e.preventDefault();
            return;
        }
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
        if(this.props.onKeyDown) {
            this.props.onKeyDown(e);
        }
    },
    render: function() {
        var self = this;
        var items = this.props.items.map(function(item,i) {
            return <ListItem key={item.id}
                             item={item}
                             ref={'child'+i}
                             index={i}
                             onDragOver={self.dragOver}
                             onDragEnd={self.dragEnd}
                             dropTarget={self.state.dropTarget}
                             dropY={self.state.dropY}
                             onDrop={self.drop}
                             selectedIndex={self.state.selectedIndex}
                             setSelected={self.setSelected}
                />
        });
        return <ul className="list scroll grow"
                   onKeyDown={this.keyPressed}
            >{items}</ul>
    }
});


module.exports = CustomList;