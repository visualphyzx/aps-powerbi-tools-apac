'use strict';

import powerbi from 'powerbi-visuals-api';
import { FormattingSettingsService } from 'powerbi-visuals-utils-formattingmodel';
import '../style/visual.less';
import * as _ from "lodash";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewTableRow = powerbi.DataViewTableRow;
import PrimitiveValue = powerbi.PrimitiveValue;

import { VisualSettingsModel } from './settings';
import { initializeViewerRuntime, loadModel } from './viewer.utils';

/**
    * Interface for Forge model element Data Point for interaction with other visuals
    * 
    * @interface
    * @property {number} dbId              - dbId of model in forge viewer
    * @property {string} color             - Potentially to be used for rendering model color in Forge Viewer
    * @property {number} opacity           - opacity of material
    * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering and visual interaction
    * @property {string} forgeMatKey       - Corresponding Material Key from Material Dictrionary
    * @property {string} symbol            - Symbol (link) of data  point
    * @property {PrimitiveValue} values    - Other Values of data  point
    */
    export interface ForgeElementDataPoint {
        dbId: number;
        color: string;
        opacity: number;
        selectionId: ISelectionId;
        forgeMatKey: string;
        symbol: string;
        values: Array<PrimitiveValue>;
    };

/**
 * Custom visual wrapper for the Autodesk Platform Services Viewer.
 */
export class Visual implements IVisual {
    // Visual state
    private host: IVisualHost;
    private container: HTMLElement;
    private formattingSettings: VisualSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private currentDataView: DataView = null;
    private selectionManager: ISelectionManager = null;

    // Visual inputs
    private accessTokenEndpoint: string = '';
    private urn: string = '';
    private guid: string = '';

    // Viewer runtime
    private viewer: Autodesk.Viewing.GuiViewer3D = null;
    private model: Autodesk.Viewing.Model = null;
    //private idMapping: IdMapping = null;

     // DataPoints sent to this Visual
    private forgeDataPoints: ForgeElementDataPoint[];
    // Init at model geometry loaded
    private forgeCustomMaterialDict: { [materialId: string]: THREE.MeshPhongMaterial } = {};
    // Check if the data available
    private isDbIdDataFilled: boolean = false;
    private isColorDataFilled: boolean = false;
    private isOpacityDataFilled: boolean = false;
    private isSymbolDataFilled: boolean = false;
    private isValueDataFilled: boolean = false;

