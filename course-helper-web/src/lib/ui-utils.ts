export const formatProfessor = (professor: string | string[] | undefined): string => {
  if (!professor) return ''
  if (typeof professor === 'string') return professor
  if (Array.isArray(professor)) return professor.join(', ')
  return ''
}

export const formatTime = (timeData: string[] | string | undefined): string => {
  if (!timeData) return '無'
  if (typeof timeData === 'string') return timeData
  if (Array.isArray(timeData)) {
    if (timeData.length === 0) return '無'
    return timeData.join(', ')
  }
  return '無'
}

export const formatLocation = (locationArray: string[] | undefined): string => {
  if (!locationArray || locationArray.length === 0) return '無'
  return locationArray.join(', ')
}

// 將 CAREER 類別字串（例如 'bg-blue-100 border-blue-300 text-blue-800'）拆成可重用的部份
export const splitCareerColorClasses = (colorClass: string) => {
  // 嘗試從已知格式中拆出三個部分：bg, text, border
  const parts = colorClass.split(/\s+/)
  const bg = parts.find(p => p.startsWith('bg-')) || ''
  const text = parts.find(p => p.startsWith('text-')) || ''
  const border = parts.find(p => p.startsWith('border-')) || ''
  return { bg, text, border }
}
