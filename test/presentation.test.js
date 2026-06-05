import test from "node:test";
import assert from "node:assert/strict";

const repoRootPath = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function setupBrowserGlobals(pathname = "/room/", search = "") {
  globalThis.window = {
    JH_APP_VIEW: ""
  };
  globalThis.location = {
    pathname,
    search
  };
}

test("shared core infers app view, route path, query params, and app hrefs", async () => {
  setupBrowserGlobals(`${repoRootPath}/video/`, "?sessionId=cs_1&record=legacy");
  const core = await import("../src/shared/core.js?presentation-core");

  assert.equal(core.getCurrentRoutePath(), "/video");
  assert.equal(core.inferAppView(), "video");
  assert.equal(core.getQueryParam("sessionId"), "cs_1");
  assert.equal(core.getRecordParam(), "legacy");
  assert.equal(core.getSessionIdParam(), "cs_1");
  assert.equal(core.getTextHref("cs 2"), `${core.siteBasePath}/text/?sessionId=cs%202`);
  assert.equal(core.getHomeHref(), `${core.siteBasePath}/`);
  assert.equal(core.validAppViews.has("history"), true);
});

test("shared core falls back from sessionId to record for legacy links", async () => {
  setupBrowserGlobals(`${repoRootPath}/history/`, "?record=old_1");
  const core = await import("../src/shared/core.js?presentation-core-legacy");

  assert.equal(core.inferAppView(), "history");
  assert.equal(core.getSessionIdParam(), "old_1");
  assert.equal(core.getVideoHref(), `${core.siteBasePath}/video/`);
});

test("escapeHtml escapes markup-sensitive characters", async () => {
  const { escapeHtml } = await import("../src/presentation/ui/html.js");

  assert.equal(escapeHtml(`<button title="x&y">`), "&lt;button title=&quot;x&amp;y&quot;&gt;");
  assert.equal(escapeHtml(123), "123");
});

test("primitive components normalize invalid options and format durations", async () => {
  setupBrowserGlobals("/room/");
  const {
    formatDuration,
    getDoctorStatusLabel,
    renderButton,
    renderDurationChip,
    renderReadTag,
    renderRiskTag,
    renderStatusBadge,
    renderSwitch
  } = await import("../src/presentation/components/primitives.js?v=20260527-36");

  assert.equal(formatDuration(3661), "01:01:01");
  assert.equal(formatDuration(-10), "00:00:00");
  assert.match(renderButton({ text: "保存", tone: "unknown", size: "xl", type: "submit", disabled: true }), /jh-btn--primary/);
  assert.match(renderButton({ text: "保存", tone: "unknown", size: "xl", type: "submit", disabled: true }), /disabled/);
  assert.match(renderSwitch({ checked: true, label: "服务开关" }), /aria-pressed="true"/);
  assert.match(renderDurationChip("bad", 600), /jh-duration-chip--icon jh-duration-chip--danger/);
  assert.match(renderStatusBadge("invalid"), /jh-status-badge--online/);
  assert.equal(getDoctorStatusLabel("busy"), "忙碌");
  assert.equal(getDoctorStatusLabel("missing"), "离线");
  assert.match(renderReadTag("read"), /已读/);
  assert.match(renderRiskTag({ text: "高", size: "lg" }), /jh-risk-tag--high/);
  assert.equal(renderRiskTag({ text: "中", size: "sm" }), "");
});

test("video media toolbar reflects camera and microphone state", async () => {
  const { renderVideoToolbar, videoMediaState } = await import("../src/presentation/views/videoMedia.js");

  videoMediaState.cameraOn = false;
  videoMediaState.micOn = true;

  const html = renderVideoToolbar();

  assert.match(html, /data-video-action="toggle-camera"/);
  assert.match(html, /aria-label="开启摄像头"/);
  assert.match(html, /data-video-action="toggle-mic"/);
  assert.match(html, /aria-label="关闭麦克风"/);
});

