<template>
  <span class="message-item__icon" aria-hidden="true">
    <img :src="iconSrc" alt="" />
  </span>
</template>

<script setup>
import { computed } from "vue";
import { assetUrl } from "../../utils/assets";

const props = defineProps({
  type: {
    type: String,
    default: "consult"
  }
});

const iconSrc = computed(() => {
  const icons = {
    video: "assets/figma-room/video-consult.svg",
    text: "assets/figma-room/text-consult.svg",
    consult: "assets/figma-room/consult.svg"
  };
  return assetUrl(icons[props.type] || icons.consult);
});
</script>
