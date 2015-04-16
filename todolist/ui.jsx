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

var ListModel = {
    cbs:[],
    on: function(cb) {
        this.cbs.push(cb);
    },
    notify: function() {
        this.cbs.forEach(function(cb) {
            cb();
        });
    },
    items: [
        {
            id:'1',
            text:'pack bags and clothing and stuff',
            tags:['travel','work'],
            scheduled: 'today',
            completed:true
        },
        {
            id:'2',
            text:'post office',
            tags:['home'],
            scheduled: 'today',
            completed:false
        },
        {
            id:'3',
            text:'post office 3',
            tags:['home'],
            scheduled: 'today',
            completed:true
        },
        {
            id:'4',
            text:'post office 16',
            tags:['home'],
            scheduled: 'today',
            completed:false
        },
        {
            id:'asdf6623e',
            text:'fly to ca',
            tags:['work'],
            scheduled:'tomorrow'
        },
        {
            id:"asdf987987",
            text:'finish taxes',
            tags:['personal'],
            scheduled:'later'
        }
    ],
    getItems: function(source) {
        console.log("getting items",source);
        if(source == null) return [];
        if(source.type == 'all') {
            return this.items;
        }
        if(source.type == 'time') {
            return this.items.filter(function (item) {
                return item.scheduled === source.id;
            });
        }
        if(source.type == 'tag') {
            return this.items.filter(function (item) {
                return item.tags.indexOf(source.id) >= 0;
            });
        }
    },
    insertItem: function(text,tags,time) {
        this.items.unshift({
            id:'id_'+Math.random(),
            text:text,
            tags:tags.split(","),
            scheduled:time
        });
        this.notify();
    },
    getTimes: function() {
        return [
            {
                type:'all',
                id:'all',
                title:'All',
                icon: ''
            },
            {
                type:'time',
                id:'today',
                title:'Today',
                icon:'fa-star'
            },
            {
                type:'time',
                id:'tomorrow',
                title:'Tomorrow',
                icon:'fa-star-half-empty'
            },
            {
                type:'time',
                id:'later',
                title:'Later',
                icon:'fa-star-o'
            }
        ]
    },
    getTags: function() {
        return [
            {
                type:'tag',
                id: "home",
                title:'Home',
                icon:'fa-tag'
            },
            {
                type:'tag',
                id:"travel",
                title:'Travel',
                icon:'fa-tag'
            },
            {
                type:'tag',
                id:'work',
                title:'Work',
                icon:'fa-tag'
            }
        ];
    },

    findItemIndexById: function(id) {
        var n = -1;
        this.items.forEach(function(item, i){
            if(item.id == id) n = i;
        });
        return n;
    },
    findItemById: function(id) {
        var it = null;
        this.items.forEach(function(item){
            if(item.id == id) it = item;
        });
        return it;
    },
    moveItemBefore: function(sid,tid) {
        var item = this.findItemById(sid);
        this.items.splice(this.findItemIndexById(sid),1); // remove
        this.items.splice(this.findItemIndexById(tid),0,item); //insert
        this.notify();
    },
    moveItemAfter: function(sid,tid) {
        var item = this.findItemById(sid);
        var n = this.findItemIndexById(sid);
        this.items.splice(n,1);
        var n = this.findItemIndexById(tid);
        this.items.splice(n+1,0,item);
        this.notify();
    },
    toggleCompleted: function(id) {
        var item = this.findItemById(id);
        item.completed = item.completed !== true;
        this.notify();
    },
    setScheduled: function(id, sched) {
        var item = this.findItemById(id);
        item.scheduled = sched;
        this.notify();
    }
};

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
        this.refs.item.getDOMNode().focus();
    },
    dragStart: function(e) {
        e.dataTransfer.setData('text/plain', this.props.item.id);
        this.setState({
            dragging:true
        })
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
            currentSource: null,
            dragging:false,
            dropTarget:null,
            selectedIndex:0
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
            var len = ListModel.getItems(this.state.currentSource).length;
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
        if(e.metaKey == true && e.keyCode == 190) { // meta-period
            var index = this.state.selectedIndex;
            var child = this.refs['child'+index];
            ListModel.toggleCompleted(child.props.item.id);
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
    },
    setSelected: function(index) {
        console.log("setting to selected",index);
        if(index <0) index = 0;
        var len = ListModel.getItems(this.state.currentSource).length;
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
    render: function() {
        var self = this;
        var todoItems = ListModel.getItems(this.state.currentSource).map(function(item,i) {
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
                    <ul className="list scroll grow"
                        onKeyDown={this.keyPressed}
                        >{todoItems}</ul>
                </div>
            </div>
            <footer>
                status bar
            </footer>
        </div>)
    }
});
React.render(<MainView/>, document.getElementById("main-view"));