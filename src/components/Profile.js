import React, { useState } from 'react';

export default function Profile({ currentUser, handleUpdateProfile, handleLogout, setView }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    await handleUpdateProfile({ name, email, password: password || undefined });
    setSaving(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="grid gap-4 max-w-md">
        <label className="text-sm">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="p-3 border rounded" />

        <label className="text-sm">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border rounded" />

        <label className="text-sm">New Password (leave blank to keep current)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 border rounded" />

        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setView('dashboard')} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
          <button onClick={handleLogout} className="ml-auto bg-red-600 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
    </div>
  );
}
