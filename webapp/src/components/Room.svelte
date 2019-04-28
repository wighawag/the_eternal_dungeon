<script>
import { room_description, choices,  } from '../stores/dungeon.js';
function performChoice(choice) {
	choice.perform();
}
</script>


{#if $room_description} <!-- description of the current room -->
<h3>Room xxx</h3>
<p>{$room_description}</p> 
{/if}


<hr/>

{#if $choices} <!-- action player can make , nove north, attack monsters, open chest ... -->
<h3>What do you do ?</h3>
<p>
{#each $choices as choice}
    <button on:click="{() => performChoice(choice)}" >{choice.name}</button>
{:else}
    You are stucked.
{/each}
</p>
{/if}

