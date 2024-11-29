<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-4">静谧空间</h1>
      <p class="text-lg text-center text-gray-300 mb-8">为您的冥想、放松和睡眠创造完美声境</p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <!-- 白噪声控制 -->
        <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 active:scale-98 active:bg-white/25 cursor-pointer" :class="{ 'bg-white/20 shadow-lg shadow-white/10': isPlaying.white }" @click="toggleSound('white')">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">白噪声</h2>
            <div class="text-sm text-gray-300">{{ Math.round(volumes.white * 100) }}%</div>
          </div>
          <div class="space-y-2 mb-6 text-gray-300">
            <p>特点：所有频率功率均匀分布</p>
            <p>声音：沙沙声，类似电视无信号噪声</p>
            <p>用途：助眠、音频测试、背景噪声</p>
          </div>
          <div @click.stop>
            <input type="range" min="0" max="1" step="0.01" v-model="volumes.white" @input="updateVolume('white')" class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
        </div>

        <!-- 粉红噪声控制 -->
        <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 active:scale-98 active:bg-white/25 cursor-pointer" :class="{ 'bg-white/20 shadow-lg shadow-white/10': isPlaying.pink }" @click="toggleSound('pink')">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">粉噪声</h2>
            <div class="text-sm text-gray-300">{{ Math.round(volumes.pink * 100) }}%</div>
          </div>
          <div class="space-y-2 mb-6 text-gray-300">
            <p>特点：每倍频程内能量相同，低频成分强</p>
            <p>声音：更温暖的沙沙声，较低沉</p>
            <p>用途：助眠、音响调试、环境噪声</p>
          </div>
          <div @click.stop>
            <input type="range" min="0" max="1" step="0.01" v-model="volumes.pink" @input="updateVolume('pink')" class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
        </div>

        <!-- 棕噪声控制 -->
        <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 active:scale-98 active:bg-white/25 cursor-pointer" :class="{ 'bg-white/20 shadow-lg shadow-white/10': isPlaying.brown }" @click="toggleSound('brown')">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">棕噪声</h2>
            <div class="text-sm text-gray-300">{{ Math.round(volumes.brown * 100) }}%</div>
          </div>
          <div class="space-y-2 mb-6 text-gray-300">
            <p>特点：频率越低，能量越强，每倍频程衰减6dB</p>
            <p>声音：低沉的轰鸣，类似瀑布声</p>
            <p>用途：助眠、放松、掩盖低频噪声</p>
          </div>
          <div @click.stop>
            <input type="range" min="0" max="1" step="0.01" v-model="volumes.brown" @input="updateVolume('brown')" class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
        </div>

        <!-- 双耳节拍控制 -->
        <div class="bg-white/10 rounded-xl p-6 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 active:scale-98 active:bg-white/25 cursor-pointer" :class="{ 'bg-white/20 shadow-lg shadow-white/10': isPlaying.binaural }" @click="toggleSound('binaural')">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">双耳节拍</h2>
            <div class="text-sm text-gray-300">{{ Math.round(volumes.binaural * 100) }}%</div>
          </div>
          <div class="space-y-2 mb-6 text-gray-300">
            <p>当前频率：{{ binauralFrequency }}Hz ({{ brainwaves[selectedWave].name }})</p>
            <p>{{ brainwaves[selectedWave].description }}</p>
            <p>频率范围：{{ brainwaves[selectedWave].range }}</p>
          </div>
          <div class="flex flex-wrap gap-2 mb-4" @click.stop>
            <button v-for="(wave, key) in brainwaves" :key="key" @click="updateBinauralWave(key)" class="px-3 py-1.5 bg-white/10 rounded-full text-sm transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95" :class="{ 'bg-white/30 shadow-md shadow-white/10 scale-105': selectedWave === key }">
              {{ wave.name }}
            </button>
          </div>
          <div @click.stop>
            <input type="range" min="0" max="1" step="0.01" v-model="volumes.binaural" @input="updateVolume('binaural')" class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { WhiteNoise, PinkNoise, BrownNoise, BinauralTone } from "./noises.js";

// 音频上下文和节点的状态管理
const audioContext = ref(null);
const noiseGenerators = ref({
  white: null,
  pink: null,
  brown: null,
  binaural: null,
});

// 音量和开关状态管理
const volumes = ref({
  white: 0.5,
  pink: 0.5,
  brown: 0.5,
  binaural: 0.5,
});

const isPlaying = ref({
  white: false,
  pink: false,
  brown: false,
  binaural: false,
});

// 双耳节拍频率设置
const binauralFrequency = ref(7); // 默认 7Hz (Alpha 波段)
const selectedWave = ref("alpha"); // 默认选择 Alpha 波段

// 脑波频段定义
const brainwaves = {
  delta: {
    name: "Delta",
    freq: 2,
    description: "深度睡眠和恢复",
    range: "1-4 Hz",
  },
  theta: {
    name: "Theta",
    freq: 6,
    description: "深度冥想和创造力",
    range: "4-8 Hz",
  },
  alpha: {
    name: "Alpha",
    freq: 10,
    description: "放松和平静专注",
    range: "8-13 Hz",
  },
  beta: {
    name: "Beta",
    freq: 20,
    description: "集中注意力和警觉",
    range: "13-30 Hz",
  },
  gamma: {
    name: "Gamma",
    freq: 35,
    description: "高级认知和学习",
    range: "30+ Hz",
  },
};

// 初始化音频系统
const initAudioSystem = () => {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();

    // 创建所有噪声生成器
    noiseGenerators.value = {
      white: new WhiteNoise(),
      pink: new PinkNoise(),
      brown: new BrownNoise(),
      binaural: new BinauralTone(audioContext.value),
    };

    // 预设音量
    Object.keys(noiseGenerators.value).forEach(type => {
      noiseGenerators.value[type].setVolume(volumes.value[type]);
    });
  }
};

// 控制声音的播放/停止
const toggleSound = type => {
  // 确保音频系统已初始化
  if (!audioContext.value) {
    initAudioSystem();
  }

  if (isPlaying.value[type]) {
    noiseGenerators.value[type].stop();
    isPlaying.value[type] = false;
  } else {
    noiseGenerators.value[type].setVolume(volumes.value[type]);
    noiseGenerators.value[type].start();
    isPlaying.value[type] = true;
  }
};

// 更新音量
const updateVolume = type => {
  if (noiseGenerators.value[type] && noiseGenerators.value[type].playing) {
    noiseGenerators.value[type].setVolume(volumes.value[type]);
  }
};

// 更新双耳节拍频率
const updateBinauralWave = wave => {
  selectedWave.value = wave;
  binauralFrequency.value = brainwaves[wave].freq;
  if (noiseGenerators.value.binaural && noiseGenerators.value.binaural.playing) {
    noiseGenerators.value.binaural.setFrequency(440, binauralFrequency.value);
  }
};

// 在组件卸载时清理资源
onUnmounted(() => {
  Object.values(noiseGenerators.value).forEach(generator => {
    if (generator && generator.playing) {
      generator.stop();
    }
  });
  if (audioContext.value) {
    audioContext.value.close();
  }
});
</script>

<style>
/* Custom styles for range input */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  @apply w-4 h-4 bg-white rounded-full cursor-pointer transition-all duration-300;
}

input[type="range"]::-webkit-slider-thumb:hover {
  @apply bg-opacity-90 transform scale-110;
}

input[type="range"]:focus {
  @apply outline-none;
}

@media (max-width: 768px) {
  .grid {
    @apply grid-cols-1;
  }
}
</style>
