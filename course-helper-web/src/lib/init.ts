import { scheduler } from '@/lib/scheduler'
import { courseCache } from '@/lib/course-cache'

// 在應用啟動時初始化
export async function initializeApp() {
  console.log('正在初始化選課小幫手應用...')
  
  try {
    // 啟動定時任務
    scheduler.startAllJobs()
    console.log('定時任務已啟動')
    
    // 初始載入課程資料到快取（如果有的話）
    try {
      await courseCache.getAllCourses()
      console.log('課程資料已載入快取')
    } catch (error) {
      console.warn('載入課程資料到快取失敗，將在首次請求時載入:', error)
    }
    
    console.log('選課小幫手應用初始化完成')
  } catch (error) {
    console.error('應用初始化失敗:', error)
  }
}
