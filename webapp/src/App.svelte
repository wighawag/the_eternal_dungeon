<script>
	import { dungeon, playerLocation, playerInDungeon, newAddress, playerEnergy } from './stores/dungeon.js';
	import wallet from './stores/wallet';
	import GameScreen from './screens/GameScreen.svelte';
	import LoadingScreen from './screens/LoadingScreen.svelte';
	import DungeonLoadingScreen from './screens/DungeonLoadingScreen.svelte';
	import Web3ConnectingScreen from './screens/Web3ConnectingScreen.svelte';
	import Web3ConnectionScreen from './screens/Web3ConnectionScreen.svelte';
	import Web3RequirementScreen from './screens/Web3RequirementScreen.svelte';
	import ErrorScreen from './screens/ErrorScreen.svelte';
	import EnterScreen from './screens/EnterScreen.svelte';
	import WelcomeBackScreen from './screens/WelcomeBackScreen.svelte';
	import RefillScreen from './screens/RefillScreen.svelte';
	import InvalidChainScreen from './screens/InvalidChainScreen.svelte';
	import WalletChoiceScreen from './screens/WalletChoiceScreen.svelte';

	export let name;
</script>

<!-- <h1>Hello {name}!</h1> -->

<!-- <p>{JSON.stringify($loading,null,'  ')}</p> -->

<!-- <p>{$dungeon}</p> -->
<!-- <p>{$playerLocation}</p> -->

{#if $dungeon && $dungeon != "loading"}
	{#if $dungeon.error }
		<Web3ConnectionScreen/>	
	<!-- <ErrorScreen error={JSON.stringify($dungeon.error)}/> -->
	{:else if $dungeon == "loading"}
		<DungeonLoadingScreen/>
	{:else}
		{#if $playerInDungeon}
			{#if $newAddress}
				<WelcomeBackScreen/>
			{:else}
				{#if $playerEnergy > 0}
					<GameScreen/>
				{:else}
					<RefillScreen/>
				{/if}
			{/if}
		{:else}
			<EnterScreen/>
		{/if}
	{/if}
{:else if $wallet && $wallet.status != "Loading"}
	{#if $wallet.status !== 'Ready'}
		<Web3RequirementScreen/>
	<!-- {:else if $web3Status.firstTime}
		<WalletChoiceScreen/>
	{:else if !$web3Status.validChain}
		<InvalidChainScreen/>
	{:else if !$web3Status.enabled}
		{#if $web3Status.enabling}
			<Web3ConnectingScreen/>
		{:else}
			<Web3ConnectionScreen/>
		{/if} -->
	{:else}
		<DungeonLoadingScreen/>
	{/if}
{:else}
<LoadingScreen/>
{/if}
