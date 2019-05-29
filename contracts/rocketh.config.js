
module.exports = {
    accounts: {
        "default":{
            type: "mnemonic",
            num: 10,
        },
        "4": {
            type: 'bitski'
        },
        "77": { // https://sokol.poa.network/
            type: "mnemonic",
            num: 10,
        },
    },
    ganacheOptions: {
        gasPrice: "1000000000",
        blockTime: 6 // TODO only for manual testing 
    },
    namedAccounts: {
        deployer: 0,
        dungeonOwner: {
            default: 1,
            4: 0,
            77: 0,
        },
        portisAccount: '0xacD8a455006Da5C8D115b3A6E9d17a3B59361F05',
        users: "from:2"
    },
}