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
    clicked: function(e) {
        if(this.props.item.header == true) return;

        e.stopPropagation();
        this.props.setSelected(this.props.index);
    },
    render: function() {
        var cn = "fa fa-fw " + this.props.item.icon;
        if(this.props.item.header == true) {
            return <li className='header'>{this.props.item.title}</li>;
        }
        var cn2 = "";
        if(this.props.index == this.props.selectedIndex) {
            cn2 += " selected";
        }
        return (<li className={cn2} key={this.props.item.id} onClick={this.clicked}><i className={cn}></i>{this.props.item.title}</li>);
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

var TodoItemView = React.createClass({
    clicked: function(e) {
        e.stopPropagation();
        this.props.setSelected(this.props.index);
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
    toggleCompleted: function() {
        ListModel.toggleCompleted(this.props.item.id);
    },
    dragStart: function(e) {
        console.log("starting to drag");
        /*
        e.dataTransfer.setData('text/plain', this.props.item.id);
        this.setState({
            dragging:true
        });
        */
    },
    render: function() {
        var item = this.props.item;
        var cn = "";
        if(this.props.index == this.props.selectedIndex) {
            cn += " selected";
        }
        return <li
            ref="item"
            draggable="true"
            //onDragStart={this.dragStart}
            //onDragEnd={this.dragEnd}
            //onDragOver={this.dragOver}
            //onDrop={this.drop}
            onDragStart={this.dragStart}
            onClick={this.clicked}
            tabIndex="1"
            className={cn}
            >
            <input type='checkbox'
                   checked={item.completed}
                   onChange={this.toggleCompleted}
                ></input>
            <div className="contents">
                <div className="contents">
                    <div className="text">{item.text}</div>
                    <div className="tags">
                        <i className="fa fa-tag"></i> {item.tags.map(function(tag) {
                        return <span key={tag}> {tag}, </span>
                    })}
                    </div>
                </div>
            </div>
            <div className="group">
                <input type='radio'
                       name={item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star"
                       value=""
                       checked={item.scheduled=='today'}
                       onChange={this.setToday}
                    ></input>
                <input type='radio'
                       name={item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star-half-empty"
                       checked={item.scheduled=='tomorrow'}
                       onChange={this.setTomorrow}
                       value=""
                    ></input>
                <input type='radio'
                       name={item.id+'time'}
                       ref="scheduled"
                       className="button fa fa-star-o"
                       checked={item.scheduled=='later'}
                       onChange={this.setLater}
                       value=""
                    ></input>
            </div>
        </li>
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
        console.log('selected source',item);
        this.setState({
            currentSource: item
        });
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
        var todoItems = ListModel.getItems(this.state.currentSource);
        var times = [{
            id:'when',
            title:'When',
            header:true
        }]
            .concat(ListModel.getTimes())
            .concat([{ id:'categories',title:'Categories',header:true}])
            .concat(ListModel.getTags());
        return(
        <div className="vbox fill">
            <header>
                <span className="grow">Todo List</span>
                <button className='fa fa-share'></button>
            </header>
            <div className="hbox grow">
                <div className="vbox" id="sources-pane">
                    <CustomList
                        ref='list'
                        items={times}
                        onSelect={this.sourceSelected}
                        template={<SourceItem/>}
                        >
                        </CustomList>
                </div>
                <div className="vbox grow" id="list-view">
                    <ItemInput time={this.state.currentSource}/>
                    <CustomList
                        ref='list'
                        items={todoItems}
                        template={<TodoItemView/>}
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