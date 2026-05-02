// Mock realistic Korean CRM data
// All amounts in KRW

const businessUnits = [
  { id: 'it', name: 'IT사업부', shortName: 'IT', color: '#2563EB' },
  { id: 'mymailer', name: '마이메일러', shortName: 'MM', color: '#0EA5E9' },
  { id: 'first', name: '처음서비스', shortName: 'FS', color: '#7C3AED' },
  { id: 'pringo', name: '프링고', shortName: 'PG', color: '#DB2777' },
];

const customers = [
  '충북보건과학대학교', '한국전자기술연구원', '서울메트로', '삼성웰스토리', 'LG CNS',
  '현대오토에버', 'SK텔레콤', '카카오엔터프라이즈', 'KT DS', '네이버클라우드',
  '롯데정보통신', '농협정보시스템', '신한DS', '국민카드', '하나금융티아이',
  '대한무역투자진흥공사', '한국교육학술정보원', '경기도교육청', '부산대학교병원', '서울아산병원',
  '아모레퍼시픽', 'CJ올리브네트웍스', 'GS리테일', '이마트', '쿠팡',
  '배달의민족', '직방', '야놀자', '토스', '카카오뱅크',
  '한국수력원자력', '한국도로공사', '한국전력공사', '국토정보공사', '한국가스공사',
];

const itemsByUnit = {
  it: ['ERP 구축', '그룹웨어 라이선스', '시스템 통합 컨설팅', '유지보수 계약', '클라우드 마이그레이션', '보안 솔루션'],
  mymailer: ['ASP 정기결제', '개발서비스', '카페24 연동', '전용서버', '대량메일 발송', 'API 사용료'],
  first: ['홈페이지 제작', '도메인 갱신', '호스팅 패키지', '유지관리', 'SEO 컨설팅'],
  pringo: ['인쇄물 제작', '디자인 외주', '배송비', '브랜딩 패키지', '굿즈 제작'],
};

const managers = ['김민준', '이서연', '박지호', '최수아', '정도윤', '강하은', '윤재원', '장유진'];

const statuses = ['완료', '예정', '미정', '지연'];

// Deterministic pseudo-random
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function generateRecords() {
  const rand = seededRand(42);
  const records = [];
  let id = 1;
  // Generate ~120 records spanning prev/curr/next month
  const today = new Date(2026, 4, 1); // May 1, 2026
  for (let i = 0; i < 140; i++) {
    const unit = businessUnits[Math.floor(rand() * businessUnits.length)];
    const items = itemsByUnit[unit.id];
    const monthOffset = Math.floor(rand() * 3) - 1; // -1, 0, 1
    const day = 1 + Math.floor(rand() * 28);
    const dueDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, day);

    let status;
    const r = rand();
    if (monthOffset === -1) {
      status = r < 0.7 ? '완료' : (r < 0.9 ? '미정' : '지연');
    } else if (monthOffset === 0) {
      status = r < 0.35 ? '완료' : (r < 0.7 ? '예정' : (r < 0.9 ? '미정' : '지연'));
    } else {
      status = r < 0.85 ? '예정' : '미정';
    }

    const baseAmounts = {
      it: [3500000, 8500000, 12000000, 25000000, 45000000, 80000000],
      mymailer: [350000, 880000, 1200000, 2500000, 4500000, 12000000],
      first: [180000, 350000, 550000, 1200000, 2800000],
      pringo: [220000, 480000, 950000, 1800000, 3500000, 6500000],
    };
    const amounts = baseAmounts[unit.id];
    const amount = amounts[Math.floor(rand() * amounts.length)] + Math.floor(rand() * 500000);

    records.push({
      id: `R${String(id++).padStart(5, '0')}`,
      unitId: unit.id,
      customer: customers[Math.floor(rand() * customers.length)],
      item: items[Math.floor(rand() * items.length)],
      amount: amount,
      vat: Math.floor(amount * 0.1),
      dueDate: dueDate.toISOString().slice(0, 10),
      status: status,
      manager: managers[Math.floor(rand() * managers.length)],
      customerType: rand() < 0.55 ? '재구매' : '신규',
      memo: rand() < 0.3 ? ['고객사 검수 지연', '예산 집행 대기', '계약서 회신 대기', '분할 입금 진행 중', ''][Math.floor(rand() * 5)] : '',
      isNew: rand() < 0.4,
    });
  }
  return records;
}

const ALL_RECORDS = generateRecords();

// Helper: get records filtered by unit, month offset
function getRecords({ unitId, monthOffset, status } = {}) {
  const today = new Date(2026, 4, 1);
  return ALL_RECORDS.filter(r => {
    if (unitId && r.unitId !== unitId) return false;
    if (monthOffset !== undefined) {
      const d = new Date(r.dueDate);
      const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      if (d.getMonth() !== target.getMonth() || d.getFullYear() !== target.getFullYear()) return false;
    }
    if (status && r.status !== status) return false;
    return true;
  });
}

function sumAmount(records) {
  return records.reduce((acc, r) => acc + r.amount, 0);
}

// Format helpers
function fmtKRW(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억';
  if (n >= 10000) return (n / 10000).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
}

function fmtKRWFull(n) {
  return n.toLocaleString('ko-KR') + '원';
}

function fmtKRWComma(n) {
  return n.toLocaleString('ko-KR');
}

// Weekly trend for a unit (current month, weeks 1-5)
function getWeeklyTrend(unitId) {
  const records = getRecords({ unitId, monthOffset: 0 });
  const weeks = [0, 0, 0, 0, 0]; // collected
  const weeksExpected = [0, 0, 0, 0, 0];
  records.forEach(r => {
    const day = new Date(r.dueDate).getDate();
    const w = Math.min(4, Math.floor((day - 1) / 7));
    weeksExpected[w] += r.amount;
    if (r.status === '완료') weeks[w] += r.amount;
  });
  return { collected: weeks, expected: weeksExpected };
}

// Service category breakdown
function getServiceBreakdown(unitId) {
  const records = getRecords({ unitId, monthOffset: 0 });
  const items = itemsByUnit[unitId];
  const map = {};
  items.forEach(it => map[it] = 0);
  records.forEach(r => { if (map[r.item] !== undefined) map[r.item] += r.amount; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

// New vs returning breakdown
function getCustomerTypeBreakdown(unitId) {
  const records = getRecords({ unitId, monthOffset: 0 });
  let neww = 0, ret = 0;
  records.forEach(r => {
    if (r.customerType === '신규') neww += r.amount;
    else ret += r.amount;
  });
  return { 신규: neww, 재구매: ret };
}

window.CRMData = {
  businessUnits,
  customers,
  itemsByUnit,
  managers,
  statuses,
  ALL_RECORDS,
  getRecords,
  sumAmount,
  fmtKRW,
  fmtKRWFull,
  fmtKRWComma,
  getWeeklyTrend,
  getServiceBreakdown,
  getCustomerTypeBreakdown,
};
