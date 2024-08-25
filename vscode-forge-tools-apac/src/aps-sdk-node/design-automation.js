"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignAutomationClient = exports.DesignAutomationID = exports.DesignAutomationRegion = void 0;
const form_data_1 = __importDefault(require("form-data"));
const common_1 = require("./common");
const CodeScopes = ['code:all'];
var DesignAutomationRegion;
(function (DesignAutomationRegion) {
    DesignAutomationRegion["US_WEST"] = "us-west";
    DesignAutomationRegion["US_EAST"] = "us-east";
})(DesignAutomationRegion = exports.DesignAutomationRegion || (exports.DesignAutomationRegion = {}));
/**
 * Helper class for working with Design Automation
 * {@link https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/aliases-and-ids|aliases and IDs}.
 */
class DesignAutomationID {
    /**
     * Creates new fully qualified ID.
     * @param {string} owner Owner part of the fully qualified ID. Must consist of a-z, A-Z, 0-9 and _ characters only.
     * @param {string} id ID part of the fully qualified ID. Must consist of a-z, A-Z, 0-9 and _ characters only.
     * @param {string} alias Alias part of the fully qualified ID. Must consist of a-z, A-Z, 0-9 and _ characters only.
     */
    constructor(owner, id, alias) {
        this.owner = owner;
        this.id = id;
        this.alias = alias;
    }
    /**
     * Parses fully qualified ID.
     * @param {string} str Fully qualified ID.
     * @returns {DesignAutomationID|null} Parsed ID or null if the format was not correct.
     */
    static parse(str) {
        const match = str.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\+([\$a-zA-Z0-9_]+)$/);
        if (match) {
            return new DesignAutomationID(match[1], match[2], match[3]);
        }
        else {
            return null;
        }
    }
    /**
     * Outputs the fully qualified ID in a form expected by Design Automation endpoints.
     */
    toString() {
        return `${this.owner}.${this.id}+${this.alias}`;
    }
}
exports.DesignAutomationID = DesignAutomationID;
/**
 * Client providing access to Autodesk Platform Services
 * {@link https://aps.autodesk.com/en/docs/design-automation/v3|design automation APIs}.
 * @tutorial design-automation
 */
