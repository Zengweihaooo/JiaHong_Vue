<template>
  <span :class="['jh-status-badge', `jh-status-badge--${safeStatus}`]">{{ doctorStatusLabel(safeStatus) }}</span>
</template>

<script setup>
import { computed } from "vue";
import { doctorStatusLabel } from "@/utils/format";

const props = defineProps({
  status: {
    type: String,
    default: "offline"
  }
});

const safeStatus = computed(() => (["online", "busy", "offline"].includes(props.status) ? props.status : "offline"));
</script>
