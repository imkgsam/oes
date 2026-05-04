import { Observable } from "rxjs";
export interface UploadAccountAvatarRequest {
    scopeLevel?: string | undefined;
    tenantId?: string | undefined;
    accountId?: string | undefined;
    operatorId?: string | undefined;
    file?: Buffer | undefined;
    fileName?: string | undefined;
    contentType?: string | undefined;
}
export interface AssetSummary {
    assetId?: string | undefined;
    scopeLevel?: string | undefined;
    tenantId?: string | undefined;
    ownerAccountId?: string | undefined;
    category?: string | undefined;
    storageKey?: string | undefined;
    mimeType?: string | undefined;
    size?: string | undefined;
    checksum?: string | undefined;
    publicUrl?: string | undefined;
    status?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface UploadAccountAvatarResponse {
    asset?: AssetSummary | undefined;
}
export interface BindAccountAvatarRequest {
    scopeLevel?: string | undefined;
    tenantId?: string | undefined;
    accountId?: string | undefined;
    operatorId?: string | undefined;
    newAssetId?: string | undefined;
    previousAssetId?: string | undefined;
}
export interface BindAccountAvatarResponse {
    activeAsset?: AssetSummary | undefined;
    replacedAssetId?: string | undefined;
}
export interface ResolveAssetPublicUrlRequest {
    assetId?: string | undefined;
}
export interface ResolveAssetPublicUrlResponse {
    assetId?: string | undefined;
    publicUrl?: string | undefined;
    status?: string | undefined;
}
/** 头像资产服务负责受控头像上传、绑定和展示地址解析。 */
export interface AssetServiceClient {
    uploadAccountAvatar(request: UploadAccountAvatarRequest, ...rest: any): Observable<UploadAccountAvatarResponse>;
    bindAccountAvatar(request: BindAccountAvatarRequest, ...rest: any): Observable<BindAccountAvatarResponse>;
    resolveAssetPublicUrl(request: ResolveAssetPublicUrlRequest, ...rest: any): Observable<ResolveAssetPublicUrlResponse>;
}
/** 头像资产服务负责受控头像上传、绑定和展示地址解析。 */
export interface AssetServiceController {
    uploadAccountAvatar(request: UploadAccountAvatarRequest, ...rest: any): Promise<UploadAccountAvatarResponse> | Observable<UploadAccountAvatarResponse> | UploadAccountAvatarResponse;
    bindAccountAvatar(request: BindAccountAvatarRequest, ...rest: any): Promise<BindAccountAvatarResponse> | Observable<BindAccountAvatarResponse> | BindAccountAvatarResponse;
    resolveAssetPublicUrl(request: ResolveAssetPublicUrlRequest, ...rest: any): Promise<ResolveAssetPublicUrlResponse> | Observable<ResolveAssetPublicUrlResponse> | ResolveAssetPublicUrlResponse;
}
export declare function AssetServiceControllerMethods(): (constructor: Function) => void;
export declare const ASSET_SERVICE_NAME = "AssetService";
