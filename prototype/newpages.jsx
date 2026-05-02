// IT사업부 통합 대시보드 + 4 new admin pages + toast/animations CSS
const NP = window.CRMData;
const NSI = window.Icons;
const NfmtK = NP.fmtKRW;
const Nfmt = NP.fmtKRWComma;

// Toast singleton
let toastId = 0;
const toastListeners = [];
window.toast = (msg, type = 'success') => {
  const t = { id: ++toastId, msg, type };
  toastListeners.forEach(fn => fn(t));
};
function ToastHost() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const fn = (t) => {
      setItems(s => [...s, t]);
      setTimeout(() => setItems(s => s.filter(x => x.id !== t.id)), 1800);
    };
    toastListeners.push(fn);
    return () => { const i = toastListeners.indexOf(fn); if (i >= 0) toastListeners.splice(i, 1); };
  }, []);
  return (
    <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {items.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#DC2626' : '#16A34A',
          color: 'white', padding: '8px 14px', borderRadius: 6,
          fontSize: 12.5, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.2s ease',
        }}>
          {t.type === 'error' ? '⚠ ' : '✓ '}{t.msg}
        </div>
      ))}
    </div>
  );
}

// CountUp number
function CountUp({ value, duration = 600, format = (v) => v.toLocaleString('ko-KR') }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{format(n)}</span>;
}
window.CountUp = CountUp;

