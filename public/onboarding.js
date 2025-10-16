export function initOnboarding() {
  if (localStorage.getItem('onboardingCompleted')) {
    return;
  }

  if (
    window.location.pathname !== '/' &&
    window.location.pathname !== '/index.html'
  ) {
    return;
  }

  setTimeout(() => {
    showOnboarding();
  }, 1000);
}

function showOnboarding() {
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

  overlay.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 15px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <h2 style="color: var(--text-primary); font-size: 28px; margin-bottom: 15px;">Welcome to INT Smart Triage AI 2.0! 👋</h2>
            <p style="color: var(--text-secondary); font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Let's take a quick tour to help you get started with managing customer support requests efficiently.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="skipOnboarding()" style="padding: 12px 24px; border: 2px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    Skip Tour
                </button>
                <button onclick="startTour()" style="padding: 12px 24px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    Start Tour
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(overlay);

  window.skipOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    overlay.remove();
  };

  window.startTour = () => {
    overlay.remove();
    showTourStep(1);
  };
}

function showTourStep(step) {
  const steps = [
    {
      title: 'Create Triage Reports',
      description:
        'Fill out this form to log customer issues. The system will analyze tone, priority, and suggest knowledge base articles.',
      element: '.triage-form',
      position: 'bottom',
    },
    {
      title: 'View Client History',
      description:
        'Click here to see all past reports, search by customer, and track resolution status.',
      element: 'a[href="/client-history.html"]',
      position: 'bottom',
    },
    {
      title: 'Browse Knowledge Base',
      description: 'Access support articles and solutions to common issues.',
      element: 'a[href="/kb-search.html"]',
      position: 'bottom',
    },
    {
      title: 'Keyboard Shortcuts',
      description:
        'Use Ctrl+K to search, Ctrl+N for new triage, Ctrl+/ to see all shortcuts.',
      element: 'body',
      position: 'center',
    },
    {
      title: 'Dark Mode',
      description:
        'Toggle dark mode anytime using this button for comfortable viewing.',
      element: '.theme-toggle',
      position: 'left',
    },
  ];

  if (step > steps.length) {
    localStorage.setItem('onboardingCompleted', 'true');
    return;
  }

  const currentStep = steps[step - 1];
  const targetElement = document.querySelector(currentStep.element);

  if (!targetElement && currentStep.element !== 'body') {
    showTourStep(step + 1);
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'tourOverlay';
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
    `;

  let tooltipStyle =
    'position: fixed; background: white; border-radius: 10px; padding: 25px; max-width: 350px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999;';

  if (currentStep.position === 'center') {
    tooltipStyle += ' top: 50%; left: 50%; transform: translate(-50%, -50%);';
  }

  const tooltip = document.createElement('div');
  tooltip.innerHTML = `
        <div style="${tooltipStyle}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 14px; color: #667eea; font-weight: 600;">Step ${step} of ${steps.length}</span>
                <button onclick="document.getElementById('tourOverlay').remove(); localStorage.setItem('onboardingCompleted', 'true');" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <h3 style="color: #2c3e50; font-size: 20px; margin-bottom: 10px;">${currentStep.title}</h3>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${currentStep.description}</p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                ${step < steps.length ? '<button onclick="nextTourStep(' + (step + 1) + ')" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Next</button>' : "<button onclick=\"document.getElementById('tourOverlay').remove(); localStorage.setItem('onboardingCompleted', 'true');\" style=\"padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-weight: 600;\">Finish</button>"}
            </div>
        </div>
    `;

  document.body.appendChild(overlay);
  document.body.appendChild(tooltip);

  if (targetElement && currentStep.element !== 'body') {
    targetElement.style.position = 'relative';
    targetElement.style.zIndex = '9999';
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const rect = targetElement.getBoundingClientRect();
    const tooltipDiv = tooltip.firstElementChild;

    if (currentStep.position === 'bottom') {
      tooltipDiv.style.top = `${rect.bottom + 20}px`;
      tooltipDiv.style.left = `${rect.left + rect.width / 2}px`;
      tooltipDiv.style.transform = 'translateX(-50%)';
    } else if (currentStep.position === 'left') {
      tooltipDiv.style.top = `${rect.top}px`;
      tooltipDiv.style.right = `${window.innerWidth - rect.left + 20}px`;
    }
  }

  window.nextTourStep = (nextStep) => {
    overlay.remove();
    tooltip.remove();
    showTourStep(nextStep);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
      tooltip.remove();
      localStorage.setItem('onboardingCompleted', 'true');
    }
  };
}
