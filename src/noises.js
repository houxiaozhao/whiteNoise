/* exported WhiteNoise, PinkNoise, BrownNoise, BinauralTone */
'use strict';

// AudioWorklet 处理器代码
const workletCode = `
// 白噪声处理器
class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}

// 粉红噪声处理器
class PinkNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.b0 = 0; this.b1 = 0; this.b2 = 0; this.b3 = 0; this.b4 = 0; this.b5 = 0; this.b6 = 0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        
        this.b0 = 0.99886 * this.b0 + white * 0.0555179;
        this.b1 = 0.99332 * this.b1 + white * 0.0750759;
        this.b2 = 0.96900 * this.b2 + white * 0.1538520;
        this.b3 = 0.86650 * this.b3 + white * 0.3104856;
        this.b4 = 0.55000 * this.b4 + white * 0.5329522;
        this.b5 = -0.7616 * this.b5 - white * 0.0168980;
        
        outputChannel[i] = (this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362) * 0.11;
        this.b6 = white * 0.115926;
      }
    }
    return true;
  }
}

// 棕噪声处理器
class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastOut = 0.0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        const white = Math.random() * 2 - 1;
        this.lastOut = (this.lastOut + (0.02 * white)) / 1.02;
        outputChannel[i] = this.lastOut * 3.5;
      }
    }
    return true;
  }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor);
registerProcessor('pink-noise-processor', PinkNoiseProcessor);
registerProcessor('brown-noise-processor', BrownNoiseProcessor);
`;

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
        this._audioContext = null;
        this._gainNode = null;
        this._noiseNode = null;
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
        if (this._gainNode) {
            this._gainNode.gain.setValueAtTime(volume, this._audioContext.currentTime);
        }
    }

    /**
     * Creates the audio context and sets up the appropriate nodes.
     */
    async _setup() {
        if (!this._audioContext) {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // 创建 Blob URL 并加载 worklet
                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                await audioContext.audioWorklet.addModule(url);
                URL.revokeObjectURL(url);
            }
            this._audioContext = audioContext;
            this._gainNode = this._audioContext.createGain();
            this._gainNode.gain.value = this._volume;
            this._noiseNode = await this._getGenerator();
            if (this._noiseNode) {
                this._noiseNode.connect(this._gainNode);
                this._gainNode.connect(this._audioContext.destination);
            }
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
    async _getGenerator() {
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
    async start() {
        if (!this._playing) {
            await this._setup();
            // 如果 AudioContext 被暂停，则恢复
            if (this._audioContext.state === 'suspended') {
                this._audioContext.resume();
            }
            this._playing = true;
        }
        return this._playing;
    }

    /**
     * Stops the noise generator.
     * @return {boolean} Playing status.
     */
    stop() {
        if (this._playing) {
            this._noiseNode?.disconnect();
            this._noiseNode = null;
            this._playing = false;
        }
        return this._playing;
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
     * @return {AudioWorkletNode} The newly created node.
     */
    async _getGenerator() {
        return new AudioWorkletNode(this._audioContext, 'white-noise-processor');
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
     * @return {AudioWorkletNode} The newly created node.
     */
    async _getGenerator() {
        return new AudioWorkletNode(this._audioContext, 'pink-noise-processor');
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
     * @return {AudioWorkletNode} The newly created node.
     */
    async _getGenerator() {
        return new AudioWorkletNode(this._audioContext, 'brown-noise-processor');
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
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        this.gainNode.connect(this.audioContext.destination);

        // 默认频率设置
        this.baseFrequency = 440; // 基础频率
        this.beatFrequency = 7;   // 默认 Alpha 波段
    }

    start() {
        if (!this.playing) {
            // 创建并配置左声道振荡器
            this.leftOscillator = this.audioContext.createOscillator();
            this.leftOscillator.type = 'sine';
            this.leftOscillator.frequency.value = this.baseFrequency;

            // 创建并配置右声道振荡器
            this.rightOscillator = this.audioContext.createOscillator();
            this.rightOscillator.type = 'sine';
            this.rightOscillator.frequency.value = this.baseFrequency + this.beatFrequency;

            // 创建声道合并器
            const merger = this.audioContext.createChannelMerger(2);

            // 连接左声道
            this.leftOscillator.connect(merger, 0, 0);
            // 连接右声道
            this.rightOscillator.connect(merger, 0, 1);

            // 连接到增益节点
            merger.connect(this.gainNode);

            // 开始播放
            this.leftOscillator.start();
            this.rightOscillator.start();
            this.playing = true;
        }
    }

    stop() {
        if (this.playing) {
            this.leftOscillator.stop();
            this.rightOscillator.stop();
            this.leftOscillator.disconnect();
            this.rightOscillator.disconnect();
            this.leftOscillator = null;
            this.rightOscillator = null;
            this.playing = false;
        }
    }

    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
        }
    }

    setFrequency(baseFreq, beatFreq) {
        this.baseFrequency = baseFreq;
        this.beatFrequency = beatFreq;

        if (this.playing) {
            this.leftOscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
            this.rightOscillator.frequency.setValueAtTime(baseFreq + beatFreq, this.audioContext.currentTime);
        }
    }
}

export { WhiteNoise, PinkNoise, BrownNoise, BinauralTone };