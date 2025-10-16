export function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          focusSearch();
          break;
        case 'n':
          e.preventDefault();
          window.location.href = '/';
          break;
        case 'h':
          e.preventDefault();
          window.location.href = '/client-history.html';
          break;
        case 'b':
          e.preventDefault();
          window.location.href = '/kb-search.html';
          break;
        case '/':
          e.preventDefault();
          showShortcutsHelp();
          break;
      }
    } else if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function focusSearch() {
  const searchInputs = ['searchQuery', 'searchInput', 'customerName'];
  for (const id of searchInputs) {
    const input = document.getElementById(id);
    if (input) {
      input.focus();
      input.select();
      break;
    }
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.style.display = 'none';
  });
}

function showShortcutsHelp() {
  const modal = document.getElementById('shortcutsModal');
  if (modal) {
    modal.style.display = 'block';
    return;
  }

  const helpModal = document.createElement('div');
  helpModal.id = 'shortcutsModal';
  helpModal.className = 'modal';
  helpModal.style.display = 'block';
  helpModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; margin: 100px auto; padding: 30px; background: var(--card-bg); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--text-primary);">Keyboard Shortcuts</h2>
                <button onclick="document.getElementById('shortcutsModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
            </div>
            <div style="display: grid; gap: 15px; color: var(--text-primary);">
                <div style="display: flex; justify-content: space-between;">
                    <span>Focus Search</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Ctrl+K</kbd>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>New Triage</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Ctrl+N</kbd>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Client History</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Ctrl+H</kbd>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Knowledge Base</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Ctrl+B</kbd>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Close Modals</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Esc</kbd>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Show This Help</span>
                    <kbd style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 12px;">Ctrl+/</kbd>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(helpModal);

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.remove();
    }
  });
}
