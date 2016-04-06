Ext.define('CA.technicalservices.ColumnPickerDialog',{
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.tscolumnpickerdialog',
    
    width: 200,
    closable: true,
    
    config: {
        /**
         * @cfg {String}
         * Title to give to the dialog
         */
        title: 'Choose Columns',
        /**
         * @cfg {Boolean}
         * Allow multiple selection or not
         */
        multiple: true,
        /**
         * 
         * @cfg [{Ext.Column.column}]  columns that
         * can be chosen.  hidden = false means chosen to 
         * show.
         *  
         */
        pickableColumns: [],
        
        selectionButtonText: 'Use'
        
    },
    
    items: [{
        xtype: 'panel',
        border: false,
        items: [{
            xtype:'container', 
            itemId:'grid_container',
            layout: 'fit',
            height: 325
        }]
    }],

    constructor: function(config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },

    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            /**
             * @event columnsChosen
             * Fires when user clicks done after choosing columns
             * @param {CA.technicalservices.ColumnPickerDialog} this dialog
             * @param [{Ext.column.Column}] columns with hidden marked true/false as appropriate
             */
            'columnsChosen'
        );
        
        this._buildButtons();
        //this._buildSearchBar();
        this._buildGrid();
    },
    
    _buildButtons: function() {
        this.down('panel').addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            padding: '0 0 10 0',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    text: this.selectionButtonText,
                    cls: 'primary small',
                    scope: this,
                    userAction: 'clicked done in dialog',
                    handler: function() {
                        var selectedRecords = this.getRecordsWithSelection();
                        this.fireEvent('columnsChosen', this, selectedRecords);
                        this.close();
                    }
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    cls: 'secondary small',
                    handler: this.close,
                    scope: this,
                    ui: 'link'
                }
            ]
        });
    },
    
    _buildGrid: function() {
        var mode = this.multiple ? 'MULTI' : 'SINGLE';
        this.selectionModel = Ext.create('Rally.ui.selection.CheckboxModel', {
            mode: mode,
            allowDeselect: true
        });
        
        var pickableColumns = this.pickableColumns;
        
        var store = Ext.create('Rally.data.custom.Store',{
            data: this.pickableColumns,
            pageSize: 75
        });
        
        
        this.grid = Ext.create('Rally.ui.grid.Grid', {
            selModel: this.selectionModel,
            enableColumnHide: false,
            enableColumnMove: false,
            columnCfgs: this._getGridColumns(),
            showPagingToolbar: false,
            store: store,
            listeners: {
                viewready: function(grid) {
                    var selectionModel = grid.getSelectionModel();
                    
                    Ext.Array.each(pickableColumns, function(col, idx){
                        if ( !col.hidden ) {
                            selectionModel.select(grid.store.data.items[idx],true);
                        }
                    });
                }
            }
        });
        
        this.down('#grid_container').add(this.grid);
    },
    
    _getGridColumns: function() {
        return [
            { dataIndex: 'text', flex: 1 }
        ];
    },
    
    getRecordsWithSelection: function() {
        var selected_items = this.grid.getSelectionModel().getSelection(); 
        var selected_items_by_dataindex = {};
        Ext.Array.each(selected_items, function(selected_item){
            selected_items_by_dataindex[selected_item.get('text')] = selected_item.getData();
        });
        
        Ext.Array.each(this.pickableColumns, function(pickableColumn){
            pickableColumn.hidden = Ext.isEmpty(selected_items_by_dataindex[pickableColumn.text]);
        });
        
        return this.pickableColumns;
    }
});