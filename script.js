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

function initializePlaceFilters(catalog) {
  const filterButtons = Array.from(catalog.querySelectorAll('[data-place-filter]'));
  const placeList = catalog.querySelector('[data-place-list]');
  const emptyState = catalog.querySelector('[data-place-empty]');

  if (!placeList || !emptyState || filterButtons.length === 0) {
    console.error('A estrutura do catálogo de lugares está incompleta.');
    return;
  }

  const categories = filterButtons
    .map(function(button) {
      return button.dataset.placeFilter;
    })
    .filter(function(category) {
      return category && category !== 'all';
    });
  const cards = Array.from(placeList.querySelectorAll('[data-place-card]'));
  cards.forEach(function(card) {
    if (!categories.includes(card.dataset.placeCategory)) {
      console.error('Cada lugar precisa de uma categoria válida em data-place-category.');
    }
  });

  let activeCategory = 'all';

  function renderPlaces() {
    let visibleCount = 0;
    cards.forEach(function(card) {
      const isVisible = activeCategory === 'all' || card.dataset.placeCategory === activeCategory;
      card.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });

    if (cards.length === 0) {
      emptyState.textContent = 'Os locais serão adicionados aqui.';
      emptyState.hidden = false;
    } else if (visibleCount === 0) {
      emptyState.textContent = 'Nenhum local encontrado nesta categoria.';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }
  }

  filterButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const category = button.dataset.placeFilter;
      if (!category) {
        console.error('O filtro de lugar não possui uma categoria.');
        return;
      }

      activeCategory = category;
      filterButtons.forEach(function(filterButton) {
        filterButton.setAttribute('aria-pressed', String(filterButton === button));
      });
      renderPlaces();
    });
  });

  renderPlaces();
}

function initializeDatabaseCatalog(catalog) {
  const recordList = catalog.querySelector('[data-database-list]');
  const emptyState = catalog.querySelector('[data-database-empty]');
  const keywordInput = catalog.querySelector('[data-database-search]');
  const filters = {
    type: catalog.querySelector('[data-database-filter="type"]'),
    period: catalog.querySelector('[data-database-filter="period"]'),
    municipality: catalog.querySelector('[data-database-filter="municipality"]'),
    subject: catalog.querySelector('[data-database-filter="subject"]')
  };
  const resetButton = catalog.querySelector('[data-database-reset]');

  if (!recordList || !emptyState || !keywordInput || !filters.type || !filters.period ||
      !filters.municipality || !filters.subject || !resetButton) {
    console.error('A estrutura do catálogo do banco de dados está incompleta.');
    return;
  }

  const records = Array.from(recordList.querySelectorAll('[data-database-record]'));
  const validTypes = Array.from(filters.type.options).map(function(option) {
    return option.value;
  }).filter(Boolean);

  records.forEach(function(record) {
    if (!validTypes.includes(record.dataset.materialType)) {
      console.error('Cada registro precisa de um tipo válido em data-material-type.');
    }
  });

  function normalizeText(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function fieldText(record, selector) {
    const field = record.querySelector(selector);
    return field ? field.textContent : '';
  }

  function renderRecords() {
    const keyword = normalizeText(keywordInput.value);
    let visibleCount = 0;

    records.forEach(function(record) {
      const searchableText = normalizeText(record.textContent + ' ' + record.dataset.materialType);
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const matchesType = !filters.type.value || record.dataset.materialType === filters.type.value;
      const matchesPeriod = normalizeText(fieldText(record, '.database-record-period'))
        .includes(normalizeText(filters.period.value));
      const matchesMunicipality = normalizeText(fieldText(record, '.database-record-municipality'))
        .includes(normalizeText(filters.municipality.value));
      const matchesSubject = normalizeText(fieldText(record, '.database-record-subject'))
        .includes(normalizeText(filters.subject.value));
      const isVisible = matchesKeyword && matchesType && matchesPeriod &&
        matchesMunicipality && matchesSubject;

      record.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });

    if (records.length === 0) {
      emptyState.textContent = 'Os registros serão adicionados aqui.';
      emptyState.hidden = false;
    } else if (visibleCount === 0) {
      emptyState.textContent = 'Nenhum registro corresponde aos filtros atuais.';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }
  }

  keywordInput.addEventListener('input', renderRecords);
  Object.keys(filters).forEach(function(filterName) {
    filters[filterName].addEventListener('input', renderRecords);
    filters[filterName].addEventListener('change', renderRecords);
  });
  resetButton.addEventListener('click', function() {
    keywordInput.value = '';
    Object.keys(filters).forEach(function(filterName) {
      filters[filterName].value = '';
    });
    renderRecords();
  });

  renderRecords();
}

function initializeCultureCatalog(catalog) {
  const categoryButtons = Array.from(catalog.querySelectorAll('button[data-culture-category]'));
  const statusFilter = catalog.querySelector('[data-culture-status-filter]');
  const cardList = catalog.querySelector('[data-culture-list]');
  const emptyState = catalog.querySelector('[data-culture-empty]');

  if (!statusFilter || !cardList || !emptyState || categoryButtons.length === 0) {
    console.error('A estrutura do catálogo de cultura está incompleta.');
    return;
  }

  const categoryLabels = {
    events: 'Eventos e celebrações',
    culinary: 'Culinária e saberes alimentares',
    'music-dance': 'Música e dança',
    arts: 'Artes e expressões culturais',
    'religiosity-traditions': 'Religiosidade e tradições',
    'memory-knowledge': 'Memória e saberes populares'
  };
  const statusLabels = {
    'current-upcoming': 'Eventos atuais e próximos',
    past: 'Evento já realizado',
    permanent: 'Manifestação cultural permanente'
  };
  const validCategories = Object.keys(categoryLabels);
  const validStatuses = Object.keys(statusLabels);
  const cards = Array.from(cardList.querySelectorAll('[data-culture-card]'));

  cards.forEach(function(card) {
    const category = card.dataset.cultureCategory;
    const status = card.dataset.cultureStatus;

    if (!validCategories.includes(category)) {
      console.error('Cada conteúdo precisa de uma categoria válida em data-culture-category.');
    } else {
      const categoryLabel = card.querySelector('[data-culture-card-category]');
      if (categoryLabel) categoryLabel.textContent = categoryLabels[category];
    }

    if (!validStatuses.includes(status)) {
      console.error('Cada conteúdo precisa de uma situação válida em data-culture-status.');
    } else {
      const statusLabel = card.querySelector('[data-culture-card-status]');
      if (statusLabel) statusLabel.textContent = statusLabels[status];
    }

    if ((category === 'events' && status === 'permanent') ||
        (category !== 'events' && validCategories.includes(category) && status !== 'permanent')) {
      console.error('Eventos e manifestações permanentes precisam de situações compatíveis.');
    }
  });

  let activeCategory = 'all';

  function renderCards() {
    let visibleCount = 0;
    cards.forEach(function(card) {
      const matchesCategory = activeCategory === 'all' ||
        card.dataset.cultureCategory === activeCategory;
      const matchesStatus = statusFilter.value === 'all' ||
        card.dataset.cultureStatus === statusFilter.value;
      const isVisible = matchesCategory && matchesStatus;
      card.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });

    if (cards.length === 0) {
      emptyState.textContent = 'Os conteúdos serão adicionados aqui.';
      emptyState.hidden = false;
    } else if (visibleCount === 0) {
      emptyState.textContent = 'Não há conteúdos que correspondam aos filtros selecionados.';
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }
  }

  categoryButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const category = button.dataset.cultureCategory;
      if (category !== 'all' && !validCategories.includes(category)) {
        console.error('O filtro de cultura não possui uma categoria válida.');
        return;
      }

      activeCategory = category;
      categoryButtons.forEach(function(categoryButton) {
        categoryButton.setAttribute('aria-pressed', String(categoryButton === button));
      });
      renderCards();
    });
  });
  statusFilter.addEventListener('change', renderCards);

  renderCards();
}