// IT통합 대시보드
function ITConsolidatedDashboard({ onNavigate, onDrilldown }) {
  const [period, setPeriod] = React.useState('month');
  const [refreshAt] = React.useState(new Date());
  const [exportOpen, setExportOpen] = React.useState(false);

  const childUnits = NP.businessUnits.filter(u => u.id !== 'it');
  const allUnitIds = NP.businessUnits.map(u => u.id);

  // Aggregate across all units
  const agg = (off, status) => {
    let total = 0;
    allUnitIds.forEach(uid => {
      let recs = NP.getRecords({ unitId: uid, monthOffset: off });
      if (status) recs = recs.filter(r => r.status === status);
      total += NP.sumAmount(recs);
    });
    return total;
  };
  const prev = agg(-1, '완료');
  const curr = agg(0);
  const currDone = agg(0, '완료');
  const next = agg(1);
  const overdueCount = NP.ALL_RECORDS.filter(r => r.status === '미정' || r.status === '지연').length;
  const overdueAmount = NP.sumAmount(NP.ALL_RECORDS.filter(r => r.status === '미정' || r.status === '지연'));
  const achievement = curr ? (currDone / curr * 100) : 0;
  const prevDelta = prev ? ((curr - prev) / prev * 100) : 0;

  // Per-unit summary
  const unitSummary = NP.businessUnits.map(u => {
    const recs = NP.getRecords({ unitId: u.id, monthOffset: 0 });
    const done = recs.filter(r => r.status === '완료');
    const total = NP.sumAmount(recs);
    const dn = NP.sumAmount(done);
    return { unit: u, total, done: dn, count: recs.length, rate: total ? (dn/total*100) : 0 };
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            IT사업부 통합 대시보드
            <span style={{ fontSize: 11, padding: '3px 8px', background: 'var(--blue-soft)', color: 'var(--blue)', borderRadius: 999, fontWeight: 700, letterSpacing: '0.02em' }}>통합</span>
          </h1>
          <div className="page-sub">처음서비스 · 마이메일러 · 프링고 통합 합산 · 2026년 5월</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#16A34A', marginRight: 4, animation: 'pulse 2s infinite' }} />
            방금 갱신됨
          </span>
          <button className="btn" onClick={() => window.toast('데이터 새로고침 완료')}><NSI.refresh style={{ width: 14, height: 14 }} /> 새로고침</button>
          <div style={{ position: 'relative' }}>
            <button className="btn primary" onClick={() => setExportOpen(!exportOpen)}>
              <NSI.download style={{ width: 14, height: 14 }} /> 내보내기 ▾
            </button>
            {exportOpen && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'white', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 140, zIndex: 30 }}>
                {['Excel (.xlsx)', 'CSV (.csv)', 'PDF 보고서'].map(o => (
                  <button key={o} onClick={() => { setExportOpen(false); window.toast(o + ' 다운로드'); }} style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 12.5, cursor: 'pointer' }}
                    onMouseEnter={e => e.target.style.background = '#F1F5F9'} onMouseLeave={e => e.target.style.background = 'none'}>{o}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <window.Pages.KPICard label="전월 통합 수금" value={NfmtK(prev) + '원'} sub="4월 확정 합계" icon="check" tone="green" />
        <window.Pages.KPICard label="당월 통합 예정" value={NfmtK(curr) + '원'} sub="5월 파이프라인" icon="wallet" tone="blue" delta={{ dir: prevDelta >= 0 ? 'up' : 'down', text: Math.abs(prevDelta).toFixed(1) + '%' }} />
        <window.Pages.KPICard label="익월 통합 예정" value={NfmtK(next) + '원'} sub="6월 예측" icon="trend" tone="blue" />
        <window.Pages.KPICard label="통합 미정·지연" value={NfmtK(overdueAmount) + '원'} sub={overdueCount + '건 관리 필요'} icon="alert" tone="red" />
      </div>

      {/* 자회사별 매출 기여도 + 달성률 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head">
          <div>
            <div className="card-title">자회사별 매출 기여도</div>
            <div className="card-sub">당월 예정 수금액 · 카드 클릭 시 해당 사업부 이동</div>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>달성률 = 실제 수금 / 예정 수금</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {unitSummary.map(s => (
              <div key={s.unit.id} onClick={() => onNavigate('dash:' + s.unit.id)} style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 14,
                cursor: 'pointer', borderLeft: '3px solid ' + s.unit.color, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.unit.name}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{s.count}건</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, marginTop: 6, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{Nfmt(s.total)}원</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  <span>실제 {NfmtK(s.done)}</span>
                  <span style={{ color: s.rate >= 80 ? '#16A34A' : s.rate >= 50 ? 'var(--blue)' : '#DC2626', fontWeight: 700 }}>{s.rate.toFixed(0)}%</span>
                </div>
                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: s.rate + '%', height: '100%', background: s.unit.color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">자회사별 그룹 비교</div>
              <div className="card-sub">전월 / 당월 / 익월 통합 비교</div>
            </div>
          </div>
          <div className="card-body"><div className="chart-box h-260"><window.Charts.UnitsComparisonChart /></div></div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">통합 달성률</div>
              <div className="card-sub">실제 / 예정</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <window.Charts.GaugeRing percent={achievement} size={170} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 사용자/권한 관리
function UsersPage() {
  const users = [
    { name: '전준명', email: 'jm@company.kr', unit: 'IT사업부', role: '관리자', last: '방금 전' },
    { name: '김민준', email: 'mj@company.kr', unit: 'IT사업부', role: 'IT사업부장', last: '5분 전' },
    { name: '이서연', email: 'sy@company.kr', unit: '마이메일러', role: '사업부장', last: '20분 전' },
    { name: '박지호', email: 'jh@company.kr', unit: '처음서비스', role: '사업부장', last: '1시간 전' },
    { name: '최수아', email: 'sa@company.kr', unit: '프링고', role: '영업담당', last: '2시간 전' },
    { name: '정도윤', email: 'dy@company.kr', unit: '마이메일러', role: '영업담당', last: '어제' },
    { name: '강하은', email: 'he@company.kr', unit: 'IT사업부', role: '조회전용', last: '3일 전' },
    { name: '윤재원', email: 'jw@company.kr', unit: '처음서비스', role: '영업담당', last: '5일 전' },
  ];
  const [editUser, setEditUser] = React.useState(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const roleColors = { '관리자': '#DC2626', 'IT사업부장': '#7C3AED', '사업부장': '#2563EB', '영업담당': '#0EA5E9', '조회전용': '#64748B' };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">사용자 / 권한 관리</h1>
          <div className="page-sub">총 {users.length}명 · 역할 5종 · 사업부별 권한 매트릭스</div>
        </div>
        <button className="btn primary" onClick={() => setInviteOpen(true)}><NSI.arrow style={{ width: 14, height: 14 }} /> 신규 사용자 초대</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>이름</th><th>이메일</th><th>소속</th><th>역할</th><th>마지막 로그인</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{u.name.charAt(0)}</span>
                    <b>{u.name}</b>
                  </span></td>
                  <td style={{ color: 'var(--text-2)' }}>{u.email}</td>
                  <td>{u.unit}</td>
                  <td><span style={{ padding: '2px 8px', background: roleColors[u.role] + '15', color: roleColors[u.role], borderRadius: 4, fontSize: 11.5, fontWeight: 600 }}>{u.role}</span></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{u.last}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn sm" onClick={() => setEditUser(u)}>권한 편집</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editUser || inviteOpen) && (
        <div className="modal-bg" onClick={() => { setEditUser(null); setInviteOpen(false); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ fontSize: 15, fontWeight: 700 }}>{inviteOpen ? '신규 사용자 초대' : (editUser?.name + ' 님의 권한 편집')}</div>
              <button className="btn ghost sm" onClick={() => { setEditUser(null); setInviteOpen(false); }}>✕</button>
            </div>
            <div className="modal-body">
              {inviteOpen ? <>
                <div className="form-group"><label className="form-label">이메일</label><input className="form-input" placeholder="user@company.kr" /></div>
                <div className="form-group"><label className="form-label">역할</label><select className="form-input"><option>관리자</option><option>IT사업부장</option><option>사업부장</option><option>영업담당</option><option>조회전용</option></select></div>
              </> : (
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>사업부</th><th style={{ padding: 8 }}>읽기</th><th style={{ padding: 8 }}>쓰기</th><th style={{ padding: 8 }}>관리</th></tr></thead>
                  <tbody>
                    {NP.businessUnits.map(u => (
                      <tr key={u.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 10 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: u.color }} />{u.name}</span></td>
                        <td style={{ padding: 10, textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                        <td style={{ padding: 10, textAlign: 'center' }}><input type="checkbox" defaultChecked={u.id === 'it'} /></td>
                        <td style={{ padding: 10, textAlign: 'center' }}><input type="checkbox" defaultChecked={u.id === 'it' && editUser?.role === '관리자'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button className="btn" onClick={() => { setEditUser(null); setInviteOpen(false); }}>취소</button>
                <button className="btn primary" onClick={() => { window.toast(inviteOpen ? '초대 메일 발송' : '권한 저장됨'); setEditUser(null); setInviteOpen(false); }}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 감사 로그
function AuditLogPage() {
  const actions = [
    { t: '방금', user: '전준명', action: '수정', target: 'Collections', detail: '진행상태: 미정 → 완료', id: 'R00042' },
    { t: '5분 전', user: '김민준', action: '생성', target: 'Lead', detail: '신규 리드 등록', id: 'CH020012' },
    { t: '15분 전', user: '이서연', action: '수정', target: 'SalesData', detail: '예상 매출액: 4,500,000원 → 5,200,000원', id: 'R00031' },
    { t: '32분 전', user: '박지호', action: '삭제', target: 'Note', detail: '활동 메모 삭제', id: 'CH020008_a3' },
    { t: '1시간 전', user: '전준명', action: '수정', target: 'Users', detail: '역할: 영업담당 → 사업부장', id: 'sa@company.kr' },
    { t: '2시간 전', user: '최수아', action: '수정', target: 'Collections', detail: '담당자: 강하은 → 정도윤', id: 'R00018' },
    { t: '어제', user: '윤재원', action: '생성', target: 'Activity', detail: '미팅 활동 기록', id: 'CH020005_a1' },
    { t: '어제', user: '강하은', action: '수정', target: 'Lead', detail: '진행단계: 제안서 → 견적발송', id: 'CH020001' },
  ];
  const actionColors = { '생성': '#16A34A', '수정': '#2563EB', '삭제': '#DC2626' };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">감사 로그 (Audit Log)</h1>
          <div className="page-sub">시스템 변경 이력 · 시간 역순 · WCAG 준수</div>
        </div>
      </div>
      <div className="filter-bar">
        <select className="filter-select"><option>전체 기간</option><option>오늘</option><option>최근 7일</option><option>최근 30일</option></select>
        <select className="filter-select"><option>전체 사용자</option><option>전준명</option><option>김민준</option></select>
        <select className="filter-select"><option>전체 테이블</option><option>Collections</option><option>SalesData</option><option>Users</option></select>
        <select className="filter-select"><option>전체 액션</option><option>생성</option><option>수정</option><option>삭제</option></select>
        <span style={{ flex: 1 }} />
        <button className="btn sm"><NSI.download style={{ width: 12, height: 12 }} /> 내보내기</button>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>시각</th><th>사용자</th><th>액션</th><th>대상</th><th>상세 내용</th><th>레코드 ID</th></tr></thead>
            <tbody>
              {actions.map((a, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{a.t}</td>
                  <td><b>{a.user}</b></td>
                  <td><span style={{ padding: '2px 8px', background: actionColors[a.action] + '15', color: actionColors[a.action], borderRadius: 4, fontSize: 11.5, fontWeight: 700 }}>{a.action}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{a.target}</td>
                  <td style={{ color: 'var(--text-2)' }}>{a.detail}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-3)' }}>{a.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 알림 센터
function NotificationsPage() {
  const [tab, setTab] = React.useState('all');
  const items = [
    { id: 1, type: 'delay', t: '방금', title: '수금 지연 발생', body: '충북보건과학대학교 · 8,500,000원 · 5일 경과', read: false },
    { id: 2, type: 'mention', t: '12분 전', title: '김민준 님이 회신함', body: '@전준명 견적서 v3 검토 후 회신 부탁드립니다.', read: false },
    { id: 3, type: 'system', t: '1시간 전', title: '일일 배치 완료', body: 'Materialized View 갱신 · 2,310건 처리', read: false },
    { id: 4, type: 'delay', t: '3시간 전', title: '정체 리드 알림', body: '유연주 님 · 견적발송 단계 4일 정체', read: true },
    { id: 5, type: 'mention', t: '어제', title: '이서연 님이 멘션함', body: '@전준명 마이메일러 4월 마감 보고서 확인 부탁', read: true },
    { id: 6, type: 'system', t: '어제', title: '백업 완료', body: 'PostgreSQL 일일 백업 정상 완료', read: true },
  ];
  const tabs = [{ id: 'all', label: '전체' }, { id: 'delay', label: '지연' }, { id: 'mention', label: '멘션' }, { id: 'system', label: '시스템' }];
  const filtered = items.filter(i => tab === 'all' || i.type === tab);
  const typeColors = { delay: '#DC2626', mention: '#2563EB', system: '#64748B' };
  const typeLabels = { delay: '지연', mention: '멘션', system: '시스템' };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">알림 센터</h1>
          <div className="page-sub">{items.filter(i => !i.read).length}개의 새로운 알림</div>
        </div>
        <button className="btn" onClick={() => window.toast('모두 읽음 처리됨')}><NSI.check style={{ width: 14, height: 14 }} /> 모두 읽음</button>
      </div>
      <div className="tabs">
        {tabs.map(t => <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
              borderBottom: '1px solid #F1F5F9', background: n.read ? 'white' : '#F8FAFC',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: typeColors[n.type] + '15', color: typeColors[n.type], display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>
                {typeLabels[n.type].charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{n.t}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 보고서 빌더
function ReportBuilderPage() {
  const [period, setPeriod] = React.useState('this-month');
  const [unit, setUnit] = React.useState('all');
  const [charts, setCharts] = React.useState(['kpi', 'trend', 'breakdown']);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const toggleChart = (id) => setCharts(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">보고서 빌더</h1>
          <div className="page-sub">임원 보고용 1페이지 PDF 자동 생성</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">설정</div></div>
          <div className="card-body" style={{ padding: 18 }}>
            <div className="form-group">
              <label className="form-label">기간</label>
              <select className="form-input" value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="this-month">이번 달 (5월)</option>
                <option value="last-month">지난 달 (4월)</option>
                <option value="quarter">2분기</option>
                <option value="half">상반기</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">사업부</label>
              <select className="form-input" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="all">전체 (IT 통합)</option>
                {NP.businessUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">포함 항목</label>
              {[
                { id: 'kpi', label: 'KPI 요약 (4개 카드)' },
                { id: 'trend', label: '주차별 추이 차트' },
                { id: 'breakdown', label: '서비스별 매출 비중' },
                { id: 'unresolved', label: '미정·지연 목록' },
                { id: 'sales', label: '영업 파이프라인 요약' },
              ].map(o => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={charts.includes(o.id)} onChange={() => toggleChart(o.id)} /> {o.label}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setPreviewOpen(true)}>미리보기</button>
              <button className="btn primary" onClick={() => window.toast('PDF 생성 중...')}><NSI.download style={{ width: 14, height: 14 }} /> PDF 생성</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">미리보기</div><span style={{ fontSize: 11, color: 'var(--text-3)' }}>A4 1페이지</span></div>
          <div className="card-body">
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: 24, fontSize: 11, aspectRatio: '0.707', overflow: 'hidden' }}>
              <div style={{ borderBottom: '2px solid var(--blue)', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>월간 영업 보고서</div>
                  <div style={{ fontSize: 9, color: 'var(--text-3)' }}>2026년 5월 · {unit === 'all' ? 'IT사업부 통합' : NP.businessUnits.find(u => u.id === unit)?.name}</div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'right' }}>
                  <div>생성일 2026.05.02</div>
                  <div>작성자: 전준명</div>
                </div>
              </div>
              {charts.includes('kpi') && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                  {['전월', '당월', '익월', '미정'].map(l => (
                    <div key={l} style={{ background: '#F8FAFC', padding: 6, borderRadius: 4 }}>
                      <div style={{ fontSize: 8, color: 'var(--text-3)' }}>{l}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{(Math.random()*5+1).toFixed(1)}억</div>
                    </div>
                  ))}
                </div>
              )}
              {charts.includes('trend') && <div style={{ height: 70, background: 'linear-gradient(180deg, #EFF4FF 0%, white 100%)', borderRadius: 4, marginBottom: 10, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 9 }}>📈 주차별 추이 차트</div>}
              {charts.includes('breakdown') && <div style={{ height: 60, background: '#F8FAFC', borderRadius: 4, marginBottom: 10, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 9 }}>📊 서비스별 매출 비중</div>}
              {charts.includes('unresolved') && <div style={{ fontSize: 8, color: 'var(--text-3)' }}>• 미정·지연 상위 10건 표<br/>• 합계 및 평균 지연일</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.NewPages = { ITConsolidatedDashboard, UsersPage, AuditLogPage, NotificationsPage, ReportBuilderPage, ToastHost };
