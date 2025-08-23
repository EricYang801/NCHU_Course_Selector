// 客戶端課程服務：統一靜態 JSON 讀取 + 進階搜尋（含縮寫展開）
import { Course } from './course-types'
import { CourseSearchEngine } from './search-engine'

interface CourseWithCareer extends Course { career?: string }

export interface CourseSearchParams {
  keyword?: string
  department?: string
  for_dept?: string
  career?: string
  professor?: string
  credits?: number
  year?: string
  obligatory?: string
  time?: string
  page?: number
  limit?: number
}

export interface CourseSearchResult {
  courses: CourseWithCareer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 移除版本控制機制，直接使用 localStorage 快取，定期清理由使用者手動重新整理
const LS_KEY_DATA = 'courses:data'
const LS_KEY_TIMESTAMP = 'courses:fetchedAt'

class CourseService {
  private allCourses: CourseWithCareer[] = []
  private isLoaded = false
  private readonly CAREER_CODE_TO_NAME: Record<string, string> = { U: '學士班', G: '碩士班', D: '博士班', N: '進修部', W: '在職專班', O: '通識加體育課' }
  private searchEngine = new CourseSearchEngine(this.CAREER_CODE_TO_NAME)

  // 部門展開邏輯已整合進搜尋引擎索引與 expandDept

  public get courseCount(): number { return this.allCourses.length }

  async loadCourses(): Promise<void> {
    if (this.isLoaded) return
    if (typeof window === 'undefined') return Promise.resolve()

    // 嘗試從 localStorage 載入快取資料
    try {
      const raw = localStorage.getItem(LS_KEY_DATA)
      if (raw) {
        const parsed = JSON.parse(raw) as CourseWithCareer[]
        if (Array.isArray(parsed) && parsed.length) {
          this.allCourses = parsed
          this.isLoaded = true
          this.searchEngine.build(this.allCourses)
          console.log(`從快取載入 ${this.allCourses.length} 門課程`)
          return
        }
      }
    } catch (e) {
      console.warn('讀取本地快取失敗，將改為網路載入', e)
    }
    const courseFiles = [
      { file: 'U_學士班.json', career: 'U' }, { file: 'G_碩士班.json', career: 'G' },
      { file: 'D_博士班.json', career: 'D' }, { file: 'N_進修部.json', career: 'N' },
      { file: 'W_在職專班.json', career: 'W' }, { file: 'O_通識加體育課.json', career: 'O' }
    ]
    try {
      const allCoursesData = await Promise.all(courseFiles.map(async ({ file, career }) => {
        try {
          const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          const basePath = isLocalDev ? '' : '/NCHU_Course_Selector'
          const response = await fetch(`${window.location.origin}${basePath}/data/${file}`)
          if (!response.ok) { console.warn(`無法載入 ${file}，狀態碼: ${response.status}`); return [] }
          const data = await response.json()
          return (data.course || []).map((c: Course) => ({ ...c, career })) as CourseWithCareer[]
        } catch (e) { console.warn(`載入 ${file} 時發生錯誤:`, e); return [] }
      }))
  this.allCourses = allCoursesData.flat()
      this.isLoaded = true
      console.log(`已載入 ${this.allCourses.length} 門課程`)
  this.searchEngine.build(this.allCourses)

      // 寫入 localStorage 快取
      try {
        localStorage.setItem(LS_KEY_DATA, JSON.stringify(this.allCourses))
        localStorage.setItem(LS_KEY_TIMESTAMP, Date.now().toString())
        console.log(`從網路載入並快取 ${this.allCourses.length} 門課程`)
      } catch (e) {
        console.warn('寫入本地快取失敗', e)
      }
    } catch (e) { console.error('載入課程資料時發生錯誤:', e); throw e }
  }

  /** 強制重新抓取（清除本地快取） */
  async refresh(forceNetwork = true): Promise<void> {
    if (typeof window === 'undefined') return
    if (forceNetwork) {
      localStorage.removeItem(LS_KEY_DATA)
      localStorage.removeItem(LS_KEY_TIMESTAMP)
    }
    this.isLoaded = false
    this.allCourses = []
    await this.loadCourses()
  }

  getVersion(): string { 
    // 返回快取時間作為版本資訊
    const timestamp = this.getCachedAt()
    return timestamp ? new Date(timestamp).toISOString() : 'unknown'
  }
  getCachedAt(): number | null {
    if (typeof window === 'undefined') return null
    const ts = localStorage.getItem(LS_KEY_TIMESTAMP)
    return ts ? parseInt(ts) : null
  }
  getStats(): { total: number; byCareer: Record<string, number> } {
    const byCareer: Record<string, number> = {}
    for (const c of this.allCourses) {
      const key = c.career || 'NA'
      byCareer[key] = (byCareer[key] || 0) + 1
    }
    return { total: this.allCourses.length, byCareer }
  }

  async searchCourses(params: CourseSearchParams): Promise<CourseSearchResult> {
    await this.loadCourses()
    const result = this.searchEngine.search({
      keyword: params.keyword,
      department: params.department,
      for_dept: params.for_dept,
      career: params.career,
      professor: params.professor,
      credits: params.credits,
  year: params.year,
  obligatory: params.obligatory,
      time: params.time,
      page: params.page,
      limit: params.limit
    })
    return { courses: result.items as CourseWithCareer[], total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }
  }

  async getCourseById(id: string): Promise<CourseWithCareer | null> {
    await this.loadCourses()
    return this.allCourses.find(c => c.code === id) || null
  }

  async getDepartments(): Promise<string[]> {
    await this.loadCourses()
    const set = new Set<string>()
    this.allCourses.forEach(c => c.department && set.add(c.department))
    return Array.from(set).sort()
  }

  async getCareers(): Promise<string[]> {
    await this.loadCourses()
    const set = new Set<string>()
    this.allCourses.forEach(c => c.career && set.add(c.career))
    return Array.from(set).sort()
  }
}

export const courseService = new CourseService()
