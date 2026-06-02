import { useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { wlGetTeam, wlInviteMember, wlRemoveMember, wlUpdateMember } from '../../api/whiteLabelClient.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import Modal from '../ui/Modal.jsx';

export default function WLTeamSection() {
  const { data: members, loading, error, refetch } = useApi(wlGetTeam, []);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setInviting(true);
    setInviteSuccess('');
    try {
      await wlInviteMember(inviteEmail, inviteName, inviteRole);
      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail(''); setInviteName(''); setInviteRole('member');
      refetch();
    } catch (err) {
      alert(err?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId, name) {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      await wlRemoveMember(memberId);
      refetch();
    } catch (err) {
      alert(err?.message || 'Failed to remove member');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-fa-text-primary">Team</h2>
          <p className="text-fa-text-muted text-sm">Manage team members and their access roles.</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="bg-fa-primary text-fa-bg-base font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90">
          + Invite Member
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="bg-fa-bg-card border border-fa-border-default rounded-lg overflow-hidden">
        {(!members || members.length === 0) ? (
          <div className="py-12 text-center text-fa-text-muted">No team members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fa-border-default bg-fa-bg-base">
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Name</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Email</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Role</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Status</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Last login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-b border-fa-border-default hover:bg-fa-bg-base/40">
                  <td className="px-4 py-2.5 text-fa-text-primary font-medium">{m.name}</td>
                  <td className="px-4 py-2.5 text-fa-text-secondary">{m.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${m.role === 'admin' ? 'bg-fa-primary/20 text-fa-primary' : 'bg-fa-bg-base text-fa-text-muted'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {m.is_active
                      ? <span className="text-green-400 text-xs">Active</span>
                      : <span className="text-fa-text-muted text-xs">Inactive</span>
                    }
                    {!m.email_verified_at && m.is_active === false && (
                      <span className="text-yellow-400 text-xs ml-1">(pending)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-fa-text-muted text-xs">
                    {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-2.5">
                    {m.is_active && (
                      <button onClick={() => handleRemove(m.id, m.name)} className="text-red-400 text-xs hover:underline">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && (
        <Modal onClose={() => { setShowInvite(false); setInviteSuccess(''); }}>
          <div className="p-6 w-80">
            <h3 className="text-lg font-bold text-fa-text-primary mb-4">Invite Team Member</h3>
            {inviteSuccess
              ? <p className="text-green-400 text-sm mb-4">{inviteSuccess}</p>
              : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-fa-text-secondary mb-1">Name</label>
                    <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jane Smith"
                      className="w-full bg-fa-bg-base border border-fa-border-default rounded px-3 py-1.5 text-fa-text-primary text-sm focus:outline-none focus:border-fa-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-fa-text-secondary mb-1">Email</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="jane@company.com"
                      className="w-full bg-fa-bg-base border border-fa-border-default rounded px-3 py-1.5 text-fa-text-primary text-sm focus:outline-none focus:border-fa-primary" />
                  </div>
                  <div>
                    <label className="block text-sm text-fa-text-secondary mb-1">Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                      className="w-full bg-fa-bg-base border border-fa-border-default rounded px-3 py-1.5 text-fa-text-primary text-sm">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              )
            }
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowInvite(false); setInviteSuccess(''); }}
                className="flex-1 border border-fa-border-default text-fa-text-secondary py-2 rounded-lg text-sm">
                {inviteSuccess ? 'Close' : 'Cancel'}
              </button>
              {!inviteSuccess && (
                <button onClick={handleInvite} disabled={inviting || !inviteEmail || !inviteName}
                  className="flex-1 bg-fa-primary text-fa-bg-base font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
