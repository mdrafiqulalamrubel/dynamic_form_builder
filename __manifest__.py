{
    'name': 'Dynamic Form Builder',
    'version': '1.0',
    'category': 'Tools',
    'summary': 'Backend dynamic form builder with calculations and visualization',
    'description': '''
        Create dynamic forms with Excel-like tables, calculations, and visualizations.
        Features:
        - Form description with dynamic tables
        - Excel-like calculations
        - Formula support
        - Row and column operations
    ''',
    'author': 'Md Rafiqul Alam Rubel',
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/dynamic_form_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'dynamic_form_builder/static/src/js/dynamic_table_widget.js',
            'dynamic_form_builder/static/src/scss/dynamic_table.scss',
        ],
        'web.assets_qweb': [
            'dynamic_form_builder/static/src/xml/dynamic_table_widget.xml',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}