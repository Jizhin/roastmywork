chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'roastmywork-selection',
    title: 'Send selection to RoastMyWork',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'roastmywork-selection' || !tab?.id) return

  await chrome.storage.local.set({
    pendingContext: {
      text: info.selectionText || '',
      title: tab.title || '',
      url: tab.url || '',
      capturedAt: new Date().toISOString()
    }
  })

  chrome.action.openPopup().catch(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') })
  })
})
