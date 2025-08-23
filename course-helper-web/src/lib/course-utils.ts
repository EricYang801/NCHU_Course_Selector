// 課程相關的共用工具函數和常數

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
export const getCareerFromDepartment = (department?: string): string => {
  // 防禦性檢查：如果沒有 department（undefined/null/非字串），回傳 '其他'
  if (!department || typeof department !== 'string') return '其他'

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

import departments from './data/departments.json'

// 系所縮寫對照表（從外部 JSON 載入）
export const DEPARTMENT_ABBREVIATIONS: Record<string, string[]> = departments as Record<string, string[]>
// (搜尋邏輯已遷移至 search-engine.ts)
