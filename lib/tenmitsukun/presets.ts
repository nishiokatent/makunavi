export interface SetupPreset {
  name: string
  maguchi: number  // mm
  debaba: number   // mm
  okutaka: number  // mm
  maetaka: number  // mm
  tsuma: number    // 0 | 1 | 2
}

export const SETUP_PRESETS: SetupPreset[] = [
  { name: '極小テント',       maguchi: 1800, debaba: 900,  okutaka: 2200, maetaka: 1800, tsuma: 0 },
  { name: '小テント（正方形）', maguchi: 2400, debaba: 1500, okutaka: 2300, maetaka: 1900, tsuma: 0 },
  { name: '小テント（横長）',  maguchi: 3600, debaba: 1200, okutaka: 2200, maetaka: 1800, tsuma: 0 },
  { name: '標準テント（妻なし）', maguchi: 3600, debaba: 2400, okutaka: 2500, maetaka: 2000, tsuma: 0 },
  { name: '標準テント（妻あり）', maguchi: 3600, debaba: 2400, okutaka: 2500, maetaka: 2000, tsuma: 2 },
  { name: '中テント',          maguchi: 4800, debaba: 3000, okutaka: 2600, maetaka: 2000, tsuma: 2 },
  { name: '中テント（横長）',  maguchi: 6000, debaba: 2400, okutaka: 2400, maetaka: 2000, tsuma: 0 },
  { name: '大テント',          maguchi: 6000, debaba: 3600, okutaka: 2800, maetaka: 2100, tsuma: 2 },
  { name: '大テント（横長）',  maguchi: 9000, debaba: 3000, okutaka: 2600, maetaka: 2000, tsuma: 2 },
  { name: '特大テント',        maguchi: 9000, debaba: 4500, okutaka: 3000, maetaka: 2200, tsuma: 2 },
]
