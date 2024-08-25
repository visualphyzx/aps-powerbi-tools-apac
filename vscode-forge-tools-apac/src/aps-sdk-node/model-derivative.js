"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelDerivativeClient = exports.ManifestHelper = exports.ThumbnailSize = exports.urnify = void 0;
const stream_1 = require("stream");
const common_1 = require("./common");
const isNullOrUndefined = (value) => value === null || value === undefined;
const RootPath = 'modelderivative/v2';
const ReadTokenScopes = ['data:read'];
const WriteTokenScopes = ['data:read', 'data:write', 'data:create'];
const RetryDelay = 5000;
/**
 * Converts ID of an object to base64-encoded URN expected by {@link ModelDerivativeClient}.
 * @param {string} id Object ID.
 * @returns {string} base64-encoded object URN.
 * @example
 * urnify('urn:adsk.objects:os.object:my-bucket/my-file.dwg');
 * // Returns 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bXktYnVja2V0L215LWZpbGUuZHdn'
 */
function urnify(id) {
    return Buffer.from(id).toString('base64').replace(/=/g, '');
}
exports.urnify = urnify;
var ThumbnailSize;
(function (ThumbnailSize) {
    ThumbnailSize[ThumbnailSize["Small"] = 100] = "Small";
    ThumbnailSize[ThumbnailSize["Medium"] = 200] = "Medium";
    ThumbnailSize[ThumbnailSize["Large"] = 400] = "Large";
})(ThumbnailSize = exports.ThumbnailSize || (exports.ThumbnailSize = {}));
/**
 * Utility class for querying {@see IDerivativeManifest}.
 */
class ManifestHelper {
    constructor(manifest) {
        this.manifest = manifest;
    }
    /**
     * Finds manifest derivatives with matching 'guid', 'type', or 'role' properties.
     * @param {object} query Dictionary of the requested properties and values.
     * @returns {DerivativeChild[]} Matching derivatives.
     */
    search(query) {
        let matches = [];
        this.traverse((child) => {
            if ((isNullOrUndefined(query.guid) || child.guid === query.guid)
                && (isNullOrUndefined(query.type) || child.type === query.type)
                && (isNullOrUndefined(query.role) || child.role === query.role)) {
                matches.push(child);
            }
            return true;
        });
        return matches;
    }
    /**
     * Traverses all derivatives, executing the input callback for each one.
     * @param {(child: DerivativeChild) => boolean} callback Function to be called for each derivative,
     * returning a bool indicating whether the traversal should recurse deeper in the manifest hierarchy.
     */
    traverse(callback) {
        function process(node, callback) {
            const proceed = callback(node);
            if (proceed && node.children) {
                for (const child of node.children) {
                    process(child, callback);
                }
            }
        }
        for (const derivative of this.manifest.derivatives) {
            if (derivative.children) {
                for (const child of derivative.children) {
                    process(child, callback);
                }
            }
        }
    }
}
exports.ManifestHelper = ManifestHelper;
/**
 * Client providing access to Autodesk Platform Services
 * {@link https://aps.autodesk.com/en/docs/model-derivative/v2|model derivative APIs}.
 * @tutorial model-derivative
 */
