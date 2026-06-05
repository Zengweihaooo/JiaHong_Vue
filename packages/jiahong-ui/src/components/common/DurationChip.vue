<template>
  <span
    :class="['jh-duration-chip', `jh-duration-chip--${variant}`, `jh-duration-chip--${durationTone(seconds)}`]"
    :aria-label="`问诊持续时长：${formatDuration(seconds)}`"
  >
    <el-icon v-if="variant === 'icon'" class="jh-duration-chip__clock"><Clock /></el-icon>
    <strong>
      <span class="jh-duration-chip__prefix">问诊持续时长：</span>
      <span class="jh-duration-chip__value">{{ formatDuration(seconds) }}</span>
    </strong>
  </span>
</template>

<script setup>
import { Clock } from "@element-plus/icons-vue";
import { durationTone, formatDuration } from "../../utils/format";

defineProps({
  seconds: {
    type: Number,
    default: 0
  },
  variant: {
    type: String,
    default: "icon"
  }
});
</script>