    /**
     * Initializes the viewer visual.
     * @param options Additional visual initialization options.
     */
    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.container = options.element;
        this.getAccessToken = this.getAccessToken.bind(this);
        this.onPropertiesLoaded = this.onPropertiesLoaded.bind(this);
        this.onSelectionChanged = this.onSelectionChanged.bind(this);
        // Create an instance of the selection manager                                                 
        this.selectionManager = this.host.createSelectionManager();
    }

    /**
     * Notifies the viewer visual of an update (data, viewmode, size change).
     * @param options Additional visual update options.
     */
    public async update(options: VisualUpdateOptions): Promise<void> {
        this.logVisualUpdateOptions(options);
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettingsModel, options.dataViews[0]);

        const { accessTokenEndpoint } = this.formattingSettings.viewerCard;
        if (accessTokenEndpoint.value !== this.accessTokenEndpoint) {
            this.accessTokenEndpoint = accessTokenEndpoint.value;
            if (!this.viewer) {
                this.initializeViewer();
            }
        }

        const { urn, guid } = this.formattingSettings.designCard;
        if (urn.value !== this.urn || guid.value !== this.guid) {
            this.urn = urn.value;
            this.guid = guid.value;
            this.updateModel();
        }

        if (options.type == 4) //resizing or moving
        {
            console.debug("Resizing or Moving!");
            return;
        }

        let hasTable: boolean = false;
        this.currentDataView = options.dataViews[0];

        if (options.dataViews || this.currentDataView) {
            if (options.dataViews[0].table) {
                hasTable = true;
            }
            else{
                return;
            }
        }

        // Prepare data
        this.isDbIdDataFilled = _.findIndex(this.currentDataView.metadata.columns, col => col.roles.hasOwnProperty("dbId")) !== -1;
        //this.isCategoryDataFilled = _.findIndex(dataView.metadata.columns, col => col.roles.hasOwnProperty("category")) !== -1;
        this.isColorDataFilled = _.findIndex(this.currentDataView.metadata.columns, col => col.roles.hasOwnProperty("color")) !== -1;
        this.isOpacityDataFilled = _.findIndex(this.currentDataView.metadata.columns, col => col.roles.hasOwnProperty("opacity")) !== -1;
        this.isSymbolDataFilled = _.findIndex(this.currentDataView.metadata.columns, col => col.roles.hasOwnProperty("symbol")) !== -1;
        this.isValueDataFilled = _.findIndex(this.currentDataView.metadata.columns, col => col.roles.hasOwnProperty("values")) !== -1;

        let colIdxDict: { [colName: string]: any } = {
            dbId: null,
            color: null,
            opacity: null,
            symbol: null,
            values: <PrimitiveValue[]>[]
        }

        let table = options.dataViews[0].table;
        table.columns.forEach((column: DataViewMetadataColumn, colIndex: number) => {
            if (column.roles.dbId) {
                colIdxDict["dbId"] = colIndex;
            }
            else if (column.roles.color) {
                colIdxDict["color"] = colIndex;
            }
            else if (column.roles.opacity) {
                colIdxDict["opacity"] = colIndex;
            }
            else if (column.roles.symbol) {
                colIdxDict["symbol"] = colIndex;
            }
            else if (column.roles.values) {
                colIdxDict["values"].push(colIndex);
            }
        })

        if (this.isDbIdDataFilled == false) {
            return;
        }

        let dbIdIdx = colIdxDict["dbId"];
        // Some dbId may be null value, filltered those 
        let filteredRows = table.rows.filter(r => r[dbIdIdx]);
        // console.log("filtered:", filteredRows);
        let dbIds: number[] = filteredRows.map(r => <number>r[dbIdIdx].valueOf());

        this.forgeDataPoints = [];
        // Also the host needs to know what's been selected
        filteredRows.forEach((row: DataViewTableRow, rowIndex: number) => {
            // this.target.appendChild(rowDiv); this is for div
            // already achieved in dbIds 
            // Will selectionManager know what's been selected, or we need a varialbe to store all selections?
            // push the data into DataPointsArray
            const dbId = <number>row[colIdxDict["dbId"]];

            // If data point comes with null dbId, skip
            if (dbId == null || dbId == undefined)
                return;

            const selectionId: ISelectionId = this.host.createSelectionIdBuilder()
                .withTable(table, rowIndex)
                .createSelectionId();

            const color: string = this.isColorDataFilled ? <string>row[colIdxDict["color"]] : '#FFFFFF';
            const opacity: number = this.isOpacityDataFilled ? <number>row[colIdxDict["opacity"]] : 1;
            const symbol: string = this.isSymbolDataFilled ? <string>row[colIdxDict["symbol"]] : null;
            const values: Array<PrimitiveValue> = [];
            if (this.isValueDataFilled) {
                colIdxDict["values"].forEach((v: PrimitiveValue) => {
                    values.push(v);
                });
            }

            const matKeyName = color + "-" + opacity.toString();
            if (this.viewer && this.isColorDataFilled && this.forgeCustomMaterialDict[matKeyName] == undefined) {
                this.forgeCustomMaterialDict[matKeyName] = this.createPhongMaterial(color, opacity, matKeyName)
            };

            let forgePt: ForgeElementDataPoint = {
                dbId: dbId,
                color: color,
                opacity: opacity,
                selectionId: selectionId,
                forgeMatKey: matKeyName,
                symbol: symbol,
                values: values
            };

            this.forgeDataPoints.push(forgePt);
        });

        if(this.viewer) {
            if (this.isColorDataFilled && this.forgeDataPoints && this.forgeDataPoints.length > 0) {
                this.forgeDataPoints.forEach((dp: ForgeElementDataPoint, index: number) => {
                    const dbId: number = dp.dbId;
                    const color: string = dp.color;
                    const opacity: number = dp.opacity;
                    if (dbId) 
                    {
                        this.viewer.showAll();
                        if (opacity == 0) {
                            this.viewer.hide([dbId]);
                        }
                        this.getLeafGeometryNodes([dbId]).then((ids) => {
                            if (opacity == 0) {
                                // hide children
                                this.viewer.hide(ids);
                            }
                            this.setMeshPhongMaterial(ids, this.forgeCustomMaterialDict[dp.forgeMatKey]);
                        });
                    }
                });
                this.viewer.impl.invalidate(true, true, false);
            }

            this.viewer.showAll();
            this.viewer.clearSelection();
            this.viewer.isolate(dbIds);
            this.viewer.fitToView(dbIds);
        }

    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    /**
     * Displays a notification that will automatically disappear after some time.
     * @param content HTML content to display inside the notification.
     */
    private showNotification(content: string): void {
        let notifications = this.container.querySelector('#notifications');
        if (!notifications) {
            notifications = document.createElement('div');
            notifications.id = 'notifications';
            this.container.appendChild(notifications);
        }
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerText = content;
        notifications.appendChild(notification);
        setTimeout(() => notifications.removeChild(notification), 5000);
    }

    /**
     * Initialize the viewer runtime.
     */
    private async initializeViewer(): Promise<void> {
        try {
            await initializeViewerRuntime({ env: 'AutodeskProduction2', api: 'streamingV2', getAccessToken: this.getAccessToken });
            this.container.innerText = '';
            this.viewer = new Autodesk.Viewing.GuiViewer3D(this.container);
            this.viewer.start();
            // this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onPropertiesLoaded);
            // this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionChanged);
            if (this.urn) {
                this.updateModel();
            }
            this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, () => {
            this.viewer.autocam.homeVector.isPerspective = true;
            this.viewer.autocam.homeVector.isOrtho = false;
            this.viewer.autocam.originalHomeVector.isPerspective = true;
            this.viewer.autocam.originalHomeVector.isOrtho = false;
            this.viewer.autocam.toPerspective();
        });
        } catch (err) {
            this.showNotification('Could not initialize viewer runtime. Please check console for more details.');
            console.error(err);
        }
    }

    /**
     * Retrieves a new access token for the viewer.
     * @param callback Callback function to call with new access token.
     */
    private async getAccessToken(callback: (accessToken: string, expiresIn: number) => void): Promise<void> {
        try {
            const response = await fetch(this.accessTokenEndpoint);
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const share = await response.json();
            callback(share.access_token, share.expires_in);
        } catch (err) {
            this.showNotification('Could not retrieve access token. Please see console for more details.');
            console.error(err);
        }
    }

    /**
     * Ensures that the correct model is loaded into the viewer.
     */
    private async updateModel(): Promise<void> {
        if (!this.viewer) {
            return;
        }

        if (this.model && this.model.getData().urn !== this.urn) {
            this.viewer.unloadModel(this.model);
            this.model = null;
        }

        try {
            if (this.urn) {
                this.model = await loadModel(this.viewer, this.urn, this.guid);
            }
        } catch (err) {
            this.showNotification('Could not load model in the viewer. See console for more details.');
            console.error(err);
        }
    }

    private async onPropertiesLoaded() {
        console.log("Model properties loaded!");
    }

    
    private async onSelectionChanged() {
        console.log("Slection changed!");
        return;
        // TO DO - optmise the logic and interaction
        const allObjectIds = this.currentDataView.table.rows;
        if (!allObjectIds) {
            return;
        }
        const selectedDbids = this.viewer.getSelection();
        //console.log(selectedDbids);
        const selectionIds: powerbi.extensibility.ISelectionId[] = [];
        for (const objId of allObjectIds) {
            const rowIndex = allObjectIds.findIndex(row => row[0] === selectedDbids[0]);
            if (rowIndex !== -1) {
                const selectionId = this.host.createSelectionIdBuilder()
                    .withTable(this.currentDataView.table, rowIndex)
                    .createSelectionId();
                selectionIds.push(selectionId);
            }
        }
        this.selectionManager.select(selectionIds);
    }
    

    private logVisualUpdateOptions(options: VisualUpdateOptions) {
        const EditMode = {
            [powerbi.EditMode.Advanced]: 'Advanced',
            [powerbi.EditMode.Default]: 'Default',
        };
        const VisualDataChangeOperationKind = {
            [powerbi.VisualDataChangeOperationKind.Append]: 'Append',
            [powerbi.VisualDataChangeOperationKind.Create]: 'Create',
            [powerbi.VisualDataChangeOperationKind.Segment]: 'Segment',
        };
        const VisualUpdateType = {
            [powerbi.VisualUpdateType.All]: 'All',
            [powerbi.VisualUpdateType.Data]: 'Data',
            [powerbi.VisualUpdateType.Resize]: 'Resize',
            [powerbi.VisualUpdateType.ResizeEnd]: 'ResizeEnd',
            [powerbi.VisualUpdateType.Style]: 'Style',
            [powerbi.VisualUpdateType.ViewMode]: 'ViewMode',
        };
        const ViewMode = {
            [powerbi.ViewMode.Edit]: 'Edit',
            [powerbi.ViewMode.InFocusEdit]: 'InFocusEdit',
            [powerbi.ViewMode.View]: 'View',
        };
        console.debug('editMode', EditMode[options.editMode]);
        console.debug('isInFocus', options.isInFocus);
        console.debug('jsonFilters', options.jsonFilters);
        console.debug('operationKind', VisualDataChangeOperationKind[options.operationKind]);
        console.debug('type', VisualUpdateType[options.type]);
        console.debug('viewMode', ViewMode[options.viewMode]);
        console.debug('viewport', options.viewport);
        console.debug('Data views:');
        for (const dataView of options.dataViews) {
            console.debug(dataView);
        }
    }

    /**
     * Create a new MeshPhongMaterial with the specifiled color and opacity
     * @param colorhex color in hex string format e.g. "#FF0000"
     * @param opacity opacify - effective betwee 0 to 1
     * @param matName material name
     */
    private createPhongMaterial(colorhex: string, opacity: number, matName: string): THREE.MeshPhongMaterial {
        if (!this.viewer) {
            return null
        }
        const colorThreeStr = colorhex.replace('#', '0x');
        const colorValue = parseInt(colorThreeStr, 16);
        const colorName = matName + "_" + Visual.newGUID();
        const material = new THREE.MeshPhongMaterial({
            color: colorValue,
            opacity: opacity,
            transparent: true,
            side: THREE.DoubleSide,
            name: colorName,
            combine: THREE.MixOperation,
            reflectivity: 0,
            refractionRatio: 0.01,
            shininess: 5
        });

        this.viewer.impl.matman().addMaterial(colorName, material, true);
        return material;
    }

    /**
     * Generate a new GUID
     */
    public static newGUID(): string {
        let d = new Date().getTime();
        let guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
            /[xy]/g,
            function (c) {
                let r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
        return guid;
    }

    /**
     * Get all deepest Objects IDs from any ObjectIDs - can be optimised
     * @param dbIds Object IDs from APS Model Viewer
     * @param material Object IDs at deepest
     */
    private getLeafGeometryNodes(_dbIds: number[]): Promise<number[]> {
        return new Promise((resolve, reject) => {
            try {
                const instanceTree = this.viewer.model.getInstanceTree();
                if (instanceTree == null || instanceTree == undefined) {
                    // instanceTree may not exist if 2D, just return the input
                    resolve(_dbIds);
                }
                const dbIds = _dbIds || instanceTree.getRootId();
                const dbIdArray = Array.isArray(dbIds) ? dbIds : [dbIds];
                let leafIds: number[] = [];
                const getLeafNodesRec = (id: number) => {
                    let childCount = 0;
                    instanceTree.enumNodeChildren(id, (childId) => {
                        getLeafNodesRec(childId);
                        ++childCount;
                    });

                    if (childCount === 0) {
                        leafIds.push(id);
                    }
                };

                for (var i = 0; i < dbIdArray.length; ++i) {
                    getLeafNodesRec(dbIdArray[i]);
                }
                return resolve(leafIds);
            }
            catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Set material by Object IDs
     * @param dbIds Object IDs from APS Model Viewer
     * @param material MeshPhongMaterial
     */
     private setMeshPhongMaterial(dbIds: number[], material: THREE.MeshPhongMaterial): void {
        if (!this.viewer) {
            return;
        }
        const model = this.viewer.model;
        this.viewer.model.unconsolidate(); // If the model is consolidated, material changes won't have any effect
        const frags = model.getFragmentList();
        if (!frags.is2d) // 3D
        {
            const tree = model.getInstanceTree();
            for (const dbId of dbIds) {
                tree.enumNodeFragments(dbId, (fragId) => {
                    frags.setMaterial(fragId, material);
                });
            }
        }
        else {
            console.warn("Not 3D Geometry");
            // TO DO: How to handle 2D Geometry
        }
    }
}
