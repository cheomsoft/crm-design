// Sales pipeline data — leads, activities, history
const D3 = window.CRMData;

const salesUnits = [
  { id: 'it', name: 'IT사업부' },
  { id: 'mymailer', name: '마이메일러' },
  { id: 'first', name: '처음서비스' },
  { id: 'pringo', name: '프링고' },
];

// 7-stage Salesforce-style pipeline
const stages = [
  { id: 'inquiry', name: '문의접수', color: '#94A3B8' },
  { id: 'qualified', name: '관심확인', color: '#0EA5E9' },
  { id: 'proposal', name: '제안서', color: '#2563EB' },
  { id: 'quote', name: '견적발송', color: '#7C3AED' },
  { id: 'negotiation', name: '협상중', color: '#D97706' },
  { id: 'closed_won', name: '계약완료', color: '#16A34A' },
  { id: 'closed_lost', name: '드랍', color: '#DC2626' },
];

const leadSources = ['홈페이지 문의', '전화 인입', '이메일', '검색광고', '추천', '전시회'];
const inquiryTypes = ['견적문의', '데모요청', '기술문의', '일반문의', '파트너십'];

const koreanNames = ['유연주', '김도현', '이서연', '박민수', '최지훈', '정수빈', '강예린', '조현우', '윤서아', '장도영', '임채원', '한지민', '오태준', '신유나', '권민재', '홍서윤', '배준호', '문하늘', '서지안', '노정현'];

function srand(seed) { let s = seed; return () => { s = (s*1664525+1013904223)%4294967296; return s/4294967296; }; }

function generateLeads() {
  const rand = srand(99);
  const leads = [];
  for (let i = 0; i < 38; i++) {
    const stageIdx = Math.floor(rand() * 7);
    const stage = stages[stageIdx];
    const unit = salesUnits[Math.floor(rand() * salesUnits.length)];
    const name = koreanNames[Math.floor(rand() * koreanNames.length)];
    const company = D3.customers[Math.floor(rand() * D3.customers.length)];
    const items = D3.itemsByUnit[unit.id];
    const item = items[Math.floor(rand() * items.length)];
    const baseAmounts = {
      it: [5000000, 12000000, 28000000, 50000000, 95000000],
      mymailer: [800000, 2400000, 5500000, 12000000],
      first: [350000, 850000, 2200000],
      pringo: [550000, 1500000, 3500000, 7800000],
    };
    const amounts = baseAmounts[unit.id];
    const amount = amounts[Math.floor(rand() * amounts.length)] + Math.floor(rand() * 800000);
    // Created 0~60 days ago
    const daysAgo = Math.floor(rand() * 60);
    const lastActivity = Math.floor(rand() * 14);
    const score = Math.min(100, 30 + Math.floor(rand() * 70) + (stageIdx * 5));

    leads.push({
      id: 'CH' + String(20000 + i).padStart(6, '0'),
      customerName: name,
      company,
      unitId: unit.id,
      stage: stage.id,
      stageIdx,
      item,
      amount,
      source: leadSources[Math.floor(rand() * leadSources.length)],
      inquiryType: inquiryTypes[Math.floor(rand() * inquiryTypes.length)],
      manager: D3.managers[Math.floor(rand() * D3.managers.length)],
      score,
      phone: '010-' + String(1000 + Math.floor(rand() * 9000)) + '-' + String(1000 + Math.floor(rand() * 9000)),
      email: ['contact', 'sales', 'info'][Math.floor(rand()*3)] + '@' + ['gmail.com','naver.com','daum.net','kakao.com'][Math.floor(rand()*4)],
      createdAt: new Date(2026, 4, 1 - daysAgo).toISOString().slice(0,10),
      lastActivityDays: lastActivity,
      stagnant: lastActivity >= 3 && stageIdx > 0 && stageIdx < 5,
      inquiry: ['홈페이지 견적 요청 폼 작성. 도입 시기 6월 초 검토 중.',
                '데모 영상 시청 후 PoC 가능 여부 문의.',
                '경쟁사 견적 비교 중. 단가 협상 가능 여부 확인 요청.',
                '연간 계약 갱신 협의. 추가 라이선스 도입 검토 중.',
                '담당자 변경 후 재컨택. 이전 견적 재발송 요청.'][Math.floor(rand()*5)],
    });
  }
  return leads;
}

