from odoo import models, fields, api

class DynamicForm(models.Model):
    _name = 'dynamic.form'
    _description = 'Dynamic Form'

    name = fields.Char(string='Form Name', required=True)
    row_ids = fields.One2many('dynamic.form.row', 'form_id', string='Rows')

class DynamicFormRow(models.Model):
    _name = 'dynamic.form.row'
    _description = 'Dynamic Form Row'

    form_id = fields.Many2one('dynamic.form', string='Form')
    name = fields.Char(string='Row Name')
    column_ids = fields.One2many('dynamic.form.column', 'row_id', string='Columns')

class DynamicFormColumn(models.Model):
    _name = 'dynamic.form.column'
    _description = 'Dynamic Form Column'

    row_id = fields.Many2one('dynamic.form.row', string='Row')
    name = fields.Char(string='Column Name')
    value = fields.Float(string='Value')
    calculated_value = fields.Float(string='Calculated Value', compute='_compute_calculated_value')

    @api.depends('value')
    def _compute_calculated_value(self):
        for col in self:
            col.calculated_value = col.value * 2  # Example calculation
