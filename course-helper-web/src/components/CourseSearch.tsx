'use client'

import { useState} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFilters {
  keyword: string
  for_dept: string
  career: string
  professor: string
  credits: string
  timeDay: string
  timePeriods: string
}

interface CourseSearchProps {
  onSearch?: () => void
}

export default function CourseSearch({ onSearch }: CourseSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: searchParams.get('keyword') || '',
    for_dept: searchParams.get('for_dept') || searchParams.get('department') || '',
    career: searchParams.get('career') || '',
    professor: searchParams.get('professor') || '',
    credits: searchParams.get('credits') || '',
    timeDay: searchParams.get('timeDay') || '',
    timePeriods: searchParams.get('timePeriods') || ''
  })
  const timePeriodArray = filters.timePeriods
  ? filters.timePeriods.split(',').map(p => parseInt(p))
  : []

  const [isAdvanced, setIsAdvanced] = useState(false)

  const careerOptions = [
    { value: '', label: '全部學制' },
    { value: 'U', label: '學士班' },
    { value: 'G', label: '碩士班' },
    { value: 'D', label: '博士班' },
    { value: 'N', label: '進修部' },
    { value: 'W', label: '在職專班' },
    { value: 'O', label: '通識加體育課' }
  ]

  const creditOptions = [
    { value: '', label: '全部學分' },
    { value: '1', label: '1 學分' },
    { value: '2', label: '2 學分' },
    { value: '3', label: '3 學分' },
    { value: '4', label: '4 學分' },
    { value: '5', label: '5 學分' },
    { value: '6', label: '6 學分或以上' }
  ]

const dayMap = {
  M: '週一',
  T: '週二',
  W: '週三',
  R: '週四',
  F: '週五'
};

// const timeOptions = [
//   { value: '', label: '全部時間' },
//   ...Object.entries(dayMap).flatMap(([dayCode, dayName]) =>
//     Array.from({ length: 13 }, (_, i) => {
//       const period = i + 1;
//       return {
//         value: `${dayCode}${period}`,
//         label: `${dayName}第${period}節`
//       };
//     })
//   )
// ];


  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

const handleSearch = () => {
    // 更新 URL 參數
    const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
    }
    })
    
    const searchString = params.toString()
    router.push(searchString ? `/?${searchString}` : '/')
    
    // 呼叫父組件的搜尋函數
    if (onSearch) {
      onSearch()
    }
  }

  const handleClear = () => {
    const emptyFilters: SearchFilters = {
      keyword: '',
      for_dept: '',
      career: '',
      professor: '',
      credits: '',
      timeDay: '',
      timePeriods:''
    }
    setFilters(emptyFilters)
    router.push('/')
    
    if (onSearch) {
      onSearch()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">課程搜尋</h2>
        <button
          onClick={() => setIsAdvanced(!isAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isAdvanced ? '簡易搜尋' : '進階搜尋'}
        </button>
      </div>

      <div className="space-y-3">
        {/* 關鍵字搜尋 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            關鍵字搜尋
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleInputChange('keyword', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入課程名稱、課程代碼、教授姓名或系所縮寫（如：資工、電機、企管）..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-gray-400"
          />
        </div>

        {/* 進階搜尋選項 */}
        {isAdvanced && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            {/* 上課系所 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上課系所
              </label>
              <input
                type="text"
                value={filters.for_dept}
                onChange={(e) => handleInputChange('for_dept', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="例：資工系、電機系、EMBA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-gray-400"
              />
            </div>

            {/* 學制 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                學制
              </label>
              <div className="relative">
                <select
                  value={filters.career}
                  onChange={(e) => handleInputChange('career', e.target.value)}
                  className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                    filters.career === '' ? 'text-gray-400' : 'text-black'
                  }`}
                >
                  {careerOptions.map(option => (
                    <option key={option.value} value={option.value} className={option.value === '' ? 'text-gray-400' : 'text-black'}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 教授 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教授
              </label>
              <input
                type="text"
                value={filters.professor}
                onChange={(e) => handleInputChange('professor', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="教授姓名"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black placeholder:text-gray-400"
              />
            </div>

            {/* 學分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                學分
              </label>
              <div className="relative">
                <select
                  value={filters.credits}
                  onChange={(e) => handleInputChange('credits', e.target.value)}
                  className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                    filters.credits === '' ? 'text-gray-400' : 'text-black'
                  }`}
                >
                  {creditOptions.map(option => (
                    <option key={option.value} value={option.value} className={option.value === '' ? 'text-gray-400' : 'text-black'}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 上課時間 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上課時間
              </label>
              <div className="relative">
                <select
              value={filters.timeDay}
              onChange={(e) => handleInputChange('timeDay', e.target.value)}

              className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                    filters.timeDay === '' ? 'text-gray-400' : 'text-black'
                  }`}
            >
              <option value="">全部時間</option>
              {Object.entries(dayMap).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            
              <div className="mt-4">
                {/* 用迴圈產生 13 個勾選框代表 1～13 節 */}
                {Array.from({ length: 13 }, (_, i) => i + 1).map(period => (
                  <label key={period} className="inline-block mr-2 mb-2">
                    <input
                      type="checkbox"
                      // checked={timePeriods.includes(period)}
                      checked={timePeriodArray.includes(period)}
                      className="mr-2"
                      onChange={() => {
                      const newTimePeriods = timePeriodArray.includes(period)
                        ? timePeriodArray.filter(p => p !== period)
                        : [...timePeriodArray, period]

                      handleInputChange('timePeriods', newTimePeriods.join(','))
                    }}
                    />
                    第{period}節
                  </label>
                ))}
              </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 節次 */}
        {/* <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
                節次
              </label>
        </div> */}
        {/* 按鈕 */}
        <div className="flex space-x-2 pt-3">
          <button
            onClick={handleSearch}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
          >
            搜尋課程
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
          >
            清除
          </button>
        </div>
      </div>
    </div>
  )
}
