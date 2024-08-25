/// <reference types="node" />
import { Readable } from 'stream';
import { BaseClient, IAuthOptions, Region } from './common';
/**
 * Converts ID of an object to base64-encoded URN expected by {@link ModelDerivativeClient}.
 * @param {string} id Object ID.
 * @returns {string} base64-encoded object URN.
 * @example
 * urnify('urn:adsk.objects:os.object:my-bucket/my-file.dwg');
 * // Returns 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bXktYnVja2V0L215LWZpbGUuZHdn'
 */
export declare function urnify(id: string): string;
export interface IDerivativeFormats {
    [outputFormat: string]: string[];
}
export declare type IDerivativeOutputType = IDerivativeOutputTypeSVF | IDerivativeOutputTypeSVF2 | IDerivativeOutputTypeSTL | IDerivativeOutputTypeSTEP | IDerivativeOutputTypeIGES | IDerivativeOutputTypeOBJ | IDerivativeOutputTypeDWG | IDerivativeOutputTypeIFC;
export interface IDerivativeOutputTypeSVF {
    type: 'svf';
    views: string[];
    advanced?: {
        switchLoader?: boolean;
        conversionMethod?: string;
        buildingStoreys?: string;
        spaces?: string;
        openingElements?: string;
        generateMasterViews?: boolean;
        materialMode?: string;
        hiddenObjects?: boolean;
        basicMaterialProperties?: boolean;
        autodeskMaterialProperties?: boolean;
        timelinerProperties?: boolean;
    };
}
export interface IDerivativeOutputTypeSVF2 {
    type: 'svf2';
    views: string[];
    advanced?: {
        switchLoader?: boolean;
        conversionMethod?: string;
        buildingStoreys?: string;
        spaces?: string;
        openingElements?: string;
        generateMasterViews?: boolean;
        materialMode?: string;
        hiddenObjects?: boolean;
        basicMaterialProperties?: boolean;
        autodeskMaterialProperties?: boolean;
        timelinerProperties?: boolean;
    };
}
export interface IDerivativeOutputTypeSTL {
    type: 'stl';
    advanced?: {
        format?: string;
        exportColor?: boolean;
        exportFileStructure?: string;
    };
}
export interface IDerivativeOutputTypeSTEP {
    type: 'step';
    advanced?: {
        applicationProtocol?: string;
        tolerance?: number;
    };
}
export interface IDerivativeOutputTypeIGES {
    type: 'iges';
    advanced?: {
        tolerance?: number;
        surfaceType?: string;
        sheetType?: string;
        solidType?: string;
    };
}
export interface IDerivativeOutputTypeOBJ {
    type: 'obj';
    advanced?: {
        exportFileStructure?: string;
        unit?: string;
        modelGuid?: string;
        objectIds?: number[];
    };
}
export interface IDerivativeOutputTypeDWG {
    type: 'dwg';
    advanced?: {
        exportSettingName?: string;
    };
}
export interface IDerivativeOutputTypeIFC {
    type: 'ifc';
    advanced?: {
        exportSettingName?: string;
    };
}
export interface IJob {
    result: string;
    urn: string;
}
export interface IDerivativeManifest {
    type: string;
    hasThumbnail: string;
    status: string;
    progress: string;
    region: string;
    urn: string;
    version: string;
    derivatives: IDerivative[];
}
export interface IDerivative {
    status: string;
    progress?: string;
    name?: string;
    hasThumbnail?: string;
    outputType?: string;
    children?: DerivativeChild[];
}
declare type DerivativeChild = IDerivativeResourceChild | IDerivativeGeometryChild | IDerivativeViewChild;
export interface IDerivativeChild {
    guid: string;
    type: string;
    role: string;
    status: string;
    progress?: string;
    children?: DerivativeChild[];
}
export interface IDerivativeResourceChild extends IDerivativeChild {
    type: 'resource';
    urn: string;
    mime: string;
}
export interface IDerivativeGeometryChild extends IDerivativeChild {
    type: 'geometry';
    name?: string;
    viewableID?: string;
    phaseNames?: string;
    hasThumbnail?: string;
    properties?: any;
}
export interface IDerivativeViewChild extends IDerivativeChild {
    type: 'view';
    name?: string;
    camera?: number[];
    viewbox?: number[];
}
export interface IDerivativeMetadata {
}
export interface IDerivativeTree {
}
export interface IDerivativeProps {
}
export declare enum ThumbnailSize {
    Small = 100,
    Medium = 200,
    Large = 400
}
interface IDerivativeDownloadInfo {
    etag: string;
    size: number;
    url: string;
    'content-type': string;
    expiration: number;
    cookies: {
        [key: string]: string;
    };
}
/**
 * Utility class for querying {@see IDerivativeManifest}.
 */
