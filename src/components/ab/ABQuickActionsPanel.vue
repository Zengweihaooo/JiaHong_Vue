<template>
  <section
    :class="[
      'card quick-entry-card',
      {
        'is-editing': editing,
        'quick-entry-card--handle-drag': dragMode === 'handle',
        'quick-entry-card--card-drag': dragMode === 'card'
      }
    ]"
    :aria-label="ariaLabel"
  >
    <div class="quick-entry-card__header">
      <h2 class="card__title">{{ title }}</h2>
      <button class="quick-entry-card__edit" type="button" :aria-label="editAriaLabel" :aria-pressed="editing" @click="toggleEditing">
        <span class="quick-entry-card__edit-icon" aria-hidden="true"></span>
        <span class="quick-entry-card__edit-text">{{ editing ? doneText : editText }}</span>
      </button>
    </div>
    <div class="quick-grid">
      <div
        v-for="(action, index) in actions"
        :key="`${index}-${action.title || action.desc}`"
        :class="[
          'quick-card',
          action.isAdd ? 'quick-card--add' : 'quick-card--custom',
          {
            'is-dragging': draggingIndex === index,
            'is-drag-over': dragOverIndex === index
          }
        ]"
        :data-action="action.title || action.desc"
        :data-quick-title="action.title || undefined"
        :data-quick-feature="featureOf(action)"
        :data-custom-quick-entry="!action.isAdd ? 'true' : undefined"
        :data-attention="needsAttention(action) ? attentionValue : undefined"
        :data-quick-index="index"
        role="button"
        tabindex="0"
        @click="handleAction(action, index, $event)"
        @keydown.enter.prevent="handleAction(action, index, $event)"
        @keydown.space.prevent="handleAction(action, index, $event)"
        @pointerdown="dragMode === 'card' ? beginPointerDrag(index, $event) : undefined"
        @dragover.prevent="handleDragOver(index, $event)"
        @drop.prevent="dropAction(index, $event)"
        @dragend="endDrag"
      >
        <button v-if="!action.isAdd" class="quick-card__delete" type="button" :aria-label="`${removeLabelPrefix}${action.title}`" @click.stop="removeAction(action, index)">
          <svg class="quick-card__delete-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4L12 12M12 4L4 12" />
          </svg>
        </button>
        <button
          v-if="!action.isAdd && dragMode === 'handle'"
          class="quick-card__drag"
          type="button"
          :aria-label="`${dragLabelPrefix}${action.title}`"
          :draggable="editing && dragMode === 'handle'"
          @pointerdown.stop="dragMode === 'handle' ? beginPointerDrag(index, $event) : undefined"
          @dragstart.stop="startDrag(index, $event)"
          @dragend="endDrag"
        ></button>
        <span v-if="needsAttention(action)" class="quick-card__attention-dot" :aria-label="attentionLabel"></span>
        <span class="quick-card__body">
          <span class="icon-box">
            <span v-if="action.icon === 'quickCalendar'" class="quick-icon quick-icon--schedule" aria-hidden="true">
              <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-schedule-box.svg')" alt="" />
              <img class="quick-icon__mark" :src="assetUrl('assets/figma-home/quick-schedule-mark.svg')" alt="" />
            </span>
            <span v-else-if="action.icon === 'clock'" class="quick-icon quick-icon--clock" aria-hidden="true">
              <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-clock-circle.svg')" alt="" />
              <img class="quick-icon__hand" :src="assetUrl('assets/figma-home/quick-clock-hand.svg')" alt="" />
            </span>
            <span v-else-if="isMenuIcon(action.icon)" :class="['quick-icon quick-icon--menu', `quick-icon--menu-${action.icon}`]" aria-hidden="true"></span>
            <img v-else class="quick-icon" :class="`quick-icon--${action.icon || 'document'}`" :src="quickIcon(action.icon)" alt="" aria-hidden="true" />
          </span>
          <span v-if="action.title" class="quick-card__title">{{ action.title }}</span>
          <span class="quick-card__desc">{{ action.desc }}</span>
        </span>
      </div>
    </div>
    <p v-if="editing && dragHint" class="quick-entry-card__drag-hint">{{ dragHint }}</p>
    <Teleport to="body">
      <div
        v-if="dragPreview.visible"
        :class="['quick-drag-preview', `quick-drag-preview--${dragPreview.type}`]"
        :style="dragPreviewStyle"
        aria-hidden="true"
      >
        <template v-if="dragPreview.type === 'card' && dragPreview.action">
          <span class="quick-card__body">
            <span class="icon-box">
              <span v-if="dragPreview.action.icon === 'quickCalendar'" class="quick-icon quick-icon--schedule" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-schedule-box.svg')" alt="" />
                <img class="quick-icon__mark" :src="assetUrl('assets/figma-home/quick-schedule-mark.svg')" alt="" />
              </span>
              <span v-else-if="dragPreview.action.icon === 'clock'" class="quick-icon quick-icon--clock" aria-hidden="true">
                <img class="quick-icon__base" :src="assetUrl('assets/figma-home/quick-clock-circle.svg')" alt="" />
                <img class="quick-icon__hand" :src="assetUrl('assets/figma-home/quick-clock-hand.svg')" alt="" />
              </span>
              <span v-else-if="isMenuIcon(dragPreview.action.icon)" :class="['quick-icon quick-icon--menu', `quick-icon--menu-${dragPreview.action.icon}`]" aria-hidden="true"></span>
              <img v-else class="quick-icon" :class="`quick-icon--${dragPreview.action.icon || 'document'}`" :src="quickIcon(dragPreview.action.icon)" alt="" aria-hidden="true" />
            </span>
            <span v-if="dragPreview.action.title" class="quick-card__title">{{ dragPreview.action.title }}</span>
            <span class="quick-card__desc">{{ dragPreview.action.desc }}</span>
          </span>
        </template>
        <span v-else class="quick-card__drag quick-drag-preview__handle" aria-hidden="true"></span>
      </div>
    </Teleport>
    <Teleport to="body">
      <div :class="['schedule-overlay', { 'is-open': scheduleOpen }]" :aria-hidden="String(!scheduleOpen)" @click.self="closeSchedulePanel">
        <section v-if="scheduleOpen" class="schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
          <section class="schedule-panel" aria-label="今日排班">
            <header class="schedule-panel__header">
              <strong id="schedule-dialog-title" class="schedule-panel__title">{{ scheduleTitle }}</strong>
              <button class="schedule-panel__back schedule-panel__close" type="button" aria-label="关闭排班弹窗" @click="closeSchedulePanel">×</button>
            </header>
            <div class="schedule-panel__summary">
              <div class="schedule-panel__summary-left">
                <div class="schedule-panel__date" aria-label="当前排班日期">
                  <strong>{{ scheduleDate }}</strong>
                  <span>{{ scheduleWeekday }}</span>
                </div>
                <span class="schedule-panel__punch-counts" aria-label="排班打卡统计">
                  <span>已打卡：<strong>{{ punchedCount }}</strong></span>
                  <span>待打卡：<strong>{{ unpunchedCount }}</strong></span>
                </span>
              </div>
              <span class="schedule-panel__actions">
                <button class="schedule-panel__detail" type="button" @click="$emit('schedule-detail')">{{ scheduleDetailText }}</button>
                <button
                  :class="['schedule-panel__punch', punchDone ? 'schedule-panel__punch--done' : 'schedule-panel__punch--warning']"
                  type="button"
                  :data-punch-state="punchDone ? 'done' : 'warning'"
                  @click="punchSchedule"
                >
                  {{ punchDone ? punchedText : schedulePunchText }}
                </button>
              </span>
            </div>
            <div class="schedule-panel__body">
              <div class="schedule-day-grid">
                <ScheduleColumn period="morning" title="上午  00:00–12:00" :hours="morningHours" :blocks="morningScheduleBlocks" :punched="punchDone" />
                <ScheduleColumn period="afternoon" title="下午  12:00–24:00" :hours="afternoonHours" :blocks="afternoonScheduleBlocks" :punched="punchDone" />
              </div>
            </div>
          </section>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, h, ref, watch } from 'vue'
