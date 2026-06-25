<template>
  <ConsultRoomView mode="text" :tag-variant="variant" use-back-action @back="$emit('back')" />
  <nav class="ab-tag-test-nav" aria-label="AB 测试页面切换">
    <button type="button" :disabled="variant === 'a'" @click="$emit('switch-variant', 'a')">去 A 页面</button>
    <button type="button" :disabled="variant === 'b'" @click="$emit('switch-variant', 'b')">去 B 页面</button>
    <button type="button" @click="$emit('back')">返回首页</button>
  </nav>
</template>

<script setup>
import ConsultRoomView from "@/views/ConsultRoomView.vue";

defineProps({
  variant: {
    type: String,
    default: "a",
    validator: (value) => ["a", "b"].includes(value)
  }
});

defineEmits(["back", "switch-variant"]);
</script>

<style scoped>
.ab-tag-test-nav {
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

.ab-tag-test-nav button {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #cfe3ff;
  border-radius: 999px;
  background: #ffffff;
  color: var(--jh-blue);
  cursor: pointer;
}

.ab-tag-test-nav button:disabled {
  border-color: #d8dde1;
  background: #f2f3f4;
  color: #99a1af;
  cursor: not-allowed;
}
</style>
