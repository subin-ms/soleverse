const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.soleverse.oes4or9.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS Srv resolution failed:', err);
  } else {
    console.log('DNS Srv resolution success:', addresses);
  }
});
