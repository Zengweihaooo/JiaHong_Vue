<template>
  <section
    ref="panelRef"
    :class="[
      'prescription-panel',
      {
        'prescription-panel--readonly': readonly,
        'consultation-panel': consultation,
        'has-inline-risk-warning': showInlineRiskWarning
      }
    ]"
    :aria-label="readonly ? '只读处方信息' : '处方信息'"
  >
    <div class="patient-info">
      <div class="patient-info__header">
        <div class="patient-info__name">{{ patientName }}</div>
        <div class="patient-info__meta">
          <span>证件号：{{ patientDetail.idCard || "--" }}</span>
          <span>手机号：{{ patientDetail.phone || "--" }}</span>
        </div>
      </div>
      <div class="patient-info__grid">
        <span class="patient-info__field"><span class="patient-info__field-label">过敏史：</span><span class="patient-info__field-value">{{ patientDetail.allergies || "--" }}</span></span>
        <span class="patient-info__field"><span class="patient-info__field-label"><em>*</em>肝功能异常：</span><span class="patient-info__field-value">{{ patientDetail.liverAbnormal || "--" }}</span></span>
        <span class="patient-info__field"><span class="patient-info__field-label"><em>*</em>妊娠哺乳：</span><span class="patient-info__field-value">{{ patientDetail.pregnancy || "--" }}</span></span>
        <span class="patient-info__field"><span class="patient-info__field-label"><em>*</em>肾功能异常：</span><span class="patient-info__field-value">{{ patientDetail.kidneyAbnormal || "--" }}</span></span>
      </div>
    </div>

    <div class="section-divider"></div>
    <div class="diagnosis-section">
      <h3>{{ consultation ? "诊断意见" : "疾病信息" }}</h3>
      <div class="diagnosis-row">
        <label><span>*</span>诊断</label>
        <span v-if="readonly" class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select--readonly">{{ diagnosisTags[0] || "" }}</span>
        <div v-else class="diagnosis-combobox">
          <input
            v-model="diagnosisKeyword"
            class="jh-input-field jh-input-field--lg diagnosis-select diagnosis-select-input"
            type="text"
            aria-label="请选择诊断"
            :aria-expanded="diagnosisOpen && diagnosisOptions.length > 0"
            autocomplete="off"
            placeholder="请选择诊断"
            @focus="refreshDiagnosisOptions"
            @input="refreshDiagnosisOptions"
            @blur="deferCloseDiagnosis"
          />
          <div class="diagnosis-options" role="listbox" :hidden="!diagnosisOpen || !diagnosisOptions.length">
            <button
              v-for="diagnosis in diagnosisOptions"
              :key="diagnosis"
              class="diagnosis-option"
              type="button"
              role="option"
              @pointerdown.prevent.stop="addDiagnosis(diagnosis)"
            >
              {{ diagnosis }}
            </button>
          </div>
        </div>
        <div class="diagnosis-input">
          <span v-for="tag in diagnosisTags" :key="tag" :class="['diagnosis-tag', { 'diagnosis-tag--readonly': readonly }]" :data-diagnosis-tag="tag">
            <span>{{ tag }}</span>
            <button v-if="!readonly" class="diagnosis-tag__close diagnosis-tag__close-btn" type="button" :data-diagnosis-tag="tag" :aria-label="`移除诊断：${tag}`" @click="removeDiagnosis(tag)">
              <img :src="assetUrl('assets/diagnosis-tag-close.svg')" alt="" />
            </button>
          </span>
          <button v-if="!readonly && diagnosisTags.length" class="diagnosis-clear-all-btn" type="button" aria-label="双击清空全部诊断" title="双击清空全部诊断" @dblclick="clearDiagnoses"></button>
        </div>
      </div>
      <div v-if="consultation" class="diagnosis-row consultation-treatment-row">
        <label><span>*</span>处理意见</label>
        <textarea
          v-model="treatmentAdvice"
          class="jh-input-field jh-input-field--lg consultation-treatment-input"
          :disabled="readonly"
          placeholder="请输入治疗处理意见"
          aria-label="请输入治疗处理意见"
        ></textarea>
      </div>
    </div>

    <div class="section-divider"></div>
    <div class="medicine-section">
      <h3>所需药品</h3>
      <div class="medicine-scroll-area">
        <div v-if="!readonly" class="medicine-search-combobox">
          <label class="jh-search-field medicine-search">
            <span class="jh-search-field__icon" aria-hidden="true">
              <img :src="assetUrl('assets/search-icon.png')" alt="" />
            </span>
            <input
              v-model="medicineKeyword"
              type="text"
              placeholder="请输入药品名称或首字母做模糊查询"
              aria-label="请输入药品名称或首字母做模糊查询"
              :aria-expanded="medicineOpen && medicineOptions.length > 0"
              autocomplete="off"
              @focus="refreshMedicineOptions"
              @input="refreshMedicineOptions"
              @blur="deferCloseMedicine"
            />
          </label>
          <div class="medicine-options" role="listbox" :hidden="!medicineOpen || !medicineOptions.length">
            <button
              v-for="medicine in medicineOptions"
              :key="`${medicine.name}-${medicine.spec}`"
              class="medicine-option"
              type="button"
              role="option"
              @pointerdown.prevent.stop="addMedicine(medicine)"
            >
              <span>{{ medicine.name }}</span><small>{{ medicine.spec }}</small>
            </button>
          </div>
        </div>
        <div v-if="medicines.length" :class="['medicine-table', { 'medicine-table--single': medicines.length === 1 }]">
          <div class="medicine-table__row medicine-table__head">
            <span>序号</span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
          </div>
          <div
            v-for="medicine in medicines"
            :key="medicine.index || medicine.name"
            :class="['medicine-table__row', { 'medicine-table__row--warning-linked': warningFields(medicine).size }]"
            :data-medicine-index="medicine.index"
            :data-medicine-name="medicine.name"
          >
            <span>{{ medicine.index }}</span>
            <span :class="warningClass(medicine, 'name')">{{ medicine.name }}</span>
            <span>{{ medicine.type }}</span>
            <span class="medicine-spec-text">{{ medicine.spec }}</span>
            <FieldCombobox :medicine="medicine" field="usage" label="用法" :readonly="readonly" />
            <FieldCombobox :medicine="medicine" field="frequency" label="服用频次" :readonly="readonly" />
            <FieldCombobox :medicine="medicine" field="dose" label="用量" :readonly="readonly" />
            <span>{{ medicine.quantity }}</span>
            <span v-if="readonly" :class="['table-input', warningClass(medicine, 'unit')]">{{ medicine.unit }}</span>
            <div v-else class="medicine-unit-control">
              <button
                :class="['table-input medicine-unit-select', warningClass(medicine, 'unit')]"
                type="button"
                aria-label="单位"
                aria-haspopup="listbox"
                :aria-expanded="openUnitIndex === medicine.index"
                data-medicine-field="unit"
                @click="toggleUnitMenu(medicine, $event)"
              >
                <span>{{ medicine.unit || "盒" }}</span>
              </button>
              <div class="medicine-unit-options" role="listbox" :hidden="openUnitIndex !== medicine.index" :style="unitMenuStyle">
                <button v-for="unit in medicineUnitOptions" :key="unit" :class="['medicine-unit-option', { 'is-active': unit === (medicine.unit || '盒') }]" type="button" role="option" :aria-selected="unit === (medicine.unit || '盒')" :data-medicine-unit="unit" @click="setMedicineUnit(medicine, unit)">
                  {{ unit }}
                </button>
              </div>
            </div>
            <span :class="['jh-risk-tag jh-risk-tag--sm risk-small', riskClass(medicine.risk)]">{{ medicine.risk }}</span>
            <button v-if="!readonly" class="jh-btn jh-btn--text medicine-delete-btn" type="button">删除</button>
          </div>
        </div>
        <div v-else class="medicine-empty-state">暂无药品信息</div>
      </div>
    </div>

    <section
      v-if="inlineRiskRows.length"
      ref="inlineRiskWarningRef"
      :class="['inline-risk-warning', { 'is-visible': showInlineRiskWarning }]"
      data-inline-risk-warning
      :hidden="!showInlineRiskWarning"
      aria-label="处方风险提醒"
    >
      <div class="inline-risk-warning__legend" aria-label="风险状态说明">
        <span v-for="item in inlineRiskWarningLegendItems" :key="item.status" class="inline-risk-warning__legend-item">
          <span :class="['risk-warning-status', `risk-warning-status--${item.status}`]" aria-hidden="true"></span>
          <span>{{ item.label }}</span>
        </span>
      </div>
      <div class="inline-risk-warning__table" role="table" aria-label="处方风险提醒">
        <div class="inline-risk-warning__row inline-risk-warning__row--head" role="row">
          <div v-for="header in inlineRiskWarningHeaders" :key="header" role="columnheader">{{ header }}</div>
        </div>
        <div v-for="row in inlineRiskRows" :key="row.name" class="inline-risk-warning__row" role="row">
          <div class="inline-risk-warning__medicine" role="cell">{{ row.name }}</div>
          <div v-for="(_, index) in inlineRiskWarningHeaders.slice(1)" :key="index" role="cell">
            <span v-if="row.warningColumns?.[index + 1]" :class="['risk-warning-status', `risk-warning-status--${row.warningColumns[index + 1]}`]" aria-hidden="true"></span>
          </div>
        </div>
      </div>
      <div class="inline-risk-warning__messages">
        <div v-for="row in inlineRiskRows" :key="`${row.name}-message`" class="inline-risk-warning__message">
          <p>{{ row.warningMessage || `[警示信息]${row.name}需完成风险核对` }}</p>
          <p>{{ row.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。" }}</p>
        </div>
      </div>
    </section>

    <div :class="['prescription-actions', { 'consultation-actions': consultation, 'prescription-actions--readonly': readonly }]">
      <span v-if="readonly" class="prescription-actions__hint">已封存，仅支持查看</span>
      <label v-else-if="!consultation" class="prescription-remark-field">
        <span class="prescription-remark-field__label">处方备注：</span>
        <span class="prescription-remark-combobox">
          <input
            class="jh-input-field jh-input-field--lg diagnosis-select prescription-remark-select prescription-remark-input"
            type="text"
            aria-label="处方备注"
            aria-expanded="false"
            autocomplete="off"
            placeholder="请选择"
          />
          <span class="prescription-remark-options" role="listbox" hidden></span>
        </span>
      </label>
      <div class="prescription-actions__controls">
        <button v-if="readonly" class="jh-btn jh-btn--md jh-btn--primary prescription-history-open" type="button" @click="emit('open-history')">查看开方历史</button>
        <button v-else-if="consultation" class="jh-btn jh-btn--md jh-btn--primary end-consult-trigger consultation-complete-trigger" type="button" @click="store.consultConfirmKind = 'end'">完成问诊</button>
        <template v-else>
          <button class="jh-btn jh-btn--md jh-btn--success end-consult-trigger" type="button" :disabled="!record?.prescriptionSubmitted" @click="store.consultConfirmKind = 'end'">结束问诊</button>
          <span v-if="videoSubmitLock && !record?.prescriptionSubmitted" class="video-prescription-submit-wrap">
            <span class="video-submit-countdown" data-video-submit-countdown data-remaining="10" aria-live="polite">
              <el-icon class="video-submit-countdown__icon"><Clock /></el-icon>
              <span class="video-submit-countdown__value">10s</span>
            </span>
            <button class="jh-btn jh-btn--md jh-btn--primary jh-prescription-submit" type="button" disabled>提交处方</button>
          </span>
          <button v-else class="jh-btn jh-btn--md jh-btn--primary jh-prescription-submit" type="button" :disabled="record?.prescriptionSubmitted" @click="store.openRiskWarningDialog({ revealInlineOnClose: true })">提交处方</button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, ref, watch, watchEffect } from "vue";
import { Clock } from "@element-plus/icons-vue";
import { appService } from "@/services/appService";
import { useAppStore } from "@/stores/app";
import { assetUrl } from "@/utils/assets";

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  },
  consultation: {
    type: Boolean,
    default: false
  },
  videoSubmitLock: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(["open-history"]);

