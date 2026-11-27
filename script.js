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
  const pageSize = 9;
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

function initializeBiographyCatalog(catalog) {
  const searchInput = catalog.querySelector('[data-biography-search]');
  const cardList = catalog.querySelector('[data-biography-list]');
  const emptyState = catalog.querySelector('[data-biography-empty]');
  const pagination = catalog.querySelector('[data-biography-pagination]');
  const previousButton = catalog.querySelector('[data-biography-prev]');
  const nextButton = catalog.querySelector('[data-biography-next]');
  const pageNumbers = catalog.querySelector('[data-biography-pages]');

  if (!searchInput || !cardList || !emptyState || !pagination ||
      !previousButton || !nextButton || !pageNumbers) {
    console.error('A estrutura da busca e da paginação de biografias está incompleta.');
    return;
  }

  const cards = Array.from(cardList.querySelectorAll('[data-biography-card]'));
  const pageSize = 4;
  let currentPage = 1;
  let filteredCards = cards.slice();

  function normalizeText(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function renderCatalog() {
    const pageCount = Math.max(1, Math.ceil(filteredCards.length / pageSize));
    if (currentPage > pageCount) currentPage = pageCount;

    cards.forEach(function(card) {
      card.hidden = true;
    });

    const firstCardIndex = (currentPage - 1) * pageSize;
    filteredCards.forEach(function(card, index) {
      card.hidden = index < firstCardIndex || index >= firstCardIndex + pageSize;
    });

    emptyState.hidden = filteredCards.length !== 0;
    pagination.hidden = filteredCards.length <= pageSize;
    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === pageCount;
    pageNumbers.replaceChildren();

    for (let page = 1; page <= pageCount && filteredCards.length > 0; page++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(page);
      button.setAttribute('aria-label', 'Página ' + page);
      if (page === currentPage) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', function() {
        currentPage = page;
        renderCatalog();
      });
      pageNumbers.appendChild(button);
    }
  }

  searchInput.addEventListener('input', function() {
    const keyword = normalizeText(searchInput.value);
    filteredCards = cards.filter(function(card) {
      const searchableText = normalizeText(
        card.textContent + ' ' + (card.dataset.keywords || '')
      );
      return !keyword || searchableText.includes(keyword);
    });
    currentPage = 1;
    renderCatalog();
  });

  previousButton.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderCatalog();
    }
  });
  nextButton.addEventListener('click', function() {
    const pageCount = Math.ceil(filteredCards.length / pageSize);
    if (currentPage < pageCount) {
      currentPage++;
      renderCatalog();
    }
  });

  renderCatalog();
}

