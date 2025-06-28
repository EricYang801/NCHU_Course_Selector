import NodeCache from 'node-cache'
import { NCHUCourseCrawler, Course } from './course-crawler'

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
  timeDay?: string         // 週幾 (M, T, W, R, F)
  timePeriods?: string     // 節次字串，例如 "1,2,3"
}

export interface CourseSearchResult {
  courses: Course[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class CourseCache {
  private cache: NodeCache
  private crawler: NCHUCourseCrawler
  private readonly CACHE_KEY = 'all_courses'
  private readonly CACHE_TTL = 24 * 60 * 60 // 24 小時

  // 系所縮寫對應表
  private readonly DEPT_ABBREVIATIONS: { [key: string]: string[] } = {
    // 文學院
    '中文系': ['中國文學系'],
    '外文系': ['外國語文學系'],
    '歷史系': ['歷史學系'],
    '台文學士學程': ['台灣人文創新學士學位學程'],
    '圖資所': ['圖書資訊學研究所'],
    '台文所': ['台灣文學與跨國文化研究所'],
    '跨文化學程': ['台灣與跨文化研究國際博士學位學程'],
    '文創學程': ['數位人文與文創產業學士學位學程'],
    
    // 農資學院
    '農藝系': ['農藝學系'],
    '園藝系': ['園藝學系'],
    '森林系': ['森林學系'],
    '應經系': ['應用經濟學系'],
    '植病系': ['植物病理學系'],
    '昆蟲系': ['昆蟲學系'],
    '動科系': ['動物科學系'],
    '土環系': ['土壤環境科學系'],
    '水保系': ['水土保持學系'],
    '食生系': ['食品暨應用生物科技學系'],
    '生機系': ['生物產業機電工程學系'],
    '生技所': ['生物科技學研究所'],
    '生管所': ['生物產業管理研究所'],
    '食安所': ['食品安全研究所'],
    '農企業碩專班': ['農業企業經營管理碩士在職專班'],
    '生技學程': ['生物科技學士學位學程'],
    '景觀學程': ['景觀與遊憩學士學位學程'],
    '景觀碩士學程': ['景觀與遊憩碩士學位學程'],
    '生管學程': ['生物產業管理進修學士學位學程'],
    '國農企學程': ['國際農企業學士學位學程'],
    '國農碩學程': ['國際農學碩士學位學程'],
    '農經學程': ['農業經濟與行銷碩士學位學程'],
    '植醫學程': ['植物醫學暨安全農業碩士學位學程'],
    '國農博學程': ['國際農學博士學位學程'],
    
    // 理學院
    '化學系': ['化學系'],
    '應數系': ['應用數學系'],
    '物理系': ['物理學系'],
    '奈米所': ['奈米科學研究所'],
    '統計所': ['統計學研究所'],
    '資科所': ['資料科學與資訊計算研究所'],
    '大數據學程': ['大數據產學研發博士學位學程'],
    '人工智慧學程': ['人工智慧與資料科學碩士在職學位學程'],
    
    // 工學院
    '土木系': ['土木工程學系'],
    '機械系': ['機械工程學系'],
    '環工系': ['環境工程學系'],
    '化工系': ['化學工程學系'],
    '材料系': ['材料科學與工程學系'],
    '智慧創意學程': ['智慧創意工程學士學位學程'],
    '精密所': ['精密工程研究所'],
    '醫工所': ['生醫工程研究所'],
    
    // 生命科學院
    '生科系': ['生命科學系'],
    '分生所': ['分子生物學研究所'],
    '生化所': ['生物化學研究所'],
    '生醫所': ['生物醫學研究所'],
    '生科院碩專班': ['生命科學院碩士在職專班'],
    '基資所': ['基因體暨生物資訊學研究所'],
    '精準健康碩士': ['精準健康碩士學位學程'],
    '醫科學程': ['醫學生物科技博士學位學程'],
    '轉譯醫學學程': ['轉譯醫學博士學位學程'],
    '生創博士學程': ['生技產業創新研發與管理博士學位學程'],
    
    // 獸醫學院
    '獸醫系': ['獸醫學系'],
    '微衛所': ['微生物暨公共衛生學研究所'],
    '獸病所': ['獸醫病理生物學研究所'],
    
    // 管理學院
    '財金系': ['財務金融學系'],
    '企管系': ['企業管理學系'],
    '行銷系': ['行銷學系'],
    '資管系': ['資訊管理學系'],
    '會計系': ['會計學系'],
    '科管所': ['科技管理研究所'],
    '運健所': ['運動與健康管理研究所'],
    'EMBA': ['高階經理人碩士在職專班'],
    '創產經營學程': ['創新產業經營學士學位學程'],
    
    // 法政學院
    '法律系': ['法律學系'],
    '國政所': ['國際政治研究所'],
    '國務所': ['國家政策與公共事務研究所'],
    '教研所': ['教師專業發展研究所'],
    '亞洲中國學程': ['亞洲與中國研究英語碩士學位學程'],
    
    // 電機資訊學院
    '電機系': ['電機工程學系'],
    '資工系': ['資訊工程學系'],
    '電資學士班': ['電機資訊學院學士班'],
    '通訊所': ['通訊工程研究所'],
    '光電所': ['光電工程研究所'],
    
    // 醫學院
    '學士後醫學系': ['學士後醫學系'],
    '臨醫所': ['臨床醫學研究所'],
    '臨護所': ['臨床護理研究所'],
    '組醫學程': ['組織工程與再生醫學博士學位學程'],
    
    // 創新產業暨國際學院
    '跨洲學程': ['全球事務研究跨洲碩士學位學程'],
    'TMP': ['全球事務研究跨洲碩士學位學程'],
    '永續碩士學程': ['生物與永續科技碩士學位學程'],
    '永續博士學程': ['生物與永續科技博士學位學程'],
    
    // 循環經濟研究學院
    '代謝碩士學程': ['特用作物及代謝體碩士學位學程'],
    '代謝博士學程': ['特用作物及代謝體博士學位學程'],
    '植保碩士學程': ['植物保健碩士學位學程'],
    '植保博士學程': ['植物保健博士學位學程'],
    '農企碩士學程': ['國際精準農企業發展碩士學位學程'],
    '農企博士學程': ['國際精準農企業發展博士學位學程'],
    '智科碩士學程': ['工業與智慧科技碩士學位學程'],
    '智科博士學程': ['工業與智慧科技博士學位學程'],
    '半導體碩學程': ['半導體與綠色科技碩士學位學程'],
    '半導體博學程': ['半導體與綠色科技博士學位學程'],
    '微基學程': ['微生物基因體學博士學位學程']
  }

  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: this.CACHE_TTL,
      checkperiod: 60 * 10 // 每 10 分鐘檢查過期
    })
    this.crawler = new NCHUCourseCrawler()
  }

  // 展開系所縮寫搜尋
  private expandDeptSearch(query: string): string[] {
    const searchTerms = [query] // 包含原始搜尋詞
    
    // 檢查是否為縮寫
    if (this.DEPT_ABBREVIATIONS[query]) {
      searchTerms.push(...this.DEPT_ABBREVIATIONS[query])
    }
    
    // 同時檢查是否有其他縮寫指向這個完整名稱
    for (const [abbr, fullNames] of Object.entries(this.DEPT_ABBREVIATIONS)) {
      if (fullNames.some(name => name.includes(query) || query.includes(name))) {
        searchTerms.push(abbr, ...fullNames)
      }
    }
    
    // 去重並返回
    return [...new Set(searchTerms)]
  }

  async getAllCourses(): Promise<Course[]> {
    // 檢查快取
    const cachedCourses = this.cache.get<Course[]>(this.CACHE_KEY)
    if (cachedCourses) {
      console.log('從快取獲取課程資料')
      return cachedCourses
    }

    // 從文件讀取資料
    console.log('從文件讀取課程資料')
    const allData = await this.crawler.loadCourseData()
    const allCourses: Course[] = []
    
    for (const data of allData) {
      if (data.course) {
        allCourses.push(...data.course)
      }
    }

    // 更新快取
    this.cache.set(this.CACHE_KEY, allCourses)
    return allCourses
  }

  async searchCourses(params: CourseSearchParams): Promise<CourseSearchResult> {
    // console.log("✅ 快取的 searchCourses 被呼叫了", params);
    const allCourses = await this.getAllCourses()
    let filteredCourses = [...allCourses]

    // 關鍵字搜尋
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredCourses = filteredCourses.filter(course => {
        const titleMatch = course.title?.toLowerCase().includes(keyword)
        const codeMatch = course.code?.toLowerCase().includes(keyword)
        const professorMatch = typeof course.professor === 'string' 
          ? course.professor.toLowerCase().includes(keyword)
          : Array.isArray(course.professor) && course.professor.some(prof => prof.toLowerCase().includes(keyword))
        const departmentMatch = course.department?.toLowerCase().includes(keyword)
        const forDeptMatch = course.for_dept?.toLowerCase().includes(keyword)
        
        // 檢查系所縮寫匹配
        const deptSearchTerms = this.expandDeptSearch(params.keyword!)
        const deptAbbrevMatch = deptSearchTerms.some(term => 
          course.for_dept?.includes(term) || course.department?.includes(term)
        )
        
        return titleMatch || codeMatch || professorMatch || departmentMatch || forDeptMatch || deptAbbrevMatch
      })
    }

    // 系所篩選（開課系所）
    if (params.department) {
      filteredCourses = filteredCourses.filter(course => 
        course.department?.includes(params.department!)
      )
    }

    // 學制篩選
    if (params.career) {
      const careerMapping = this.crawler.getCareerMapping()
      const careerName = careerMapping[params.career] || params.career
      filteredCourses = filteredCourses.filter(course => 
        course.for_dept?.includes(careerName) || 
        course.department?.includes(careerName)
      )
    }

    // for_dept 篩選（上課系所）
    if (params.for_dept) {
      const searchTerms = this.expandDeptSearch(params.for_dept)
      filteredCourses = filteredCourses.filter(course => 
        searchTerms.some(term => course.for_dept?.includes(term))
      )
    }

    // 教授篩選
    if (params.professor) {
      const professorName = params.professor.toLowerCase()
      filteredCourses = filteredCourses.filter(course => 
        typeof course.professor === 'string' 
          ? course.professor.toLowerCase().includes(professorName)
          : Array.isArray(course.professor) && course.professor.some(prof => prof.toLowerCase().includes(professorName))
      )
    }

    // 學分篩選
    if (params.credits) {
      filteredCourses = filteredCourses.filter(course => 
        course.credits_parsed === params.credits
      )
    }

    // 篩選禮拜幾的課
    if (params.timeDay) {
      const dayMap = { M: 1, T: 2, W: 3, R: 4, F: 5 };
    const dayNum = dayMap[params.timeDay as keyof typeof dayMap];
    filteredCourses = filteredCourses.filter(course =>
      Array.isArray(course.time_parsed) &&  // 確認存在且是陣列
      course.time_parsed.some(slot =>
        slot.day == dayNum 
      )
    );
}
  // 篩選節次
  if(params.timePeriods)
  {
    const periods = params.timePeriods.split(',').map(str => Number(str.trim()));
    filteredCourses = filteredCourses.filter(course =>
      Array.isArray(course.time_parsed) &&  // 確認存在且是陣列
      course.time_parsed.some(slot =>
        slot.time.some(t => periods.includes(t))  // 篩選指定節次
      )
    );
  }


    // 分頁
    const page = params.page || 1
    const limit = params.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredCourses.length / limit)

    return {
      courses: paginatedCourses,
      total: filteredCourses.length,
      page,
      limit,
      totalPages
    }
  }

  async refreshCache(): Promise<void> {
    console.log('開始更新課程快取...')
    
    // 執行爬蟲任務
    await this.crawler.crawlAllCareers()
    
    // 清除舊快取
    this.cache.del(this.CACHE_KEY)
    
    // 重新載入資料到快取
    await this.getAllCourses()
    
    console.log('課程快取更新完成')
  }

  getCacheStats() {
    const keys = this.cache.keys()
    const stats = this.cache.getStats()
    
    return {
      keys: keys.length,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize
    }
  }

  clearCache(): void {
    this.cache.flushAll()
    console.log('快取已清空')
  }
}

// 單例模式
export const courseCache = new CourseCache()
