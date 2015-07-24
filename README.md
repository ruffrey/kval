# kval - under construction

A simplistic and easy to scale JSON document datastore.

- wickedly fast
    - see [LMDB benchmarks](http://symas.com/mdb/#bench) upon which it is built
- ACID compliant - supports transactions
- persistent
- store size can be larger than memory
- JSON store supporting very large documents
- a single instance scales to over 1 billion records
- Peering (coming soon)
    - peer pub-sub
    - eventual consistency
    - adds redundancy and horizontal traffic capacity

## Goals

- one-line install and fast setup with no prior knowledge
- add redundancy in minutes
- minimal APIs to learn
- APIs that are familiar to NoSQL developers
- should be usable for minimum viable products that don't want to worry about scaling for a while
- small, well tested, maintainable codebase with few dependencies

kval uses a simplified Node.js Mongoose-like API.

## Quickstart

kval is a Node.js app with bindings to LMDB, so it can be run in a lot of ways,
including `require`d into a Node.js project (see instructions below for *Embedding*).

Below are instructions for running it as an independent service.

### Install on Ubuntu

```bash
curl https://storage.googleapis.com/kval/ubuntu.sh | bash
```

### Running on OSX

There is no installation script. For now you can run it as a Node.js app.

```bash
git clone <TODO: INSERT REPOSITORY>
cd kval && npm i --production
node worker.js
```

## Advanced setup

At it's core this is a Node.js app, so running it is up to you. There are a
variety of way to run Node.js apps.

kval uses environment variables for its configuration.

```bash
KVAL_WORKER_HOST=0.0.0.0
KVAL_WORKER_PORT=9226
KVAL_WORKER_DB_PATH=/path/to/db/files
KVAL_WORKER_DB_MAX_SIZE_BYTES=524288000 # 500 MiB
KVAL_WORKER_PASSWORD="secret-stuff"
```

## Node.js client usage

### Connecting

```javascript
var Kval = require('kval').Client;
var kval = new Kval();

kval.connect({
    host: '127.0.0.1',
    port: 9226,
    password: 'swordfish'
}, function (err) {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected!');
});
```

### Creating and updating

```javascript
var schema = {
    properties: {
        name: {
            type: 'string'
            index: true // makes it searchable, non-indexed fields are not
        },
        age: {
            type: 'number'
        },
        libraryCard: {
            type: 'string',
            unique: true // makes it searchable and ensures uniqueness
        }
    }
};

var User = client.model('User4', schema);
var user = new User({ name: 'Bill', age: 32, libraryCard: 'A-55555' });

console.log(user.id); // auto generated id field

user.save(function callback(err, savedUser) {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('User was saved', savedUser);
    savedUser.age++;
    savedUser.save(function (err) {
        console.log('User got old');
    });
});
```

### Finding

```javascript
User.findById(id, callback);
User.find({ someIndex: 'someValue' }, callback);
```

### Deleting

```javascript
User.findById('Yrei32kLisd9gaknbl9akNyr', function (err, user) {
    if (err) { console.error(err); }
    user.remove(function (err) {
        if (err) { console.error(err); }
        console.log('User was removed successfully.');
    })
});
```

## Other languages

Drivers for other languages have not been added yet. Please open an issue
if you are interested in support for a language other than Node, or if you
created one and would like us to list it here.

## Architecture and protocol

kval is a thin layer over the LMDB keystore:

- a simple database management system (dbms) for storing JSON
documents
- a pre-shared password auth scheme
    - two step handshake to establish a secure session
    - subsequent requests are fully encrypted
- RPC protocol over TCP
    - uses [dnode, which supports many languages](https://github.com/substack/dnode#dnode-in-other-languages)

### Embedding

kval can be embedded in a Node.js application.

```javascript
var Dbms = require('kval').Dbms;
var db = new Dbms();
var options = {
    host: '0.0.0.0',
    port: 9226,
    path: 'path/to/db',
    mapSize: 1024 * 1024 * 1024 * 50, // Max db size in bytes
    password: 'not-a-secret'
};
db.initialize(options, function callback(err) {

});
```

Real examples of embedding can be seen in most of the tests - see the `test/` folder.

## keys / ID / `.id` field

`id`s must be unique, as this is a key-value store at its heart, with JSON
documents as the values.

The key can be any JSON type.

By default the Node.js client library will assign keys when they are not
specified. The default `ids` are
**24 character pseudo-random case-sensitive alphanumeric strings** which should guarantee uniqueness.

## Backups

Backup the `data.mdb` and `lock.mdb` files in your `KVAL_WORKER_DB_PATH`.

To restore, put the two files back into the `KVAL_WORKER_DB_PATH`.

## Benchmarks

Benchmarks for basic CRUD and other scenarios are in the `test/benchmarks/` folder. Having multiple instances of `worker.js` would improve benchmarks (i.e. using Node.js cluster).


Run benchmarks with
```bash
npm run bench
```

## Tests

```bash
npm test
```

Test coverage can be seen by running
```bash
npm run cover
```

The coverage goal is at least 90%, currently at about 70%.


## Work list

- peering with pub-sub
- client multi-connection pooling
- finish queries
- test 1 billion records
- example REST api app
- `$inc` ability on integer fields
- schema validation


# Licensing

### kval

MIT

See LICENSE file in the repository

### LMDB
OpenLDAP's BSD-style license

### Other dependencies
See deps in `package.json` to track licenses