function initializePlaceFilters(catalog) {
  const filterButtons = Array.from(catalog.querySelectorAll('[data-place-filter]'));
  const placeList = catalog.querySelector('[data-place-list]');
  const emptyState = catalog.querySelector('[data-place-empty]');
  const categoryDescription = catalog.querySelector('[data-place-category-description]');
  const searchInput = catalog.querySelector('[data-place-search]');

  if (!placeList || !emptyState || !searchInput || filterButtons.length === 0) {
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

  function normalizeText(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function renderPlaces() {
    let visibleCount = 0;
    const keyword = normalizeText(searchInput.value);
    if (categoryDescription) {
      categoryDescription.hidden = activeCategory !== 'residential-territories' && activeCategory !== 'interactional-territories';
    }
    cards.forEach(function(card) {
      const matchesCategory = activeCategory === 'all' || card.dataset.placeCategory === activeCategory;
      const searchableText = normalizeText(card.textContent);
      const matchesKeyword = !keyword || searchableText.includes(keyword);
      const isVisible = matchesCategory && matchesKeyword;
      card.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });

    if (cards.length === 0) {
      emptyState.textContent = 'Os locais serão adicionados aqui.';
      emptyState.hidden = false;
    } else if (visibleCount === 0) {
      emptyState.textContent = keyword
        ? 'Nenhum local encontrado para esta pesquisa.'
        : 'Nenhum local encontrado nesta categoria.';
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

  searchInput.addEventListener('input', renderPlaces);

  renderPlaces();
}

function initializeDatabaseCatalog(catalog) {
  const sections = Array.from(catalog.querySelectorAll('[data-database-section]'));
  const keywordInput = catalog.querySelector('[data-database-search]');
  const themeFilter = catalog.querySelector('[data-database-filter="tema"]');
  const municipalityFilter = catalog.querySelector('[data-database-filter="municipio"]');
  const typeFilter = catalog.querySelector('[data-database-filter="tipo"]');
  const resetButton = catalog.querySelector('[data-database-reset]');
  const resultCount = catalog.querySelector('[data-database-count]');
  const alphabet = catalog.querySelector('[data-database-alphabet]');
  const lightbox = catalog.querySelector('[data-database-lightbox]');

  if (!sections.length || !keywordInput || !themeFilter || !municipalityFilter ||
      !typeFilter || !resetButton || !resultCount || !alphabet || !lightbox) {
    console.error('A estrutura do catálogo do banco de dados está incompleta.');
    return;
  }

  const validAccessValues = ['aberto', 'acervo físico', 'sob consulta'];
  const sectionFiles = {
    publicacoes: 'publicacoes',
    acervos: 'acervos',
    audiovisual: 'audiovisual',
    noticias: 'noticias',
    documentos: 'documentos-oficiais',
    glossario: 'glossario',
    iconografias: 'iconografias'
  };
  const sectionLabels = {
    publicacoes: 'Publicações',
    acervos: 'Acervos e arquivos',
    audiovisual: 'Audiovisual',
    noticias: 'Publicações e reportagens',
    documentos: 'Documentos oficiais',
    glossario: 'Glossário',
    iconografias: 'Iconografias'
  };
  const metadataFields = {
    publicacoes: [['Autor', 'autor'], ['Ano', 'ano'], ['Veículo', 'veiculo']],
    acervos: [['Instituição', 'instituicao'], ['Endereço', 'endereco'], ['O que guarda', 'o_que_guarda'], ['Como acessar', 'como_acessar']],
    audiovisual: [['Formato', 'formato'], ['Duração', 'duracao'], ['Ano', 'ano']],
    noticias: [['Veículo', 'veiculo'], ['Data', 'data']],
    documentos: [['Órgão', 'orgao'], ['Número', 'numero'], ['Data', 'data'], ['Assunto', 'assunto']],
    glossario: [['Fonte', 'fonte']],
    iconografias: [['Período', 'data_ou_periodo'], ['Local', 'local']]
  };
  const themeLabels = {
    'clubes-e-sociedades': 'Clubes e sociedades',
    religiosidade: 'Religiosidade',
    'imigracao-africana': 'Imigração africana',
    'quilombos-e-territorios': 'Quilombos e territórios',
    'escravidao-e-pos-abolicao': 'Escravidão e pós-abolição',
    'movimento-negro': 'Movimento negro',
    'festas-e-cultura': 'Festas e cultura',
    patrimonio: 'Patrimônio'
  };
  let glossaryLetter = '';

  function normalizeText(value) {
    return String(value || '')
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function appendMetadata(card, sectionName, record) {
    const fields = metadataFields[sectionName].filter(function(field) {
      return typeof record[field[1]] === 'string' && record[field[1]].trim();
    });
    if (!fields.length) return;

    const list = document.createElement('dl');
    list.className = 'database-record-metadata';
    fields.forEach(function(field) {
      const wrapper = document.createElement('div');
      wrapper.appendChild(createTextElement('dt', '', field[0]));
      wrapper.appendChild(createTextElement('dd', '', record[field[1]]));
      list.appendChild(wrapper);
    });
    card.appendChild(list);
  }

  function hasConfirmedPermission(record) {
    return [record.credito, record.licenca_ou_autorizacao].every(function(value) {
      return typeof value === 'string' && value.trim() &&
        !value.includes('[A CONFIRMAR]');
    });
  }

  function canShowIconographyImage(record) {
    if (!record.imagem || !record.alt_text || !hasConfirmedPermission(record)) return false;
    try {
      const imageUrl = new URL(record.imagem, window.location.href);
      return imageUrl.origin === window.location.origin &&
        (imageUrl.protocol === 'http:' || imageUrl.protocol === 'https:');
    } catch (error) {
      return false;
    }
  }

  function appendIconographyVisual(container, record, useImage) {
    if (useImage && canShowIconographyImage(record)) {
      const image = document.createElement('img');
      image.src = new URL(record.imagem, window.location.href).href;
      image.alt = record.alt_text;
      image.loading = 'lazy';
      container.appendChild(image);
      return;
    }

    container.appendChild(createTextElement('span', 'database-image-placeholder', 'Imagem a adicionar'));
  }

  function openLightbox(record) {
    const visual = lightbox.querySelector('[data-lightbox-visual]');
    visual.replaceChildren();
    appendIconographyVisual(visual, record, true);
    lightbox.querySelector('[data-lightbox-title]').textContent = record.titulo;
    lightbox.querySelector('[data-lightbox-description]').textContent = record.descricao_visual;
    lightbox.querySelector('[data-lightbox-credit]').textContent = record.credito || 'A confirmar';
    lightbox.querySelector('[data-lightbox-license]').textContent = record.licenca_ou_autorizacao || 'A confirmar';
    lightbox.showModal();
  }

  function createCard(sectionName, record) {
    const card = document.createElement('article');
    card.className = 'database-record';
    card.dataset.recordId = record.id;
    card.dataset.type = record.tipo;
    card.dataset.municipality = record.municipio;
    card.dataset.themes = record.tema.join('|');

    const typeLabel = createTextElement('p', 'database-record-type', record.tipo);
    card.appendChild(typeLabel);
    if (!record.verificado) {
      card.appendChild(createTextElement('span', 'database-verification-badge', 'Em verificação'));
    }
    card.appendChild(createTextElement('h3', 'database-record-title', record.titulo));
    card.appendChild(createTextElement('p', 'database-record-description', record.resumo));

    if (sectionName === 'iconografias') {
      const visual = document.createElement('div');
      visual.className = 'database-card-visual';
      appendIconographyVisual(visual, record, true);
      card.appendChild(visual);
      card.appendChild(createTextElement('p', 'database-record-alt', 'Descrição da imagem: ' + record.alt_text));
    }

    const themes = document.createElement('ul');
    themes.className = 'database-theme-tags';
    record.tema.forEach(function(theme) {
      themes.appendChild(createTextElement('li', '', themeLabels[theme] || theme));
    });
    card.appendChild(themes);
    appendMetadata(card, sectionName, record);

    if (sectionName === 'acervos') {
      card.appendChild(createTextElement('p', 'database-record-access-detail', record.como_acessar || 'Condições de acesso a confirmar.'));
    }
    if (sectionName === 'iconografias') {
      const lightboxButton = createTextElement('button', 'database-lightbox-trigger', 'Ampliar e ver créditos');
      lightboxButton.type = 'button';
      lightboxButton.addEventListener('click', function() {
        openLightbox(record);
      });
      card.appendChild(lightboxButton);
    }

    const access = document.createElement('div');
    access.className = 'database-record-access';
    access.appendChild(createTextElement('p', 'database-access-label', 'Acesso: ' + record.acesso));
    if (record.link && /^https?:\/\//i.test(record.link)) {
      const sourceLink = createTextElement('a', 'database-record-link', 'Acessar fonte');
      sourceLink.href = record.link;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      access.appendChild(sourceLink);
    } else {
      access.appendChild(createTextElement('span', 'database-source-unavailable', 'Fonte digital não informada'));
    }
    card.appendChild(access);
    card.dataset.searchText = normalizeText(JSON.stringify(record));
    return card;
  }

  function validateRecords(sectionName, records) {
    if (!Array.isArray(records)) throw new Error('O arquivo da seção deve conter uma lista de itens.');
    const seenIds = new Set();
    records.forEach(function(record) {
      const hasCommonFields = record && typeof record.id === 'string' &&
        typeof record.titulo === 'string' && typeof record.tipo === 'string' &&
        Array.isArray(record.tema) && typeof record.municipio === 'string' &&
        typeof record.resumo === 'string' && typeof record.link === 'string' &&
        validAccessValues.includes(record.acesso) && typeof record.verificado === 'boolean';
      if (!hasCommonFields || seenIds.has(record.id)) {
        throw new Error('Item com campos comuns inválidos ou id repetido na seção ' + sectionLabels[sectionName] + '.');
      }
      if (sectionName === 'iconografias' &&
          ['alt_text', 'credito', 'licenca_ou_autorizacao'].some(function(field) {
            return typeof record[field] !== 'string';
          })) {
        throw new Error('Iconografias precisam informar alt_text, credito e licenca_ou_autorizacao.');
      }
      seenIds.add(record.id);
    });
    return records;
  }

  function populateSelect(select, values) {
    Array.from(new Set(values.filter(Boolean))).sort(function(left, right) {
      return left.localeCompare(right, 'pt-BR');
    }).forEach(function(value) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function populateAlphabet(glossaryRecords) {
    const allButton = createTextElement('button', 'database-letter-button', 'Todos');
    allButton.type = 'button';
    allButton.dataset.letter = '';
    allButton.setAttribute('aria-pressed', 'true');
    alphabet.appendChild(allButton);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const availableLetters = new Set(glossaryRecords.map(function(record) {
      return normalizeText(record.titulo).charAt(0).toUpperCase();
    }));

    letters.forEach(function(letter) {
      const button = createTextElement('button', 'database-letter-button', letter);
      button.type = 'button';
      button.dataset.letter = letter;
      button.disabled = !availableLetters.has(letter);
      button.setAttribute('aria-pressed', 'false');
      alphabet.appendChild(button);
    });

    alphabet.addEventListener('click', function(event) {
      const button = event.target.closest('[data-letter]');
      if (!button || button.disabled) return;
      glossaryLetter = button.dataset.letter;
      alphabet.querySelectorAll('[data-letter]').forEach(function(letterButton) {
        letterButton.setAttribute('aria-pressed', String(letterButton === button));
      });
      renderRecords();
    });
  }

  function renderRecords() {
    const keyword = normalizeText(keywordInput.value.trim());
    const selectedTheme = themeFilter.value;
    const selectedMunicipality = municipalityFilter.value;
    const selectedType = typeFilter.value;
    let totalVisible = 0;

    sections.forEach(function(section) {
      const sectionRecords = Array.from(section.querySelectorAll('.database-record'));
      let sectionVisible = 0;
      sectionRecords.forEach(function(card) {
        const isGlossary = section.dataset.databaseSection === 'glossario';
        const matchesKeyword = !keyword || card.dataset.searchText.includes(keyword);
        const matchesTheme = !selectedTheme || card.dataset.themes.split('|').includes(selectedTheme);
        const matchesMunicipality = !selectedMunicipality || card.dataset.municipality === selectedMunicipality;
        const matchesType = !selectedType || card.dataset.type === selectedType;
        const matchesLetter = !isGlossary || !glossaryLetter ||
          normalizeText(card.querySelector('.database-record-title').textContent).charAt(0).toUpperCase() === glossaryLetter;
        const isVisible = matchesKeyword && matchesTheme && matchesMunicipality && matchesType && matchesLetter;
        card.hidden = !isVisible;
        if (isVisible) {
          sectionVisible++;
          totalVisible++;
        }
      });

      const emptyState = section.querySelector('[data-database-empty]');
      const sectionCount = section.querySelector('[data-section-count]');
      if (sectionCount) {
        sectionCount.textContent = sectionVisible + (sectionVisible === 1 ? ' item' : ' itens');
      }
      if (emptyState && section.dataset.loadError !== 'true') {
        emptyState.hidden = sectionVisible !== 0;
      }
    });

    resultCount.textContent = totalVisible + (totalVisible === 1 ? ' resultado' : ' resultados');
  }

  function loadSection(section) {
    const sectionName = section.dataset.databaseSection;
    const fileName = sectionFiles[sectionName];
    const list = section.querySelector('[data-database-list]');
    if (!fileName || !list) {
      return Promise.reject(new Error('Seção sem configuração de dados: ' + sectionName));
    }
    return fetch('dados-banco/' + fileName + '.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Resposta HTTP ' + response.status);
        return response.json();
      })
      .then(function(records) {
        const validRecords = validateRecords(sectionName, records);
        if (sectionName === 'glossario') {
          validRecords.sort(function(left, right) {
            return left.titulo.localeCompare(right.titulo, 'pt-BR', { sensitivity: 'base' });
          });
        }
        validRecords.forEach(function(record) {
          const card = createCard(sectionName, record);
          list.appendChild(card);
        });
        return validRecords;
      })
      .catch(function(error) {
        console.error('Não foi possível carregar a seção "' + sectionLabels[sectionName] + '".', error);
        section.dataset.loadError = 'true';
        const emptyState = section.querySelector('[data-database-empty]');
        if (emptyState) {
          emptyState.textContent = 'Não foi possível carregar esta seção. Tente novamente mais tarde.';
          emptyState.hidden = false;
        }
        return [];
      });
  }

  const closeButton = lightbox.querySelector('[data-lightbox-close]');
  if (closeButton) closeButton.addEventListener('click', function() {
    lightbox.close();
  });
  lightbox.addEventListener('click', function(event) {
    if (event.target === lightbox) lightbox.close();
  });

  Promise.all(sections.map(loadSection)).then(function(loadedRecords) {
    const allRecords = loadedRecords.reduce(function(records, sectionRecords) {
      return records.concat(sectionRecords);
    }, []);
    populateSelect(municipalityFilter, allRecords.map(function(record) {
      return record.municipio;
    }));
    populateSelect(typeFilter, allRecords.map(function(record) {
      return record.tipo;
    }));
    populateAlphabet(loadedRecords[sections.findIndex(function(section) {
      return section.dataset.databaseSection === 'glossario';
    })] || []);
    renderRecords();
  });

  [keywordInput, themeFilter, municipalityFilter, typeFilter].forEach(function(filter) {
    filter.addEventListener('input', renderRecords);
    filter.addEventListener('change', renderRecords);
  });
  resetButton.addEventListener('click', function() {
    keywordInput.value = '';
    themeFilter.value = '';
    municipalityFilter.value = '';
    typeFilter.value = '';
    glossaryLetter = '';
    renderRecords();
    const allButton = alphabet.querySelector('[data-letter=""]');
    if (allButton) {
      alphabet.querySelectorAll('[data-letter]').forEach(function(button) {
        button.setAttribute('aria-pressed', String(button === allButton));
      });
    }
  });
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
    events: 'Festas e celebrações',
    culinary: 'Culinária e saberes alimentares',
    'music-dance': 'Música e dança',
    arts: 'Artes e expressões culturais',
    'religiosity-traditions': 'Religiosidade e fé',
    'memory-knowledge': 'Memória e resistência',
    'african-contemporary-presence': 'Presença africana contemporânea'
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

  const biographiesCatalog = document.querySelector('[data-biography-catalog]');
  if (biographiesCatalog) initializeBiographyCatalog(biographiesCatalog);

  const placesCatalog = document.querySelector('[data-place-catalog]');
  if (placesCatalog) initializePlaceFilters(placesCatalog);

  const databaseCatalog = document.querySelector('[data-database-catalog]');
  if (databaseCatalog) initializeDatabaseCatalog(databaseCatalog);

  const cultureCatalog = document.querySelector('[data-culture-catalog]');
  if (cultureCatalog) initializeCultureCatalog(cultureCatalog);

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) initializeContactForm(contactForm);
});