import { assetUrl } from '@jiahong/ui'

defineOptions({
  name: 'ABQuickActionsPanel'
})

const props = defineProps({
  title: {
    type: String,
    default: '高频操作入口'
  },
  actions: {
    type: Array,
    default: () => []
  },
  featureMap: {
    type: Object,
    default: () => ({})
  },
  iconMap: {
    type: Object,
    default: () => ({})
  },
  attentionFeature: {
    type: String,
    default: 'schedule'
  },
  attentionValue: {
    type: String,
    default: 'unpunched-schedule'
  },
  attentionLabel: {
    type: String,
    default: '存在未打卡排班'
  },
  editText: {
    type: String,
    default: '编辑'
  },
  doneText: {
    type: String,
    default: '完成'
  },
  editAriaLabel: {
    type: String,
    default: '编辑高频操作入口'
  },
  removeLabelPrefix: {
    type: String,
    default: '删除快捷入口：'
  },
  dragLabelPrefix: {
    type: String,
    default: '拖动排序：'
  },
  ariaLabel: {
    type: String,
    default: '高频操作入口'
  },
  dragMode: {
    type: String,
    default: 'handle',
    validator: (value) => ['handle', 'card'].includes(value)
  },
  dragHint: {
    type: String,
    default: ''
  },
  scheduleTitle: {
    type: String,
    default: '今日排班'
  },
  scheduleDetailText: {
    type: String,
    default: '查看详情'
  },
  schedulePunchText: {
    type: String,
    default: '立即打卡'
  },
  punchedText: {
    type: String,
    default: '已打卡'
  },
  scheduleDate: {
    type: String,
    default: '6月3日'
  },
  scheduleWeekday: {
    type: String,
    default: '星期三'
  },
  initialPunchedCount: {
    type: Number,
    default: 1
  },
  initialUnpunchedCount: {
    type: Number,
    default: 3
  },
  initialPunchDone: {
    type: Boolean,
    default: false
  },
  morningHours: {
    type: Array,
    default: () => Array.from({ length: 12 }, (_, index) => index)
  },
  afternoonHours: {
    type: Array,
    default: () => Array.from({ length: 12 }, (_, index) => index + 12)
  },
  scheduleBlocks: {
    type: Array,
    default: () => [
      { column: 'morning', tone: 'ended', title: '饿了么后方-固定值班', time: '已结束', topHour: 4, durationHours: 2, status: 'check' },
      { column: 'morning', tone: 'active', title: '饿了么后方-固定值班', time: '8:00-11:00', topHour: 8, durationHours: 3, status: 'warning', active: true },
      { column: 'afternoon', tone: 'orange', title: '九州通美团-兜底科室报班', time: '14:00-15:00', topHour: 14, durationHours: 2 },
      { column: 'afternoon', tone: 'purple', title: '妙手阿里-兜底科室报班', time: '14:00-15:00', topHour: 18, durationHours: 4 }
    ]
  }
})

