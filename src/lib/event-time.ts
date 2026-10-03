export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  complete: boolean
}

export function getCountdownParts(eventDateTime: string, now = Date.now()): CountdownParts {
  const eventTime = Date.parse(eventDateTime)
  const remainingMilliseconds = Math.max(0, eventTime - now)
  const totalSeconds = Math.floor(remainingMilliseconds / 1000)

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: remainingMilliseconds <= 0,
  }
}

export function formatEventDate(eventDateTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(new Date(eventDateTime))
}