const store = useAppStore();
const selectedDiagnosis = ref("");
const treatmentAdvice = ref("");
const diagnosisKeyword = ref("");
const diagnosisOptions = ref([]);
const diagnosisOpen = ref(false);
const medicineKeyword = ref("");
const medicineOptions = ref([]);
const medicineOpen = ref(false);
const openUnitIndex = ref("");
const unitMenuStyle = ref({});
const panelRef = ref(null);
const inlineRiskWarningRef = ref(null);
let diagnosisRequestSerial = 0;
let medicineRequestSerial = 0;
const medicineUnitOptions = ["盒", "瓶", "支", "袋", "板", "片"];
const inlineRiskWarningHeaders = [
  "药品名称",
  "患者条件",
  "重复用药",
  "用法用量",
  "给药途径",
  "相互作用",
  "生化指标",
  "配伍",
  "过敏",
  "孕产",
  "其他"
];
const inlineRiskWarningLegendItems = [
  { status: "must", label: "必须处理" },
  { status: "severe", label: "严重警告" },
  { status: "general", label: "一般警告" }
];
const medicineFieldOptions = {
  usage: ["口服", "外用", "适量冲洗", "口腔吸入", "鼻吸入"],
  frequency: ["1次/日", "2次/日", "3次/日", "4次/日", "1-2次/日", "2-3次/日", "必要时", "按需", "单次"],
  dose: ["0.5片", "1片", "2片", "1粒", "2粒", "0.5袋", "1袋", "2袋", "5ml", "10ml", "15ml", "1吸", "1滴", "适量", "薄涂", "每侧鼻孔2喷"]
};
const patientDetail = computed(() => props.record?.patientDetail || {});
const patientName = computed(() => {
  if (!props.record) return "暂无患者信息";
  const gap = "\u00A0\u00A0";
  const weight = patientDetail.value.weight ? `${gap}${patientDetail.value.weight}KG` : "";
  return `${props.record.patient || "--"}${gap}${props.record.patientGender || ""}${gap}${props.record.age || ""}${weight}`;
});
const diagnosisTags = computed(() => {
  const tags = props.record?.diagnosisTags?.length ? props.record.diagnosisTags : [props.record?.diagnosis].filter(Boolean);
  return props.consultation ? tags.filter((tag) => !tag.includes("咨询")) : tags;
});
const medicines = computed(() => props.record?.prescriptionMedicines || []);
const inlineRiskRows = computed(() =>
  medicines.value.filter((medicine) => Array.isArray(medicine.warningFields) && medicine.warningFields.length > 0)
);
const showInlineRiskWarning = computed(() => Boolean(props.record?.inlineRiskWarningVisible && inlineRiskRows.value.length));

