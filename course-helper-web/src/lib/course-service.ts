// 客戶端課程服務，替代原本的 API 路由
import { Course } from './course-crawler'
import { enhancedSearch } from './course-utils'

// 擴展 Course 接口以包含學制資訊
interface CourseWithCareer extends Course {
  career?: string
}

export interface CourseSearchParams {
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

export interface CourseSearchResult {
  courses: CourseWithCareer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class CourseService {
  private allCourses: CourseWithCareer[] = []
  private isLoaded = false

  // 公開方法以供統計使用
  public get courseCount(): number {
    return this.allCourses.length
  }

  async loadCourses(): Promise<void> {
    if (this.isLoaded) return

    // 確保在瀏覽器環境中執行
    if (typeof window === 'undefined') {
      return Promise.resolve()
    }

    try {
      // 載入所有課程資料
      const courseFiles = [
        { file: 'U_學士班.json', career: 'U' },
        { file: 'G_碩士班.json', career: 'G' },
        { file: 'D_博士班.json', career: 'D' },
        { file: 'N_進修部.json', career: 'N' },
        { file: 'W_在職專班.json', career: 'W' },
        { file: 'O_通識加體育課.json', career: 'O' }
      ]

      const allCoursesData = await Promise.all(
        courseFiles.map(async ({ file, career }) => {
          try {
            // 修改為相對路徑，確保在靜態站點中也能正確加載
            const response = await fetch(`${window.location.origin}/data/${file}`)
            if (!response.ok) {
              console.warn(`無法載入 ${file}，狀態碼: ${response.status}`)
              return []
            }
            const data = await response.json()
            const courses = (data.course || []).map((course: Course) => ({
              ...course,
              career // 添加學制資訊
            })) as CourseWithCareer[]
            return courses
          } catch (error) {
            console.warn(`載入 ${file} 時發生錯誤:`, error)
            return []
          }
        })
      )

      this.allCourses = allCoursesData.flat()
      this.isLoaded = true
      console.log(`已載入 ${this.allCourses.length} 門課程`)
    } catch (error) {
      console.error('載入課程資料時發生錯誤:', error)
      throw error
    }
  }

  async searchCourses(params: CourseSearchParams): Promise<CourseSearchResult> {
    await this.loadCourses()

    let filteredCourses = [...this.allCourses]

    // 關鍵字搜尋
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredCourses = filteredCourses.filter(course => {
        return enhancedSearch(keyword, course)
      })
    }

    // 開課系所篩選
    if (params.department) {
      filteredCourses = filteredCourses.filter(course => 
        course.department?.includes(params.department!)
      )
    }

    // 修課對象篩選
    if (params.for_dept) {
      filteredCourses = filteredCourses.filter(course => 
        course.for_dept?.includes(params.for_dept!)
      )
    }

    // 學制篩選
    if (params.career) {
      filteredCourses = filteredCourses.filter(course => 
        course.career === params.career
      )
    }

    // 教師篩選
    if (params.professor) {
      filteredCourses = filteredCourses.filter(course => {
        const professor = typeof course.professor === 'string' ? course.professor : Array.isArray(course.professor) ? course.professor.join(' ') : ''
        return professor.includes(params.professor!)
      })
    }

    // 學分篩選
    if (params.credits) {
      filteredCourses = filteredCourses.filter(course => 
        course.credits_parsed === params.credits
      )
    }

    // 時間篩選
    if (params.time) {
      filteredCourses = filteredCourses.filter(course => {
        const time = typeof course.time === 'string' ? course.time : Array.isArray(course.time) ? course.time.join(' ') : ''
        return time.includes(params.time!)
      })
    }

    // 分頁
    const page = params.page || 1
    const limit = params.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

    return {
      courses: paginatedCourses,
      total: filteredCourses.length,
      page,
      limit,
      totalPages: Math.ceil(filteredCourses.length / limit)
    }
  }

  async getCourseById(id: string): Promise<CourseWithCareer | null> {
    await this.loadCourses()
    return this.allCourses.find(course => course.code === id) || null
  }

  // 獲取所有系所
  async getDepartments(): Promise<string[]> {
    await this.loadCourses()
    const departments = new Set<string>()
    this.allCourses.forEach(course => {
      if (course.department) {
        departments.add(course.department)
      }
    })
    return Array.from(departments).sort()
  }

  // 獲取所有學制
  async getCareers(): Promise<string[]> {
    await this.loadCourses()
    const careers = new Set<string>()
    this.allCourses.forEach(course => {
      if (course.career) {
        careers.add(course.career)
      }
    })
    return Array.from(careers).sort()
  }
}

// 創建單例實例
export const courseService = new CourseService()
