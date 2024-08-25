/// <reference types="node" />
import { BaseClient, IAuthOptions, Region } from './common';
export interface IBucket {
    bucketKey: string;
    createdDate: number;
    policyKey: string;
}
export interface IBucketPermission {
    authId: string;
    access: string;
}
export interface IBucketDetail extends IBucket {
    bucketOwner: string;
    permissions: IBucketPermission[];
}
export declare enum DataRetentionPolicy {
    Transient = "transient",
    Temporary = "temporary",
    Persistent = "persistent"
}
export interface IUploadParams {
    urls: string[];
    uploadKey: string;
}
export interface IDownloadParams {
    /** Indicates status of the object */
    status: 'complete' | 'chunked' | 'fallback';
    /** The S3 signed URL to download from. This attribute is returned when the value
     * of the status attribute is complete or fallback (in which case the URL will be
     * an OSS Signed URL instead of an S3 signed URL).
     */
    url?: string;
    /** A map of S3 signed URLs where each key correspond to a specific byte range chunk.
     * This attribute is returned when the value of the status attribute is chunked.
     */
    urls?: {
        [range: string]: string;
    };
    /** The values for the updatable params that were used in the creation of the returned
     * S3 signed URL (`Content-Type`, `Content-Disposition` & `Cache-Control`).
     */
    params?: object;
    /** The object size in bytes. */
    size?: number;
    /** The calculated SHA-1 hash of the object, if available. */
    sha1?: string;
}
export interface IObject {
    objectKey: string;
    bucketKey: string;
    objectId: string;
    sha1: string;
    size: number;
    location: string;
}
export interface IResumableUploadRange {
    start: number;
    end: number;
}
export interface ISignedUrl {
    signedUrl: string;
    expiration: number;
    singleUse: boolean;
}
export interface IUploadOptions {
    contentType?: string;
    progress?: (bytesUploaded: number, totalBytes?: number) => void;
}
export interface IDownloadOptions {
    contentType?: string;
    progress?: (bytesDownloaded: number, totalBytes?: number) => void;
}
/**
 * Client providing access to APS Data Management API ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/}).
 * @tutorial data-management
 */
