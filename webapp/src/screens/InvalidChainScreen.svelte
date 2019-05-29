<script>
import { web3Status } from '../stores/dungeon';
</script>

<p>You are on the wrong chain</p>

<button disabled="true" >Switch to {$web3Status.validChains.join(' or ')}</button>