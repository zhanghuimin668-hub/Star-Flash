/**
 * 星闪 - 记录详情页逻辑
 */
const app = getApp()

Page({
  data: {
    record: null,
    recordId: ''
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      this.setData({ recordId: id }, () => {
        this.loadRecord()
      })
    }
  },

  onShow() {
    // 从详情页返回后可能已被删除，刷新状态
    if (this.data.recordId) {
      this.loadRecord()
    }
  },

  loadRecord() {
    const record = app.getRecordById(this.data.recordId)
    this.setData({ record })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  /**
   * 删除记录
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmText: '确定删除',
      confirmColor: '#E0745C',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          app.deleteRecord(this.data.recordId)

          wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1200
          })

          setTimeout(() => {
            wx.navigateBack()
          }, 1200)
        }
      }
    })
  }
})
