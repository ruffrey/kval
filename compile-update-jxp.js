'use strict';
var log = console.log;
var fs = require('fs');
var jxpLocation = __dirname + '/kval.jxp';
log('jxp location is', jxpLocation);
log('reading contents');
var jxp;
try {
    jxp = JSON.parse(fs.readFileSync(jxpLocation));
} catch (ex) {
    log(ex);
    process.exit(-1);
}
log('read jxp', jxp);

jxp.preInstall = [
    'curl http://jxcore.com/xil.sh | bash -s local',
    './jx install async debug dnode node-lmdb yargs',
    'rm ./jx'
];
log('updated preInstall', jxp.preInstall);

jxp.native = true;
log('set build to native:', jxp.native);

log('writing back out to', jxpLocation);
try {
    fs.writeFileSync(jxpLocation, JSON.stringify(jxp, null, 2));
} catch (ex) {
    log(ex);
    process.exit(-1);
}
log('done');
