const RATES = {
  PLN: 1,
  EUR: 1 / 4.28,
  USD: 1 / 3.95,
}

export function convertFromPln(amount, currency) {
  return amount * (RATES[currency] ?? 1)
}

export function formatParts(amount) {
  const sign = amount < 0 ? '-' : ''
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return { sign, grouped, cents }
}

export function formatMoney(amountPln, currency, { signMode = 'minus' } = {}) {
  const parts = formatParts(convertFromPln(amountPln, currency))
  let prefix = parts.sign
  if (signMode === 'always' && amountPln > 0) prefix = '+'
  if (signMode === 'spaced') {
    prefix = amountPln > 0 ? '+ ' : '- '
  }
  return `${prefix}${parts.grouped}.${parts.cents}`
}
