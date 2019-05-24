<script>
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

export let texts;
export let charTime = 50;
export let done;
export let stage = 0;

let lastTexts
let startTime;
let index = 0;
let currentText = null;
let paused = false;
let lastStage = stage;

let nomoretextDispatched = false;

function update(now) {
    if(lastTexts != texts) { // init
        if(stage != 999) {
            startTime = undefined;
            index = 0;
            paused = false;
        } else {
            index = texts.length -1;
            paused = true;
        }
        
        lastTexts = texts;
        currentText = null;
        lastStage = stage;
        nomoretextDispatched = false;
    }
    if(!startTime) {
        startTime = now;
    }

    const stageText = texts[index];

    const duration = stageText.length * charTime;
    const t = (now - startTime) / duration;

    let i = ~~(stageText.length * t);
    if(paused) {
        i = stageText.length;
    }
    if( i == 0) {
        currentText = null;
    } else {
        let lastWordCharCount = 0;
        for(let j = i; j < stageText.length; j++) {
            const lastChar = stageText.charAt(j);
            if(lastChar == "\n" || lastChar == " ") { // TODO other breakable word / characters...
                break;
            }
            lastWordCharCount++;
        }
        
        currentText = stageText.slice(0, i) + '\u00A0'.repeat(lastWordCharCount);
    }
    
    if(!nomoretextDispatched && index == texts.length-1 && (now - startTime > duration || paused)) {
        nomoretextDispatched = true
        dispatch('nomoretext');
    }
    
    if(now - startTime > duration) {
        if(!paused) {
            paused = true;
            if(lastStage != stage) {
                lastStage = stage;
                const newIndex = Math.floor(stage / 2);
                if(newIndex == index) {
                    paused = true;
                } else {
                    paused = false;
                    index = newIndex;
                    startTime = now;
                }
            } else {
                stage++;
                lastStage = stage;
            }
            
        } else {
            if(lastStage != stage) {
                lastStage = stage;
                const newIndex = Math.floor(stage / 2);
                if(newIndex == index) {
                    paused = true;
                } else {
                    paused = false;
                    index = newIndex;
                    startTime = now;
                }
            }
        }
    } else {
        if(lastStage != stage) {
            lastStage = stage;
            const newIndex = Math.floor(stage / 2);
            if(newIndex == index) {
                paused = true;
            } else {
                paused = false;
                index = newIndex;
                startTime = now;
            }
        }
    }
    if(index >= texts.length) {
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