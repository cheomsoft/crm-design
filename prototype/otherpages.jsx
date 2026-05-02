// Other pages: Collections (수금 미정), Raw Data, About, Feedback, Gallery
const D2 = window.CRMData;
const f2 = D2.fmtKRW;
const fc2 = D2.fmtKRWComma;

function CollectionsPage() {
  const [records, setRecords] = React.useState(() =>
    D2.ALL_RECORDS.filter(r => r.status === '미정' || r.status === '지연')
  );
  const [unitFilter, setUnitFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filtered = records.filter(r => {
    if (unitFilter !== 'all' && r.unitId !== unitFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.customer.includes(search) && !r.item.includes(search)) return false;
    return true;
  });

  const total = D2.sumAmount(filtered);

  const update = (id, patch) => {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">수금 미정 관리</h1>
          <div className="page-sub">전사 미수·지연 건 통합 관리 · 인라인 편집 가능</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><window.Icons.bell style={{ width: 14, height: 14 }} /> 일괄 알림</button>
          <button className="btn primary"><window.Icons.download style={{ width: 14, height: 14 }} /> 엑셀 내보내기</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <window.Pages.KPICard label="총 미정·지연 건" value={filtered.length + '건'} sub="현재 필터 적용" icon="alert" tone="red" />
        <window.Pages.KPICard label="미수 총액" value={f2(total) + '원'} sub="필터링된 합계" icon="wallet" tone="red" />
        <window.Pages.KPICard label="30일 이상 지연" value={records.filter(r => r.status === '지연').length + '건'} sub="긴급 처리 대상" icon="alert" tone="amber" />
        <window.Pages.KPICard label="평균 처리 기간" value="14일" sub="미정 → 완료 평균" icon="calendar" tone="blue" />
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="고객명·항목 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="filter-label">사업부</span>
        <select className="filter-select" value={unitFilter} onChange={e => setUnitFilter(e.target.value)}>
          <option value="all">전체</option>
          {D2.businessUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <span className="filter-label">상태</span>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">전체</option>
          <option value="미정">미정</option>
          <option value="지연">지연</option>
        </select>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length}건 · 합계 <b style={{ color: 'var(--text)' }}>{fc2(total)}원</b></span>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <window.Pages.RecordTable records={filtered} editable={true} onUpdate={update} />
        </div>
      </div>
    </div>
  );
}

function RawDataPage({ initialFilter, onClearFilter }) {
  const [records, setRecords] = React.useState(D2.ALL_RECORDS);
  const [unitFilter, setUnitFilter] = React.useState(initialFilter?.unitId || 'all');
  const [monthFilter, setMonthFilter] = React.useState(initialFilter?.monthOffset !== undefined ? String(initialFilter.monthOffset) : 'all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (initialFilter?.unitId) setUnitFilter(initialFilter.unitId);
    if (initialFilter?.monthOffset !== undefined) setMonthFilter(String(initialFilter.monthOffset));
  }, [initialFilter]);

  const filtered = records.filter(r => {
    if (unitFilter !== 'all' && r.unitId !== unitFilter) return false;
    if (monthFilter !== 'all') {
      const off = parseInt(monthFilter);
      const today = new Date(2026, 4, 1);
      const target = new Date(today.getFullYear(), today.getMonth() + off, 1);
      const d = new Date(r.dueDate);
      if (d.getMonth() !== target.getMonth() || d.getFullYear() !== target.getFullYear()) return false;
    }
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.customer.includes(search) && !r.item.includes(search) && !r.id.includes(search)) return false;
    return true;
  });
  const total = D2.sumAmount(filtered);

  const update = (id, patch) => setRecords(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));

  const monthLabel = { '-1': '4월(전월)', '0': '5월(당월)', '1': '6월(익월)' };
  const unitName = unitFilter === 'all' ? null : D2.businessUnits.find(u => u.id === unitFilter)?.name;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumb" style={{ marginBottom: 4 }}>
            <span>대시보드</span>
            <span className="sep">›</span>
            <span style={{ color: 'var(--text)' }}>로우 데이터 테이블</span>
          </div>
          <h1 className="page-title">로우 데이터 상세 뷰</h1>
          <div className="page-sub">전체 매출/수금 레코드 · 필터·정렬·인라인 편집 지원</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onClearFilter && (initialFilter || unitFilter !== 'all' || monthFilter !== 'all') && (
            <button className="btn" onClick={onClearFilter}>
              <window.Icons.back style={{ width: 14, height: 14 }} /> 대시보드로
            </button>
          )}
          <button className="btn primary"><window.Icons.download style={{ width: 14, height: 14 }} /> CSV 내보내기</button>
        </div>
      </div>

      {(initialFilter || unitFilter !== 'all' || monthFilter !== 'all') && (
        <div className="drill-banner">
          <window.Icons.filter style={{ width: 14, height: 14 }} />
          <div>
            <b>필터 자동 적용:</b> {unitName && `사업부=${unitName}`}{unitName && monthFilter !== 'all' && ', '}{monthFilter !== 'all' && `수금예정일=${monthLabel[monthFilter]}`}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <input className="filter-input" placeholder="고객명·항목·ID 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="filter-label">사업부</span>
        <select className="filter-select" value={unitFilter} onChange={e => setUnitFilter(e.target.value)}>
          <option value="all">전체</option>
          {D2.businessUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <span className="filter-label">기간</span>
        <select className="filter-select" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="all">전체</option>
          <option value="-1">전월 (4월)</option>
          <option value="0">당월 (5월)</option>
          <option value="1">익월 (6월)</option>
        </select>
        <span className="filter-label">상태</span>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">전체</option>
          {D2.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length}건 · 합계 <b style={{ color: 'var(--text)' }}>{fc2(total)}원</b></span>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <window.Pages.RecordTable records={filtered} editable={true} onUpdate={update} />
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">About</h1>
          <div className="page-sub">시스템 정보 · 버전 · 업데이트 로그</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">시스템 정보</div></div>
          <div className="card-body">
            <div className="summary-row"><span className="summary-label">제품명</span><span className="summary-value">CRM 통합 대시보드</span></div>
            <div className="summary-row"><span className="summary-label">버전</span><span className="summary-value">v2.0.1</span></div>
            <div className="summary-row"><span className="summary-label">빌드</span><span className="summary-value">2026.05.01-1730</span></div>
            <div className="summary-row"><span className="summary-label">DB</span><span className="summary-value">PostgreSQL 16</span></div>
            <div className="summary-row"><span className="summary-label">관리자</span><span className="summary-value">전준명 · jm@company.kr</span></div>
            <div className="summary-row"><span className="summary-label">기술 지원</span><span className="summary-value" style={{ color: 'var(--blue)' }}>support@company.kr</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">최근 업데이트</div></div>
          <div className="card-body">
            {[
              { v: 'v2.0.1', d: '2026.05.01', t: '주차별 매출 추이 차트 추가, 다크모드 토글', tone: 'blue' },
              { v: 'v2.0.0', d: '2026.04.15', t: 'AppSheet → WEB App 전면 전환, PostgreSQL 마이그레이션 완료', tone: 'green' },
              { v: 'v1.8.2', d: '2026.03.22', t: '드릴다운 기능 추가, Excel 내보내기 개선', tone: 'blue' },
              { v: 'v1.8.0', d: '2026.02.10', t: '사업부 권한별 첫 화면 분기 로직 도입', tone: 'blue' },
            ].map((u, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={"badge badge-" + (u.tone === 'green' ? '완료' : '예정')}>{u.v}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.d}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{u.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackPage() {
  const [type, setType] = React.useState('improvement');
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Feedback</h1>
          <div className="page-sub">불편 사항·기능 개선 요청을 접수합니다</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body" style={{ padding: 24 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-soft)', display: 'inline-grid', placeItems: 'center', marginBottom: 14 }}>
                <window.Icons.check style={{ width: 28, height: 28, color: 'var(--green)' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>접수 완료</div>
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>피드백이 정상적으로 등록되었습니다. 영업일 기준 2일 이내 검토 후 회신드립니다.</div>
              <button className="btn primary" style={{ marginTop: 18 }} onClick={() => setSubmitted(false)}>새 피드백 작성</button>
            </div>
          ) : <>
            <div className="form-group">
              <label className="form-label">유형</label>
              <div className="segmented" style={{ display: 'flex' }}>
                <button className={type === 'bug' ? 'active' : ''} onClick={() => setType('bug')}>버그 신고</button>
                <button className={type === 'improvement' ? 'active' : ''} onClick={() => setType('improvement')}>기능 개선</button>
                <button className={type === 'request' ? 'active' : ''} onClick={() => setType('request')}>신규 요청</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">제목</label>
              <input className="form-input" placeholder="간단한 한 줄 요약" />
            </div>
            <div className="form-group">
              <label className="form-label">상세 내용</label>
              <textarea className="form-textarea" placeholder="발생한 상황, 기대했던 동작, 재현 방법을 적어주세요"></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">우선순위</label>
              <select className="form-input">
                <option>낮음 (편의 개선)</option>
                <option>보통 (기능 추가)</option>
                <option>높음 (업무 차질)</option>
                <option>긴급 (시스템 장애)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button className="btn primary" onClick={() => setSubmitted(true)}>접수하기</button>
              <button className="btn">취소</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function GalleryPage() {
  const apps = [
    { name: '인사 관리 (HR)', desc: '직원 정보·근태·급여 관리', color: '#2563EB', initial: 'HR' },
    { name: '영업 파이프라인', desc: '리드부터 계약까지 단계별 추적', color: '#0EA5E9', initial: 'SP' },
    { name: '회계 ERP', desc: '전표·세무·결산 통합 시스템', color: '#7C3AED', initial: 'AC' },
    { name: '재고 관리', desc: '입출고·재고 실사 시스템', color: '#DB2777', initial: 'IM' },
    { name: '고객 지원 (CS)', desc: '티켓·이메일·전화 응대 통합', color: '#16A34A', initial: 'CS' },
    { name: '프로젝트 관리', desc: '일정·이슈·산출물 트래킹', color: '#F59E0B', initial: 'PM' },
    { name: '마이메일러 콘솔', desc: 'ASP 발송·통계·고객사 관리', color: '#0EA5E9', initial: 'MM' },
    { name: '문서 자료실', desc: '사내 표준문서·양식 다운로드', color: '#475569', initial: 'DC' },
  ];
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">App Gallery</h1>
          <div className="page-sub">사내 업무 시스템 바로가기</div>
        </div>
      </div>
      <div className="gallery-grid">
        {apps.map((a, i) => (
          <div key={i} className="gallery-card">
            <div className="gallery-icon" style={{ background: a.color }}>{a.initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="gallery-name">{a.name}</div>
              <div className="gallery-desc">{a.desc}</div>
            </div>
            <window.Icons.external style={{ width: 14, height: 14, color: 'var(--text-mute)', marginTop: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.OtherPages = { CollectionsPage, RawDataPage, AboutPage, FeedbackPage, GalleryPage };
