// Menu lateral compartido. Ahora usa overlay y bloquea el scroll para que se sienta mas estable.
const navEnlaces = document.getElementById('nav-enlaces');
const hamburguesa = document.getElementById('hamburguesa');
const menuOverlay = document.getElementById('menu-overlay');

if (navEnlaces && hamburguesa) {
    const setMenuState = (abierto) => {
        // La clase .abierto muestra u oculta visualmente el panel.
        navEnlaces.classList.toggle('abierto', abierto);
        menuOverlay?.classList.toggle('abierto', abierto);
        document.body.classList.toggle('menu-abierto', abierto);

        // aria-expanded ayuda a accesibilidad y refleja el estado actual del boton.
        hamburguesa.setAttribute('aria-expanded', String(abierto));
    };

    hamburguesa.addEventListener('click', (evento) => {
        evento.stopPropagation();
        setMenuState(!navEnlaces.classList.contains('abierto'));
    });

    // Si el usuario pulsa una opcion del menu, lo cerramos automaticamente.
    navEnlaces.querySelectorAll('a').forEach((enlace) => {
        enlace.addEventListener('click', () => {
            setMenuState(false);
        });
    });

    // Si existe overlay, tambien sirve como superficie clara para cerrar el menu.
    menuOverlay?.addEventListener('click', () => {
        setMenuState(false);
    });

    // Si se pulsa fuera del panel y del boton, cerramos el menu.
    document.addEventListener('click', (evento) => {
        const objetivo = evento.target;

        if (!(objetivo instanceof Node)) {
            return;
        }

        const menuAbierto = navEnlaces.classList.contains('abierto');
        const clickDentroDelMenu = navEnlaces.contains(objetivo);
        const clickEnBoton = hamburguesa.contains(objetivo);
        const clickEnOverlay = menuOverlay ? menuOverlay.contains(objetivo) : false;

        if (menuAbierto && !clickDentroDelMenu && !clickEnBoton && !clickEnOverlay) {
            setMenuState(false);
        }
    });

    // Escape cierra antes el menu lateral si esta abierto.
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && navEnlaces.classList.contains('abierto')) {
            setMenuState(false);
        }
    });
}

// Logica del Index: aplicar fade antes de navegar a la pagina elegida.
const pantallaSeleccion = document.getElementById('pantalla-seleccion');
const introCinematica = document.getElementById('intro-cinematica');
const introSkip = document.getElementById('intro-skip');

// Intro cinematica del Index: se oculta al pulsar el boton o tras un pequeno tiempo.
if (introCinematica && pantallaSeleccion) {
    const cerrarIntro = () => {
        if (introCinematica.classList.contains('oculta')) {
            return;
        }

        introCinematica.classList.add('oculta');
        document.body.classList.add('intro-completada');
    };

    if (introSkip) {
        introSkip.addEventListener('click', cerrarIntro);
    }

    // La intro queda fija hasta que el usuario confirme con teclado.
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') {
            cerrarIntro();
        }
    });
}

if (pantallaSeleccion) {
    const enlacesMundo = pantallaSeleccion.querySelectorAll('a[href]');

    enlacesMundo.forEach((enlace) => {
        enlace.addEventListener('click', (evento) => {
            // Frenamos el comportamiento normal del enlace para mostrar antes la animacion.
            evento.preventDefault();

            const destino = enlace.getAttribute('href');
            pantallaSeleccion.classList.add('fade-out');

            // Esperamos lo mismo que dura la transicion CSS y luego navegamos.
            window.setTimeout(() => {
                window.location.href = destino;
            }, 450);
        });
    });
}

// Parallax reutilizable para heroes que lleven el atributo data-parallax-hero.
const heroesParallax = document.querySelectorAll('[data-parallax-hero="true"]');