async function scrollInlineRiskWarningIntoView() {
  await nextTick();
  const panel = panelRef.value;
  const warning = inlineRiskWarningRef.value;
  if (!panel || !warning) return;
  const scrollToWarning = () => {
    panel.scrollTo({
      top: panel.scrollHeight,
      behavior: "smooth"
    });
    warning.scrollIntoView({
      block: "end",
      behavior: "smooth"
    });
  };
  scrollToWarning();
  window.requestAnimationFrame(scrollToWarning);
}

watch(showInlineRiskWarning, (visible) => {
  if (visible) {
    scrollInlineRiskWarningIntoView();
  }
});

watchEffect(() => {
  selectedDiagnosis.value = diagnosisTags.value[0] || "";
  treatmentAdvice.value = props.record?.treatmentAdvice || "";
});

function warningFields(medicine = {}) {
  return new Set(Array.isArray(medicine.warningFields) ? medicine.warningFields : []);
}

function warningClass(medicine, field) {
  return warningFields(medicine).has(field) ? "medicine-warning-target" : "";
}

function riskClass(risk) {
  return {
    高: "jh-risk-tag--high",
    中: "jh-risk-tag--medium",
    低: "jh-risk-tag--low"
  }[risk] || "";
}

function ensureRecordArray(key) {
  if (!props.record) return [];
  if (!Array.isArray(props.record[key])) props.record[key] = [];
  return props.record[key];
}

