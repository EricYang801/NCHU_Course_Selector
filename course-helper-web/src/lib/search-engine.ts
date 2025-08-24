// 統一課程搜尋引擎：建立標準化索引、提供彈性查詢條件
import { Course } from './course-types'
import { DEPARTMENT_ABBREVIATIONS } from './course-utils'

export interface SearchFilters {
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

export interface SearchResult<T = Course> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface IndexedCourse extends Course {
  __lc_title: string
  __lc_prof: string
  __lc_dept_all: string
  // 單獨 tokens：開課系所 (department)
  __dept_open_tokens: Set<string>
  // 單獨 tokens：上課/修課對象 (for_dept)
  __dept_for_tokens: Set<string>
  // 合併（僅供關鍵字模糊用）
  __dept_all_tokens: Set<string>
  career?: string
}

export class CourseSearchEngine {
  private indexed: IndexedCourse[] = []
  private careerNameMap: Record<string,string>

  constructor(careerNameMap: Record<string,string>) {
    this.careerNameMap = careerNameMap
  }

  build(courses: Course[]): void {
    this.indexed = courses.map(c => this.indexCourse(c))
  }

  private indexCourse(c: Course): IndexedCourse {
    const title = (c.title_parsed?.zh_TW || c.title || '').toLowerCase()
    const prof = (Array.isArray(c.professor) ? c.professor.join(' ') : (c.professor || '')).toLowerCase()
    const openRaw = (c.department || '').trim()
    const forRaw = (c.for_dept || '').trim()
    const allRaw = `${openRaw} ${forRaw}`.trim()

    const buildTokens = (raw: string): Set<string> => {
      const set = new Set<string>()
      if (!raw) return set
      raw.split(/[\s、,/()]+/).forEach(t => t && set.add(t))
      for (const [abbr, fulls] of Object.entries(DEPARTMENT_ABBREVIATIONS)) {
        if (raw.includes(abbr) || fulls.some(f => raw.includes(f))) {
          set.add(abbr); fulls.forEach(f => set.add(f))
        }
      }
      return set
    }

    const openTokens = buildTokens(openRaw)
    const forTokens = buildTokens(forRaw)
    const allTokens = new Set<string>([...openTokens, ...forTokens])

    return {
      ...c,
      __lc_title: title,
      __lc_prof: prof,
      __lc_dept_all: allRaw.toLowerCase(),
      __dept_open_tokens: openTokens,
      __dept_for_tokens: forTokens,
      __dept_all_tokens: allTokens,
    }
  }

  private expandDept(term: string): Set<string> {
    const set = new Set<string>()
    const q = term.trim()
    if (!q) return set
    set.add(q)
    for (const [abbr, fulls] of Object.entries(DEPARTMENT_ABBREVIATIONS)) {
      if (abbr.includes(q) || q.includes(abbr)) { set.add(abbr); fulls.forEach(f => set.add(f)) }
      if (fulls.some(f => f.includes(q) || q.includes(f))) { set.add(abbr); fulls.forEach(f => set.add(f)) }
    }
    return set
  }

  private matchTimeSlots(course: Course, searchSlots: string[], mode: 'any' | 'all' | 'exact'): boolean {
    if (!course.time_parsed || !Array.isArray(course.time_parsed)) return false
    
    // 將課程時間轉換為我們的格式 (dayTime format)
    const courseSlots = new Set<string>()
    course.time_parsed.forEach(timeSlot => {
      if (timeSlot.day && timeSlot.time && Array.isArray(timeSlot.time)) {
        timeSlot.time.forEach(period => {
          courseSlots.add(`${timeSlot.day}${period}`)
        })
      }
    })
    
    const searchSlotsSet = new Set(searchSlots)
    
    switch (mode) {
      case 'any':
        // 包含任一時間：課程時間與搜尋時間有交集
        return searchSlots.some(slot => courseSlots.has(slot))
      
      case 'all':
        // 包含所有時間：課程時間包含所有搜尋時間
        return searchSlots.every(slot => courseSlots.has(slot))
      
      case 'exact':
        // 完全相符：課程時間與搜尋時間完全相同
        return courseSlots.size === searchSlotsSet.size && 
               Array.from(courseSlots).every(slot => searchSlotsSet.has(slot))
      
      default:
        return false
    }
  }

  search(filters: SearchFilters): SearchResult<Course> {
  const { keyword, department, for_dept, career, professor, credits, time, year, obligatory, page = 1, limit = 20 } = filters
    let list = this.indexed

    if (keyword && keyword.trim()) {
      const kw = keyword.toLowerCase().trim()
      list = list.filter(c =>
        c.__lc_title.includes(kw) ||
        c.code?.toLowerCase().includes(kw) ||
        c.__lc_prof.includes(kw) ||
        Array.from(c.__dept_all_tokens).some(t => t.toLowerCase().includes(kw))
      )
    }

    if (department) {
      const terms = this.expandDept(department)
      list = list.filter(c => Array.from(terms).some(t => c.__dept_open_tokens.has(t)))
    }
    if (for_dept) {
      const terms = this.expandDept(for_dept)
      list = list.filter(c => Array.from(terms).some(t => c.__dept_for_tokens.has(t)))
    }
    if (career) {
      list = list.filter(c => (c as IndexedCourse).career === career || this.careerNameMap[(c as IndexedCourse).career || ''] === career)
    }
    if (year) {
      const y = year.trim()
      if (y) {
        // JSON uses `class` for grade/year in many files; fall back to `year` if present
        list = list.filter(c => {
          const record = c as unknown as Record<string, unknown>
          const classField = record['class'] ?? record['year'] ?? ''
          const clsRaw = (typeof classField === 'string' || typeof classField === 'number') ? String(classField).trim() : ''
          const clsNum = parseInt(clsRaw, 10)
          const selNum = parseInt(y, 10)
          if (!isNaN(selNum)) {
            if (selNum >= 5) {
              // 5 表示 "5 年級以上"
              return !isNaN(clsNum) && clsNum >= 5
            }
            return !isNaN(clsNum) && clsNum === selNum
          }
          // fallback to string comparison
          return clsRaw === y || clsRaw.includes(y)
        })
      }
    }
    if (obligatory) {
      const o = obligatory.trim().toLowerCase()
      if (o === 'required') {
        list = list.filter(c => c.obligatory_tf === true || (c.obligatory || '').toLowerCase().includes('必'))
      } else if (o === 'optional') {
        list = list.filter(c => c.obligatory_tf === false || (c.obligatory || '').toLowerCase().includes('選'))
      }
    }
    if (professor) {
      const p = professor.toLowerCase()
      list = list.filter(c => c.__lc_prof.includes(p))
    }
    if (typeof credits === 'number') {
      list = list.filter(c => c.credits_parsed === credits)
    }
    if (time) {
      // 嘗試解析新的時間搜尋格式
      try {
        const timeFilter = JSON.parse(time) as { slots: string[], mode: 'any' | 'all' | 'exact' }
        if (timeFilter.slots && Array.isArray(timeFilter.slots)) {
          list = list.filter(c => this.matchTimeSlots(c, timeFilter.slots, timeFilter.mode))
        }
      } catch {
        // 向後兼容舊的時間搜尋格式
        list = list.filter(c => {
          const t = Array.isArray(c.time) ? c.time.join(' ') : (c.time || '')
          return t.includes(time)
        })
      }
    }

    const total = list.length
    const start = (page - 1) * limit
    const end = start + limit
    return { items: list.slice(start, end), total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
