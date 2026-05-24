# 嘉虹医生端前端架构

## 目标

当前项目保持原生 HTML/CSS/JavaScript，不引入框架；架构上按生产前端的边界拆分，所有页面由 Mock API 数据驱动，避免业务数据散落在渲染代码里。

## 模块分层

当前采用四层结构，目录名直接表达职责边界：

- `script.js`：应用启动入口，负责串联初始化、渲染挂载和事件绑定。
- `src/shared/core.js`：跨层共享的轻量工具，包括路由识别、查询参数读取、页面跳转 URL、静态资源 URL。
- `src/domain/consultationStateMachine.js`：问诊领域状态机，集中约束流程流转。
- `src/domain/consultationQueue.js`：会话列表和待接诊队列的统一计算口径。
- `src/domain/archivedConsultation.js`：已结束问诊归档模型标准化，补齐历史聊天、操作留痕、诊断和处方编号回退值。
- `src/domain/prescriptionCatalog.js`：处方目录相关纯规则，目前只保留拼音排序比较器。
- `src/infrastructure/api/httpClient.js`：统一 JSON 请求封装。
- `src/infrastructure/api/mockApi.js`：Mock API 门面，模拟真实接口延迟和返回结构。
- `src/infrastructure/api/mockRuntimeState.js`：Mock API 运行态存储适配，集中读写医生状态、服务开关、会话列表和聊天缓存。
- `src/infrastructure/api/mockPatientReply.js`：Mock 病人自动回复生成器，集中按医生消息意图和病例上下文生成患者回复。
- `src/infrastructure/api/mockCatalogSearch.js`：Mock 疾病/药品目录搜索适配，封装拼音/首字母匹配和目录合并规则。
- `src/infrastructure/api/mockPinyinIndex.js`：Mock 目录搜索的本地拼音索引数据，不承载请求或搜索流程。
- `src/infrastructure/api/appApi.js`：应用 API facade，应用层只依赖这里；未来替换真实接口优先改这里。
- `src/infrastructure/browser/runtimeEnvironment.js`：浏览器运行环境适配器，集中提供 `sessionStorage` 和 navigation performance 访问的安全回退。
- `src/infrastructure/mocks/app-bootstrap.json`：页面启动所需 Mock 数据源。
- `src/infrastructure/mocks/local-clinical-catalog.json`：本地临床处方目录库，覆盖常见疾病和常用药，当前疾病/药品搜索的主数据源。
- `src/infrastructure/mocks/prescription-catalog.json`：疾病和药品候选目录 Mock 数据源。
- `src/infrastructure/mocks/nhsa-medicine-catalog.json`：从国家医保信息业务编码标准数据库动态维护公开查询页拉取的医保药品本地样本。
- `tools/fetch-nhsa-medicine-sample.mjs`：开发用医保药品样本同步脚本，按关键词从官方公开查询接口拉取小样本。
- `src/application/state/dataStore.js`：内存数据仓库和会话查询 selectors，只保存 API hydrate 后的数据，不写业务样例。
- `src/application/state/runtimeState.js`：运行态状态，例如服务开关、消息徽标、问诊状态机实例；浏览器存储访问经 infrastructure adapter。
- `src/application/store/appStore.js`：应用启动 store，负责拉取 bootstrap 数据并初始化运行态。
- `src/application/viewModels/renderViewModel.js`：渲染层只读 view model，集中暴露页面模板需要的数据和运行态快照，避免 presentation 直接读取 state 模块。
- `src/application/controllers/chatController.js`：聊天消息控制器，封装进行中聊天消息追加、查询和撤回。
- `src/application/controllers/consultationController.js`：问诊流程控制器，封装状态机事件、问诊结束/取消、处方状态同步和待接诊同步。
- `src/application/controllers/contentController.js`：公告和快捷入口读取控制器，避免交互层直接读取数据仓库。
- `src/application/controllers/prescriptionController.js`：处方编辑控制器，封装诊断/药品候选、增删改和去重规则。
- `src/application/controllers/realtimeController.js`：实时状态控制器，封装 Mock 快照、会话新增、状态机注册和队列同步。
- `src/application/controllers/runtimeController.js`：运行态控制器，封装医生状态和服务开关的本地状态与 API 同步。
- `src/presentation/render.js`：通用问诊/历史 HTML 渲染入口，负责页面级组合，输入来自 application view model，不直接发请求或操作 DOM。
- `src/presentation/views/renderRecordSelectors.js`：渲染专用记录选择器，集中处理路由 session、默认进行中/已结束记录和视频活跃会话 ID。
- `src/presentation/views/homeView.js`：首页视图模板，集中渲染候诊、服务、公告和高频操作入口。
- `src/presentation/views/roomShellView.js`：问诊室骨架视图模板，集中渲染顶部栏、服务开关、用户菜单和候诊室空态主区。
- `src/presentation/views/roomMessageListView.js`：问诊室会话侧栏模板，集中渲染筛选按钮、消息列表、未读徽标和视频会话锁定提示。
- `src/presentation/views/consultRoomView.js`：当前问诊视图模板，集中渲染图文/视频问诊主工作区、药房栏和视频聊天区域。
- `src/presentation/views/chatView.js`：聊天视图模板，集中渲染聊天输入、聊天气泡、智能回复、咨询信息卡片、消息菜单和附件预览。
- `src/presentation/views/historyView.js`：历史问诊视图模板，集中渲染开方留痕、归档聊天和只读处方面板。
- `src/presentation/views/prescriptionPanels.js`：处方和咨询处理面板模板，集中渲染患者信息、诊断、药品表格和处方操作。
- `src/presentation/views/prescriptionFormFields.js`：处方表单字段模板，集中渲染搜索框、诊断选择、诊断标签、备注下拉和通用选择按钮。
- `src/presentation/views/videoMedia.js`：视频问诊媒体控件模板和媒体开关 UI 状态。
- `src/presentation/interactions.js`：事件绑定和 DOM 响应，只把用户动作转交给 application controllers/render/ui 模块。
- `src/presentation/interactions/runtimeUiBindings.js`：运行态 UI 绑定，集中同步医生状态、服务开关、候诊数字、侧边栏和用户菜单。
- `src/presentation/interactions/homeInteractionBindings.js`：首页交互绑定，集中处理公告弹窗、快捷入口编辑、快捷卡片增删拖拽和首页问诊卡跳转。
- `src/presentation/interactions/homeQuickEntryBindings.js`：首页快捷入口绑定，集中处理快捷入口弹窗、卡片添加/编辑/删除和拖拽排序。
- `src/presentation/interactions/roomInteractionBindings.js`：问诊室交互绑定，集中处理消息列表刷新、会话切换、筛选、历史回看和房间服务开关。
- `src/presentation/interactions/consultWorkspaceBindings.js`：会诊工作区组合绑定，集中串联聊天输入、快捷回复、附件、处方提交和结束/取消问诊触发器。
- `src/presentation/interactions/dragScrollBindings.js`：可拖拽滚动容器绑定，复用在聊天、快捷回复和处方面板局部重渲染后。
- `src/presentation/interactions/consultDialogBindings.js`：问诊弹窗交互绑定，集中处理快捷回复、风险提醒、咨询附件预览和取消/结束问诊确认框。
- `src/presentation/interactions/chatBindings.js`：聊天输入、消息右键菜单、撤回/复制/引用和 Mock 患者回复绑定。
- `src/presentation/interactions/prescriptionEditorBindings.js`：处方编辑 DOM 绑定，集中处理诊断/药品搜索、用药单位选择、表格行编辑和处方面板局部刷新。
- `src/presentation/interactions/medicineUnitBindings.js`：药品单位下拉绑定，集中处理单位菜单定位、开关、键盘操作和单位字段同步。
- `src/presentation/interactions/videoControls.js`：视频问诊摄像头/麦克风 DOM 控制和本地媒体流绑定。
- `src/presentation/components/primitives.js`：基础 HTML 组件模板，例如按钮、开关、标签、状态徽标和计时 chip；不读取业务状态。
- `src/presentation/components/dialogs.js`：弹窗类 HTML 组件模板，例如快捷回复、问诊确认和风险检测提醒；由 `render.js` 注入页面数据。
- `src/presentation/ui/icons.js`：应用图标 HTML 模板。
- `src/presentation/ui/dom.js`：DOM 查询、局部替换和应用挂载等浏览器适配操作。
- `src/presentation/ui/interactionPrimitives.js`：交互层通用 DOM 原语，例如 toast、弹层开关和浮层菜单状态管理。
- `src/presentation/ui/localMedia.js`：浏览器摄像头和麦克风适配层，负责本地媒体流申请和轨道启停。

