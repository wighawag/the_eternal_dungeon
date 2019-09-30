# Setup

There is 2 parts, the contracts in `./contracts` and the web app in `./webapp`

Both need to be setup

## contracts setup 
```
cd contracts
yarn
```

## web app setup
```
cd webapp
yarn
```

# running in dev mode

## starting an local ethereum node with the Dungeon contract deployed and setup :
```
cd contracts
yarn dev
```

## starting the http server at http://localhost:8080
```
cd webapp
yarn dev
```

# Testing the app in the browser

go to [http://localhost:8080](http://localhost:8080)

if you use metamask or other built-in wallet, configure it to use the network at http://localhost:8545
