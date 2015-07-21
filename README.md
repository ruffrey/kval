# kval (under construction)

A simplistic and easy to scale JSON document datastore.

- wickedly fast
    - see [LMDB benchmarks](http://symas.com/mdb/#bench) upon which it is built
- ACID compliant - supports transactions
- persistent
- larger-than-memory
- JSON document store
- scale to over 1 billion records
- Peering (coming soon)
    - peer pub-sub
    - add and remove peers

kval uses a mongoose-like API.

## Datastore setup

1. Node.js ^v0.12.5
    - [nvm](https://github.com/creationix/nvm) is an easy option for installing and managing Node.js versions
1. Terminal: `npm install -g kval` (may require elevated privileges)
1. Terminal: `kval start` (required elevated privileges)
    - a full list of options can be seen by running `kval help`

This will install the database, keep it up on server reboots. By default
it listens on `127.0.0.1:9226`.

To be accessible externally, the port will need to be opened in your
firewall, and you must listen on a public IP.

### Config file

The database will be installed in the `kval` folder of your global node_modules.
Run `npm list -g` to see where node_modules are installed.

See the config file inside the installation: `db-config.json`.

Example default config file:

```json
[{
    "name": "kval",
    "script": "worker.js",
    "exec_mode": "cluster",
    "instances": 2,
    "env": {
        "host": "127.0.0.1"
        "port": "9226",
        "path": "kval-db"
        "mapSize": "268435456000",
        "password": ""
    },
    "max_memory_restart": "320MB"
}]

```

(if this looks familiar, it is a pm2 process file)


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

user.save(function (err, savedUser) {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('User was saved', savedUser);
});
```

### Finding

```javascript
User.findById(id, callback);
User.find(id, callback);
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

### Other languages

Drivers for other languages have not been added yet. Please open an issue
if you are interested in support for a language other than Node, or if you
created one and would like us to list it here.
