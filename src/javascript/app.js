Ext.define("TSTimeInState", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    
    layout: 'border',
    
    items: [
        {xtype:'container',
            itemId:'selector_box', 
            region:'north', 
            layout: 'hbox', 
            defaults: { margin: 10, layout: 'vbox' },
            items: [
                {xtype:'container', itemId:'artifact_box'},
                {xtype:'container', itemId:'state_selector_box' },
                {xtype:'container', itemId:'date_selector_box' },
                {xtype:'container', itemId:'metric_box' },
                {xtype:'container', itemId:'project_box'},
                {xtype:'container', flex: 1},
                {xtype:'container', itemId:'button_box', layout: 'hbox'}

            ]
        },
        {xtype:'container',itemId:'display_box', region: 'center', layout: 'fit'}
    ],

    integrationHeaders : {
        name : "TSTimeInState"
    },

    launch: function() {
        var filters = Rally.data.wsapi.Filter.or([
            {property:'TypePath', operator: 'contains',  value: 'PortfolioItem/' },
            {property:'Name', value: 'Defect' },
            {property:'Name', value: 'Hierarchical Requirement' }
        ]);
        this.down('#artifact_box').add({
            xtype:'tsrecordtypecombobox',
            fieldLabel: 'Type:',
            typeFilter: filters,

            labelWidth: 60,
            listeners: {
                scope: this,
                change: function(cb) {                    
                    if ( this.process && this.process.getState() == "Pending" ) {
                        this.process.cancel();
                    }
                    
                    this.process = Deft.Chain.sequence([
                        function() { return this._getModel(cb.getValue()); }
                    ],this).then({
                        scope: this,
                        success: function(results) {
                            this.model = results[0];
                            this.model_name = cb.getValue();
                            
                            this._addSelectors();
                        }, 
                        failure: function(msg) {
                            Ext.Msg.alert('',msg);
                        }
                    });
                }
            }
        });
        

    },
    
    _clearBoxes: function(containers){
        Ext.Array.each(containers, function(container){
            container.removeAll();
        });
    },
    
    _addSelectors: function() {
        var field_chooser_box = this.down('#artifact_box');
        var state_chooser_box = this.down('#state_selector_box');
        var date_chooser_box  = this.down('#date_selector_box');
        var button_box        = this.down('#button_box');
        var metric_box        = this.down('#metric_box');
        var project_box       = this.down('#project_box');
        
        this._clearBoxes([state_chooser_box, metric_box, project_box,
            date_chooser_box, button_box]);
        
        if ( this.down('rallyfieldcombobox') ) {
            this.down('rallyfieldcombobox').destroy();
        }
        
        field_chooser_box.add({
            xtype:'rallyfieldcombobox',
            model:this.model,
            _isNotHidden: this._isNotHidden,
            fieldLabel: 'State Field:',
            labelWidth: 60,
            stateful: true,
            stateId: 'techservices-timeinstate-fieldcombo',
            stateEvents:['change'],
            listeners: {
                scope: this,
                change: function(cb) {
                    this._addStateSelectors(state_chooser_box, cb.getValue());
                }
            }
        });
        
        this._addDateSelectors(date_chooser_box);
                
        var project_oid = this.getContext().getProject().ObjectID;
        
        metric_box.add({
            xtype:'rallymultiobjectpicker',
            itemId: 'project_selector',
            modelType: 'Project',
            fieldLabel: 'Project(s):',
            labelWidth: 60
        });
        
        metric_box.add({
            xtype:'rallycombobox',
            itemId: 'metric_selector',
            storeConfig: {
                data: [{display:'Hours',value: 'Hours'},{display:'Days', value:'Days'}]
            },
            storeType: 'Rally.data.custom.Store',
            displayField: 'display',
            valueField: 'value',
            fieldLabel: 'Measure:',
            labelWidth: 60,
            stateful: true,
            stateId: 'techservices-timeinstate-metriccombo',
            stateEvents:['change']
        });
        
        button_box.add({
            xtype:'tscolumnpickerbutton',
            cls: 'secondary big',
            columns: this._getPickableColumns(),
            stateful: true,
            stateId: 'techservices-timeinstate-fieldpickerbutton',
            stateEvents: ['columnsChosen']
        });
        
        button_box.add({ 
            xtype:'rallybutton', 
            text: 'Update', 
            padding: 3,
            listeners: {
                scope: this,
                click: this._updateData
            }
        });
        
        button_box.add({
            xtype:'rallybutton',
            itemId:'export_button',
            cls: 'secondary small',
            text: '<span class="icon-export"> </span>',
            disabled: true,
            listeners: {
                scope: this,
                click: function() {
                    this._export();
                }
            }
        });
    },
    
    _addStateSelectors: function(container, field_name) {
        container.removeAll();
        this.state_field_name = field_name;
        var label_width = 60;
        
        container.add({
            xtype:'rallyfieldvaluecombobox',
            model: this.model,
            itemId: 'start_state_selector',
            field: field_name,
            fieldLabel: 'Start State:',
            labelWidth: label_width,
            stateful: true,
            stateEvents: ['change'],
            stateId: 'techservices-timeinstate-startstatecombo'
        });
        
        container.add({
            xtype:'rallyfieldvaluecombobox',
            model: this.model,
            itemId: 'end_state_selector',
            field: field_name,
            fieldLabel: 'End State:',
            labelWidth: label_width,
            stateful: true,
            stateEvents: ['change'],
            stateId: 'techservices-timeinstate-endstatecombo'
        });
    },
    
    _addDateSelectors: function(container) {
        container.removeAll();
        var label_width = 60;
        
        container.add({
            xtype:'rallydatefield',
            itemId: 'start_date_selector',
            fieldLabel: 'Start Date:',
            labelWidth: label_width,
            stateful: true,
            stateEvents: ['change'],
            stateId: 'techservices-timeinstate-startdatecombo'
        });
        
        container.add({
            xtype:'rallydatefield',
            itemId: 'end_date_selector',
            fieldLabel: 'End Date:',
            labelWidth: label_width,
            stateful: true,
            stateEvents: ['change'],
            stateId: 'techservices-timeinstate-enddatecombo'
        });
    },
    
      
    _isNotHidden: function(field) {
        if ( field.hidden ) {
            return false;
        }
        var attributeDefn = field.attributeDefinition;
        
        if ( Ext.isEmpty(attributeDefn) ) {
            return false;
        }
        
        if ( field.name == "State" ) {
            return true;
        }
        
        if ( attributeDefn.AttributeType == "STATE" ) {
            return true;
        }
        
        if ( attributeDefn.AttributeType == "STRING" && attributeDefn.Constrained == true) {
            return true;
        }
        //this.logger.log(field);

        return false;
    },
    
    _updateData: function() {
        var model = this.model;
        var field_name = this.state_field_name;
        this.down('#export_button').setDisabled(true);
        
        this.startState = this.down('#start_state_selector').getValue();
        this.endState   = this.down('#end_state_selector').getValue();
        if ( field_name == "State"  && /Portfolio/.test(this.model_name) ) {
            this.startState = this.down('#start_state_selector').getRecord().get('name');
            this.endState   = this.down('#end_state_selector').getRecord().get('name');
        }
        this.startDate  = this.down('#start_date_selector').getValue();
        this.endDate    = this.down('#end_date_selector').getValue();
        
        if ( Ext.isEmpty(this.startState) || Ext.isEmpty(this.endState) ) {
            return;
        }
        
        Deft.Chain.pipeline([
            function() { return this._setValidStates(this._getModelNameFromModel(this.model), field_name) },
            function(states) { return this._getChangeSnapshots(field_name, this.model); },
            this._addProjectsToSnapshots,
            this._organizeSnapshotsByOid,
            function(snaps_by_oid) { return this._setTimeInStatesForAll(snaps_by_oid, field_name); }
        ],this).then({
            scope: this,
            success: function(rows_by_oid) {
                var rows = Ext.Object.getValues(rows_by_oid);
                rows = this._removeItemsOutsideTimeboxes(rows);
                
                this._makeGrid(rows);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem loading data', msg);
            }
            
        });
    },
    
    _removeItemsOutsideTimeboxes: function(rows) {
        if ( Ext.isEmpty(this.startDate) && Ext.isEmpty(this.endDate) ) {
            return rows;
        }
        
        var filtered_rows = this._getRowsAfter(rows,this.startDate);
        
        filtered_rows = this._getRowsBefore(filtered_rows,this.endDate);
       
        return filtered_rows;
    },
    
    _getRowsAfter: function(rows, start_date) {
        var enter_field = 'firstEntry_' + this.startState;
                
        if ( Ext.isEmpty(start_date) ) {
            return rows;
        }
        
        return Ext.Array.filter(rows,function(row){
            var enter = row[enter_field];
            if ( Ext.isEmpty(enter) ) {
                return false;
            }
            return ( Rally.util.DateTime.toIsoString(start_date) <= enter );
        });
    },
    
    _getRowsBefore: function(rows, end_date) {
        var enter_field = 'firstEntry_' + this.startState;
        if ( Ext.isEmpty(end_date) ) {
            return rows;
        }
        
        return Ext.Array.filter(rows,function(row){
            var enter = row[enter_field];
            if ( Ext.isEmpty(enter) ) {
                return false;
            }
            return ( Rally.util.DateTime.toIsoString(end_date) >= enter );
        });
    },
    
    _setTimeInStatesForAll: function(snaps_by_oid,field_name) {
        var rows_by_oid = {},
            me = this;
        Ext.Object.each(snaps_by_oid, function(key, snaps) {
            rows_by_oid[key] = me._calculateTimeInState(snaps,field_name);
        });
        return rows_by_oid;
    },
    
    _calculateTimeInState: function(snapshots, field_name) {
        var me = this;
        
        var entries = {};  // date of entry into state, used for calc
        var last_index = snapshots.length-1;
        
        var row = Ext.Object.merge({
            snapshots: snapshots,
    //            FormattedID: snapshots[last_index].get('FormattedID'),
    //            Name: snapshots[last_index].get('Name'),
    //            Project: snapshots[last_index].get('Project'),
                __ProjectName: snapshots[last_index].get('__ProjectName'),
                __Project: snapshots[last_index].get('__Project')
            }, 
            snapshots[last_index].getData()
        );
                
        Ext.Array.each(this.allowedStates, function(state){
            row[state] = 0;
            entries[state] = null;
            row['firstEntry_' + state] = null;
            row['lastExit_' + state] = null;
        });
        
        Ext.Array.each(snapshots,function(snap){
            var in_state = snap.get(field_name);
            var snap_time = snap.get('_ValidFrom');
            
            entries[in_state] = snap_time;
            row['lastExit_' + in_state] = null; // clear out for re-entry
            
            if ( Ext.isEmpty(row['firstEntry_' + in_state]) ) {
                row['firstEntry_' + in_state] = snap_time;
            }
            
            var out_state = snap.get('_PreviousValues.' + field_name);

            if ( ! Ext.isEmpty(entries[out_state]) ) {
                var jsStart = Rally.util.DateTime.fromIsoString(entries[out_state]);
                var jsEnd   = Rally.util.DateTime.fromIsoString(snap_time);
                
                var delta = Rally.util.DateTime.getDifference(jsEnd, jsStart, 'minute');

                row[out_state] = row[out_state] + delta;
                row['lastExit_' + out_state] = snap_time;
            }
        });
        
        return row;
    },
    
    _getModelNameFromModel: function(model) {
//        var model_name = model.getName();
//        return model_name.replace(/.*\./,'');
        return this.model_name;
    },
    
    _setValidStates: function(model_name, field_name) {
        this.logger.log('_setValidStates', model_name);
        
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        
        this.logger.log('model:', model_name);
        
        var store = this.down('rallyfieldvaluecombobox').getStore();
        var count = store.getTotalCount();
        
        var values = [];
        for ( var i=0; i<count; i++ ) {
            var value = store.getAt(i);
            
            if ( !Ext.isEmpty(value.get('value'))) {
                values.push(value.get('name'));
            }
        }
        this.logger.log('allowedStates', values);
        me.allowedStates = values;
        
        return values;
        
//        this.model.getField(field_name).getAllowedValueStore().load({
//            sorters: [{
//                    property: 'ValueIndex',
//                    direction: 'ASC'
//            }],
//            callback: function(records, operation, success) {
//                me.allowedStates = Ext.Array.map(records, function(allowedValue) {
//                    console.log('---', records);
//                    //each record is an instance of the AllowedAttributeValue model 
//                   return allowedValue.get('StringValue');
//                });
//                
//                deferred.resolve(me.allowedStates);
//            }
//        });

//        return deferred.promise;
    },
    
    _organizeSnapshotsByOid: function(snapshots) {
        var snapshots_by_oid = {};
        
        Ext.Array.each(snapshots, function(snap){
            var oid = snap.get('ObjectID');
            
            if ( Ext.isEmpty(snapshots_by_oid[oid]) ) {
                snapshots_by_oid[oid] = [];
            }
            
            snapshots_by_oid[oid].push(snap);
            
        });
        
        return snapshots_by_oid;
    },
    
    _getChangeSnapshots: function(field_name, model) {
        var change_into_states_filter = Ext.create('Rally.data.lookback.QueryFilter', {
            property: '_PreviousValues.' + field_name,
            operator: 'exists',
            value: true
        });
        
        var model_filter = Ext.create('Rally.data.lookback.QueryFilter', {
            property: '_TypeHierarchy',
            value: this._getModelNameFromModel(model)
        });
        
        var projects = this.down('#project_selector').getValue();
        
        var project_filter = null;
        if ( projects.length > 0 ) {
            project_filter = Rally.data.lookback.QueryFilter.or(
                Ext.Array.map(projects, function(p){
                    return { property: 'Project', value: p.get('ObjectID') }
                })
            );
        } else {
            project_filter = Ext.create('Rally.data.lookback.QueryFilter', {
                property: '_ProjectHierarchy',
                value: this.getContext().getProject().ObjectID
            });
        }
        
        var current_filter = Ext.create('Rally.data.lookback.QueryFilter',{
            property: '__At', 
            value: 'current' 
        });
        
       
        var change_filters = change_into_states_filter.and(model_filter).and(project_filter);
        var current_filters = model_filter.and(project_filter).and(current_filter);
        
        var filters = change_filters.or(current_filters);
        
        var fetch_base = ['ObjectID','FormattedID','Name',
            'Project','_TypeHierarchy','_PreviousValues',
            field_name,'_PreviousValues.' + field_name,
            'Iteration', 'Release','State'];
        
        var fetch_added = Ext.Array.map(this._getPickedColumns(), function(col) {
            return col.dataIndex;
        });
        
        var config = {
            filters: filters,
            fetch: Ext.Array.merge(fetch_base, fetch_added),
            hydrate: ['Iteration','Release','_PreviousValues.'+field_name,'State',field_name]
        };
        
        return this._loadSnapshots(config);
    },
    
    _addProjectsToSnapshots: function(snapshots) {
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        var project_oids = Ext.Array.map(snapshots, function(snap){ return snap.get('Project')});
        
        if ( project_oids.length === 0 ) {
            return snapshots;
        }
        var unique_project_oids = Ext.Array.unique(project_oids);
        
        var filters = Ext.Array.map(unique_project_oids, function(oid) {
            return { property:'ObjectID', value: oid };
        });
        
        var config = {
            model: 'Project',
            filters: Rally.data.wsapi.Filter.or(filters),
            fetch: ['ObjectID','Name'],
            limit: Infinity
        };
        
        this.setLoading('Loading Project Names...');
        
        this._loadWsapiRecords(config).then({
            success: function(projects) {
                var projects_by_oid = {};
                Ext.Array.each(projects, function(project){
                    var oid = project.get('ObjectID');
                    projects_by_oid[oid] = project;
                });
                
                Ext.Array.each(snapshots, function(snap){
                    var oid = snap.get('Project');
                    if ( !Ext.isEmpty(projects_by_oid[oid])) {
                        snap.set('__Project',projects_by_oid[oid].getData());
                        snap.set('__ProjectName', projects_by_oid[oid].get('Name'));
                    } else {
                        snap.set('__Project', {});
                        snap.set('__ProjectName', "");
                    }
                });
                me.setLoading(false);
                deferred.resolve(snapshots);
            },
            failure: function(msg) {
                deferred.reject(msg);
            }
        });
        
        return deferred.promise;
    },

    _loadSnapshots: function(config){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        var default_config = {
            removeUnauthorizedSnapshots: true
        };
        
        this.setLoading('Loading history...');
        this.logger.log("Starting load:",config);
        
        Ext.create('Rally.data.lookback.SnapshotStore', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    me.setLoading(false);
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _getModel: function(model_name) {
        var deferred = Ext.create('Deft.Deferred');
        Rally.data.ModelFactory.getModel({
            type: model_name,
            success: function(model) {
                deferred.resolve(model);
            },
            failure: function() {
                deferred.reject('cannot load model');
            }
        });
        return deferred.promise;
    },
    
    _loadWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        var default_config = {
            model: 'Defect',
            fetch: ['ObjectID']
        };
        this.logger.log("Starting load:",config.model);
        Ext.create('Rally.data.wsapi.Store', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _makeGrid: function(rows){
        this.rows = rows;
        this.down('#export_button').setDisabled(false);

        var container = this.down('#display_box');
        container.removeAll();
        
        var store = Ext.create('Rally.data.custom.Store',{ data: rows });
        
        container.add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: this._getColumns()
        });
    },
    
    _getShowStates: function(allowed_states, start_state, end_state) {
        this.logger.log('_getShowStates', start_state, end_state);
        
        var start_index = Ext.Array.indexOf(allowed_states, start_state);
        var end_index   = Ext.Array.indexOf(allowed_states, end_state);
        
        // swap if chosen out of order
        if ( start_index > end_index ) {
            var holder = start_index;
            start_index = end_index;
            end_index = holder;
        }
        
        return ( 
            Ext.Array.filter(allowed_states, function(state,idx) {
                return ( idx >= start_index && idx <= end_index );
            })
        );
    },
    
    _getPickedColumns: function() {
        if ( Ext.isEmpty( this.down('tscolumnpickerbutton') ) ) {
            return [];
        }
        
        return this.down('tscolumnpickerbutton').getChosenColumns();
    },
    
    
    _getPickableColumns: function() {

        var filtered_fields = Ext.Array.filter(this.model.getFields(), function(field){
            if ( field.hidden ) {
                return false;
            }
            
            if ( field.name == "FormattedID" || field.name == "Name" ) {
                return false;
            }
            
            if ( field.name == "Iteration" || field.name == "Release" ) {
                return true;
            }
            
            var attributeDefn = field.attributeDefinition;
            if ( Ext.isEmpty(attributeDefn) ) {
                return false;
            }
            
            if ( attributeDefn.AttributeType == "STRING" ) {
                return true;
            }
            
            if ( attributeDefn.AttributeType == "DECIMAL" ) {
                return true;
            }
            
            if ( attributeDefn.AttributeType == "BOOLEAN" ) {
                return true;
            }
            
            if ( attributeDefn.AttributeType == "QUANTITY" ) {
                return true;
            }
            
            //console.log(field.name, field);
            return false;
        });
        
        var object_renderer = function(value, meta, record) {
            console.log('value:', value);
            if ( Ext.isEmpty(value) ) { return ""; }
            if ( Ext.isObject(value) ) { return value.Name || value.DisplayName; }
            
            return value;
        }
        
        return Ext.Array.map(filtered_fields, function(field) {
            return {
                dataIndex:field.name,
                text: field.displayName, 
                hidden: true,
                renderer: object_renderer
            };
        });
    },
    
    _getColumns: function() {
        var me = this;
        
        var metric = me.down('#metric_selector').getValue();
        
        var columns = [
            { dataIndex: 'FormattedID', text: 'id', width: 75 },
            { dataIndex: 'Name', text: 'Name', width: 200 },
            { dataIndex: '__ProjectName', text:'Project', width: 155 }
        ];
        
        columns = Ext.Array.push(columns, this._getPickedColumns() );
        
        var show_states = this._getShowStates(this.allowedStates, this.startState, this.endState);
        
        this.logger.log('show states', show_states);
        
        Ext.Array.each(show_states, function(state) {
            columns.push({
                dataIndex: state,
                text: Ext.String.format('{0} ({1})', state, metric),
                align: 'right',
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) { return ""; }
                    
                    if ( metric == "Days" ) {
                        return Ext.Number.toFixed( value / 1440, 2 ); // it's in minutes
                    } 
                    
                    return Ext.Number.toFixed( value / 60, 1 );
                }
            });
            
            columns.push({
                dataIndex: 'firstEntry_' + state,
                text: state + ' first entered',
                align: 'right',
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) { return ""; }
                    return value;
                }
            });
            
            columns.push({
                dataIndex: 'lastExit_' + state,
                text: state + ' last exited',
                align: 'right',
                renderer: function(value, meta, record) {
                    if ( Ext.isEmpty(value) ) { return ""; }
                    return value;
                }
            });
        });
        
        this.logger.log('columns:', columns);
        return columns;
    },
    
    _export: function(){
        var me = this;
        this.logger.log('_export');
        
        var grid = this.down('rallygrid');
        var rows = this.rows;
        
        this.logger.log('number of rows:', rows.length);
        
        if ( !grid && !rows ) { return; }
        
        var filename = 'time-in-state-report.csv';

        this.logger.log('saving file:', filename);
        
        this.setLoading("Generating CSV");
        Deft.Chain.sequence([
            function() { return Rally.technicalservices.FileUtilities.getCSVFromRows(this,grid,rows); } 
        ]).then({
            scope: this,
            success: function(csv){
                this.logger.log('got back csv ', csv.length);
                if (csv && csv.length > 0){
                    Rally.technicalservices.FileUtilities.saveCSVToFile(csv,filename);
                } else {
                    Rally.ui.notify.Notifier.showWarning({message: 'No data to export'});
                }
                
            }
        }).always(function() { me.setLoading(false); });
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
