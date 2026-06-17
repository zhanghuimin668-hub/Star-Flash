/**
 * 星闪 - 工具函数
 */

/**
 * 生成唯一ID
 */
function generateId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

/**
 * 格式化时间戳为显示文字
 * @param {string} dateStr - ISO格式日期字符串 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间文字
 */
function formatTime(dateStr) {
  const date = new Date(dateStr.replace(/-/g, '/'))
  const now = new Date()
  const diff = now - date

  // 小于1分钟
  if (diff < 60000) return '刚刚'

  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`

  // 今天
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (dateDay.getTime() === today.getTime()) {
    return `今天 ${formatHM(date)}`
  }

  // 昨天
  const yesterday = new Date(today - 86400000)
  if (dateDay.getTime() === yesterday.getTime()) {
    return `昨天 ${formatHM(date)}`
  }

  // 今年
  const yearStart = new Date(now.getFullYear(), 0, 1)
  if (date >= yearStart) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formatHM(date)}`
  }

  // 更早
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${formatHM(date)}`
}

/**
 * 格式化时:分
 */
function formatHM(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * 获取当前完整时间字符串
 */
function getNowString() {
  const now = new Date()
  const y = now.getFullYear()
  const M = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}-${M}-${d} ${h}:${m}:${s}`
}

/**
 * 获取日期部分 YYYY-MM-DD
 */
function getDatePart(dateStr) {
  return dateStr.split(' ')[0]
}

/**
 * 检查两个日期是否为同一天
 */
function isSameDay(dateStr1, dateStr2) {
  return getDatePart(dateStr1) === getDatePart(dateStr2)
}

/**
 * 预设心情标签列表
 */
const PRESET_MOODS = [
  { key: '开心', emoji: '😊' },
  { key: '平静', emoji: '😐' },
  { key: '难过', emoji: '😢' },
  { key: '兴奋', emoji: '🎉' },
  { key: '感恩', emoji: '🙏' }
]

/**
 * 生成日历数据
 * @param {number} year
 * @param {number} month - 0-based (0=1月)
 * @param {Array} records - 当月有记录的日期集合
 * @returns {Array} 日历格子数组
 */
function generateCalendar(year, month, records) {
  const firstDay = new Date(year, month, 1).getDay() // 当月1号是周几
  const daysInMonth = new Date(year, month + 1, 0).getDate() // 当月天数
  const daysInPrevMonth = new Date(year, month, 0).getDate() // 上月天数

  // 收集当月有记录的日期
  const recordDates = new Set()
  if (records && records.length) {
    records.forEach(r => {
      recordDates.add(getDatePart(r.createdAt))
    })
  }

  const cells = []

  // 填充上月的尾数
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      month: 'prev',
      fullDate: '',
      hasRecord: false,
      isToday: false
    })
  }

  // 填充当月日期
  const today = getDatePart(getNowString())
  for (let i = 1; i <= daysInMonth; i++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    cells.push({
      day: i,
      month: 'current',
      fullDate,
      hasRecord: recordDates.has(fullDate),
      isToday: fullDate === today
    })
  }

  // 填充下月的头数（补齐 42 格，6行 x 7列）
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      month: 'next',
      fullDate: '',
      hasRecord: false,
      isToday: false
    })
  }

  return cells
}

module.exports = {
  generateId,
  formatTime,
  formatHM,
  getNowString,
  getDatePart,
  isSameDay,
  PRESET_MOODS,
  generateCalendar
}
