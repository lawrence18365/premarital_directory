import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../../components/analytics/SEOHelmet'
import { supabase } from '../../lib/supabaseClient'
import {
  DEFAULT_PARTNER_CITY_ID,
  DISTRIBUTION_CHANNEL_OPTIONS,
  DISTRIBUTION_STATUS_OPTIONS,
  PARTNER_AUDIENCES,
  PARTNER_CITY_PRESETS,
  PARTNER_SPECIALTY_PRESETS,
  buildPartnerRef,
  buildTrackedDirectoryUrl,
  findCityPreset,
  slugifySegment
} from '../../data/growthConfig'

const SITE_ORIGIN = 'https://www.weddingcounselors.com'

const formatDateTimeInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const pad = (entry) => String(entry).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const DistributionOpsDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tasks, setTasks] = useState([])
  const [taskEdits, setTaskEdits] = useState({})
  const [draft, setDraft] = useState({
    channel: DISTRIBUTION_CHANNEL_OPTIONS[0].value,
    audience: DISTRIBUTION_CHANNEL_OPTIONS[0].defaultAudience,
    cityId: DEFAULT_PARTNER_CITY_ID,
    specialty: 'none',
    targetName: '',
    targetUrl: '',
    owner: '',
    notes: '',
    nextActionAt: '',
    refCode: ''
  })

  useEffect(() => {
    loadTasks()
  }, [])

  const selectedCity = findCityPreset(draft.cityId)
  const generatedDraftRef = slugifySegment(draft.refCode) || buildPartnerRef({
    audience: draft.audience,
    city: selectedCity.city,
    stateAbbr: selectedCity.stateAbbr,
    specialtySlug: draft.specialty
  })
  const generatedDestination = buildTrackedDirectoryUrl({
    audience: draft.audience,
    cityPreset: selectedCity,
    specialtySlug: draft.specialty,
    refCode: generatedDraftRef,
    siteOrigin: SITE_ORIGIN
  })

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('distribution_tasks')
        .select('*')
        .order('next_action_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      setTasks(data || [])
      setTaskEdits((data || []).reduce((acc, task) => {
        acc[task.id] = {
          status: task.status || 'queued',
          owner: task.owner || '',
          notes: task.notes || '',
          nextActionAt: formatDateTimeInput(task.next_action_at)
        }
        return acc
      }, {}))
    } catch (error) {
      console.error('Error loading distribution tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('distribution_tasks')
        .insert({
          channel: draft.channel,
          audience: draft.audience,
          market: `${selectedCity.city}, ${selectedCity.stateAbbr}`,
          target_name: draft.targetName || null,
          target_url: draft.targetUrl || null,
          destination_url: generatedDestination,
          ref_code: generatedDraftRef,
          owner: draft.owner || null,
          status: 'queued',
          notes: draft.notes || null,
          next_action_at: draft.nextActionAt ? new Date(draft.nextActionAt).toISOString() : null,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setDraft({
        channel: DISTRIBUTION_CHANNEL_OPTIONS[0].value,
        audience: DISTRIBUTION_CHANNEL_OPTIONS[0].defaultAudience,
        cityId: DEFAULT_PARTNER_CITY_ID,
        specialty: 'none',
        targetName: '',
        targetUrl: '',
        owner: '',
        notes: '',
        nextActionAt: '',
        refCode: ''
      })
      await loadTasks()
    } catch (error) {
      console.error('Error creating distribution task:', error)
      alert(`Unable to create task: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const saveTask = async (taskId) => {
    const edit = taskEdits[taskId]
    if (!edit) return

    try {
      const { error } = await supabase
        .from('distribution_tasks')
        .update({
          status: edit.status,
          owner: edit.owner || null,
          notes: edit.notes || null,
          next_action_at: edit.nextActionAt ? new Date(edit.nextActionAt).toISOString() : null,
          last_contacted_at: edit.status === 'contacted' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      await loadTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      alert(`Unable to save task: ${error.message}`)
    }
  }

  const groupedTasks = DISTRIBUTION_STATUS_OPTIONS.map((status) => ({
    ...status,
    tasks: tasks.filter((task) => task.status === status.value)
  })).filter((group) => group.tasks.length > 0 || group.value === 'queued' || group.value === 'contacted' || group.value === 'live')

  return (
    <div className="container" style={{ padding: 'var(--space-12) 0' }}>
      <SEOHelmet title="Distribution Ops Dashboard" description="Internal distribution workflow dashboard" noindex={true} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h1>Distribution Ops</h1>
          <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
            Turn Reddit, Facebook groups, planners, churches, and clerk outreach into a weekly operating system with tracked destination links.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/admin/partners" className="btn btn-primary">Partner Reporting</Link>
          <Link to="/admin/dashboard" className="btn btn-outline">Back to Admin</Link>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)',
        gap: 'var(--space-6)',
        alignItems: 'start'
      }}>
        <form
          onSubmit={handleCreate}
          style={{
            background: 'white',
            border: '1px solid rgba(14, 94, 94, 0.12)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6)',
            display: 'grid',
            gap: 'var(--space-4)'
          }}
        >
          <div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Create a distribution task</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Every task gets a destination URL and ref code so channel activity can be measured later.
            </p>
          </div>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Channel</span>
            <select
              className="form-control"
              value={draft.channel}
              onChange={(event) => {
                const selectedChannel = DISTRIBUTION_CHANNEL_OPTIONS.find((item) => item.value === event.target.value)
                setDraft((current) => ({
                  ...current,
                  channel: event.target.value,
                  audience: selectedChannel?.defaultAudience || current.audience
                }))
              }}
            >
              {DISTRIBUTION_CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Audience / ref type</span>
            <select
              className="form-control"
              value={draft.audience}
              onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))}
            >
              {PARTNER_AUDIENCES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Market</span>
            <select
              className="form-control"
              value={draft.cityId}
              onChange={(event) => setDraft((current) => ({ ...current, cityId: event.target.value }))}
            >
              {PARTNER_CITY_PRESETS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.city}, {option.stateAbbr}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Landing wedge</span>
            <select
              className="form-control"
              value={draft.specialty}
              onChange={(event) => setDraft((current) => ({ ...current, specialty: event.target.value }))}
            >
              {PARTNER_SPECIALTY_PRESETS.map((option) => (
                <option key={option.slug} value={option.slug}>{option.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Target name</span>
            <input
              type="text"
              className="form-control"
              value={draft.targetName}
              onChange={(event) => setDraft((current) => ({ ...current, targetName: event.target.value }))}
              placeholder="Brides of Dallas Facebook Group"
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Target URL</span>
            <input
              type="url"
              className="form-control"
              value={draft.targetUrl}
              onChange={(event) => setDraft((current) => ({ ...current, targetUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Owner</span>
            <input
              type="text"
              className="form-control"
              value={draft.owner}
              onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
              placeholder="Lawrence"
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Optional ref override</span>
            <input
              type="text"
              className="form-control"
              value={draft.refCode}
              onChange={(event) => setDraft((current) => ({ ...current, refCode: event.target.value }))}
              placeholder="planner-dallas-north"
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Next action</span>
            <input
              type="datetime-local"
              className="form-control"
              value={draft.nextActionAt}
              onChange={(event) => setDraft((current) => ({ ...current, nextActionAt: event.target.value }))}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600 }}>Notes</span>
            <textarea
              className="form-control"
              rows="4"
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="What angle will you use? Which page are you sending?"
            />
          </label>

          <div style={{
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(14, 94, 94, 0.04)',
            border: '1px solid rgba(14, 94, 94, 0.1)',
            padding: 'var(--space-4)'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.45rem', color: 'var(--primary-dark)' }}>
              Generated destination
            </strong>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.6, wordBreak: 'break-word' }}>{generatedDestination}</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Ref code: <strong>{generatedDraftRef}</strong>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create Task'}
          </button>
        </form>

        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)'
          }}>
            {DISTRIBUTION_CHANNEL_OPTIONS.slice(0, 4).map((channel) => (
              <div
                key={channel.value}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'white',
                  border: '1px solid rgba(14, 94, 94, 0.1)'
                }}
              >
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  {channel.cadence}
                </div>
                <strong style={{ display: 'block', color: 'var(--primary-dark)', marginTop: 'var(--space-2)', marginBottom: '0.35rem' }}>
                  {channel.label}
                </strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {channel.summary}
                </span>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: 'var(--space-3)' }}>Loading workflow...</p>
            </div>
          ) : groupedTasks.length === 0 ? (
            <div style={{
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-2xl)',
              background: 'white',
              border: '1px solid rgba(14, 94, 94, 0.12)',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>No workflow yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                Create the first distribution task to move channel strategy out of Markdown and into a repeatable workflow.
              </p>
            </div>
          ) : (
            groupedTasks.map((group) => (
              <div key={group.value} style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)'
                }}>
                  <h2 style={{ marginBottom: 0 }}>{group.label}</h2>
                  <span style={{ color: 'var(--text-secondary)' }}>{group.tasks.length}</span>
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {group.tasks.map((task) => {
                    const edit = taskEdits[task.id] || {
                      status: task.status,
                      owner: task.owner || '',
                      notes: task.notes || '',
                      nextActionAt: formatDateTimeInput(task.next_action_at)
                    }

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: 'white',
                          borderRadius: 'var(--radius-2xl)',
                          border: '1px solid rgba(14, 94, 94, 0.12)',
                          padding: 'var(--space-5)'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 'var(--space-4)',
                          flexWrap: 'wrap'
                        }}>
                          <div>
                            <p className="section-eyebrow" style={{ marginBottom: '0.45rem' }}>
                              {task.channel}
                            </p>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem', color: 'var(--primary-dark)' }}>
                              {task.target_name || task.market}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              {task.market} -> {task.ref_code || 'No ref'}
                            </p>
                            {task.target_url && (
                              <p style={{ marginBottom: '0.35rem' }}>
                                <a href={task.target_url} target="_blank" rel="noreferrer">{task.target_url}</a>
                              </p>
                            )}
                            <p style={{ margin: 0 }}>
                              <a href={task.destination_url} target="_blank" rel="noreferrer">{task.destination_url}</a>
                            </p>
                          </div>

                          <div style={{
                            minWidth: 280,
                            display: 'grid',
                            gap: 'var(--space-3)'
                          }}>
                            <select
                              className="form-control"
                              value={edit.status}
                              onChange={(event) => setTaskEdits((current) => ({
                                ...current,
                                [task.id]: { ...edit, status: event.target.value }
                              }))}
                            >
                              {DISTRIBUTION_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              className="form-control"
                              value={edit.owner}
                              onChange={(event) => setTaskEdits((current) => ({
                                ...current,
                                [task.id]: { ...edit, owner: event.target.value }
                              }))}
                              placeholder="Owner"
                            />

                            <input
                              type="datetime-local"
                              className="form-control"
                              value={edit.nextActionAt}
                              onChange={(event) => setTaskEdits((current) => ({
                                ...current,
                                [task.id]: { ...edit, nextActionAt: event.target.value }
                              }))}
                            />
                          </div>
                        </div>

                        <textarea
                          className="form-control"
                          rows="3"
                          value={edit.notes}
                          onChange={(event) => setTaskEdits((current) => ({
                            ...current,
                            [task.id]: { ...edit, notes: event.target.value }
                          }))}
                          placeholder="Notes, script used, outcome, next follow-up..."
                          style={{ marginTop: 'var(--space-4)' }}
                        />

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          flexWrap: 'wrap',
                          marginTop: 'var(--space-4)'
                        }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Updated {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'recently'}
                          </span>
                          <button type="button" className="btn btn-outline" onClick={() => saveTask(task.id)}>
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DistributionOpsDashboard

