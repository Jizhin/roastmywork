const DEFAULT_API_BASE = 'http://localhost:8000/api'
const STORE_KEYS = {
  apiBase: 'apiBase',
  access: 'accessToken',
  refresh: 'refreshToken',
  user: 'user',
  pendingContext: 'pendingContext'
}

const $ = (id) => document.getElementById(id)

const els = {
  statusText: $('statusText'),
  settingsButton: $('settingsButton'),
  settingsPanel: $('settingsPanel'),
  apiBase: $('apiBase'),
  saveSettings: $('saveSettings'),
  signedOut: $('signedOut'),
  signedIn: $('signedIn'),
  username: $('username'),
  password: $('password'),
  loginButton: $('loginButton'),
  logoutButton: $('logoutButton'),
  userLine: $('userLine'),
  pageTitle: $('pageTitle'),
  contextText: $('contextText'),
  refreshContext: $('refreshContext'),
  captureButton: $('captureButton'),
  chatButton: $('chatButton'),
  outreachButton: $('outreachButton'),
  resultPanel: $('resultPanel'),
  resultTitle: $('resultTitle'),
  resultContent: $('resultContent'),
  copyResult: $('copyResult')
}

let state = {
  apiBase: DEFAULT_API_BASE,
  accessToken: '',
  refreshToken: '',
  user: null,
  context: null,
  resultText: ''
}

async function storageGet(keys) {
  return chrome.storage.local.get(keys)
}

async function storageSet(values) {
  return chrome.storage.local.set(values)
}

async function storageRemove(keys) {
  return chrome.storage.local.remove(keys)
}

function normalizeApiBase(value) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_API_BASE
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

function endpoint(path) {
  return `${state.apiBase}${path}`
}

function setStatus(message, isError = false) {
  els.statusText.textContent = message
  els.statusText.classList.toggle('error', isError)
}

function setBusy(button, busy, label) {
  button.disabled = busy
  if (label && !button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML
  if (label) button.textContent = label
  if (!busy && button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml
    delete button.dataset.originalHtml
  }
}

function renderAuth() {
  const signedIn = Boolean(state.accessToken && state.user)
  els.signedOut.classList.toggle('hidden', signedIn)
  els.signedIn.classList.toggle('hidden', !signedIn)
  els.userLine.textContent = signedIn
    ? state.user.email || state.user.username || 'RoastMyWork account'
    : ''
}

function renderContext(context) {
  state.context = context
  els.pageTitle.textContent = context?.title || context?.url || 'Page context'
  els.contextText.value = context?.text || context?.selectedText || ''
}

function renderResult(title, content) {
  state.resultText = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  els.resultTitle.textContent = title
  els.resultContent.textContent = state.resultText
  els.resultPanel.classList.remove('hidden')
}

async function apiFetch(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (state.accessToken) headers.set('Authorization', `Bearer ${state.accessToken}`)

  const response = await fetch(endpoint(path), { ...options, headers })
  if (response.status === 401 && retry && state.refreshToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return apiFetch(path, options, false)
  }

  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { detail: text }
  }

  if (!response.ok) {
    const message = data?.detail || `Request failed with ${response.status}`
    throw new Error(message)
  }

  return data
}

async function refreshAccessToken() {
  try {
    const data = await fetch(endpoint('/auth/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: state.refreshToken })
    }).then((res) => {
      if (!res.ok) throw new Error('Refresh failed')
      return res.json()
    })
    state.accessToken = data.access
    if (data.refresh) state.refreshToken = data.refresh
    await storageSet({
      [STORE_KEYS.access]: state.accessToken,
      [STORE_KEYS.refresh]: state.refreshToken
    })
    return true
  } catch {
    await logout()
    return false
  }
}

async function login() {
  const username = els.username.value.trim()
  const password = els.password.value
  if (!username || !password) {
    setStatus('Enter username and password.', true)
    return
  }

  setBusy(els.loginButton, true, 'Signing in...')
  try {
    const token = await fetch(endpoint('/auth/token/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Sign in failed.')
      return data
    })
    state.accessToken = token.access
    state.refreshToken = token.refresh
    state.user = await apiFetch('/users/me/')
    await storageSet({
      [STORE_KEYS.access]: state.accessToken,
      [STORE_KEYS.refresh]: state.refreshToken,
      [STORE_KEYS.user]: state.user
    })
    els.password.value = ''
    setStatus('Signed in.')
    renderAuth()
  } catch (error) {
    setStatus(error.message, true)
  } finally {
    setBusy(els.loginButton, false)
  }
}

async function logout() {
  state.accessToken = ''
  state.refreshToken = ''
  state.user = null
  await storageRemove([STORE_KEYS.access, STORE_KEYS.refresh, STORE_KEYS.user])
  renderAuth()
  setStatus('Signed out.')
}