function deferCloseDiagnosis() {
  window.setTimeout(() => {
    diagnosisOpen.value = false;
  }, 0);
}

function deferCloseMedicine() {
  window.setTimeout(() => {
    medicineOpen.value = false;
  }, 0);
}

async function refreshDiagnosisOptions() {
  if (!props.record || props.readonly) return;
  const requestId = ++diagnosisRequestSerial;
  const response = await appService.searchDiagnosisCatalog({
    keyword: diagnosisKeyword.value,
    exclude: diagnosisTags.value
  });
  if (requestId !== diagnosisRequestSerial) return;
  diagnosisOptions.value = Array.isArray(response?.items) ? response.items : [];
  diagnosisOpen.value = diagnosisOptions.value.length > 0;
}

function addDiagnosis(diagnosis) {
  if (!props.record || !diagnosis) return;
  const tags = ensureRecordArray("diagnosisTags");
  if (!tags.includes(diagnosis)) {
    tags.push(diagnosis);
  }
  diagnosisKeyword.value = "";
  diagnosisOpen.value = false;
  diagnosisOptions.value = [];
}

function removeDiagnosis(diagnosis) {
  const tags = ensureRecordArray("diagnosisTags");
  const nextTags = tags.filter((tag) => tag !== diagnosis);
  props.record.diagnosisTags = nextTags;
  if (props.record.diagnosis === diagnosis) {
    props.record.diagnosis = nextTags[0] || "";
  }
}