if (heroesParallax.length > 0) {
    const actualizarParallax = () => {
        const desplazamiento = window.scrollY * 0.18;
        const desplazamientoPagina = window.scrollY;

        heroesParallax.forEach((hero) => {
            hero.style.setProperty('--hero-parallax', `${desplazamiento}px`);
        });

        // Esta variable mueve elementos decorativos del fondo de Axis en toda la pagina.
        document.documentElement.style.setProperty('--page-parallax', `${desplazamientoPagina}px`);
    };

    actualizarParallax();
    window.addEventListener('scroll', actualizarParallax, { passive: true });
}

// Scroll reveal reutilizable para bloques con la clase .reveal-on-scroll.
const elementosReveal = document.querySelectorAll('.reveal-on-scroll');
const gruposReveal = document.querySelectorAll('[data-reveal-children="true"]');

if (elementosReveal.length > 0) {
    const observerReveal = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.14
    });

    elementosReveal.forEach((elemento) => {
        observerReveal.observe(elemento);
    });
}

// Cuando un grupo horizontal entra en pantalla, revelamos todos sus hijos visibles de una vez.
if (gruposReveal.length > 0) {
    const observerGroups = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const hijos = entry.target.querySelectorAll('.reveal-child');

                hijos.forEach((hijo, index) => {
                    window.setTimeout(() => {
                        hijo.classList.add('revealed');
                    }, index * 90);
                });

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.24
    });

    gruposReveal.forEach((grupo) => {
        observerGroups.observe(grupo);
    });
}

// Carruseles horizontales reutilizables: Axis y Fate comparten la misma mecanica.
const controlesCarrusel = document.querySelectorAll('[data-carrusel-dir]');
const carruseles = document.querySelectorAll('[data-reveal-children="true"]');

if (controlesCarrusel.length > 0) {
    controlesCarrusel.forEach((control) => {
        control.addEventListener('click', () => {
            const direccion = Number(control.dataset.carruselDir);
            const targetId = control.dataset.carruselTarget || 'personajes-carrusel';
            const carrusel = document.getElementById(targetId);

            if (!carrusel) {
                return;
            }

            const desplazamiento = carrusel.clientWidth * 0.75 * direccion;

            carrusel.scrollBy({
                left: desplazamiento,
                behavior: 'smooth'
            });
        });
    });
}

// Mejoramos la sensacion de carrusel con rueda horizontal, arrastre y estados de flechas.
if (carruseles.length > 0) {
    const actualizarEstadoControles = (carrusel) => {
        const carruselId = carrusel.id;

        if (!carruselId) {
            return;
        }

        const controles = document.querySelectorAll(`[data-carrusel-target="${carruselId}"]`);
        const maxScroll = Math.max(0, carrusel.scrollWidth - carrusel.clientWidth);
        const enInicio = carrusel.scrollLeft <= 8;
        const enFinal = carrusel.scrollLeft >= maxScroll - 8;

        controles.forEach((control) => {
            const direccion = Number(control.dataset.carruselDir);
            const desactivar = (direccion < 0 && enInicio) || (direccion > 0 && enFinal);

            control.disabled = desactivar;
            control.setAttribute('aria-disabled', String(desactivar));
            control.style.opacity = desactivar ? '0.45' : '1';
        });
    };

    carruseles.forEach((carrusel) => {
        if (!(carrusel instanceof HTMLElement) || !carrusel.id) {
            return;
        }

        let pulsando = false;
        let inicioX = 0;
        let scrollInicial = 0;

        // La rueda vertical ayuda a recorrer el carrusel sin tener que acertar al scrollbar.
        carrusel.addEventListener('wheel', (evento) => {
            if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) {
                return;
            }

            evento.preventDefault();
            carrusel.scrollBy({
                left: evento.deltaY,
                behavior: 'auto'
            });
        }, { passive: false });

        carrusel.addEventListener('pointerdown', (evento) => {
            const objetivo = evento.target;

            if (objetivo instanceof HTMLElement && objetivo.closest('button, a, input, textarea, select, label')) {
                return;
            }

            pulsando = true;
            inicioX = evento.clientX;
            scrollInicial = carrusel.scrollLeft;
            carrusel.classList.add('arrastrando');
            carrusel.setPointerCapture(evento.pointerId);
        });

        carrusel.addEventListener('pointermove', (evento) => {
            if (!pulsando) {
                return;
            }

            const desplazamiento = evento.clientX - inicioX;
            carrusel.scrollLeft = scrollInicial - desplazamiento;
        });

        const detenerArrastre = (evento) => {
            if (!pulsando) {
                return;
            }

            pulsando = false;
            carrusel.classList.remove('arrastrando');

            if (evento.pointerId !== undefined && carrusel.hasPointerCapture(evento.pointerId)) {
                carrusel.releasePointerCapture(evento.pointerId);
            }
        };

        carrusel.addEventListener('pointerup', detenerArrastre);
        carrusel.addEventListener('pointercancel', detenerArrastre);
        carrusel.addEventListener('pointerleave', () => {
            if (!pulsando) {
                carrusel.classList.remove('arrastrando');
            }
        });

        carrusel.addEventListener('scroll', () => {
            actualizarEstadoControles(carrusel);
        }, { passive: true });

        // Esperamos un tick para leer bien el ancho final del carrusel ya maquetado.
        window.setTimeout(() => {
            actualizarEstadoControles(carrusel);
        }, 0);
    });
}

