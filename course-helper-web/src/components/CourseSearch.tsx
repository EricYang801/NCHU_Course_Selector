'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFilters {
  keyword: string
  for_dept: string
  career: string
  professor: string
  credits: string
  year: string
  obligatory: string
  time: string
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
  year: searchParams.get('year') || '',
  obligatory: searchParams.get('obligatory') || '',
    time: searchParams.get('time') || ''
  })

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

  const yearOptions = [
  { value: '', label: '\u5168\u90e8\u5e74\u7d1a' },
  { value: '1', label: '1\u5e74\u7d1a' },
  { value: '2', label: '2\u5e74\u7d1a' },
  { value: '3', label: '3\u5e74\u7d1a' },
  { value: '4', label: '4\u5e74\u7d1a' },
  { value: '5', label: '5\u5e74\u7d1a\u4ee5\u4e0a' }
  ]

  const obligatoryOptions = [
  { value: '', label: '\u5168\u90e8' },
  { value: 'required', label: '\u5fc5\u4fee' },
  { value: 'optional', label: '\u9078\u4fee' }
  ]

  // 時間相關的常數和函數
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const timeSlots = Array.from({ length: 14 }, (_, i) => ({ period: i + 1 }))
  
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set())
  const [timeFilterMode, setTimeFilterMode] = useState<'any' | 'all' | 'exact'>('any')

  // 從URL參數中載入時間選擇
  useEffect(() => {
    const timeParam = searchParams.get('time')
    if (timeParam) {
      try {
        const timeFilter = JSON.parse(timeParam) as { slots: string[], mode: 'any' | 'all' | 'exact' }
        if (timeFilter.slots && Array.isArray(timeFilter.slots)) {
          // 將 dayTime 格式轉換為我們的 slotId 格式
          const slotIds = timeFilter.slots.map(slot => {
            if (slot.length >= 2) {
              const day = parseInt(slot.charAt(0)) - 1 // 轉換為0-based索引
              const period = parseInt(slot.substring(1))
              return `${day}-${period}`
            }
            return null
          }).filter(Boolean) as string[]
          
          setSelectedTimeSlots(new Set(slotIds))
          setTimeFilterMode(timeFilter.mode || 'any')
        }
      } catch {
        // 忽略解析錯誤
      }
    }
  }, [searchParams])

  // 處理時間槽點擊
  const handleTimeSlotClick = (dayIndex: number, period: number) => {
    const slotId = `${dayIndex}-${period}`
    setSelectedTimeSlots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(slotId)) {
        newSet.delete(slotId)
      } else {
        newSet.add(slotId)
      }
      return newSet
    })
  }

  // 清除時間選擇
  const clearTimeSelection = () => {
    setSelectedTimeSlots(new Set())
  }

  // 將時間選擇轉換為搜尋參數
  const getTimeSearchParams = () => {
    if (selectedTimeSlots.size === 0) return ''
    
    const slots = Array.from(selectedTimeSlots).map(slot => {
      const [dayIndex, period] = slot.split('-').map(Number)
      return `${dayIndex + 1}${period}`
    })
    
    return JSON.stringify({
      slots,
      mode: timeFilterMode
    })
  }

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
      if (value && key !== 'time') {
        params.set(key, value)
      }
    })
    
    // 處理時間參數
    const timeParams = getTimeSearchParams()
    if (timeParams) {
      params.set('time', timeParams)
    }
    
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
  year: '',
  obligatory: '',
  time: ''
    }
    setFilters(emptyFilters)
    setSelectedTimeSlots(new Set())
    setTimeFilterMode('any')
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
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

            {/* 年級 & 必/選修（並列） */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
                <div className="relative">
                  <select
                    value={filters.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                      filters.year === '' ? 'text-gray-400' : 'text-black'
                    }`}
                  >
                    {yearOptions.map(option => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">必/選修</label>
                <div className="relative">
                  <select
                    value={filters.obligatory}
                    onChange={(e) => handleInputChange('obligatory', e.target.value)}
                    className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                      filters.obligatory === '' ? 'text-gray-400' : 'text-black'
                    }`}
                  >
                    {obligatoryOptions.map(option => (
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
            </div>

            {/* 上課時間 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上課時間
              </label>
              
              {/* 篩選模式選擇 */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="any"
                      checked={timeFilterMode === 'any'}
                      onChange={(e) => setTimeFilterMode(e.target.value as 'any')}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700">包含任一時間</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={timeFilterMode === 'all'}
                      onChange={(e) => setTimeFilterMode(e.target.value as 'all')}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700">包含所有時間</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="exact"
                      checked={timeFilterMode === 'exact'}
                      onChange={(e) => setTimeFilterMode(e.target.value as 'exact')}
                      className="mr-1"
                    />
                    <span className="text-sm text-gray-700">完全相符</span>
                  </label>
                </div>
              </div>

              {/* 週課表時間選擇器 - 響應式設計 */}
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* 表頭 */}
                <div className="grid grid-cols-8 bg-gray-50">
                  <div className="p-1 sm:p-2 text-center text-xs font-medium text-gray-700 border-r border-gray-200">
                    節次
                  </div>
                  {weekDays.map((day, index) => (
                    <div
                      key={day}
                      className={`p-1 sm:p-2 text-center text-xs font-medium text-gray-700 ${
                        index < weekDays.length - 1 ? 'border-r border-gray-200' : ''
                      }`}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>

                {/* 時間表格 */}
                <div className="max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <div key={slot.period} className="grid grid-cols-8 border-t border-gray-200">
                      {/* 節次欄 */}
                      <div className="p-1 sm:p-2 text-center border-r border-gray-200 bg-gray-50">
                        <div className="text-xs font-medium text-gray-700">{slot.period}</div>
                      </div>

                      {/* 各天的時間槽 */}
                      {weekDays.map((_, dayIndex) => {
                        const slotId = `${dayIndex}-${slot.period}`
                        const isSelected = selectedTimeSlots.has(slotId)
                        
                        return (
                          <button
                            key={`${dayIndex}-${slot.period}`}
                            onClick={() => handleTimeSlotClick(dayIndex, slot.period)}
                            className={`p-1 sm:p-2 h-6 sm:h-8 text-xs transition-colors border-r border-gray-200 last:border-r-0 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                              isSelected 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'text-gray-600 hover:text-blue-700'
                            }`}
                          >
                            {isSelected ? '●' : ''}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* 已選時間和清除按鈕 */}
              {selectedTimeSlots.size > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    已選擇 {selectedTimeSlots.size} 個時間槽
                  </span>
                  <button
                    onClick={clearTimeSelection}
                    className="text-sm text-gray-700 hover:text-red-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>

            
          </div>
        )}

        {/* 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0 pt-3">
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
