Ext.define('CA.technicalservices.ProjectPickerDialog',{
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.tsprojectpickerdialog',
    
    width: 400,
    closable: true,
    
    selectedRecords: [],
    
    config: {
        /**
         * @cfg {String}
         * Title to give to the dialog
         */
        title: 'Choose Project',

        selectionButtonText: 'Add'
        
    },
    
    items: [{
        xtype: 'panel',
        border: false,
        items: [{
            xtype:'container', 
            itemId:'selector_container',
            height: 200
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
             * @event projectchosen
             * Fires when user clicks done after choosing project
             * @param {CA.technicalservices.ProjectPickerDialog} this dialog
             * @param [{Object}] projects (project.getData, not the model)
             */
            'projectschosen'
        );
        
        this._buildButtons();
        this._buildDisplayBar();
        this._updateDisplay();
        
        this._buildProjectGrid();
        //this._buildTree();
    },
    
    _buildDisplayBar: function() {
        this.down('panel').addDocked({
            xtype:'container',
            dock: 'top',
            padding: '0 0 10 0',
            layout: 'hbox',
            items: [{
                xtype:'container',
                itemId: 'displayBox', 
                height: 50,
                autoScroll: true
            }]
        });
    },
    
    getDisplayTemplate: function() {
        return new Ext.XTemplate(
            '<tpl for=".">',
                '<span class="project-box" id="s{ObjectID}">{Name}</span>',
            '</tpl>'
        );
    },
    
    _updateDisplay: function() {
        var container = this.down('#displayBox');
        container.removeAll();
        
        var sorted_array = Ext.Array.sort(this.selectedRecords, function(a,b) {
            if ( a.Name < b.Name ) { return -1; }
            if ( a.Name > b.Name ) { return 1; }
            return 0;
        });
        
        Ext.Array.each(sorted_array, function(record,idx){
            container.add({
                xtype:'button',
                cls: 'project-button',
                text: "<span class='icon-delete'></span> " + record.Name,
                listeners: {
                    scope: this, 
                    click: function() {
                        this._removeItem(record);
                    }
                }
            });
        },this);
    },
    
    _removeItem: function(item) {
        this.selectedRecords = Ext.Array.remove(this.selectedRecords, item);
        this._updateDisplay();
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
                        this.fireEvent('projectschosen', this, this.selectedRecords);
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
    
    _addRecordToSelectedRecords: function(record) {
        if ( Ext.isFunction(record.getData ) ) {
            record = record.getData();
        }
        
        // unique by objectID
        var record_hash = {};
        Ext.Array.each( Ext.Array.push(this.selectedRecords, [record] ), function(item) {
            record_hash[item.ObjectID] = item;
        });
        
        this.selectedRecords = Ext.Object.getValues(record_hash);
        this._updateDisplay();
    },
    
    _buildProjectGrid: function() {
        this.selector = this.down('#selector_container').add({
            xtype:'rallytextfield',
            itemId:'searchTerms',
            emptyText: 'Type & Enter to Search Name',
            enableKeyEvents: true,
            flex: 1,
            width: '100%',
            listeners: {
                scope: this,
                keyup: function(field,evt){
                    if ( evt.getKey() === Ext.EventObject.ENTER ) {
                        this._search();
                    }
                },
                afterrender: function(field) {
                    field.focus();
                }
            }
        });
        
        var container = this.down('#selector_container').add({
            xtype:'container', 
            itemId:'selector_container',
            height: 180,
            layout: 'fit'
        });
        
        this.grid = container.add({
            xtype:'rallygrid',
            showRowActionsColumn: false,
            enableEditing: false,
            hideHeaders: true,
            showPagingToolbar: true,
            storeConfig: {
                model:'Project'
            },
            columnCfgs: [{dataIndex:'Name',text:'Click to Add'}],
            listeners: {
                scope: this,
                itemclick: function(grid,record) {
                    this._addRecordToSelectedRecords(record);
                }
            }
        });
    },
    
    _search: function() {
        var terms = this._getSearchTerms();
        console.log('searching for ', terms);
        
        var store = this.grid.getStore();
        store.setFilter(null);
        if (terms) {
            store.setFilter({ property:'Name', operator:'contains', value:terms });
        } 
        store.loadPage(1);
    },

    _getSearchTerms: function() {
        var textBox = this.down('#searchTerms');
        return textBox && textBox.getValue();
    },
        
    _buildTree: function() {
        
        this.tree = Ext.create('Rally.ui.tree.ProjectTree',{
            workspace: Rally.getApp().getContext().getWorkspaceRef(),
            autoScroll: true,
            listeners: {
                scope: this,
                itemselected: function(item) {
                    this._addRecordToSelectedRecords(item.record);
                }
            }
        });
        
        this.down('#grid_container').add(this.tree);
    },
    
    _getGridColumns: function() {
        return [
            { dataIndex: 'Name', flex: 1 }
        ];
    }
});