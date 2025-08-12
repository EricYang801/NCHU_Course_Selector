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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                中興大學選課小幫手
              </h1>
            </div>
            <div className="flex items-center space-x-8">
              {/* 導航標籤移到右上角 */}
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'search'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  課程搜尋
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  課表預覽 ({selectedCourses.length})
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'admin'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  系統資訊
                </button>
              </nav>
              <div className="text-right">
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
      </header>

      {/* 主要內容區 */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <div className="grid grid-cols-12 gap-6">
            {/* 左側：搜尋和課程列表 */}
            <div className="col-span-7 space-y-6">
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
            
            {/* 右側：完整課表預覽 */}
            <div className="col-span-5">
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
