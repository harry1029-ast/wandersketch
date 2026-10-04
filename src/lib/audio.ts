import * as Tone from 'tone';

let soundSynth: Tone.PolySynth | null = null;

export function playChime(type: 'tap' | 'stamp' | 'bell' = 'tap') {
    try {
        if (!soundSynth && typeof window !== 'undefined') {
            soundSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 },
            }).toDestination();
            soundSynth.volume.value = -18;
        }
        if (Tone.context && Tone.context.state !== 'running') {
            Tone.start();
        }
        if (!soundSynth) return;

        if (type === 'tap') soundSynth.triggerAttackRelease('C5', '0.08');
        else if (type === 'stamp') soundSynth.triggerAttackRelease(['G4', 'E5'], '0.15');
        else if (type === 'bell') soundSynth.triggerAttackRelease(['E5', 'B5', 'E6'], '0.25');
    } catch {
        // Graceful fallback if audio context is blocked
    }
}

export function playVoiceNarrator(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}