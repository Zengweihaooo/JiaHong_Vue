import { updateMedicineFieldInActiveRecord } from "../../application/controllers/prescriptionController.js";

let getPrescriptionContext = () => ({});

export function configureMedicineUnitBindings({ getContext } = {}) {
  getPrescriptionContext = typeof getContext === "function" ? getContext : () => ({});
}

function closeMedicineUnitDropdown(control) {
  const dropdown = control?.querySelector(".medicine-unit-options");
  const trigger = control?.querySelector(".medicine-unit-select");
  if (!dropdown || !trigger) return;
  dropdown.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

export function closeMedicineUnitDropdowns(exceptControl = null) {
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

function selectMedicineUnit(option) {
  const control = option.closest(".medicine-unit-control");
  const row = option.closest("[data-medicine-index]");
  const trigger = control?.querySelector(".medicine-unit-select");
  const unit = option.dataset.medicineUnit || "";
  updateMedicineFieldInActiveRecord(row?.dataset.medicineIndex, "unit", unit, getPrescriptionContext());
  if (trigger) {
    trigger.querySelector("span").textContent = unit;
  }
  control?.querySelectorAll(".medicine-unit-option").forEach((item) => {
    const active = item === option;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });
  closeMedicineUnitDropdown(control);
}

function bindMedicineUnitGlobalDismiss() {
  if (bindMedicineUnitGlobalDismiss.bound) return;
  bindMedicineUnitGlobalDismiss.bound = true;
  window.addEventListener("resize", () => closeMedicineUnitDropdowns());
  document.addEventListener("scroll", positionOpenMedicineUnitDropdowns, true);
}

export function bindMedicineUnitControls(panel) {
  bindMedicineUnitGlobalDismiss();

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
      selectMedicineUnit(option);
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
}
