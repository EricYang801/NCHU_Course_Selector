import { CronJob } from 'cron'
import { courseCache } from './course-cache'

class SchedulerManager {
  private jobs: Map<string, CronJob> = new Map()

  constructor() {
    this.initializeJobs()
  }

  private initializeJobs(): void {
    // 每天 00:00 執行爬蟲任務
    const dailyCrawlerJob = new CronJob(
      '0 0 * * *', // 每天 00:00
      async () => {
        console.log(`[${new Date().toISOString()}] 開始執行定時爬蟲任務`)
        try {
          await courseCache.refreshCache()
          console.log(`[${new Date().toISOString()}] 定時爬蟲任務完成`)
        } catch (error) {
          console.error(`[${new Date().toISOString()}] 定時爬蟲任務失敗:`, error)
        }
      },
      null,
      false, // 不自動啟動
      'Asia/Taipei' // 台北時區
    )

    // 每小時清理快取統計
    const hourlyCacheCleanJob = new CronJob(
      '0 * * * *', // 每小時
      () => {
        const stats = courseCache.getCacheStats()
        console.log(`[${new Date().toISOString()}] 快取統計:`, stats)
      },
      null,
      false,
      'Asia/Taipei'
    )

    this.jobs.set('dailyCrawler', dailyCrawlerJob)
    this.jobs.set('hourlyCache', hourlyCacheCleanJob)
  }

  startAllJobs(): void {
    for (const [name, job] of this.jobs.entries()) {
      job.start()
      console.log(`定時任務 ${name} 已啟動`)
    }
  }

  stopAllJobs(): void {
    for (const [name, job] of this.jobs.entries()) {
      job.stop()
      console.log(`定時任務 ${name} 已停止`)
    }
  }

  startJob(name: string): boolean {
    const job = this.jobs.get(name)
    if (job) {
      job.start()
      console.log(`定時任務 ${name} 已啟動`)
      return true
    }
    return false
  }

  stopJob(name: string): boolean {
    const job = this.jobs.get(name)
    if (job) {
      job.stop()
      console.log(`定時任務 ${name} 已停止`)
      return true
    }
    return false
  }

  getJobStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {}
    for (const [name, job] of this.jobs.entries()) {
      // CronJob 沒有 running 屬性，我們需要自己追蹤狀態
      status[name] = job.cronTime !== null
    }
    return status
  }

  // 手動觸發爬蟲任務
  async triggerCrawler(): Promise<void> {
    console.log(`[${new Date().toISOString()}] 手動觸發爬蟲任務`)
    await courseCache.refreshCache()
    console.log(`[${new Date().toISOString()}] 手動爬蟲任務完成`)
  }
}

// 單例模式
export const scheduler = new SchedulerManager()
