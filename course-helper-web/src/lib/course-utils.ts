// 課程相關的共用工具函數和常數
import { Course } from './course-crawler'

// 學制顏色配置
export const CAREER_COLORS = {
  '學士班': 'bg-blue-100 border-blue-300 text-blue-800',
  '碩士班': 'bg-green-100 border-green-300 text-green-800',
  '博士班': 'bg-purple-100 border-purple-300 text-purple-800',
  '進修部': 'bg-orange-100 border-orange-300 text-orange-800',
  '在職專班': 'bg-red-100 border-red-300 text-red-800',
  '通識加體育課': 'bg-gray-100 border-gray-300 text-gray-800',
  '其他': 'bg-slate-100 border-slate-300 text-slate-800'
}

// 從系所名稱判斷學制
export const getCareerFromDepartment = (department: string): string => {
  // 博士相關：博士班、博士學位學程、博士學程
  if (department.includes('博士')) return '博士班'
  
  // 碩士相關：碩士班、碩專班、碩士在職專班、碩士學位學程
  if (department.includes('碩士')) return '碩士班'
  
  // 在職專班相關
  if (department.includes('在職專班') || department.includes('碩專班')) return '在職專班'
  
  // 進修部相關
  if (department.includes('進修部') || department.includes('進修學士班')) return '進修部'
  
  // 通識體育相關
  if (department.includes('通識') || department.includes('體育') || 
      department.includes('外語教學') || department.includes('軍訓') ||
      department.includes('藝術') || department.includes('文學') && !department.includes('學系')) {
    return '通識加體育課'
  }
  
  // 學士班相關：學士班、學士學位學程（排除碩士、博士、進修、在職）
  if (department.includes('學士') || 
      (!department.includes('碩士') && !department.includes('博士') && 
       !department.includes('進修') && !department.includes('在職') &&
       (department.includes('學系') || department.includes('學院') || department.includes('學程')))) {
    return '學士班'
  }
  
  return '其他'
}

// 獲取學制對應的顏色樣式
export const getCareerColorClass = (deptName: string): string => {
  const career = getCareerFromDepartment(deptName)
  return CAREER_COLORS[career as keyof typeof CAREER_COLORS] || CAREER_COLORS['其他']
}

// 時間對照表
export const TIME_SLOTS = [
  '08:10-09:00',
  '09:10-10:00', 
  '10:10-11:00',
  '11:10-12:00',
  '13:10-14:00',
  '14:10-15:00',
  '15:10-16:00',
  '16:10-17:00',
  '17:10-18:00',
  '18:10-19:00',
  '19:10-20:00',
  '20:10-21:00',
  '21:10-22:00'
]

// 星期對照表
export const DAYS = ['一', '二', '三', '四', '五', '六', '日']

// 系所縮寫對照表
export const DEPARTMENT_ABBREVIATIONS: Record<string, string[]> = {
  // 理學院
  '資工': ['資訊工程', '資工系', '資訊工程學系', '資訊工程系'],
  '電機': ['電機工程', '電機系', '電機工程學系', '電機工程系'],
  '化工': ['化學工程', '化工系', '化學工程學系', '化學工程系'],
  '材料': ['材料科學', '材料系', '材料科學與工程學系', '材料工程系'],
  '土木': ['土木工程', '土木系', '土木工程學系', '土木工程系'],
  '機械': ['機械工程', '機械系', '機械工程學系', '機械工程系'],
  '環工': ['環境工程', '環工系', '環境工程學系', '環境工程系'],
  '數學': ['應用數學', '數學系', '應用數學系', '應用數學學系'],
  '物理': ['物理學系', '物理系', '應用物理', '物理'],
  '化學': ['化學系', '化學學系'],
  
  // 文學院
  '中文': ['中國文學', '中文系', '中國文學系', '中國文學學系'],
  '外文': ['外國語文', '外文系', '外國語文學系', '英語'],
  '歷史': ['歷史學系', '歷史系'],
  '圖資': ['圖書資訊', '圖資系', '圖書資訊學系'],
  
  // 農學院
  '農藝': ['農藝學系', '農藝系'],
  '園藝': ['園藝學系', '園藝系'],
  '森林': ['森林學系', '森林系', '森林系'],
  '動科': ['動物科學', '動科系', '動物科學系'],
  '土壤': ['土壤環境', '土壤系', '土壤環境科學系'],
  '昆蟲': ['昆蟲學系', '昆蟲系'],
  '植病': ['植物病理', '植病系', '植物病理學系'],
  '食生': ['食品暨應用生物科技', '食生系', '食品生物'],
  '生技': ['生物科技', '生技系'],
  
  // 生命科學院
  '生科': ['生命科學', '生科系', '生命科學系'],
  '生醫': ['生醫工程', '生醫系', '生物醫學工程'],
  
  // 獸醫學院
  '獸醫': ['獸醫學系', '獸醫系'],
  
  // 管理學院
  '企管': ['企業管理', '企管系', '企業管理學系'],
  '會計': ['會計學系', '會計系'],
  '財金': ['財務金融', '財金系', '財務金融學系'],
  '資管': ['資訊管理', '資管系', '資訊管理學系'],
  '行銷': ['行銷學系', '行銷系'],
  '國企': ['國際企業', '國企系', '國際企業學系'],
  
  // 法政學院
  '法律': ['法律學系', '法律系'],
  '政治': ['政治學系', '政治系'],
  '國政': ['國際政治', '國政系', '國際政治研究所'],
  
  // 其他常見縮寫
  '通識': ['通識教育', '通識課程'],
  '體育': ['體育', '體育課程'],
  '軍訓': ['軍訓', '全民國防'],
  '服務': ['服務學習'],
  'EMBA': ['高階經理人碩士在職專班'],
}

// 縮寫匹配函數
export const matchAbbreviation = (keyword: string, text: string): boolean => {
  const lowerKeyword = keyword.toLowerCase()
  const lowerText = text.toLowerCase()
  
  // 直接匹配
  if (lowerText.includes(lowerKeyword)) {
    return true
  }
  
  // 縮寫匹配
  for (const [abbr, fullNames] of Object.entries(DEPARTMENT_ABBREVIATIONS)) {
    if (lowerKeyword.includes(abbr.toLowerCase())) {
      for (const fullName of fullNames) {
        if (lowerText.includes(fullName.toLowerCase())) {
          return true
        }
      }
    }
  }
  
  return false
}

// 增強的搜尋匹配函數
export const enhancedSearch = (keyword: string, course: Course): boolean => {
  const fields = [
    course.title || '',
    course.code || '',
    course.department || '',
    course.for_dept || '',
    Array.isArray(course.professor) ? course.professor.join(' ') : (course.professor || '')
  ]
  
  return fields.some(field => matchAbbreviation(keyword, field))
}