function generateActivities(leads) {
  const rand = srand(123);
  const types = [
    { id: 'call', name: '통화', icon: 'phone', color: '#2563EB' },
    { id: 'meeting', name: '미팅', icon: 'users', color: '#7C3AED' },
    { id: 'email', name: '이메일', icon: 'mail', color: '#0EA5E9' },
    { id: 'quote', name: '견적발송', icon: 'doc', color: '#D97706' },
    { id: 'note', name: '메모', icon: 'note', color: '#64748B' },
    { id: 'claim', name: '클레임', icon: 'alert', color: '#DC2626' },
  ];
  const activities = {};
  const samples = [
    '유선 통화 완료. 6월 첫째 주 미팅 일정 협의함.',
    '담당자 미팅 진행. 예산 1.2억 규모 도입 의향 확인.',
    '견적서 v2 발송. 부가세 포함 단가표 첨부 요청 응대.',
    '제안서 PT 진행. 임원 결재 후 5월 말까지 회신 예정.',
    '경쟁사 대비 차별점 정리해서 후속 메일 발송.',
    '도입 후 운영 인력 산정 관련 추가 문의 응대.',
    '계약서 초안 검토 중. 법무 검토 회신 대기.',
    '1차 데모 진행. 추가 기능 시연 요청 접수.',
    '예산 확정 미정. 차년도 1Q 재검토 의사 전달.',
    '클레임 접수: 응답 지연 관련 사과 메일 발송.',
  ];
  leads.forEach(lead => {
    const n = 2 + Math.floor(rand() * 6);
    const list = [];
    for (let i = 0; i < n; i++) {
      const type = types[Math.floor(rand() * types.length)];
      const day = i === 0 ? lead.lastActivityDays : lead.lastActivityDays + 2 + Math.floor(rand() * 8);
      list.push({
        id: lead.id + '_a' + i,
        type: type.id,
        typeName: type.name,
        typeColor: type.color,
        text: samples[Math.floor(rand() * samples.length)],
        author: D3.managers[Math.floor(rand() * D3.managers.length)],
        daysAgo: day,
      });
    }
    activities[lead.id] = list.sort((a, b) => a.daysAgo - b.daysAgo);
  });
  return { activities, types };
}

function generateHistory(leads) {
  const rand = srand(456);
  const fields = ['진행상태', '예상 매출액', '담당자', '결제구분', '제안 항목'];
  const history = {};
  leads.forEach(lead => {
    const n = 2 + Math.floor(rand() * 5);
    const list = [];
    for (let i = 0; i < n; i++) {
      const field = fields[Math.floor(rand() * fields.length)];
      let from, to;
      if (field === '진행상태') {
        const fromI = Math.max(0, lead.stageIdx - 1 - Math.floor(rand() * 2));
        from = stages[fromI].name; to = stages[Math.min(lead.stageIdx, fromI + 1)].name;
      } else if (field === '예상 매출액') {
        from = D3.fmtKRWComma(Math.floor(lead.amount * 0.8)) + '원';
        to = D3.fmtKRWComma(lead.amount) + '원';
      } else if (field === '담당자') {
        from = D3.managers[Math.floor(rand()*D3.managers.length)];
        to = lead.manager;
      } else if (field === '결제구분') {
        from = '미정'; to = ['일시불', '분할 3회', '분할 6회'][Math.floor(rand()*3)];
      } else {
        from = D3.itemsByUnit[lead.unitId][0]; to = lead.item;
      }
      list.push({
        id: lead.id + '_h' + i,
        field, from, to,
        author: D3.managers[Math.floor(rand() * D3.managers.length)],
        daysAgo: 1 + Math.floor(rand() * 30),
      });
    }
    history[lead.id] = list.sort((a, b) => a.daysAgo - b.daysAgo);
  });
  return history;
}

const ALL_LEADS = generateLeads();
const { activities: ALL_ACTIVITIES, types: ACTIVITY_TYPES } = generateActivities(ALL_LEADS);
const ALL_HISTORY = generateHistory(ALL_LEADS);

window.SalesData = { stages, leadSources, inquiryTypes, ALL_LEADS, ALL_ACTIVITIES, ALL_HISTORY, ACTIVITY_TYPES, salesUnits };