## 依赖方向

模块依赖必须保持单向，避免环形和横向偷取状态：

```text
script.js
  -> application/store / presentation

presentation
  -> application/controllers / application/viewModels / domain / shared

application
  -> infrastructure/api/appApi / domain

infrastructure
  -> mocks / httpClient

domain
  -> no application/presentation/infrastructure dependencies
```

约束：

- `src/domain/*` 必须保持纯业务规则，不依赖 DOM、API、data store、runtime state 或 render。
- `src/infrastructure/*` 不依赖 application 或 presentation，只负责外部数据和接口适配。
- `src/infrastructure/browser/runtimeEnvironment.js` 集中适配 `sessionStorage`、`performance` 等浏览器运行环境，application state 不直接读取浏览器全局对象。
- `src/application/controllers/*` 可以读写应用状态、调用 `appApi.js`、复用 domain 规则，但不操作 DOM。
- `src/application/controllers/*` 之间保持并列，不互相 import；共享查询逻辑下沉到 state selectors 或 domain 纯函数。
- `src/application/controllers/*` 不读取浏览器路由、URL 查询参数或跳转地址；当前页面上下文由 presentation 层传入。
- `src/application/viewModels/*` 只提供 presentation 需要的只读投影，不发请求、不操作 DOM、不承载业务写操作。
- `src/presentation/render.js` 不直接操作 DOM，不直接请求 API，不直接修改 data store 或 runtime state。
- `src/presentation/components/*` 优先保持为可传参复用的模板组件；基础组件不读取 `renderData` / `renderRuntime`，复杂组件由 `render.js` 注入数据。
- `src/presentation/interactions.js` 不直接 import data store、`mockApi.js` 或业务状态机；需要业务动作时新增/复用 controller。
- `src/presentation/ui/*` 只封装浏览器/DOM 适配能力，不引入 application controllers 或业务数据。
- 页面要替换 Mock API 时优先改 `src/infrastructure/api/appApi.js` 的导出，不穿透改 controllers。

