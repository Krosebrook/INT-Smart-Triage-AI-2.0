(function () {
  const normalizePath = (path) => {
    if (!path) return '/';
    const cleaned = path.replace(/index\.html$/i, '').replace(/\/+/g, '/');
    return cleaned === '' ? '/' : cleaned.replace(/\/$/, '') || '/';
  };

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.site-nav');
    const toggle = document.querySelector('[data-nav-toggle]');
    const navList = document.querySelector('[data-nav-list]');
    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('.site-nav__link').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
      if (linkPath === currentPath) {
        link.classList.add('site-nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });

    if (toggle && nav && navList) {
      const toggleMenu = () => {
        const isOpen = nav.classList.toggle('site-nav--open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      };

      toggle.addEventListener('click', toggleMenu);

      navList.addEventListener('click', (event) => {
        if (
          window.matchMedia('(max-width: 768px)').matches &&
          event.target instanceof HTMLElement &&
          event.target.closest('.site-nav__link')
        ) {
          nav.classList.remove('site-nav--open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
})();