// Referencias del modal de clases.
const modal = document.getElementById('class-modal');
const modalClose = document.getElementById('modal-close');
const modalName = document.getElementById('modal-class-name');
const modalDescription = document.getElementById('modal-class-description');
const modalStatsList = document.getElementById('modal-stats-list');
const chartCanvas = document.getElementById('class-chart');
const classCards = document.querySelectorAll('.clase-card');

// Ejes del radar chart.
const statLabels = ['STR', 'CON', 'AGI', 'MGI', 'LCK', 'NP'];

// Dibuja un radar chart simple con canvas sin depender de librerias externas.
const dibujarRadar = (canvas, stats) => {
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d');
    if (!context || stats.length === 0) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.34;
    const ringCount = 5;

    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'rgba(19, 38, 62, 0.18)';
    context.lineWidth = 1;

    // Primero pintamos las anillas de referencia del radar.
    for (let ring = 1; ring <= ringCount; ring += 1) {
        const ringRadius = radius * (ring / ringCount);
        context.beginPath();

        statLabels.forEach((_, index) => {
            const angle = (-Math.PI / 2) + ((Math.PI * 2) / statLabels.length) * index;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;

            if (index === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        });

        context.closePath();
        context.stroke();
    }

    // Despues dibujamos los radios y las etiquetas de cada estadistica.
    statLabels.forEach((label, index) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2) / statLabels.length) * index;
        const outerX = centerX + Math.cos(angle) * radius;
        const outerY = centerY + Math.sin(angle) * radius;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(outerX, outerY);
        context.stroke();

        const textX = centerX + Math.cos(angle) * (radius + 30);
        const textY = centerY + Math.sin(angle) * (radius + 30);

        context.fillStyle = '#13263e';
        context.font = '16px Orbitron';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, textX, textY);
    });

    // Por ultimo dibujamos el poligono real de la clase seleccionada.
    context.beginPath();

    stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2) / stats.length) * index;
        const valueRadius = radius * (stat / 100);
        const x = centerX + Math.cos(angle) * valueRadius;
        const y = centerY + Math.sin(angle) * valueRadius;

        if (index === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    });

    context.closePath();
    context.fillStyle = 'rgba(74, 144, 217, 0.28)';
    context.strokeStyle = 'rgba(19, 38, 62, 0.9)';
    context.lineWidth = 3;
    context.fill();
    context.stroke();

    // Marcamos los vertices para que cada punto se lea mejor visualmente.
    stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2) / stats.length) * index;
        const valueRadius = radius * (stat / 100);
        const x = centerX + Math.cos(angle) * valueRadius;
        const y = centerY + Math.sin(angle) * valueRadius;

        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fillStyle = '#13263e';
        context.fill();
    });
};

