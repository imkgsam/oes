import { createServer } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { UdsSignerClient } from './uds-signer.client'
describe('UdsSignerClient',()=>{it('rejects signer error responses',async()=>{const dir=mkdtempSync(join(tmpdir(),'oes-uds-'));const path=join(dir,'s.sock');const server=createServer(c=>c.end('{"jsonrpc":"2.0","id":1,"error":{"message":"no"}}\n'));await new Promise<void>(r=>server.listen(path,r));await expect(new UdsSignerClient(path).call('GetActiveKey',{})).rejects.toThrow('invalid signer response');server.close();rmSync(dir,{recursive:true,force:true})})})
