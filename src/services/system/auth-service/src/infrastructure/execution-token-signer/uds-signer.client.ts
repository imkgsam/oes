import { connect } from 'node:net'

/** Calls only the frozen signer-agent methods through the configured pod-local Unix socket. */
export class UdsSignerClient {
  constructor(private readonly socketPath: string) { if (!socketPath.startsWith('/')) throw new Error('signer socket path must be absolute') }
  /** Performs one bounded JSON-RPC call and rejects malformed, remote-error, or non-object responses. */
  call(method: 'GetActiveKey' | 'ListPublishedKeys' | 'SignEs256', params: object): Promise<unknown> { return new Promise((resolve,reject)=>{const s=connect(this.socketPath);let text='';s.setTimeout(3000);s.once('error',()=>reject(new Error('signer unavailable'))).once('timeout',()=>reject(new Error('signer unavailable'))).on('data',c=>{text+=c;if(!text.includes('\n'))return;try{const v=JSON.parse(text.trim());if(v?.jsonrpc!=='2.0'||v.error||!Object.prototype.hasOwnProperty.call(v,'result'))throw new Error('invalid signer response');resolve(v.result)}catch(e){reject(e)}finally{s.destroy()}});s.on('connect',()=>s.write(`${JSON.stringify({jsonrpc:'2.0',id:1,method,params})}\n`))}) }
}
