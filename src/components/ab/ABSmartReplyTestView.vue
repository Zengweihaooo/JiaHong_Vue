<template>
  <ConsultRoomView mode="text" :smart-reply-variant="variant" use-back-action @back="$emit('back')" />
  <nav class="ab-smart-reply-test-nav" aria-label="AB 测试页面切换">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      :disabled="variant === option.key"
      @click="$emit('switch-variant', option.key)"
    >
      去 {{ option.label }} 页面
    </button>
    <button type="button" @click="$emit('back')">返回首页</button>
  </nav>
</template>

<script setup>
import ConsultRoomView from "@/views/ConsultRoomView.vue";

defineProps({
  variant: {
    type: String,
    default: "a",
    validator: (value) => ["a", "b", "c"].includes(value)
  }
});

defineEmits(["back", "switch-variant"]);

const options = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  { key: "c", label: "C" }
];
</script>

<style scoped>
.ab-smart-reply-test-nav {
  position: fixed;
  right: 32px;
  bottom: 28px;
  z-index: 60;
  display: inline-flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid #e5e8eb;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: var(--jh-shadow-soft);
}

.ab-smart-reply-test-nav button {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #cfe3ff;
  border-radius: 999px;
  background: #ffffff;
  color: var(--jh-blue);
  cursor: pointer;
}

.ab-smart-reply-test-nav button:disabled {
  border-color: #d8dde1;
  background: #f2f3f4;
  color: #99a1af;
  cursor: not-allowed;
}
</style>
