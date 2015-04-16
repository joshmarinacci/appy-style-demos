/*

//check item to mark as completed
//switching to different time updates the item and resyncs the view
//make tag lists work
//add 'all' list

//shortcut to mark as completed
//shortcut to move up and down

move completed items to the bottom. no longer draggable

let you add tags when entering a new item
make items editable by selecting 'edit' button which turns text
    into editable text field
persist items to real database

 */


var React = require('react');
var ListModel = require('./ListModel');
var CustomList = require('./CustomList.jsx');

var SourceItem = React.createClass({
    clicked: function(v) {
        this.props.onSelect(this.props.item);
    },
    render: function() {
        var cn = "fa fa-fw " + this.props.item.icon;
        return (<li key={this.props.item.id}
                    onClick={this.clicked}>
            <i className={cn}></i>
            {this.props.item.title}</li>);
    }
});

var ItemInput = React.createClass({
    getInitialState: function() {
        return {
            text:'',
            tags:''
        }
    },
    entered: function(e) {
        if(e.key == 'Enter') {
            this.addItem();
        }
    },
    addItem: function() {
        ListModel.insertItem(this.state.text, this.state.tags, this.props.time.id);
        this.setState({
            text:"",
            tags:""
        });
    },
    changedText: function() {
        this.setState({
            text: this.refs.itemText.getDOMNode().value
        });
    },
    changedTags: function() {
        this.setState({
            tags: this.refs.itemTags.getDOMNode().value
        });
    },
    render: function() {
        return (<div className="form">
            <div className="row">
                <input ref="itemText" type="text" value={this.state.text}
                       className="grow" placeholder="item text"
                       onKeyPress={this.entered}
                       onChange={this.changedText}
                    />
            </div>
            <div className='row'>
                <input ref="itemTags" type="text" value={this.state.tags}
                       className="grow" placeholder="tags"
                       onKeyPress={this.entered}
                       onChange={this.changedTags}
                    />
                <div className="group">
                    <button className="fa fa-star"></button>
                    <button className="fa fa-star-half-empty"></button>
                    <button className="fa fa-star-o"></button>
                </div>
            </div>
        </div>)
    }
});

var MainView = React.createClass({
    getInitialState: function() {
        return {
            text: '',
            currentSource: null
        }
    },
    componentDidMount: function() {
        var self = this;
        ListModel.on(function() {
            self.forceUpdate();
        })
    },
    sourceSelected: function(item) {
        this.setState({
            currentSource: item
        })
    },
    keyPressed: function(e) {
        if (e.metaKey == true) {
            // meta-delete
            if (e.key == 'Backspace' || e.key == 'Delete') {
                e.stopPropagation();
                return ListModel.deleteItem(this.refs.list.getSelectedItem().id);
            }
            // meta-period
            if (e.keyCode == 190) {
                e.stopPropagation();
                return ListModel.toggleCompleted(this.refs.list.getSelectedItem().id);
            }
        }
    },
    render: function() {
        var self = this;
        var todoItems = ListModel.getItems(this.state.currentSource);
        var times = ListModel.getTimes().map(function(time) {
            return <SourceItem key={time.id} item={time} onSelect={self.sourceSelected}/>
        });
        var tags = ListModel.getTags().map(function(tag) {
            return <SourceItem key={tag.id} item={tag} onSelect={self.sourceSelected}/>
        });

        return(
        <div className="vbox fill">
            <header>
                <span className="grow">Todo List</span>
                <button className='fa fa-share'></button>
            </header>
            <div className="hbox grow">
                <div className="vbox" id="sources-pane">
                    <ul className="list scroll grow">
                        <li className="header">When</li>
                        {times}
                        <li className="header">Categories</li>
                        {tags}
                    </ul>
                </div>
                <div className="vbox grow" id="list-view">
                    <ItemInput time={this.state.currentSource}/>
                    <CustomList
                        ref='list'
                        items={todoItems}
                        onKeyDown={this.keyPressed}
                        />
                </div>
            </div>
            <footer>
                status bar
            </footer>
        </div>)
    }
});
React.render(<MainView/>, document.getElementById("main-view"));