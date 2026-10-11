import React, { useState } from 'react';
import { Users, UserPlus, Shield, UserMinus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MemberList = ({
  members = [],
  owner,
  tripId,
  onAddMember,
  onRemoveMember,
}) => {
  const { currentUser } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const ownerId = owner?._id ? owner._id.toString() : owner?.toString();
  const currentUserId = currentUser?._id?.toString();
  const isCurrentUserOwner = ownerId === currentUserId;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setInviting(true);
    setStatusMessage({ type: '', text: '' });

    const result = await onAddMember(tripId, emailInput.trim());
    setInviting(false);

    if (result && result.success) {
      setEmailInput('');
      setStatusMessage({ type: 'success', text: result.message || 'Member added successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    } else {
      setStatusMessage({ type: 'error', text: result?.error || 'Failed to add member' });
    }
  };

  const handleRemove = async (member) => {
    const memberId = member._id ? member._id.toString() : member.toString();
    const isOwner = memberId === ownerId;
    if (isOwner) return;

    if (window.confirm(`Are you sure you want to remove ${member.name || 'this member'} from the trip?`)) {
      const res = await onRemoveMember(tripId, memberId);
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to remove member' });
      }
    }
  };

  return (
    <div className="members-panel">
      <div className="members-panel-header">
        <div className="members-title-wrap">
          <Users size={20} className="panel-icon" />
          <h3 className="section-title">Trip Members ({members.length})</h3>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`status-alert ${statusMessage.type}`}>
          {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Invite Member Form */}
      <form onSubmit={handleInvite} className="member-invite-form">
        <input
          type="email"
          placeholder="Invite by registered email..."
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="invite-input"
          required
        />
        <button type="submit" className="btn btn-primary btn-sm invite-btn" disabled={inviting}>
          <UserPlus size={15} />
          <span>{inviting ? 'Inviting...' : 'Invite'}</span>
        </button>
      </form>

      {/* Member Cards List */}
      <div className="members-grid-list">
        {members.map((member) => {
          const mId = member._id ? member._id.toString() : member.toString();
          const isOwner = mId === ownerId;
          const isSelf = mId === currentUserId;

          return (
            <div key={mId} className="member-item-card">
              <div className="member-avatar-pill">
                {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
              </div>

              <div className="member-info-col">
                <div className="member-name-row">
                  <span className="member-full-name">{member.name || 'Member'}</span>
                  {isOwner && (
                    <span className="role-badge owner-badge">
                      <Shield size={11} /> Owner
                    </span>
                  )}
                  {isSelf && !isOwner && <span className="role-badge you-badge">You</span>}
                </div>
                <span className="member-email-addr">{member.email || ''}</span>
              </div>

              {/* Remove button: Owner can remove others, or member can leave */}
              {!isOwner && (isCurrentUserOwner || isSelf) && (
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  className="btn btn-ghost btn-xs remove-member-btn"
                  title={isSelf ? 'Leave trip' : 'Remove member'}
                >
                  <UserMinus size={14} />
                  <span>{isSelf ? 'Leave' : 'Remove'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberList;
