import { AxiosRequestConfig } from 'axios';
export interface ITwoLeggedToken {
    access_token: string;
    expires_in: number;
}
export interface IThreeLeggedToken extends ITwoLeggedToken {
    refresh_token: string;
}
export interface IUserProfile {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    preferred_username: string;
    email: string;
    email_verified: boolean;
    profile: string;
    picture: string;
    locale: string;
    updated_at: number;
    is_2fa_enabled: boolean;
    country_code: string;
    address: object;
    phone_number: string;
    phone_number_verified: boolean;
    ldap_enabled: boolean;
    ldap_domain: string;
    job_title: string;
    industry: string;
    industry_code: string;
    about_me: string;
    language: string;
    company: string;
    created_date: string;
    last_login_date: string;
    eidm_guid: string;
    opt_in: boolean;
    social_userinfo_list: object[];
    thumbnails: object;
}
/**
 * Client providing access to APS Authentication API ({@link https://aps.autodesk.com/en/docs/oauth/v2/reference/http}).
 * @tutorial authentication
 */
export declare class AuthenticationClient {
    private client_id;
    private client_secret;
    private host;
    private _cached;
    get clientId(): string;
    /**
     * Initializes new client with specific APS app credentials.
     * @param {string} client_id APS application client ID.
     * @param {string} client_secret APS application client secret.
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     */
    constructor(client_id: string, client_secret: string, host?: string);
    protected post(endpoint: string, params: any, config?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any>>;
    /**
     * Retrieves 2-legged access token for a specific set of scopes
     * ({@link https://aps.autodesk.com/en/docs/oauth/v2/reference/http/gettoken-POST/}).
     * Unless the {@see force} parameter is used, the access tokens are cached
     * based on their scopes and the 'expires_in' field in the response.
     * @param {string[]} scopes List of requested {@link https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/scopes|scopes}.
     * @param {boolean} [force] Skip cache, if there is any, and retrieve a new token.
     * @returns {Promise<ITwoLeggedToken>} Promise of 2-legged authentication object containing two fields,
     * 'access_token' with the actual token, and 'expires_in' with expiration time (in seconds).
     */
    authenticate(scopes: string[], force?: boolean): Promise<ITwoLeggedToken>;
    /**
     * Generates a URL for 3-legged authentication
     * ({@link https://aps.autodesk.com/en/docs/oauth/v2/reference/http/authorize-GET/}).
     * @param {string[]} scopes List of requested {@link https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/scopes/}.
     * @param {string} redirectUri Same redirect URI as defined by the APS app.
     * @returns {string} Autodesk login URL.
     */
    getAuthorizeRedirect(scopes: string[], redirectUri: string): string;
    /**
     * Exchanges 3-legged authentication code for an access token
     * ({@link https://aps.autodesk.com/en/docs/oauth/v2/reference/http/gettoken-POST/}).
     * @async
     * @param {string} code Authentication code returned from the Autodesk login process.
     * @param {string} redirectUri Same redirect URI as defined by the APS app.
     * @returns {Promise<IThreeLeggedToken>} Promise of 3-legged authentication object containing
     * 'access_token', 'refresh_token', and 'expires_in' with expiration time (in seconds).
     */
    getToken(code: string, redirectUri: string): Promise<IThreeLeggedToken>;
    /**
     * Refreshes 3-legged access token
     * ({@link https://aps.autodesk.com/en/docs/oauth/v2/reference/http/gettoken-POST/}).
     * @async
     * @param {string[]} scopes List of requested {@link https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/scopes|scopes}.
     * @param {string} refreshToken Refresh token.
     * @returns {Promise<IThreeLeggedToken>} Promise of 3-legged authentication object containing
     * 'access_token', 'refresh_token', and 'expires_in' with expiration time (in seconds).
     */
    refreshToken(scopes: string[], refreshToken: string): Promise<IThreeLeggedToken>;
    /**
     * Gets profile information for a user based on their 3-legged auth token
     * ({@link https://aps.autodesk.com/en/docs/profile/v1/reference/profile/oidcuserinfo/}).
     * @async
     * @param {string} token 3-legged authentication token.
     * @returns {Promise<IUserProfile>} User profile information.
     */
    getUserProfile(token: string): Promise<IUserProfile>;
}
//# sourceMappingURL=authentication.d.ts.map