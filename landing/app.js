document.querySelectorAll('.card, .theme-card, .shortcut, .section-head, .window-frame').forEach((el) => {
  el.classList.add('reveal')
})

const revealTargets = () => document.querySelectorAll('.reveal:not(.visible)')

function checkReveals() {
  const viewportBottom = window.innerHeight - 20
  revealTargets().forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.top < viewportBottom && rect.bottom > 0) {
      el.classList.add('visible')
    }
  })
}

let ticking = false

function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      checkReveals()
    })
  }
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)
window.addEventListener('load', checkReveals)
checkReveals()

fetch('/api/count')
  .then((r) => r.json())
  .then((data) => {
    if (data && typeof data.count === 'number') {
      const el = document.getElementById('dl-count')
      el.textContent = `${data.count.toLocaleString()} downloads`
    }
  })
  .catch(() => {})