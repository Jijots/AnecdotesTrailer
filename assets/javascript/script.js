// Typewriter + sync script for the Becoming title and book reveal
document.addEventListener('DOMContentLoaded', function () {
  const headerH1 = document.querySelector('header h1');
  if (!headerH1) return;

  const text = headerH1.textContent.trim();
  // build character spans
  headerH1.textContent = '';
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement('span');
    span.className = 'char alice-regular';
    span.textContent = ch === ' ' ? '\u00A0' : ch; // preserve spaces
    span.style.setProperty('--i', i);
    fragment.appendChild(span);
  }
  headerH1.appendChild(fragment);

  // Timing config (keep in sync with CSS vars)
  const titleDelay = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--title-delay')) || 0.35;
  const charStagger = 0.07; // seconds per char (matches CSS calc)
  const charAnim = 0.42; // char animation duration in seconds
  const holdAfterTyping = 0.45; // seconds to hold before fade-out (reduced for snappier hide)
  const fadeDuration = 0.45; // should match CSS transition for .title-hide (shortened)

  const charCount = text.length;
  const typingTotal = (charCount - 1) * charStagger + charAnim; // seconds

  // Determine when to hide title and reveal book
  const start = titleDelay; // when first char anim starts
  const hideAt = start + typingTotal + holdAfterTyping; // when to start hiding
  const bookDelay = hideAt + fadeDuration * 0.02; // small offset

  // Update CSS variable for book delay so .book animation syncs
  document.documentElement.style.setProperty('--book-delay', bookDelay + 's');

  // Transition the background from dark -> light earlier so the book appears on a lit page.
  // Increase bgLead so the body transitions noticeably before the book animation.
  const bgLead = 0.9; // seconds (start the transition earlier)
  const bgStart = Math.max(bookDelay - bgLead, 0);
  setTimeout(() => {
    document.body.classList.add('light-bg');
  }, bgStart * 1000);

  // After calculated time, add .title-hide
  setTimeout(() => {
    // Add class to header h1 to trigger fade-out
    headerH1.classList.add('title-hide');
  }, hideAt * 1000);

  // (Optional) ensure book reveal class is applied so it will animate
  const book = document.querySelector('.book');
  if (book) {
    // the book already has a CSS animation using --book-delay so no further action needed
  }
  // After the fade-out transition completes, remove the header from flow so it no longer overlays
  const headerEl = document.querySelector('header');
  const fadeMs = Math.round(fadeDuration * 1000) || 450;
  // Prefer listening for transitionend on the h1
  const onTransitionEnd = (e) => {
    if (e.propertyName && e.propertyName.indexOf('opacity') === -1) return;
    // hide header container entirely
    if (headerEl) headerEl.style.display = 'none';
    headerH1.removeEventListener('transitionend', onTransitionEnd);
  };
  headerH1.addEventListener('transitionend', onTransitionEnd);
  // Fallback: if transitionend doesn't fire, force-hide after hideAt + fadeDuration
  setTimeout(() => {
    if (headerEl && getComputedStyle(headerEl).display !== 'none') {
      headerEl.style.display = 'none';
    }
  }, (hideAt + fadeDuration + 0.2) * 1000);

  // Prevent single-word orphans at the end of paragraphs by replacing the last
  // regular space in the paragraph's last text node with a non-breaking space.
  function fixOrphans() {
    const paras = document.querySelectorAll('.book p');
    paras.forEach(p => {
      const textLen = (p.textContent || '').trim().length;
      if (textLen < 20) return; // skip very short paragraphs

      const nodes = Array.from(p.childNodes);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.nodeValue || '';
          const idx = txt.lastIndexOf(' ');
          if (idx > -1) {
            node.nodeValue = txt.slice(0, idx) + '\u00A0' + txt.slice(idx + 1);
            return;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // if the last child is an element (e.g. an <a>), try to find its last text node
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
          let lastText = null;
          while (walker.nextNode()) lastText = walker.currentNode;
          if (lastText) {
            const t = lastText.nodeValue || '';
            const idx2 = t.lastIndexOf(' ');
            if (idx2 > -1) {
              lastText.nodeValue = t.slice(0, idx2) + '\u00A0' + t.slice(idx2 + 1);
              return;
            }
          }
        }
      }
    });
  }

  // Run once after layout (small delay ensures fonts/layout applied)
  setTimeout(fixOrphans, 30);
});
