<script>
import claim from '../stores/claim';
</script>

{#if $claim.status === "WaitingWallet" || $claim.status === "Loading"}
<p>Please wait while we fetch the claiming token...</p>
{:else if $claim.status === "Claiming"}
<p>Claiming...</p>
{:else if $claim.status === "Claimed"}
<p>You already claimed it</p>
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

<!-- > $web3Status.config.minBalance -->