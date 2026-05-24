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

export function createPatientAutoReplyMessage({ recordId, doctorMessage, record, chat, date = new Date() }) {
  return {
    id: `${recordId}-patient-${date.getTime()}-${Math.floor(Math.random() * 1000)}`,
    from: "patient",
    text: buildPatientReplyText({ doctorMessage, record, chat }),
    time: formatMessageTime(date),
    recalled: false,
    mock: true
  };
}

export { formatMessageTime };
