import { STAGES, STAGE_INDEX, stageDef, statusLabelFor, defaultStatusFor, type StageKey } from './stages';

const ACCENT = '#924623';

/**
 * Horizontal stage stepper for the manufacturing journey. Read-only by default;
 * pass onStageChange/onStatusChange to make stages clickable and expose a
 * status dropdown for the current stage.
 */
export default function StageStepper({
  stage, status, editable = false, onStageChange, onStatusChange, compact = false,
}: {
  stage?: string;
  status?: string;
  editable?: boolean;
  onStageChange?: (stage: StageKey) => void;
  onStatusChange?: (status: string) => void;
  compact?: boolean;
}) {
  const current = (stage as StageKey) || 'INQUIRY';
  const curIdx = STAGE_INDEX[current] ?? 0;
  const def = stageDef(current);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: `${ACCENT}14`, color: ACCENT }}>
        <i className={`fa-solid ${def.icon} text-[10px]`} />
        {def.label}
        <span className="text-gray-400 font-normal">· {statusLabelFor(current, status)}</span>
      </span>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {STAGES.map((st, i) => {
          const done = i < curIdx;
          const active = i === curIdx;
          const clickable = editable && !!onStageChange;
          return (
            <div key={st.key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStageChange?.(st.key)}
                className={`flex flex-col items-center gap-1.5 ${clickable ? 'cursor-pointer group' : 'cursor-default'}`}
                title={st.label}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] transition-colors ${active || done ? 'text-white' : 'bg-white text-gray-400 border border-gray-200 group-hover:border-gray-400'}`}
                  style={active || done ? { background: ACCENT } : undefined}
                >
                  {done ? <i className="fa-solid fa-check" /> : <i className={`fa-solid ${st.icon}`} />}
                </span>
                <span className={`text-[10.5px] font-semibold whitespace-nowrap ${active ? 'text-gray-800' : 'text-gray-400'}`}>{st.label}</span>
              </button>
              {i < STAGES.length - 1 && <div className="flex-1 h-0.5 mx-1.5 mb-5 rounded" style={{ background: i < curIdx ? ACCENT : '#e5e7eb' }} />}
            </div>
          );
        })}
      </div>

      {/* status for the current stage */}
      {editable && onStatusChange ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{def.label} status</span>
          <select
            value={status || defaultStatusFor(current)}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-8 px-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#924623]/20"
          >
            {def.statuses.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </div>
      ) : (
        <p className="text-[12px] text-gray-500">Status: <span className="font-semibold text-gray-700">{statusLabelFor(current, status)}</span></p>
      )}
    </div>
  );
}
