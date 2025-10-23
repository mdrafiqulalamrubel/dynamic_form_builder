odoo.define('dynamic_form_builder.DynamicTableWidget', function (require) {
    "use strict";

    var AbstractField = require('web.AbstractField');
    var field_registry = require('web.field_registry');
    var core = require('web.core');

    var DynamicTableWidget = AbstractField.extend({
        template: 'DynamicTableWidget',
        events: {
            'change .cell-input': '_onCellChange',
            'click .add-row': '_onAddRow',
            'click .add-column': '_onAddColumn',
            'click .remove-row': '_onRemoveRow',
            'click .remove-column': '_onRemoveColumn',
        },

        init: function () {
            this._super.apply(this, arguments);
            this.tableData = {};
        },

        _renderEdit: function () {
            this._initializeTable();
            this._renderTable();
        },

        _renderReadonly: function () {
            this._initializeTable();
            this._renderTable(true);
        },

        _initializeTable: function () {
            try {
                this.tableData = JSON.parse(this.value || '{}');
                if (!this.tableData.headers) this.tableData.headers = [];
                if (!this.tableData.rows) this.tableData.rows = [];
                if (!this.tableData.calculations) this.tableData.calculations = {};
                if (!this.tableData.formulas) this.tableData.formulas = {};
            } catch (e) {
                console.error('Failed to parse table data:', e);
                this.tableData = {
                    headers: [],
                    rows: [],
                    calculations: {},
                    formulas: {}
                };
            }
        },

        _renderTable: function (readonly) {
            var $table = $('<table>').addClass('dynamic-table');
            this._renderHeaders($table);
            this._renderRows($table, readonly);
            this.$el.empty().append($table);
            
            if (!readonly) {
                this._renderControls();
            }
        },

        _renderHeaders: function ($table) {
            var $header = $('<tr>');
            $header.append($('<th>')); // Empty corner cell
            
            this.tableData.headers.forEach((header, index) => {
                var $th = $('<th>').text(header);
                $header.append($th);
            });
            
            $table.append($header);
        },

        _renderRows: function ($table, readonly) {
            this.tableData.rows.forEach((row, rowIndex) => {
                var $row = $('<tr>');
                $row.append($('<td>').text('Row ' + (rowIndex + 1)));
                
                row.forEach((cell, colIndex) => {
                    var $cell = this._renderCell(cell, rowIndex, colIndex, readonly);
                    $row.append($cell);
                });
                
                $table.append($row);
            });
        },

        _renderCell: function (cellData, rowIndex, colIndex, readonly) {
            var $cell = $('<td>');
            
            if (readonly) {
                $cell.text(this._calculateCellValue(cellData, rowIndex, colIndex));
            } else {
                var $input = $('<input>')
                    .addClass('cell-input')
                    .attr('type', 'text')
                    .attr('data-row', rowIndex)
                    .attr('data-col', colIndex)
                    .val(cellData);
                $cell.append($input);
            }
            
            return $cell;
        },

        _calculateCellValue: function (cellData, rowIndex, colIndex) {
            if (typeof cellData === 'string' && cellData.startsWith('=')) {
                return this._evaluateFormula(cellData.substr(1), rowIndex, colIndex);
            }
            return cellData;
        },

        _evaluateFormula: function (formula, rowIndex, colIndex) {
            // Basic formula evaluation logic
            try {
                // Replace cell references with values
                var evaluatedFormula = formula.replace(/([A-Z])(\d+)/g, (match, col, row) => {
                    var colIndex = col.charCodeAt(0) - 65;
                    var rowIndex = parseInt(row) - 1;
                    return this.tableData.rows[rowIndex][colIndex] || 0;
                });

                // Handle basic functions
                evaluatedFormula = this._handleFormuleFunctions(evaluatedFormula);

                // Evaluate the formula
                return eval(evaluatedFormula);
            } catch (e) {
                console.error('Formula evaluation error:', e);
                return '#ERROR';
            }
        },

        _handleFormuleFunctions: function (formula) {
            // Handle SUM function
            formula = formula.replace(/SUM\((.*?)\)/g, (match, range) => {
                var values = this._getRangeValues(range);
                return values.reduce((a, b) => a + (parseFloat(b) || 0), 0);
            });

            // Handle AVERAGE function
            formula = formula.replace(/AVERAGE\((.*?)\)/g, (match, range) => {
                var values = this._getRangeValues(range);
                var sum = values.reduce((a, b) => a + (parseFloat(b) || 0), 0);
                return sum / values.length;
            });

            return formula;
        },

        _getRangeValues: function (range) {
            var [start, end] = range.split(':');
            var values = [];

            // Convert A1:B2 format to array indices
            var startCol = start.match(/[A-Z]/)[0].charCodeAt(0) - 65;
            var startRow = parseInt(start.match(/\d+/)[0]) - 1;
            var endCol = end.match(/[A-Z]/)[0].charCodeAt(0) - 65;
            var endRow = parseInt(end.match(/\d+/)[0]) - 1;

            for (var row = startRow; row <= endRow; row++) {
                for (var col = startCol; col <= endCol; col++) {
                    if (this.tableData.rows[row] && this.tableData.rows[row][col] !== undefined) {
                        values.push(this.tableData.rows[row][col]);
                    }
                }
            }

            return values;
        },

        _onCellChange: function (ev) {
            var $target = $(ev.target);
            var row = parseInt($target.data('row'));
            var col = parseInt($target.data('col'));
            var value = $target.val();

            // Update the table data
            this.tableData.rows[row][col] = value;
            this._setValue(JSON.stringify(this.tableData));
        },

        _onAddRow: function () {
            var newRow = Array(this.tableData.headers.length).fill('');
            this.tableData.rows.push(newRow);
            this._setValue(JSON.stringify(this.tableData));
            this._renderTable();
        },

        _onAddColumn: function () {
            var columnName = String.fromCharCode(65 + this.tableData.headers.length);
            this.tableData.headers.push(columnName);
            this.tableData.rows.forEach(row => row.push(''));
            this._setValue(JSON.stringify(this.tableData));
            this._renderTable();
        },

        _onRemoveRow: function () {
            if (this.tableData.rows.length > 0) {
                this.tableData.rows.pop();
                this._setValue(JSON.stringify(this.tableData));
                this._renderTable();
            }
        },

        _onRemoveColumn: function () {
            if (this.tableData.headers.length > 0) {
                this.tableData.headers.pop();
                this.tableData.rows.forEach(row => row.pop());
                this._setValue(JSON.stringify(this.tableData));
                this._renderTable();
            }
        },
    });

    field_registry.add('dynamic_table', DynamicTableWidget);

    return DynamicTableWidget;
});