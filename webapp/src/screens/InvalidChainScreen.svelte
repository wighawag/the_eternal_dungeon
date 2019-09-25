<script>
import wallet from '../stores/wallet';
</script>

{#if $wallet.status === 'NoWallet'}
<p>Please setup your wallet</p>
<button disabled="true" >And connect to one of these network: {$wallet.validChains.join(' or ')}</button>
{:else}
<p>You are on the wrong chain ({$wallet.currentChain})</p>
<button disabled="true" >Switch to {$wallet.validChains.join(' or ')}</button>
{/if}