test("quick entry cards escape user text and mark add/custom variants", async () => {
  setupBrowserGlobals("/");
  const { renderQuickCardMarkup } = await import("../src/presentation/components/quickEntryCards.js");

  const custom = renderQuickCardMarkup({
    title: `常用入口"<>`,
    desc: `查看&编辑`,
    icon: "calendar"
  });
  assert.match(custom, /quick-card--custom/);
  assert.match(custom, /data-custom-quick-entry="true"/);
  assert.match(custom, /常用入口&quot;&lt;&gt;/);
  assert.match(custom, /查看&amp;编辑/);

  const schedule = renderQuickCardMarkup({ title: "排班管理" });
  assert.match(schedule, /data-quick-feature="schedule"/);
  assert.match(schedule, /data-attention="unpunched-schedule"/);
  assert.match(schedule, /quick-card__attention-dot/);

  const add = renderQuickCardMarkup({ isAdd: true });
  assert.match(add, /quick-card--add/);
  assert.doesNotMatch(add, /quick-card__delete/);
});

test("home schedule panel renders latest H5 punch dialog structure", async () => {
  setupBrowserGlobals("/");
  const { renderScheduleDialog, renderSchedulePanel } = await import("../src/presentation/views/homeSchedulePanel.js?schedule-h5");

  const markup = renderSchedulePanel({ hidden: false, titleId: "schedule-title-test" });
  assert.match(markup, /今日排班/);
  assert.match(markup, /schedule-day-grid/);
  assert.match(markup, /6月3日/);
  assert.match(markup, /上午  00:00–12:00/);
  assert.match(markup, /下午  12:00–24:00/);
  assert.match(markup, /data-schedule-active-status="true"/);
  assert.match(markup, /schedule-panel__punch schedule-panel__punch--warning/);
  assert.match(markup, /data-punch-state="warning"/);
  assert.match(markup, /已打卡：/);
  assert.match(markup, /待打卡：/);
  assert.doesNotMatch(markup, /近期排班|schedule-board|schedule-panel__tabs/);

  const dialog = renderScheduleDialog();
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /id="schedule-dialog-title"/);
  assert.match(dialog, /schedule-overlay/);
});

