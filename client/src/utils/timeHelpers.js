// utils/timeHelpers.js
export const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

export const formatLastSeen = (dateStr) => {
  if (!dateStr) return 'Last seen recently';
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'Last seen just now';
    if (diff < 3600)  return `Last seen ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`;
    return `Last seen ${Math.floor(diff / 86400)}d ago`;
  } catch { return 'Last seen recently'; }
};

export const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Unknown';
  try { return new Date(dateStr).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  catch { return 'Unknown'; }
};
