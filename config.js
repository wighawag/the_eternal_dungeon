
const configs = {
    'default': {
        minBalance: '5000000000000000',
        price: '5000000000000000000',
    },
    '77':{
        minBalance: '5000000000000000',
        price: '500000000000000000',
    },
}

module.exports = (chainId) => {
    let config = configs['default'];
    if(configs[chainId]) {
        // TODO merge
        config = configs[chainId]
    }
    return config;
}
