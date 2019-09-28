<script>
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

export let texts;
export let charTime = 50;
export let done;
export let skip = 0;

let lastSkip = 0;
let startTime;
let totalLength = 0;
let textIndexes = [];
let counter = 0;
for(let text of texts) {
    for(let i = 0; i < text.length; i++) {
        textIndexes[totalLength+i] = counter;
    }
    totalLength += text.length;
    counter ++;
}
const duration = totalLength * charTime;
// console.log({duration, totalLength, texts, textIndexes, counter, charTime});
let currentText;
let currentIndex = 0;
function update(now) {
    if(!startTime) {
        startTime = now;
    }

    let toSkip = false;
    if(lastSkip != skip) {
        lastSkip = skip;
        toSkip = true;
    }

    const t = (now - startTime) / duration;

    let i = ~~(totalLength * t);
    if( i == 0) {
        currentText = null;
    } else {
        if(i >= textIndexes.length) {
            i = textIndexes.length -1;
        }
        const textIndex = textIndexes[i];
        let offset = 0;
        for(let i = 0; i < textIndex; i++) {
            offset += texts[i].length;
        }
        if(i - offset == 0) {
            currentText = null;
        } else {
            currentText = texts[textIndex].slice(0, i - offset);
        }
    }
    
    if(now - startTime > duration) {
        done = true;
        dispatch('done');
    } else {
        window.requestAnimationFrame(update);
    }
}
update(performance.now());
</script>

{#if currentText == null}
<p>&nbsp;</p>
{:else}
<p>{currentText}</p>
{/if}