class DesignAutomationClient extends common_1.BaseClient {
    /**
     * Initializes new client with specific authentication method.
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [_region] @deprecated Will be removed in next major version.
     * @param {DesignAutomationRegion} [region] Design Automation specific availability region.
     */
    constructor(auth, host, _region, region) {
        // TODO: remove _region param
        const RootPath = `da/${region || DesignAutomationRegion.US_EAST}/v3`;
        super(RootPath, auth, host);
    }
    /**
     * Resets client to specific authentication method, APS host, and availability region.
     * @param {IAuthOptions} [auth] Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [_region] @deprecated Will be removed in next major version.
     * @param {DesignAutomationRegion} [region] Design Automation specific availability region.
     */
    reset(auth, host, _region, region) {
        // TODO: remove _region param
        this.root = `da/${region || DesignAutomationRegion.US_EAST}/v3`;
        super.reset(auth, host);
    }
    // Iterates (asynchronously) over pages of paginated results
    async *_pager(endpoint, scopes) {
        let response = await this.get(endpoint, {}, scopes);
        yield response.data;
        while (response.paginationToken) {
            response = await this.get(`${endpoint}?page=${response.paginationToken}`, {}, scopes);
            yield response.data;
        }
    }
    // Collects all pages of paginated results
    async _collect(endpoint, scopes) {
        let response = await this.get(endpoint, {}, scopes);
        let results = response.data;
        while (response.paginationToken) {
            response = await this.get(`${endpoint}?page=${response.paginationToken}`, {}, scopes);
            results = results.concat(response.data);
        }
        return results;
    }
    /**
     * Gets current nickname for all your Design Automation entities
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/design-automation-forgeapps-id-GET|docs}).
     * @async
     * @returns {Promise<string>} Current nickname.
     */
    async getNickname() {
        return this.get(`forgeapps/me`, {}, CodeScopes);
    }
    /**
     * Sets new nickname for all your Design Automation entities
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/design-automation-forgeapps-id-PATCH|docs}).
     * @async
     * @param {string} nickname New nickname.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async setNickname(nickname) {
        return this.patch(`forgeapps/me`, { nickname }, { 'Content-Type': 'application/json' }, CodeScopes);
    }
    /**
     * Removes current nickname for all your Design Automation entities
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/design-automation-forgeapps-id-DELETE|docs}).
     * @async
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async deleteNickname() {
        return this.delete(`forgeapps/me`, {}, CodeScopes);
    }
    /**
     * Iterates over all engines in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/engines-GET|docs}).
     * @async
     * @generator
     * @yields {AsyncIterable<string[]>} List of engine (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateEngines() {
        for await (const engines of this._pager('engines', CodeScopes)) {
            yield engines;
        }
    }
    /**
     * Gets a list of all engines
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/engines-GET|docs}).
     * @async
     * @returns {Promise<string[]>} List of engine (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listEngines() {
        return this._collect('engines', CodeScopes);
    }
    /**
     * Gets single engine details
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/engines-id-GET|docs}).
     * @async
     * @param {string} engineId Fully qualified engine ID.
     * @returns {Promise<IEngineDetail>} Engine details.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getEngine(engineId) {
        return this.get(`engines/${engineId}`, {}, CodeScopes);
    }
    /**
     * Iterates over all app bundles in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-GET|docs}).
     * @async
     * @generator
     * @yields {AsyncIterable<string[]>} List of appbundle (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateAppBundles() {
        for await (const bundles of this._pager('appbundles', CodeScopes)) {
            yield bundles;
        }
    }
    /**
     * Gets a list of all appbundles
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-GET|docs}).
     * @async
     * @returns {Promise<string[]>} List of appbundle (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listAppBundles() {
        return this._collect('appbundles', CodeScopes);
    }
    /**
     * Gets single appbundle details
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-GET|docs}).
     * @async
     * @param {string} bundleId Fully qualified appbundle ID.
     * @returns {Promise<IAppBundleDetail>} Appbundle details.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getAppBundle(bundleId) {
        return this.get(`appbundles/${bundleId}`, {}, CodeScopes);
    }
    /**
     * Gets single appbundle version details
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-versions-version-GET|docs}).
     * @async
     * @param {string} id Short (unqualified) app bundle ID.
     * @param {number} version App bundle version.
     * @returns {Promise<IAppBundleDetail>} Appbundle details.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getAppBundleVersion(id, version) {
        return this.get(`appbundles/${id}/versions/${version}`, {}, CodeScopes);
    }
    /**
     * Creates a new app bundle
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-POST|docs}).
     * @async
     * @param {string} id Unique name of the bundle.
     * @param {string} engine ID of one of the supported {@link engines}.
     * @param {object} [settings] Additional app bundle settings.
     * @param {string} [description] App bundle description.
     * @returns {Promise<IAppBundleUploadParams>} Details of the created app bundle,
     * incl. parameters for uploading the actual zip file with app bundle binaries.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async createAppBundle(id, engine, settings, description) {
        const config = { id, engine };
        if (settings) {
            config.settings = settings;
        }
        if (description) {
            config.description = description;
        }
        return this.post('appbundles', config, {}, CodeScopes);
    }
    /**
     * Updates an existing app bundle, creating its new version
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-versions-POST|docs}).
     * @async
     * @param {string} id ID of the app bundle.
     * @param {string} [engine] ID of one of the supported {@link engines}.
     * @param {object} [settings] Additional app bundle settings.
     * @param {string} [description] App bundle description.
     * @returns {Promise<IAppBundleUploadParams>} Details of the created app bundle,
     * incl. parameters for uploading the actual zip file with app bundle binaries.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async updateAppBundle(id, engine, settings, description) {
        // TODO: tests
        const config = { engine };
        if (settings) {
            config.settings = settings;
        }
        if (description) {
            config.description = description;
        }
        return this.post(`appbundles/${id}/versions`, config, {}, CodeScopes);
    }
    /**
     * Uploads zip file with contents of a specific app bundle.
     * @async
     * @param {IAppBundleUploadParams} appBundleUploadParams App bundle upload parameters
     * (returned by {@link createAppBundle} and {@link updateAppBundle}).
     * @param {fs.ReadStream} appBundleStream Stream to read the app bundle zip from.
     * @returns {Promise<any>} Response from the file submission.
     * @example
     * const appBundle = await designAutomationClient.createAppBundle('MyAppBundle', 'Autodesk.Inventor+23', 'My App Bundle Description');
     * const appBundleStream = fs.createReadStream('./MyAppBundle.zip');
     * await designAutomationClient.uploadAppBundleArchive(appBundle, appBundleStream);
     */
    uploadAppBundleArchive(appBundleUploadParams, appBundleStream) {
        const uploadParameters = appBundleUploadParams.uploadParameters.formData;
        const form = new form_data_1.default();
        form.append('key', uploadParameters['key']);
        form.append('policy', uploadParameters['policy']);
        form.append('content-type', uploadParameters['content-type']);
        form.append('success_action_status', uploadParameters['success_action_status']);
        form.append('success_action_redirect', uploadParameters['success_action_redirect']);
        form.append('x-amz-signature', uploadParameters['x-amz-signature']);
        form.append('x-amz-credential', uploadParameters['x-amz-credential']);
        form.append('x-amz-algorithm', uploadParameters['x-amz-algorithm']);
        form.append('x-amz-date', uploadParameters['x-amz-date']);
        form.append('x-amz-server-side-encryption', uploadParameters['x-amz-server-side-encryption']);
        form.append('x-amz-security-token', uploadParameters['x-amz-security-token']);
        form.append('file', appBundleStream);
        return new Promise(function (resolve, reject) {
            form.submit(appBundleUploadParams.uploadParameters.endpointURL, function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({});
                }
            });
        });
    }
    /**
     * Iterates over all app bundle aliases in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-aliases-GET|docs}).
     * @async
     * @generator
     * @param {string} name Unique name of the bundle.
     * @yields {AsyncIterable<IAlias[]>} List of appbundle alias objects.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateAppBundleAliases(name) {
        for await (const aliases of this._pager(`appbundles/${name}/aliases`, CodeScopes)) {
            yield aliases;
        }
    }
    /**
     * Gets a list of all appbundle aliases
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-aliases-GET|docs}).
     * @async
     * @param {string} name Unique name of the bundle.
     * @returns {Promise<IAlias[]>} List of appbundle alias objects.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listAppBundleAliases(name) {
        return this._collect(`appbundles/${name}/aliases`, CodeScopes);
    }
    /**
     * Iterates over all app bundle versions in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-versions-GET|docs}).
     * @async
     * @generator
     * @param {string} name Unique name of the bundle.
     * @yields {AsyncIterable<number[]>} List of appbundle version numbers.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateAppBundleVersions(name) {
        for await (const versions of this._pager(`appbundles/${name}/versions`, CodeScopes)) {
            yield versions;
        }
    }
    /**
     * Gets a list of all appbundle versions
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-versions-GET|docs}).
     * @async
     * @param {string} name Unique name of the bundle.
     * @returns {Promise<number[]>} List of appbundle version numbers.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listAppBundleVersions(name) {
        return this._collect(`appbundles/${name}/versions`, CodeScopes);
    }
    /**
     * Creates new alias for an app bundle
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-aliases-POST/|docs}).
     * @async
     * @param {string} name Name of the app bundle.
     * @param {string} alias Alias name.
     * @param {number} version Version of app bundle to link to this alias.
     * @param {string} [receiver] Optional ID of another APS application to share this app bundle with.
     * @returns {Promise<IAlias>} Details of the created alias.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async createAppBundleAlias(name, alias, version, receiver) {
        // TODO: tests
        const config = { id: alias, version: version };
        if (receiver) {
            config.receiver = receiver;
        }
        return this.post(`appbundles/${name}/aliases`, config, {}, CodeScopes);
    }
    /**
     * Updates existing alias for an app bundle
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-aliases-aliasId-PATCH/|docs}).
     * @async
     * @param {string} name Name of the app bundle.
     * @param {string} alias Alias name.
     * @param {number} version Version of app bundle to link to this alias.
     * @param {string} [receiver] Optional ID of another APS application to share this app bundle with.
     * @returns {Promise<IAlias>} Details of the updated alias.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async updateAppBundleAlias(name, alias, version, receiver) {
        // TODO: tests
        const config = { version: version };
        if (receiver) {
            config.receiver = receiver;
        }
        return this.patch(`appbundles/${name}/aliases/${alias}`, config, {}, CodeScopes);
    }
    /**
     * Deletes app bundle and all its versions and aliases
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) app bundle ID.
     */
    async deleteAppBundle(shortId) {
        return this.delete(`appbundles/${shortId}`, {}, CodeScopes);
    }
    /**
     * Deletes app bundle alias
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-aliases-aliasId-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) app bundle ID.
     * @param {string} alias App bundle alias.
     */
    async deleteAppBundleAlias(shortId, alias) {
        return this.delete(`appbundles/${shortId}/aliases/${alias}`, {}, CodeScopes);
    }
    /**
     * Deletes app bundle version
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/appbundles-id-versions-version-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) app bundle ID.
     * @param {number} version App bundle version.
     */
    async deleteAppBundleVersion(shortId, version) {
        return this.delete(`appbundles/${shortId}/versions/${version}`, {}, CodeScopes);
    }
    /**
     * Iterates over all activities in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-GET|docs}).
     * @async
     * @generator
     * @yields {AsyncIterable<string[]>} List of activity (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateActivities() {
        for await (const activities of this._pager('activities', CodeScopes)) {
            yield activities;
        }
    }
    /**
     * Gets a list of all activities
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-GET|docs}).
     * @async
     * @returns {Promise<string[]>} List of activity (full) IDs.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listActivities() {
        return this._collect('activities', CodeScopes);
    }
    /**
     * Gets single activity details
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-GET|docs}).
     * @async
     * @param {string} activityId Fully qualified activity ID.
     * @returns {Promise<object>} Activity details.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getActivity(activityId) {
        return this.get(`activities/${activityId}`, {}, CodeScopes);
    }
    /**
     * Gets single activity version details
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-versions-version-GET|docs}).
     * @async
     * @param {string} id Short (unqualified) activity ID.
     * @param {number} version Activity version.
     * @returns {Promise<IActivityDetail>} Activity details.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getActivityVersion(id, version) {
        return this.get(`activities/${id}/versions/${version}`, {}, CodeScopes);
    }
    /**
     * Creates new activity
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-POST|docs}).
     * @async
     * @param {string} id New activity ID.
     * @param {string} engine ID of one of the supported {@link engines}.
     * @param {string | string[]} commands One or more CLI commands to be executed within the activity.
     * @param {string | string[]} [appBundleIDs] Fully qualified IDs of zero or more app bundles used by the activity.
     * @param {{ [name: string]: IActivityParam }} [parameters] Input/output parameter descriptors.
     * @param {{ [key: string]: any }} [settings] Additional activity settings.
     * @param {string} [description] Activity description.
     * @returns {Promise<IActivityDetail>} Details of created activity.
     */
    async createActivity(id, engine, commands, appBundleIDs, parameters, settings, description) {
        // TODO: tests
        if (!this.auth) {
            throw new Error('Cannot create activity without client ID.');
        }
        const config = {
            id,
            engine,
            commandLine: Array.isArray(commands) ? commands : [commands]
        };
        if (appBundleIDs) {
            config.appbundles = Array.isArray(appBundleIDs) ? appBundleIDs : [appBundleIDs];
        }
        if (parameters) {
            config.parameters = parameters;
        }
        if (settings) {
            config.settings = settings;
        }
        if (description) {
            config.description = description;
        }
        return this.post('activities', config, {}, CodeScopes);
    }
    /**
     * Updates existing activity, creating its new version
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-versions-POST|docs}).
     * @async
     * @param {string} id New activity ID.
     * @param {string} engine ID of one of the supported {@link engines}.
     * @param {string | string[]} commands One or more CLI commands to be executed within the activity.
     * @param {string | string[]} [appBundleIDs] Fully qualified IDs of zero or more app bundles used by the activity.
     * @param {{ [name: string]: IActivityParam }} [parameters] Input/output parameter descriptors.
     * @param {{ [key: string]: any }} [settings] Additional activity settings.
     * @param {string} [description] Activity description.
     * @returns {Promise<object>} Details of created activity.
     */
    async updateActivity(id, engine, commands, appBundleIDs, parameters, settings, description) {
        // TODO: tests
        if (!this.auth) {
            throw new Error('Cannot create activity without client ID.');
        }
        const config = {
            engine,
            commandLine: Array.isArray(commands) ? commands : [commands]
        };
        if (appBundleIDs) {
            config.appbundles = Array.isArray(appBundleIDs) ? appBundleIDs : [appBundleIDs];
        }
        if (parameters) {
            config.parameters = parameters;
        }
        if (settings) {
            config.settings = settings;
        }
        if (description) {
            config.description = description;
        }
        return this.post(`activities/${id}/versions`, config, {}, CodeScopes);
    }
    /**
     * Iterates over all activity aliases in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-aliases-GET|docs}).
     * @async
     * @generator
     * @param {string} name Unique name of activity.
     * @yields {AsyncIterable<IAlias[]>} List of activity alias objects.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateActivityAliases(name) {
        for await (const aliases of this._pager(`activities/${name}/aliases`, CodeScopes)) {
            yield aliases;
        }
    }
    /**
     * Gets a list of all activity aliases
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-aliases-GET|docs}).
     * @async
     * @param {string} name Unique name of activity.
     * @returns {Promise<IAlias[]>} List of activity alias objects.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listActivityAliases(name) {
        return this._collect(`activities/${name}/aliases`, CodeScopes);
    }
    /**
     * Iterates over all activity versions in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-versions-GET|docs}).
     * @async
     * @generator
     * @param {string} name Unique name of activity.
     * @yields {AsyncIterable<number[]>} List of activity versions.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async *iterateActivityVersions(name) {
        for await (const versions of this._pager(`activities/${name}/versions`, CodeScopes)) {
            yield versions;
        }
    }
    /**
     * Gets a list of all activity versions
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-versions-GET|docs}).
     * @async
     * @param {string} name Unique name of activity.
     * @returns {Promise<number[]>} List of activity versions.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async listActivityVersions(name) {
        return this._collect(`activities/${name}/versions`, CodeScopes);
    }
    /**
     * Creates new alias for an activity
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-aliases-POST|docs}).
     * @async
     * @param {string} id Activity ID.
     * @param {string} alias New alias name.
     * @param {number} version Activity version to link to this alias.
     * @param {string} [receiver] Optional ID of another APS application to share this activity with.
     * @returns {Promise<IAlias>} Details of created alias.
     */
    async createActivityAlias(id, alias, version, receiver) {
        // TODO: tests
        const config = { id: alias, version: version };
        if (receiver) {
            config.receiver = receiver;
        }
        return this.post(`activities/${id}/aliases`, config, {}, CodeScopes);
    }
    /**
     * Updates existing alias for an activity
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-aliases-aliasId-PATCH|docs}).
     * @async
     * @param {string} id Activity ID.
     * @param {string} alias Activity alias.
     * @param {number} version Activity version to link to this alias.
     * @param {string} [receiver] Optional ID of another APS application to share this activity with.
     * @returns {Promise<IAlias>} Details of updated alias.
     */
    async updateActivityAlias(id, alias, version, receiver) {
        // TODO: tests
        const config = { version: version };
        if (receiver) {
            config.receiver = receiver;
        }
        return this.patch(`activities/${id}/aliases/${alias}`, config, {}, CodeScopes);
    }
    /**
     * Deletes activity and all its versions and aliases
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) activity ID.
     */
    async deleteActivity(shortId) {
        return this.delete(`activities/${shortId}`, {}, CodeScopes);
    }
    /**
     * Deletes activity alias
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-aliases-aliasId-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) activity ID.
     * @param {string} alias Activity alias.
     */
    async deleteActivityAlias(shortId, alias) {
        return this.delete(`activities/${shortId}/aliases/${alias}`, {}, CodeScopes);
    }
    /**
     * Deletes activity version
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/activities-id-versions-version-DELETE|docs}).
     * @async
     * @param {string} shortId Short (unqualified) activity ID.
     * @param {number} version Activity version.
     */
    async deleteActivityVersion(shortId, version) {
        return this.delete(`activities/${shortId}/versions/${version}`, {}, CodeScopes);
    }
    /**
     * Gets details of a specific work item
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/workitems-id-GET|docs}).
     * @async
     * @param {string} id Work item ID.
     * @returns {Promise<IWorkItemDetail>} Work item details.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    async getWorkItem(id) {
        return this.get(`workitems/${id}`, {}, CodeScopes);
    }
    /**
     * Creates new work item
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/workitems-POST|docs}).
     * @async
     * @param {string} activityId Activity ID.
     * @param {{ [name: string]: IWorkItemParam }} [args] Arguments to pass in as activity parameters.
     * @param {{ activityId?: string; baseUrls?: { url: string; signature: string } }} signatures Signatures.
     * @param {number} limitProcessingTimeSec limit of max processing time in seconds.
     */
    async createWorkItem(activityId, args, signatures, limitProcessingTimeSec) {
        // TODO: tests
        const config = {
            activityId: activityId
        };
        if (args) {
            config.arguments = args;
        }
        if (signatures) {
            config.signatures = signatures;
        }
        if (limitProcessingTimeSec) {
            config.limitProcessingTimeSec = limitProcessingTimeSec;
        }
        return this.post('workitems', config, {}, CodeScopes);
    }
    /**
     * Cancels work item, removing it from waiting queue or cancelling a running job
     * ({@link https://aps.autodesk.com/en/docs/design-automation/v3/reference/http/workitems-id-DELETE|docs}).
     * @async
     * @param {string} id Work item ID.
     */
    async deleteWorkItem(id) {
        return this.delete(`workitems/${id}`, {}, CodeScopes);
    }
}
exports.DesignAutomationClient = DesignAutomationClient;
