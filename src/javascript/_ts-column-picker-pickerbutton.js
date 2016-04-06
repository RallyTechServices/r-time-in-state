Ext.define('CA.technicalservices.ColumnPickerButton',{
    extend: 'Rally.ui.Button',
    requires: [
        'CA.technicalservices.ColumnPickerDialog'
    ],
    
    alias: 'widget.tscolumnpickerbutton',
    
    chosenColumnNames: [],
    
    config: {
        columns: [],
        text: '<span class="icon-add-column"> </span>'
    },
    
    getState: function(){
        console.log('getState', this.chosenColumnNames);
        
        return { chosenColumnNames: this.chosenColumnNames };
    },
    
    applyState: function(state) {
        if (state) {
            Ext.apply(this, state);
        }

        // save chosen columns, but the renderer gets stripped
        // put it back by only saving the column names
        
        Ext.Array.each(this.chosenColumnNames, function(name) {
            Ext.Array.each(this.columns, function(col) {
                if ( col.text == name ) {
                    col.hidden = false;
                }
            });
        },this);
        
    },
    
    constructor:function (config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },
    
    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            /**
             * @event columnsChosen
             * Fires when user clicks done after choosing columns
             * @param {CA.technicalservices.ColumnPickerButton} this button
             * @param [{Ext.column.Column}] columns with hidden marked true/false as appropriate
             */
            'columnsChosen'
        );
        
        this.columns = Ext.Array.sort(this.columns, function(a,b){
            if ( a.text < b.text ) { return -1; }
            if ( a.text > b.text ) { return  1;}
            return 0;
        });
    },
    
    afterRender: function() {
        this.callParent(arguments);
        this.mon(this.el, this.clickEvent, this._showDialog, this);
    },
    
    getChosenColumns: function() {
        
        return Ext.Array.filter(this.columns, function(column){
            return ( ! column.hidden );
        });
    },
    
    _showDialog: function() {
        var me = this;
        Ext.create('CA.technicalservices.ColumnPickerDialog',{
            autoShow: true,
            pickableColumns: this.columns,
            listeners: {
                scope: this,
                columnsChosen: function(dialog, columns) {
                    this.columns = columns;
                    
                    this.chosenColumnNames = Ext.Array.map(this.getChosenColumns(), function(col) {
                        return col.text;
                    });
                    this.fireEvent('columnsChosen', me, columns);
                }
                
            }
        });
    }
});