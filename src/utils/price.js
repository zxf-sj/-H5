// 巴士票价规则（与小程序下单页保持一致）
// 成人价：有优惠票价(TicketPrice/JourneyPrice)用优惠价，否则用原价(SitePrice)
// 儿童价：min(成人优惠价, 成人原价 / 2)；原价缺失时按成人价一半兜底

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100

const pickNum = (obj, keys) => {
  for (let i = 0; i < keys.length; i++) {
    const v = Number(obj && obj[keys[i]])
    if (Number.isFinite(v) && v > 0) return v
  }
  return 0
}

// 成人票价：有优惠票价(TicketPrice/JourneyPrice)用优惠价，否则用原价(SitePrice)
export function adultPriceOf(item) {
  return pickNum(item, ['TicketPrice', 'JourneyPrice', 'SitePrice'])
}

// 成人原价
export function originPriceOf(item) {
  const site = pickNum(item, ['SitePrice'])
  return site > 0 ? site : adultPriceOf(item)
}

// 儿童票价
export function childPriceOf(item) {
  const adult = adultPriceOf(item)
  const origin = originPriceOf(item)
  const base = adult > 0 ? adult : origin
  if (base <= 0) return 0
  return round2(Math.min(base, origin / 2))
}
