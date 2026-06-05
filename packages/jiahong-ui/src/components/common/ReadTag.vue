<template>
  <span :class="['jh-read-tag', `jh-read-tag--${status}`]">{{ label }}</span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    default: "unread"
  },
  text: {
    type: String,
    default: ""
  }
});

const label = computed(() => props.text || (props.status === "read" ? "已读" : "未读"));
</script>
