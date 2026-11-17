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

function initializeHomeCarousel(carousel) {
  const track = carousel.querySelector('.posts-carousel-track');
  const previousButton = carousel.querySelector('[data-carousel-direction="-1"]');
  const nextButton = carousel.querySelector('[data-carousel-direction="1"]');

  if (!track || !previousButton || !nextButton) {
    console.error('A estrutura do carrossel de notícias está incompleta.');
    return;
  }

  function updateButtons() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previousButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = maxScroll <= 1 || track.scrollLeft >= maxScroll - 1;
  }

  function scrollByCard(direction) {
    const firstCard = track.querySelector('.post-card');
    if (!firstCard) return;

    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: 'smooth'
    });
  }

  previousButton.addEventListener('click', function() {
    scrollByCard(-1);
  });
  nextButton.addEventListener('click', function() {
    scrollByCard(1);
  });
  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
}

function loadHomeNews(carousel) {
  const track = carousel.querySelector('.posts-carousel-track');
  if (!track) {
    console.error('O carrossel de notícias não possui uma lista de notícias.');
    return;
  }

  fetch(track.dataset.newsSource)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Falha ao carregar a fonte de notícias: ' + response.status);
      }

      return response.text();
    })
    .then(function(markup) {
      const sourceDocument = new DOMParser().parseFromString(markup, 'text/html');
      const sourceList = sourceDocument.querySelector('[data-news-list]');

      if (!sourceList) {
        throw new Error('A página de notícias não contém a lista compartilhada.');
      }

      const cards = Array.from(sourceList.children).filter(function(child) {
        return child.classList.contains('post-card');
      });

      if (cards.length === 0) {
        throw new Error('A lista compartilhada de notícias está vazia.');
      }

      cards.slice(0, 10).forEach(function(card) {
        track.appendChild(card.cloneNode(true));
      });
      track.setAttribute('aria-busy', 'false');
      initializeHomeCarousel(carousel);
    })
    .catch(function(error) {
      console.error('Não foi possível carregar as notícias da página inicial.', error);
      track.setAttribute('aria-busy', 'false');
      track.textContent = 'Não foi possível carregar as notícias.';
    });
}

function initializeNewsPagination(newsList) {
  const pagination = document.querySelector('[data-news-pagination]');
  const previousButton = pagination && pagination.querySelector('[data-pagination-prev]');
  const nextButton = pagination && pagination.querySelector('[data-pagination-next]');
  const pageNumbers = pagination && pagination.querySelector('[data-pagination-pages]');
  const cards = Array.from(newsList.children).filter(function(child) {
    return child.classList.contains('post-card');
  });
  const pageSize = 10;
  const pageCount = Math.ceil(cards.length / pageSize);

  if (!pagination || !previousButton || !nextButton || !pageNumbers) {
    console.error('A estrutura da paginação de notícias está incompleta.');
    return;
  }

  pagination.hidden = pageCount <= 1;
  if (pageCount <= 1) return;

  let currentPage = 1;

  function renderPage() {
    const firstCardIndex = (currentPage - 1) * pageSize;
    cards.forEach(function(card, index) {
      card.hidden = index < firstCardIndex || index >= firstCardIndex + pageSize;
    });

    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === pageCount;
    pageNumbers.replaceChildren();

    for (let page = 1; page <= pageCount; page++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'news-pagination-page';
      button.textContent = String(page);
      button.setAttribute('aria-label', 'Página ' + page);

      if (page === currentPage) {
        button.setAttribute('aria-current', 'page');
      }

      button.addEventListener('click', function() {
        currentPage = page;
        renderPage();
      });
      pageNumbers.appendChild(button);
    }
  }

  previousButton.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });
  nextButton.addEventListener('click', function() {
    if (currentPage < pageCount) {
      currentPage++;
      renderPage();
    }
  });

  renderPage();
}

document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.querySelector('.posts-carousel');
  if (carousel) loadHomeNews(carousel);

  const newsList = document.querySelector('[data-news-list]');
  if (newsList) initializeNewsPagination(newsList);
});
