<template>
  <aside class="room-sidebar" aria-label="问诊消息栏">
    <div class="room-sidebar__section room-sidebar__section--head">
      <div class="room-title-row">
        <h1>问诊室</h1>
        <div class="room-waiting">
          <span>待接诊</span>
          <strong>{{ store.waitingQueue.total }}</strong>
        </div>
      </div>
    </div>
    <div class="room-sidebar__section room-sidebar__section--filters">
      <div class="room-tags room-tags--state">
        <button
          :class="['jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide', { 'is-active': store.messageFilterState === 'ongoing' }]"
          type="button"
          @click="store.setMessageFilter({ state: 'ongoing' })"
        >
          进行中
        </button>
        <button
          :class="['jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide', { 'is-active': store.messageFilterState === 'ended' }]"
          type="button"
          @click="store.setMessageFilter({ state: 'ended' })"
        >
          已结束
        </button>
      </div>
    </div>
    <div class="message-list" aria-label="会话列表">
      <template v-for="(record, index) in groupedRecords" :key="record.id">
        <button
          v-if="record.showGroup"
          :class="['message-group-label message-group-toggle', { 'is-collapsed': isGroupCollapsed(record.type) }]"
          type="button"
          :data-message-group="record.type"
          data-no-drag-scroll="true"
          :aria-expanded="String(!isGroupCollapsed(record.type))"
          @click.prevent.stop="toggleMessageGroup(record.type)"
        >
          <span>{{ consultationTypeLabel(record.type) }}</span>
          <img :src="assetUrl('assets/figma-room/group-chevron.svg')" alt="" aria-hidden="true" />
        </button>
        <button
          :class="messageItemClass(record)"
          type="button"
          :hidden="isGroupCollapsed(record.type)"
          :aria-disabled="isVideoLocked(record)"
          @click="openRecord(record)"
        >
          <span class="message-item__stripe" aria-hidden="true"></span>
          <TypeIcon :type="record.type" />
          <span class="message-item__body">
            <span class="message-item__title">{{ record.title }}</span>
            <span v-if="!isCompact(record)" class="message-item__preview">{{ record.preview }}</span>
            <span v-if="isVideoLocked(record) && !isCompact(record)" class="message-item__lock-hint">请先结束当前视频问诊</span>
          </span>
          <span v-if="isCurrentVideo(record)" class="message-item__current" aria-label="当前视频问诊进行中">
            <img :src="assetUrl('assets/figma-room/current-video-indicator.svg')" alt="" />
          </span>
          <span v-else-if="Number(record.unreadCount ?? record.badge ?? 0) > 0" class="message-item__badge">
            {{ record.unreadCount ?? record.badge }}
          </span>
        </button>
      </template>
      <el-empty v-if="!groupedRecords.length" description="暂无会话" :image-size="72" />
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from "vue";
import TypeIcon from "@/components/common/TypeIcon.vue";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";
import { consultationTypeLabel } from "@/utils/format";

const store = useAppStore();
const collapsedMessageGroups = ref(new Set());

const groupedRecords = computed(() =>
  store.messageList.map((record, index, list) => ({
    ...record,
    showGroup: store.messageFilterType === "all" && (!list[index - 1] || list[index - 1].type !== record.type)
  }))
);

function isCurrentVideo(record) {
  return record.type === "video" && store.activeRecordId === record.id;
}

function isCompact(record) {
  return record.type === "video" && store.activeRecordId !== record.id;
}

function isVideoLocked(record) {
  return (
    record.type === "video" &&
    record.state === "ongoing" &&
    store.activeVideoRecordId &&
    store.activeVideoRecordId !== record.id
  );
}

function messageItemClass(record) {
  return [
    "message-item",
    `message-item--${record.type}`,
    {
      "message-item--compact": isCompact(record),
      "is-active": store.activeRecordId === record.id,
      "is-video-locked": isVideoLocked(record)
    }
  ];
}

function isGroupCollapsed(type) {
  return collapsedMessageGroups.value.has(type);
}

function toggleMessageGroup(type) {
  const nextGroups = new Set(collapsedMessageGroups.value);
  if (nextGroups.has(type)) {
    nextGroups.delete(type);
  } else {
    nextGroups.add(type);
  }
  collapsedMessageGroups.value = nextGroups;
}

function openRecord(record) {
  store.setActiveRecord(record.id);
}
</script>