const emit = defineEmits(['add', 'edit', 'remove', 'select', 'reorder', 'schedule-open', 'schedule-detail', 'schedule-punch'])

const editing = ref(false)
const scheduleOpen = ref(false)
const punchDone = ref(props.initialPunchDone)
const draggingIndex = ref(-1)
const dragOverIndex = ref(-1)
const pointerDrag = ref({
  active: false,
  fromIndex: -1,
  startX: 0,
  startY: 0,
  moved: false
})
const dragPreview = ref({
  visible: false,
  type: 'handle',
  action: null,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
  width: 28,
  height: 28
})
const suppressNextClick = ref(false)
const punchedCount = computed(() => props.initialPunchedCount + (punchDone.value ? 1 : 0))
const unpunchedCount = computed(() => Math.max(0, props.initialUnpunchedCount - (punchDone.value ? 1 : 0)))
const morningScheduleBlocks = computed(() => props.scheduleBlocks.filter((block) => block.column === 'morning'))
const afternoonScheduleBlocks = computed(() => props.scheduleBlocks.filter((block) => block.column === 'afternoon'))
const dragPreviewStyle = computed(() => ({
  left: `${dragPreview.value.x - dragPreview.value.offsetX}px`,
  top: `${dragPreview.value.y - dragPreview.value.offsetY}px`,
  width: `${dragPreview.value.width}px`,
  height: `${dragPreview.value.height}px`
}))

watch(
  () => props.initialPunchDone,
  (value) => {
    punchDone.value = value
  }
)

const defaultIconMap = {
  document: 'assets/figma-home/quick-doc.svg',
  plus: 'assets/figma-home/quick-plus.svg',
  user: 'assets/figma-home/user.svg',
  shield: 'assets/figma-home/pocket.svg',
  clipboard: 'assets/figma-home/clipboard.svg',
  briefcase: 'assets/figma-home/briefcase.svg',
  calendar: 'assets/figma-home/calendar.svg'
}
const menuIconKeys = new Set(['user', 'shield', 'clipboard', 'briefcase', 'calendar'])

function quickIcon(name) {
  return assetUrl(props.iconMap[name] || defaultIconMap[name] || defaultIconMap.document)
}

function isMenuIcon(name) {
  return menuIconKeys.has(name)
}

function featureOf(action) {
  return action.feature || props.featureMap[action.icon] || ''
}

function needsAttention(action) {
  return !punchDone.value && !action.isAdd && featureOf(action) === props.attentionFeature
}

function toggleEditing() {
  editing.value = !editing.value
}

function openSchedulePanel(action, index) {
  editing.value = false
  scheduleOpen.value = true
  emit('schedule-open', { action, index })
}

function closeSchedulePanel(event) {
  event?.preventDefault()
  event?.stopPropagation()
  scheduleOpen.value = false
}

function punchSchedule() {
  if (punchDone.value) return
  punchDone.value = true
  emit('schedule-punch')
}

function isMovableIndex(index) {
  return editing.value && index >= 0 && !props.actions[index]?.isAdd
}

