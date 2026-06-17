App({
  onLaunch() {
    // 初始化本地存储
    const records = wx.getStorageSync('records')
    if (!records) {
      wx.setStorageSync('records', [])
    }
    this.globalData.records = records || []
  },

  globalData: {
    records: []
  },

  // 获取所有记录
  getRecords() {
    const records = wx.getStorageSync('records') || []
    return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // 保存一条记录
  saveRecord(record) {
    const records = wx.getStorageSync('records') || []
    records.unshift(record)
    wx.setStorageSync('records', records)
    return true
  },

  // 删除一条记录
  deleteRecord(id) {
    let records = wx.getStorageSync('records') || []
    records = records.filter(r => r.id !== id)
    wx.setStorageSync('records', records)
    return true
  },

  // 根据ID获取单条记录
  getRecordById(id) {
    const records = wx.getStorageSync('records') || []
    return records.find(r => r.id === id) || null
  }
})
