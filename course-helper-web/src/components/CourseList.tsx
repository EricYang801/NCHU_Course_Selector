'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Course } from '@/lib/course-types'
import { getCareerFromDepartment, getCareerColorClass } from '@/lib/course-utils'
import { formatProfessor, formatTime, formatLocation } from '@/lib/ui-utils'
import { courseService } from '@/lib/course-service'

interface CourseListProps {
  onAddCourse?: (course: Course) => void
  onRemoveCourse?: (courseCode: string) => void
  selectedCourses?: Course[]
}

export default function CourseList({ onAddCourse, onRemoveCourse, selectedCourses = [] }: CourseListProps) {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // 獲取學制標籤樣式
  const getCareerBadgeClass = (deptName: string): string => {
    return getCareerColorClass(deptName)
  }

  // 清理系所名稱，處理 no_data_found 的情況
  const cleanDepartmentName = (deptName: string | undefined): string => {
    if (!deptName || deptName.includes('no_data_found')) {
      return '系所資料缺失'
    }
    return deptName
  }

  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const searchFilters = {
        keyword: searchParams.get('keyword') || undefined,
        department: searchParams.get('department') || undefined,
        for_dept: searchParams.get('for_dept') || undefined,
        career: searchParams.get('career') || undefined,
        professor: searchParams.get('professor') || undefined,
        credits: searchParams.get('credits') ? parseInt(searchParams.get('credits')!) : undefined,
  year: searchParams.get('year') || undefined,
  obligatory: searchParams.get('obligatory') || undefined,
  time: searchParams.get('time') || undefined,
        page,
        limit: pagination.limit
      }

      const result = await courseService.searchCourses(searchFilters)
      
      setCourses(result.courses)
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      })
    } catch (err) {
      console.error('搜尋課程時發生錯誤:', err)
      setError('搜尋失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [searchParams, pagination.limit])

  useEffect(() => {
    fetchCourses(1) // 當搜尋參數變化時，從第一頁開始
  }, [fetchCourses])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCourses(newPage)
    }
  }

  // ...existing code uses shared helpers from '@/lib/ui-utils'

  const CourseModal = ({ course, onClose }: { course: Course; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-4">{course.title_parsed?.zh_TW || course.title}</h3>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">課程代碼</span>
                <p className="text-gray-900">{course.code}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">學分</span>
                <p className="text-gray-900">{course.credits}</p>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">上課系所</span>
              <p className="text-gray-900">{cleanDepartmentName(course.for_dept || course.department)}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">開課系所</span>
              <p className="text-gray-900">{cleanDepartmentName(course.department)}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">授課教師</span>
              <p className="text-gray-900">{formatProfessor(course.professor)}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">上課時間</span>
                <p className="text-gray-900">{formatTime(course.time)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">上課地點</span>
                <p className="text-gray-900">{formatLocation(course.location)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">授課語言</span>
                <p className="text-gray-900">{course.language || '無'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">必選修</span>
                <p className="text-gray-900">{course.obligatory || '無'}</p>
              </div>
            </div>
            
            {course.note && (
              <div>
                <span className="text-sm font-medium text-gray-500">備註</span>
                <p className="text-gray-900">{course.note}</p>
              </div>
            )}
            
            {course.url && (
              <div>
                <span className="text-sm font-medium text-gray-500">課程網址</span>
                <a
                  href={`https://onepiece.nchu.edu.tw/cofsys/plsql/Syllabus_main?v_strm=1142&v_class_nbr=${course.url}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 block break-all"
                >
                  查看課程大綱
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-ping opacity-25"></div>
          </div>
          <h3 className="mt-6 text-lg font-bold text-gray-900">載入課程中</h3>
          <p className="mt-2 text-gray-500">正在為您搜尋最新的課程資訊...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">載入失敗</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => fetchCourses()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 搜尋結果統計 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">搜尋結果</h2>
              <p className="text-sm text-blue-600">
                共找到 <span className="font-bold text-blue-700">{pagination.total}</span> 門課程
              </p>
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">
                第 <span className="text-blue-600 font-bold">{pagination.page}</span> 頁
              </p>
              <p className="text-xs text-gray-500">
                共 {pagination.totalPages} 頁
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 課程列表 */}
      {courses.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到符合條件的課程</h3>
          <p className="text-gray-500">請嘗試調整搜尋條件或關鍵字</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map((course, index) => (
            <div 
              key={`${course.code}-${index}`}
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
            >
              <div className="p-4">
                {/* 頂部：標題和學制標籤 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                      onClick={() => setSelectedCourse(course)}
                    >
                      {course.title_parsed?.zh_TW || course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{course.code}</span>
                      <span>•</span>
                      <span className="text-xs">{cleanDepartmentName(course.for_dept || course.department)}</span>
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getCareerBadgeClass(course.for_dept || course.department)} shadow-sm`}>
                      {getCareerFromDepartment(course.for_dept || course.department)}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-blue-600">{course.credits}</span>
                      <span className="text-xs text-gray-500">學分</span>
                    </div>
                  </div>
                </div>

                {/* 中間：課程資訊卡片 - 響應式設計 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-medium text-blue-700">教師</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">{formatProfessor(course.professor)}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-green-700">時間</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">{formatTime(course.time)}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-medium text-purple-700">地點</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">{formatLocation(course.location)}</p>
                  </div>
                </div>

                {/* 底部：操作按鈕 - 響應式設計 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="inline-flex items-center justify-center sm:justify-start gap-1 px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    查看詳情
                  </button>
                  
                  <div className="flex gap-2">
                    {selectedCourses.some(c => c.code === course.code) ? (
                      onRemoveCourse && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveCourse(course.code)
                          }}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          已加入
                        </button>
                      )
                    ) : (
                      onAddCourse && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddCourse(course)
                          }}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          加入課表
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分頁 - 響應式設計 */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center">
          {/* 手機版：簡化分頁 */}
          <nav className="flex sm:hidden items-center justify-between w-full max-w-sm">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一頁
            </button>
            
            <span className="text-sm text-gray-600 font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              下一頁
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>

          {/* 桌面版：完整分頁 */}
          <nav className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一頁
            </button>
            
            <div className="flex items-center gap-1 mx-4">
              {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, pagination.page - 3) + i
                if (page > pagination.totalPages) return null
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 ${
                      page === pagination.page
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              下一頁
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}

      {/* 課程詳情模態框 */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  )
}