function startDrag(index, event) {
  if (!isMovableIndex(index)) {
    event?.preventDefault()
    return
  }
  draggingIndex.value = index
  dragOverIndex.value = index
  event?.dataTransfer?.setData('text/plain', String(index))
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function beginPointerDrag(index, event) {
  if (!isMovableIndex(index) || event?.button !== 0) return
  if (event?.target?.closest?.('.quick-card__delete')) return
  event.preventDefault()
  const previewType = props.dragMode === 'card' ? 'card' : 'handle'
  const previewElement = previewType === 'card'
    ? event.currentTarget?.closest?.('.quick-card') || event.currentTarget
    : event.currentTarget
  const previewRect = previewElement?.getBoundingClientRect?.()
  pointerDrag.value = {
    active: true,
    fromIndex: index,
    startX: event.clientX,
    startY: event.clientY,
    moved: false
  }
  dragPreview.value = {
    visible: true,
    type: previewType,
    action: previewType === 'card' ? props.actions[index] : null,
    x: event.clientX,
    y: event.clientY,
    offsetX: previewRect ? event.clientX - previewRect.left : 14,
    offsetY: previewRect ? event.clientY - previewRect.top : 14,
    width: previewRect?.width || (previewType === 'card' ? 180 : 28),
    height: previewRect?.height || (previewType === 'card' ? 168 : 28)
  }
  draggingIndex.value = index
  dragOverIndex.value = index
  window.addEventListener('pointermove', movePointerDrag)
  window.addEventListener('pointerup', finishPointerDrag, { once: true })
  window.addEventListener('pointercancel', cancelPointerDrag, { once: true })
}

function movePointerDrag(event) {
  if (!pointerDrag.value.active) return
  dragPreview.value = {
    ...dragPreview.value,
    x: event.clientX,
    y: event.clientY
  }
  const deltaX = Math.abs(event.clientX - pointerDrag.value.startX)
  const deltaY = Math.abs(event.clientY - pointerDrag.value.startY)
  if (deltaX > 4 || deltaY > 4) {
    pointerDrag.value.moved = true
    suppressNextClick.value = true
  }
  const element = document.elementFromPoint(event.clientX, event.clientY)
  const card = element?.closest?.('.quick-card')
  const overIndex = Number(card?.dataset?.quickIndex)
  if (Number.isInteger(overIndex) && isMovableIndex(overIndex)) {
    dragOverIndex.value = overIndex
  }
}

function finishPointerDrag() {
  window.removeEventListener('pointermove', movePointerDrag)
  const { fromIndex, moved } = pointerDrag.value
  const toIndex = dragOverIndex.value
  pointerDrag.value = { active: false, fromIndex: -1, startX: 0, startY: 0, moved: false }
  resetDragPreview()
  if (moved && isMovableIndex(fromIndex) && isMovableIndex(toIndex) && fromIndex !== toIndex) {
    const actions = props.actions.slice()
    const [action] = actions.splice(fromIndex, 1)
    actions.splice(toIndex, 0, action)
    emit('reorder', {
      fromIndex,
      toIndex,
      action,
      target: props.actions[toIndex],
      actions
    })
  }
  endDrag()
}

function cancelPointerDrag() {
  window.removeEventListener('pointermove', movePointerDrag)
  pointerDrag.value = { active: false, fromIndex: -1, startX: 0, startY: 0, moved: false }
  resetDragPreview()
  endDrag()
}

function resetDragPreview() {
  dragPreview.value = {
    visible: false,
    type: 'handle',
    action: null,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    width: 28,
    height: 28
  }
}

function handleDragOver(index, event) {
  if (!isMovableIndex(index) || draggingIndex.value < 0 || draggingIndex.value === index) return
  dragOverIndex.value = index
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function dropAction(index, event) {
  const fallbackIndex = Number(event?.dataTransfer?.getData('text/plain'))
  const fromIndex = draggingIndex.value >= 0 ? draggingIndex.value : fallbackIndex
  if (!isMovableIndex(fromIndex) || !isMovableIndex(index) || fromIndex === index) {
    endDrag()
    return
  }
  const actions = props.actions.slice()
  const [action] = actions.splice(fromIndex, 1)
  actions.splice(index, 0, action)
  emit('reorder', {
    fromIndex,
    toIndex: index,
    action,
    target: props.actions[index],
    actions
  })
  endDrag()
}

function endDrag() {
  draggingIndex.value = -1
  dragOverIndex.value = -1
}

function handleAction(action, index, event) {
  if (event?.target?.closest?.('.quick-card__delete, .quick-card__drag')) return
  if (suppressNextClick.value) {
    suppressNextClick.value = false
    return
  }
  if (action.isAdd) {
    emit('add', { action, index })
    return
  }
  if (editing.value) {
    emit('edit', { action, index })
    return
  }
  const feature = featureOf(action)
  if (feature === props.attentionFeature) {
    openSchedulePanel(action, index)
    return
  }
  emit('select', { action, index, feature })
}

function removeAction(action, index) {
  if (!editing.value) return
  emit('remove', { action, index })
}

function ScheduleColumn({ period, title, hours, blocks, punched }) {
  return h('section', { class: ['schedule-day-grid__column', `schedule-day-grid__column--${period}`], 'aria-label': title }, [
    h('header', { class: 'schedule-day-grid__period' }, title),
    h('div', { class: 'schedule-day-grid__body' }, [
      h('div', { class: 'schedule-day-grid__hours', 'aria-hidden': 'true' }, hours.map((hour) => h('span', { class: 'schedule-day-grid__hour' }, `${hour}:00`))),
      h('div', { class: 'schedule-day-grid__tracks' }, [
        ...hours.map((hour) => h('span', { class: 'schedule-day-grid__line', 'aria-hidden': 'true', style: { '--row': hour % 12 } })),
        ...blocks.map((block) => h(ScheduleBlock, { block, punched })),
        period === 'morning' && !punched ? h('div', { class: 'schedule-day-grid__missed-callout' }, '该时段未打卡') : null,
        period === 'morning' ? h('div', { class: 'schedule-day-grid__current-line', 'aria-hidden': 'true' }) : null
      ])
    ])
  ])
}

function ScheduleBlock({ block, punched }) {
  const relativeHour = Number(block.topHour || 0) % 12
  const status = block.status === 'warning' && punched
    ? h('span', { class: 'schedule-day-block__status schedule-day-block__status--done', 'aria-label': '已打卡' }, '✓')
    : block.status === 'check'
    ? h('span', { class: 'schedule-day-block__status schedule-day-block__status--check', 'aria-label': '已打卡' }, '✓')
    : block.status === 'warning'
      ? h('span', { class: 'schedule-day-block__status schedule-day-block__status--warning', 'data-schedule-active-status': 'true', 'aria-label': '该时段未打卡' }, '!')
      : null
  return h(
    'article',
    {
      class: ['schedule-day-block', `schedule-day-block--${block.tone}`, { 'is-active': block.active }],
      style: { '--start-hour': relativeHour, '--duration-hours': block.durationHours || 1 }
    },
    [
      h('div', { class: 'schedule-day-block__title' }, [h('strong', block.title), status]),
      h('span', { class: 'schedule-day-block__time' }, block.time),
      block.active ? h('em', { class: 'schedule-day-block__stamp', 'aria-hidden': 'true' }, '进行中') : null
    ]
  )
}
</script>

<style>
.quick-entry-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 476px;
  padding: 24px 32px;
  box-shadow: var(--jh-shadow-soft);
}

.quick-entry-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quick-entry-card__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  min-width: 72px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--jh-line);
  border-radius: 999px;
  background: #ffffff;
  color: var(--jh-text-tertiary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.quick-entry-card__edit:hover,
.quick-entry-card__edit[aria-pressed="true"] {
  border-color: #cfe3ff;
  background: #ebf3ff;
  color: var(--jh-blue);
  box-shadow: 0 6px 14px -10px rgba(16, 42, 67, 0.3);
}

.quick-entry-card__edit-icon {
  position: relative;
  display: block;
  width: 12px;
  height: 12px;
}

.quick-entry-card__edit-icon::before {
  position: absolute;
  left: 2px;
  top: 5px;
  width: 8px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transform: rotate(-45deg);
  content: "";
}

.quick-entry-card__edit-icon::after {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 4px;
  height: 4px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  content: "";
}

.quick-entry-card__edit-text {
  white-space: nowrap;
}

.quick-grid {
  display: grid;
  align-items: stretch;
  justify-content: center;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  grid-auto-rows: auto;
  width: 100%;
  min-width: 0;
  height: auto;
}

.quick-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 168px;
  height: auto;
  padding: 14px 10px;
  overflow: visible;
  border: 1px solid var(--jh-line);
  border-radius: 6px;
  background: linear-gradient(270deg, #fcfcfc 0%, var(--jh-panel) 100%);
  color: var(--jh-text-secondary);
  cursor: pointer;
  transform-origin: center;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
  will-change: transform;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: #cfe3ff;
  box-shadow: 0 8px 20px -14px rgba(0, 110, 249, 0.55);
}

.quick-card__attention-dot {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 1;
  width: 9px;
  height: 9px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 0 2px rgba(245, 63, 63, 0.12);
}

.quick-card--add {
  border-style: dashed;
}

.quick-card__delete,
.quick-card__drag {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--jh-line);
  border-radius: 50%;
  background: #ffffff;
  color: var(--jh-text-tertiary);
  cursor: pointer;
  opacity: 1;
  pointer-events: auto;
  box-shadow: 0 6px 14px -12px rgba(16, 42, 67, 0.4);
  transform: translateY(0) scale(1);
  transition:
    opacity 180ms ease,
    visibility 180ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
  visibility: visible;
}