// Rellena el modal con la informacion guardada en los data-* de la tarjeta.
const abrirModalClase = (tarjeta) => {
    if (!modal || !modalName || !modalDescription || !modalStatsList || !chartCanvas) {
        return;
    }

    const nombre = tarjeta.dataset.className || '';
    const descripcion = tarjeta.dataset.classDescription || '';
    const stats = (tarjeta.dataset.classStats || '')
        .split(',')
        .map((valor) => Number(valor.trim()))
        .filter((valor) => !Number.isNaN(valor));

    modalName.textContent = nombre;
    modalDescription.textContent = descripcion;
    modalStatsList.innerHTML = '';

    statLabels.forEach((label, index) => {
        const item = document.createElement('li');
        const value = stats[index] ?? 0;

        item.innerHTML = `<span class="stats-label">${label}</span><span class="stats-value">${value}</span>`;
        modalStatsList.appendChild(item);
    });

    dibujarRadar(chartCanvas, stats);

    modal.classList.add('abierto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-activa');
};

// Cierra el modal y recupera el scroll normal de la pagina.
const cerrarModalClase = () => {
    if (!modal) {
        return;
    }

    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-activa');
};

// Cada tarjeta de clase abre el modal con su propia informacion.
if (classCards.length > 0) {
    classCards.forEach((tarjeta) => {
        tarjeta.addEventListener('click', () => {
            abrirModalClase(tarjeta);
        });
    });
}

// Boton de cierre del modal.
if (modalClose) {
    modalClose.addEventListener('click', cerrarModalClase);
}

// Si se pulsa el overlay oscuro, tambien cerramos el modal.
if (modal) {
    modal.addEventListener('click', (evento) => {
        const objetivo = evento.target;

        if (objetivo instanceof HTMLElement && objetivo.dataset.closeModal === 'true') {
            cerrarModalClase();
        }
    });
}

// Escape cierra el modal para que la interaccion sea mas comoda.
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        cerrarModalClase();
    }
});

// Mapa interactivo de Axis: cada punto actualiza una ficha lateral con su informacion.
const mapaPuntos = document.querySelectorAll('.mapa-punto');
const mapaTitulo = document.getElementById('mapa-titulo');
const mapaZona = document.getElementById('mapa-zona');
const mapaDescripcion = document.getElementById('mapa-descripcion');
const mapaTags = document.getElementById('mapa-tags');
const mapaEstadoActual = document.getElementById('mapa-estado-actual');
const mapaEstadoBotones = document.querySelectorAll('[data-map-status]');

