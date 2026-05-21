import { assetUrl } from "../../shared/core.js";
import { renderButton } from "./primitives.js";

export function renderQuickReplyDialogView({ categories = [], messages = [] } = {}) {
  return `
    <div class="quick-reply-overlay" aria-hidden="true">
      <section class="quick-reply-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-reply-title">
        <header class="quick-reply-dialog__header">
          <h2 id="quick-reply-title">快捷用语</h2>
          <button class="quick-reply-dialog__close" type="button" aria-label="关闭快捷用语">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="quick-reply-dialog__body">
          <nav class="quick-reply-categories" aria-label="快捷回复分类">
            ${categories
              .map(
                (category, index) => `
                  <button class="quick-reply-category${index === 0 ? " is-active" : ""}" type="button">
                    ${category}
                  </button>`
              )
              .join("")}
          </nav>
          <div class="quick-reply-list" role="list">
            ${messages
              .map(
                (message) => `
                  <button class="quick-reply-message" type="button" role="listitem">
                    <span>${message}</span>
                  </button>`
              )
              .join("")}
          </div>
        </div>
        <footer class="quick-reply-dialog__footer">点击快捷用语填入输入框</footer>
      </section>
    </div>`;
}

const consultConfirmConfig = {
  cancel: {
    title: "取消问诊",
    message: "确定要取消本次问诊吗？取消后将退出当前会话，未保存内容不会保留。",
    confirmText: "确定取消"
  },
  end: {
    title: "结束问诊",
    message: "确定要结束本次问诊吗？结束后将无法继续与患者沟通。",
    confirmText: "确定结束"
  }
};

export function renderConsultConfirmDialogs() {
  return Object.entries(consultConfirmConfig)
    .map(
      ([kind, config]) => `
    <div class="consult-confirm-overlay" data-confirm-kind="${kind}" aria-hidden="true">
      <section
        class="consult-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="consult-confirm-title-${kind}"
        aria-describedby="consult-confirm-desc-${kind}"
      >
        <header class="consult-confirm-dialog__header">
          <h2 id="consult-confirm-title-${kind}">${config.title}</h2>
          <button type="button" class="consult-confirm-dialog__close" aria-label="关闭">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="consult-confirm-dialog__body">
          <p id="consult-confirm-desc-${kind}">${config.message}</p>
        </div>
        <footer class="consult-confirm-dialog__footer">
          ${renderButton({ text: "再想想", tone: "outline-secondary", size: "md", className: "consult-confirm-dismiss" })}
          ${renderButton({ text: config.confirmText, tone: "danger", size: "md", className: "consult-confirm-submit" })}
        </footer>
      </section>
    </div>`
    )
    .join("");
}

export function renderRiskWarningDialogView({ medicines = [] } = {}) {
  const legendItems = [
    { status: "must", label: "必须处理" },
    { status: "severe", label: "严重警告" },
    { status: "general", label: "一般警告" }
  ];
  const headers = [
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
  const rows = medicines.map((medicine, index) => ({
    name: medicine.name,
    warnings: index === 0 ? { 2: "must", 5: medicine.risk === "低" ? "general" : "severe" } : { 4: "general" }
  }));

  return `
    <div class="risk-warning-overlay" aria-hidden="true">
      <section class="risk-warning-dialog" role="dialog" aria-modal="true" aria-labelledby="risk-warning-title">
        <header class="risk-warning-dialog__header">
          <h2 id="risk-warning-title">风险检测提醒</h2>
          <button class="risk-warning-dialog__close" type="button" aria-label="关闭风险检测提醒">
            <img src="${assetUrl("assets/quick-reply-close.svg")}" alt="" />
          </button>
        </header>
        <div class="risk-warning-dialog__legend" aria-label="风险状态说明">
          ${legendItems
            .map(
              (item) => `
                <div class="risk-warning-legend-item">
                  <span class="risk-warning-legend-item__icon" aria-hidden="true">
                    <span class="risk-warning-status risk-warning-status--${item.status}"></span>
                  </span>
                  <span class="risk-warning-legend-item__label">${item.label}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="risk-warning-dialog__table-wrap">
          <div class="risk-warning-table" role="table" aria-label="风险检测提醒">
            <div class="risk-warning-row risk-warning-row--head" role="row">
              ${headers.map((header) => `<div class="risk-warning-cell" role="columnheader">${header}</div>`).join("")}
            </div>
            ${(rows.length ? rows : [{ name: "暂无用药数据", warnings: {} }])
              .map(
                (row) => `
                  <div class="risk-warning-row" role="row">
                    <div class="risk-warning-cell risk-warning-cell--name" role="cell">${row.name}</div>
                    ${headers
                      .slice(1)
                      .map((_, index) => {
                        const status = row.warnings[index + 1];
                        return `<div class="risk-warning-cell risk-warning-cell--status" role="cell">${
                          status ? `<span class="risk-warning-status risk-warning-status--${status}" aria-hidden="true"></span>` : ""
                        }</div>`;
                      })
                      .join("")}
                  </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="risk-warning-dialog__divider"></div>
        <div class="risk-warning-dialog__message-wrap">
          <div class="risk-warning-message">
            <p>[警示信息]${rows[0]?.name || "当前药品"}需完成风险核对</p>
            <p>[建议信息]请结合患者基础信息、过敏史和用药风险完成处方确认。</p>
          </div>
        </div>
      </section>
    </div>`;
}
