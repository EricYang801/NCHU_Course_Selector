'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFilters {
  keyword: string
  for_dept: string
  career: string
  professor: string
  credits: string
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

  const timeOptions = [
    { value: '', label: '全部時間' },
    { value: 'M1', label: '週一第1節' },
    { value: 'M2', label: '週一第2節' },
    { value: 'T1', label: '週二第1節' },
    { value: 'T2', label: '週二第2節' },
    { value: 'W1', label: '週三第1節' },
    { value: 'W2', label: '週三第2節' },
    { value: 'R1', label: '週四第1節' },
    { value: 'R2', label: '週四第2節' },
    { value: 'F1', label: '週五第1節' },
    { value: 'F2', label: '週五第2節' }
  ]

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
      time: ''
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
                  value={filters.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-400 cursor-pointer appearance-none ${
                    filters.time === '' ? 'text-gray-400' : 'text-black'
                  }`}
                >
                  {timeOptions.map(option => (
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
        )}

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
