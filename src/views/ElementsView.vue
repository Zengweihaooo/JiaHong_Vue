<template>
  <main class="elements-page">
    <aside class="elements-nav" aria-label="组件目录">
      <div class="elements-nav__brand">
        <strong>JH Elements</strong>
        <span>嘉虹医生端组件系统</span>
      </div>
      <nav>
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.name }}</a>
      </nav>
    </aside>

    <section class="elements-main" aria-label="组件总览">
      <header class="elements-hero">
        <p>Design System</p>
        <h1>嘉虹医生端 Elements</h1>
        <span>沉淀当前 Vue 工程中可复用的基础组件、业务状态组件和样式 token。</span>
      </header>

      <section id="foundations" class="elements-section">
        <div class="elements-section__head">
          <p>Foundation</p>
          <h2>基础变量</h2>
        </div>
        <div class="elements-token-grid">
          <article v-for="token in colorTokens" :key="token.name" class="elements-token">
            <span class="elements-token__swatch" :style="{ background: token.value }"></span>
            <strong>{{ token.name }}</strong>
            <code>{{ token.value }}</code>
          </article>
        </div>
      </section>

      <section id="buttons" class="elements-section">
        <div class="elements-section__head">
          <p>Actions</p>
          <h2>按钮 Button</h2>
        </div>
        <div class="elements-demo-row">
          <button class="jh-btn jh-btn--md jh-btn--primary" type="button">主要按钮</button>
          <button class="jh-btn jh-btn--md jh-btn--success" type="button">成功按钮</button>
          <button class="jh-btn jh-btn--md jh-btn--outline-secondary" type="button">次要按钮</button>
          <button class="jh-btn jh-btn--md jh-btn--danger" type="button">危险按钮</button>
          <button class="jh-btn jh-btn--md jh-btn--text" type="button">文字按钮</button>
        </div>
        <div class="elements-demo-row">
          <button class="jh-btn jh-btn--sm jh-btn--outline-primary" type="button">小按钮</button>
          <button class="jh-btn jh-btn--lg jh-btn--primary" type="button">大按钮</button>
          <button class="jh-btn jh-btn--md jh-btn--primary" type="button" disabled>禁用状态</button>
        </div>
        <code class="elements-code">class="jh-btn jh-btn--md jh-btn--primary"</code>
      </section>

      <section id="status" class="elements-section">
        <div class="elements-section__head">
          <p>Feedback</p>
          <h2>状态 Status</h2>
        </div>
        <div class="elements-demo-row">
          <StatusBadge status="online" />
          <StatusBadge status="busy" />
          <StatusBadge status="offline" />
          <ReadTag status="unread" />
          <ReadTag status="read" />
          <ReadTag status="read" text="已封存" />
        </div>
        <div class="elements-demo-row">
          <span class="jh-risk-tag jh-risk-tag--sm">高</span>
          <span class="jh-risk-tag jh-risk-tag--lg">迎检</span>
          <span class="jh-tag jh-tag--focus jh-tag--lg">中药</span>
          <span class="jh-tag jh-tag--light jh-tag--sm">默认</span>
        </div>
      </section>

      <section id="consultation" class="elements-section">
        <div class="elements-section__head">
          <p>Consultation</p>
          <h2>问诊业务组件</h2>
        </div>
        <div class="elements-demo-row">
          <DurationChip :seconds="180" />
          <DurationChip :seconds="930" />
          <DurationChip :seconds="1280" />
        </div>
        <div class="elements-message-demo">
          <button v-for="item in consultationTypes" :key="item.type" :class="['message-item', `message-item--${item.type}`]" type="button">
            <span class="message-item__stripe" aria-hidden="true"></span>
            <TypeIcon :type="item.type" />
            <span class="message-item__body">
              <span class="message-item__title">{{ item.title }}</span>
              <span class="message-item__preview">{{ item.preview }}</span>
            </span>
            <span v-if="item.badge" class="message-item__badge">{{ item.badge }}</span>
          </button>
        </div>
      </section>

      <section id="vouchers" class="elements-section">
        <div class="elements-section__head">
          <p>Evidence</p>
          <h2>复诊凭证 FollowUpVoucher</h2>
        </div>
        <div class="elements-voucher-demo">
          <FollowUpVoucher :record="followUpVoucherRecord" />
        </div>
        <code class="elements-code">&lt;FollowUpVoucher :record="record" /&gt;</code>
      </section>

      <section id="forms" class="elements-section">
        <div class="elements-section__head">
          <p>Inputs</p>
          <h2>表单输入</h2>
        </div>
        <div class="elements-form-grid">
          <label>
            <span>诊断输入</span>
            <input class="jh-input-field jh-input-field--lg diagnosis-select-input" type="text" placeholder="请选择诊断" aria-label="请选择诊断" />
          </label>
          <label>
            <span>处理意见</span>
            <textarea class="jh-input-field jh-input-field--lg consultation-treatment-input" placeholder="请输入治疗处理意见" aria-label="请输入治疗处理意见"></textarea>
          </label>
          <label>
            <span>搜索框</span>
            <span class="jh-search-field medicine-search">
              <span class="jh-search-field__icon" aria-hidden="true">
                <img :src="assetUrl('assets/search-icon.png')" alt="" />
              </span>
              <input type="text" placeholder="请输入药品名称或首字母做模糊查询" aria-label="请输入药品名称或首字母做模糊查询" />
            </span>
          </label>
        </div>
      </section>

      <section id="controls" class="elements-section">
        <div class="elements-section__head">
          <p>Controls</p>
          <h2>开关与选择</h2>
        </div>
        <div class="elements-demo-row">
          <button class="jh-switch is-on" type="button" aria-label="切换出诊状态" aria-pressed="true"></button>
          <button class="jh-switch" type="button" aria-label="切换出诊状态" aria-pressed="false"></button>
          <button class="user-menu-service is-selected" type="button" role="checkbox" aria-checked="true" data-service-key="text">
            <span class="jh-checkbox user-menu-service__check">
              <span class="jh-checkbox__icon" aria-hidden="true">
                <img class="jh-checkbox__mark" :src="assetUrl('assets/figma-home/checkmark.svg')" alt="" />
              </span>
              <span class="jh-checkbox__label user-menu-service__label">图文问诊</span>
            </span>
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import DurationChip from "@/components/common/DurationChip.vue";
import ReadTag from "@/components/common/ReadTag.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import TypeIcon from "@/components/common/TypeIcon.vue";
import FollowUpVoucher from "@/components/consultation/FollowUpVoucher.vue";
import { assetUrl } from "@/utils/assets";

const sections = [
  { id: "foundations", name: "基础变量" },
  { id: "buttons", name: "按钮" },
  { id: "status", name: "状态" },
  { id: "consultation", name: "问诊组件" },
  { id: "vouchers", name: "复诊凭证" },
  { id: "forms", name: "表单输入" },
  { id: "controls", name: "开关选择" }
];

const colorTokens = [
  { name: "--jh-color-primary", value: "#1677ff" },
  { name: "--jh-color-success", value: "#20b26b" },
  { name: "--jh-color-warning", value: "#f59e0b" },
  { name: "--jh-color-danger", value: "#e5484d" },
  { name: "--jh-color-text", value: "#1f2a37" },
  { name: "--jh-color-muted", value: "#6b7280" }
];

const consultationTypes = [
  { type: "video", title: "嘉虹健康视频问诊", preview: "患者等待视频接入", badge: 1 },
  { type: "text", title: "武汉市好药师大药房光谷店", preview: "患者补充了症状描述", badge: 2 },
  { type: "consult", title: "武汉市好药师大药房", preview: "图文咨询处理意见待填写", badge: 0 }
];

const followUpVoucherRecord = {
  id: "cs_20260519_164213_001",
  type: "text"
};
</script>
