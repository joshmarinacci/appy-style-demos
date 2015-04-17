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
        if(source == null) return [];
        if(source.type == 'all') {
            return this.items;
        }
        if(source.type == 'deleted') {
            return this.items.filter(function(item) {
                return item.deleted === true;
            });
        }
        if(source.type == 'completed') {
            return this.items.filter(function(item) {
                return item.completed === true;
            });
        }
        if(source.type == 'time') {
            return this.items.filter(function (item) {
                if(item.deleted === true) return false;
                return item.scheduled === source.id;
            });
        }
        if(source.type == 'tag') {
            return this.items.filter(function (item) {
                if(item.deleted === true) return false;
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
            },
            {
                type:'completed',
                id:'completed',
                title:'Completed',
                icon:'fa-check-square-o'
            },
            {
                type:'deleted',
                id:'deleted',
                title:'Trash',
                icon:'fa-trash-o'
            }
        ]
    },
    getTags: function() {
        var tags = {};
        this.items.forEach(function(item) {
            if(item.deleted === true) return;
            item.tags.forEach(function(tag) {
                tags[tag] = tag;
            });
        });
        var tags_array = [];
        for(var tag in tags) {
            tags_array.push({
                type:'tag',
                id:tag,
                title:tag,
                icon:'fa-tag'
            });
        }
        return tags_array;
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
    },
    deleteItem: function(sid) {
        var item = this.findItemById(sid);
        item.deleted = true;
        this.notify();
    }
};

module.exports = ListModel;