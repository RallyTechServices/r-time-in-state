Ext.define('CA.techservices.picker.MultipleProjectPicker',{
    extend: 'Ext.container.Container',
    alias: 'widget.tsmultiprojectpicker',
    
    margin: 0,
    layout: 'hbox',
    
    items: [
        {xtype:'container',itemId:'buttonBox'}
    ],
    
    config: {
        buttonText: '<span class="icon-shared"></span> +',
        /**
         * 
         * @param Number displayLimit
         * 
         * The number of projects to display after choosing.
         */
        displayLimit: 25, 
        
        selectedRecords: [],
        /**
         * 
         * @param Boolean showProjectNames
         * 
         * if true, show button AND list of chosen project names (up to number of displayLimit)
         */
        showProjectNames: true
    },
    
    getState: function() {
        var me = this,
            state = null,
            sizeModel = me.getSizeModel();

        if (sizeModel.width.configured) {
            state = me.addPropertyToState(state, 'width');
        }
        if (sizeModel.height.configured) {
            state = me.addPropertyToState(state, 'height');
        }
        
        state = me.addPropertyToState(state, 'selectedRecords',  me.selectedRecords);

        return state;
    },
    
//    applyState: function(state) {
//        this.callParent(arguments);
//        if(state.hasOwnProperty('value')) {
//            this.setValue(state.value);
//        }
//        
//        //this.selectedRecords = [];
//        console.log('--applyState', state);
//    },
    
    constructor:function (config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },
    
    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            /**
             * @event projectschosen
             * Fires when user clicks done after choosing projects
             * @param {CA.techservices.picker.MultipleProjectPicker} this selector
             * @param [{Ext.data.wsapi.model}] projects selected
             */
            'change'
        );
        
        if ( this.showProjectNames ) {
            this.add({   
                xtype:'container',
                itemId:'messageBox', 
                layout:'column',
                autoScroll: true,
                height: 50
            });
        }
        this._displayButton();
        this._updateDisplay();
        this.on('staterestore',this._updateDisplay, this, { single: true } );
    },
    
    _updateDisplay: function() {        
        if ( this.down('#projectSelectorButton') ) {
            var text = this.buttonText;
            if (this.selectedRecords.length > 0 ) {
                text = this.selectedRecords.length + " " + text;
            }
            this.down('#projectSelectorButton').setText(text);
        }
        if ( ! this.showProjectNames ) {
            return;
        }
        
        var sorted_array = Ext.Array.sort(this.selectedRecords, function(a,b) {
            if ( a.Name < b.Name ) { return -1; }
            if ( a.Name > b.Name ) { return 1; }
            return 0;
        });
        
        var container = this.down('#messageBox');
        container.removeAll();
        
        Ext.Array.each(sorted_array, function(record,idx){
            
            if ( idx<this.displayLimit ) {
                container.add({
                    xtype:'button',
                    cls: 'project-button',
                    text: record.Name + " <span class='icon-delete'></span>",
                    listeners: {
                        scope: this, 
                        click: function() {
                            this._removeItem(record);
                        }
                    }
                });
            }
        },this);
        
        if ( this.selectedRecords.length > this.displayLimit ) {
            container.add({
                xtype:'container',
                cls: 'project-button',
                html: '...and others'
            });
        }
    },
    
    _removeItem: function(record) {
        this.selectedRecords = Ext.Array.remove(this.selectedRecords, record);
        this.fireEvent('change', this, this.selectedRecords);
        this._updateDisplay();
    },
    
    getValue: function() {
        return this.selectedRecords || [];
    },
    
    _displayButton: function() {
        this.down('#buttonBox').add({
            xtype:'rallybutton',
            cls: 'secondary',
            itemId:'projectSelectorButton',
            text: this.buttonText,
            toolTipText: 'Add Projects',
            listeners: {
                scope: this,
                click: this._showProjectPicker
            }
        });
    },
    
    _showProjectPicker: function() {
        Ext.create('CA.technicalservices.ProjectPickerDialog',{
            autoShow: true,
            selectedRecords: this.selectedRecords,
            listeners: {
                scope: this,
                projectschosen: function(dialog, selectedRecords) {
                    this.selectedRecords = selectedRecords;
                    this.fireEvent('change', this, this.selectedRecords);
                    this._updateDisplay();
                }
            }
        });
    }
    
});