.quick-card__delete {
  top: 8px;
  right: 8px;
}

.quick-card__drag {
  top: 8px;
  left: 8px;
  cursor: grab;
  touch-action: none;
}

.quick-entry-card:not(.is-editing) .quick-card__delete,
.quick-entry-card:not(.is-editing) .quick-card__drag {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px) scale(0.88);
  visibility: hidden;
}

.quick-card__delete:hover {
  border-color: #ffd0d0;
  color: #d92d20;
  box-shadow: 0 10px 18px -12px rgba(217, 45, 32, 0.45);
  transform: translateY(-1px) scale(1.06);
}

.quick-card__drag:hover {
  border-color: #cfe3ff;
  color: var(--jh-blue);
  box-shadow: 0 10px 18px -12px rgba(0, 110, 249, 0.45);
  transform: translateY(-1px) scale(1.06);
}

.quick-card__delete-icon {
  display: block;
  width: 14px;
  height: 14px;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  shape-rendering: geometricPrecision;
}

.quick-card__drag::before {
  width: 13px;
  height: 10px;
  background:
    radial-gradient(circle, currentColor 1.5px, transparent 1.7px) 0 0 / 6px 5px;
  content: "";
}

.quick-entry-card.is-editing .quick-card--custom {
  border-color: #cfe3ff;
  background: #f8fbff;
  box-shadow: 0 10px 24px -20px rgba(0, 110, 249, 0.45);
}

.quick-entry-card.is-editing.quick-entry-card--handle-drag .quick-card--custom {
  cursor: pointer;
}

.quick-entry-card.is-editing.quick-entry-card--card-drag .quick-card--custom {
  cursor: grab;
}

.quick-entry-card__drag-hint {
  margin: -6px 0 0;
  color: var(--jh-text-secondary);
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}

.quick-card.is-dragging {
  z-index: 3;
  opacity: 0.42;
  cursor: grabbing;
  transform: scale(1.025);
  box-shadow: 0 18px 30px -18px rgba(0, 110, 249, 0.48);
  transition:
    opacity 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.quick-drag-preview {
  position: fixed;
  z-index: 2000;
  pointer-events: none;
  user-select: none;
  will-change: left, top;
}

.quick-drag-preview--handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quick-drag-preview__handle {
  position: static;
  opacity: 1;
  visibility: visible;
  transform: none;
  color: var(--jh-blue);
  border-color: #cfe3ff;
  box-shadow: 0 12px 22px -12px rgba(0, 110, 249, 0.5);
}

.quick-drag-preview--card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 14px 10px;
  overflow: hidden;
  border: 1px solid #91c4ff;
  border-radius: 6px;
  background: #f8fbff;
  color: var(--jh-text-secondary);
  cursor: grabbing;
  box-shadow: 0 22px 36px -18px rgba(0, 110, 249, 0.5);
  transform: scale(1.02);
}

