const notificationQueue = [];
let isShowingNotification = false;

export function showNotification(message, type = 'success', duration = 5000) {
  notificationQueue.push({ message, type, duration });
  if (!isShowingNotification) {
    displayNextNotification();
  }
}

function displayNextNotification() {
  if (notificationQueue.length === 0) {
    isShowingNotification = false;
    return;
  }

  isShowingNotification = true;
  const { message, type, duration } = notificationQueue.shift();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: -400px;
        min-width: 300px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        transition: right 0.3s ease;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    `;

  const colors = {
    success: { bg: '#10b981', text: '#ffffff', icon: '✓' },
    error: { bg: '#ef4444', text: '#ffffff', icon: '✕' },
    warning: { bg: '#f59e0b', text: '#ffffff', icon: '⚠' },
    info: { bg: '#3b82f6', text: '#ffffff', icon: 'ℹ' },
  };

  const color = colors[type] || colors.info;
  notification.style.background = color.bg;
  notification.style.color = color.text;

  notification.innerHTML = `
        <span style="font-size: 18px; font-weight: bold;">${color.icon}</span>
        <span style="flex: 1;">${message}</span>
        <span style="font-size: 18px; opacity: 0.7;">&times;</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.right = '20px';
  }, 10);

  const removeNotification = () => {
    notification.style.right = '-400px';
    setTimeout(() => {
      notification.remove();
      displayNextNotification();
    }, 300);
  };

  notification.onclick = removeNotification;

  setTimeout(removeNotification, duration);
}

export function showSuccess(message) {
  showNotification(message, 'success');
}

export function showError(message) {
  showNotification(message, 'error');
}

export function showWarning(message) {
  showNotification(message, 'warning');
}

export function showInfo(message) {
  showNotification(message, 'info');
}
