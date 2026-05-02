// Sidebar component
function Sidebar({ route, setRoute, mobileOpen, setMobileOpen }) {
  const [itOpen, setItOpen] = React.useState(true);
  const [supportOpen, setSupportOpen] = React.useState(true);
  const [adminOpen, setAdminOpen] = React.useState(true);

  const I = window.Icons;
  const units = window.CRMData.businessUnits;
  const childUnits = units.filter(u => u.id !== 'it');

  const isActive = (path) => route === path;
  const go = (path) => { setRoute(path); setMobileOpen(false); };

  const undecidedCount = window.CRMData.ALL_RECORDS.filter(r => r.status === '미정' || r.status === '지연').length;

  return (
    <aside className={"sidebar" + (mobileOpen ? " open" : "")}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">CRM</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">통합 대시보드</div>
          <div className="sidebar-brand-sub">v2.0 · WEB App</div>
        </div>
      </div>

      <div className="sidebar-search">
        <input placeholder="메뉴 검색..." />
      </div>

      <nav className="nav">
        <div className="nav-section">
          <div className="nav-section-title">워크스페이스</div>
          <button className={"nav-item" + (isActive('dash:it') ? " active" : "")} onClick={() => go('dash:it')}>
            <I.building />
            <span>IT사업부</span>
            <span style={{ marginLeft: 6, fontSize: 9.5, padding: '1px 6px', background: 'rgba(59,130,246,0.2)', color: '#93C5FD', borderRadius: 3, fontWeight: 700, letterSpacing: '0.02em' }}>통합</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex' }} onClick={(e) => { e.stopPropagation(); setItOpen(!itOpen); }}>
              <I.chevron className={"nav-chevron nav-icon" + (itOpen ? " open" : "")} />
            </span>
          </button>
          {itOpen && childUnits.map(u => (
            <button key={u.id}
              className={"nav-item child" + (isActive(`dash:${u.id}`) ? " active" : "")}
              onClick={() => go(`dash:${u.id}`)}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
              {u.name}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">운영 관리</div>
          <button className={"nav-item" + (isActive('collections') ? " active" : "")} onClick={() => go('collections')}>
            <I.wallet />
            수금 미정
            <span className="nav-badge">{undecidedCount}</span>
          </button>
          <button className={"nav-item" + (isActive('rawdata') ? " active" : "")} onClick={() => go('rawdata')}>
            <I.grid />
            로우 데이터
          </button>
          <button className={"nav-item" + (isActive('sales') ? " active" : "")} onClick={() => go('sales')}>
            <I.trend />
            영업 대시보드
          </button>
        </div>

        <div className="nav-section">
          <button className="nav-item" onClick={() => setSupportOpen(!supportOpen)}>
            <I.cog />
            시스템 및 지원
            <I.chevron className={"nav-chevron nav-icon" + (supportOpen ? " open" : "")} />
          </button>
          {supportOpen && <>
            <button className={"nav-item child" + (isActive('about') ? " active" : "")} onClick={() => go('about')}>About</button>
            <button className={"nav-item child" + (isActive('feedback') ? " active" : "")} onClick={() => go('feedback')}>Feedback</button>
            <button className={"nav-item child" + (isActive('gallery') ? " active" : "")} onClick={() => go('gallery')}>App Gallery</button>
          </>}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">관리자</div>
          <button className={"nav-item" + (isActive('users') ? " active" : "")} onClick={() => go('users')}>
            <I.building /> 사용자/권한
          </button>
          <button className={"nav-item" + (isActive('audit') ? " active" : "")} onClick={() => go('audit')}>
            <I.alert /> 감사 로그
          </button>
          <button className={"nav-item" + (isActive('notifications') ? " active" : "")} onClick={() => go('notifications')}>
            <I.bell /> 알림 센터
          </button>
          <button className={"nav-item" + (isActive('reports') ? " active" : "")} onClick={() => go('reports')}>
            <I.download /> 보고서 빌더
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">JM</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="user-name">전준명</div>
          <div className="user-role">IT사업부 · 관리자</div>
        </div>
        <button className="icon-btn" style={{ background: 'transparent', border: 'none', color: '#94A3B8' }} title="알림">
          <I.bell />
        </button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
