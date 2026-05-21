import { fetchJson } from "./httpClient.js";
import { getSessionStorage } from "../browser/runtimeEnvironment.js";

const mockLatencyMs = 80;
let realtimeTick = 0;
const runtimeStorageKey = "jh.mockRuntimeState";
const runtimeSchemaVersion = 7;
const maxRuntimeConsultations = 6;
const baseWaitingQueue = {
  total: 2,
  byType: { text: 1, video: 1, consult: 0 }
};
const bootstrapUrl = new URL("../mocks/app-bootstrap.json?v=20260521-15", import.meta.url);
const localClinicalCatalogUrl = new URL("../mocks/local-clinical-catalog.json", import.meta.url);
const prescriptionCatalogUrl = new URL("../mocks/prescription-catalog.json", import.meta.url);
const runtimeStorage = getSessionStorage();

function readRuntimeState() {
  try {
    const state = JSON.parse(runtimeStorage.getItem(runtimeStorageKey) || "{}");
    if (state.schemaVersion !== runtimeSchemaVersion) return {};
    return state;
  } catch {
    return {};
  }
}

function writeRuntimeState(patch) {
  const nextState = { ...readRuntimeState(), schemaVersion: runtimeSchemaVersion, ...patch };
  runtimeStorage.setItem(runtimeStorageKey, JSON.stringify(nextState));
  return nextState;
}

function delay(ms = mockLatencyMs) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function getRuntimeConsultations() {
  const runtimeState = readRuntimeState();
  return {
    records: runtimeState.consultationRecords || [],
    chats: runtimeState.ongoingChats || {}
  };
}

function writeRuntimeConsultation(record, chat) {
  const runtimeState = readRuntimeState();
  const records = runtimeState.consultationRecords || [];
  const chats = runtimeState.ongoingChats || {};
  if (records.some((item) => item.id === record.id)) {
    return { records, chats };
  }
  const nextRecords = insertAtRandomPosition(record, records).slice(
    0,
    maxRuntimeConsultations - baseWaitingQueue.total
  );
  const keptIds = new Set(nextRecords.map((item) => item.id));
  const nextChats = { ...chats, [record.id]: chat };
  Object.keys(nextChats).forEach((chatId) => {
    if (!keptIds.has(chatId)) delete nextChats[chatId];
  });
  writeRuntimeState({
    consultationRecords: nextRecords,
    ongoingChats: nextChats
  });
  return { records: nextRecords, chats: nextChats };
}

function formatRuntimeEndedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function findConsultationRecord(recordId, payload, runtimeRecords) {
  return (
    runtimeRecords.find((record) => record.id === recordId) ||
    payload.consultations?.records?.find((record) => record.id === recordId) ||
    payload.consultations?.realtimePool?.records?.find((record) => record.id === recordId) ||
    null
  );
}

function pickRandomAvailableConsultation(poolRecords, runtimeRecords) {
  const usedIds = new Set(runtimeRecords.map((record) => record.id));
  const availableRecords = poolRecords.filter((record) => !usedIds.has(record.id));
  if (!availableRecords.length) return null;
  const index = Math.floor(Math.random() * availableRecords.length);
  return availableRecords[index];
}

function insertAtRandomPosition(record, records) {
  const nextRecords = [...records];
  const index = Math.floor(Math.random() * (nextRecords.length + 1));
  nextRecords.splice(index, 0, record);
  return nextRecords;
}

function buildWaitingQueue(runtimeRecords) {
  const ongoingRuntimeRecords = runtimeRecords.filter((record) => record.state === "ongoing");
  const addedText = ongoingRuntimeRecords.filter((record) => record.type === "text").length;
  const addedVideo = ongoingRuntimeRecords.filter((record) => record.type === "video").length;
  const text = Math.min(baseWaitingQueue.byType.text + addedText, 3);
  const video = Math.min(baseWaitingQueue.byType.video + addedVideo, 3);
  return {
    total: Math.min(text + video, maxRuntimeConsultations),
    byType: { text, video, consult: baseWaitingQueue.byType.consult },
    updatedAt: new Date().toISOString()
  };
}

function formatMessageTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getReplyIntent(text = "") {
  if (/过敏|敏感|青霉素|花粉/.test(text)) return "allergy";
  if (/发烧|发热|体温|低热|高热/.test(text)) return "fever";
  if (/咳|痰|喘|胸闷/.test(text)) return "cough";
  if (/疼|痛|不舒服|难受/.test(text)) return "pain";
  if (/药|用药|服用|吃过|处方|剂量/.test(text)) return "medicine";
  if (/怀孕|备孕|哺乳|月经/.test(text)) return "pregnancy";
  if (/多久|几天|什么时候|时间/.test(text)) return "duration";
  return "general";
}

function buildPatientReplyText({ doctorMessage = "", record = {}, chat = {} } = {}) {
  const diagnosis = record.diagnosis || record.diagnosisTags?.[0] || "这个情况";
  const preview = record.preview || "症状还是和前面描述差不多";
  const allergies = record.patientDetail?.allergies || "无";
  const intentReplies = {
    allergy: [
      allergies === "无" ? "目前没有已知药物过敏，之前吃常见感冒药也没出现过敏。" : `我有${allergies}过敏，其他药暂时没发现过敏。`,
      "我不太确定这个算不算过敏，之前没有起过大片红疹。"
    ],
    fever: [
      "刚又量了一下，体温比前面差不多，没有明显升高。",
      "现在有点低热，但精神还可以，没有寒战。"
    ],
    cough: [
      "咳嗽还是晚上明显一点，痰量不算多。",
      "目前没有明显胸闷气短，就是咳起来不太舒服。"
    ],
    pain: [
      "疼痛大概是能忍的程度，活动或者吞咽时会更明显。",
      "现在还是不舒服，但没有突然加重。"
    ],
    medicine: [
      "今天还没吃别的药，之前用过的药也没有明显不良反应。",
      "家里有一点以前的药，但我还没继续吃，想先问一下能不能用。"
    ],
    pregnancy: [
      "没有怀孕，也不在哺乳期。",
      "近期没有备孕计划，月经情况和平时差不多。"
    ],
    duration: [
      "大概是这两三天开始明显的，今天感觉更不舒服一些。",
      "最早前几天就有一点症状，昨天开始比较明显。"
    ],
    general: [
      `${preview}，目前没有其他特别明显的新症状。`,
      `主要还是${diagnosis}相关的不舒服，想尽快缓解一下。`,
      "我明白了，医生您看还需要我补充哪些情况？"
    ]
  };
  const replies = intentReplies[getReplyIntent(doctorMessage)] || intentReplies.general;
  const recentPatientMessages = (chat.messages || [])
    .filter((message) => message.from === "patient")
    .slice(-3)
    .map((message) => message.text);
  const availableReplies = replies.filter((reply) => !recentPatientMessages.includes(reply));
  return pickRandom(availableReplies.length ? availableReplies : replies);
}

function writeRuntimeChat(recordId, chat) {
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    ongoingChats: {
      ...(runtimeState.ongoingChats || {}),
      [recordId]: chat
    }
  });
}

function compareByPinyin(left, right) {
  return new Intl.Collator("zh-Hans-u-co-pinyin").compare(left, right);
}

function normalizeKeyword(keyword = "") {
  return normalizeSearchText(keyword);
}

function normalizeExcluded(exclude = []) {
  return new Set((Array.isArray(exclude) ? exclude : []).filter(Boolean));
}

