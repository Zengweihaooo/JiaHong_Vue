const pinyinCollator = new Intl.Collator("zh-Hans-u-co-pinyin");

export function compareByPinyin(left, right) {
  return pinyinCollator.compare(left, right);
}
