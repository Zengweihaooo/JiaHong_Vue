import { getActiveConsultationRecord } from "../../application/controllers/consultationController.js";
import {
  addDiagnosisToActiveRecord,
  addMedicineToActiveRecord,
  getDiagnosisOptions,
  getMedicineOptions,
  removeDiagnosisFromActiveRecord,
  removeMedicineFromActiveRecord,
  updateMedicineFieldInActiveRecord
} from "../../application/controllers/prescriptionController.js";
import { renderConsultationPanel, renderPrescriptionPanel } from "../views/prescriptionPanels.js";
import { showToast } from "../ui/interactionPrimitives.js";

let getPrescriptionContext = () => ({});
let onPrescriptionPanelRendered = () => {};

export function configurePrescriptionEditorBindings({ getContext, onPanelRendered } = {}) {
  getPrescriptionContext = typeof getContext === "function" ? getContext : () => ({});
  onPrescriptionPanelRendered = typeof onPanelRendered === "function" ? onPanelRendered : () => {};
}

function refreshActivePrescriptionPanel(record = getActiveConsultationRecord(getPrescriptionContext())) {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || !record) return;
  const scrollTop = panel.scrollTop;
  const scrollBottom = panel.scrollHeight - panel.clientHeight - scrollTop;
  panel.outerHTML = record.type === "consult" ? renderConsultationPanel({ record }) : renderPrescriptionPanel({ record });
  onPrescriptionPanelRendered();
  const nextPanel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (nextPanel) {
    const restoreScroll = () => {
      nextPanel.scrollTop = scrollTop > 0
        ? Math.max(0, nextPanel.scrollHeight - nextPanel.clientHeight - scrollBottom)
        : 0;
    };
    restoreScroll();
    window.requestAnimationFrame(restoreScroll);
    window.setTimeout(restoreScroll, 0);
  }
}

async function renderDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.diagnosisRequestId = requestId;
  const context = getPrescriptionContext();
  const options = await getDiagnosisOptions(input.value, context);
  if (input.dataset.diagnosisRequestId !== requestId) return;
  dropdown.innerHTML = "";
  options.forEach((diagnosis) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "diagnosis-option";
    button.setAttribute("role", "option");
    button.textContent = diagnosis;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosis, context));
    });
    dropdown.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
}

function closeDiagnosisDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".diagnosis-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

async function renderMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  const requestId = `${Date.now()}-${Math.random()}`;
  input.dataset.medicineRequestId = requestId;
  const context = getPrescriptionContext();
  const options = await getMedicineOptions(input.value, context);
  if (input.dataset.medicineRequestId !== requestId) return;
  dropdown.innerHTML = "";
  options.forEach((medicine) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "medicine-option";
    button.setAttribute("role", "option");
    button.innerHTML = `<span>${medicine.name}</span><small>${medicine.spec}</small>`;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(addMedicineToActiveRecord(medicine, context));
    });
    dropdown.appendChild(button);
  });
  dropdown.hidden = options.length === 0;
  input.setAttribute("aria-expanded", String(options.length > 0));
}

function closeMedicineDropdown(input) {
  const panel = input.closest(".prescription-panel");
  const dropdown = panel?.querySelector(".medicine-options");
  if (!dropdown) return;
  dropdown.hidden = true;
  input.setAttribute("aria-expanded", "false");
}

function closeMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  dropdown.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function closeMedicineUnitDropdowns(exceptControl = null) {
  document.querySelectorAll(".medicine-unit-control").forEach((control) => {
    if (control !== exceptControl) closeMedicineUnitDropdown(control);
  });
}

function positionOpenMedicineUnitDropdowns() {
  document.querySelectorAll('.medicine-unit-select[aria-expanded="true"]').forEach((trigger) => {
    positionMedicineUnitDropdown(trigger.closest(".medicine-unit-control"));
  });
}

function positionMedicineUnitDropdown(control) {
  const trigger = control?.querySelector(".medicine-unit-select");
  const dropdown = control?.querySelector(".medicine-unit-options");
  if (!trigger || !dropdown) return;
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = dropdown.offsetWidth || 64;
  const left = Math.min(triggerRect.right + 8, window.innerWidth - menuWidth - 8);
  const top = Math.max(8, triggerRect.top - 8);
  dropdown.style.setProperty("--medicine-unit-menu-left", `${Math.max(8, left)}px`);
  dropdown.style.setProperty("--medicine-unit-menu-top", `${top}px`);
}

function openMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  closeMedicineUnitDropdowns(control);
  dropdown.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  positionMedicineUnitDropdown(control);
}

