function typewriter(node, { charTime = 50 }) {
    // console.log('in ' + node.textContent);
    const valid = (
        node.childNodes.length === 1 &&
        node.childNodes[0].nodeType === 3
    );

    // if (!valid) {
    //     throw new Error(`This transition only works on elements with a single text node child`);
    // }

    const text = node.textContent;
    const duration = text.length * charTime;

    return {
        duration,
        tick: t => {
            const i = ~~(text.length * t);
            if(i == 0) {
                node.textContent = ".";
            } else {
                node.textContent = text.slice(0, i);
            }
            
        }
    };
}

module.exports = {
    typewriter,
}