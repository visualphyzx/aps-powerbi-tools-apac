import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { AuthenticationClient } from './authentication';
export declare function sleep(ms: number): Promise<unknown>;
export declare const DefaultHost = "https://developer.api.autodesk.com";
export declare enum Region {
    US = "US",
    EMEA = "EMEA",
    APAC = "APAC"
}
export declare type IAuthOptions = {
    client_id: string;
    client_secret: string;
} | {
    token: string;
};
export declare type IRequestData = {
    urlencoded: any;
} | {
    json: any;
} | {
    buffer: any;
};
export declare abstract class BaseClient {
    protected auth?: AuthenticationClient;
    protected token?: string;
    protected root: string;
    protected host: string;
    protected region: Region;
    protected axios: AxiosInstance;
    /**
     * Initializes new client with specific authentication method.
     * @param {string} root Root path for all endpoints (must not contain any slashes at the beginning nor end).
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host (must not contain slash at the end).
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or "APAC").
     */
    constructor(root: string, auth: IAuthOptions, host?: string, region?: Region);
    /**
     * Resets client to specific authentication method, APS host, and availability region.
     * @param {IAuthOptions} [auth] Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or "APAC").
     */
    reset(auth?: IAuthOptions, host?: string, region?: Region): void;
    protected setAuthorization(options: any, scopes: string[]): Promise<void>;
    protected fetch(config: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any>>;
    protected get(endpoint: string, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected getBuffer(endpoint: string, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected getStream(endpoint: string, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected post(endpoint: string, data: any, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected put(endpoint: string, data: any, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected patch(endpoint: string, data: any, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
    protected delete(endpoint: string, headers: {
        [name: string]: string;
    } | undefined, scopes: string[]): Promise<any>;
}
//# sourceMappingURL=common.d.ts.map