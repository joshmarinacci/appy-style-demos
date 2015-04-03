
var React = require('react');
Object.assign = Object.assign || require('object-assign');
var FixedDataTable = require('fixed-data-table');

var Table = FixedDataTable.Table;
var Column = FixedDataTable.Column;

// Table data as a list of array.
var rows = [
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],
    ['a1', 'b1', 'c1'],
    ['a2', 'b3', 'c2'],
    ['a3', 'b3', 'c3'],

];

function rowGetter(rowIndex) {
    return rows[rowIndex];
}

React.render(
    <Table
        rowHeight={50}
        rowGetter={rowGetter}
        rowsCount={rows.length}
        width={700}
        height={500}
        headerHeight={50}
        id="foo"
        className="blah"
        >
        <Column
            label="Col 1"
            width={300}
            dataKey={0}
        />
        <Column
            label="Col 2"
            width={300}
            dataKey={1}
            />
        <Column
            label="Col 3"
            width={300}
            dataKey={2}
            />
    </Table>,
    document.getElementById('example')
);