class ModelDerivativeClient extends common_1.BaseClient {
    /**
     * Initializes new client with specific authentication method.
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [region="US"] APS availability region.
     */
    constructor(auth, host, region) {
        super(RootPath, auth, host, region);
    }
    getUrl(path) {
        return new URL(this.host + '/' + RootPath + '/' + path);
    }
    /**
     * Gets a list of supported translation formats
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/formats-GET|docs}).
     * @async
     * @yields {Promise<IDerivativeFormats>} Dictionary of all supported output formats
     * mapped to arrays of formats these outputs can be obtained from.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async formats() {
        const response = await this.get('designdata/formats', {}, ReadTokenScopes);
        return response.formats;
    }
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
    async submitJob(urn, outputs, pathInArchive, force, workflowId, workflowAttr) {
        const params = {
            input: {
                urn: urn
            },
            output: {
                formats: outputs,
                destination: {
                    region: this.region
                }
            }
        };
        if (pathInArchive) {
            params.input.compressedUrn = true;
            params.input.rootFilename = pathInArchive;
        }
        if (workflowId) {
            params.misc = {
                workflow: workflowId
            };
            if (workflowAttr) {
                params.misc.workflowAttribute = workflowAttr;
            }
        }
        const headers = {};
        if (force) {
            headers['x-ads-force'] = 'true';
        }
        return this.post('designdata/job', params, headers, WriteTokenScopes);
    }
    /**
     * Retrieves manifest of a derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<IDerivativeManifest>} Document derivative manifest.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async getManifest(urn) {
        return this.get(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/manifest` :(this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/manifest` : `designdata/${urn}/manifest`), {}, ReadTokenScopes);
    }
    /**
     * Deletes manifest
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-DELETE|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async deleteManifest(urn) {
        return this.delete(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/manifest` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/manifest` : `designdata/${urn}/manifest`), {}, WriteTokenScopes);
    }
    // Generates URL for downloading specific derivative
    // https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeUrn-signedcookies-GET
    async getDerivativeDownloadUrl(modelUrn, derivativeUrn) {
        const endpoint = this.region === common_1.Region.APAC
            ? `regions/apac/designdata/${modelUrn}/manifest/${derivativeUrn}/signedcookies`
            : (this.region === common_1.Region.EMEA
            ? `regions/eu/designdata/${modelUrn}/manifest/${derivativeUrn}/signedcookies`
            : `designdata/${modelUrn}/manifest/${derivativeUrn}/signedcookies`);
        const config = {};
        await this.setAuthorization(config, ReadTokenScopes);
        const resp = await this.axios.get(endpoint, config);
        const record = {
            etag: resp.data.etag,
            size: resp.data.size,
            url: resp.data.url,
            'content-type': resp.data['content-type'],
            expiration: resp.data.expiration,
            cookies: {}
        };
        for (const cookie of resp.headers['set-cookie']) {
            const tokens = cookie.split(';');
            const [key, val] = tokens[0].trim().split('=');
            record.cookies[key] = val;
        }
        return record;
    }
    /**
     * Downloads content of a specific model derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @async
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @returns {Promise<ArrayBuffer>} Derivative content.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getDerivative(modelUrn, derivativeUrn) {
        const downloadInfo = await this.getDerivativeDownloadUrl(modelUrn, derivativeUrn);
        const resp = await this.axios.get(downloadInfo.url, {
            responseType: 'arraybuffer',
            decompress: false,
            headers: {
                Cookie: Object.keys(downloadInfo.cookies).map(key => `${key}=${downloadInfo.cookies[key]}`).join(';')
            }
        });
        return resp.data;
    }
    /**
     * Downloads content of a specific model derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @async
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @returns {Promise<ReadableStream>} Derivative content stream.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getDerivativeStream(modelUrn, derivativeUrn) {
        const downloadInfo = await this.getDerivativeDownloadUrl(modelUrn, derivativeUrn);
        const resp = await this.axios.get(downloadInfo.url, {
            responseType: 'stream',
            decompress: false
        });
        return resp.data;
    }
    /**
     * Downloads content of a specific model derivative asset in chunks
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-derivativeurn-GET/|docs}).
     * @param {string} modelUrn Model URN.
     * @param {string} derivativeUrn Derivative URN.
     * @param {number} [maxChunkSize=1<<24] Maximum size (in bytes) of a single downloaded chunk.
     * @returns {Readable} Readable stream with the content of the downloaded derivative asset.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getDerivativeChunked(modelUrn, derivativeUrn, maxChunkSize = 1 << 24) {
        const client = this;
        async function* read() {
            const downloadInfo = await client.getDerivativeDownloadUrl(modelUrn, derivativeUrn);
            const contentLength = downloadInfo.size;
            let resp = await client.axios.head(downloadInfo.url);
            let streamedBytes = 0;
            while (streamedBytes < contentLength) {
                const chunkSize = Math.min(maxChunkSize, contentLength - streamedBytes);
                resp = await client.axios.get(downloadInfo.url, {
                    responseType: 'arraybuffer',
                    decompress: false,
                    headers: {
                        Range: `bytes=${streamedBytes}-${streamedBytes + chunkSize - 1}`
                    }
                });
                yield resp.data;
                streamedBytes += chunkSize;
            }
        }
        return stream_1.Readable.from(read());
    }
    /**
     * Retrieves metadata of a derivative
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<IDerivativeMetadata>} Document derivative metadata.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async getMetadata(urn) {
        return this.get(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata` : `designdata/${urn}/metadata`), {}, ReadTokenScopes);
    }
    /**
     * Retrieves metadata of a derivative as a readable stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-metadata-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @returns {Promise<ReadableStream>} Document derivative metadata.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async getMetadataStream(urn) {
        return this.getStream(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata` : `designdata/${urn}/metadata`), {}, ReadTokenScopes);
    }
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
    async getViewableTree(urn, guid, force, objectId, retryOn202 = true) {
        const url = this.getUrl(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata/${guid}` :  (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata/${guid}` : `designdata/${urn}/metadata/${guid}`));
        if (force)
            url.searchParams.append('forceget', 'true');
        if (objectId)
            url.searchParams.append('objectid', objectId.toString());
        const config = {};
        await this.setAuthorization(config, ReadTokenScopes);
        let resp = await this.axios.get(url.toString(), config);
        while (resp.status === 202 && retryOn202) {
            await common_1.sleep(RetryDelay);
            await this.setAuthorization(config, ReadTokenScopes);
            resp = await this.axios.get(url.toString(), config);
        }
        return resp.data;
    }
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
    async getViewableTreeStream(urn, guid, force, objectId, retryOn202 = true) {
        const url = this.getUrl(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata/${guid}` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata/${guid}` : `designdata/${urn}/metadata/${guid}`));
        if (force)
            url.searchParams.append('forceget', 'true');
        if (objectId)
            url.searchParams.append('objectid', objectId.toString());
        const config = { responseType: 'stream' };
        await this.setAuthorization(config, ReadTokenScopes);
        let resp = await this.axios.get(url.toString(), config);
        while (resp.status === 202 && retryOn202) {
            await common_1.sleep(RetryDelay);
            await this.setAuthorization(config, ReadTokenScopes);
            resp = await this.axios.get(url.toString(), config);
        }
        return resp.data;
    }
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
    async getViewableProperties(urn, guid, force, objectId, retryOn202 = true) {
        const url = this.getUrl(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata/${guid}/properties` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata/${guid}/properties` : `designdata/${urn}/metadata/${guid}/properties`));
        if (force)
            url.searchParams.append('forceget', 'true');
        if (objectId)
            url.searchParams.append('objectid', objectId.toString());
        const config = {};
        await this.setAuthorization(config, ReadTokenScopes);
        let resp = await this.axios.get(url.toString(), config);
        while (resp.status === 202 && retryOn202) {
            await common_1.sleep(RetryDelay);
            await this.setAuthorization(config, ReadTokenScopes);
            resp = await this.axios.get(url.toString(), config);
        }
        return resp.data;
    }
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
    async getViewablePropertiesStream(urn, guid, force, objectId, retryOn202 = true) {
        const url = this.getUrl(this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/metadata/${guid}/properties` :(this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/metadata/${guid}/properties` : `designdata/${urn}/metadata/${guid}/properties`));
        if (force)
            url.searchParams.append('forceget', 'true');
        if (objectId)
            url.searchParams.append('objectid', objectId.toString());
        const config = { responseType: 'stream' };
        await this.setAuthorization(config, ReadTokenScopes);
        let resp = await this.axios.get(url.toString(), config);
        while (resp.status === 202 && retryOn202) {
            await common_1.sleep(RetryDelay);
            await this.setAuthorization(config, ReadTokenScopes);
            resp = await this.axios.get(url.toString(), config);
        }
        return resp.data;
    }
    /**
     * Retrieves derivative thumbnail
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-thumbnail-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {ThumbnailSize} [size=ThumbnailSize.Medium] Thumbnail size (small: 100x100 px, medium: 200x200 px, or large: 400x400 px).
     * @returns {Promise<ArrayBuffer>} Thumbnail data.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getThumbnail(urn, size = ThumbnailSize.Medium) {
        const endpoint = this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/thumbnail` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/thumbnail` : `designdata/${urn}/thumbnail`);
        return this.getBuffer(endpoint + '?width=' + size, {}, ReadTokenScopes);
    }
    /**
     * Retrieves derivative thumbnail stream
     * ({@link https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-thumbnail-GET|docs}).
     * @async
     * @param {string} urn Document derivative URN.
     * @param {ThumbnailSize} [size=ThumbnailSize.Medium] Thumbnail size (small: 100x100 px, medium: 200x200 px, or large: 400x400 px).
     * @returns {Promise<ReadableStream>} Thumbnail data stream.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getThumbnailStream(urn, size = ThumbnailSize.Medium) {
        const endpoint = this.region === common_1.Region.APAC ? `regions/apac/designdata/${urn}/thumbnail` : (this.region === common_1.Region.EMEA ? `regions/eu/designdata/${urn}/thumbnail` : `designdata/${urn}/thumbnail`);
        return this.getStream(endpoint + '?width=' + size, {}, ReadTokenScopes);
    }
}
exports.ModelDerivativeClient = ModelDerivativeClient;
