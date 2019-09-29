<script>
import claim from '../stores/claim';
import wallet from '../stores/wallet';
</script>

<h1>Thanks for joining in!</h1>
<h3>You were given a key to receive some funds.</h3>

{#if $wallet.status == 'NoWallet'}
<div style="text-align:center">
    <h3> You need a wallet first. </h3>
</div>
{:else}
    {#if $claim.status === "WaitingWallet" || $claim.status === "Loading"}
    <p>Please wait while we fetch the claiming token...</p>
    {:else if $claim.status === "Claiming"}
    <p>Claiming...</p>
    {:else if $claim.status === "WaitingTx"}
    <p>Waiting for tx to succeed...</p>
    {:else if $claim.status === "WaitingOldTx"}
    <p>Waiting for previous tx to succeed...</p>
    {:else if $claim.status === "Claimed"}
    <p>You claimed it</p>
    <div style="text-align:center">
        <button on:click="{claim.acknowledge}"> OK</button>
    </div>
    {:else if $claim.status === "ClaimSuccess"}
    <p>Claim Successful</p>
    <div style="text-align:center">
        <button on:click="{claim.acknowledge}"> OK</button>
    </div>
    {:else if $claim.status === "Gone"}
    <p>Claim Gone</p>
    <div style="text-align:center">
        <button on:click="{claim.acknowledge}"> OK</button>
    </div>
    {:else if $claim.status === "Failed"}
    <p>Claim Failed</p>
    <div style="text-align:center">
        <button on:click="{claim.acknowledge}"> OK</button>
    </div>
    {/if}
{/if}