const pinyinMap = {
  阿: "a",
  艾: "ai",
  安: "an",
  胺: "an",
  氨: "an",
  奥: "ao",
  白: "bai",
  斑: "ban",
  半: "ban",
  包: "bao",
  胞: "bao",
  倍: "bei",
  贝: "bei",
  苯: "ben",
  鼻: "bi",
  必: "bi",
  泌: "mi",
  变: "bian",
  便: "bian",
  扁: "bian",
  病: "bing",
  布: "bu",
  部: "bu",
  醇: "chun",
  草: "cao",
  操: "cao",
  侧: "ce",
  岔: "cha",
  肠: "chang",
  常: "chang",
  喘: "chuan",
  疮: "chuang",
  磁: "ci",
  刺: "ci",
  胆: "dan",
  单: "dan",
  氮: "dan",
  当: "dang",
  地: "di",
  低: "di",
  滴: "di",
  丁: "ding",
  定: "ding",
  动: "dong",
  痘: "dou",
  毒: "du",
  多: "duo",
  厄: "e",
  恶: "e",
  耳: "er",
  二: "er",
  发: "fa",
  反: "fan",
  芳: "fang",
  肺: "fei",
  非: "fei",
  芬: "fen",
  风: "feng",
  夫: "fu",
  呋: "fu",
  氟: "fu",
  福: "fu",
  腹: "fu",
  伐: "fa",
  复: "fu",
  钙: "gai",
  肝: "gan",
  甘: "gan",
  感: "gan",
  干: "gan",
  高: "gao",
  格: "ge",
  功: "gong",
  宫: "gong",
  果: "guo",
  过: "guo",
  骨: "gu",
  胍: "gua",
  胱: "guang",
  冠: "guan",
  关: "guan",
  管: "guan",
  光: "guang",
  寒: "han",
  合: "he",
  黑: "hei",
  喉: "hou",
  呼: "hu",
  护: "hu",
  化: "hua",
  黄: "huang",
  磺: "huang",
  慌: "huang",
  滑: "hua",
  环: "huan",
  幻: "huan",
  患: "huan",
  炎: "yan",
  急: "ji",
  疾: "ji",
  肌: "ji",
  甲: "jia",
  钾: "jia",
  减: "jian",
  碱: "jian",
  胶: "jiao",
  焦: "jiao",
  绞: "jiao",
  角: "jiao",
  结: "jie",
  节: "jie",
  睑: "jian",
  界: "jie",
  菌: "jun",
  净: "jing",
  痉: "jing",
  颈: "jing",
  经: "jing",
  静: "jing",
  精: "jing",
  旧: "jiu",
  救: "jiu",
  克: "ke",
  咳: "ke",
  可: "ke",
  口: "kou",
  溃: "kui",
  困: "kun",
  拉: "la",
  来: "lai",
  兰: "lan",
  蓝: "lan",
  雷: "lei",
  冷: "leng",
  离: "li",
  利: "li",
  立: "li",
  粒: "li",
  力: "li",
  连: "lian",
  良: "liang",
  两: "liang",
  列: "lie",
  林: "lin",
  淋: "lin",
  磷: "lin",
  流: "liu",
  六: "liu",
  龙: "long",
  隆: "long",
  炉: "lu",
  氯: "lv",
  铝: "lv",
  绿: "lv",
  罗: "luo",
  洛: "luo",
  马: "ma",
  麻: "ma",
  慢: "man",
  霉: "mei",
  美: "mei",
  莫: "mo",
  默: "mo",
  孟: "meng",
  泌: "mi",
  秘: "mi",
  敏: "min",
  明: "ming",
  膜: "mo",
  脲: "niao",
  尿: "niao",
  奈: "nai",
  囊: "nang",
  能: "neng",
  黏: "nian",
  念: "nian",
  凝: "ning",
  欧: "ou",
  呕: "ou",
  哌: "pai",
  泮: "pan",
  胖: "pang",
  疱: "pao",
  盆: "pen",
  片: "pian",
  偏: "pian",
  平: "ping",
  蒲: "pu",
  扑: "pu",
  前: "qian",
  强: "qiang",
  腔: "qiang",
  青: "qing",
  清: "qing",
  曲: "qu",
  群: "qun",
  缺: "que",
  热: "re",
  人: "ren",
  乳: "ru",
  瑞: "rui",
  润: "run",
  噻: "sai",
  散: "san",
  沙: "sha",
  山: "shan",
  伤: "shang",
  上: "shang",
  舒: "shu",
  水: "shui",
  睡: "shui",
  司: "si",
  索: "suo",
  酸: "suan",
  糖: "tang",
  坦: "tan",
  痰: "tan",
  酮: "tong",
  头: "tou",
  痛: "tong",
  酞: "tai",
  泰: "tai",
  他: "ta",
  汀: "ting",
  酯: "zhi",
  突: "tu",
  托: "tuo",
  妥: "tuo",
  外: "wai",
  丸: "wan",
  网: "wang",
  胃: "wei",
  维: "wei",
  韦: "wei",
  围: "wei",
  紊: "wen",
  西: "xi",
  昔: "xi",
  喜: "xi",
  细: "xi",
  下: "xia",
  腺: "xian",
  咸: "xian",
  仙: "xian",
  酰: "xian",
  哮: "xiao",
  消: "xiao",
  小: "xiao",
  硝: "xiao",
  心: "xin",
  新: "xin",
  辛: "xin",
  星: "xing",
  性: "xing",
  型: "xing",
  溴: "xiu",
  锈: "xiu",
  旋: "xuan",
  眩: "xuan",
  血: "xue",
  循: "xun",
  亚: "ya",
  牙: "ya",
  压: "ya",
  咽: "yan",
  眼: "yan",
  盐: "yan",
  厌: "yan",
  氧: "yang",
  痒: "yang",
  阳: "yang",
  腰: "yao",
  药: "yao",
  液: "ye",
  叶: "ye",
  夜: "ye",
  乙: "yi",
  益: "yi",
  胰: "yi",
  疫: "yi",
  抑: "yi",
  阴: "yin",
  音: "yin",
  银: "yin",
  应: "ying",
  硬: "ying",
  营: "ying",
  幽: "you",
  油: "you",
  右: "you",
  尿: "niao",
  原: "yuan",
  月: "yue",
  晕: "yun",
  孕: "yun",
  脏: "zang",
  早: "zao",
  噪: "zao",
  增: "zeng",
  障: "zhang",
  支: "zhi",
  脂: "zhi",
  止: "zhi",
  指: "zhi",
  痔: "zhi",
  中: "zhong",
  肿: "zhong",
  周: "zhou",
  轴: "zhou",
  猪: "zhu",
  主: "zhu",
  转: "zhuan",
  状: "zhuang",
  椎: "zhui",
  紫: "zi",
  子: "zi",
  综: "zong",
  足: "zu",
  左: "zuo",
  坐: "zuo",
  埃: "ai",
  碍: "ai",
  按: "an",
  百: "bai",
  邦: "bang",
  膀: "bang",
  孢: "bao",
  薄: "bao",
  保: "bao",
  本: "ben",
  比: "bi",
  避: "bi",
  苄: "bian",
  玻: "bo",
  补: "bu",
  不: "bu",
  策: "ce",
  查: "cha",
  成: "cheng",
  出: "chu",
  处: "chu",
  床: "chuang",
  创: "chuang",
  纯: "chun",
  茨: "ci",
  次: "ci",
  促: "cu",
  痤: "cuo",
  达: "da",
  带: "dai",
  待: "dai",
  袋: "dai",
  蛋: "dan",
  道: "dao",
  得: "de",
  德: "de",
  癫: "dian",
  癜: "dian",
  调: "diao",
  窦: "dou",
  断: "duan",
  对: "dui",
  儿: "er",
  尔: "er",
  乏: "fa",
  方: "fang",
  肪: "fang",
  肥: "fei",
  酚: "fen",
  粉: "fen",
  肤: "fu",
  服: "fu",
  妇: "fu",
  覆: "fu",
  盖: "gai",
  杆: "gan",
  膏: "gao",
  给: "gei",
  更: "geng",
  工: "gong",
  枸: "gou",
  钴: "gu",
  海: "hai",
  和: "he",
  盒: "he",
  后: "hou",
  花: "hua",
  缓: "huan",
  活: "huo",
  获: "huo",
  基: "ji",
  激: "ji",
  及: "ji",
  剂: "ji",
  假: "jia",
  间: "jian",
  肩: "jian",
  见: "jian",
  浆: "jiang",
  降: "jiang",
  酵: "jiao",
  竭: "jie",
  解: "jie",
  紧: "jin",
  进: "jin",
  境: "jing",
  咀: "ju",
  据: "ju",
  决: "jue",
  嚼: "jue",
  开: "kai",
  康: "kang",
  糠: "kang",
  亢: "kang",
  抗: "kang",
  科: "ke",
  孔: "kong",
  控: "kong",
  库: "ku",
  矿: "kuang",
  劳: "lao",
  泪: "lei",
  璃: "li",
  理: "li",
  联: "lian",
  量: "liang",
  临: "lin",
  硫: "liu",
  瘤: "liu",
  鲁: "lu",
  录: "lu",
  路: "lu",
  律: "lv",
  虑: "lv",
  率: "lv",
  挛: "luan",
  乱: "luan",
  螺: "luo",
  麦: "mai",
  脉: "mai",
  毛: "mao",
  冒: "mao",
  梅: "mei",
  每: "mei",
  镁: "mei",
  门: "men",
  蒙: "meng",
  醚: "mi",
  米: "mi",
  眠: "mian",
  鸣: "ming",
  母: "mu",
  目: "mu",
  沐: "mu",
  拿: "na",
  那: "na",
  钠: "na",
  萘: "nai",
  难: "nan",
  内: "nei",
  尼: "ni",
  年: "nian",
  诺: "nuo",
  排: "pai",
  潘: "pan",
  盘: "pan",
  喷: "pen",
  皮: "pi",
  疲: "pi",
  匹: "pi",
  贫: "pin",
  品: "pin",
  瓶: "ping",
  期: "qi",
  奇: "qi",
  歧: "qi",
  气: "qi",
  器: "qi",
  羟: "qiang",
  芩: "qin",
  嗪: "qin",
  揿: "qin",
  区: "qu",
  祛: "qu",
  炔: "que",
  染: "ran",
  日: "ri",
  溶: "rong",
  肉: "rou",
  入: "ru",
  软: "ruan",
  塞: "sai",
  三: "san",
  瘙: "sao",
  社: "she",
  神: "shen",
  肾: "shen",
  生: "sheng",
  失: "shi",
  湿: "shi",
  十: "shi",
  石: "shi",
  实: "shi",
  食: "shi",
  示: "shi",
  适: "shi",
  释: "shi",
  手: "shou",
  疏: "shu",
  衰: "shuai",
  双: "shuang",
  丝: "si",
  松: "song",
  搜: "sou",
  嗽: "sou",
  素: "su",
  损: "sun",
  太: "tai",
  态: "tai",
  碳: "tan",
  桃: "tao",
  特: "te",
  体: "ti",
  替: "ti",
  铁: "tie",
  通: "tong",
  统: "tong",
  涂: "tu",
  退: "tui",
  脱: "tuo",
  晚: "wan",
  微: "wei",
  为: "wei",
  瘟: "wen",
  问: "wen",
  肟: "wo",
  物: "wu",
  雾: "wu",
  吸: "xi",
  息: "xi",
  洗: "xi",
  系: "xi",
  峡: "xia",
  痫: "xian",
  缬: "xie",
  泻: "xie",
  屑: "xie",
  械: "xie",
  信: "xin",
  行: "xing",
  需: "xu",
  癣: "xuan",
  荨: "xun",
  演: "yan",
  疡: "yang",
  养: "yang",
  样: "yang",
  依: "yi",
  异: "yi",
  溢: "yi",
  龈: "yin",
  用: "yong",
  于: "yu",
  郁: "yu",
  愈: "yu",
  橼: "yuan",
  燥: "zao",
  胀: "zhang",
  真: "zhen",
  诊: "zhen",
  疹: "zhen",
  镇: "zhen",
  征: "zheng",
  症: "zheng",
  制: "zhi",
  质: "zhi",
  粥: "zhou",
  阻: "zu",
  作: "zuo",
  唑: "zuo"
};