function clearDiagnoses() {
  if (!props.record) return;
  props.record.diagnosisTags = [];
  props.record.diagnosis = "";
}

async function refreshMedicineOptions() {
  if (!props.record || props.readonly) return;
  const requestId = ++medicineRequestSerial;
  const response = await appService.searchMedicineCatalog({
    keyword: medicineKeyword.value,
    exclude: medicines.value.map((medicine) => medicine.name)
  });
  if (requestId !== medicineRequestSerial) return;
  medicineOptions.value = Array.isArray(response?.items) ? response.items : [];
  medicineOpen.value = medicineOptions.value.length > 0;
}

function addMedicine(medicine = {}) {
  if (!props.record || !medicine.name) return;
  const list = ensureRecordArray("prescriptionMedicines");
  if (list.some((item) => item.name === medicine.name && item.spec === medicine.spec)) {
    medicineKeyword.value = "";
    medicineOpen.value = false;
    return;
  }
  list.push({
    index: list.length + 1,
    name: medicine.name,
    type: medicine.type || medicine.category || "处方药",
    spec: medicine.spec || "",
    usage: medicine.usage || "口服",
    frequency: medicine.frequency || "",
    dose: medicine.dose || "",
    quantity: medicine.quantity || "1",
    unit: medicine.unit || "盒",
    risk: medicine.risk || "低"
  });
  medicineKeyword.value = "";
  medicineOpen.value = false;
  medicineOptions.value = [];
}

function toggleUnitMenu(medicine, event) {
  if (!medicine) return;
  if (openUnitIndex.value === medicine.index) {
    openUnitIndex.value = "";
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const menuWidth = 64;
  const left = Math.min(rect.right + 8, window.innerWidth - menuWidth - 8);
  const top = Math.max(8, rect.top - 8);
  unitMenuStyle.value = {
    "--medicine-unit-menu-left": `${Math.max(8, left)}px`,
    "--medicine-unit-menu-top": `${top}px`
  };
  openUnitIndex.value = medicine.index;
}

function setMedicineUnit(medicine, unit) {
  if (!medicine) return;
  medicine.unit = unit;
  openUnitIndex.value = "";
}

const FieldCombobox = defineComponent({
  props: {
    medicine: { type: Object, required: true },
    field: { type: String, required: true },
    label: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(componentProps) {
    return () => {
      const value = componentProps.medicine[componentProps.field] || "";
      const classes = ["table-input", warningClass(componentProps.medicine, componentProps.field)];
      if (componentProps.readonly) {
        return h("span", { class: classes }, value);
      }
      const options = Array.from(new Set([value, ...(medicineFieldOptions[componentProps.field] || [])].filter(Boolean)));
      return h("div", { class: "medicine-usage-control" }, [
        h("input", {
          class: ["table-input medicine-edit-field medicine-usage-input", warningClass(componentProps.medicine, componentProps.field)],
          type: "text",
          value,
          "aria-label": componentProps.label,
          "aria-haspopup": "listbox",
          "aria-expanded": "false",
          autocomplete: "off",
          "data-medicine-field": componentProps.field
        }),
        h("div", { class: "medicine-usage-options", role: "listbox", hidden: true }, options.map((option) =>
          h("button", {
            class: ["medicine-usage-option", { "is-active": option === value }],
            type: "button",
            role: "option",
            "aria-selected": option === value ? "true" : "false",
            "data-medicine-option": option
          }, option)
        ))
      ]);
    };
  }
});
</script>
