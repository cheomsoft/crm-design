// Sales Dashboard pages — Salesforce-style pipeline + lead detail
const SD = window.SalesData;
const SI = window.Icons;
const SfmtK = window.CRMData.fmtKRW;
const Sfmt = window.CRMData.fmtKRWComma;

function StageBadge({ stageId }) {
  const s = SD.stages.find(x => x.id === stageId);
  if (!s) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 999,
      background: s.color + '15', color: s.color,
      fontSize: 11.5, fontWeight: 600, border: '1px solid ' + s.color + '33',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.name}
    </span>
  );
}

// Stepbar progress (used in detail header)
function StageStepBar({ currentStageIdx }) {
  const visible = SD.stages.slice(0, 6); // exclude 드랍
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {visible.map((s, i) => {
        const done = i < currentStageIdx;
        const active = i === currentStageIdx;
        const lost = currentStageIdx === 6;
        return (
          <React.Fragment key={s.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              background: lost ? '#FEE2E2' : active ? s.color : done ? s.color + '15' : '#F1F5F9',
              color: lost ? '#DC2626' : active ? 'white' : done ? s.color : 'var(--text-3)',
              fontSize: 11.5, fontWeight: 600,
              borderRadius: 4,
              clipPath: i === 0 ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                : i === visible.length - 1 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)'
                : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)',
              marginLeft: i === 0 ? 0 : -2,
              minWidth: 0, flex: 1,
              whiteSpace: 'nowrap', justifyContent: 'center',
            }}>
              {done && <SI.check style={{ width: 12, height: 12 }} />}
              {s.name}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Pipeline funnel chart
function PipelineFunnel() {
  const counts = SD.stages.slice(0, 6).map(s => SD.ALL_LEADS.filter(l => l.stage === s.id).length);
  const max = Math.max(...counts, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {SD.stages.slice(0, 6).map((s, i) => {
        const c = counts[i];
        const w = (c / max) * 100;
        const amount = window.CRMData.sumAmount(SD.ALL_LEADS.filter(l => l.stage === s.id).map(l => ({ amount: l.amount })));
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 88, fontSize: 12, fontWeight: 600, color: 'var(--text-2)', flexShrink: 0 }}>{s.name}</div>
            <div style={{ flex: 1, position: 'relative', height: 28, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: '0 auto 0 0', width: w + '%',
                background: s.color, borderRadius: 4,
                display: 'flex', alignItems: 'center', paddingLeft: 10, color: 'white', fontWeight: 700, fontSize: 12,
              }}>{c}건</div>
            </div>
            <div style={{ width: 80, textAlign: 'right', fontSize: 12, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{SfmtK(amount)}</div>
          </div>
        );
      })}
    </div>
  );
}

// Kanban-style stage columns
function PipelineKanban({ leads, onSelectLead }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(200px, 1fr))', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
      {SD.stages.slice(0, 6).map(s => {
        const stageLeads = leads.filter(l => l.stage === s.id);
        const total = stageLeads.reduce((a, l) => a + l.amount, 0);
        return (
          <div key={s.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: 10, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontWeight: 600, fontSize: 12.5 }}>{s.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{stageLeads.length}건 · {SfmtK(total)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
              {stageLeads.slice(0, 6).map(lead => {
                const unit = window.CRMData.businessUnits.find(u => u.id === lead.unitId);
                return (
                  <div key={lead.id} onClick={() => onSelectLead(lead)} style={{
                    background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: 10, cursor: 'pointer',
                    borderLeft: '3px solid ' + s.color,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.customerName} 님</div>
                      {lead.stagnant && <span title="3일 이상 정체" style={{ fontSize: 10, padding: '1px 5px', background: '#FEF2F2', color: '#DC2626', borderRadius: 3, fontWeight: 700 }}>정체</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 10.5, color: unit.color, fontWeight: 600 }}>{unit.shortName}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{SfmtK(lead.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: lead.score + '%', height: '100%', background: lead.score >= 80 ? '#16A34A' : lead.score >= 50 ? '#2563EB' : '#94A3B8' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, width: 24, textAlign: 'right' }}>{lead.score}</span>
                    </div>
                  </div>
                );
              })}
              {stageLeads.length > 6 && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', padding: 4 }}>+{stageLeads.length - 6}건 더보기</div>}
              {stageLeads.length === 0 && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-mute)', padding: 12 }}>—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Activity icon
function ActivityIcon({ type, size = 14 }) {
  const icons = {
    call: '📞', meeting: '👥', email: '✉', quote: '📄', note: '📝', claim: '⚠'
  };
  // Use SVG instead
  const t = SD.ACTIVITY_TYPES.find(x => x.id === type) || SD.ACTIVITY_TYPES[4];
  return (
    <span style={{
      width: 28, height: 28, borderRadius: '50%',
      background: t.color + '15', color: t.color,
      display: 'inline-grid', placeItems: 'center', flexShrink: 0,
      fontSize: 12, fontWeight: 700,
    }}>{t.name.charAt(0)}</span>
  );
}

// Lead Detail page (Salesforce-style)
function LeadDetailPage({ lead, onBack }) {
  const [activities, setActivities] = React.useState(SD.ALL_ACTIVITIES[lead.id] || []);
  const [history] = React.useState(SD.ALL_HISTORY[lead.id] || []);
  const [newMemo, setNewMemo] = React.useState('');
  const [memoType, setMemoType] = React.useState('note');
  const [tab, setTab] = React.useState('all');

  const unit = window.CRMData.businessUnits.find(u => u.id === lead.unitId);

  const submitMemo = () => {
    if (!newMemo.trim()) return;
    const t = SD.ACTIVITY_TYPES.find(x => x.id === memoType);
    setActivities([{
      id: 'new_' + Date.now(), type: memoType, typeName: t.name, typeColor: t.color,
      text: newMemo, author: '전준명', daysAgo: 0,
    }, ...activities]);
    setNewMemo('');
  };

  const dayLabel = (d) => d === 0 ? '방금' : d === 1 ? '어제' : d + '일 전';

  return (
    <div>
      <div className="page-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="breadcrumb" style={{ marginBottom: 6 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, fontSize: 13 }}>영업 대시보드</button>
            <span className="sep">›</span>
            <span style={{ color: 'var(--text)' }}>{lead.id}</span>
          </div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white', display: 'inline-grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>
              {lead.customerName.charAt(0)}
            </span>
            {lead.customerName} 님
            {lead.stagnant && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', background: '#FEF2F2', color: '#DC2626', borderRadius: 999, border: '1px solid #FECACA', fontWeight: 600 }}>
                <SI.alert style={{ width: 12, height: 12 }} /> 정체 {lead.lastActivityDays}일
              </span>
            )}
          </h1>
          <div className="page-sub" style={{ marginTop: 4 }}>
            {lead.company} · {unit.name} · 담당 {lead.manager} · 유입 {lead.source}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><SI.msg style={{ width: 14, height: 14 }} /> 메일 발송</button>
          <button className="btn">📞 전화 걸기</button>
          <button className="btn primary"><SI.check style={{ width: 14, height: 14 }} /> 계약 전환</button>
        </div>
      </div>

      {/* KPI band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>예상 매출액</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>{Sfmt(lead.amount)}<span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2 }}>원</span></div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>리드 스코어</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: lead.score >= 80 ? '#16A34A' : lead.score >= 50 ? '#2563EB' : '#94A3B8', letterSpacing: '-0.02em' }}>{lead.score}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>/ 100</div>
          </div>
          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: lead.score + '%', height: '100%', background: lead.score >= 80 ? '#16A34A' : lead.score >= 50 ? '#2563EB' : '#94A3B8' }} />
          </div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>최근 활동</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em', color: lead.lastActivityDays >= 3 ? '#DC2626' : 'var(--text)' }}>{lead.lastActivityDays}<span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 2 }}>일 전</span></div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>문의 유형</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{lead.inquiryType}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>등록일 {lead.createdAt}</div>
        </div>
      </div>

      {/* Stage step bar */}
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>진행 단계</div>
          <button className="btn sm">단계 변경</button>
        </div>
        <StageStepBar currentStageIdx={lead.stageIdx} />
      </div>

      {/* Body: Left info / Right activity feed */}
      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head"><div className="card-title">고객 정보</div></div>
            <div className="card-body">
              <div className="summary-row"><span className="summary-label">고객명</span><span className="summary-value">{lead.customerName} 님</span></div>
              <div className="summary-row"><span className="summary-label">소속</span><span className="summary-value">{lead.company}</span></div>
              <div className="summary-row"><span className="summary-label">연락처</span><span className="summary-value" style={{ color: 'var(--blue)' }}>{lead.phone}</span></div>
              <div className="summary-row"><span className="summary-label">이메일</span><span className="summary-value" style={{ color: 'var(--blue)' }}>{lead.email}</span></div>
              <div className="summary-row"><span className="summary-label">유입 경로</span><span className="summary-value">{lead.source}</span></div>
              <div className="summary-row"><span className="summary-label">제안 항목</span><span className="summary-value">{lead.item}</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">문의 본문</div></div>
            <div className="card-body" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--blue)' }}>
                {lead.inquiry}
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-head"><div className="card-title">변경 이력 (Audit Trail)</div></div>
            <div className="card-body" style={{ padding: '4px 18px 14px' }}>
              {history.length === 0 && <div className="empty" style={{ padding: 20 }}>변경 이력이 없습니다.</div>}
              {history.map(h => (
                <div key={h.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12.5 }}>
                  <div style={{ width: 56, color: 'var(--text-3)', fontSize: 11, flexShrink: 0 }}>{dayLabel(h.daysAgo)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text)' }}>
                      <b>{h.author}</b> 님이 <b style={{ color: 'var(--blue)' }}>{h.field}</b>을(를) 변경
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--text-3)' }}>
                      <span style={{ textDecoration: 'line-through' }}>{h.from}</span> → <b style={{ color: 'var(--text-2)' }}>{h.to}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 72 }}>
          <div className="card-head">
            <div>
              <div className="card-title">활동 타임라인</div>
              <div className="card-sub">{activities.length}건의 활동 · 시간 역순</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 14 }}>
            {/* Memo composer */}
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                {SD.ACTIVITY_TYPES.map(t => (
                  <button key={t.id} onClick={() => setMemoType(t.id)} style={{
                    padding: '4px 10px', fontSize: 11.5, borderRadius: 999,
                    border: '1px solid ' + (memoType === t.id ? t.color : 'var(--border)'),
                    background: memoType === t.id ? t.color + '15' : 'white',
                    color: memoType === t.id ? t.color : 'var(--text-2)',
                    fontWeight: 600, cursor: 'pointer',
                  }}>{t.name}</button>
                ))}
              </div>
              <textarea
                value={newMemo} onChange={e => setNewMemo(e.target.value)}
                placeholder="@담당자 멘션 가능 · 활동 내용을 입력하세요"
                style={{
                  width: '100%', border: '1px solid var(--border)', borderRadius: 6,
                  padding: 8, fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical', minHeight: 60, outline: 'none',
                }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn primary sm" onClick={submitMemo}>활동 기록</button>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {[{ id: 'all', label: '전체' }, ...SD.ACTIVITY_TYPES].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11.5, color: tab === t.id ? 'var(--blue)' : 'var(--text-3)',
                  fontWeight: tab === t.id ? 700 : 500, padding: '2px 4px',
                  borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
                }}>{t.label || t.name}</button>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 2, background: '#E2E8F0' }} />
              {activities
                .filter(a => tab === 'all' || a.type === tab)
                .map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, marginBottom: 14, position: 'relative' }}>
                  <ActivityIcon type={a.type} />
                  <div style={{ flex: 1, minWidth: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: a.typeColor }}>{a.typeName}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.author}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{dayLabel(a.daysAgo)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>{a.text}</div>
                  </div>
                </div>
              ))}
              {activities.filter(a => tab === 'all' || a.type === tab).length === 0 && (
                <div className="empty">해당 유형의 활동이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sales dashboard main page
function SalesDashboardPage({ onSelectLead }) {
  const [view, setView] = React.useState('kanban');
  const [search, setSearch] = React.useState('');
  const [unitFilter, setUnitFilter] = React.useState('all');
  const [stagnantOnly, setStagnantOnly] = React.useState(false);

  const filtered = SD.ALL_LEADS.filter(l => {
    if (unitFilter !== 'all' && l.unitId !== unitFilter) return false;
    if (stagnantOnly && !l.stagnant) return false;
    if (search && !l.customerName.includes(search) && !l.company.includes(search) && !l.id.includes(search)) return false;
    return true;
  });

  // KPIs
  const totalLeads = filtered.length;
  const totalAmount = filtered.reduce((a, l) => a + l.amount, 0);
  const won = filtered.filter(l => l.stage === 'closed_won');
  const wonAmount = won.reduce((a, l) => a + l.amount, 0);
  const conversionRate = totalLeads ? (won.length / totalLeads * 100) : 0;
  const stagnant = filtered.filter(l => l.stagnant);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">영업 대시보드</h1>
          <div className="page-sub">통합 파이프라인 · 4개 사업부 + 외부 유입 통합 관리</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><SI.download style={{ width: 14, height: 14 }} /> 엑셀</button>
          <button className="btn primary"><SI.arrow style={{ width: 14, height: 14 }} /> 신규 리드 등록</button>
        </div>
      </div>

      <div className="kpi-grid">
        <window.Pages.KPICard label="활성 리드" value={totalLeads + '건'} sub="현재 필터 적용" icon="trend" tone="blue" />
        <window.Pages.KPICard label="파이프라인 총액" value={SfmtK(totalAmount) + '원'} sub="예상 매출 합계" icon="wallet" tone="blue" />
        <window.Pages.KPICard label="당월 성약" value={won.length + '건 · ' + SfmtK(wonAmount)} sub={"전환율 " + conversionRate.toFixed(1) + '%'} icon="check" tone="green" />
        <window.Pages.KPICard label="정체 리드" value={stagnant.length + '건'} sub="3일 이상 무활동" icon="alert" tone="red" />
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">파이프라인 단계별 현황</div>
              <div className="card-sub">단계별 리드 수 · 예상 매출 합계</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 14 }}>
            <PipelineFunnel />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">정체 리드 알림</div>
              <div className="card-sub">3일 이상 활동 없음 · 우선 컨택 권장</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '0 14px 14px', maxHeight: 280, overflowY: 'auto' }}>
            {stagnant.slice(0, 8).map(l => (
              <div key={l.id} onClick={() => onSelectLead(l)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px',
                borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{l.lastActivityDays}d</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.customerName} 님 · {l.company}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}><StageBadge stageId={l.stage} /> · 담당 {l.manager}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{SfmtK(l.amount)}</div>
              </div>
            ))}
            {stagnant.length === 0 && <div className="empty">정체 리드 없음 — 모두 활발히 진행 중입니다 ✓</div>}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="고객명·기업명·ID 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="filter-label">사업부</span>
        <select className="filter-select" value={unitFilter} onChange={e => setUnitFilter(e.target.value)}>
          <option value="all">전체</option>
          {SD.salesUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={stagnantOnly} onChange={e => setStagnantOnly(e.target.checked)} /> 정체 리드만
        </label>
        <span style={{ flex: 1 }} />
        <div className="segmented">
          <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>칸반</button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>리스트</button>
        </div>
      </div>

      {view === 'kanban' ? (
        <PipelineKanban leads={filtered} onSelectLead={onSelectLead} />
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ID</th><th>고객명</th><th>기업/소속</th><th>사업부</th><th>단계</th>
                    <th className="num">예상 매출</th><th className="num">스코어</th><th>담당자</th><th>최근 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const unit = window.CRMData.businessUnits.find(u => u.id === l.unitId);
                    return (
                      <tr key={l.id} onClick={() => onSelectLead(l)} style={{ cursor: 'pointer' }} className={l.stagnant ? 'danger' : ''}>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{l.id}</td>
                        <td style={{ fontWeight: 600 }}>{l.customerName} 님</td>
                        <td>{l.company}</td>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: unit.color }} />{unit.shortName}</span></td>
                        <td><StageBadge stageId={l.stage} /></td>
                        <td className="num col-amount">{Sfmt(l.amount)}</td>
                        <td className="num" style={{ color: l.score >= 80 ? '#16A34A' : l.score >= 50 ? 'var(--blue)' : 'var(--text-3)', fontWeight: 700 }}>{l.score}</td>
                        <td style={{ color: 'var(--text-2)' }}>{l.manager}</td>
                        <td style={{ color: l.lastActivityDays >= 3 ? '#DC2626' : 'var(--text-3)', fontSize: 12 }}>{l.lastActivityDays}일 전</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.SalesPages = { SalesDashboardPage, LeadDetailPage };
