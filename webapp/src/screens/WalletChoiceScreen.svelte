<script>
    import { web3Status } from '../stores/dungeon';
    
    let processing = false;
    async function connectWithNifty() {
        processing = true;
        try{
            await web3Status.useNiftyGateway();
        }catch(e) {
            processing = false;
        }
        processing = false;
    }
    async function connectWithPortis(chainName) {
        processing = true;
        try{
            await web3Status.usePortis(chainName);
        }catch(e) {
            processing = false;
        }
        processing = false;
    }

    async function connectWithBitski(chainName) {
        processing = true;
        try{
            await web3Status.useBitski(chainName);
        }catch(e) {
            processing = false;
        }
        processing = false;
    }

    async function connectWithBuiltInWallet() {
        processing = true;
        try{
            await web3Status.useBuiltInWallet();
        }catch(e) {
            processing = false;
        }
        processing = false;
    }
    </script>
        
    <p>Choose a wallet to use</p>
    
    <!-- <button disabled={processing} on:click="{connectWithNifty}" >Connect via Nifty Gateway</button> -->
    <button disabled={processing} on:click="{() => connectWithBitski('rinkeby')}" >Connect via Bitski (Rinkeby)</button>
    <button disabled={processing} on:click="{() => connectWithPortis('rinkeby')}" >Connect via Portis (Rinkeby)</button>
    <button disabled={processing} on:click="{() => connectWithPortis('sokol')}" >Connect via Portis (Sokol)</button>
    <button disabled={processing} on:click="{() => connectWithBuiltInWallet()}">Use Built-in Wallet</button>
                