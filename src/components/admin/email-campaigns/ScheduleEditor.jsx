// Shared send-schedule editor — used in both Create and Edit campaign modals.

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export const DEFAULT_SCHEDULE = {
  from: '09:00',
  to: '17:00',
  timezone: 'America/New_York',
  days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
};

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)' },
  { value: 'America/Chicago',     label: 'Central (CT)' },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
];

const IN = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' };
const OPT = { background: '#0f172a', color: '#e2e8f0' };

export function buildSchedulePayload(schedule) {
  return {
    from:          schedule.from,
    to:            schedule.to,
    timezone:      schedule.timezone,
    days:          schedule.days,
    schedule_name: 'Default',
  };
}

export default function ScheduleEditor({ schedule, onChange }) {
  function set(key, value) { onChange({ ...schedule, [key]: value }); }
  function toggleDay(day)  { onChange({ ...schedule, days: { ...schedule.days, [day]: !schedule.days[day] } }); }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>Send Schedule</p>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>From</label>
          <input
            type="time"
            value={schedule.from}
            onChange={e => set('from', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            style={IN}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>To</label>
          <input
            type="time"
            value={schedule.to}
            onChange={e => set('to', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            style={IN}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>Timezone</label>
          <select
            value={schedule.timezone}
            onChange={e => set('timezone', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ ...IN, color: '#e2e8f0' }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value} style={OPT}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>Sending days</p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className="text-xs px-2.5 py-1 rounded-md font-medium transition-all"
              style={{
                background: schedule.days[day] ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
                color:      schedule.days[day] ? '#facc15' : '#64748b',
                border:     `1px solid ${schedule.days[day] ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
