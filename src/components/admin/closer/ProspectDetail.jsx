import ProspectHeader from './ProspectHeader';
import CallBrief from './CallBrief';
import RecentNotes from './RecentNotes';
import PriorCallsHistory from './PriorCallsHistory';
import DeliveredLeads from './DeliveredLeads';

export default function ProspectDetail({
  queueItem,
  detail,
  calls,
  callsLoading,
  callsError,
  token,
  showToast,
}) {
  if (!queueItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <svg className="text-slate-700 mb-4" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h.5M9 12a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-slate-500 text-sm">Select a prospect from the queue</p>
        <p className="text-slate-700 text-xs mt-1">Their profile and history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <ProspectHeader queueItem={queueItem} detail={detail} />
      <CallBrief queueItem={queueItem} />
      <DeliveredLeads
        token={token}
        subscriberId={queueItem.subscriber_id}
        showToast={showToast}
      />
      {detail?.recent_notes?.length > 0 && (
        <RecentNotes notes={detail.recent_notes} />
      )}
      <PriorCallsHistory
        calls={calls}
        loading={callsLoading}
        error={callsError}
      />
    </div>
  );
}
