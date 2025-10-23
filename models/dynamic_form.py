from odoo import models, fields, api
import json
from datetime import datetime

class DynamicForm(models.Model):
    _name = 'dynamic.form'
    _description = 'Dynamic Form'

    name = fields.Char(string='Form Name', required=True)
    description = fields.Text(string='Description', required=True)
    table_data = fields.Text(string='Table Data', default='{}')  # Stores table structure and data in JSON
    created_date = fields.Datetime(string='Created Date', default=lambda self: fields.Datetime.now())
    created_by = fields.Many2one('res.users', string='Created By', default=lambda self: self.env.user)
    row_ids = fields.One2many('dynamic.form.row', 'form_id', string='Rows')

    @api.model
    def create(self, vals):
        # Initialize empty table structure if not provided
        if 'table_data' not in vals:
            vals['table_data'] = json.dumps({
                'headers': [],
                'rows': [],
                'calculations': {},
                'formulas': {}
            })
        return super(DynamicForm, self).create(vals)

    def write(self, vals):
        # Validate table data format if being updated
        if 'table_data' in vals:
            try:
                table_data = json.loads(vals['table_data'])
                required_keys = ['headers', 'rows', 'calculations', 'formulas']
                if not all(key in table_data for key in required_keys):
                    raise ValueError("Invalid table data structure")
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON format for table data")
        return super(DynamicForm, self).write(vals)

class DynamicFormRow(models.Model):
    _name = 'dynamic.form.row'
    _description = 'Dynamic Form Row'
    _order = 'sequence, id'

    form_id = fields.Many2one('dynamic.form', string='Form', required=True)
    name = fields.Char(string='Row Name', required=True)
    sequence = fields.Integer(string='Sequence', default=10)
    column_ids = fields.One2many('dynamic.form.column', 'row_id', string='Columns')
    formula = fields.Char(string='Row Formula')
    result = fields.Float(string='Calculation Result', compute='_compute_result')

    @api.depends('column_ids', 'formula')
    def _compute_result(self):
        for row in self:
            row.result = row._calculate_formula()

    def _calculate_formula(self):
        # Implementation of formula calculation logic
        return 0.0

class DynamicFormColumn(models.Model):
    _name = 'dynamic.form.column'
    _description = 'Dynamic Form Column'
    _order = 'sequence, id'

    row_id = fields.Many2one('dynamic.form.row', string='Row', required=True)
    name = fields.Char(string='Column Name', required=True)
    sequence = fields.Integer(string='Sequence', default=10)
    value = fields.Float(string='Value')
    formula = fields.Char(string='Cell Formula')
    calculated_value = fields.Float(string='Calculated Value', compute='_compute_calculated_value')
    cell_type = fields.Selection([
        ('number', 'Number'),
        ('formula', 'Formula'),
        ('text', 'Text')
    ], string='Cell Type', default='number')

    @api.depends('value', 'formula', 'cell_type')
    def _compute_calculated_value(self):
        for column in self:
            if column.cell_type == 'formula':
                column.calculated_value = column._evaluate_formula()
            else:
                column.calculated_value = column.value

    def _evaluate_formula(self):
        # Implementation of formula evaluation logic
        return 0.0