export declare class ManifestHelper {
    protected manifest: IDerivativeManifest;
    constructor(manifest: IDerivativeManifest);
    /**
     * Finds manifest derivatives with matching 'guid', 'type', or 'role' properties.
     * @param {object} query Dictionary of the requested properties and values.
     * @returns {DerivativeChild[]} Matching derivatives.
     */
    search(query: {
        guid?: string;
        type?: string;
        role?: string;
    }): DerivativeChild[];
    /**
     * Traverses all derivatives, executing the input callback for each one.
     * @param {(child: DerivativeChild) => boolean} callback Function to be called for each derivative,
     * returning a bool indicating whether the traversal should recurse deeper in the manifest hierarchy.
     */
    traverse(callback: (child: DerivativeChild) => boolean): void;
}
/**
 * Client providing access to Autodesk Platform Services
 * {@link https://aps.autodesk.com/en/docs/model-derivative/v2|model derivative APIs}.
 * @tutorial model-derivative
 */
export declare class ModelDerivativeClient extends BaseClient {
    /**
     * Initializes new client with specific authentication method.
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or "APAC").
     */
    constructor(auth: IAuthOptions, host?: string, region?: Region);
    private getUrl;
    /**
     * Gets a list of supported translation formats
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/formats-GET|docs}).
     * @async
     * @yields {Promise<IDerivativeFormats>} Dictionary of all supported output formats
     * mapped to arrays of formats these outputs can be obtained from.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    formats(): Promise<IDerivativeFormats>;
    /**
     * Submits a translation job
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/job-POST|docs}).
     * @async
     * @param {string} urn Document to be translated.
     * @param {IDerivativeOutputType[]} outputs List of requested output formats.
     * @param {string} [pathInArchive] Optional relative path to root design if the translated file is an archive.
     * @param {boolean} [force] Force translation even if a derivative already exists.
     * @param {string} [workflowId] Optional workflow ID to be used with APS Webhooks.
     * @param {object} [workflowAttr] Optional workflow attributes to be used with APS Webhooks.
     * @returns {Promise<IJob>} Translation job details, with properties 'result',
     * 'urn', and 'acceptedJobs'.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    submitJob(urn: string, outputs: IDerivativeOutputType[], pathInArchive?: string, force?: boolean, workflowId?: string, workflowAttr?: object): Promise<IJob>;
    /**
     * Retrieves manifest of a derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<IDerivativeManifest>} Document derivative manifest.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getManifest(urn: string): Promise<IDerivativeManifest>;
    /**
     * Deletes manifest
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-DELETE|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    deleteManifest(urn: string): Promise<any>;
    protected getDerivativeDownloadUrl(modelUrn: string, derivativeUrn: string): Promise<IDerivativeDownloadInfo>;
    /**
     * Downloads content of a specific model derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @async
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @returns {Promise<ArrayBuffer>} Derivative content.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getDerivative(modelUrn: string, derivativeUrn: string): Promise<ArrayBuffer>;
    /**
     * Downloads content of a specific model derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @async
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @returns {Promise<ReadableStream>} Derivative content stream.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getDerivativeStream(modelUrn: string, derivativeUrn: string): Promise<ReadableStream>;
    /**
     * Downloads content of a specific model derivative asset in chunks
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @param {number} [maxChunkSize=1<<24] Maximum size (in bytes) of a single downloaded chunk.
     * @returns {Readable} Readable stream with the content of the downloaded derivative asset.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getDerivativeChunked(modelUrn: string, derivativeUrn: string, maxChunkSize?: number): Readable;
    /**
     * Retrieves metadata of a derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<IDerivativeMetadata>} Document derivative metadata.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getMetadata(urn: string): Promise<IDerivativeMetadata>;
    /**
     * Retrieves metadata of a derivative as a readable stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<ReadableStream>} Document derivative metadata.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getMetadataStream(urn: string): Promise<ReadableStream>;
    /**
     * Retrieves object tree of a specific viewable
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {string} guid Viewable GUID.
     * @param {boolean} [force] Force query even when exceeding the size limit (20MB).
     * @param {number} [objectId] If specified, retrieves the sub-tree that has the specified object ID as its parent node.
     * If this parameter is not specified, retrieves the entire object tree.
     * @param {boolean} [retryOn202] Keep repeating the request while the response status is 202 (indicating that the resource is being prepared).
     * @returns {Promise<IDerivativeTree>} Viewable object tree.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getViewableTree(urn: string, guid: string, force?: boolean, objectId?: number, retryOn202?: boolean): Promise<IDerivativeTree>;
    /**
     * Retrieves object tree of a specific viewable as a readable stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {string} guid Viewable GUID.
     * @param {boolean} [force] Force query even when exceeding the size limit (20MB).
     * @param {number} [objectId] If specified, retrieves the sub-tree that has the specified object ID as its parent node.
     * If this parameter is not specified, retrieves the entire object tree.
     * @param {boolean} [retryOn202] Keep repeating the request while the response status is 202 (indicating that the resource is being prepared).
     * @returns {Promise<ReadableStream>} Readable stream.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getViewableTreeStream(urn: string, guid: string, force?: boolean, objectId?: number, retryOn202?: boolean): Promise<ReadableStream>;
    /**
     * Retrieves properties of a specific viewable
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-properties-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {string} guid Viewable GUID.
     * @param {boolean} [force] Force query even when exceeding the size limit (20MB).
     * @param {number} [objectId] The Object ID of the object you want to query properties for.
     * If `objectid` is omitted, the server returns properties for all objects.
     * @param {boolean} [retryOn202] Keep repeating the request while the response status is 202 (indicating that the resource is being prepared).
     * @returns {Promise<IDerivativeProps>} Viewable properties.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getViewableProperties(urn: string, guid: string, force?: boolean, objectId?: number, retryOn202?: boolean): Promise<IDerivativeProps>;
    /**
     * Retrieves properties of a specific viewable as a readable stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-guid-properties-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {string} guid Viewable GUID.
     * @param {boolean} [force] Force query even when exceeding the size limit (20MB).
     * @param {number} [objectId] The Object ID of the object you want to query properties for.
     * If `objectid` is omitted, the server returns properties for all objects.
     * @param {boolean} [retryOn202] Keep repeating the request while the response status is 202 (indicating that the resource is being prepared).
     * @returns {Promise<ReadableStream>} Readable stream.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    getViewablePropertiesStream(urn: string, guid: string, force?: boolean, objectId?: number, retryOn202?: boolean): Promise<ReadableStream>;
    /**
     * Retrieves derivative thumbnail
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-thumbnail-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {ThumbnailSize} [size=ThumbnailSize.Medium] Thumbnail size (small: 100x100 px, medium: 200x200 px, or large: 400x400 px).
     * @returns {Promise<ArrayBuffer>} Thumbnail data.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getThumbnail(urn: string, size?: ThumbnailSize): Promise<ArrayBuffer>;
    /**
     * Retrieves derivative thumbnail stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-thumbnail-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {ThumbnailSize} [size=ThumbnailSize.Medium] Thumbnail size (small: 100x100 px, medium: 200x200 px, or large: 400x400 px).
     * @returns {Promise<ReadableStream>} Thumbnail data stream.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getThumbnailStream(urn: string, size?: ThumbnailSize): Promise<ReadableStream>;
}
export {};
//# sourceMappingURL=model-derivative.d.ts.map