export declare class DataManagementClient extends BaseClient {
    /**
     * Initializes new client with specific authentication method.
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://developer.api.autodesk.com"] APS host.
     * @param {Region} [region="US"] APS availability region ("US" or "EMEA" or "APAC").
     */
    constructor(auth: IAuthOptions, host?: string, region?: Region);
    private _pager;
    private _collect;
    /**
     * Iterates over all buckets in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-GET|docs}).
     * @async
     * @generator
     * @param {number} [limit=16] Max number of buckets to receive in one batch (allowed values: 1-100).
     * @yields {AsyncIterable<IBucket[]>} List of bucket object containing 'bucketKey', 'createdDate', and 'policyKey'.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    iterateBuckets(limit?: number): AsyncIterable<IBucket[]>;
    /**
     * Lists all buckets
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-GET|docs}).
     * @async
     * @returns {Promise<IBucket[]>} List of bucket objects.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    listBuckets(): Promise<IBucket[]>;
    /**
     * Gets details of a specific bucket
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-details-GET|docs}).
     * @async
     * @param {string} bucket Bucket key.
     * @returns {Promise<IBucketDetail>} Bucket details, with properties "bucketKey", "bucketOwner", "createdDate",
     * "permissions", and "policyKey".
     * @throws Error when the request fails, for example, due to insufficient rights, or when a bucket
     * with this name does not exist.
     */
    getBucketDetails(bucket: string): Promise<IBucketDetail>;
    /**
     * Creates a new bucket
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-POST|docs}).
     * @async
     * @param {string} bucket Bucket key.
     * @param {DataRetentionPolicy} dataRetention Data retention policy for objects uploaded to this bucket.
     * @returns {Promise<IBucketDetail>} Bucket details, with properties "bucketKey", "bucketOwner", "createdDate",
     * "permissions", and "policyKey".
     * @throws Error when the request fails, for example, due to insufficient rights, incorrect scopes,
     * or when a bucket with this name already exists.
     */
    createBucket(bucket: string, dataRetention: DataRetentionPolicy): Promise<IBucketDetail>;
    /**
     * Iterates over all objects in a bucket in pages of predefined size
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-GET|docs}).
     * @async
     * @generator
     * @param {string} bucket Bucket key.
     * @param {number} [limit=16] Max number of objects to receive in one batch (allowed values: 1-100).
     * @param {string} [beginsWith] Optional filter to only return objects whose keys are prefixed with this value.
     * @yields {AsyncIterable<IObject[]>} List of object containing 'bucketKey', 'objectKey', 'objectId', 'sha1', 'size', and 'location'.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    iterateObjects(bucket: string, limit?: number, beginsWith?: string): AsyncIterable<IObject[]>;
    /**
     * Lists all objects in a bucket
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-GET|docs}).
     * @async
     * @param {string} bucket Bucket key.
     * @param {string} [beginsWith] Optional filter to only return objects whose keys are prefixed with this value.
     * @returns {Promise<IObject[]>} List of object containing 'bucketKey', 'objectKey', 'objectId', 'sha1', 'size', and 'location'.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    listObjects(bucket: string, beginsWith?: string): Promise<IObject[]>;
    /**
     * Generates one or more signed URLs that can be used to upload a file (or its parts) to OSS,
     * and an upload key that is used to generate additional URLs or in {@see completeUpload}
     * after all the parts have been uploaded successfully.
     *
     * The URLs are valid for 60min.
     *
     * Note that if you are uploading in multiple parts, each part except for the final one
     * must be of size at least 5MB, otherwise the call to {@see completeUpload} will fail.
     *
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Object key.
     * @param {number} [parts=1] How many URLs to generate in case of multi-part upload.
     * @param {number} [firstPart=1] Index of the part the first returned URL should point to.
     * For example, to upload parts 10 through 15 of a file, use `firstPart` = 10 and `parts` = 6.
     * @param {string} [uploadKey] Optional upload key if this is a continuation of a previously
     * initiated upload.
     * @returns {IUploadParams} Signed URLs for uploading chunks of the file to AWS S3 (valid for 60min),
     * and a unique upload key used to generate additional URLs or to complete the upload.
     */
    getUploadUrls(bucketKey: string, objectKey: string, parts?: number, firstPart?: number, uploadKey?: string): Promise<IUploadParams>;
    /**
     * Finalizes the upload of a file to OSS.
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Object key.
     * @param {string} uploadKey Upload key returned by {@see getUploadUrls}.
     * @param {string} [contentType] Optinal content type that should be recorded for the uploaded file.
     * @returns {IObject} Details of the uploaded object in OSS.
     */
    completeUpload(bucketKey: string, objectKey: string, uploadKey: string, contentType?: string): Promise<IObject>;
    /**
     * Uploads content to a specific bucket object.
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Name of uploaded object.
     * @param {Buffer} data Object content.
     * @param {IUploadOptions} [options] Additional upload options.
     * @returns {Promise<IObject>} Object description containing 'bucketKey', 'objectKey', 'objectId',
     * 'sha1', 'size', 'location', and 'contentType'.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    uploadObject(bucketKey: string, objectKey: string, data: Buffer, options?: IUploadOptions): Promise<IObject>;
    /**
     * Uploads content stream to a specific bucket object.
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Name of uploaded object.
     * @param {AsyncIterable<Buffer>} stream Input stream.
     * @param {IUploadOptions} [options] Additional upload options.
     * @returns {Promise<IObject>} Object description containing 'bucketKey', 'objectKey', 'objectId',
     * 'sha1', 'size', 'location', and 'contentType'.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    uploadObjectStream(bucketKey: string, objectKey: string, input: AsyncIterable<Buffer>, options?: IUploadOptions): Promise<IObject>;
    /**
     * Generates a signed URL that can be used to download a file from OSS.
     * @param bucketKey Bucket key.
     * @param objectKey Object key.
     * @returns {IDownloadParams} Download URLs and potentially other helpful information.
     */
    getDownloadUrl(bucketKey: string, objectKey: string, useCdn?: boolean): Promise<IDownloadParams>;
    /**
     * Downloads a specific OSS object.
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Object key.
     * @param {IDownloadOptions} [options] Additional download options.
     * @returns {Promise<ArrayBuffer>} Object content.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    downloadObject(bucketKey: string, objectKey: string, options?: IDownloadOptions): Promise<ArrayBuffer>;
    /**
     * Downloads content stream of a specific bucket object.
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectKey Object name.
     * @param {IDownloadOptions} [options] Additional download options.
     * @returns {Promise<ReadableStream>} Object content stream.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    downloadObjectStream(bucketKey: string, objectKey: string, options?: IDownloadOptions): Promise<ReadableStream>;
    /**
     * @deprecated This method of resumable upload is now deprecated and will be removed in future versions.
     * Use {@see getUploadUrls} and {@see completeUpload} instead.
     *
     * Uploads content to a specific bucket object using the resumable capabilities
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-resumable-PUT|docs}).
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectName Name of uploaded object.
     * @param {Buffer} data Object content.
     * @param {number} byteOffset Byte offset of the uploaded blob in the target object.
     * @param {number} totalBytes Total byte size of the target object.
     * @param {string} sessionId Resumable session ID.
     * @param {string} [contentType='application/stream'] Type of content to be used in HTTP headers, for example, "application/json".
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    uploadObjectResumable(bucketKey: string, objectName: string, data: Buffer, byteOffset: number, totalBytes: number, sessionId: string, contentType?: string): Promise<any>;
    /**
     * @deprecated This method of resumable upload is now deprecated and will be removed in future versions.
     * Use {@see getUploadUrls} and {@see completeUpload} instead.
     *
     * Uploads content stream to a specific bucket object using the resumable capabilities
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-resumable-PUT|docs}).
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectName Name of uploaded object.
     * @param {ReadableStream} stream Object content stream.
     * @param {number} chunkBytes Byte size of the stream to be uploaded.
     * @param {number} byteOffset Byte offset of the uploaded blob in the target object.
     * @param {number} totalBytes Total byte size of the target object.
     * @param {string} sessionId Resumable session ID.
     * @param {string} [contentType='application/stream'] Type of content to be used in HTTP headers, for example, "application/json".
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    uploadObjectStreamResumable(bucketKey: string, objectName: string, stream: ReadableStream, chunkBytes: number, byteOffset: number, totalBytes: number, sessionId: string, contentType?: string): Promise<any>;
    /**
     * @deprecated This method of resumable upload is now deprecated and will be removed in future versions.
     * Use {@see getUploadUrls} and {@see completeUpload} instead.
     *
     * Gets status of a resumable upload session
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-status-:sessionId-GET|docs}).
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectName Name of uploaded object.
     * @param {string} sessionId Resumable session ID.
     * @returns {Promise<IResumableUploadRange[]>} List of range objects, with each object specifying 'start' and 'end' byte offsets
     * of data that has already been uploaded.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    getResumableUploadStatus(bucketKey: string, objectName: string, sessionId: string): Promise<IResumableUploadRange[]>;
    /**
     * Makes a copy of object under another name within the same bucket
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-copyto-:newObjectName-PUT|docs}).
     * @async
     * @param {string} bucket Bucket key.
     * @param {string} oldObjectKey Original object key.
     * @param {string} newObjectKey New object key.
     * @returns {Promise<IObject>} Details of the new object copy.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    copyObject(bucket: string, oldObjectKey: string, newObjectKey: string): Promise<IObject>;
    /**
     * Gets details of a specific bucket object
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-details-GET|docs}).
     * @async
     * @param {string} bucket Bucket key.
     * @param {string} object Object name.
     * @returns {Promise<IObject>} Object description containing 'bucketKey', 'objectKey', 'objectId',
     * 'sha1', 'size', 'location', and 'contentType'.
     * @throws Error when the request fails, for example, due to insufficient rights, or when an object
     * with this name does not exist.
     */
    getObjectDetails(bucket: string, object: string): Promise<IObject>;
    /**
     * Creates signed URL for specific object
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-signed-POST|docs}).
     * @async
     * @param {string} bucketId Bucket key.
     * @param {string} objectId Object key.
     * @param {string} [access="readwrite"] Signed URL access authorization.
     * @param {boolean} [useCdn=true] If true, this will generate a CloudFront URL for the S3 object.
     * @returns {Promise<ISignedUrl>} Description of the new signed URL resource.
     * @throws Error when the request fails, for example, due to insufficient rights.
     */
    createSignedUrl(bucketId: string, objectId: string, access?: string, useCdn?: boolean): Promise<ISignedUrl>;
    /**
     * Deletes object
     * ({@link https://aps.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-:objectName-DELETE|docs}).
     * @async
     * @param {string} bucketKey Bucket key.
     * @param {string} objectName Name of object to delete.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    deleteObject(bucketKey: string, objectName: string): Promise<any>;
    /**
     * Deletes bucket.
     * @async
     * @param {string} bucketKey Bucket key.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    deleteBucket(bucketKey: string): Promise<any>;
}
//# sourceMappingURL=data-management.d.ts.map