const REPOSITORY_URL = 'https://github.com/viteval/viteval';
const REPOSITORY_API = 'https://api.github.com/repos/viteval/viteval';
const SELECTOR = `.cp-topbar-cta[href="${REPOSITORY_URL}"]`;

async function showGithubStars() {
  try {
    const response = await fetch(REPOSITORY_API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return;

    const repository = await response.json();
    const count = repository.stargazers_count;
    if (!Number.isSafeInteger(count) || count < 0) return;

    const formatted = new Intl.NumberFormat('en-US').format(count);
    const updateButtons = () => {
      if (document.documentElement.dataset.cpReady !== 'true') return;
      for (const button of document.querySelectorAll(SELECTOR)) {
        if (button.querySelector('.vv-github-count')) continue;
        const badge = document.createElement('span');
        badge.className = 'vv-github-count';
        badge.textContent = formatted;
        badge.setAttribute('aria-hidden', 'true');
        button.append(badge);
        button.setAttribute(
          'aria-label',
          `Star Viteval on GitHub (${formatted} stars)`
        );
      }
    };

    // React can replace the header when navigating; keep the fetched count.
    const observer = new MutationObserver(updateButtons);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-cp-ready'],
    });
    updateButtons();
  } catch {
    // Offline and rate-limited visitors retain the working GitHub link.
  }
}

void showGithubStars();
