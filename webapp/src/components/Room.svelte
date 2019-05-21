<script>
import TypeWriterText from './TypeWriterText.svelte';
import {pause} from '../utils/time';
import { room_description, choices, dungeon, directions  } from '../stores/dungeon';
import { typewriter } from '../transitions';
import { room_to_room } from '../db'
const utils = $dungeon.utils;
let moving = false;
let moving_texts = null;
let currentStage = 0;
let room_described = false;
let roomStage = 0;
async function performChoice(choice) {
    moving = true;
    room_described = false;
    roomStage = 0;
    text_while_moving();
    const receipt = await choice.perform().then(utils.waitReceipt);
    await $dungeon.once('block', (block) => block >= receipt.blockNumber);
    console.log('done', receipt);
    moving = false;
}

async function move(direction) {
    moving = true;
    room_described = false;
    roomStage = 0;
    text_while_moving();
    const receipt = await $dungeon.move(direction).then(utils.waitReceipt);
    await $dungeon.once('block', (block) => block >= receipt.blockNumber);
    console.log('done', receipt);
    moving = false;
}

async function text_while_moving() {
    currentStage = 0;
    moving_texts = room_to_room[Math.floor(Math.random()*room_to_room.length)];
}
</script>

<style>
:global(body), :global(html) {
    height:100%;
    min-height:100%;
}
:global(body) {
    display: flex;
    flex-direction: column;
}

.content {
  flex: 1 0 auto;
}
.footer {
  flex-shrink: 0;
}
table {
  table-layout: fixed;
  width: 100%;
  /* height: 100%; */
  border-collapse: collapse;
  border: 3px solid purple;
}
td {
    border: 3px solid red;
}
td > div {
    overflow: hidden;
    height: 50px;
    text-align: center;
}
tr {
    border: 3px solid green;
}
</style>

<div class="content">
{#if $room_description} <!-- description of the current room -->
    <h3>Room xxx</h3>
    {#if moving_texts != null}
        <TypeWriterText texts={moving_texts} charTime=50 bind:stage={currentStage} on:done="{() => {moving_texts=null; currentStage=0;}}"/>
    {:else if moving}
        <!-- <p>...</p> -->
        <p in:typewriter="{{ charTime: 100 }}">..............................................................</p>
    {:else} 
        <TypeWriterText texts={[$room_description]} charTime=50 bind:stage={roomStage} on:nomoretext="{() => {room_described=true;}}"/>    
    <!-- <p>{$room_description}</p>  -->
        <!-- <p in:typewriter>{$room_description}</p>  -->
    {/if}
{/if}

</div>

<div class="footer">
    <hr/>
    <h3 style="visibility:{($directions && !moving && moving_texts == null && room_described)?'visible':'hidden'}">What do you do ?</h3>
    <table style="visibility:{$directions?'visible':'hidden'}">
        <tr>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td>
            <div>
                {#if $directions && !moving && moving_texts == null && room_described}
                <button disabled={moving || !$directions.north} on:click="{() => move(0)}" >North</button> 
                {/if}
            </div>
            </td>
            <td><div></div></td>
        </tr>
        <tr>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td>
            <div>
                {#if $directions && !moving && moving_texts == null && room_described}
                <button disabled={moving || !$directions.west} on:click="{() => move(3)}" >West</button>
                {/if}
            </div>
            </td>
            <td><div></div></td> 
            <td>
            <div>
                {#if $directions && !moving && moving_texts == null && room_described}
                <button disabled={moving || !$directions.east} on:click="{() => move(1)}" >East</button>
                {/if}
            </div>
            </td>
        </tr>
        <tr>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td>
            <div>
                {#if $directions && !moving && moving_texts == null && room_described}
                <button disabled={moving || !$directions.south} on:click="{() => move(2)}" >South</button>
                {/if}
            </div>
            </td>
            <td>
            <div>
                {#if !moving && moving_texts == null && !room_described}
                    <button on:click="{() => roomStage++}" >skip</button>
                {/if}
                
                {#if moving_texts != null}
                    {#if currentStage % 2 ==0}
                        <button on:click="{() => currentStage++}" >skip</button>
                    {:else}
                        <button on:click="{() => currentStage++}" >next</button>
                    {/if}
                {/if}
            </div>
            </td>
        </tr>
    </table>
</div>
