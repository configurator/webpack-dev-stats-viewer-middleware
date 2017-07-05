const path = require('path');

const primitivesOnly = function (obj) {
    switch (typeof obj) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
            return obj;

        default:
            return undefined;
    }
};

const attempt = function (fun) {
    try {
        return fun();
    } catch (e) {
        return undefined;
    }
};

const serialize = function (obj) {
    if (obj === null) {
        return {
            type: 'null'
        };
    } else if (obj === undefined) {
        return {
            type: 'undefined'
        };
    } else if (typeof obj === 'object' || typeof obj === 'function') {
        // complex types - don't dive deep (that will be done in a separate query), just provide metadata
        let keys = Object.keys(obj);

        return {
            type: typeof obj,
            objectType: Object.prototype.toString.apply(obj).slice(8, -1), // 8, -1 removes the '[object ' and ']' parts
            constructorName: attempt(() => obj.constructor.name),
            keys: keys,
            values: keys.map(key => obj[key]).map(primitivesOnly),
            string: attempt(() => obj.toString()),
            value: primitivesOnly(attempt(() => obj.valueOf()))
        };
    } else {
        // primitive types
        return {
            type: typeof obj,
            value: obj
        };
    }
};

module.exports = function (expressApp, url) {
    expressApp.get(url, (req, res) => {
        res.sendFile(require.resolve('./client.html'));
    });

    expressApp.get(url + '/data', (req, res) => {
        let data = res && res.locals && res.locals.webpackStats && res.locals.webpackStats;
        let hash = data && data.hash;
        let select = req.query && req.query.select;

        if (select) {
            let parts = select.split('.');
            for (var part of parts) {
                data = data && data[part];
            }
        }

        let result = serialize(data);
        result.hash = hash;
        res.send(result);
    });
};
