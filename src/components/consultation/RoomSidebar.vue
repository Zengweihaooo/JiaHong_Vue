<template>
  <aside class="room-sidebar" aria-label="问诊消息栏">
    <div class="room-sidebar__section room-sidebar__section--head">
      <div class="room-title-row">
        <h1>问诊室</h1>
        <div class="room-waiting">
          <span>待接诊</span>
          <strong data-waiting-total>{{ store.waitingQueue.total }}</strong>
        </div>
      </div>
    </div>
    <div class="room-sidebar__section room-sidebar__section--filters">
      <div class="room-tags room-tags--state">
        <button
          :class="['jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide', { 'is-active': store.messageFilterState === 'ongoing' }]"
          type="button"
          data-filter-state="ongoing"
          @click="store.setMessageFilter({ state: 'ongoing' })"
        >
          进行中
        </button>
        <button
          :class="['jh-btn jh-btn--md jh-btn--outline-secondary room-tag room-tag--wide', { 'is-active': store.messageFilterState === 'ended' }]"
          type="button"
          data-filter-state="ended"
          @click="store.setMessageFilter({ state: 'ended' })"
        >
          已结束
        </button>
      </div>
    </div>
    <div class="message-list" aria-label="会话列表" data-filter-type="all" :data-filter-state="store.messageFilterState">
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
          :data-record-id="record.id"
          :data-target-view="record.targetView || ''"
          :data-record-state="record.state"
          :data-badge-key="messageBadgeKey(record)"
          :data-video-locked="isVideoLocked(record) ? 'true' : undefined"
          :title="isVideoLocked(record) ? '当前视频问诊未结束，暂不可进入新的视频问诊' : undefined"
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
          <span v-else-if="showUnreadBadge(record)" class="message-item__badge">
            {{ unreadCountFor(record) }}
          </span>
        </button>
      </template>
      <el-empty v-if="!groupedRecords.length" description="暂无会话" :image-size="72" />
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { TypeIcon, assetUrl } from "@jiahong/ui";
import { getMessageBadgeKey } from "@/domain/messageBadges";
import { useAppStore } from "@/stores/app";
import { consultationTypeLabel } from "@/utils/format";

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const collapsedMessageGroups = ref(new Set());

const groupedRecords = computed(() =>
  store.messageList.map((record, index, list) => ({
    ...record,
    showGroup: store.messageFilterType === "all" && (!list[index - 1] || list[index - 1].type !== record.type)
  }))
);

function isCurrentVideo(record) {
  return record.type === "video" && record.state === "ongoing" && (store.activeVideoRecordId === record.id || (!store.activeVideoRecordId && store.activeRecordId === record.id));
}

function isCompact(record) {
  return record.type === "video" && store.activeRecordId !== record.id && !isCurrentVideo(record);
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
      "is-current-video": isCurrentVideo(record),
      "is-video-locked": isVideoLocked(record)
    }
  ];
}

function messageBadgeKey(record) {
  return getMessageBadgeKey(record?.id);
}

function unreadCountFor(record) {
  return Number(record?.unreadCount ?? record?.badge ?? 0);
}

function showUnreadBadge(record) {
  return unreadCountFor(record) > 0 && !store.isMessageBadgeDismissed(record.id);
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
  if (!store.setActiveRecord(record.id)) return;
  const targetPath = record.state === "ended" ? "/room/" : record.type === "video" || record.targetView === "video" ? "/video/" : "/text/";
  const query = record.state === "ended" ? { sessionId: record.id } : { sessionId: record.id };
  if (route.path === targetPath && route.query.sessionId === record.id) return;
  router.push({ path: targetPath, query });
}
</script>
