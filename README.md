# kval - under construction

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

kval uses a simplified Node.js Mongoose-like API.

## Quickstart

kval is a Node.js app with bindings to LMDB, so it can be run in a lot of ways,
including `require`d into a Node.js project.

Below are instructions for running it as an independent service.

### Install on Ubuntu

```bash
curl https://bitbucket.org/ruffrey/kval/raw/7c1231ff2e29aca14b5ff073d6eaba923fdfa20f/install-scripts/debian.sh | bash
```

This will install into the current folder, running on **port 9226**.

Inside the installation directory, you may wish to edit the `db-config.json`
file.

## Start/stop/restart

[pm2](https://github.com/Unitech/PM2) is the recommended tool to manage the
database process. It is installed when following the quickstart script above.

* [pm2 process management documentation](https://github.com/Unitech/PM2)


## Datastore setup

At it's core this is a Node.js app, so running it is

We recommend pm2 for running and keeping it up.

More instructions coming soon, see `install-scripts/` for examples of
production deployment.

### Config file - db-config.js

The database will be installed in the `kval` folder of your global node_modules.
Run `npm list -g` to see where node_modules are installed.

See the config file inside the installation: `db-config.json`.

Example default config file:

```json
{
    "apps": [{
        "name": "kval",
        "script": "worker.js",
        "exec_mode": "cluster",
        "instances": 2,
        "env": {
            "KVAL_WORKER_HOST": "0.0.0.0",
            "KVAL_WORKER_PORT": 9226,
            "KVAL_WORKER_DB_PATH": "db",
            "KVAL_WORKER_DB_MAX_SIZE_BYTES": 268435456000,
            "KVAL_WORKER_PASSWORD": ""
        },
        "max_memory_restart": "256M"
    }]
}
```

If this looks familiar, it is a pm2 process file. The full list of options
can be seen in the
[pm2 app declaration docs](https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#options-1).


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
