import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Reads the frozen Site Media wire contract directly so generated code cannot mask a proto regression. */
const proto = (): string => readFileSync(join(__dirname, 'site_media.proto'), 'utf8')

/** Guards the 11-RPC Asset Site Media collaboration surface and its identity-free request wire shapes. */
describe('SiteMediaAssetService proto contract', () => {
  it('declares exactly the frozen service name and 11 RPCs, with only Upload streaming', () => {
    const source = proto()
    const service = source.match(/service SiteMediaAssetService \{([\s\S]*?)\n\}/)?.[1] ?? ''
    const names = [...service.matchAll(/rpc (\w+)\(/g)].map((match) => match[1])
    expect(names).toEqual(['UploadSiteMedia', 'ListAuthorizedSiteMedia', 'ResolveSiteMediaForPublication', 'PrepareSiteMediaRemoteDelivery', 'ActivateSiteMediaRemoteDelivery', 'ProtectSitePublicationReferences', 'ReleaseSitePublicationReferences', 'ArchiveSiteMedia', 'TakeDownSiteMedia', 'GetSiteMediaDeliveryStatus', 'DeleteSiteMedia'])
    expect(service).toContain('rpc UploadSiteMedia(stream UploadSiteMediaRequest) returns (UploadSiteMediaResponse);')
    expect(service).not.toMatch(/rpc (?!UploadSiteMedia\b)\w+\(stream /)
  })

  it('pins request numbers, upload oneof ordering, and the absence of body identity authority', () => {
    const source = proto()
    expect(source).toContain('message UploadSiteMediaRequest { oneof payload { UploadSiteMediaStart start = 1; bytes content_chunk = 2; } }')
    expect(source).toContain('message UploadSiteMediaStart { string idempotency_key = 1; string site_id = 2; string requested_media_kind = 3; string original_file_name = 4; string declared_content_type = 5; }')
    expect(source).toContain('message ListAuthorizedSiteMediaRequest { string site_id = 1; string query = 2; string media_kind_filter = 3; bool include_archived = 4; uint32 page_size = 5; string page_token = 6; }')
    expect(source).toContain('message ProtectSitePublicationReferencesRequest { string idempotency_key = 1; string site_id = 2; uint64 publish_version = 3; repeated string asset_ids = 4; }')
    expect(source).toContain('message TakeDownSiteMediaRequest { string idempotency_key = 1; string asset_id = 2; string reason_code = 3; string reason_note = 4; }')
    expect(source).not.toMatch(/\b(tenant_id|org_id|operator_id|principal|permission|trace_id|execution_token)\b/)
    expect(source).not.toMatch(/\breserved\b/)
  })
})
