const dns = require('node:dns')

const originalLookup = dns.lookup

/** Resolves only the deployment-owned local issuer alias without weakening TLS hostname checks. */
dns.lookup = function lookup(hostname, options, callback) {
  if (hostname !== 'issuer.local.oes.internal') {
    return originalLookup.call(this, hostname, options, callback)
  }
  if (typeof options === 'function') return options(null, '127.0.0.1', 4)
  if (options?.all) return callback(null, [{ address: '127.0.0.1', family: 4 }])
  return callback(null, '127.0.0.1', 4)
}
