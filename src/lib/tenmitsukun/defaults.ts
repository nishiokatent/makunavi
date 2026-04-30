import type { Master } from '@/types/tenmitsukun'

export const DEFAULT_MASTER: Master = {
  companyName: '',
  company: '',
  ninku: 30000,
  dist: [5000, 10000, 20000, 30000],
  distTh: [10, 30, 50],
  fabrics: [
    { id: 1, name: '帝人シャガール',      haba: 1200, siire: 900,  kake: 70 },
    { id: 2, name: '帝人ニューパスティ',  haba: 940,  siire: 750,  kake: 70 },
    { id: 3, name: '帝人テトロン',        haba: 940,  siire: 650,  kake: 70 },
    { id: 4, name: 'ダイニックレガード',  haba: 1540, siire: 1100, kake: 70 },
  ],
  estItems: [
    { id: 'ei1', name: 'キャンバス加工費',     unit: 'yojaku',  ranges: [{ from: 0, to: 9999, tanka: 500 }], template: true  },
    { id: 'ei2', name: '古材撤去及び処分費',    unit: 'menseki', ranges: [{ from: 0, to: 10, tanka: 800 }, { from: 10, to: 9999, tanka: 600 }], template: true  },
    { id: 'ei3', name: '塗装費',               unit: 'menseki', ranges: [{ from: 0, to: 9999, tanka: 0 }], template: false },
    { id: 'ei4', name: '現場取付施工費',        unit: 'ninku',   ranges: [{ from: 0, to: 9999, tanka: 1 }], template: true  },
    { id: 'ei5', name: '取付付属部品',          unit: 'menseki', ranges: [{ from: 0, to: 10, tanka: 300 }, { from: 10, to: 9999, tanka: 250 }], template: true  },
    { id: 'ei6', name: '現調採寸費',            unit: 'menseki', ranges: [{ from: 0, to: 10, tanka: 200 }, { from: 10, to: 9999, tanka: 150 }], template: true  },
    { id: 'ei7', name: '諸経費',               unit: 'shiki',   ranges: [{ from: 0, to: 9999, tanka: 5000 }], template: true  },
  ],
  nextFabricId: 5,
  nextItemId: 8,
  recentAddr: [],
  samples: [],
  clients: [],
  nextClientId: 1,
}
