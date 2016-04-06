Ext.define('Rally.ui.combobox.PortfolioItemTypeComboBox', {

    extend: 'Rally.ui.combobox.ComboBox',
    alias: 'widget.tsrecordtypecombobox',

    preferenceName: 'tsTypeCombo',

    config: {
        
        typeFilter: [
            {
                property: 'Parent.Name',
                operator: '=',
                value: 'Portfolio Item'
            },
            {
                property: 'Creatable',
                operator: '=',
                value: 'true'
            }
        ],
        
        typeSorter: [{
            property: 'Ordinal',
            direction: 'Desc'
        }],
        
        valueField: 'TypePath',
        displayField: 'Name'
    },
    
    constructor: function(config) {
        if ( Ext.isEmpty(config.typeFilter) || config.typeFilter == [] || config.typeFilter == {} ) {
            config.typeFilter = [{ property:'ObjectID', operator: '>', value: 0 }];
        }
        if ( Ext.isObject( config.typeFilter ) ) {
            config.typeFilter = [config.typeFilter];
        }
        
        
        var defaultConfig = {
            defaultSelectionPosition: 'last',
            editable: false,
            fieldLabel: 'Type:',
            labelWidth: 30,
            context: Rally.environment.getContext(),
            storeConfig: {
                autoLoad: false,
                remoteFilter: true,
                model: Ext.identityFn('TypeDefinition'),
                sorters: config.typeSorter,
                filters: config.typeFilter
            }
        };

        if (config.storeConfig) {
            delete config.storeConfig.autoLoad;

            if (config.storeConfig.additionalFilters) {
                defaultConfig.storeConfig.filters = defaultConfig.storeConfig.filters.concat(config.storeConfig.additionalFilters);
            }
        }

        this.callParent([Ext.Object.merge(defaultConfig, config)]);
    },

    initComponent: function() {
        this.callParent();

        Deft.Promise.all([this.getPreference(), this._loadStore()]).then({
            success: function (results) {
                var pref = results[0];
                if (pref && this._isPrefValueInStore(pref)) {
                    this.setValue(pref);
                }
                this.on('change', this._onValueChange, this);
                this.onReady({ preferencesLoaded: true, record: this.getRecord() });
            },
            scope: this
        });
    },

    onReady: function (options) {
        options = options || {};

        // Only call the base onReady (which fires the 'ready' event, when both the store and preferences have loaded
        if (options.preferencesLoaded) {
            this.fireEvent('select', options.record);
            this.callParent(arguments);
        }
    },

    getSelectedType: function () {
        return this.getTypeFromRef(this.getValue());
    },

    getTypeFromRef: function (typeRef) {
        return this.getStore().findRecord('_ref', typeRef);
    },

    getTypeWithOrdinal: function(ordinal) {
        return this.getStore().findRecord("Ordinal", ordinal);
    },

    getAllTypeNames: function () {
        return _.map(this.getStore().getRecords(), function (type) { return type.get('TypePath'); });
    },

    _onValueChange: function(field, newValue) {
        this.savePreference(newValue);
    },

    _loadStore: function () {
        var deferred = new Deft.Deferred();

        this.store.load({
            callback: function (records, operation, success) {
                if (success) {
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            },
            scope: this
        });

        return deferred.promise;
    },

    getPreference: function() {
        var deferred = new Deft.Deferred();

        Rally.data.PreferenceManager.load(Ext.apply(this._getPreferenceConfig(), {
            success: function(prefs) {
                deferred.resolve(prefs[this._getPreferenceName()]);
            },
            scope: this
        }));

        return deferred.promise;
    },

    savePreference: function(value) {
        var settings = {};
        settings[this._getPreferenceName()] = value;

        Rally.data.PreferenceManager.update(Ext.apply(this._getPreferenceConfig(), {
            settings: settings
        }));
    },

    _getPreferenceConfig: function () {
        var config = {
            filterByUser: true,
            filterByName: this._getPreferenceName()
        };

        if (this.context.get && this.context.get('appID')) {
            config.appID = this.context.get('appID');
        }

        return config;
    },

    _getPreferenceName: function() {
        return this.preferenceName + '-' + this.context.getWorkspace().ObjectID;
    },

    _isPrefValueInStore: function (pref) {
        return this.store.findRecord(this.valueField, pref);
    }
});