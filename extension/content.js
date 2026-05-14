(() => {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim()

  const meta = (name) => {
    const byName = document.querySelector(`meta[name="${name}"]`)
    const byProperty = document.querySelector(`meta[property="${name}"]`)
    return clean(byName?.content || byProperty?.content)
  }

  const selectedText = clean(window.getSelection?.().toString())
  const pageText = clean(document.body?.innerText || '').slice(0, 6000)

  return {
    title: clean(document.title),
    url: location.href,
    selectedText,
    description: meta('description') || meta('og:description'),
    text: selectedText || pageText
  }
})()
