<script>
import { web3Status } from '../stores/dungeon';
</script>

{#if !$web3Status.currentChain}
<p>Please setup your wallet</p>
<button disabled="true" >And connect to one of these network: {$web3Status.validChains.join(' or ')}</button>
{:else}
<p>You are on the wrong chain ({$web3Status.currentChain})</p>
<button disabled="true" >Switch to {$web3Status.validChains.join(' or ')}</button>
{/if}