if (mapaPuntos.length > 0 && mapaTitulo && mapaZona && mapaDescripcion && mapaTags && mapaEstadoActual) {
    const mapaStorageKey = 'axis-map-status';
    let estadoMapaGuardado = {};
    let puntoSeleccionado = mapaPuntos[0];

    try {
        const contenidoGuardado = window.localStorage.getItem(mapaStorageKey);
        estadoMapaGuardado = contenidoGuardado ? JSON.parse(contenidoGuardado) : {};
    } catch (error) {
        estadoMapaGuardado = {};
    }

    const normalizarEstadoMapa = (estado) => {
        const estadosValidos = ['inexplorada', 'visitada', 'completada'];
        return estadosValidos.includes(estado) ? estado : 'inexplorada';
    };

    const obtenerEstadoMapa = (punto) => {
        const puntoId = punto.dataset.mapId || '';
        return normalizarEstadoMapa(estadoMapaGuardado[puntoId] || 'inexplorada');
    };

    const guardarEstadoMapa = (punto, estado) => {
        const puntoId = punto.dataset.mapId || '';

        if (!puntoId) {
            return;
        }

        estadoMapaGuardado[puntoId] = normalizarEstadoMapa(estado);
        window.localStorage.setItem(mapaStorageKey, JSON.stringify(estadoMapaGuardado));
    };

    const aplicarEstadoVisualPunto = (punto) => {
        const estado = obtenerEstadoMapa(punto);

        punto.classList.remove('status-inexplorada', 'status-visitada', 'status-completada');
        punto.classList.add(`status-${estado}`);
    };

    const refrescarControlesEstado = (punto) => {
        const estado = obtenerEstadoMapa(punto);
        const etiquetaEstado = {
            inexplorada: 'Inexplorada',
            visitada: 'Visitada',
            completada: 'Completada'
        };

        mapaEstadoActual.className = `mapa-estado-chip estado-${estado}`;
        mapaEstadoActual.textContent = etiquetaEstado[estado] || 'Inexplorada';

        mapaEstadoBotones.forEach((boton) => {
            const activo = boton.dataset.mapStatus === estado;
            boton.classList.toggle('activo', activo);
            boton.setAttribute('aria-pressed', String(activo));
        });
    };

    const actualizarMapaAxis = (punto) => {
        mapaPuntos.forEach((item) => {
            item.classList.remove('activo');
            item.setAttribute('aria-pressed', 'false');
        });

        punto.classList.add('activo');
        punto.setAttribute('aria-pressed', 'true');

        mapaTitulo.textContent = punto.dataset.mapName || 'Localizacion de Axis';
        mapaZona.textContent = punto.dataset.mapZone || '';
        mapaDescripcion.textContent = punto.dataset.mapDescription || '';

        const etiquetas = (punto.dataset.mapTags || '')
            .split(',')
            .map((valor) => valor.trim())
            .filter(Boolean);

        mapaTags.innerHTML = '';

        etiquetas.forEach((etiqueta) => {
            const tag = document.createElement('span');
            tag.className = 'mapa-tag';
            tag.textContent = etiqueta;
            mapaTags.appendChild(tag);
        });

        refrescarControlesEstado(punto);
    };

    mapaPuntos.forEach((punto) => {
        aplicarEstadoVisualPunto(punto);

        punto.addEventListener('click', () => {
            puntoSeleccionado = punto;
            actualizarMapaAxis(punto);
        });
    });

    mapaEstadoBotones.forEach((boton) => {
        boton.addEventListener('click', () => {
            const nuevoEstado = boton.dataset.mapStatus || 'inexplorada';

            guardarEstadoMapa(puntoSeleccionado, nuevoEstado);
            aplicarEstadoVisualPunto(puntoSeleccionado);
            refrescarControlesEstado(puntoSeleccionado);
        });
    });

    // Dejamos la primera localizacion sincronizada con el estado que ya hubiera guardado el usuario.
    actualizarMapaAxis(puntoSeleccionado);
}

// Consola de facciones de Fate: al pulsar una faccion, actualizamos el dossier inferior.
const factionCards = document.querySelectorAll('.fate-carta[data-faction-name]');
const factionConsoleTitle = document.getElementById('faction-console-title');
const factionConsolePressure = document.getElementById('faction-console-pressure');
const factionConsoleSummary = document.getElementById('faction-console-summary');
const factionConsoleRole = document.getElementById('faction-console-role');
const factionConsoleTerritory = document.getElementById('faction-console-territory');
const factionConsoleTags = document.getElementById('faction-console-tags');
const factionConsoleRelations = document.getElementById('faction-console-relations');
const factionNetworkNodes = document.querySelectorAll('.faction-node[data-network-faction]');
const networkFocusTitle = document.getElementById('network-focus-title');
const networkFocusSummary = document.getElementById('network-focus-summary');
const networkFocusRelations = document.getElementById('network-focus-relations');