## 实时 Mock 状态

候诊人数和接诊状态不允许在页面里写死。当前通过 `mockApi.js` 模拟后端运行态：

- `getRealtimeSnapshot()` 每 3 秒生成新的候诊队列数据。
- 进行中问诊启动时预置 2 条，实时 Mock 池继续随机补充到 6 条上限；最终保持图文 3 条、视频 3 条。
- 每条 Mock 会话包含独立患者资料、完整手机号和身份证号、匹配症状的聊天回复、诊断标签和处方用药，避免页面出现重复病人。
- `getRealtimeSnapshot()` 从 `realtimePool` 随机抽取未出现的病例，并把候诊人数从 2 逐步同步到 6。
- `waitingQueue` 写入 Mock 运行态存储，页面跳转后继续保持同一份候诊数字。
- `updateDoctorStatus(status)` 写入 Mock 运行态存储，首页和问诊页读取同一个接诊状态。
- `updateServiceAvailability(serviceKey, enabled)` 写入 Mock 运行态存储，首页服务开关和问诊页顶部服务开关保持一致。

页面只通过 `runtimeState.js` 的 `doctorStatusState`、`waitingQueueState`、`serviceState` 读取运行态，不直接读取或修改 DOM 中的数字作为业务状态。`waitingQueueState` 必须由 `consultationQueue.js` 基于当前会话列表推导，确保首页和问诊室待接诊数字与进行中消息条数一致。