function initializeContactForm(form) {
  const status = form.querySelector('[data-contact-status]');
  const submitButton = form.querySelector('[data-contact-submit]');
  const attachmentsInput = form.querySelector('[data-contact-attachments]');

  if (!status || !submitButton || !attachmentsInput) {
    console.error('A estrutura do formulário de contato está incompleta.');
    return;
  }

  const maxFileCount = 10;
  const maxFileSize = 25 * 1024 * 1024;
  const maxTotalSize = 100 * 1024 * 1024;

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    if (form.dataset.submitting === 'true' || !form.reportValidity()) return;

    const files = Array.from(attachmentsInput.files);
    if (files.length > maxFileCount) {
      status.dataset.state = 'error';
      status.textContent = 'Selecione no máximo 10 arquivos.';
      attachmentsInput.focus();
      return;
    }

    if (files.some(function(file) {
      return file.size > maxFileSize;
    })) {
      status.dataset.state = 'error';
      status.textContent = 'Cada arquivo pode ter no máximo 25 MB.';
      attachmentsInput.focus();
      return;
    }

    const totalFileSize = files.reduce(function(total, file) {
      return total + file.size;
    }, 0);
    if (totalFileSize > maxTotalSize) {
      status.dataset.state = 'error';
      status.textContent = 'O tamanho total dos arquivos não pode exceder 100 MB.';
      attachmentsInput.focus();
      return;
    }

    form.dataset.submitting = 'true';
    form.setAttribute('aria-busy', 'true');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    status.dataset.state = 'sending';
    status.textContent = 'Enviando sua mensagem...';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: {
        Accept: 'application/json'
      }
    })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('O serviço de envio respondeu com o status ' + response.status + '.');
        }

        form.reset();
        status.dataset.state = 'success';
        status.textContent = 'Mensagem enviada com sucesso.';
      })
      .catch(function(error) {
        console.error('Não foi possível enviar a mensagem pelo formulário.', error);
        status.dataset.state = 'error';
        status.textContent = 'Não foi possível enviar sua mensagem. Tente novamente.';
      })
      .finally(function() {
        form.dataset.submitting = 'false';
        form.removeAttribute('aria-busy');
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar mensagem';
      });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const carousel = document.querySelector('.posts-carousel');
  if (carousel) loadHomeNews(carousel);

  const newsList = document.querySelector('[data-news-list]');
  if (newsList) initializeNewsPagination(newsList);

  const placesCatalog = document.querySelector('[data-place-catalog]');
  if (placesCatalog) initializePlaceFilters(placesCatalog);

  const databaseCatalog = document.querySelector('[data-database-catalog]');
  if (databaseCatalog) initializeDatabaseCatalog(databaseCatalog);

  const cultureCatalog = document.querySelector('[data-culture-catalog]');
  if (cultureCatalog) initializeCultureCatalog(cultureCatalog);

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) initializeContactForm(contactForm);
});
