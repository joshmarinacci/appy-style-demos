var React = require('react');

var URLBar = React.createClass({
    keypress: function(e) {
        if(e.key == 'Enter') {
            var url = this.refs.urlfield.getDOMNode().value;
            console.log('set the url to ', url);
            document.getElementById("webview").src = url;
        }
    },
    render: function() {
        return (
        <div className="group grow url-bar">
            <button className="fa fa-file-o"></button>
            <input ref="urlfield" type="text" className="grow" onKeyPress={this.keypress}/>
            <button className="fa fa-star-o"></button>
        </div>)
    }
});


React.render(<URLBar/>, document.getElementById("urlbar"));