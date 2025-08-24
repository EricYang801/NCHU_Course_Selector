'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Course } from '@/lib/course-types'
import { TIME_SLOTS, DAYS, CAREER_COLORS, getCareerFromDepartment } from '@/lib/course-utils'
import { formatProfessor, splitCareerColorClasses } from '@/lib/ui-utils'

interface TimeSlot {
  course?: Course
  isConflict?: boolean
}

interface SchedulePreviewProps {
  selectedCourses: Course[]
  onRemoveCourse?: (courseCode: string) => void
  compact?: boolean
}

// 只顯示週一到週五 - 移到元件外避免重新創建
const WEEKDAYS = DAYS.slice(0, 5) // ['一', '二', '三', '四', '五']

export default function SchedulePreview({ selectedCourses, onRemoveCourse, compact = false }: SchedulePreviewProps) {
  const scheduleRef = useRef<HTMLDivElement | null>(null)
  const [schedule, setSchedule] = useState<TimeSlot[][]>([])
  const [conflicts, setConflicts] = useState<string[]>([])

  const generateSchedule = useCallback(() => {
    // 初始化 13x5 的課表網格（13個時段 x 5天）
    const newSchedule: TimeSlot[][] = Array(13).fill(null).map(() => 
      Array(5).fill(null).map(() => ({}))
    )
    
    const conflictList: string[] = []

    selectedCourses.forEach(course => {
      if (!course.time_parsed) return

      course.time_parsed.forEach(timeSlot => {
        const { day, time } = timeSlot
        
        // day: 1=週一, 2=週二, ..., 7=週日
        const dayIndex = day - 1
        
        time.forEach(period => {
          // period: 1=第1節, 2=第2節, ...
          const timeIndex = period - 1
          
          // 只處理週一到週五 (dayIndex 0-4)
          if (dayIndex >= 0 && dayIndex < 5 && timeIndex >= 0 && timeIndex < 13) {
            if (newSchedule[timeIndex][dayIndex].course) {
              // 發現衝突
              const conflictKey = `${WEEKDAYS[dayIndex]}第${period}節`
              if (!conflictList.includes(conflictKey)) {
                conflictList.push(conflictKey)
              }
              
              // 標記衝突
              newSchedule[timeIndex][dayIndex].isConflict = true
            }
            
            newSchedule[timeIndex][dayIndex].course = course
          }
        })
      })
    })

    setSchedule(newSchedule)
    setConflicts(conflictList)
  }, [selectedCourses])

  useEffect(() => {
    generateSchedule()
  }, [generateSchedule])

  // use formatProfessor from '@/lib/ui-utils'

  const renderCourseCell = (timeSlot: TimeSlot) => {
    if (!timeSlot.course) {
      return <div className="h-16 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors rounded-sm"></div>
    }

    const course = timeSlot.course
    const career = getCareerFromDepartment(course.for_dept || course.department)
    const colorClass = CAREER_COLORS[career as keyof typeof CAREER_COLORS]
    const conflictClass = timeSlot.isConflict ? 'ring-2 ring-red-500' : ''

    // 取得課程簡化名稱
    const courseTitle = course.title_parsed?.zh_TW || course.title.split('`')[0]
    const shortTitle = courseTitle.length > 8 ? courseTitle.substring(0, 8) + '...' : courseTitle
    const professorName = formatProfessor(course.professor)
    const shortProfessor = professorName.length > 6 ? professorName.substring(0, 6) + '...' : professorName

  // 使用共用 helper 拆出 bg/text/border
  const { bg: bgClass, text: textClass, border: borderClass } = splitCareerColorClasses(colorClass)

    return (
      <div className={`h-16 border-2 ${bgClass} ${textClass} ${borderClass} ${conflictClass} p-1.5 relative group cursor-pointer rounded-sm shadow-sm hover:shadow-md transition-all duration-200`}>
        {/* 主要顯示資訊 */}
        <div className="text-[10px] font-bold leading-tight mb-0.5 line-clamp-1">
          {shortTitle}
        </div>
        <div className="text-[9px] opacity-80 mb-0.5 font-medium">
          {course.code}
        </div>
        <div className="text-[8px] opacity-70 leading-tight">
          {shortProfessor}
        </div>
        
        {/* 改進的懸停提示 - 浮動卡片式 */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 w-64 pointer-events-none">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-300 rotate-45"></div>
          <div className="font-bold text-sm text-gray-900 mb-2 leading-tight">{courseTitle}</div>
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">課程代碼：</span>{course.code}
          </div>
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">授課教師：</span>{professorName}
          </div>
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-medium">學分數：</span>{course.credits}學分
          </div>
          <div className="text-xs text-gray-700">
            <span className="font-medium">開課系所：</span>{course.for_dept || course.department}
          </div>
        </div>

        {/* 移除按鈕 */}
        {onRemoveCourse && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemoveCourse(course.code)
            }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-40 shadow-lg"
            title="移除課程"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  const renderCourseListItem = (course: Course) => {
    const career = getCareerFromDepartment(course.department)
    const colorClass = CAREER_COLORS[career as keyof typeof CAREER_COLORS]
    
    return (
      <div key={course.code} className={`flex items-center justify-between p-3 rounded-lg border-2 shadow-sm ${colorClass}`}>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {course.title_parsed?.zh_TW || course.title.split('`')[0]}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {course.code} • {formatProfessor(course.professor)} ({course.credits_parsed}學分)
          </div>
        </div>
        {onRemoveCourse && (
          <button
            onClick={() => onRemoveCourse(course.code)}
            className="inline-flex items-center gap-1 ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
            title="移除課程"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            移除
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 衝突警告 - 美化版 */}
      {conflicts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                <span>時間衝突警告</span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                  {conflicts.length} 個衝突
                </span>
              </h3>
              <div className="mt-2">
                <p className="text-sm text-red-700 mb-2">以下時段有課程衝突：</p>
                <div className="flex flex-wrap gap-2">
                  {conflicts.map((conflict, index) => (
                    <span key={index} className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-lg border border-red-200">
                      {conflict}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact 模式下的簡化版 */}
      {compact ? (
        <div className="space-y-3">
          {selectedCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">尚未選擇任何課程</p>
              <p className="text-xs mt-1">從左側搜尋結果加入課程</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedCourses.map(renderCourseListItem)}
            </div>
          )}
        </div>
      ) : (
        <>
                    {/* 課表網格 - 響應式設計 */}
          <div ref={scheduleRef} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                週課表 (週一至週五)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!scheduleRef.current) return

                    const node = scheduleRef.current
                    // collect all elements under node to temporarily remove heavy styles
                    const elems = Array.from(node.querySelectorAll('*')) as HTMLElement[]
                    const prev = new Map<HTMLElement, { boxShadow: string; filter: string; transition: string }>()

                    try {
                      // low pixelRatio for speed; increase only if user needs high-res export
                      const desiredPixelRatio = 2

                      // stash and remove expensive visual properties that slow rasterization
                      elems.forEach(el => {
                        const s = el.style
                        prev.set(el, { boxShadow: s.boxShadow || '', filter: s.filter || '', transition: s.transition || '' })
                        s.boxShadow = 'none'
                        s.filter = 'none'
                        s.transition = 'none'
                      })

                      // also handle root node
                      const rootStyle = node.style
                      const rootPrev = { boxShadow: rootStyle.boxShadow || '', filter: rootStyle.filter || '', transition: rootStyle.transition || '' }
                      rootStyle.boxShadow = 'none'
                      rootStyle.filter = 'none'
                      rootStyle.transition = 'none'

                      // allow one frame to apply style changes
                      await new Promise(requestAnimationFrame)

                      const htmlToImage = await import('html-to-image') as unknown
                      type HtmlToImageMod = {
                        toCanvas?: (node: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
                        toPng?: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
                        default?: {
                          toCanvas?: (node: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
                          toPng?: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
                        }
                      }
                      const mod = htmlToImage as HtmlToImageMod
                      const toCanvas = mod.toCanvas || mod.default?.toCanvas
                      const toPng = mod.toPng || mod.default?.toPng

                      if (toCanvas) {
                        // render to canvas then toBlob to avoid huge base64 strings in memory
                        const canvas: HTMLCanvasElement = await toCanvas(node, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: desiredPixelRatio })
                        await new Promise<void>((resolve, reject) => {
                          canvas.toBlob((blob) => {
                            if (!blob) return reject(new Error('toBlob returned null'))
                            const url = URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = 'schedule.png'
                            link.click()
                            // small timeout to ensure download initiated before revoking
                            setTimeout(() => URL.revokeObjectURL(url), 1000)
                            resolve()
                          }, 'image/png')
                        })
                      } else if (toPng) {
                        // fallback
                        const dataUrl = await toPng(node, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: desiredPixelRatio })
                        const link = document.createElement('a')
                        link.href = dataUrl
                        link.download = 'schedule.png'
                        link.click()
                      } else {
                        alert('匯出功能不可用：找不到可用的方法')
                      }

                      // restore root style
                      rootStyle.boxShadow = rootPrev.boxShadow
                      rootStyle.filter = rootPrev.filter
                      rootStyle.transition = rootPrev.transition

                      // restore child styles
                      prev.forEach((val, el) => {
                        const s = el.style
                        s.boxShadow = val.boxShadow
                        s.filter = val.filter
                        s.transition = val.transition
                      })
                    } catch (err) {
                      console.error('export error', err)
                      alert('匯出失敗，請稍後再試')
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  title="匯出課表為圖片"
                >
                  匯出圖片
                </button>
              </div>
            </div>
            
            {/* 手機版分組視圖（已改為顯示表格，故此區塊隱藏） */}
            <div className="hidden">
              {selectedCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-sm">尚未選擇任何課程</p>
                  <p className="text-xs mt-1">加入課程後即可查看課表</p>
                </div>
              ) : (
                <div className="p-3">
                  {/* 手機版課表 - 日期標籤式導航 */}
                  <div className="space-y-3">
                    {WEEKDAYS.map((day, dayIndex) => {
                      // 找出這一天的所有課程
                      const daySchedule = TIME_SLOTS.map((timeSlot, timeIndex) => ({
                        timeIndex,
                        timeSlot,
                        course: schedule[timeIndex]?.[dayIndex]
                      })).filter(item => item.course?.course)

                      return (
                        <div key={day} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                          {/* 日期標頭 */}
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                  <span className="text-blue-800 text-xs font-bold">{day}</span>
                                </div>
                                星期{day}
                              </h4>
                              <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                                {daySchedule.length} 門課
                              </span>
                            </div>
                          </div>
                          
                          {/* 課程內容 */}
                          <div className="p-2">
                            {daySchedule.length === 0 ? (
                              <div className="text-center py-4 text-gray-400">
                                <p className="text-xs">今日無課程</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {daySchedule.map(({ timeIndex, timeSlot, course }) => {
                                  if (!course?.course) return null
                                  
                                  const currentCourse = course.course
                                  const career = getCareerFromDepartment(currentCourse.for_dept || currentCourse.department)
                                  const colorClass = CAREER_COLORS[career as keyof typeof CAREER_COLORS]
                                  const conflictClass = course.isConflict ? 'ring-2 ring-red-500' : ''
                                  
                                  const { bg: bgClass2, text: textClass2, border: borderClass2 } = splitCareerColorClasses(colorClass)
                                  const courseTitle = currentCourse.title_parsed?.zh_TW || currentCourse.title.split('`')[0]
                                  const professorName = formatProfessor(currentCourse.professor)
                                  
                                  return (
                                    <div key={`${timeIndex}`} className={`${bgClass2} ${borderClass2} ${textClass2} border-l-4 ${conflictClass} rounded-r-lg p-3 shadow-sm`}>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          {/* 時間標籤 */}
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-white bg-opacity-70 text-xs font-bold px-2 py-1 rounded-full">
                                              第{timeIndex + 1}節
                                            </span>
                                            <span className="text-xs opacity-80">
                                              {timeSlot}
                                            </span>
                                          </div>
                                          
                                          {/* 課程資訊 */}
                                          <h5 className="font-bold text-sm leading-tight mb-1">
                                            {courseTitle}
                                          </h5>
                                          <div className="text-xs opacity-90 space-y-1">
                                            <div>{currentCourse.code} • {professorName}</div>
                                            <div>{currentCourse.credits}學分</div>
                                            {currentCourse.location && currentCourse.location.length > 0 && (
                                              <div className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {currentCourse.location.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* 衝突警告 */}
                                          {course.isConflict && (
                                            <div className="mt-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full inline-block">
                                              ⚠️ 時間衝突
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* 移除按鈕 */}
                                        {onRemoveCourse && (
                                          <button
                                            onClick={() => onRemoveCourse(currentCourse.code)}
                                            className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                            title="移除課程"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* 桌面版（同時在手機也可顯示，並支援水平滾動） */}
            <div className="block md:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                      <th className="border-r border-gray-200 p-2 text-xs font-bold text-gray-700 w-16 bg-gray-100">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">節次</div>
                          <div className="text-xs text-gray-600">時間</div>
                        </div>
                      </th>
                      {WEEKDAYS.map(day => (
                        <th key={day} className="border-r border-gray-200 p-2 text-xs font-bold text-gray-700 bg-gray-100">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">星期</div>
                            <div className="text-sm font-bold text-gray-800">{day}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 前8節直接顯示，無需滾動 */}
                    {TIME_SLOTS.slice(0, 8).map((timeSlot, timeIndex) => (
                      <tr key={timeIndex} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        {/* 時間欄位 - 顯示完整開始結束時間 */}
                        <td className="border-r border-gray-200 p-1.5 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-blue-800 bg-blue-100 rounded px-1 py-0.5">
                              第{timeIndex + 1}節
                            </div>
                            <div className="text-[10px] text-blue-700 leading-tight font-medium">
                              {timeSlot}
                            </div>
                          </div>
                        </td>
                        
                        {/* 各天課程欄位 */}
                        {WEEKDAYS.map((day, dayIndex) => (
                          <td key={dayIndex} className="border-r border-gray-200 p-1">
                            {renderCourseCell(schedule[timeIndex]?.[dayIndex] || {})}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* 第9-13節的可滾動區域 */}
                {TIME_SLOTS.length > 8 && (
                  <div className="border-t-2 border-gray-300">
                    <div className="bg-gray-100 px-4 py-1 border-b border-gray-200">
                      <div className="text-xs text-gray-600 font-medium flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        晚間時段 (第9-13節) - 可滾動查看
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full border-collapse table-fixed">
                        <tbody>
                          {TIME_SLOTS.slice(8).map((timeSlot, timeIndex) => {
                            const actualIndex = timeIndex + 8;
                            return (
                              <tr key={actualIndex} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                {/* 時間欄位 */}
                                <td className="border-r border-gray-200 p-1.5 text-center bg-gradient-to-br from-purple-50 to-indigo-50 w-16">
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-purple-800 bg-purple-100 rounded px-1 py-0.5">
                                      第{actualIndex + 1}節
                                    </div>
                                    <div className="text-[10px] text-purple-700 leading-tight font-medium">
                                      {timeSlot}
                                    </div>
                                  </div>
                                </td>
                                
                                {/* 各天課程欄位 */}
                                {WEEKDAYS.map((day, dayIndex) => (
                                  <td key={dayIndex} className="border-r border-gray-200 p-1">
                                    {renderCourseCell(schedule[actualIndex]?.[dayIndex] || {})}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 課表說明 */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 flex items-center justify-between">
                <span className="hidden md:inline">💡 懸停課程可查看詳細資訊</span>
                <span className="md:hidden">手機版可左右滑動查看表格或點選課程查看詳情</span>
                <span className="hidden md:inline">📚 前8節直接顯示，晚間時段可滾動</span>
              </div>
            </div>
          </div>

          {/* 已選課程列表 - 只在桌面版顯示，手機版已整合到課表中 */}
          <div className="block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                已選課程
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                  {selectedCourses.length} 門
                </span>
              </h3>
            </div>
            
            <div className="p-4">
              {selectedCourses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">尚未選擇任何課程</p>
                  <p className="text-gray-400 text-xs mt-1">從左側搜尋結果加入課程</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCourses.map(course => {
                    const career = getCareerFromDepartment(course.for_dept || course.department)
                    const colorClass = CAREER_COLORS[career as keyof typeof CAREER_COLORS]
                    const getStyleClasses = (colorClass: string) => {
                      const colorMap: { [key: string]: string } = {
                        'bg-blue-100 text-blue-800 border-blue-200': 'border-l-blue-500 bg-blue-50',
                        'bg-green-100 text-green-800 border-green-200': 'border-l-green-500 bg-green-50',
                        'bg-purple-100 text-purple-800 border-purple-200': 'border-l-purple-500 bg-purple-50',
                        'bg-orange-100 text-orange-800 border-orange-200': 'border-l-orange-500 bg-orange-50',
                        'bg-pink-100 text-pink-800 border-pink-200': 'border-l-pink-500 bg-pink-50',
                        'bg-gray-100 text-gray-800 border-gray-200': 'border-l-gray-500 bg-gray-50'
                      }
                      return colorMap[colorClass] || 'border-l-indigo-500 bg-indigo-50'
                    }
                    
                    return (
                      <div key={course.code} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getStyleClasses(colorClass)} hover:shadow-md transition-all duration-200`}>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-gray-900 truncate">
                            {course.title_parsed?.zh_TW || course.title.split('`')[0]}
                          </div>
                          <div className="text-xs text-gray-600 truncate flex items-center gap-2">
                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">{course.code}</span>
                            <span>•</span>
                            <span>{course.credits}學分</span>
                          </div>
                        </div>
                        {onRemoveCourse && (
                          <button
                            onClick={() => onRemoveCourse(course.code)}
                            className="ml-2 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            title="移除課程"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