async function handlePrescriptionResult(resultOrPromise) {
  const result = await resultOrPromise;
  if (result?.record) {
    refreshActivePrescriptionPanel(result.record);
  }
  if (result?.message) {
    showToast(result.message);
  }
}

export function bindPrescriptionEditor() {
  const panel = document.querySelector(".prescription-panel:not(.prescription-panel--readonly)");
  if (!panel || panel.dataset.editorBound === "true") return;
  panel.dataset.editorBound = "true";

  panel.querySelectorAll(".diagnosis-tag__close-btn[data-diagnosis-tag]").forEach((button) => {
    const removeDiagnosis = (event) => {
      event.preventDefault();
      event.stopPropagation();
      handlePrescriptionResult(
        removeDiagnosisFromActiveRecord(button.dataset.diagnosisTag, getPrescriptionContext())
      );
    };
    button.addEventListener("pointerdown", removeDiagnosis);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  const diagnosisInput = panel.querySelector(".diagnosis-select-input");
  diagnosisInput?.addEventListener("focus", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("input", () => {
    renderDiagnosisDropdown(diagnosisInput);
  });
  diagnosisInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeDiagnosisDropdown(diagnosisInput), 0);
  });
  diagnosisInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    const diagnosisText = event.currentTarget.value.trim();
    if (!diagnosisText) return;
    handlePrescriptionResult(addDiagnosisToActiveRecord(diagnosisText, getPrescriptionContext()));
  });
  const medicineInput = panel.querySelector(".medicine-search input");
  medicineInput?.setAttribute("aria-expanded", "false");
  medicineInput?.addEventListener("focus", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("input", () => {
    renderMedicineDropdown(medicineInput);
  });
  medicineInput?.addEventListener("blur", () => {
    window.setTimeout(() => closeMedicineDropdown(medicineInput), 0);
  });
  medicineInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    handlePrescriptionResult(addMedicineToActiveRecord(event.currentTarget.value, getPrescriptionContext()));
  });
  if (!bindPrescriptionEditor.dropdownDismissBound) {
    bindPrescriptionEditor.dropdownDismissBound = true;
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".diagnosis-combobox")) {
        document.querySelectorAll(".diagnosis-select-input").forEach((input) => closeDiagnosisDropdown(input));
      }
      if (!event.target.closest(".medicine-search-combobox")) {
        document.querySelectorAll(".medicine-search input").forEach((input) => closeMedicineDropdown(input));
      }
      if (!event.target.closest(".medicine-unit-control")) {
        closeMedicineUnitDropdowns();
      }
    });
    window.addEventListener("resize", () => closeMedicineUnitDropdowns());
    document.addEventListener("scroll", positionOpenMedicineUnitDropdowns, true);
  }
  panel.querySelectorAll(".medicine-delete-btn").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const row = button.closest("[data-medicine-name]");
      handlePrescriptionResult(
        removeMedicineFromActiveRecord(row?.dataset.medicineName, getPrescriptionContext())
      );
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  panel.querySelectorAll(".medicine-unit-select").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const control = button.closest(".medicine-unit-control");
      const expanded = button.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMedicineUnitDropdown(control);
      } else {
        openMedicineUnitDropdown(control);
      }
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("keydown", (event) => {
      const control = button.closest(".medicine-unit-control");
      if (event.key === "Escape") {
        closeMedicineUnitDropdown(control);
        button.focus();
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-option.is-active, .medicine-unit-option")?.focus();
      }
    });
  });
  panel.querySelectorAll(".medicine-unit-option[data-medicine-unit]").forEach((option) => {
    option.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const control = option.closest(".medicine-unit-control");
      const row = option.closest("[data-medicine-index]");
      const trigger = control?.querySelector(".medicine-unit-select");
      const unit = option.dataset.medicineUnit || "";
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        "unit",
        unit,
        getPrescriptionContext()
      );
      if (trigger) {
        trigger.querySelector("span").textContent = unit;
      }
      control?.querySelectorAll(".medicine-unit-option").forEach((item) => {
        const active = item === option;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      closeMedicineUnitDropdown(control);
    });
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    option.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const control = option.closest(".medicine-unit-control");
        closeMedicineUnitDropdown(control);
        control?.querySelector(".medicine-unit-select")?.focus();
      }
    });
  });
  panel.querySelectorAll(".medicine-edit-field[data-medicine-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = input.closest("[data-medicine-index]");
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getPrescriptionContext()
      );
    });
    input.addEventListener("change", () => {
      const row = input.closest("[data-medicine-index]");
      updateMedicineFieldInActiveRecord(
        row?.dataset.medicineIndex,
        input.dataset.medicineField,
        input.value,
        getPrescriptionContext()
      );
    });
  });
}
