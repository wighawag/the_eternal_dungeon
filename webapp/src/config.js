
const conf = {
    price: {
        'default': '10000000000000000', // '1000000000000000000',
        '4': '10000000000000000',
        '42': '10000000000000000',
        '77': '10000000000000000',
        '100': '1000000000000000000', // 1 dai
    },
    minBalance: {
        'default': '1000000000000000', // '10000000000000000',
        '4': '1000000000000000',
        '42': '1000000000000000',
        '77': '1000000000000000',
        '100': '100000000000000000', // 0.01 dai
    }
}

const cache = {};
module.exports = function(chainId) {
    if(cache[chainId]) {
        return cache[chainId];
    }
    const config = {};
    for (const key of Object.keys(conf)) {
        if(typeof conf[key] === 'object') {
            if (conf[key][chainId]) {
                config[key] = conf[key][chainId];
            } else if(conf[key]['default']){
                config[key] = conf[key]['default']
            }
        } else {
            config[key] = conf[key];
        }
        
    }
    cache[chainId] = config;
    return config;
}