消息列表和问诊详情同样由 Mock API 驱动：

- 新增会话通过 `newConsultation.record` 进入 `dataStore.js` 的 `consultationRecords`。
- 新增聊天通过 `newConsultation.chat` 进入 `ongoingChatState`。
- 点击会话时路由携带 `sessionId` 参数，图文/视频页按同一个稳定会话 ID 渲染药店、患者、聊天、诊断和用药信息；旧 `record` 参数只作为历史链接兼容入口。
- Mock 和运行态会话 ID 使用 `cs_...` 形式，不把图文、视频、已结束等业务文字写进 ID；会话类型只放在 `type` / `targetView` 字段。
- 进行中的消息列表最多展示 6 条，Mock 运行态新增会话会随机插入列表位置并做数量裁剪，避免列表无限增长或类型固定分组。
- 未读状态按 `record.id` 持久化，不再按列表位置计算，新增会话插入后不会导致徽标错位。
- 问诊结束时由 `archivedConsultation.js` 统一生成可回看的归档记录，确保新结束或历史 Mock 记录都有聊天历史和操作留痕；已结束视频记录只保留历史消息与处方信息，不再渲染视频预览框。

## 数据结构

`src/infrastructure/mocks/app-bootstrap.json` 是启动聚合数据：

```json
{
  "schemaVersion": 1,
  "navigation": { "menuGroups": [] },
  "home": {
    "quickActions": [],
    "quickEntryOptions": [],
    "announcements": []
  },
  "services": [],
  "consultations": {
    "records": [],
    "ongoingChats": {}
  },
  "quickReplies": {
    "categories": [],
    "messages": []
  }
}
```

未来接真实后端时，可以把这个聚合接口拆成多个接口：

- `GET /api/navigation`
- `GET /api/home`
- `GET /api/services`
- `GET /api/consultations`
- `GET /api/quick-replies`

页面代码不应直接关心接口数量，只通过 `src/infrastructure/api/appApi.js` 暴露的 API facade 调用。

## API 通信层

当前所有页面和 controllers 请求从 `src/infrastructure/api/appApi.js` 进入，`appApi.js` 暂时转发到 `mockApi.js`：

- `getAppBootstrap()`：加载启动 Mock 数据。
- `generatePatientAutoReply({ recordId, doctorMessage, record, chat })`：模拟后端病人自动回复，按医生消息和当前病例随机生成患者回复。
- `searchDiagnosisCatalog({ keyword, exclude })`：模拟疾病目录检索，优先读取本地临床目录库，再用原 Mock 目录补齐候选。
- `searchMedicineCatalog({ keyword, exclude })`：模拟药品目录检索，优先读取本地临床目录库，再用原 Mock 药品补齐候选。
- `updateServiceAvailability(serviceKey, enabled)`：模拟服务开关保存。
- `updateConsultationStatus(recordId, event)`：模拟问诊流程状态同步。

真实接口上线时，保留 `src/infrastructure/api/appApi.js` 的函数签名，替换内部导出或实现即可。

## 问诊状态机

问诊状态集中定义在 `consultationStateMachine.js`：

```text
waiting -> ongoing -> risk_review -> prescription_submitted -> ended -> archived
          |           |
          |           -> cancelled
          -> cancelled
```

事件：

- `ACCEPT`：接诊。
- `OPEN_RISK_REVIEW`：提交处方前进入风险检测。
- `SUBMIT_PRESCRIPTION`：风险确认后提交处方。
- `END`：结束问诊。
- `CANCEL`：取消问诊。
- `ARCHIVE`：归档封存。

交互层只能发送事件，不应在页面里手写随意状态变更。

## 开发约束

- 新增页面数据先加到 Mock JSON，再通过 API/仓库进入页面。
- 渲染函数不发请求，不直接改 Mock 数据。
- 交互函数不拼业务数据结构，不直接调用 API 和状态机，只调用 controllers。
- 后续接真实后端时，优先替换 `src/infrastructure/api/appApi.js`，尽量不动 application 和 presentation。
