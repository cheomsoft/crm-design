// Dashboard pages

const D = window.CRMData;
const { fmtKRW, fmtKRWFull, fmtKRWComma } = D;

function StatusBadge({ status }) {
  return <span className={"badge badge-" + status}>{status}</span>;
}

// Filterable sortable record table
function RecordTable({ records, onRowClick, editable = false, onUpdate }) {
  const [sortKey, setSortKey] = React.useState('dueDate');
  const [sortDir, setSortDir] = React.useState('desc');

  const sorted = [...records].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    let cmp = 0;
    if (typeof av === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv), 'ko');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHead = ({ k, children, align }) => (
    <th onClick={() => toggleSort(k)} style={{ cursor: 'pointer', textAlign: align || 'left' }}>
      {children}
      {sortKey === k && <span style={{ marginLeft: 4, color: 'var(--blue)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );

  const isOverdue = (r) => {
    const due = new Date(r.dueDate);
    return due < new Date(2026, 4, 1) && r.status !== '완료';
  };

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <SortHead k="unitId">사업부</SortHead>
            <SortHead k="customer">고객명</SortHead>
            <SortHead k="item">항목</SortHead>
            <SortHead k="amount" align="right">매출금액</SortHead>
            <SortHead k="dueDate">수금예정일</SortHead>
            <SortHead k="status">진행상태</SortHead>
            <SortHead k="manager">담당자</SortHead>
            <th>구분</th>
            <th style={{ minWidth: 140 }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => {
            const unit = D.businessUnits.find(u => u.id === r.unitId);
            return (
              <tr key={r.id}
                className={isOverdue(r) ? 'danger' : ''}
                onClick={() => onRowClick && onRowClick(r)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: unit.color }} />
                    {unit.shortName}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{r.customer}</td>
                <td style={{ color: 'var(--text-2)' }}>{r.item}</td>
                <td className="num col-amount">{fmtKRWComma(r.amount)}</td>
                <td style={{ color: isOverdue(r) ? 'var(--red)' : 'var(--text-2)', fontWeight: isOverdue(r) ? 600 : 400 }}>
                  {r.dueDate}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  {editable ? (
                    <select className={"status-select badge badge-" + r.status}
                      value={r.status}
                      onChange={e => onUpdate && onUpdate(r.id, { status: e.target.value })}>
                      {D.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : <StatusBadge status={r.status} />}
                </td>
                <td style={{ color: 'var(--text-2)' }}>{r.manager}</td>
                <td><span className={"badge-" + r.customerType}>{r.customerType}</span></td>
                <td style={{ color: 'var(--text-3)', fontSize: 12 }} title={r.memo}>
                  {editable ? (
                    <input className="inline-edit"
                      defaultValue={r.memo}
                      onBlur={e => onUpdate && onUpdate(r.id, { memo: e.target.value })}
                      onClick={e => e.stopPropagation()} />
                  ) : (r.memo || '—')}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr><td colSpan="9" className="empty">조건에 맞는 데이터가 없습니다.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function KPICard({ label, value, sub, icon, tone, delta }) {
  const I = window.Icons;
  const Icon = I[icon];
  return (
    <div className={"kpi " + tone}>
      <div className="kpi-icon">{Icon && <Icon style={{ width: 16, height: 16 }} />}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">
        {delta && <span className={"kpi-delta " + (delta.dir)}>{delta.dir === 'up' ? '↑' : '↓'} {delta.text}</span>}
        {sub}
      </div>
    </div>
  );
}

// IT 사업부 dashboard (and template for others)
function UnitDashboard({ unitId, onDrilldown }) {
  const [tab, setTab] = React.useState('summary');
  const [period, setPeriod] = React.useState('month'); // month | quarter | half

  const unit = D.businessUnits.find(u => u.id === unitId);
  const C = window.Charts;

  // KPIs
  const prev = D.sumAmount(D.getRecords({ unitId, monthOffset: -1 }).filter(r => r.status === '완료'));
  const curr = D.sumAmount(D.getRecords({ unitId, monthOffset: 0 }));
  const currDone = D.sumAmount(D.getRecords({ unitId, monthOffset: 0 }).filter(r => r.status === '완료'));
  const next = D.sumAmount(D.getRecords({ unitId, monthOffset: 1 }));
  const overdue = D.getRecords({ unitId }).filter(r => r.status === '미정' || r.status === '지연');
  const overdueAmount = D.sumAmount(overdue);
  const achievement = curr ? (currDone / curr * 100) : 0;
  const prevDelta = prev ? ((curr - prev) / prev * 100) : 0;

  // Recent records (this month)
  const monthlyRecords = D.getRecords({ unitId, monthOffset: 0 });
  const undoneRecords = D.getRecords({ unitId }).filter(r => r.status === '미정' || r.status === '지연').slice(0, 8);

  const tabs = [
    { id: 'summary', label: '요약' },
    { id: 'monthly', label: '월별 상세' },
    { id: 'trend', label: '추이 분석' },
    { id: 'unresolved', label: '미정 관리' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{unit.name} 대시보드</h1>
          <div className="page-sub">2026년 5월 · 실시간 업데이트 · 관리자: 전준명</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="segmented">
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>당월</button>
            <button className={period === 'quarter' ? 'active' : ''} onClick={() => setPeriod('quarter')}>분기</button>
            <button className={period === 'half' ? 'active' : ''} onClick={() => setPeriod('half')}>상반기</button>
          </div>
          <button className="btn"><window.Icons.refresh style={{ width: 14, height: 14 }} /> 새로고침</button>
          <button className="btn"><window.Icons.download style={{ width: 14, height: 14 }} /> 내보내기</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'summary' && <>
        {/* KPI Row */}
        <div className="kpi-grid">
          <KPICard label="전월 수금액" value={fmtKRW(prev) + '원'} sub="2026년 4월 확정"
            icon="check" tone="green" />
          <KPICard label="당월 예정 수금" value={fmtKRW(curr) + '원'} sub="2026년 5월"
            icon="wallet" tone="blue" delta={{ dir: prevDelta >= 0 ? 'up' : 'down', text: Math.abs(prevDelta).toFixed(1) + '%' }} />
          <KPICard label="익월 예정 수금" value={fmtKRW(next) + '원'} sub="2026년 6월 파이프라인"
            icon="trend" tone="blue" />
          <KPICard label="수금 미정·지연" value={fmtKRW(overdueAmount) + '원'} sub={overdue.length + '건 관리 필요'}
            icon="alert" tone="red" />
        </div>

        {/* Charts row 1 */}
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">수금 통합 차트</div>
                <div className="card-sub">전월 / 당월 / 익월 — 막대 클릭 시 상세 보기</div>
              </div>
              <div className="legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: '#94A3B8' }} /> 전월</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#2563EB' }} /> 당월</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#60A5FA' }} /> 익월</span>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-box h-260">
                <C.CollectionBarChart unitId={unitId} onBarClick={(off) => onDrilldown({ unitId, monthOffset: off })} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">당월 달성률</div>
                <div className="card-sub">실제 수금 / 예정 수금</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <C.GaugeRing percent={achievement} size={170} />
              <div style={{ width: '100%' }}>
                <div className="summary-row">
                  <span className="summary-label"><span className="dot" style={{ background: '#16A34A' }} /> 실제 수금</span>
                  <span className="summary-value" style={{ color: '#16A34A' }}>{fmtKRWComma(currDone)}원</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label"><span className="dot" style={{ background: '#2563EB' }} /> 예정 수금</span>
                  <span className="summary-value">{fmtKRWComma(curr)}원</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label"><span className="dot" style={{ background: '#DC2626' }} /> 잔여 미수</span>
                  <span className="summary-value" style={{ color: '#DC2626' }}>{fmtKRWComma(curr - currDone)}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">주차별 수금 추이</div>
                <div className="card-sub">2026년 5월 · 1주차 ~ 5주차</div>
              </div>
            </div>
            <div className="card-body"><div className="chart-box h-220"><C.WeeklyTrendChart unitId={unitId} /></div></div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">신규 vs 재구매</div>
                <div className="card-sub">고객 유형별 매출 비중</div>
              </div>
            </div>
            <div className="card-body"><div className="chart-box h-220"><C.CustomerTypeDonut unitId={unitId} /></div></div>
          </div>
        </div>

        {/* Service breakdown */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-head">
            <div>
              <div className="card-title">서비스별 매출 비중</div>
              <div className="card-sub">최근 4개월 · 카테고리별 누적 매출</div>
            </div>
          </div>
          <div className="card-body"><div className="chart-box h-260"><C.ServiceStackedChart unitId={unitId} /></div></div>
        </div>

        {/* Top records preview */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">당월 수금 내역</div>
              <div className="card-sub">{monthlyRecords.length}건 · 행 클릭 시 상세보기</div>
            </div>
            <button className="btn sm" onClick={() => onDrilldown({ unitId, monthOffset: 0 })}>
              전체 보기 <window.Icons.arrow style={{ width: 12, height: 12 }} />
            </button>
          </div>
          <div className="card-body" style={{ padding: '0 0 12px' }}>
            <RecordTable records={monthlyRecords.slice(0, 8)} onRowClick={() => onDrilldown({ unitId, monthOffset: 0 })} />
          </div>
        </div>
      </>}

      {tab === 'monthly' && <MonthlyDetail unitId={unitId} />}
      {tab === 'trend' && <TrendAnalysis unitId={unitId} />}
      {tab === 'unresolved' && <UnresolvedTracker unitId={unitId} />}
    </div>
  );
}

function MonthlyDetail({ unitId }) {
  const [monthOffset, setMonthOffset] = React.useState(0);
  const records = D.getRecords({ unitId, monthOffset });
  const total = D.sumAmount(records);
  const labels = { '-1': '전월 (4월)', '0': '당월 (5월)', '1': '익월 (6월)' };

  return (
    <div>
      <div className="filter-bar">
        <div className="segmented">
          <button className={monthOffset === -1 ? 'active' : ''} onClick={() => setMonthOffset(-1)}>전월</button>
          <button className={monthOffset === 0 ? 'active' : ''} onClick={() => setMonthOffset(0)}>당월</button>
          <button className={monthOffset === 1 ? 'active' : ''} onClick={() => setMonthOffset(1)}>익월</button>
        </div>
        <span style={{ color: 'var(--text-3)', fontSize: 12.5, marginLeft: 8 }}>
          {labels[monthOffset]} · 총 {records.length}건 · 합계 <b style={{ color: 'var(--text)' }}>{fmtKRWComma(total)}원</b>
        </span>
        <span style={{ flex: 1 }} />
        <button className="btn sm"><window.Icons.download style={{ width: 12, height: 12 }} /> 엑셀</button>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <RecordTable records={records} editable={true} onUpdate={() => {}} />
        </div>
      </div>
    </div>
  );
}

function TrendAnalysis({ unitId }) {
  const C = window.Charts;
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head">
          <div>
            <div className="card-title">주차별 매출 추이 분석</div>
            <div className="card-sub">예정 수금 vs 실제 수금 · 괴리율 시각화</div>
          </div>
        </div>
        <div className="card-body"><div className="chart-box h-260"><C.WeeklyTrendChart unitId={unitId} /></div></div>
      </div>
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">서비스 카테고리별 추이</div>
            <div className="card-sub">최근 4개월 누적 비교</div>
          </div>
        </div>
        <div className="card-body"><div className="chart-box h-260"><C.ServiceStackedChart unitId={unitId} /></div></div>
      </div>
    </div>
  );
}

function UnresolvedTracker({ unitId }) {
  const [records, setRecords] = React.useState(() =>
    D.getRecords({ unitId }).filter(r => r.status === '미정' || r.status === '지연')
  );
  const total = D.sumAmount(records);

  const update = (id, patch) => {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KPICard label="총 미정·지연" value={records.length + '건'} sub="해당 사업부 누적" icon="alert" tone="red" />
        <KPICard label="미수 합계" value={fmtKRW(total) + '원'} sub="지연 누적 금액" icon="wallet" tone="amber" />
        <KPICard label="평균 지연" value="14일" sub="예정일 대비 평균" icon="calendar" tone="amber" />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head">
          <div>
            <div className="card-title">미정·지연 레코드</div>
            <div className="card-sub">상태/비고 인라인 편집 · 우선순위 관리</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm"><window.Icons.bell style={{ width: 12, height: 12 }} /> 알림 발송</button>
            <button className="btn sm primary"><window.Icons.check style={{ width: 12, height: 12 }} /> 일괄 처리</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <RecordTable records={records} editable={true} onUpdate={update} />
        </div>
      </div>
    </div>
  );
}

window.Pages = { UnitDashboard, RecordTable, KPICard, StatusBadge };
