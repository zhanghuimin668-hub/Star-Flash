/**
 * 星闪 - 首页逻辑
 * 输入卡片 + 心情卡片 + 时间线列表 + 日历视图 + 搜索筛选
 */
const app = getApp()
const util = require('../../utils/util')
const fs = wx.getFileSystemManager()

Page({
  data: {
    // 视图控制
    currentView: 'timeline',

    // ===== 输入卡片 =====
    inputContent: '',
    mediaList: [],        // [{id, type:'image'|'video', path, thumbPath, duration}]
    canPublish: false,

    // ===== 心情卡片 =====
    presetMoods: util.PRESET_MOODS,
    selectedMood: '',
    customMood: '',

    // ===== FAB 控制 =====
    showFab: false,

    // ===== 时间线数据 =====
    allRecords: [],
    filteredRecords: [],

    // ===== 筛选状态 =====
    showFilter: false,
    filterStartDate: '',
    filterEndDate: '',
    filterMood: '',
    hasActiveFilter: false,

    // ===== 日历数据 =====
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    calendarCells: [],
    selectedDate: '',
    dayRecords: []
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  // ===================== 页面滚动监听 =====================

  onPageScroll(e) {
    const showFab = e.scrollTop > 200
    if (showFab !== this.data.showFab) {
      this.setData({ showFab })
    }
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  // ===================== 数据加载 =====================

  loadRecords() {
    const records = app.getRecords()
    const formatted = records.map(r => ({
      ...r,
      formattedTime: util.formatTime(r.createdAt)
    }))

    this.setData({ allRecords: formatted }, () => {
      this.applyFilter()
      this.buildCalendar()
    })
  },

  // ===================== 视图切换 =====================

  switchToTimeline() {
    this.setData({ currentView: 'timeline' })
  },

  switchToCalendar() {
    this.setData({ currentView: 'calendar' }, () => {
      this.buildCalendar()
    })
  },

  // ===================== 输入卡片 =====================

  onInputContent(e) {
    this.setData({ inputContent: e.detail.value }, () => {
      this.checkCanPublish()
    })
  },

  /**
   * 合并媒体上传 —— 唯一的一个按钮
   * 点击弹出选择：相册图片 / 拍照 / 相册视频 / 拍摄视频
   */
  addMedia() {
    wx.showActionSheet({
      itemList: ['从相册选图片', '拍照', '从相册选视频', '拍摄视频'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: this.chooseImage('album'); break
          case 1: this.chooseImage('camera'); break
          case 2: this.chooseVideo('album'); break
          case 3: this.chooseVideo('camera'); break
        }
      }
    })
  },

  /**
   * 选择图片
   */
  chooseImage(sourceType) {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: [sourceType],
      success: (res) => {
        const newItems = res.tempFilePaths.map(path => ({
          id: util.generateId(),
          type: 'image',
          path,
          thumbPath: '',
          duration: 0
        }))
        this.setData({
          mediaList: [...this.data.mediaList, ...newItems]
        }, () => {
          this.checkCanPublish()
        })
      }
    })
  },

  /**
   * 选择视频
   */
  chooseVideo(sourceType) {
    wx.chooseVideo({
      sourceType: [sourceType],
      maxDuration: 60,
      compressed: true,
      success: (res) => {
        const newItem = {
          id: util.generateId(),
          type: 'video',
          path: res.tempFilePath,
          thumbPath: res.thumbTempFilePath || '',
          duration: res.duration
        }
        this.setData({
          mediaList: [...this.data.mediaList, newItem]
        }, () => {
          this.checkCanPublish()
        })
      }
    })
  },

  /**
   * 删除媒体项
   */
  removeMedia(e) {
    const index = e.currentTarget.dataset.index
    const mediaList = this.data.mediaList
    mediaList.splice(index, 1)
    this.setData({ mediaList }, () => {
      this.checkCanPublish()
    })
  },

  checkCanPublish() {
    const { inputContent, mediaList } = this.data
    const canPublish = !!(inputContent.trim() || mediaList.length > 0)
    this.setData({ canPublish })
  },

  // ===================== 心情卡片 =====================

  selectMood(e) {
    const mood = e.currentTarget.dataset.mood
    const newMood = this.data.selectedMood === mood ? '' : mood
    this.setData({
      selectedMood: newMood,
      customMood: ''
    })
  },

  onCustomMoodInput(e) {
    this.setData({
      customMood: e.detail.value,
      selectedMood: ''
    })
  },

  // ===================== 发布记录 =====================

  /**
   * 将临时文件保存到用户目录
   */
  saveFileToUserDir(tempPath, ext) {
    return new Promise((resolve) => {
      const savedPath = `${wx.env.USER_DATA_PATH}/starflash_${util.generateId()}.${ext || 'jpg'}`
      fs.saveFile({
        tempFilePath: tempPath,
        filePath: savedPath,
        success: () => resolve(savedPath),
        fail: () => resolve(tempPath)
      })
    })
  },

  async publishRecord() {
    const { inputContent, mediaList, selectedMood, customMood } = this.data

    if (!this.data.canPublish) {
      wx.showToast({ title: '请至少填写一项内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发布中...' })

    try {
      const images = []
      const videos = []

      // 分离图片和视频，并持久化文件
      for (const item of mediaList) {
        if (item.type === 'image') {
          const ext = item.path.split('.').pop() || 'jpg'
          const savedPath = await this.saveFileToUserDir(item.path, ext)
          images.push(savedPath)
        } else {
          const savedPath = await this.saveFileToUserDir(item.path, 'mp4')
          let savedThumb = ''
          if (item.thumbPath) {
            savedThumb = await this.saveFileToUserDir(item.thumbPath, 'jpg')
          }
          videos.push({
            filePath: savedPath,
            thumbPath: savedThumb,
            duration: item.duration
          })
        }
      }

      // 确定心情标签
      const mood = selectedMood || customMood.trim() || ''

      // 构建记录对象
      const record = {
        id: util.generateId(),
        content: inputContent.trim(),
        images,
        videos,
        mood,
        location: null,
        createdAt: util.getNowString()
      }

      // 保存
      app.saveRecord(record)

      // 清空输入
      this.setData({
        inputContent: '',
        mediaList: [],
        selectedMood: '',
        customMood: '',
        canPublish: false
      })

      // 刷新列表并滚到顶部
      this.loadRecords()
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })

      wx.hideLoading()
      wx.showToast({ title: '发布成功 ✨', icon: 'success', duration: 1500 })

    } catch (err) {
      wx.hideLoading()
      console.error('发布失败:', err)
      wx.showToast({ title: '发布失败，请重试', icon: 'none' })
    }
  },

  // ===================== 筛选功能 =====================

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  onStartDateChange(e) {
    this.setData({ filterStartDate: e.detail.value }, () => {
      this.applyFilter()
    })
  },

  onEndDateChange(e) {
    this.setData({ filterEndDate: e.detail.value }, () => {
      this.applyFilter()
    })
  },

  onMoodFilter(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ filterMood: mood }, () => {
      this.applyFilter()
    })
  },

  clearFilter() {
    this.setData({
      filterStartDate: '',
      filterEndDate: '',
      filterMood: '',
      hasActiveFilter: false,
      showFilter: false
    }, () => {
      this.applyFilter()
    })
  },

  applyFilter() {
    const { allRecords, filterStartDate, filterEndDate, filterMood } = this.data

    let filtered = [...allRecords]

    if (filterStartDate) {
      filtered = filtered.filter(r => util.getDatePart(r.createdAt) >= filterStartDate)
    }
    if (filterEndDate) {
      filtered = filtered.filter(r => util.getDatePart(r.createdAt) <= filterEndDate)
    }
    if (filterMood) {
      filtered = filtered.filter(r => r.mood === filterMood)
    }

    const hasActiveFilter = !!(filterStartDate || filterEndDate || filterMood)

    this.setData({
      filteredRecords: filtered,
      hasActiveFilter
    })
  },

  // ===================== 日历功能 =====================

  buildCalendar() {
    const { calendarYear, calendarMonth, allRecords } = this.data
    const cells = util.generateCalendar(calendarYear, calendarMonth, allRecords)

    this.setData({ calendarCells: cells })

    if (this.data.selectedDate) {
      this.loadDayRecords(this.data.selectedDate)
    }
  },

  prevMonth() {
    let { calendarYear, calendarMonth } = this.data
    if (calendarMonth === 0) {
      calendarYear -= 1
      calendarMonth = 11
    } else {
      calendarMonth -= 1
    }
    this.setData({ calendarYear, calendarMonth }, () => {
      this.buildCalendar()
    })
  },

  nextMonth() {
    let { calendarYear, calendarMonth } = this.data
    if (calendarMonth === 11) {
      calendarYear += 1
      calendarMonth = 0
    } else {
      calendarMonth += 1
    }
    this.setData({ calendarYear, calendarMonth }, () => {
      this.buildCalendar()
    })
  },

  onDayTap(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    this.setData({ selectedDate: date }, () => {
      this.loadDayRecords(date)
    })
  },

  loadDayRecords(date) {
    const { allRecords } = this.data
    const dayRecords = allRecords.filter(r => util.getDatePart(r.createdAt) === date)
    this.setData({ dayRecords })
  },

  // ===================== 页面导航 =====================

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  }
})