async function capturePage() {
  setBusy(els.captureButton, true, 'Capturing...')
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab found.')

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    })
    const context = results?.[0]?.result
    if (!context?.text) throw new Error('No readable text found on this page.')
    renderContext(context)
    await storageSet({ [STORE_KEYS.pendingContext]: context })
    setStatus(context.selectedText ? 'Selection captured.' : 'Page captured.')
  } catch (error) {
    setStatus(error.message || 'Could not capture this page.', true)
  } finally {
    setBusy(els.captureButton, false)
  }
}

function getContextPayload() {
  const text = els.contextText.value.trim()
  if (!text) throw new Error('Add or capture some page context first.')
  return {
    title: state.context?.title || '',
    url: state.context?.url || '',
    text
  }
}

async function askAssistant() {
  let payload
  try {
    payload = getContextPayload()
  } catch (error) {
    setStatus(error.message, true)
    return
  }

  setBusy(els.chatButton, true, 'Asking...')
  try {
    const message = [
      'Help me use this page for my job search. Identify the best next action and give concise advice.',
      payload.title ? `Title: ${payload.title}` : '',
      payload.url ? `URL: ${payload.url}` : '',
      `Context:\n${payload.text.slice(0, 3500)}`
    ].filter(Boolean).join('\n\n')

    const data = await apiFetch('/tools/chat/', {
      method: 'POST',
      body: JSON.stringify({ message, history: [] })
    })

    const suggestions = (data.suggestions || []).map((s) => `- ${s.label}`).join('\n')
    renderResult('Assistant', `${data.reply}${suggestions ? `\n\nSuggested tools:\n${suggestions}` : ''}`)
    setStatus('Assistant replied.')
  } catch (error) {
    setStatus(error.message, true)
  } finally {
    setBusy(els.chatButton, false)
  }
}

function formatOutreach(data) {
  const parts = []
  if (data.positioning?.angle) {
    parts.push(`Positioning\n${data.positioning.angle}`)
  }
  if (data.positioning?.proof_points?.length) {
    parts.push(`Proof to mention\n${data.positioning.proof_points.map((item) => `- ${item}`).join('\n')}`)
  }
  if (data.messages?.length) {
    parts.push(data.messages.map((message) => {
      const subject = message.subject ? `Subject: ${message.subject}\n` : ''
      return `${message.label || message.type}\n${subject}${message.body}`
    }).join('\n\n---\n\n'))
  }
  if (data.follow_up_plan?.length) {
    parts.push(`Follow-up plan\n${data.follow_up_plan.map((item) => `- ${item.day}: ${item.action} (${item.channel})`).join('\n')}`)
  }
  return parts.filter(Boolean).join('\n\n')
}

async function buildOutreach() {
  let payload
  try {
    payload = getContextPayload()
  } catch (error) {
    setStatus(error.message, true)
    return
  }
  if (!state.accessToken) {
    setStatus('Sign in to use outreach generation.', true)
    return
  }

  setBusy(els.outreachButton, true, 'Building...')
  try {
    const data = await apiFetch('/tools/outreach-workspace/generate/', {
      method: 'POST',
      body: JSON.stringify({
        raw_context: [
          payload.title ? `Page title: ${payload.title}` : '',
          payload.url ? `URL: ${payload.url}` : '',
          payload.text
        ].filter(Boolean).join('\n\n'),
        contact_channel: 'Both'
      })
    })
    renderResult('Outreach kit', formatOutreach(data) || JSON.stringify(data, null, 2))
    setStatus('Outreach kit ready.')
  } catch (error) {
    setStatus(error.message, true)
  } finally {
    setBusy(els.outreachButton, false)
  }
}

async function copyResult() {
  if (!state.resultText) return
  await navigator.clipboard.writeText(state.resultText)
  setStatus('Copied result.')
}

async function saveSettings() {
  state.apiBase = normalizeApiBase(els.apiBase.value)
  els.apiBase.value = state.apiBase
  await storageSet({ [STORE_KEYS.apiBase]: state.apiBase })
  setStatus('Settings saved.')
}

async function init() {
  const saved = await storageGet(Object.values(STORE_KEYS))
  state.apiBase = normalizeApiBase(saved[STORE_KEYS.apiBase])
  state.accessToken = saved[STORE_KEYS.access] || ''
  state.refreshToken = saved[STORE_KEYS.refresh] || ''
  state.user = saved[STORE_KEYS.user] || null
  els.apiBase.value = state.apiBase

  if (saved[STORE_KEYS.pendingContext]) {
    renderContext(saved[STORE_KEYS.pendingContext])
  }

  renderAuth()
  setStatus('Ready.')

  if (!saved[STORE_KEYS.pendingContext]) {
    capturePage()
  }
}

els.settingsButton.addEventListener('click', () => els.settingsPanel.classList.toggle('hidden'))
els.saveSettings.addEventListener('click', saveSettings)
els.loginButton.addEventListener('click', login)
els.logoutButton.addEventListener('click', logout)
els.captureButton.addEventListener('click', capturePage)
els.refreshContext.addEventListener('click', capturePage)
els.chatButton.addEventListener('click', askAssistant)
els.outreachButton.addEventListener('click', buildOutreach)
els.copyResult.addEventListener('click', copyResult)
els.password.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') login()
})

init()
