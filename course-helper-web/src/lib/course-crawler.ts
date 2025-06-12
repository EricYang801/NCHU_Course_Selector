import axios from 'axios'
import fs from 'fs-extra'
import path from 'path'

export interface Course {
  class: string
  code: string
  credits: string
  credits_parsed: number
  department: string
  discipline: string
  enrolled_num: string
  for_dept: string
  hours: string
  hours_parsed: string | number
  intern_location: string[]
  intern_time: string
  language: string
  location: string[]
  title: string
  title_parsed?: {
    en_US: string
    zh_TW: string
  }
  note: string
  number: string
  number_parsed: number
  obligatory: string
  obligatory_tf: boolean
  professor: string | string[]
  time: string | string[]
  time_parsed?: Array<{
    day: number
    time: number[]
  }>
  url: string
  year: string
  prerequisite?: string
  program?: string
  selected_num?: string
  semester?: string
}

export interface CourseData {
  course: Course[]
}

export interface CareerMapping {
  [key: string]: string
}

export class NCHUCourseCrawler {
  private baseUrl = 'https://onepiece.nchu.edu.tw/cofsys/plsql/json_for_course'
  private dataDir: string
  private careerMapping: CareerMapping = {
    'U': '學士班',
    'O': '通識加體育課',
    'N': '進修部',
    'W': '在職專班',
    'G': '碩士班',
    'D': '博士班'
  }

  constructor(dataDir: string = './public/data') {
    this.dataDir = dataDir
    this.ensureDataDir()
  }

  private async ensureDataDir(): Promise<void> {
    await fs.ensureDir(this.dataDir)
  }

  private cleanJsonText(text: string): string {
    // 確保輸入是字串
    if (typeof text !== 'string') {
      text = String(text)
    }
    // 移除所有 ASCII 控制字符 (0-31) 和 DEL + 擴展控制字符 (127-159)
    return text.replace(/[\x00-\x1f\x7f-\x9f]/g, '')
  }

  async fetchCourseData(career: string): Promise<CourseData | null> {
    const url = `${this.baseUrl}?p_career=${career}`
    const careerName = this.careerMapping[career] || career

    try {
      console.log(`開始爬取 ${careerName} 課程資料...`)
      
      const response = await axios.get(url, { timeout: 30000 })
      
      if (response.status === 200) {
        let data: CourseData
        
        // 檢查回應資料類型
        if (typeof response.data === 'string') {
          // 如果是字串，需要清理並解析
          const cleanedText = this.cleanJsonText(response.data)
          try {
            data = JSON.parse(cleanedText)
          } catch (error) {
            console.error(`${careerName} JSON 解析失敗:`, error)
            return null
          }
        } else if (typeof response.data === 'object' && response.data !== null) {
          // 如果已經是對象，直接使用
          data = response.data as CourseData
        } else {
          console.error(`${careerName} 回應資料格式不正確:`, typeof response.data)
          return null
        }
        
        console.log(`${careerName} 課程資料爬取成功，共 ${data.course?.length || 0} 筆資料`)
        return data
      } else {
        console.error(`${careerName} 課程資料爬取失敗，狀態碼: ${response.status}`)
        return null
      }
    } catch (error) {
      console.error(`${careerName} 網路請求失敗:`, error)
      return null
    }
  }

  async saveCourseData(career: string, data: CourseData): Promise<boolean> {
    const careerName = this.careerMapping[career] || career
    const filename = `${career}_${careerName}.json`
    const filepath = path.join(this.dataDir, filename)

    try {
      await fs.writeJson(filepath, data, { spaces: 2 })
      console.log(`${careerName} 資料已儲存至: ${filepath}`)
      return true
    } catch (error) {
      console.error(`儲存 ${careerName} 資料失敗:`, error)
      return false
    }
  }

  async crawlAllCareers(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}
    
    console.log('='.repeat(50))
    console.log('開始執行課程資料爬取任務')
    console.log('='.repeat(50))

    for (const career of Object.keys(this.careerMapping)) {
      const careerName = this.careerMapping[career]
      
      // 爬取資料
      const data = await this.fetchCourseData(career)
      
      if (data) {
        // 儲存資料
        const success = await this.saveCourseData(career, data)
        results[careerName] = success
      } else {
        results[careerName] = false
      }
      
      // 避免對伺服器造成過大負擔
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    this.printSummary(results)
    return results
  }

  private printSummary(results: { [key: string]: boolean }): void {
    console.log('='.repeat(50))
    console.log('爬取任務執行完成')
    console.log('='.repeat(50))
    
    const successful = Object.values(results).filter(success => success).length
    const total = Object.keys(results).length
    
    console.log(`總計: ${total} 個學制`)
    console.log(`成功: ${successful} 個`)
    console.log(`失敗: ${total - successful} 個`)
    console.log('')
    
    for (const [careerName, success] of Object.entries(results)) {
      const status = success ? '✓ 成功' : '✗ 失敗'
      console.log(`${careerName}: ${status}`)
    }
  }

  async loadCourseData(career?: string): Promise<CourseData[]> {
    const files = await fs.readdir(this.dataDir)
    const courseFiles = files.filter((file: string) => {
      if (career) {
        return file.startsWith(career) && file.endsWith('.json')
      }
      return file.endsWith('.json') && Object.keys(this.careerMapping).some(c => file.startsWith(c))
    })

    const allData: CourseData[] = []
    
    for (const file of courseFiles) {
      try {
        const filepath = path.join(this.dataDir, file)
        const data = await fs.readJson(filepath)
        allData.push(data)
      } catch (error) {
        console.error(`讀取文件 ${file} 失敗:`, error)
      }
    }

    return allData
  }

  getCareerMapping(): CareerMapping {
    return this.careerMapping
  }
}
