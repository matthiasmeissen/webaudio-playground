// Set to > 0 if the DSP is polyphonic
const FAUST_DSP_VOICES = 0;

(async () => {
    const { createFaustNode } = await import("./create-node.js");

    // Create audio context
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioCtx({ latencyHint: 0.00001 });
    audioContext.suspend();

    // Create audio context activation button
    /** @type {HTMLButtonElement} */
    const $buttonDsp = document.getElementById("button-dsp");

    const play = (node) => {
        node.keyOn(0, 60, 100);
        setTimeout(() => node.keyOn(0, 64, 100), 1000);
        setTimeout(() => node.keyOn(0, 67, 100), 2000);
        setTimeout(() => node.allNotesOff(), 5000);
        setTimeout(() => play(node), 7000);
    }
    // Function to activate audio context
    $buttonDsp.disabled = true;
    $buttonDsp.onclick = async () => {
        if (audioContext.state === "running") {
            $buttonDsp.textContent = "Suspended";
            await audioContext.suspend();
        } else if (audioContext.state === "suspended") {
            $buttonDsp.textContent = "Running";
            await audioContext.resume();
            if (FAUST_DSP_VOICES) play(faustNode);
        }
    }

    // Create Faust node
    const { faustNode, dspMeta: { name } } = await createFaustNode(audioContext, "sound", FAUST_DSP_VOICES);
    if (!faustNode) throw new Error("Faust DSP not compiled");

    // Connect the Faust node to the audio output
    faustNode.connect(audioContext.destination);

    // Connect the Faust node to the audio input
    if (faustNode.getNumInputs() > 0) {
        const { connectToAudioInput } = await import("./create-node.js");
        await connectToAudioInput(audioContext, null, faustNode, null);
    }

    let $mouseX = 0.5;
    let $mouseY = 0.5;

    document.addEventListener("mousemove", (e) => {
        $mouseX = e.clientX / window.innerWidth;
        $mouseY = e.clientY / window.innerHeight;

        const cut = (mapNormalizedToRange($mouseX, 200, 2400)).toFixed(2);
        const freq = (mapNormalizedToRange($mouseY, 40, 160)).toFixed(2);

        faustNode.setParamValue("/sound/Cutoff", cut);
        faustNode.setParamValue("/sound/Frequency", freq);
    });

    // Create Faust node activation button
    $buttonDsp.disabled = false;
})();

function mapNormalizedToRange(normalizedValue, min, max) {
    return min + normalizedValue * (max - min);
}

