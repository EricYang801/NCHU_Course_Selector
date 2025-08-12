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

  search(filters: SearchFilters): SearchResult<Course> {
    const { keyword, department, for_dept, career, professor, credits, time, page = 1, limit = 20 } = filters
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
      list = list.filter(c => (c as any).career === career || this.careerNameMap[(c as any).career] === career)
    }
    if (professor) {
      const p = professor.toLowerCase()
      list = list.filter(c => c.__lc_prof.includes(p))
    }
    if (typeof credits === 'number') {
      list = list.filter(c => c.credits_parsed === credits)
    }
    if (time) {
      list = list.filter(c => {
        const t = Array.isArray(c.time) ? c.time.join(' ') : (c.time || '')
        return t.includes(time)
      })
    }

    const total = list.length
    const start = (page - 1) * limit
    const end = start + limit
    return { items: list.slice(start, end), total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
