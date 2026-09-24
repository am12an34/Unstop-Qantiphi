import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { REMINDER_LABELS } from '../utils/format'

export default function ProfileModal() {
  const { user, signIn, updateProfile, signOut, profileOpen, closeProfile } = useUser()
  const { notify } = useToast()
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    defaultReminderMinutes: user?.defaultReminderMinutes || 1440,
  }))
  const [saving, setSaving] = useState(false)

  if (!profileOpen) return null

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (user) {
        await updateProfile({ name: form.name, city: form.city, defaultReminderMinutes: Number(form.defaultReminderMinutes) })
        notify('Profile updated')
      } else {
        const profile = await signIn({ name: form.name, email: form.email, city: form.city })
        notify(`Welcome, ${profile.name}!`)
      }
      closeProfile()
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeProfile}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} autoComplete="off">
        <h2>{user ? 'Your profile' : 'Join EventPulse'}</h2>
        <p className="muted small">{user ? 'Update your details and reminder preference.' : 'Use the same email to get back to your RSVPs.'}</p>

        <label>Name<input name="name" autoComplete="off" value={form.name} onChange={onChange} required minLength={2} /></label>
        <label>Email<input name="email" type="email" autoComplete="off" value={form.email} onChange={onChange} required disabled={Boolean(user)} /></label>
        <label>City<input name="city" autoComplete="off" value={form.city} onChange={onChange} placeholder="e.g. Agartala" /></label>
        {user && (
          <label>
            Default reminder
            <select name="defaultReminderMinutes" value={form.defaultReminderMinutes} onChange={onChange}>
              {Object.entries(REMINDER_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
        )}

        <div className="modal-actions">
          {user && (
            <button type="button" className="btn btn-ghost" onClick={() => { signOut(); closeProfile() }}>Sign out</button>
          )}
          <button type="button" className="btn btn-ghost" onClick={closeProfile}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : user ? 'Save' : 'Continue'}</button>
        </div>
      </form>
    </div>
  )
}
