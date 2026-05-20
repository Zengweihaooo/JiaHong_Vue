import { writeFile } from "node:fs/promises";

const endpoint = "https://code.nhsa.gov.cn/yp/stdGoodsPublic/getStdGoodsPublicData.html";
const outputPath = new URL("../src/infrastructure/mocks/nhsa-medicine-catalog.json", import.meta.url);
const sampleKeywords = [
  "阿莫西林",
  "奥美拉唑",
  "氨氯地平",
  "布洛芬",
  "氯雷他定",
  "对乙酰氨基酚",
  "多潘立酮",
  "非布司他",
  "左氧氟沙星",
  "蒲地蓝"
];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function inferUsage(usageDosage = "") {
  if (usageDosage.includes("口服")) return "口服";
  if (usageDosage.includes("外用")) return "外用";
  if (usageDosage.includes("滴眼")) return "滴眼";
  return "";
}

function inferRisk(row) {
  if (row.isOtc === 1 || row.isOtc === "1") return "低";
  if (row.productInsuranceType === "甲") return "中";
  return "中";
}

function normalizeMedicine(row) {
  const name = row.registeredProductName || row.productName || row.goodsName || "";
  const spec = row.realityOutlook || row.registeredOutlook || "";
  return {
    name,
    type: row.isOtc === 1 || row.isOtc === "1" ? "OTC" : "处方药",
    spec,
    usage: inferUsage(row.usageDosage),
    frequency: "",
    dose: spec,
    quantity: "1",
    unit: row.unit || "盒",
    risk: inferRisk(row),
    nhsa: {
      goodsCode: row.goodsCode || "",
      productCode: row.productCode || "",
      productName: row.productName || "",
      productInsuranceType: row.productInsuranceType || "",
      registeredProductName: row.registeredProductName || "",
      registeredMedicinemodel: row.registeredMedicinemodel || "",
      realityMedicinemodel: row.realityMedicinemodel || "",
      approvalCode: row.approvalCode || "",
      companyName: row.companyNameSc || row.listingHolder || "",
      marketState: row.marketState || "",
      version: row.version || "",
      dataSource: row.dataSouce || "",
      traceCodeFlag: row.traceCodeFlag || ""
    }
  };
}

async function fetchKeyword(keyword) {
  const body = new URLSearchParams({
    page: "1",
    rows: "10",
    sidx: "",
    sord: "asc",
    goodsCode: "",
    companyNameSc: "",
    registeredProductName: keyword,
    approvalCode: ""
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "https://code.nhsa.gov.cn/yp/toPublicList3.html",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    },
    body
  });
  if (!response.ok) {
    throw new Error(`NHSA request failed for ${keyword}: ${response.status}`);
  }
  const payload = await response.json();
  if (payload.operationType || typeof payload.rows === "string") {
    console.warn(`NHSA returned a verification response for ${keyword}; skipped this keyword.`);
    return [];
  }
  return Array.isArray(payload.rows) ? payload.rows : [];
}

const rowsByCode = new Map();
for (const keyword of sampleKeywords) {
  const rows = await fetchKeyword(keyword);
  rows.forEach((row) => {
    const key = row.goodsCode || row.baseId || `${row.registeredProductName}-${row.approvalCode}`;
    if (key && !rowsByCode.has(key)) rowsByCode.set(key, row);
  });
  await delay(800);
}

const medicines = Array.from(rowsByCode.values())
  .map(normalizeMedicine)
  .filter((medicine) => medicine.name)
  .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-u-co-pinyin"));

const payload = {
  schemaVersion: 1,
  source: {
    name: "国家医保信息业务编码标准数据库动态维护 - 西药中成药信息",
    homeUrl: "https://code.nhsa.gov.cn/",
    publicSearchUrl: "https://code.nhsa.gov.cn/toSearch.html?sysflag=1003",
    apiEndpoint: endpoint,
    fetchedAt: new Date().toISOString(),
    note: "本文件为开发环境小样本：由公开“西药中成药信息”查询接口按若干关键词拉取，不是全量库。",
    sampleKeywords
  },
  medicines
};

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${medicines.length} NHSA medicine records to ${outputPath.pathname}`);
