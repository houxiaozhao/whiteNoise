/* exported WhiteNoise, PinkNoise, BrownNoise, BinauralTone */
'use strict';

let audioContext;

/**
 * Base class representing a Noise Generator.
 */
class Noise {
    /**
     * Create a noise generator.
     * @param {string} type - The type of noise to generate.
     */
    constructor(type) {
        this._type = type;
        this._volume = 0.5;
        this._playing = false;
    }

    /**
     * Gets the type of noise being generated.
     * @return {string} The type of noise.
     */
    get type() {
        return this._type;
    }

    /**
     * Gets the current volume.
     * @return {number} The current volume.
     */
    get volume() {
        return this._volume;
    }

    /**
     * Gets the playing status.
     * @return {boolean} True if playing.
     */
    get playing() {
        return this._playing;
    }

    /**
     * Sets the volume of the noise generator.
     * @param {number} volume - The volume to set.
     */
    setVolume(volume) {
        this._volume = volume;
    }

    /**
     * Creates the audio context and sets up the appropriate nodes.
     */
    _setup() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this._audioContext = audioContext;
        this._gainNode = this._audioContext.createGain();
        this._gainNode.gain.value = this._volume;
        this._noiseGenerator = this._getGenerator();
        if (this._noiseGenerator) {
            this._noiseGenerator.connect(this._gainNode);
            this._gainNode.connect(this._audioContext.destination);
        }
    }

    /**
     * Gets buffer size from query string.
     * @private
     * @return {Number}
     */
    _getBufferSize() {
        return 4096;
    }

    /**
     * Create & return the noise generator.
     * @private
     * @abstract
     */
    _getGenerator() {
        throw new Error('not implemented');
    }

    /**
     * Add a gain filter to the current node.
     * @private
     * @param {AudioNode} noise - The web audio node to apply the gain to.
     * @param {number} gainValue - Amount (float) of gain to add.
     * @return {AudioNode} - Node after the gain has been applied.
     */
    _addGain(noise, gainValue) {
        if (gainValue === 1.0) {
            return noise;
        }
        const gainNode = this._audioContext.createGain();
        gainNode.gain.value = gainValue;
        noise.connect(gainNode);
        return gainNode;
    }

    /**
     * Toggles the noise generator play status.
     * @return {boolean} Playing status.
     */
    toggle() {
        if (this.playing) {
            return this.stop();
        }
        return this.start();
    }

    /**
     * Starts the noise generator.
     * @return {boolean} Playing status.
     */
    start() {
        if (!this._playing) {
            this._setup();
            this._playing = true;
            if (this._startSound) {
                this._startSound();
            }
        }
    }

    /**
     * Stops the noise generator.
     * @return {boolean} Playing status.
     */
    stop() {
        if (this._playing) {
            if (this._stopSound) {
                this._stopSound();
            }
            if (this._gainNode) {
                this._gainNode.disconnect();
            }
            if (this._noiseGenerator) {
                this._noiseGenerator.disconnect();
            }
            this._playing = false;
            this._gainNode = null;
            this._noiseGenerator = null;
        }
    }
}

/**
 * Class representing a White Noise Generator.
 * @extends Noise
 */
class WhiteNoise extends Noise {
    /**
     * Create a White Noise object.
     */
    constructor() {
        super('WhiteNoise');
    }

    /**
     * Creates the web audio node.
     * @override
     * @return {ScriptProcessorNode} The newly created node.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
     */
    _getGenerator() {
        const bufferSize = this._getBufferSize();
        const node = this._audioContext.createScriptProcessor(bufferSize, 0, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        };
        return node;
    }
}

/**
 * Class representing a Pink Noise Generator.
 * @extends Noise
 */
class PinkNoise extends Noise {
    /**
     * Create a Pink Noise object.
     */
    constructor() {
        super('PinkNoise');
    }

    /**
     * Creates the web audio node.
     * @override
     * @return {ScriptProcessorNode} The newly created node.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
     */
    _getGenerator() {
        const bufferSize = this._getBufferSize();
        const node = this._audioContext.createScriptProcessor(bufferSize, 0, 1);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }
        };
        return node;
    }
}

/**
 * Class representing a Brown Noise Generator.
 * @extends Noise
 */
class BrownNoise extends Noise {
    /**
     * Create a Brown Noise object.
     */
    constructor() {
        super('BrownNoise');
    }

    /**
     * Creates the web audio node.
     * @override
     * @return {AudioNode} The newly created node.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
     */
    _getGenerator() {
        const bufferSize = this._getBufferSize();
        const node = this._audioContext.createScriptProcessor(bufferSize, 0, 1);
        let lastOut = 0;

        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                output[i] = lastOut * 3.5;
            }
        };
        return node;
    }
}

/**
 * Class representing a Binaural Tone Generator.
 */
class BinauralTone {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.playing = false;
        this.volume = 0.5;

        // 创建左右声道振荡器
        this.leftOscillator = null;
        this.rightOscillator = null;
        this.gainNode = null;

        // 默认频率设置
        this.baseFrequency = 440; // 基础频率
        this.beatFrequency = 7;   // 默认 Alpha 波段
    }

    start() {
        if (this.playing) return;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;

        // 创建并配置左声道振荡器
        this.leftOscillator = this.audioContext.createOscillator();
        this.leftOscillator.type = 'sine';
        this.leftOscillator.frequency.value = this.baseFrequency;

        // 创建并配置右声道振荡器
        this.rightOscillator = this.audioContext.createOscillator();
        this.rightOscillator.type = 'sine';
        this.rightOscillator.frequency.value = this.baseFrequency + this.beatFrequency;

        // 创建声相节点
        this.leftPanner = this.audioContext.createStereoPanner();
        this.rightPanner = this.audioContext.createStereoPanner();
        this.leftPanner.pan.value = -1;  // 完全左声道
        this.rightPanner.pan.value = 1;   // 完全右声道

        // 连接节点
        this.leftOscillator.connect(this.leftPanner);
        this.rightOscillator.connect(this.rightPanner);
        this.leftPanner.connect(this.gainNode);
        this.rightPanner.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        // 启动振荡器
        this.leftOscillator.start();
        this.rightOscillator.start();
        this.playing = true;
    }

    stop() {
        if (!this.playing) return;

        // 停止并断开所有节点
        this.leftOscillator.stop();
        this.rightOscillator.stop();
        this.leftOscillator.disconnect();
        this.rightOscillator.disconnect();
        this.leftPanner.disconnect();
        this.rightPanner.disconnect();
        this.gainNode.disconnect();

        this.leftOscillator = null;
        this.rightOscillator = null;
        this.leftPanner = null;
        this.rightPanner = null;
        this.gainNode = null;
        this.playing = false;
    }

    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    setFrequency(baseFreq, beatFreq) {
        this.baseFrequency = baseFreq;
        this.beatFrequency = beatFreq;

        if (this.playing) {
            this.leftOscillator.frequency.value = this.baseFrequency;
            this.rightOscillator.frequency.value = this.baseFrequency + this.beatFrequency;
        }
    }
}

export { WhiteNoise, PinkNoise, BrownNoise, BinauralTone };