if (
    factionCards.length > 0 &&
    factionConsoleTitle &&
    factionConsolePressure &&
    factionConsoleSummary &&
    factionConsoleRole &&
    factionConsoleTerritory &&
    factionConsoleTags &&
    factionConsoleRelations
) {
    const factionConsoleStorageKey = 'fate-active-faction';
    const factionNarrativeMap = {
        'Black Rose': 'Opera desde las sombras y se apoya en dos ejes: lo que compra a Ash Market y las rutas que los Wardens aun pueden sostener. Con Iron Chapel la relacion se parece mas a una pelea aplazada que a una paz real.',
        'Iron Chapel': 'Su autoridad moral le permite contener distritos enteros, pero vive en conflicto con Black Rose y apenas tolera el pragmatismo de Ash Market. Solo con los Wardens mantiene una alianza limpia.',
        'Ash Market': 'Sostiene media ciudad con recursos, informacion y suministros. Eso le da influencia sobre todos, pero tambien lo convierte en objetivo de chantaje, necesidad y rivalidad constante.',
        'Fogbound Wardens': 'No dominan el centro politico, pero sin sus rutas y pasos la red de Fate colapsaria mucho antes. Son el unico nodo que puede cooperar con todos sin dejar de desconfiar de todos.'
    };

    const updateFactionConsole = (card) => {
        factionCards.forEach((item) => {
            item.classList.remove('activa');
            item.setAttribute('aria-pressed', 'false');
        });

        card.classList.add('activa');
        card.setAttribute('aria-pressed', 'true');

        factionConsoleTitle.textContent = card.dataset.factionName || 'Faccion';
        factionConsolePressure.textContent = card.dataset.factionPressure || 'Media';
        factionConsoleSummary.textContent = card.dataset.factionSummary || '';
        factionConsoleRole.textContent = card.dataset.factionRole || '--';
        factionConsoleTerritory.textContent = card.dataset.factionTerritory || '--';

        const tags = (card.dataset.factionTags || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        factionConsoleTags.innerHTML = '';

        tags.forEach((tagText) => {
            const tag = document.createElement('span');
            tag.textContent = tagText;
            factionConsoleTags.appendChild(tag);
        });

        const relations = (card.dataset.factionRelations || '')
            .split('|')
            .map((value) => value.trim())
            .filter(Boolean);

        factionConsoleRelations.innerHTML = '';

        relations.forEach((relationText) => {
            const item = document.createElement('li');
            item.textContent = `${relationText}.`;
            factionConsoleRelations.appendChild(item);
        });

        // La red de facciones se sincroniza con el dossier para que ambas lecturas apunten al mismo foco.
        if (factionNetworkNodes.length > 0 && networkFocusTitle && networkFocusSummary && networkFocusRelations) {
            const activeName = card.dataset.factionName || '';

            factionNetworkNodes.forEach((node) => {
                node.classList.toggle('active', node.dataset.networkFaction === activeName);
                node.setAttribute('aria-pressed', String(node.dataset.networkFaction === activeName));
            });

            networkFocusTitle.textContent = activeName;
            networkFocusSummary.textContent = factionNarrativeMap[activeName] || 'Sin lectura narrativa disponible.';
            networkFocusRelations.innerHTML = '';

            relations.forEach((relationText) => {
                const item = document.createElement('li');
                item.textContent = `${relationText}.`;
                networkFocusRelations.appendChild(item);
            });
        }

        if (card.dataset.factionName) {
            window.localStorage.setItem(factionConsoleStorageKey, card.dataset.factionName);
        }
    };

    factionCards.forEach((card) => {
        card.addEventListener('click', () => {
            updateFactionConsole(card);
        });

        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                updateFactionConsole(card);
            }
        });
    });

    const savedFactionName = window.localStorage.getItem(factionConsoleStorageKey);
    const initialFaction = Array.from(factionCards).find((card) => card.dataset.factionName === savedFactionName) || factionCards[0];

    updateFactionConsole(initialFaction);

    // Los nodos de la red pueden activar la misma faccion que las tarjetas del carrusel.
    factionNetworkNodes.forEach((node) => {
        node.addEventListener('click', () => {
            const targetName = node.dataset.networkFaction || '';
            const linkedCard = Array.from(factionCards).find((card) => card.dataset.factionName === targetName);

            if (linkedCard) {
                updateFactionConsole(linkedCard);

                // Centramos la tarjeta solo dentro del carrusel horizontal, sin mover la pagina hacia arriba.
                const carrusel = linkedCard.parentElement;

                if (carrusel instanceof HTMLElement) {
                    const destino = linkedCard.offsetLeft - ((carrusel.clientWidth - linkedCard.clientWidth) / 2);

                    carrusel.scrollTo({
                        left: Math.max(0, destino),
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Mapa de Fate: actualiza la consola lateral con el distrito seleccionado.
const fateZones = document.querySelectorAll('.fate-zone');
const fateMapTitle = document.getElementById('fate-map-title');
const fateMapDescription = document.getElementById('fate-map-description');
const fateMapState = document.getElementById('fate-map-state');
const fateMapTags = document.getElementById('fate-map-tags');

if (fateZones.length > 0 && fateMapTitle && fateMapDescription && fateMapState && fateMapTags) {
    const updateFateMap = (zone) => {
        fateZones.forEach((item) => item.classList.remove('active'));
        zone.classList.add('active');

        fateMapTitle.textContent = zone.dataset.fateZoneName || 'Distrito de Fate';
        fateMapDescription.textContent = zone.dataset.fateZoneDescription || '';

        const stateLabels = {
            segura: 'Segura',
            inestable: 'Inestable',
            comprometida: 'Comprometida',
            perdida: 'Perdida'
        };

        const zoneState = zone.dataset.fateZoneState || 'inestable';
        fateMapState.textContent = stateLabels[zoneState] || 'Inestable';

        const tags = (zone.dataset.fateZoneTags || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        fateMapTags.innerHTML = '';

        tags.forEach((tagText) => {
            const tag = document.createElement('span');
            tag.textContent = tagText;
            fateMapTags.appendChild(tag);
        });
    };

    fateZones.forEach((zone) => {
        zone.addEventListener('click', () => {
            updateFateMap(zone);
        });
    });

    updateFateMap(fateZones[0]);
}

// Anomalias de Fate: cada amenaza puede marcarse con un nivel guardado en localStorage.
const fateAnomalias = document.querySelectorAll('.anomalia[data-anomalia-id]');

if (fateAnomalias.length > 0) {
    const anomalyStorageKey = 'fate-anomaly-status';
    let savedAnomalies = {};

    try {
        const storedValue = window.localStorage.getItem(anomalyStorageKey);
        savedAnomalies = storedValue ? JSON.parse(storedValue) : {};
    } catch (error) {
        savedAnomalies = {};
    }

    const normalizeAnomalyLevel = (value) => {
        const validLevels = ['leve', 'media', 'critica'];
        return validLevels.includes(value) ? value : 'media';
    };

    const anomalyLabels = {
        leve: 'Leve',
        media: 'Media',
        critica: 'Critica'
    };

    const saveAnomalies = () => {
        window.localStorage.setItem(anomalyStorageKey, JSON.stringify(savedAnomalies));
    };

    const updateAnomalyCard = (card, level) => {
        const normalizedLevel = normalizeAnomalyLevel(level);
        const chip = card.querySelector('[data-anomalia-chip]');
        const buttons = card.querySelectorAll('[data-anomalia-level]');

        card.dataset.anomaliaState = normalizedLevel;

        if (chip) {
            chip.textContent = anomalyLabels[normalizedLevel] || 'Media';
        }

        buttons.forEach((button) => {
            const active = button.dataset.anomaliaLevel === normalizedLevel;
            button.classList.toggle('activo', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };

    fateAnomalias.forEach((card) => {
        const anomalyId = card.dataset.anomaliaId || '';
        const storedLevel = normalizeAnomalyLevel(savedAnomalies[anomalyId] || 'media');

        updateAnomalyCard(card, storedLevel);

        card.querySelectorAll('[data-anomalia-level]').forEach((button) => {
            button.addEventListener('click', () => {
                const nextLevel = normalizeAnomalyLevel(button.dataset.anomaliaLevel || 'media');
                savedAnomalies[anomalyId] = nextLevel;
                updateAnomalyCard(card, nextLevel);
                saveAnomalies();
            });
        });
    });
}
