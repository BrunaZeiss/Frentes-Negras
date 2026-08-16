document.addEventListener('DOMContentLoaded', function() {
  const hamb = document.querySelector('.hamburger');
  const btn = document.querySelector('.hamburger-btn');
  const menu = document.querySelector('.hamburger-menu');

  if (!hamb || !btn || !menu) return;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = hamb.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(!!isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Fecha o menu ao clicar fora
  document.addEventListener('click', function(e) {
    if (!hamb.contains(e.target) && hamb.classList.contains('open')) {
      hamb.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  });
});
