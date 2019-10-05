<script>
    import wallet from '../stores/wallet';
</script>

{#if $wallet.status == 'Loading'}
    <div style="text-align:center">
        <h3> Please wait... </h3>
    </div>
{:else if $wallet.status == 'Locked'}
    <div style="text-align:center">
        <button on:click="{wallet.unlock}"> Connect your wallet</button>
    </div>
{:else if $wallet.status == 'Unlocking'}
    <div style="text-align:center">
        <h3> Please accept the connection request </h3>
    </div>
{:else if $wallet.status == 'NoWallet'}
    
    <div style="text-align:center">
        <h3> You'll need a QR code</h3>
        <!-- <h3> You don't have a wallet. </h3> -->
        <!-- <button on:click="{() => wallet.createLocalWallet()}">Create local Wallet</button> -->
    </div>
{:else if $wallet.status == 'CreatingLocalWallet'}
    <div style="text-align:center">
        <h3>Creating Local Wallet</h3>
    </div>
{:else if $wallet.status == 'Opera_FailedChainId'}
    
    <div style="text-align:center">
        <h3 class="errorTitle"> You are using Opera </h3>
        <h5 class="errorMessage">You need to set up your wallet. if a popup did not come up you'll need to go into Opera setting to set it up.</h5>
        <button on:click="{() => wallet.retry()}">Retry</button>
    </div>
    
{:else if $wallet.status == 'Opera_Locked'}
    
    <div style="text-align:center">
        <h3 class="errorTitle"> You are using Opera </h3>
        <h5 class="errorMessage"> You need to authorize access to your wallet. </h5>
        <button on:click="{() => wallet.retry()}">Request Access</button>
    </div>
    
{:else if $wallet.status == 'Error'}
    
    <div style="text-align:center">
        <h3 class="errorTitle"> There were an Error </h3>
        <h5 class="errorMessage">{$wallet.error.message}</h5>
        <button on:click="{() => wallet.retry()}">Retry</button>
    </div>
    
{:else if $wallet.status == 'Ready'}
    {#if $wallet.chainNotSupported}
        <div style="text-align:center">
            <h3> Please change your network </h3>
            {#if $wallet.requireManualChainReload }
                <h5 class="errorMessage">You might need to reload the page after switching to the new chain</h5>
                <button on:click="{() => wallet.reloadPage()}">Reload</button>
            {/if}
        </div>
    {:else}
        {#if $wallet.requestingTx}
        <div style="text-align:center">
            <h3> Please accept the transaction request </h3>
        </div>
        {:else}
        <slot></slot>    
        {/if}
    {/if}
{/if}
