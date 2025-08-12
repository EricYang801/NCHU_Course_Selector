// 抽離出的課程型別定義，供前端靜態搜尋使用
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
