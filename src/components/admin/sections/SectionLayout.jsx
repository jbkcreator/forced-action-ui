import { useSearchParams } from 'react-router-dom';
import { useAdminContext } from '../adminContext';

const TAB_NAV_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

function tabBtnStyle(active) {
  return {
    background: active ? 'rgba(250,204,21,0.15)' : 'transparent',
    color: active ? '#facc15' : '#94a3b8',
    boxShadow: active ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
  };
}

export default function SectionLayout({ tabs }) {
  const { token } = useAdminContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = tabs.find(t => t.id === searchParams.get('tab'))?.id ?? tabs[0].id;
  const active = tabs.find(t => t.id === activeId) ?? tabs[0];
  const ActiveComponent = active.Component;

  function setTab(id) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 pt-6 pb-3">
        <nav aria-label="Section tabs" className="flex gap-1 p-1 rounded-xl w-fit" style={TAB_NAV_STYLE}>
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={activeId === t.id ? 'page' : undefined}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={tabBtnStyle(activeId === t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <ActiveComponent token={token} />
        </div>
      </div>
    </div>
  );
}
