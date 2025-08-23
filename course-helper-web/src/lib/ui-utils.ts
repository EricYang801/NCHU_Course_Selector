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
