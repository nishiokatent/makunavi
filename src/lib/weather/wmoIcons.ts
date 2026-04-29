// WMO weather code (Open-Meteo) → basmilius/weather-icons mapping
// https://open-meteo.com/en/docs#weathervariables
// https://github.com/basmilius/weather-icons

export interface WeatherInfo {
  icon: string
  label: string
  rainy: boolean
}

export function wmoToInfo(code: number): WeatherInfo {
  if (code === 0)                       return { icon: 'clear-day',          label: '晴れ',         rainy: false }
  if (code === 1)                       return { icon: 'partly-cloudy-day',  label: 'おおむね晴れ', rainy: false }
  if (code === 2)                       return { icon: 'partly-cloudy-day',  label: '晴れ時々曇り', rainy: false }
  if (code === 3)                       return { icon: 'cloudy',             label: '曇り',         rainy: false }
  if (code === 45 || code === 48)       return { icon: 'fog-day',            label: '霧',           rainy: false }
  if (code >= 51 && code <= 57)         return { icon: 'drizzle',            label: '霧雨',         rainy: true  }
  if (code >= 61 && code <= 65)         return { icon: 'rain',               label: '雨',           rainy: true  }
  if (code === 66 || code === 67)       return { icon: 'sleet',              label: 'みぞれ',       rainy: true  }
  if (code >= 71 && code <= 75)         return { icon: 'snow',               label: '雪',           rainy: true  }
  if (code === 77)                      return { icon: 'snow',               label: '霧雪',         rainy: true  }
  if (code >= 80 && code <= 82)         return { icon: 'rain',               label: 'にわか雨',     rainy: true  }
  if (code === 85 || code === 86)       return { icon: 'snow',               label: 'にわか雪',     rainy: true  }
  if (code === 95)                      return { icon: 'thunderstorms',      label: '雷雨',         rainy: true  }
  if (code === 96 || code === 99)       return { icon: 'thunderstorms-rain', label: '雷雨（雹）',   rainy: true  }
  return { icon: 'cloudy', label: '—', rainy: false }
}

const ICON_BASE = 'https://cdn.jsdelivr.net/gh/basmilius/weather-icons/production/fill/all'

export function iconUrl(name: string): string {
  return `${ICON_BASE}/${name}.svg`
}
