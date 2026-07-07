<template>
  <section
    :class="[
      'prescription-panel',
      {
        'prescription-panel--readonly': readonly,
        'consultation-panel': consultation,
        [`prescription-panel--select-${selectPresentationVariant}`]: selectPresentationVariant
      }
    ]"
    :aria-label="readonly ? '只读处方信息' : '处方信息'"
  >
    <div class="prescription-panel__body">
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
            aria-label="请输入诊断"
            :aria-expanded="diagnosisOpen && diagnosisOptions.length > 0"
            autocomplete="off"
            placeholder="请输入诊断"
            @focus="refreshDiagnosisOptions"
            @input="refreshDiagnosisOptions"
            @blur="deferCloseDiagnosis"
          />
          <div
            ref="diagnosisOptionsRoot"
            class="diagnosis-options jh-custom-scroll"
            role="listbox"
            :hidden="!diagnosisOpen || !diagnosisOptions.length"
          >
            <div class="jh-custom-scroll__viewport">
              <div class="jh-custom-scroll__content">
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
            <div class="jh-custom-scroll__bar" aria-hidden="true">
              <div class="jh-custom-scroll__thumb"></div>
            </div>
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
              ref="medicineSearchInput"
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
          <div
            ref="medicineOptionsRoot"
            class="medicine-options jh-custom-scroll"
            role="listbox"
            :hidden="!medicineOpen || !medicineOptions.length"
          >
            <div class="jh-custom-scroll__viewport">
              <div class="jh-custom-scroll__content">
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
            <div class="jh-custom-scroll__bar" aria-hidden="true">
              <div class="jh-custom-scroll__thumb"></div>
            </div>
          </div>
        </div>
        <div v-if="medicines.length" :class="['medicine-table', { 'medicine-table--single': medicines.length === 1 }]">
          <div class="medicine-table__row medicine-table__head">
            <span class="medicine-table__index medicine-table__index--head" aria-label="序号"><span>序</span><span>号</span></span><span>药品名称</span><span>类型</span><span>规格</span><span>用法</span><span>服用频次</span><span>用量</span><span>数量</span><span>单位</span><span>风险</span><span>操作</span>
          </div>
          <div
            v-for="medicine in medicines"
            :key="medicine.index || medicine.name"
            :class="['medicine-table__row', medicineWarningRowClass(medicine), { 'medicine-table__row--warning-active': isActiveRiskMedicine(medicine) }]"
            :data-medicine-index="medicine.index"
            :data-medicine-name="medicine.name"
            :data-warning-level="medicineWarningLevel(medicine) || undefined"
            :data-warning-level-label="medicineWarningLevelLabel(medicine) || undefined"
            :data-warning-categories="medicineWarningCategories(medicine).join('、') || undefined"
            :data-warning-message="medicineWarningMessage(medicine) || undefined"
            :data-warning-suggestion="medicineWarningSuggestion(medicine) || undefined"
            :title="hasMedicineWarnings(medicine) && !readonly ? '点击查看风险提示' : undefined"
            @click="selectRiskMedicine(medicine, $event)"
          >
            <span class="medicine-table__index">{{ medicine.index }}</span>
            <span :class="warningClass(medicine, 'name')">{{ medicine.name }}</span>
            <span>{{ medicine.type }}</span>
            <FieldCombobox :medicine="medicine" field="spec" label="规格" :readonly="readonly" />
            <FieldCombobox :medicine="medicine" field="usage" label="用法" :readonly="readonly" />
            <FieldCombobox :medicine="medicine" field="frequency" label="服用频次" :readonly="readonly" />
            <FieldCombobox :medicine="medicine" field="dose" label="用量" :readonly="readonly" />
            <span v-if="readonly" :class="warningClass(medicine, 'quantity')">{{ medicine.quantity }}</span>
            <input
              v-else
              :class="['table-input medicine-edit-field', warningClass(medicine, 'quantity')]"
              type="text"
              :value="medicine.quantity"
              aria-label="数量"
              data-medicine-field="quantity"
              @input="updateMedicineField(medicine, 'quantity', $event.target.value)"
            />
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
            <span class="medicine-risk-cell">
              <span v-if="medicineRiskTagLabel(medicine)" :class="['jh-risk-tag jh-risk-tag--sm risk-small', riskClass(medicineRiskTagLabel(medicine))]">{{ medicineRiskTagLabel(medicine) }}</span>
            </span>
            <button v-if="!readonly" class="jh-btn jh-btn--text medicine-delete-btn" type="button" @click.stop="removeMedicine(medicine)">删除</button>
          </div>
        </div>
        <div v-else class="medicine-empty-state">暂无药品信息</div>
      </div>
      <MedicineRiskTip
        v-if="medicineRiskTip"
        :title="medicineRiskTip.title"
        :level="medicineRiskTip.level"
        :level-label="medicineRiskTip.levelLabel"
        :warnings="medicineRiskTip.warnings"
        :legend-items="prescriptionRiskLegendItems"
        :message="medicineRiskTip.message"
        :suggestion="medicineRiskTip.suggestion"
        :active-medicine-index="medicineRiskTip.activeMedicineIndex"
        :hidden="!showMedicineRiskTip"
        @close="hideMedicineRiskTip"
      />
    </div>
    </div>

    <div :class="['prescription-actions', { 'consultation-actions': consultation, 'prescription-actions--readonly': readonly }]">
      <span v-if="readonly" class="prescription-actions__hint">已封存，仅支持查看</span>
      <label v-else-if="!consultation" class="prescription-remark-field">
        <span class="prescription-remark-field__label">处方备注：</span>
        <span class="prescription-remark-combobox">
          <input
            v-model="prescriptionRemark"
            class="jh-input-field jh-input-field--lg diagnosis-select prescription-remark-select prescription-remark-input"
            type="text"
            aria-label="处方备注"
            :aria-expanded="prescriptionRemarkOpen"
            autocomplete="off"
            placeholder="请选择"
            @focus="openPrescriptionRemark"
            @input="openPrescriptionRemark"
            @blur="deferClosePrescriptionRemark"
          />
          <span
            ref="prescriptionRemarkOptionsRoot"
            class="prescription-remark-options jh-custom-scroll"
            role="listbox"
            :hidden="!prescriptionRemarkOpen"
          >
            <span class="jh-custom-scroll__viewport">
              <span class="jh-custom-scroll__content">
                <button
                  v-for="option in filteredPrescriptionRemarkOptions"
                  :key="option"
                  class="prescription-remark-option"
                  type="button"
                  role="option"
                  :data-prescription-remark="option"
                  @pointerdown.prevent.stop="selectPrescriptionRemark(option)"
                >
                  {{ option }}
                </button>
              </span>
            </span>
            <span class="jh-custom-scroll__bar" aria-hidden="true">
              <span class="jh-custom-scroll__thumb"></span>
            </span>
          </span>
        </span>
      </label>
      <div class="prescription-actions__controls">
        <button v-if="readonly" class="jh-btn jh-btn--md jh-btn--primary prescription-history-open" type="button" @click="emit('open-history')">查看开方历史</button>
        <button v-else-if="consultation" class="jh-btn jh-btn--md jh-btn--primary end-consult-trigger consultation-complete-trigger" type="button" @click="store.consultConfirmKind = 'end'">完成问诊</button>
        <template v-else>
          <button class="jh-btn jh-btn--md jh-btn--success end-consult-trigger" type="button" :disabled="!canEndConsultationEnabled" @click="store.consultConfirmKind = 'end'">结束问诊</button>
          <span v-if="isVideoSubmitLocked" class="video-prescription-submit-wrap">
            <span class="video-submit-countdown" data-video-submit-countdown :data-remaining="String(videoSubmitRemaining)" aria-live="polite">
              <el-icon class="video-submit-countdown__icon"><Clock /></el-icon>
              <span class="video-submit-countdown__value">{{ videoSubmitRemaining }}s</span>
            </span>
            <button class="jh-btn jh-btn--md jh-btn--primary jh-prescription-submit" type="button" disabled>提交处方</button>
          </span>
          <button v-else class="jh-btn jh-btn--md jh-btn--primary jh-prescription-submit" type="button" :disabled="record?.prescriptionSubmitted" @click="requestPrescriptionSubmit">提交处方</button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from "vue";