.quick-card.is-drag-over {
  border-color: var(--jh-blue);
  background: #f2f7ff;
}

.quick-card.is-removing {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9) translateY(8px);
}

.quick-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border: 1px solid #e5e8eb;
  border-radius: 6px;
  background: #ffffff;
  color: var(--jh-blue);
}

.quick-card .icon-box {
  border-color: transparent;
  background: #ffffff;
}

.quick-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: visible;
}

.quick-icon img,
img.quick-icon {
  display: block;
  max-width: none;
}

.quick-icon--schedule {
  width: 23px;
  height: 24px;
}

.quick-icon--schedule .quick-icon__base {
  width: 23px;
  height: 24px;
}

.quick-icon--schedule .quick-icon__mark {
  position: absolute;
  left: 4px;
  top: -2px;
  width: 14px;
  height: 8px;
}

.quick-icon--document {
  width: 19px;
  height: 25px;
}

.quick-icon--clock {
  width: 28px;
  height: 27px;
}

.quick-icon--clock .quick-icon__base {
  width: 28px;
  height: 27px;
}

.quick-icon--clock .quick-icon__hand {
  position: absolute;
  left: 12px;
  top: 5px;
  width: 8px;
  height: 13px;
}

.quick-icon--plus {
  width: 21px;
  height: 21px;
}

.quick-icon--menu {
  width: 24px;
  height: 24px;
  background: linear-gradient(270deg, #3b92ff 0%, #006ef9 100%);
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.quick-icon--menu-user {
  -webkit-mask-image: url("@jiahong/ui/assets/figma-home/user.svg");
  mask-image: url("@jiahong/ui/assets/figma-home/user.svg");
}

.quick-icon--menu-shield {
  -webkit-mask-image: url("@jiahong/ui/assets/figma-home/pocket.svg");
  mask-image: url("@jiahong/ui/assets/figma-home/pocket.svg");
}

.quick-icon--menu-clipboard {
  -webkit-mask-image: url("@jiahong/ui/assets/figma-home/clipboard.svg");
  mask-image: url("@jiahong/ui/assets/figma-home/clipboard.svg");
}

.quick-icon--menu-briefcase {
  -webkit-mask-image: url("@jiahong/ui/assets/figma-home/briefcase.svg");
  mask-image: url("@jiahong/ui/assets/figma-home/briefcase.svg");
}

.quick-icon--menu-calendar {
  -webkit-mask-image: url("@jiahong/ui/assets/figma-home/calendar.svg");
  mask-image: url("@jiahong/ui/assets/figma-home/calendar.svg");
}

.quick-card__title {
  margin: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  color: var(--jh-text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  word-break: keep-all;
  overflow-wrap: normal;
  overflow: visible;
}

.quick-card__desc {
  margin: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 20px;
  color: var(--jh-text-secondary);
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  word-break: keep-all;
  overflow-wrap: normal;
  overflow: visible;
}

.schedule-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(31, 42, 55, 0.28);
}

.schedule-overlay.is-open {
  display: flex;
}

.schedule-dialog {
  width: min(1040px, calc(100vw - 64px));
  max-height: calc(var(--jh-viewport-height, 100vh) - 64px);
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
  box-shadow:
    0 84px 64px -20px rgba(16, 42, 67, 0.18),
    0 8px 16px -4px rgba(16, 42, 67, 0.1);
}

.schedule-dialog .schedule-panel {
  width: 100%;
  max-height: calc(var(--jh-viewport-height, 100vh) - 64px);
  min-height: 560px;
}

.schedule-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  color: var(--jh-text-primary);
}

.schedule-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e8eb;
}

.schedule-panel__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
  white-space: nowrap;
}

.schedule-panel__close {
  width: 28px;
  height: 28px;
  min-width: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #f2f3f4;
  color: #7d8a99;
  cursor: pointer;
  font-size: 20px;
  line-height: 24px;
}

.schedule-panel__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 24px;
  border-bottom: 1px solid #e5e8eb;
  background: #fbfcfd;
}

.schedule-panel__summary-left {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
}

.schedule-panel__date {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  color: var(--jh-text-primary);
}

.schedule-panel__date strong,
.schedule-panel__date span {
  font-size: 16px;
  line-height: 24px;
  white-space: nowrap;
}

.schedule-panel__punch-counts {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  color: var(--jh-text-secondary);
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
}

.schedule-panel__punch-counts strong {
  color: var(--jh-blue);
}

.schedule-panel__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.schedule-panel__detail,
.schedule-panel__punch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 88px;
  padding: 5px 16px;
  border: 1px solid #d8dde1;
  border-radius: 6px;
  background: #ffffff;
  color: var(--jh-text-secondary);
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
}

.schedule-panel__detail {
  border-color: transparent;
  background: transparent;
  color: var(--jh-blue);
}

.schedule-panel__punch--primary,
.schedule-panel__punch--warning {
  border-color: var(--jh-blue);
  background: var(--jh-blue);
  color: #ffffff;
}

.schedule-panel__punch--done {
  border-color: #00b578;
  background: #00b578;
  color: #ffffff;
}

.schedule-panel__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 24px;
  overflow: auto;
  background: #ffffff;
}

.schedule-day-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  min-width: 760px;
  height: 640px;
}

