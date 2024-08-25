"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = exports.Region = exports.DefaultHost = exports.sleep = void 0;
const axios_1 = __importDefault(require("axios"));
const rax = __importStar(require("retry-axios"));
const authentication_1 = require("./authentication");
const MaxContentLength = Number.MAX_SAFE_INTEGER;
const MaxBodyLength = Number.MAX_SAFE_INTEGER;
function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
exports.sleep = sleep;
exports.DefaultHost = 'https://developer.api.autodesk.com';
var Region;
(function (Region) {
    Region["US"] = "US";
    Region["EMEA"] = "EMEA";
    Region["APAC"] = "APAC";
})(Region = exports.Region || (exports.Region = {}));
class BaseClient {
    /**
     * Initializes new client with specific authentication method.
     * @param {string} root Root path for all endpoints (must not contain any slashes at the beginning nor end).
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host (must not contain slash at the end).
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or  "APAC").
     */
    constructor(root, auth, host, region) {
        if ('client_id' in auth && 'client_secret' in auth) {
            this.auth = new authentication_1.AuthenticationClient(auth.client_id, auth.client_secret, host);
        }
        else if ('token' in auth) {
            this.token = auth.token;
        }
        else {
            throw new Error('Authentication parameters missing or incorrect.');
        }
        this.root = root;
        this.host = host || exports.DefaultHost;
        this.region = region || Region.US;
        this.axios = axios_1.default.create({
            baseURL: this.host + '/' + this.root + '/',
            maxContentLength: MaxContentLength,
            maxBodyLength: MaxBodyLength
        });
        // Attach an interceptor to the axios instance that will retry response codes 100-199, 429, and 500-599.
        // For default settings, see https://github.com/JustinBeckwith/retry-axios#usage.
        this.axios.defaults.raxConfig = {
            instance: this.axios
        };
        rax.attach(this.axios);
    }
    /**
     * Resets client to specific authentication method, APS host, and availability region.
     * @param {IAuthOptions} [auth] Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or "APAC").
     */
    reset(auth, host, region) {
        if (typeof auth !== 'undefined') {
            if ('client_id' in auth && 'client_secret' in auth) {
                this.auth = new authentication_1.AuthenticationClient(auth.client_id, auth.client_secret, host);
            }
            else if ('token' in auth) {
                this.token = auth.token;
            }
            else {
                throw new Error('Authentication parameters missing or incorrect.');
            }
        }
        if (typeof host !== 'undefined') {
            this.host = host || exports.DefaultHost;
        }
        if (typeof region !== 'undefined') {
            this.region = region || Region.US;
        }
        this.axios = axios_1.default.create({ baseURL: this.host + '/' + this.root + '/' });
    }
    async setAuthorization(options, scopes) {
        options.headers = options.headers || {};
        if (this.auth) {
            const authentication = await this.auth.authenticate(scopes);
            options.headers['Authorization'] = 'Bearer ' + authentication.access_token;
        }
        else {
            options.headers['Authorization'] = 'Bearer ' + this.token;
        }
    }
    // Makes a general request and returns the entire response (not just its parsed body)
    async fetch(config) {
        return this.axios.request(config);
    }
    // Helper method for GET requests,
    // returning parsed response body or throwing an excetion in case of an issue
    async get(endpoint, headers = {}, scopes) {
        const config = { headers };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.get(endpoint, config);
        return resp.data;
    }
    // Helper method for GET requests returning binary data,
    // throwing an excetion in case of an issue
    async getBuffer(endpoint, headers = {}, scopes) {
        const config = { headers, responseType: 'arraybuffer' };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.get(endpoint, config);
        return resp.data;
    }
    // Helper method for GET requests returning stream data,
    // throwing an excetion in case of an issue
    async getStream(endpoint, headers = {}, scopes) {
        const config = { headers, responseType: 'stream' };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.get(endpoint, config);
        return resp.data;
    }
    // Helper method for POST requests,
    // returning parsed response body of throwing an excetion in case of an issue
    async post(endpoint, data, headers = {}, scopes) {
        const config = { headers };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.post(endpoint, data, config);
        return resp.data;
    }
    // Helper method for PUT requests,
    // returning parsed response body of throwing an excetion in case of an issue
    async put(endpoint, data, headers = {}, scopes) {
        const config = { headers };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.put(endpoint, data, config);
        return resp.data;
    }
    // Helper method for PATCH requests,
    // returning parsed response body of throwing an excetion in case of an issue
    async patch(endpoint, data, headers = {}, scopes) {
        const config = { headers };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.patch(endpoint, data, config);
        return resp.data;
    }
    // Helper method for DELETE requests,
    // returning parsed response body of throwing an excetion in case of an issue
    async delete(endpoint, headers = {}, scopes) {
        const config = { headers };
        await this.setAuthorization(config, scopes);
        const resp = await this.axios.delete(endpoint, config);
        return resp.data;
    }
}
exports.BaseClient = BaseClient;