import { Clock } from "@element-plus/icons-vue";
import { videoPrescriptionSubmitLockSeconds } from "@/domain/consultationRules";
import { getHighestMedicineRiskLevel, getMedicineRiskWarnings, prescriptionRiskLegendItems, prescriptionRiskLevels, getPrescriptionRiskCategoryLevel } from "@/domain/prescriptionRisk";
import { canEndConsultation, hasUnresolvedMustPrescriptionWarnings } from "@/application/controllers/prescriptionController";
import { resetFloatingScrollList, syncCustomScrollList, syncFloatingScrollList } from "@/presentation/ui/customScrollList.js";
import { appService } from "@/services/appService";
import { useAppStore } from "@/stores/app";
import { MedicineRiskTip, assetUrl } from "@jiahong/ui";

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
  },
  selectPresentationVariant: {
    type: String,
    default: "",
    validator: (value) => ["", "a", "b"].includes(value)
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
const openMedicineFieldKey = ref("");
const medicineFieldMenuStyle = ref({});
const activeRiskMedicineIndex = ref("");
const medicineRiskTipDismissed = ref(false);
const videoSubmitRemaining = ref(0);
const prescriptionRemark = ref("");
const prescriptionRemarkOpen = ref(false);
const diagnosisOptionsRoot = ref(null);
const medicineOptionsRoot = ref(null);
const medicineSearchInput = ref(null);
const prescriptionRemarkOptionsRoot = ref(null);
let diagnosisRequestSerial = 0;
let medicineRequestSerial = 0;
let videoSubmitTimer = 0;
const medicineUnitOptions = ["盒", "瓶", "支", "袋", "板", "片"];
const medicineFieldOptions = {
  spec: ["0.125g*6片", "0.25g*6片", "0.5g*6片", "0.125g*12片", "0.25g*12片", "10ml*6支", "100ml/瓶", "5g*10袋", "10g*10袋"],
  usage: [
    "口服",
    "口嚼",
    "口腔吸入",
    "口腔粘膜贴服",
    "口服（首剂加倍）",
    "必要时口服",
    "口服或外用涂敷患处",
    "口服或咀嚼",
    "打碎后口服",
    "空腹或进餐后口服",
    "口含",
    "吞服，或用水分散后",
    "加水分散后口服",
    "口腔黏膜注射",
    "性生活前1小时口服",
    "性生活前30分钟口服",
    "餐前30分钟口服",
    "餐前1小时口服",
    "餐时口服",
    "清晨空腹口服",
    "睡前1小时口服",
    "喷口",
    "餐前15分钟口服",
    "餐后2小时口服",
    "月经第1-14日口服",
    "口服（首次服用0.4g）",
    "餐后1小时口服",
    "晚饭后口服"
  ],
  frequency: ["1次/日", "2次/日", "3次/日", "4次/日", "1-2次/日", "2-3次/日", "每日早晚", "每晚1次", "饭前服用", "饭后服用", "必要时", "按需", "单次"],
  dose: ["0.25毫克", "0.5片", "1片", "2片", "1粒", "2粒", "0.5袋", "1袋", "2袋", "5ml", "10ml", "15ml", "1吸", "1滴", "适量", "薄涂", "每侧鼻孔2喷"]
};
const selectAUsageColumnSizes = [10, 10, 8];
const prescriptionRemarkOptions = [
  "益生菌需与抗生素间隔两小时使用",
  "蒙脱石散需与其它药前后间隔两小时使用",
  "联合用药中的补充用药",
  "为老人带药",
  "处方中儿童药品为15岁孩子带药",
  "按疗程使用",
  "微信支付",
  "现金支付",
  "支付宝支付",
  "阿托伐他汀需与其它药物分开使用",
  "其他"
];
const warningFieldColumns = {
  frequency: "3",
  dose: "3",
  quantity: "3",
  unit: "3",
  usage: "4"
};
const warningFieldCategories = {
  name: "重复用药",
  frequency: "用法用量",
  dose: "用法用量",
  quantity: "用法用量",
  unit: "用法用量",
  usage: "给药途径"
};
const medicineRelationRiskCategories = new Set(["重复用药", "相互作用", "配伍"]);
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
const filteredPrescriptionRemarkOptions = computed(() => {
  const keyword = prescriptionRemark.value.trim();
  if (!keyword) return prescriptionRemarkOptions;
  return prescriptionRemarkOptions.filter((option) => option.includes(keyword));
});

function refreshOptionScrollbars() {
  nextTick(() => {
    syncCustomScrollList(diagnosisOptionsRoot.value);
    if (medicineOpen.value && medicineOptions.value.length) {
      syncFloatingScrollList(medicineOptionsRoot.value, medicineSearchInput.value, { gap: 4, width: 320 });
    } else {
      resetFloatingScrollList(medicineOptionsRoot.value);
    }
    syncCustomScrollList(prescriptionRemarkOptionsRoot.value);
  });
}

watch(
  [diagnosisOptions, diagnosisOpen, medicineOptions, medicineOpen, filteredPrescriptionRemarkOptions, prescriptionRemarkOpen],
  refreshOptionScrollbars,
  { deep: true }
);

onMounted(() => {
  refreshOptionScrollbars();
  window.addEventListener("resize", repositionOpenMedicineMenus);
  document.addEventListener("scroll", repositionOpenMedicineMenus, true);
});

onBeforeUnmount(() => {
  resetFloatingScrollList(medicineOptionsRoot.value);
  window.removeEventListener("resize", repositionOpenMedicineMenus);
  document.removeEventListener("scroll", repositionOpenMedicineMenus, true);
});

onBeforeUnmount(clearVideoSubmitTimer);

const riskMedicines = computed(() => medicines.value.filter((medicine) => hasMedicineWarnings(medicine)));
const defaultRiskMedicine = computed(() => riskMedicines.value[0] || null);
const activeRiskMedicine = computed(() => {
  const activeIndex = String(activeRiskMedicineIndex.value || "");
  return riskMedicines.value.find((medicine) => String(medicine.index || "") === activeIndex) || defaultRiskMedicine.value;
});
const medicineRiskTip = computed(() => {
  const medicine = activeRiskMedicine.value;
  if (props.readonly || !medicine) return null;
  const level = medicineWarningLevel(medicine);
  return {
    title: `药品风险提示 · ${medicine.name || "当前药品"}`,
    level,
    levelLabel: prescriptionRiskLevels[level] || "",
    warnings: getMedicineRiskWarnings(medicine),
    message: medicineWarningMessage(medicine),
    suggestion: medicineWarningSuggestion(medicine),
    activeMedicineIndex: medicine.index || ""
  };
});
const showMedicineRiskTip = computed(() => Boolean(medicineRiskTip.value && !medicineRiskTipDismissed.value));
const hasMustRiskWarnings = computed(() => hasUnresolvedMustPrescriptionWarnings(props.record));
const canEndConsultationEnabled = computed(() => canEndConsultation(props.record));
const isVideoSubmitLocked = computed(() => Boolean(props.videoSubmitLock && !props.record?.prescriptionSubmitted && videoSubmitRemaining.value > 0));

function clearVideoSubmitTimer() {
  if (!videoSubmitTimer) return;
  window.clearInterval(videoSubmitTimer);
  videoSubmitTimer = 0;
}

function stopVideoSubmitCountdown() {
  clearVideoSubmitTimer();
  videoSubmitRemaining.value = 0;
}

function startVideoSubmitCountdown() {
  clearVideoSubmitTimer();
  videoSubmitRemaining.value = videoPrescriptionSubmitLockSeconds;
  videoSubmitTimer = window.setInterval(() => {
    videoSubmitRemaining.value = Math.max(0, videoSubmitRemaining.value - 1);
    if (videoSubmitRemaining.value <= 0) {
      clearVideoSubmitTimer();
    }
  }, 1000);
}

watch(
  () => [props.record?.id, props.videoSubmitLock, props.record?.prescriptionSubmitted],
  ([recordId, locked, submitted]) => {
    if (!recordId || !locked || submitted) {
      stopVideoSubmitCountdown();
      return;
    }
    startVideoSubmitCountdown();
  },
  { immediate: true }
);


watch(
  () => props.record?.id,
  () => {
    medicineRiskTipDismissed.value = false;
    activeRiskMedicineIndex.value = defaultRiskMedicine.value?.index || "";
  },
  { immediate: true }
);

watch(riskMedicines, (rows) => {
  if (!rows.length) {
    activeRiskMedicineIndex.value = "";
    return;
  }
  if (!rows.some((medicine) => String(medicine.index || "") === String(activeRiskMedicineIndex.value || ""))) {
    activeRiskMedicineIndex.value = rows[0].index || "";
  }
});

watchEffect(() => {
  selectedDiagnosis.value = diagnosisTags.value[0] || "";
  treatmentAdvice.value = props.record?.treatmentAdvice || "";
});

function warningFields(medicine = {}) {
  return new Set(Array.isArray(medicine.warningFields) ? medicine.warningFields : []);
}

function hasMedicineWarnings(medicine = {}) {
  return getMedicineRiskWarnings(medicine).length > 0;
}

function medicineWarningLevel(medicine = {}) {
  return getHighestMedicineRiskLevel(medicine);
}

function medicineWarningLevelLabel(medicine = {}) {
  return prescriptionRiskLevels[medicineWarningLevel(medicine)] || "";
}

function medicineWarningCategories(medicine = {}) {
  return getMedicineRiskWarnings(medicine).map((warning) => warning.category);
}

function medicineWarningMessage(medicine = {}) {
  return hasMedicineWarnings(medicine) ? medicine.warningMessage || `[警示信息]${medicine.name || "当前药品"}需完成风险核对` : "";
}

function medicineWarningSuggestion(medicine = {}) {
  return hasMedicineWarnings(medicine) ? medicine.warningSuggestion || "[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。" : "";
}

function medicineWarningRowClass(medicine = {}) {
  const level = medicineWarningLevel(medicine);
  return level ? ["medicine-table__row--warning-linked", `medicine-table__row--warning-${level}`] : [];
}

function isActiveRiskMedicine(medicine = {}) {
  return Boolean(showMedicineRiskTip.value && String(medicine.index || "") === String(activeRiskMedicine.value?.index || ""));
}

function shouldIgnoreMedicineRiskRowTarget(target) {
  return Boolean(target?.closest?.(".medicine-delete-btn, .medicine-usage-control, .medicine-unit-control"));
}

function selectRiskMedicine(medicine = {}, event) {
  if (props.readonly || !hasMedicineWarnings(medicine) || shouldIgnoreMedicineRiskRowTarget(event?.target)) return;
  activeRiskMedicineIndex.value = medicine.index || "";
  medicineRiskTipDismissed.value = false;
}

function hideMedicineRiskTip() {
  medicineRiskTipDismissed.value = true;
}

function clearMedicineWarningState(medicine = {}) {
  delete medicine.warningFields;
  delete medicine.warningColumns;
  delete medicine.riskWarnings;
  delete medicine.warningMessage;
  delete medicine.warningSuggestion;
}

function rebuildMedicineWarningsFromFields(medicine = {}, previousWarningColumns = {}) {
  const fields = Array.isArray(medicine.warningFields) ? medicine.warningFields : [];
  if (!fields.length) {
    clearMedicineWarningState(medicine);
    return;
  }
  medicine.warningColumns = fields.reduce((columns, field) => {
    const column = warningFieldColumns[field];
    if (!column) return columns;
    const category = warningFieldCategories[field];
    return { ...columns, [column]: previousWarningColumns[column] || getPrescriptionRiskCategoryLevel(category) };
  }, {});
  if (Array.isArray(medicine.riskWarnings)) {
    const remainingCategories = new Set(fields.map((field) => warningFieldCategories[field]).filter(Boolean));
    medicine.riskWarnings = medicine.riskWarnings.filter((warning) => remainingCategories.has(warning.category));
    if (!medicine.riskWarnings.length) delete medicine.riskWarnings;
  }
}

function warningMentionsAnotherMedicine(medicine = {}, list = []) {
  const warningText = `${medicine.warningMessage || ""} ${medicine.warningSuggestion || ""}`;
  if (!warningText.trim()) return true;
  return list.some((item) => item !== medicine && item.name && warningText.includes(item.name));
}

function resolvePrescriptionWarnings() {
  const list = medicines.value;
  list.forEach((medicine) => {
    const warnings = getMedicineRiskWarnings(medicine);
    if (!warnings.length) return;
    const remainingWarnings = warnings.filter((warning) => {
      if (!medicineRelationRiskCategories.has(warning.category)) return true;
      if (list.length < 2) return false;
      return warningMentionsAnotherMedicine(medicine, list);
    });
    if (remainingWarnings.length === warnings.length) return;
    if (!remainingWarnings.length) {
      clearMedicineWarningState(medicine);
      return;
    }
    medicine.riskWarnings = remainingWarnings;
  });
  if (!riskMedicines.value.length) {
    hideMedicineRiskTip();
    if (props.record) props.record.inlineRiskWarningVisible = false;
  }
}

function updateMedicineField(medicine = {}, field = "", value = "") {
  if (!medicine || !field) return;
  const previousValue = medicine[field] ?? "";
  const nextValue = String(value || "").trim();
  medicine[field] = nextValue;
  const fields = Array.isArray(medicine.warningFields) ? medicine.warningFields : [];
  const previousWarningColumns = medicine.warningColumns || {};
  if (fields.includes(field) && nextValue && nextValue !== previousValue) {
    medicine.warningFields = fields.filter((item) => item !== field);
    rebuildMedicineWarningsFromFields(medicine, previousWarningColumns);
  }
  resolvePrescriptionWarnings();
}

function removeMedicine(medicine = {}) {
  if (!props.record || !medicine?.name) return;
  props.record.prescriptionMedicines = medicines.value
    .filter((item) => item !== medicine && item.name !== medicine.name)
    .map((item, index) => ({ ...item, index: index + 1 }));
  resolvePrescriptionWarnings();
  store.showToast("药品已删除");
}

async function requestPrescriptionSubmit() {
  if (hasMustRiskWarnings.value) {
    store.showToast("存在必须处理的用药风险，请点击高亮药品行查看具体提示并完成修改");
    return;
  }
  await store.submitActivePrescription();
}

function warningClass(medicine, field) {
  if (field === "name") return "";
  if (!warningFields(medicine).has(field)) return "";
  const category = warningFieldCategories[field];
  const level = getPrescriptionRiskCategoryLevel(category);
  return `medicine-warning-target medicine-warning-target--${level}`;
}

function riskClass(risk) {
  return {
    高: "jh-risk-tag--high",
    低: "jh-risk-tag--low"
  }[risk] || "";
}

function medicineRiskTagLabel(medicine = {}) {
  const risk = String(medicine.risk || "").trim();
  return risk === "高" ? "高" : "低";
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

function openPrescriptionRemark() {
  prescriptionRemarkOpen.value = true;
}

function deferClosePrescriptionRemark() {
  window.setTimeout(() => {
    prescriptionRemarkOpen.value = false;
  }, 120);
}

function selectPrescriptionRemark(option) {
  prescriptionRemark.value = option;
  if (props.record) props.record.prescriptionRemark = option;
  prescriptionRemarkOpen.value = false;
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

function computeFixedMenuLeft(rect, menuWidth, align = "start") {
  const padding = 8;
  const maxLeft = Math.max(padding, window.innerWidth - menuWidth - padding);
  if (align === "end") {
    let left = rect.right - menuWidth;
    if (left < padding) {
      left = padding;
    } else if (left > maxLeft) {
      left = maxLeft;
    }
    return left;
  }
  if (align === "center") {
    let left = rect.left + (rect.width - menuWidth) / 2;
    if (left < padding) {
      left = padding;
    } else if (left + menuWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - menuWidth - padding);
    }
    return left;
  }
  return Math.max(padding, rect.left);
}

function computeMenuTop(rect, height) {
  const below = rect.bottom + 4;
  if (!height || below + height <= window.innerHeight - 8) return below;
  const above = rect.top - 4 - height;
  return above >= 8 ? above : Math.max(8, window.innerHeight - height - 8);
}

function computeMenuTopAbove(rect, height) {
  const above = rect.top - 4 - height;
  if (height && above >= 8) return above;
  return computeMenuTop(rect, height);
}

function correctMenuTopAfterRender(menuSelector, styleRef, topVarName, rect, resolveTop = computeMenuTop) {
  nextTick(() => {
    const menu = document.querySelector(menuSelector);
    if (!menu || !menu.offsetHeight) return;
    const next = `${resolveTop(rect, menu.offsetHeight)}px`;
    if (styleRef.value[topVarName] !== next) {
      styleRef.value = { ...styleRef.value, [topVarName]: next };
    }
  });
}

function estimateSelectAUnitMenuHeight() {
  const rows = Math.ceil(medicineUnitOptions.length / 2);
  return rows * 24 + (rows - 1) * 6 + 22;
}

function estimateSelectAFieldMenuHeight(field, optionCount) {
  const columnCount = getSelectPresentationAColumnCount(field, optionCount);
  const rows =
    field === "usage" && optionCount === medicineFieldOptions.usage.length
      ? Math.max(...selectAUsageColumnSizes)
      : Math.ceil(optionCount / Math.max(1, columnCount));
  return rows * 24 + 18;
}

function estimateSelectBFieldMenuHeight(optionCount) {
  return Math.min(250, Math.max(1, optionCount) * 24 + 16);
}

function applyUnitMenuStyle(rect, measuredHeight = 0) {
  const menuWidth = props.selectPresentationVariant === "a" ? 156 : 64;
  const left = props.selectPresentationVariant
    ? computeFixedMenuLeft(rect, menuWidth, "end")
    : Math.min(rect.right + 8, window.innerWidth - menuWidth - 8);
  const height = props.selectPresentationVariant === "a" ? measuredHeight || estimateSelectAUnitMenuHeight() : 0;
  const top = props.selectPresentationVariant ? computeMenuTop(rect, height) : Math.max(8, rect.top - 8);
  unitMenuStyle.value = {
    "--medicine-unit-menu-left": `${Math.max(8, left)}px`,
    "--medicine-unit-menu-top": `${top}px`,
    "--medicine-unit-menu-width": `${menuWidth}px`
  };
  if (props.selectPresentationVariant && !measuredHeight) {
    correctMenuTopAfterRender(".medicine-unit-options:not([hidden])", unitMenuStyle, "--medicine-unit-menu-top", rect);
  }
}

function applyMedicineFieldMenuStyle(rect, field, optionCount, measuredHeight = 0) {
  const menuWidth =
    props.selectPresentationVariant === "a"
      ? selectPresentationMenuWidth(field, optionCount)
      : props.selectPresentationVariant === "b"
        ? selectPresentationBMenuWidth(field)
        : Math.max(112, rect.width);
  const left =
    props.selectPresentationVariant === "a"
      ? computeFixedMenuLeft(rect, menuWidth, "start")
      : Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
  const columnCount = props.selectPresentationVariant === "a" ? getSelectPresentationAColumnCount(field, optionCount) : 1;
  const height =
    props.selectPresentationVariant === "a"
      ? measuredHeight || estimateSelectAFieldMenuHeight(field, optionCount)
      : props.selectPresentationVariant === "b"
        ? measuredHeight || estimateSelectBFieldMenuHeight(optionCount)
        : 0;
  const top =
    props.selectPresentationVariant === "a"
      ? computeMenuTop(rect, height)
      : props.selectPresentationVariant === "b"
        ? computeMenuTopAbove(rect, height)
        : Math.max(8, rect.bottom + 4);
  medicineFieldMenuStyle.value = {
    "--medicine-usage-menu-left": `${left}px`,
    "--medicine-usage-menu-top": `${top}px`,
    "--medicine-usage-menu-width": `${menuWidth}px`,
    "--medicine-usage-menu-columns": String(columnCount)
  };
  if ((props.selectPresentationVariant === "a" || props.selectPresentationVariant === "b") && !measuredHeight) {
    const resolver = props.selectPresentationVariant === "b" ? computeMenuTopAbove : computeMenuTop;
    correctMenuTopAfterRender(".medicine-usage-options:not([hidden])", medicineFieldMenuStyle, "--medicine-usage-menu-top", rect, resolver);
  }
}

function repositionOpenMedicineMenus() {
  const unitTrigger = document.querySelector('.medicine-unit-select[aria-expanded="true"]');
  if (unitTrigger && openUnitIndex.value) {
    const openUnitMenu = document.querySelector(".medicine-unit-options:not([hidden])");
    applyUnitMenuStyle(unitTrigger.getBoundingClientRect(), openUnitMenu?.offsetHeight || 0);
  }
  const fieldInput = document.querySelector('.medicine-usage-input[aria-expanded="true"]');
  if (fieldInput && openMedicineFieldKey.value) {
    const field = fieldInput.dataset.medicineField || "usage";
    const options = getMedicineFieldOptions(field, fieldInput.value);
    const openFieldMenu = document.querySelector(".medicine-usage-options:not([hidden])");
    applyMedicineFieldMenuStyle(fieldInput.getBoundingClientRect(), field, options.length, openFieldMenu?.offsetHeight || 0);
  }
}

function toggleUnitMenu(medicine, event) {
  if (!medicine) return;
  openMedicineFieldKey.value = "";
  if (openUnitIndex.value === medicine.index) {
    openUnitIndex.value = "";
    return;
  }
  applyUnitMenuStyle(event.currentTarget.getBoundingClientRect());
  openUnitIndex.value = medicine.index;
}

function setMedicineUnit(medicine, unit) {
  if (!medicine) return;
  updateMedicineField(medicine, "unit", unit);
  openUnitIndex.value = "";
}

function medicineFieldKey(medicine, field) {
  return `${medicine?.index || ""}-${field}`;
}

function isMedicineFieldOpen(medicine, field) {
  return openMedicineFieldKey.value === medicineFieldKey(medicine, field);
}

function openMedicineFieldMenu(medicine, field, event) {
  if (!medicine || !field) return;
  openUnitIndex.value = "";
  openMedicineFieldKey.value = medicineFieldKey(medicine, field);
  const options = getMedicineFieldOptions(field, medicine[field] || "");
  applyMedicineFieldMenuStyle(event.currentTarget.getBoundingClientRect(), field, options.length);
}

function getSelectPresentationAColumnCount(field, optionCount = 0) {
  if (field === "usage") {
    if (optionCount === medicineFieldOptions.usage.length) return 3;
    if (optionCount > 12) return 3;
    if (optionCount > 6) return 2;
    return 1;
  }
  return optionCount > 12 ? 3 : 2;
}

function getSelectPresentationAColumns(field, options = []) {
  if (field === "usage") {
    const fullList = medicineFieldOptions.usage;
    const isFullList =
      options.length === fullList.length && options.every((option, index) => option === fullList[index]);
    if (isFullList) {
      let start = 0;
      return selectAUsageColumnSizes
        .map((size) => {
          const column = fullList.slice(start, start + size);
          start += size;
          return column;
        })
        .filter((column) => column.length);
    }
  }
  const columnCount = getSelectPresentationAColumnCount(field, options.length);
  const columnSize = Math.ceil(options.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) => options.slice(index * columnSize, (index + 1) * columnSize)).filter(
    (column) => column.length
  );
}

function selectPresentationMenuWidth(field, optionCount = 0) {
  const columnCount = getSelectPresentationAColumnCount(field, optionCount);
  return columnCount * 120 + Math.max(0, columnCount - 1) * 9 + 16;
}

function renderSelectPresentationAOption(option, value, medicine, field) {
  return h(
    "button",
    {
      class: ["medicine-usage-option", { "is-active": option === value }],
      type: "button",
      role: "option",
      "aria-selected": option === value ? "true" : "false",
      "data-medicine-option": option,
      onPointerdown: (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectMedicineFieldOption(medicine, field, option);
      }
    },
    option
  );
}

function renderSelectPresentationAOptions(field, options, value, medicine) {
  const columns = getSelectPresentationAColumns(field, options);
  if (field === "usage") {
    return columns.flatMap((column, columnIndex) => {
      const nodes = [
        h(
          "div",
          { class: "medicine-usage-options__column" },
          column.map((option) => renderSelectPresentationAOption(option, value, medicine, field))
        )
      ];
      if (columnIndex < columns.length - 1) {
        nodes.push(h("span", { class: "medicine-usage-options__divider", "aria-hidden": "true" }));
      }
      return nodes;
    });
  }
  return options.map((option) => renderSelectPresentationAOption(option, value, medicine, field));
}

function selectPresentationBMenuWidth(field) {
  return {
    spec: 128,
    usage: 176,
    frequency: 96,
    dose: 96
  }[field] || 112;
}

function closeMedicineFieldMenu() {
  window.setTimeout(() => {
    openMedicineFieldKey.value = "";
  }, 120);
}

function selectMedicineFieldOption(medicine, field, option) {
  updateMedicineField(medicine, field, option);
  openMedicineFieldKey.value = "";
}

function getMedicineFieldOptions(field, value = "") {
  const keyword = String(value || "").trim();
  const baseOptions = medicineFieldOptions[field] || [];
  if (props.selectPresentationVariant === "a") {
    return baseOptions;
  }
  return Array.from(new Set([keyword, ...baseOptions].filter(Boolean)));
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
      const options = getMedicineFieldOptions(componentProps.field, value);
      const menuClass = [
        "medicine-usage-options",
        props.selectPresentationVariant === "a" ? "medicine-usage-options--flat" : "",
        props.selectPresentationVariant === "b" ? "medicine-usage-options--up" : "",
        `medicine-usage-options--${componentProps.field}`
      ];
      return h("div", { class: "medicine-usage-control" }, [
        h("input", {
          class: ["table-input medicine-edit-field medicine-usage-input", warningClass(componentProps.medicine, componentProps.field)],
          type: "text",
          value: componentProps.medicine[componentProps.field] || "",
          "aria-label": componentProps.label,
          "aria-haspopup": "listbox",
          "aria-expanded": String(isMedicineFieldOpen(componentProps.medicine, componentProps.field)),
          autocomplete: "off",
          "data-medicine-field": componentProps.field,
          onClick: (event) => openMedicineFieldMenu(componentProps.medicine, componentProps.field, event),
          onInput: (event) => updateMedicineField(componentProps.medicine, componentProps.field, event.target.value),
          onBlur: closeMedicineFieldMenu
        }),
        h(
          "div",
          {
            class: menuClass,
            role: "listbox",
            hidden: !isMedicineFieldOpen(componentProps.medicine, componentProps.field),
            style: medicineFieldMenuStyle.value
          },
          props.selectPresentationVariant === "a"
            ? renderSelectPresentationAOptions(componentProps.field, options, value, componentProps.medicine)
            : options.map((option) =>
                h("button", {
                  class: ["medicine-usage-option", { "is-active": option === value }],
                  type: "button",
                  role: "option",
                  "aria-selected": option === value ? "true" : "false",
                  "data-medicine-option": option,
                  onPointerdown: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    selectMedicineFieldOption(componentProps.medicine, componentProps.field, option);
                  }
                }, option)
              )
        )
      ]);
    };
  }
});
</script>
