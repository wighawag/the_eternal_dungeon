<script>
	import { dungeon, playerLocation, playerInDungeon, newAddress, playerEnergy } from './stores/dungeon.js';
	import wallet from './stores/wallet';
	import claim from './stores/claim';

	import GameScreen from './screens/GameScreen';
	import DungeonLoadingScreen from './screens/DungeonLoadingScreen';
	import EnterScreen from './screens/EnterScreen';
	import WelcomeBackScreen from './screens/WelcomeBackScreen';
	import RefillScreen from './screens/RefillScreen';
	import ClaimScreen from './screens/ClaimScreen';
	import WalletWrapper from './components/WalletWrapper'

	export let name;
</script>

{#if $claim && $claim.status != "None"}
	<ClaimScreen />
{:else}
	<WalletWrapper>
		{#if $dungeon && $dungeon != "loading"}
			{#if $playerInDungeon}
				{#if $newAddress}
					<WelcomeBackScreen/>
				{:else}
					{#if $playerEnergy > 0}
						<GameScreen/>
					{:else}
						<RefillScreen/>
						<p>{$playerEnergy} left</p>
					{/if}
				{/if}
			{:else}
				<EnterScreen/>
			{/if}
		{:else}
			<DungeonLoadingScreen/>
		{/if}
	</WalletWrapper>
{/if}