test("medicine table renders empty, editable, readonly, escaped, and warning states", async () => {
  setupBrowserGlobals("/");
  const { renderMedicineTable, renderMedicineTableRow } = await import("../src/presentation/components/medicineTable.js");
  const row = {
    index: 1,
    name: `阿莫西林<胶囊>`,
    type: "处方药",
    spec: `0.25g*"24粒"`,
    usage: "口服",
    frequency: "3次/日",
    dose: "",
    quantity: "1",
    unit: "盒",
    risk: "中",
    warningFields: ["dose", "unit"]
  };

  assert.match(renderMedicineTable(), /暂无药品信息/);

  const editable = renderMedicineTableRow(row);
  assert.match(editable, /medicine-table__row--warning-linked/);
  assert.match(editable, /阿莫西林&lt;胶囊&gt;/);
  assert.match(editable, /0.25g\*&quot;24粒&quot;/);
  assert.match(editable, /data-medicine-field="dose"/);
  assert.match(editable, /medicine-delete-btn/);
  assert.match(editable, /data-warning-level="severe"/);
  assert.match(editable, /data-warning-categories="用法用量"/);

  const readonly = renderMedicineTable([row], true);
  assert.match(readonly, /medicine-table--single/);
  assert.doesNotMatch(readonly, /medicine-delete-btn/);
  assert.doesNotMatch(readonly, /<input class="table-input medicine-edit-field/);
});

test("prescription actions choose readonly, consultation, locked, and submitted controls", async () => {
  setupBrowserGlobals("/");
  const { renderPrescriptionActions } = await import("../src/presentation/components/prescriptionActions.js");

  assert.match(renderPrescriptionActions({ readonly: true }), /已封存，仅支持查看/);
  assert.match(renderPrescriptionActions({ readonly: true }), /查看开方历史/);
  assert.match(renderPrescriptionActions({ consultation: true }), /完成问诊/);

  const locked = renderPrescriptionActions({ videoSubmitLock: true, prescriptionSubmitted: false });
  assert.match(locked, /video-submit-countdown/);
  assert.match(locked, /data-remaining="10"/);
  assert.match(locked, /jh-prescription-submit" type="button" disabled/);

  const submitted = renderPrescriptionActions({ prescriptionSubmitted: true });
  assert.match(submitted, /结束问诊/);
  assert.match(submitted, /jh-prescription-submit" type="button" disabled/);
});

test("prescription form fields escape labels, placeholders, and diagnosis tags", async () => {
  setupBrowserGlobals("/");
  const {
    renderDiagnosisSelectInput,
    renderDiagnosisTags,
    renderMedicineSearchCombobox,
    renderPrescriptionRemarkSelect,
    renderSearchField,
    renderSelectField
  } = await import("../src/presentation/views/prescriptionFormFields.js");

  assert.match(renderSearchField({ placeholder: `药品"<>&`, disabled: true }), /placeholder="药品&quot;&lt;&gt;&amp;"/);
  assert.match(renderSearchField({ placeholder: `药品"<>&`, disabled: true }), /is-disabled/);
  assert.match(renderSelectField({ label: `请选择"<>&`, size: "bad", showChevron: false }), /jh-input-field--sm/);
  assert.match(renderSelectField({ label: `请选择"<>&`, size: "bad", showChevron: false }), /请选择&quot;&lt;&gt;&amp;/);
  assert.doesNotMatch(renderSelectField({ showChevron: false }), /jh-input-field__chevron/);
  assert.match(renderMedicineSearchCombobox(), /medicine-options" role="listbox" hidden/);
  assert.match(renderDiagnosisSelectInput(), /diagnosis-options" role="listbox" hidden/);
  assert.match(renderPrescriptionRemarkSelect(), /data-prescription-remark="益生菌需与抗生素间隔两小时使用"/);

  const editableTags = renderDiagnosisTags([`急性咽炎"<>&`]);
  assert.match(editableTags, /data-diagnosis-tag="急性咽炎&quot;&lt;&gt;&amp;"/);
  assert.match(editableTags, /aria-label="移除诊断：急性咽炎&quot;&lt;&gt;&amp;"/);

  const readonlyTags = renderDiagnosisTags(["急性咽炎"], true);
  assert.match(readonlyTags, /diagnosis-tag--readonly/);
  assert.doesNotMatch(readonlyTags, /diagnosis-tag__close/);
});

test("dialogs render escaped quick replies, cancel reasons, and structured risk warnings", async () => {
  setupBrowserGlobals("/");
  const {
    renderConsultConfirmDialogs,
    renderQuickReplyDialogView,
    renderRiskWarningDialogView
  } = await import("../src/presentation/components/dialogs.js");

  const quickReply = renderQuickReplyDialogView({
    categories: [`问候"<>&`],
    messages: [`您好"<>&`]
  });
  assert.match(quickReply, /问候&quot;&lt;&gt;&amp;/);
  assert.match(quickReply, /您好&quot;&lt;&gt;&amp;/);
  assert.doesNotMatch(quickReply, /问候"<>&/);

  const confirmDialogs = renderConsultConfirmDialogs();
  assert.match(confirmDialogs, /data-confirm-kind="cancel"/);
  assert.match(confirmDialogs, /取消问诊原因/);
  assert.match(confirmDialogs, /data-cancel-reason-group="medicine"/);
  assert.match(confirmDialogs, /data-confirm-kind="end"/);
  assert.match(confirmDialogs, /确定结束/);

  const riskDialog = renderRiskWarningDialogView({
    medicines: [
      {
        name: `阿莫西林"<>&`,
        risk: "高",
        warningColumns: { 3: "severe" },
        warningMessage: `[警示信息]剂量需核对"<>&`,
        warningSuggestion: "[建议信息]请补充剂量"
      }
    ]
  });
  assert.match(riskDialog, /阿莫西林&quot;&lt;&gt;&amp;/);
  assert.match(riskDialog, /risk-warning-row--linked/);
  assert.match(riskDialog, /risk-warning-status--severe/);
  assert.match(riskDialog, /data-copy-text="\[警示信息\]剂量需核对&quot;&lt;&gt;&amp;"/);
});

test("message list view groups records, escapes message text, shows badges, and locks inactive videos", async () => {
  setupBrowserGlobals("/room/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const {
    activeVideoConsultationState,
    dismissedMessageBadges,
    initRuntimeState
  } = await import("../src/application/state/runtimeState.js?v=20260528-06");

  const records = [
    {
      id: "video_1",
      type: "video",
      targetView: "video",
      state: "ongoing",
      time: "10:00",
      title: `视频患者"<>&`,
      preview: `咳嗽"<>&`,
      unreadCount: 3
    },
    {
      id: "video_2",
      type: "video",
      targetView: "video",
      state: "ongoing",
      time: "09:00",
      title: "另一位视频患者",
      preview: "发热",
      unreadCount: 2
    },
    {
      id: "text_1",
      type: "text",
      targetView: "text",
      state: "ongoing",
      time: "11:00",
      title: "图文患者",
      preview: "头痛",
      badge: 1
    }
  ];
  hydrateAppData({
    schemaVersion: 1,
    consultations: { records, ongoingChats: {} },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({ consultationRecords: records });
  activeVideoConsultationState.recordId = "video_1";
  dismissedMessageBadges.clear();

  const { renderMessageItem, renderMessageList, renderRoomSidebar } = await import(
    "../src/presentation/views/roomMessageListView.js?presentation-message-list"
  );

  const activeVideo = renderMessageItem(records[0], true, 0, "video_1");
  assert.match(activeVideo, /视频患者&quot;&lt;&gt;&amp;/);
  assert.match(activeVideo, /咳嗽&quot;&lt;&gt;&amp;/);
  assert.match(activeVideo, /message-item__current/);
  assert.doesNotMatch(activeVideo, /message-item__badge/);

  const lockedVideo = renderMessageItem(records[1], false, 1, "video_1");
  assert.match(lockedVideo, /data-video-locked="true"/);
  assert.match(lockedVideo, /message-item--compact/);
  assert.match(lockedVideo, /message-item__badge">2</);

  const list = renderMessageList({ state: "ongoing", activeRecord: "video_1" });
  assert.match(list, /data-message-group="video"/);
  assert.match(list, /data-message-group="text"/);

  const sidebar = renderRoomSidebar();
  assert.match(sidebar, /data-waiting-total>3</);
  assert.match(sidebar, /data-filter-state="ongoing"/);
});

test("chat view renders escaped AI replies, message bubbles, threads, and consult attachments", async () => {
  setupBrowserGlobals("/text/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const chatState = {
    text_1: {
      sessionDate: "2026-05-28 09:00:00",
      messages: [
        { id: "m1", from: "doctor", text: `请描述体温"<>&`, time: "2026-05-28 09:00:01", readStatus: "read" },
        { id: "m2", from: "patient", text: `37.8"<>&`, time: "2026-05-28 09:00:30" },
        { id: "m3", from: "doctor", text: "撤回内容", time: "2026-05-28 09:01:00", recalled: true }
      ]
    }
  };
  hydrateAppData({
    schemaVersion: 1,
    consultations: {
      records: [{ id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "09:00" }],
      ongoingChats: chatState
    },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });

  const {
    findOngoingChatMessage,
    renderAiReplyOptions,
    renderChatBubble,
    renderChatInput,
    renderChatMessageMenu,
    renderChatPanel,
    renderChatThread,
    renderConsultAttachmentDialog,
    renderConsultInfoCard
  } = await import("../src/presentation/views/chatView.js?presentation-chat");

  assert.match(renderChatInput({ className: "is-compact" }), /jh-chat-input is-compact/);
  assert.match(renderChatInput(), /jh-btn--sm[^"]*quick-reply-trigger/);
  assert.match(renderAiReplyOptions([{ text: `体温"<>&多久`, tag: `追问"<>&` }]), /data-reply-text="体温&quot;&lt;&gt;&amp;多久"/);
  assert.match(renderAiReplyOptions([{ text: `体温"<>&多久`, tag: `追问"<>&` }]), /jh-btn--ai-pill__keyword">体温</);
  assert.equal(findOngoingChatMessage("text_1", "m2").text, `37.8"<>&`);

  const doctorBubble = renderChatBubble(chatState.text_1.messages[0], {
    chat: chatState.text_1,
    index: 0,
    messages: chatState.text_1.messages
  });
  assert.match(doctorBubble, /请描述体温&quot;&lt;&gt;&amp;/);
  assert.match(doctorBubble, /chat-message__read-state--read/);

  const recalledBubble = renderChatBubble(chatState.text_1.messages[2], {
    chat: chatState.text_1,
    index: 2,
    messages: chatState.text_1.messages
  });
  assert.match(recalledBubble, /您撤回了一条消息/);
  assert.doesNotMatch(recalledBubble, /撤回内容/);

  const thread = renderChatThread("text_1", { threadClass: "video-chat-thread" });
  assert.match(thread, /class="video-chat-thread"/);
  assert.match(thread, /data-chat-key="text_1"/);

  const consultInfo = renderConsultInfoCard({
    type: "consult",
    consultInfo: {
      description: `颈部酸痛"<>&`,
      attachments: [`检查单"<>&`]
    }
  });
  assert.match(consultInfo, /颈部酸痛&quot;&lt;&gt;&amp;/);
  assert.match(consultInfo, /data-consult-attachment-title="检查单&quot;&lt;&gt;&amp;"/);
  assert.match(renderConsultAttachmentDialog(), /consult-attachment-overlay/);
  assert.match(renderChatMessageMenu(), /data-action="recall"/);
  const chatPanelMarkup = renderChatPanel("text_1", { record: { type: "text" } });
  assert.match(chatPanelMarkup, /chat-panel/);
  assert.match(chatPanelMarkup, /ai-reply__title ai-reply__toggle/);
  assert.match(chatPanelMarkup, /aria-label="展开智能推荐回复"/);
  assert.match(chatPanelMarkup, /aria-expanded="false"/);
  assert.match(chatPanelMarkup, /ai-reply__actions/);
  assert.match(chatPanelMarkup, /ai-reply__close/);
  assert.doesNotMatch(chatPanelMarkup, /ai-reply__hint|双击快捷回复展开或收起智能回复/);
});

test("render record selectors resolve active records, chat keys, ended records, and active video ids", async () => {
  setupBrowserGlobals("/video/", "?sessionId=text_1");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const {
    activeVideoConsultationState,
    initRuntimeState
  } = await import("../src/application/state/runtimeState.js?v=20260528-06");

  hydrateAppData({
    schemaVersion: 1,
    consultations: {
      records: [
        { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "09:00" },
        { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" },
        { id: "ended_1", type: "text", targetView: "text", state: "ended", time: "11:00" }
      ],
      ongoingChats: {
        text_1: { messages: [] }
      }
    },
    navigation: { menuGroups: [] },
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    services: [],
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({
    consultationRecords: [
      { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "09:00" },
      { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:00" }
    ]
  });
  activeVideoConsultationState.recordId = "video_1";

  const selectors = await import("../src/presentation/views/renderRecordSelectors.js?presentation-selectors");

  assert.equal(selectors.getDefaultOngoingRenderRecord("room").id, "video_1");
  assert.equal(selectors.getDefaultOngoingRenderRecord("text").id, "text_1");
  assert.equal(selectors.getDefaultEndedRenderRecord().id, "ended_1");
  assert.equal(selectors.getActiveConsultationRecord("video").id, "text_1");
  assert.equal(selectors.getActiveChatKey(), "text_1");
  assert.equal(selectors.getActiveVideoConsultationRecordId("text_1"), "video_1");
});

test("home view renders waiting counts, service switches, notices, quick entries, and schedule dialog", async () => {
  setupBrowserGlobals("/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const { initRuntimeState } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  const records = [
    { id: "video_1", type: "video", targetView: "video", state: "ongoing", time: "10:00" },
    { id: "text_1", type: "text", targetView: "text", state: "ongoing", time: "10:01" },
    { id: "consult_1", type: "consult", targetView: "consult", state: "ongoing", time: "10:02" }
  ];
  hydrateAppData({
    schemaVersion: 1,
    doctor: { status: "online" },
    consultations: { records, ongoingChats: {} },
    services: [
      { key: "text", label: "图文问诊", enabled: true },
      { key: "video", label: "视频问诊", enabled: false }
    ],
    home: {
      quickActions: [
        { title: "排班管理", desc: "查看排班", icon: "calendar" },
        { title: "新增入口", desc: "添加快捷入口", icon: "plus", isAdd: true }
      ],
      quickEntryOptions: [{ title: "处方记录", desc: "查看记录", icon: "document" }],
      announcements: [
        {
          id: "notice_1",
          title: "系统维护通知",
          content: "第一行\n第二行\n第三行",
          date: "2026-05-28",
          publisher: "运营中心",
          unread: true
        },
        {
          id: "notice_2",
          title: "已读公告",
          content: "公告摘要",
          date: "2026-05-27",
          publisher: "运营中心",
          unread: false
        }
      ]
    },
    navigation: { menuGroups: [] },
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({
    services: [
      { key: "text", enabled: true },
      { key: "video", enabled: false }
    ],
    consultationRecords: records,
    doctor: { status: "online" }
  });

  const {
    renderAnnouncementDialog,
    renderAnnouncementListDialog,
    renderConsultCard,
    renderMain,
    renderScheduleDialog,
    renderQuickActions,
    renderQuickEntryDialog,
    renderServiceCard,
    renderWaitingCard,
    normalizeQuickActions
  } = await import("../src/presentation/views/homeView.js?presentation-home");

  assert.match(renderWaitingCard(), /data-waiting-total>3</);
  assert.match(renderWaitingCard(), /data-waiting-type="video">1</);
  assert.match(renderConsultCard(), /consult-card--has-queue/);
  assert.match(renderConsultCard(), /consult-card__bg/);

  const serviceCard = renderServiceCard();
  assert.match(serviceCard, /jh-status-badge--online/);
  assert.match(serviceCard, /data-service-key="text"/);
  assert.match(serviceCard, /aria-checked="true"/);
  assert.match(serviceCard, /data-service-key="video"/);
  assert.match(serviceCard, /aria-checked="false"/);

  assert.match(renderAnnouncementDialog(), /系统维护通知/);
  assert.match(renderAnnouncementListDialog(), /历史公告/);
  assert.match(renderAnnouncementListDialog(), /announcement-list-item__unread-dot/);
  assert.doesNotMatch(renderAnnouncementListDialog(), /announcement-list-item__tag|jh-read-tag--read|jh-read-tag--unread/);
  assert.match(renderQuickEntryDialog(), /data-option-index="0"/);
  assert.match(renderQuickEntryDialog(), /处方记录/);
  assert.match(renderQuickEntryDialog(), /quick-entry-dialog__empty/);
  assert.match(renderQuickActions(), /data-quick-feature="schedule"/);
  assert.match(renderQuickActions(), /quick-card__attention-dot/);
  assert.doesNotMatch(renderQuickActions(), /schedule-panel/);
  assert.match(renderScheduleDialog(), /schedule-overlay/);
  assert.match(renderScheduleDialog(), /schedule-day-grid/);
  assert.deepEqual(normalizeQuickActions([{ title: "排班管理", desc: "查看排班", icon: "calendar" }]).at(-1), {
    title: "",
    desc: "添加快捷入口",
    icon: "plus",
    isAdd: true
  });
  assert.match(renderMain(), /copyright © 2017-2026/);
});

test("room shell renders menu, topbars, ordered user services, and empty room state", async () => {
  setupBrowserGlobals("/room/");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const { initRuntimeState } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  hydrateAppData({
    schemaVersion: 1,
    doctor: { status: "busy" },
    consultations: { records: [], ongoingChats: {} },
    navigation: {
      menuGroups: [
        {
          title: "工作台",
          items: [
            { label: "首页", icon: "home", active: true },
            { label: "订单", icon: "clipboard", active: false }
          ]
        }
      ]
    },
    services: [
      { key: "consult", label: "图文咨询", enabled: true },
      { key: "text", label: "图文问诊", enabled: false },
      { key: "video", label: "视频问诊", enabled: true },
      { key: "other", label: "其他服务", enabled: true }
    ],
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({
    services: [
      { key: "consult", enabled: true },
      { key: "text", enabled: false },
      { key: "video", enabled: true },
      { key: "other", enabled: true }
    ],
    doctor: { status: "busy" }
  });

  const {
    renderMenu,
    renderRoomMain,
    renderRoomTopbar,
    renderSidebar,
    renderTopbar,
    renderUserMenu
  } = await import("../src/presentation/views/roomShellView.js?presentation-room-shell");

  assert.match(renderMenu(), /menu-item is-active/);
  assert.match(renderMenu(), /data-menu="首页"/);
  assert.match(renderSidebar(), /aria-label="主菜单"/);
  assert.match(renderTopbar(), /证书到期时间/);
  assert.match(renderRoomTopbar(), /返回首页/);

  const userMenu = renderUserMenu();
  assert.match(userMenu, /jh-status-badge--busy/);
  assert.equal(userMenu.indexOf('data-service-key="text"') < userMenu.indexOf('data-service-key="video"'), true);
  assert.equal(userMenu.indexOf('data-service-key="video"') < userMenu.indexOf('data-service-key="consult"'), true);
  assert.doesNotMatch(userMenu, /data-service-key="other"/);
  assert.match(userMenu, /aria-checked="false"/);
  assert.match(userMenu, /aria-checked="true"/);
  assert.match(renderRoomMain(), /暂无待接诊订单/);
});

test("prescription panels render patient details, medicine risk tips, readonly history, and consultation advice", async () => {
  setupBrowserGlobals("/text/");
  const {
    renderConsultationPanel,
    renderPatientInfoGrid,
    renderPrescriptionPanel
  } = await import("../src/presentation/views/prescriptionPanels.js?v=20260528-06");
  const record = {
    id: "text_1",
    type: "text",
    patient: "王女士",
    patientGender: "女",
    age: "35岁",
    diagnosis: "急性咽炎",
    diagnosisTags: ["急性咽炎", "咳嗽"],
    prescriptionSubmitted: false,
    inlineRiskWarningVisible: true,
    patientDetail: {
      weight: "55",
      pregnancy: "否",
      phone: "13800138000",
      liverAbnormal: "无",
      idCard: "420100199001010000",
      kidneyAbnormal: "无",
      allergies: `青霉素"<>&`
    },
    prescriptionMedicines: [
      {
        index: 1,
        name: `阿莫西林"<>&`,
        type: "处方药",
        spec: "0.25g*24粒",
        usage: "口服",
        frequency: "3次/日",
        dose: "",
        quantity: "1",
        unit: "盒",
        risk: "中",
        warningFields: ["dose"],
        warningColumns: { 3: "severe" },
        warningMessage: `[警示信息]剂量缺失"<>&`,
        warningSuggestion: "[建议信息]请补充剂量"
      }
    ]
  };

  assert.match(renderPatientInfoGrid(record.patientDetail), /青霉素&quot;&lt;&gt;&amp;/);

  const panel = renderPrescriptionPanel({ record, videoSubmitLock: true });
  assert.match(panel, /王女士&nbsp;&nbsp;女&nbsp;&nbsp;35岁&nbsp;&nbsp;55KG/);
  assert.match(panel, /data-medicine-risk-tip/);
  assert.match(panel, /药品风险提示 · 阿莫西林&quot;&lt;&gt;&amp;/);
  assert.match(panel, /medicine-risk-tip__level--severe/);
  assert.doesNotMatch(panel, /inline-risk-warning|has-inline-risk-warning/);
  assert.match(panel, /阿莫西林&quot;&lt;&gt;&amp;/);
  assert.match(panel, /剂量缺失&quot;&lt;&gt;&amp;/);
  assert.match(panel, /video-submit-countdown/);

  const readonly = renderPrescriptionPanel({ readonly: true, record });
  assert.match(readonly, /prescription-panel--readonly/);
  assert.match(readonly, /已封存，仅支持查看/);
  assert.doesNotMatch(readonly, /medicine-search-combobox/);

  const consultation = renderConsultationPanel({
    record: {
      ...record,
      type: "consult",
      diagnosisTags: ["颈部咨询", "颈肩筋膜炎"],
      treatmentAdvice: `少低头"<>&`,
      prescriptionMedicines: []
    }
  });
  assert.doesNotMatch(consultation, /颈部咨询/);
  assert.match(consultation, /颈肩筋膜炎/);
  assert.match(consultation, /少低头&quot;&lt;&gt;&amp;/);
  assert.match(consultation, /data-medicine-risk-tip[\s\S]*hidden/);
  assert.match(consultation, /完成问诊/);
});

test("history view renders archived trace cards, readonly panels, and history page content", async () => {
  setupBrowserGlobals("/history/", "?sessionId=ended_1");
  const { hydrateAppData } = await import("../src/application/state/dataStore.js");
  const { initRuntimeState } = await import("../src/application/state/runtimeState.js?v=20260528-06");
  const record = {
    id: "ended_1",
    type: "video",
    typeLabel: "视频",
    targetView: "video",
    state: "ended",
    title: "视频复诊",
    patient: "赵先生",
    patientGender: "男",
    age: "48岁",
    time: "13:20",
    endedAt: "2026-05-28 13:20",
    diagnosis: "急性支气管炎",
    diagnosisTags: ["急性支气管炎"],
    prescriptionNo: "RX20260528001",
    prescriptionMedicines: [
      {
        index: 1,
        name: "头孢克肟胶囊",
        type: "处方药",
        spec: "0.1g*12粒",
        usage: "口服",
        frequency: "2次/日",
        dose: "0.1g",
        quantity: "1",
        unit: "盒",
        risk: "中"
      }
    ],
    trace: [{ label: "问诊结束", time: "13:20", detail: "医生完成视频问诊" }]
  };
  hydrateAppData({
    schemaVersion: 1,
    doctor: { status: "offline" },
    consultations: {
      records: [record],
      ongoingChats: {
        ended_1: {
          sessionDate: "2026-05-28",
          messages: [{ from: "patient", text: "咳嗽加重", time: "13:00" }]
        }
      }
    },
    navigation: { menuGroups: [] },
    services: [],
    home: { quickActions: [], quickEntryOptions: [], announcements: [] },
    quickReplies: { categories: [], messages: [] }
  });
  initRuntimeState({ consultationRecords: [record], doctor: { status: "offline" } });

  const {
    renderArchivedChatThread,
    renderArchivedConsultationPanel,
    renderHistoryPage,
    renderPrescriptionTraceCard,
    renderPrescriptionTraceMain,
    renderReadonlyPrescriptionPanel
  } = await import("../src/presentation/views/historyView.js?presentation-history");

  assert.match(renderArchivedChatThread(record), /咳嗽加重/);
  assert.match(renderArchivedConsultationPanel(record), /问诊已封存，仅支持回看/);
  assert.match(renderReadonlyPrescriptionPanel(record), /只读处方信息/);

  const traceCard = renderPrescriptionTraceCard(record);
  assert.match(traceCard, /data-history-record-id="ended_1"/);
  assert.match(traceCard, /视频问诊已结束/);
  assert.match(traceCard, /RX20260528001/);

  const traceMain = renderPrescriptionTraceMain(record);
  assert.match(traceMain, /历史问诊回看/);
  assert.match(traceMain, /结束时间：2026-05-28 13:20/);

  const page = renderHistoryPage({ quickReplyDialog: "<div>quick</div>", riskWarningDialog: "<div>risk</div>" });
  assert.match(page, /赵先生的处方留痕记录/);
  assert.match(page, /头孢克肟胶囊/);
  assert.match(page, /医生完成视频问诊/);
  assert.match(page, /<div>quick<\/div>/);
  assert.match(page, /<div>risk<\/div>/);
});