.schedule-day-grid__column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.schedule-day-grid__period {
  height: 40px;
  padding: 9px 16px;
  border-bottom: 1px solid #e5e8eb;
  background: #f8fbff;
  color: var(--jh-text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
}

.schedule-day-grid__body {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}

.schedule-day-grid__hours {
  display: grid;
  grid-template-rows: repeat(12, minmax(0, 1fr));
  border-right: 1px solid #eef1f4;
  background: #fbfcfd;
}

.schedule-day-grid__hour {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  color: #7d8a99;
  font-size: 12px;
  line-height: 18px;
}

.schedule-day-grid__tracks {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.schedule-day-grid__line {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--row) * 100% / 12);
  border-top: 1px solid #f0f2f5;
}

.schedule-day-block {
  position: absolute;
  top: calc(var(--start-hour) * 100% / 12 + 6px);
  left: 12px;
  right: 12px;
  height: calc(var(--duration-hours) * 100% / 12 - 12px);
  min-height: 58px;
  padding: 10px 12px 10px 14px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f9ff;
  color: var(--jh-text-primary);
  box-shadow: 0 6px 16px -12px rgba(16, 42, 67, 0.16);
}

.schedule-day-block::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--jh-blue);
  content: "";
}

.schedule-day-block__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.schedule-day-block__title strong {
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-day-block__time {
  display: block;
  margin-top: 4px;
  color: #4c5f73;
  font-size: 12px;
  line-height: 20px;
}

.schedule-day-block__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.schedule-day-block__status--check,
.schedule-day-block__status--done {
  background: #00b578;
}

.schedule-day-block__status--warning {
  background: #f59e0b;
}

.schedule-day-block--ended {
  background: #f6f7f8;
}

.schedule-day-block--ended::before {
  background: #9aa4b2;
}

.schedule-day-block--ended .schedule-day-block__title strong,
.schedule-day-block--ended .schedule-day-block__time {
  color: #9aa4b2;
}

.schedule-day-block--active {
  background: #eef5ff;
  color: #2768ff;
}

.schedule-day-block--active::before {
  background: #2768ff;
}

.schedule-day-block--active .schedule-day-block__time {
  color: #2768ff;
}

.schedule-day-block--orange {
  background: #fff7ed;
}

.schedule-day-block--orange::before {
  background: #f59e0b;
}

.schedule-day-block--orange .schedule-day-block__time {
  color: #9a4d00;
}

.schedule-day-block--purple {
  background: #f5f1ff;
}

.schedule-day-block--purple::before {
  background: #7c5cff;
}

.schedule-day-block--purple .schedule-day-block__time {
  color: #5b3fd6;
}

.schedule-day-block__stamp {
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: rgba(39, 104, 255, 0.18);
  font-size: 26px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
  transform: rotate(-22deg);
}

.schedule-day-grid__missed-callout {
  position: absolute;
  top: calc(8 * 100% / 12 + 8px);
  right: 22px;
  z-index: 2;
  padding: 4px 8px;
  border-radius: 5px;
  background: #fff7ed;
  color: #9a4d00;
  font-size: 12px;
  line-height: 18px;
  box-shadow: 0 8px 20px -12px rgba(154, 77, 0, 0.36);
}

.schedule-day-grid__missed-callout::after {
  position: absolute;
  left: 12px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: inherit;
  content: "";
  transform: rotate(45deg);
}

.schedule-day-grid__current-line {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(8.5 * 100% / 12);
  z-index: 1;
  border-top: 1px dashed #f59e0b;
}

.schedule-day-grid__current-line::before {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  content: "";
}

.schedule-overlay {
  z-index: 84;
  padding: 24px;
  background: rgba(122, 136, 152, 0.3);
}

.schedule-dialog {
  display: flex;
  width: min(706px, calc(100vw - 48px));
  height: min(715px, calc(var(--jh-viewport-height, 100vh) - 48px));
  max-height: min(715px, calc(var(--jh-viewport-height, 100vh) - 48px));
  overflow: hidden auto;
  border-radius: 8px;
}

.schedule-dialog .schedule-panel {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 715px;
  max-height: 100%;
  min-height: 0;
}

.schedule-panel {
  gap: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
  box-shadow:
    0 84px 64px -20px rgba(16, 42, 67, 0.18),
    0 8px 16px -4px rgba(16, 42, 67, 0.1);
}

.schedule-panel__header {
  flex: 0 0 48px;
  min-height: 48px;
  padding: 12px 16px;
  border-bottom: 0.667px solid rgba(229, 231, 235, 0.5);
  background: #f2f3f4;
  box-shadow: 0 1px 2px rgba(16, 42, 67, 0.04);
}

.schedule-panel__title {
  color: #1e2939;
  font-family: var(--jh-font-family);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.schedule-panel__close {
  width: 20px;
  min-width: 20px;
  height: 20px;
  border-radius: 4px;
  background: transparent;
  color: #99a1af;
  font-size: 30px;
  font-weight: 300;
  line-height: 18px;
}

.schedule-panel__summary {
  flex: 0 0 52px;
  gap: 17px;
  padding: 20px 24px 0;
  border-bottom: 0;
  background: #ffffff;
}

.schedule-panel__summary-left {
  display: inline-flex;
  gap: 17px;
  width: 275px;
}

.schedule-panel__date {
  align-items: center;
  gap: 17px;
  min-width: 117px;
  color: #374151;
  font-family: var(--jh-font-family);
}

.schedule-panel__date strong,
.schedule-panel__date span {
  font-weight: 700;
}

.schedule-panel__punch-counts {
  justify-content: center;
  gap: 12px;
  min-width: 141px;
  height: 24px;
  padding: 0 12px;
  border-radius: 4px;
  background: #f8f8f9;
  color: rgba(0, 0, 0, 0.6);
  font-family: var(--jh-font-family);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
}

.schedule-panel__punch-counts strong {
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
}

.schedule-panel__actions {
  gap: 16px;
  width: 192px;
}

.schedule-panel__detail,
.schedule-panel__punch {
  width: 88px;
  min-width: 88px;
  height: 32px;
  padding: 5px 12px;
  border-radius: 8px;
  font-family: var(--jh-font-family);
  font-weight: 400;
}

.schedule-panel__detail {
  border: 1px solid #d8dde1;
  background: #ffffff;
  color: rgba(0, 0, 0, 0.6);
}

.schedule-panel__punch--primary,
.schedule-panel__punch--warning {
  border: 0;
  background: linear-gradient(270deg, #3b92ff 0%, #006ef9 100%);
  box-shadow: none;
}

.schedule-panel__punch--done {
  border: 0;
  background: #c9cdd4;
  cursor: default;
  box-shadow: none;
}

.schedule-panel__body {
  align-items: flex-end;
  height: 615px;
  padding: 12px 24px 24px;
  overflow: visible;
}

.schedule-day-grid {
  gap: 0;
  width: 658px;
  min-width: 0;
  height: 579px;
  border: 2px solid #e5e8eb;
}

.schedule-day-grid__column {
  border: 0;
  border-radius: 0;
}

.schedule-day-grid__column--morning {
  border-right: 1px solid #e8ecf2;
}

.schedule-day-grid__period {
  flex: 0 0 48px;
  height: auto;
  padding: 12px 36px;
  border-bottom: 0;
  background: #f8f8f9;
  color: #374151;
  font-family: var(--jh-font-family);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  white-space: pre;
}

.schedule-day-grid__body {
  grid-template-columns: 70px minmax(0, 1fr);
}

.schedule-day-grid__hours {
  grid-template-rows: repeat(12, 44px);
  padding-top: 18px;
  background: transparent;
}

.schedule-day-grid__tracks {
  height: 528px;
}

.schedule-day-grid__line {
  top: calc(var(--row) * 44px);
  height: 1px;
  border-top: 0;
  background: #f4f5f6;
}

.schedule-day-block {
  left: 4px;
  right: 4px;
  top: calc(var(--start-hour) * 44px);
  display: flex;
  height: calc(var(--duration-hours) * 44px);
  min-height: 0;
  padding: 12px 14px;
  border-radius: 4px;
  box-shadow: none;
}

.schedule-day-block::before {
  left: 4px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 999px;
}

.schedule-day-block__title {
  justify-content: flex-start;
  padding-left: 13px;
}

.schedule-day-block__title strong {
  color: rgba(0, 0, 0, 0.85);
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
}

.schedule-day-block__time {
  margin-top: 0;
  padding-left: 13px;
}

.schedule-day-block__status {
  width: 12px;
  height: 12px;
  flex-basis: 12px;
  font-size: 10px;
  line-height: 12px;
}

.schedule-day-block__status--warning {
  background: #e03b32;
}

.schedule-day-block__stamp {
  right: 16px;
  bottom: 16px;
  width: 56px;
  height: 56px;
  border: 2px solid rgba(99, 111, 126, 0.55);
  border-radius: 50%;
  color: rgba(99, 111, 126, 0.7);
  font-size: 14px;
  line-height: 52px;
  text-align: center;
  transform: rotate(-24deg);
}

.schedule-day-block__stamp::before,
.schedule-day-block__stamp::after {
  position: absolute;
  inset: 6px;
  border-top: 2px solid rgba(99, 111, 126, 0.42);
  border-bottom: 2px solid rgba(99, 111, 126, 0.42);
  border-radius: 50%;
  content: "";
}

.schedule-day-grid__missed-callout {
  left: 50%;
  top: 300px;
  right: auto;
  min-width: 92px;
  padding: 5px 12px;
  border: 1px solid #d8dde1;
  border-radius: 4px;
  background: #ffffff;
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
  line-height: 22px;
  transform: translateX(-50%);
}

.schedule-day-grid__missed-callout::after {
  left: 50%;
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-right: 1px solid #d8dde1;
  border-bottom: 1px solid #d8dde1;
  transform: translateX(-50%) rotate(45deg);
}

.schedule-day-grid__current-line {
  top: 352px;
  height: 1px;
  border-top: 0;
  background: #e12727;
}

.schedule-day-grid__current-line::before {
  left: -1px;
  top: -5px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid #e12727;
  border-radius: 0;
  background: transparent;
}

@media (max-width: 760px) {
  .schedule-overlay {
    padding: 16px;
  }

  .schedule-dialog {
    width: calc(100vw - 32px);
    max-height: calc(var(--jh-viewport-height, 100vh) - 32px);
  }

  .schedule-panel__summary {
    align-items: stretch;
    flex-direction: column;
  }

  .schedule-panel__summary-left {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .schedule-panel__body {
    padding: 16px;
  }
}
</style>
