<template>
  <section v-if="voucher" :class="['followup-voucher-card', `followup-voucher-card--${voucher.type}`]" aria-label="复诊凭证">
    <h3>复诊凭证</h3>
    <div v-if="voucher.voices.length" class="followup-voucher-row">
      <span class="followup-voucher-label">语音凭证：</span>
      <div class="followup-voucher-voices">
        <button
          v-for="(voice, index) in voucher.voices"
          :key="voice.title"
          class="followup-voucher-voice"
          type="button"
          :aria-label="`查看${voice.title || `语音凭证${index + 1}`}，${voice.duration}秒`"
          @click="activeVoice = voice"
        >
          <span class="followup-voice-wave" aria-hidden="true">
            <span v-for="(height, waveIndex) in voiceWaveHeights" :key="waveIndex" :style="{ '--wave-height': `${height}px` }"></span>
          </span>
          <span>{{ voice.duration }}”</span>
        </button>
      </div>
    </div>
    <div v-if="voucher.voices.length && voucher.images.length" class="followup-voucher-divider" aria-hidden="true"></div>
    <div v-if="voucher.images.length" class="followup-voucher-row">
      <span class="followup-voucher-label">图片凭证：</span>
      <div class="followup-voucher-images">
        <button
          v-for="(image, index) in voucher.images"
          :key="image.title"
          class="followup-voucher-image consult-attachment"
          type="button"
          :aria-label="`预览${image.title}`"
          @click="emit('preview-image', { image, index, images: voucher.images })"
        >
          <span class="followup-voucher-image__thumb">
            <img :src="image.image" :alt="image.title" loading="lazy" />
          </span>
        </button>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div
      :class="['followup-voice-overlay', { 'is-open': Boolean(activeVoice) }]"
      role="dialog"
      aria-modal="true"
      :aria-hidden="!activeVoice"
      @click.self="activeVoice = null"
    >
      <div class="followup-voice-dialog">
        <div class="followup-voice-dialog__header">
          <h2>
            <span class="consult-attachment-dialog__icon" aria-hidden="true"></span>
            <span>{{ activeVoice?.title || "语音凭证" }}</span>
          </h2>
          <button class="followup-voice-dialog__close" type="button" aria-label="关闭语音凭证" @click="activeVoice = null"></button>
        </div>
        <div class="followup-voice-dialog__body">
          <button class="followup-voice-dialog__play" type="button" aria-label="播放语音凭证"></button>
          <span class="followup-voice-wave" aria-hidden="true">
            <span v-for="(height, waveIndex) in voiceWaveHeights" :key="waveIndex" :style="{ '--wave-height': `${height}px` }"></span>
          </span>
          <span class="followup-voice-dialog__duration">{{ activeVoice?.duration || 8 }}”</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from "vue";
import { assetUrl } from "../../utils/assets";

const props = defineProps({
  record: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["preview-image"]);
const activeVoice = ref(null);
const voucherVariants = ["image", "voice", "mixed"];
const defaultImages = [
  { title: "图片凭证1", image: "assets/consult-materials/allergic-rhinitis.png" },
  { title: "图片凭证2", image: "assets/consult-materials/pediatric-fever.png" },
  { title: "图片凭证3", image: "assets/consult-materials/sore-throat.png" },
  { title: "图片凭证4", image: "assets/consult-materials/skin-rash.png" }
];
const defaultVoices = [
  { title: "语音凭证1", duration: 8 },
  { title: "语音凭证2", duration: 7 }
];
const voiceWaveHeights = [12, 18, 10, 20, 14, 8, 8, 6, 4, 10, 14, 14, 12, 10, 10, 8];

function getStableVariantIndex(value = "") {
  return Array.from(String(value || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % voucherVariants.length;
}

const voucher = computed(() => {
  const record = props.record || {};
  if (record.type !== "text" && record.type !== "video") return null;
  const explicitType = record.followUpVoucher?.type;
  const type = voucherVariants.includes(explicitType)
    ? explicitType
    : voucherVariants[getStableVariantIndex(record.id || record.title || record.type)];
  const images = record.followUpVoucher?.images?.length ? record.followUpVoucher.images : defaultImages;
  const voices = record.followUpVoucher?.voices?.length ? record.followUpVoucher.voices : defaultVoices;
  return {
    type,
    images: (type === "voice" ? [] : images.slice(0, 4)).map((image, index) => ({
      title: image.title || `图片凭证${index + 1}`,
      image: assetUrl(image.image || "assets/figma-consult/attachment-preview.png")
    })),
    voices: (type === "image" ? [] : voices.slice(0, 2)).map((voice, index) => ({
      title: voice.title || `语音凭证${index + 1}`,
      duration: Number(voice.duration || 0) || (index === 0 ? 8 : 7)
    }))
  };
});
</script>
