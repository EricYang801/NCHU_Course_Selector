'use client'

import { useState, useEffect, Suspense } from 'react'
import CourseSearch from '@/components/CourseSearch'
import CourseList from '@/components/CourseList'
import AdminPanel from '@/components/AdminPanel'
import SchedulePreview from '@/components/SchedulePreview'
import { Course } from '@/lib/course-types'

export default function Home() {
  const [activeTab, setActiveTab] = useState('search')
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([])
  const [searchKey, setSearchKey] = useState(0) // 用於觸發 CourseList 重新搜尋

  // 從 localStorage 載入已選課程
  useEffect(() => {
    const saved = localStorage.getItem('selectedCourses')
    if (saved) {
      try {
        setSelectedCourses(JSON.parse(saved))
      } catch (error) {
        console.error('無法載入已選課程:', error)
      }
    }
  }, [])

  // 儲存已選課程到 localStorage
  useEffect(() => {
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
  }, [selectedCourses])

  const addCourse = (course: Course) => {
    setSelectedCourses(prev => {
      const exists = prev.find(c => c.code === course.code)
      if (exists) return prev
      return [...prev, course]
    })
  }

  const removeCourse = (courseCode: string) => {
    setSelectedCourses(prev => prev.filter(c => c.code !== courseCode))
  }

  const handleSearch = () => {
    setSearchKey(prev => prev + 1) // 觸發 CourseList 重新搜尋
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
              {/* 標題 */}
              <div className="mb-4 lg:mb-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  中興大學選課小幫手
                </h1>
                <div className="lg:hidden mt-1">
                  <p className="text-sm text-gray-500">
                    資料每日自動更新
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
                {/* 導航標籤 - 手機版橫向滾動，桌面版正常 */}
                <nav className="mb-3 lg:mb-0">
                  <div className="flex space-x-2 lg:space-x-6 overflow-x-auto pb-2 lg:pb-0">
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`whitespace-nowrap py-2 px-3 lg:px-4 rounded-lg font-medium text-sm transition-all ${
                        activeTab === 'search'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      課程搜尋
                    </button>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`whitespace-nowrap py-2 px-3 lg:px-4 rounded-lg font-medium text-sm transition-all ${
                        activeTab === 'schedule'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      課表預覽 ({selectedCourses.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('admin')}
                      className={`whitespace-nowrap py-2 px-3 lg:px-4 rounded-lg font-medium text-sm transition-all ${
                        activeTab === 'admin'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      系統資訊
                    </button>
                  </div>
                </nav>
                
                {/* 更新資訊 - 只在桌面版顯示 */}
                <div className="hidden lg:block text-right">
                  <p className="text-sm text-gray-500">
                    資料每日自動更新
                  </p>
                  <p className="text-xs text-gray-400">
                    更新時間：每天 00:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {activeTab === 'search' && (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
            {/* 左側：搜尋和課程列表 */}
            <div className="lg:col-span-7 space-y-6">
              <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>}>
                <CourseSearch onSearch={handleSearch} />
              </Suspense>
              <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>}>
                <CourseList 
                  key={searchKey}
                  onAddCourse={addCourse} 
                  onRemoveCourse={removeCourse} 
                  selectedCourses={selectedCourses} 
                />
              </Suspense>
            </div>
            
            {/* 右側：完整課表預覽 - 桌面版顯示 */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  課表預覽
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {selectedCourses.length} 門課程
                  </span>
                </h2>
                <SchedulePreview 
                  selectedCourses={selectedCourses} 
                  onRemoveCourse={removeCourse}
                  compact={false}
                />
              </div>
            </div>
            
            {/* 手機版：已選課程預覽 */}
            {selectedCourses.length > 0 && (
              <div className="lg:hidden mt-6">
                <div className="bg-white rounded-lg shadow border p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    已選課程
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {selectedCourses.length} 門
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {selectedCourses.map(course => (
                      <div key={course.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {course.title_parsed?.zh_TW || course.title.split('`')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {course.code} • {course.credits_parsed}學分
                          </div>
                        </div>
                        <button
                          onClick={() => removeCourse(course.code)}
                          className="ml-2 text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看完整課表 →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <SchedulePreview 
            selectedCourses={selectedCourses} 
            onRemoveCourse={removeCourse}
          />
        )}
        
        {activeTab === 'admin' && <AdminPanel />}
      </main>
    </div>
  )
}
