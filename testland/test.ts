const _ = require('lodash')


// 从1开始生成一个数组，数组内任意两对数之和不存在于数组内
const gen = function (olist, from, to) {
  if (from === to) return olist
  if (olist.length < 1) olist.push(from)
  let unique_sums = _.sortBy(_.uniq(_.flatMap(olist, (a, i) => _.map(olist.slice(i + 1), b => a + b))))
  if (!_.includes(unique_sums, from)) olist.push(from)
  let nfrom = 1 + from
  return gen(olist, nfrom, to)
}