function normalizeSearchText(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function getPinyinParts(value = "") {
  const syllables = [];
  for (const char of String(value)) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      const syllable = pinyinMap[char];
      if (syllable) syllables.push(syllable);
    } else if (/[a-zA-Z0-9]/.test(char)) {
      syllables.push(char.toLowerCase());
    }
  }
  return syllables;
}

function getSearchVariants(values = []) {
  const sourceValues = values.filter(Boolean).map(String);
  const compactText = sourceValues.map(normalizeSearchText).join("");
  const syllables = sourceValues.flatMap(getPinyinParts);
  const pinyin = syllables.join("");
  const initials = syllables.map((part) => part[0]).join("");
  return [compactText, pinyin, initials, syllables.join(" ")].filter(Boolean);
}

function matchesSearch(values = [], normalizedKeyword = "") {
  if (!normalizedKeyword) return true;
  return getSearchVariants(values).some((variant) => variant.includes(normalizedKeyword));
}

function mergeDiagnosisCatalogs(primaryDiagnoses = [], fallbackDiagnoses = []) {
  return Array.from(new Set([...primaryDiagnoses, ...fallbackDiagnoses].filter(Boolean)));
}

function mergeMedicineCatalogs(primaryMedicines = [], fallbackMedicines = []) {
  const seen = new Set();
  return [...primaryMedicines, ...fallbackMedicines].filter((medicine) => {
    const key = `${medicine.name}-${medicine.spec}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchDiagnosisCatalog({ keyword = "", exclude = [] } = {}) {
  await delay(60);
  const clinicalCatalog = await fetchJson(localClinicalCatalogUrl);
  const catalog = await fetchJson(prescriptionCatalogUrl);
  const normalizedKeyword = normalizeKeyword(keyword);
  const excluded = normalizeExcluded(exclude);
  const diagnoses = mergeDiagnosisCatalogs(clinicalCatalog.diagnoses || [], catalog.diagnoses || []);
  const items = diagnoses
    .filter((diagnosis) => !excluded.has(diagnosis))
    .filter((diagnosis) => matchesSearch([diagnosis], normalizedKeyword))
    .sort(compareByPinyin);

  return {
    items,
    total: items.length,
    keyword
  };
}

export async function searchMedicineCatalog({ keyword = "", exclude = [] } = {}) {
  await delay(60);
  const clinicalCatalog = await fetchJson(localClinicalCatalogUrl);
  const catalog = await fetchJson(prescriptionCatalogUrl);
  const normalizedKeyword = normalizeKeyword(keyword);
  const excluded = normalizeExcluded(exclude);
  const medicines = mergeMedicineCatalogs(clinicalCatalog.medicines || [], catalog.medicines || []);
  const items = medicines
    .filter((medicine) => !excluded.has(medicine.name))
    .filter((medicine) => matchesSearch([
      medicine.name,
      medicine.spec,
      medicine.category,
      ...(medicine.aliases || []),
      ...(medicine.indications || [])
    ], normalizedKeyword))
    .sort((left, right) => compareByPinyin(left.name, right.name));

  return {
    items,
    total: items.length,
    keyword
  };
}

export async function getAppBootstrap() {
  await delay();
  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  if (runtimeState.doctorStatus && payload.doctor) {
    payload.doctor = { ...payload.doctor, status: runtimeState.doctorStatus };
  }
  if (runtimeState.waitingQueue) {
    payload.waitingQueue = runtimeState.waitingQueue;
  }
  if (runtimeState.services) {
    payload.services = payload.services.map((service) => ({
      ...service,
      enabled:
        typeof runtimeState.services[service.key] === "boolean"
          ? runtimeState.services[service.key]
          : service.enabled
    }));
  }
  if (runtimeState.consultationRecords?.length) {
    const baseRecordsById = new Map(payload.consultations.records.map((record) => [record.id, record]));
    const runtimeRecords = runtimeState.consultationRecords.slice(0, maxRuntimeConsultations).map((record) => {
      const baseRecord = baseRecordsById.get(record.id);
      if (!baseRecord) return record;
      return {
        ...baseRecord,
        ...record,
        prescriptionMedicines: record.prescriptionMedicines?.length
          ? record.prescriptionMedicines
          : baseRecord.prescriptionMedicines || record.prescriptionMedicines
      };
    });
    payload.consultations.records = [
      ...runtimeRecords,
      ...payload.consultations.records.filter(
        (record) => !runtimeRecords.some((item) => item.id === record.id)
      )
    ];
  }
  if (runtimeState.ongoingChats) {
    payload.consultations.ongoingChats = {
      ...payload.consultations.ongoingChats,
      ...runtimeState.ongoingChats
    };
  }
  return payload;
}

export async function updateServiceAvailability(serviceKey, enabled) {
  await delay(40);
  const runtimeState = readRuntimeState();
  writeRuntimeState({
    services: {
      ...(runtimeState.services || {}),
      [serviceKey]: enabled
    }
  });
  return { serviceKey, enabled, updatedAt: new Date().toISOString() };
}

export async function updateDoctorStatus(status) {
  await delay(40);
  writeRuntimeState({ doctorStatus: status });
  return { status, updatedAt: new Date().toISOString() };
}

export async function getRealtimeSnapshot() {
  await delay(40);
  realtimeTick += 1;

  const payload = await fetchJson(bootstrapUrl);
  const poolRecords = payload.consultations?.realtimePool?.records || [];
  const poolChats = payload.consultations?.realtimePool?.chats || {};
  let currentConsultations = getRuntimeConsultations();
  let newConsultation = null;

  const currentTotal =
    baseWaitingQueue.total +
    currentConsultations.records.filter((record) => record.state === "ongoing").length;
  if (currentTotal < maxRuntimeConsultations) {
    const record = pickRandomAvailableConsultation(poolRecords, currentConsultations.records);
    if (record) {
      newConsultation = {
        record,
        chat: poolChats[record.id]
      };
      currentConsultations = writeRuntimeConsultation(record, poolChats[record.id]);
    }
  }

  const waitingQueue = buildWaitingQueue(currentConsultations.records);
  writeRuntimeState({ waitingQueue });

  return {
    waitingQueue,
    newConsultation,
    tick: realtimeTick
  };
}

export async function generatePatientAutoReply({ recordId, doctorMessage, record = null, chat = null } = {}) {
  await delay(500 + Math.floor(Math.random() * 900));
  if (!recordId || !doctorMessage?.text) {
    return { recordId, message: null };
  }

  const payload = await fetchJson(bootstrapUrl);
  const runtimeState = readRuntimeState();
  const runtimeRecords = runtimeState.consultationRecords || [];
  const sourceRecord = record || findConsultationRecord(recordId, payload, runtimeRecords) || {};
  const sourceChat = chat || runtimeState.ongoingChats?.[recordId] || payload.consultations?.ongoingChats?.[recordId] || {};
  const date = new Date();
  const message = {
    id: `${recordId}-patient-${date.getTime()}-${Math.floor(Math.random() * 1000)}`,
    from: "patient",
    text: buildPatientReplyText({ doctorMessage: doctorMessage.text, record: sourceRecord, chat: sourceChat }),
    time: formatMessageTime(date),
    recalled: false,
    mock: true
  };

  writeRuntimeChat(recordId, {
    ...sourceChat,
    sessionDate: sourceChat.sessionDate || formatMessageTime(date),
    messages: [...(sourceChat.messages || []), message]
  });

  return {
    recordId,
    message,
    updatedAt: date.toISOString()
  };
}

export async function updateConsultationStatus(recordId, event, recordPatch = null) {
  await delay(40);
  if (event === "END" || event === "CANCEL") {
    const payload = await fetchJson(bootstrapUrl);
    const runtimeState = readRuntimeState();
    const runtimeRecords = runtimeState.consultationRecords || [];
    const sourceRecord = recordPatch || findConsultationRecord(recordId, payload, runtimeRecords);
    if (sourceRecord) {
      const nextState = event === "END" ? "ended" : "cancelled";
      const nextRecord = {
        ...sourceRecord,
        state: nextState,
        badge: 0,
        unreadCount: 0
      };
      if (nextState === "ended" && !nextRecord.endedAt) {
        nextRecord.endedAt = formatRuntimeEndedAt();
      }
      const nextRecords = runtimeRecords.some((record) => record.id === recordId)
        ? runtimeRecords.map((record) => (record.id === recordId ? nextRecord : record))
        : [nextRecord, ...runtimeRecords];
      writeRuntimeState({ consultationRecords: nextRecords });
    }
  }
  return { recordId, event, updatedAt: new Date().toISOString() };
}
