# Documentación Técnica — Landing Page Axis & Fate

---

## 1. Instrucciones de inicio y ejecución

Este proyecto es una landing page estática con integración de Firebase, desplegada públicamente en GitHub Pages. No requiere instalación ni servidor propio para su uso.

**Acceso directo (cualquier dispositivo):**

La web está disponible públicamente en:
**[https://jrodriguezdominguez99.github.io/PaginaWebLenguajeDeMarcas/](https://jrodriguezdominguez99.github.io/PaginaWebLenguajeDeMarcas/)**

Basta con abrir esa URL en cualquier navegador moderno, desde cualquier dispositivo (escritorio, tablet o móvil), sin necesidad de instalar nada.

**Repositorio:**

El código fuente completo está disponible en:
**[https://github.com/JRodriguezDominguez99/PaginaWebLenguajeDeMarcas](https://github.com/JRodriguezDominguez99/PaginaWebLenguajeDeMarcas)**

**Ejecución en local (para desarrollo):**

1. Clonar el repositorio: `git clone https://github.com/JRodriguezDominguez99/PaginaWebLenguajeDeMarcas.git`
2. Abrir la carpeta en **Visual Studio Code**.
3. Instalar la extensión **Live Server** si no está instalada.
4. Clic derecho sobre `index.html` → **"Open with Live Server"**.
5. La web se abrirá en `http://127.0.0.1:5500`.

> **Nota:** en local es necesario usar Live Server y **no** abrir el archivo directamente con doble clic. Los módulos ES (`import/export`) usados en `Cuenta.js` y `ficha.js` requieren un contexto HTTP para funcionar correctamente.

**Estructura de archivos relevante:**

```
/
├── index.html          ← Pantalla de selección de mundo
├── axis.html           ← Página del mundo Axis
├── fate.html           ← Página del mundo Fate
├── ficha.html          ← Sistema de fichas de personaje
├── global.css          ← Estilos compartidos entre todas las páginas
├── index.css           ← Estilos exclusivos del index
├── axis.css            ← Estilos exclusivos de Axis
├── fate.css            ← Estilos exclusivos de Fate
├── ficha.css           ← Estilos de la página de fichas
├── javaScript.js       ← Lógica principal de front-end (compartida)
├── Cuenta.js           ← Módulo de autenticación Firebase (Auth)
├── ficha.js            ← Módulo de fichas con Firestore
├── firebase-config.js  ← Configuración de Firebase (claves del proyecto)
└── img/                ← Iconos, mapas e imágenes del proyecto
```

---

## 2. Funcionalidades implementadas

1. **Mapa interactivo con hotspots y panel lateral** (Axis y Fate)
2. **Modal de clases con radar chart dibujado sobre Canvas**
3. **Sistema de facciones con dossier sincronizado** (Fate)
4. **Scroll reveal con IntersectionObserver y efecto parallax en heroes**
5. **Intro cinematográfica y transición entre páginas**
6. **Sistema de fichas de personaje con Firestore** (Backend)
7. **Red visual de relaciones entre facciones** (Fate)

---

## 3. Funcionalidad 1 — Mapa interactivo con hotspots y panel lateral

### 3.1. Descripción (qué hace)

Tanto la página de Axis como la de Fate incluyen un mapa interactivo. En Axis, el mapa está basado en una imagen real del tablero de la campaña con puntos clicables (`hotspots`) superpuestos. Al pulsar cualquier punto, un panel lateral se actualiza mostrando el nombre del lugar, su zona, una descripción y etiquetas temáticas. Además, el jugador puede cambiar el **estado de exploración** del lugar (`inexplorada`, `visitada`, `completada`), que queda guardado entre sesiones mediante `localStorage`. En Fate, el mapa funciona de forma similar pero con zonas de distrito cuyo estado puede ser `segura`, `inestable`, `comprometida` o `perdida`.

### 3.2. Funcionamiento (cómo lo hace)

Cada hotspot es un `<button>` HTML posicionado de forma absoluta sobre la imagen del mapa. Sus datos (nombre, descripción, etiquetas, etc.) se almacenan en atributos `data-*` directamente en el HTML, sin necesidad de base de datos. Cuando el usuario hace clic en un punto, la función `actualizarMapaAxis()` lee esos atributos y los inyecta en el panel lateral. El estado de exploración de cada punto se guarda en `localStorage` usando el `data-map-id` del hotspot como clave, permitiendo que persista entre visitas.

### 3.3. Fragmentos de código relevantes

**HTML — estructura de un hotspot:**
```html
<button
    class="mapa-punto"
    data-map-id="ciudad-dorada"
    data-map-name="Ciudad Dorada"
    data-map-zone="Núcleo central"
    data-map-description="Capital política de Axis, sede del Consejo Dorado."
    data-map-tags="Política, Ciudad, Aliada"
    aria-pressed="false">
</button>
```
Cada atributo `data-*` actúa como almacén de datos inline. El botón no tiene texto visible porque su representación visual es un marcador CSS posicionado sobre el mapa.

**JS — función principal de actualización del panel (`javaScript.js`, línea 638):**
```javascript
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
```
- `punto.dataset.mapName` accede al atributo `data-map-name` del botón pulsado.
- `.split(',').map(...).filter(Boolean)` convierte la cadena de etiquetas en un array limpio.
- `document.createElement('span')` crea dinámicamente cada etiqueta y la inserta en el DOM.
- `refrescarControlesEstado(punto)` sincroniza los botones de estado con el valor guardado en `localStorage` para ese punto.

**JS — guardado de estado con localStorage (`javaScript.js`, línea 602):**
```javascript
const guardarEstadoMapa = (punto, estado) => {
    const puntoId = punto.dataset.mapId || '';
    estadoMapaGuardado[puntoId] = normalizarEstadoMapa(estado);
    window.localStorage.setItem(mapaStorageKey, JSON.stringify(estadoMapaGuardado));
};
```
`JSON.stringify()` convierte el objeto de estados en una cadena para poder guardarlo en `localStorage`, que solo admite strings. Al cargar la página, se hace el proceso inverso con `JSON.parse()`.

**Archivos relacionados:** `axis.html` (estructura HTML del mapa y hotspots), `fate.html` (mapa de Fate con zonas), `javaScript.js` (toda la lógica del mapa), `axis.css` / `fate.css` (estilos del mapa y el panel lateral).

---

## 4. Funcionalidad 2 — Modal de clases con radar chart sobre Canvas

### 4.1. Descripción (qué hace)

En la página de Axis existe una cuadrícula con todas las clases del sistema Fate (Saber, Archer, Lancer, etc.). Al pulsar sobre cualquiera de ellas se abre un modal con el nombre de la clase, su descripción y un **gráfico radar** que muestra sus estadísticas base (STR, CON, AGI, MGI, LCK, NP) dibujado directamente sobre un elemento `<canvas>`. El modal se puede cerrar con el botón de cierre, pulsando la tecla Escape o haciendo clic fuera del contenido.

### 4.2. Funcionamiento (cómo lo hace)

Las estadísticas y la descripción de cada clase se almacenan en atributos `data-*` en cada botón de la cuadrícula. Al hacer clic, la función `abrirModalClase()` lee esos datos, rellena el texto del modal y llama a `dibujarRadar()`, que genera el gráfico usando la API 2D de Canvas de forma matemática, sin librerías externas. El gráfico radar se construye calculando la posición de cada vértice con trigonometría (`Math.cos` / `Math.sin`), proyectando los valores de cada stat sobre el radio proporcional.

### 4.3. Fragmentos de código relevantes

**HTML — atributos de datos en una tarjeta de clase (`axis.html`):**
```html
<button class="clase-card" type="button"
    data-class-name="Saber"
    data-class-description="Guerreros completos, resistentes y letales en duelo directo."
    data-class-stats="90,80,80,50,70,80">
    <img src="img/Icono-Saber.png" alt="Icono de la clase Saber">
    <h3 class="nombre-personaje">Saber</h3>
</button>
```
Los seis números de `data-class-stats` corresponden en orden a STR, CON, AGI, MGI, LCK y NP, todos en una escala de 0 a 100.

**JS — apertura del modal y lectura de datos (`javaScript.js`, línea 497):**
```javascript
const abrirModalClase = (tarjeta) => {
    const nombre = tarjeta.dataset.className || '';
    const descripcion = tarjeta.dataset.classDescription || '';
    const stats = (tarjeta.dataset.classStats || '')
        .split(',')
        .map((valor) => Number(valor.trim()))
        .filter((valor) => !Number.isNaN(valor));

    modalName.textContent = nombre;
    modalDescription.textContent = descripcion;

    statLabels.forEach((label, index) => {
        const item = document.createElement('li');
        const value = stats[index] ?? 0;
        item.innerHTML = `<span class="stats-label">${label}</span>
                          <span class="stats-value">${value}</span>`;
        modalStatsList.appendChild(item);
    });

    dibujarRadar(chartCanvas, stats);
    modal.classList.add('abierto');
    document.body.classList.add('modal-activa');
};
```
- `.split(',').map(Number)` convierte la cadena `"90,80,80,50,70,80"` en el array `[90, 80, 80, 50, 70, 80]`.
- `stats[index] ?? 0` usa el operador nullish coalescing: si el valor es `undefined` o `null`, usa `0` como fallback.
- `modal.classList.add('abierto')` y `document.body.classList.add('modal-activa')` activan el modal visualmente vía CSS y bloquean el scroll de la página.

**JS — función de dibujado del radar chart (`javaScript.js`, línea 396):**
```javascript
const dibujarRadar = (canvas, stats) => {
    const context = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.34;

    // Anillos de referencia
    for (let ring = 1; ring <= 5; ring++) {
        const ringRadius = radius * (ring / 5);
        context.beginPath();
        statLabels.forEach((_, index) => {
            const angle = (-Math.PI / 2) + ((Math.PI * 2) / statLabels.length) * index;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            index === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
        });
        context.closePath();
        context.stroke();
    }

    // Polígono de stats
    context.beginPath();
    stats.forEach((stat, index) => {
        const angle = (-Math.PI / 2) + ((Math.PI * 2) / stats.length) * index;
        const valueRadius = radius * (stat / 100);
        const x = centerX + Math.cos(angle) * valueRadius;
        const y = centerY + Math.sin(angle) * valueRadius;
        index === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = 'rgba(74, 144, 217, 0.28)';
    context.fill();
    context.stroke();
};
```
- `canvas.getContext('2d')` obtiene el contexto de dibujo 2D nativo del navegador.
- La fórmula `(-Math.PI / 2) + ((Math.PI * 2) / N) * i` distribuye los N ejes del radar de forma equidistante en círculo, comenzando desde arriba (−90°).
- `radius * (stat / 100)` escala el valor de cada stat (0–100) al radio del gráfico, de forma proporcional.
- `context.fill()` y `context.stroke()` pintan el interior y el borde del polígono respectivamente.

**Archivos relacionados:** `axis.html` (cuadrícula de clases y HTML del modal), `javaScript.js` (funciones `abrirModalClase`, `cerrarModalClase`, `dibujarRadar`), `axis.css` (estilos del modal y las tarjetas de clase).

---

## 5. Funcionalidad 3 — Sistema de facciones con red de relaciones sincronizada (Fate)

### 5.1. Descripción (qué hace)

En la página de Fate existe una sección de facciones. Al seleccionar una facción de la lista, un **dossier lateral** se actualiza instantáneamente mostrando su nombre, nivel de presión, descripción narrativa, rol, territorio, etiquetas y relaciones con otras facciones. Simultáneamente, un **diagrama de red visual** resalta el nodo correspondiente a esa facción. La selección activa se persiste en `localStorage` para que al volver a la página se recuerde cuál estaba activa.

### 5.2. Funcionamiento (cómo lo hace)

Cada tarjeta de facción almacena todos sus datos en atributos `data-*`. La función `updateFactionConsole()` lee esos atributos y actualiza el dossier y la red de forma sincronizada. Los nodos del diagrama de red son elementos independientes con su propio `data-network-faction`, que se relacionan con las tarjetas por nombre. Al pulsar un nodo de la red también se puede activar la tarjeta correspondiente en el carrusel, buscándola por nombre con `Array.from(factionCards).find()`.

### 5.3. Fragmentos de código relevantes

**JS — función de actualización del dossier (`javaScript.js`, línea 718):**
```javascript
const updateFactionConsole = (card) => {
    factionCards.forEach((item) => {
        item.classList.remove('activa');
        item.setAttribute('aria-pressed', 'false');
    });

    card.classList.add('activa');
    factionConsoleTitle.textContent = card.dataset.factionName || 'Faccion';
    factionConsolePressure.textContent = card.dataset.factionPressure || 'Media';
    factionConsoleSummary.textContent = card.dataset.factionSummary || '';

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

    if (card.dataset.factionName) {
        window.localStorage.setItem(factionConsoleStorageKey, card.dataset.factionName);
    }
};
```
- Las relaciones usan `|` como separador (en vez de `,`) porque las descripciones pueden contener comas. `split('|')` divide la cadena correctamente.
- `localStorage.setItem()` guarda el nombre de la facción activa para recordarla en la próxima visita.

**JS — sincronización de la red visual con el dossier (`javaScript.js`, línea 764):**
```javascript
factionNetworkNodes.forEach((node) => {
    node.classList.toggle('active', node.dataset.networkFaction === activeName);
    node.setAttribute('aria-pressed', String(node.dataset.networkFaction === activeName));
});

networkFocusTitle.textContent = activeName;
networkFocusSummary.textContent = factionNarrativeMap[activeName] || 'Sin lectura narrativa.';
```
- `classList.toggle('active', condición)` añade o quita la clase `active` según si el nodo corresponde a la facción seleccionada. Es equivalente a un `if/else` pero más conciso.
- `factionNarrativeMap` es un objeto-diccionario que relaciona el nombre de cada facción con su texto narrativo.

**JS — activar tarjeta desde un nodo de la red (`javaScript.js`, línea 808):**
```javascript
factionNetworkNodes.forEach((node) => {
    node.addEventListener('click', () => {
        const targetName = node.dataset.networkFaction || '';
        const linkedCard = Array.from(factionCards).find(
            (card) => card.dataset.factionName === targetName
        );
        if (linkedCard) {
            updateFactionConsole(linkedCard);
        }
    });
});
```
- `Array.from(factionCards)` convierte la NodeList en un array para poder usar `.find()`.
- `.find()` devuelve la primera tarjeta cuyo `data-faction-name` coincide con el nombre del nodo pulsado.

**Archivos relacionados:** `fate.html` (HTML de las tarjetas de facción y los nodos de red), `javaScript.js` (función `updateFactionConsole` y listeners de red), `fate.css` (estilos del dossier y la red visual).

---

## 6. Funcionalidad 4 — Scroll reveal con IntersectionObserver y parallax en heroes

### 6.1. Descripción (qué hace)

A medida que el usuario hace scroll por las páginas de Axis y Fate, los bloques de contenido (secciones, títulos, tarjetas) aparecen con una animación de entrada suave. Además, la imagen de fondo de cada hero se mueve a una velocidad ligeramente menor que el scroll del usuario (efecto parallax), creando sensación de profundidad. Ambos efectos están implementados en todos los archivos HTML del proyecto de forma reutilizable.

### 6.2. Funcionamiento (cómo lo hace)

El scroll reveal usa la API nativa `IntersectionObserver`, que notifica al código JavaScript cuando un elemento entra en el viewport del navegador, sin necesidad de escuchar constantemente el evento `scroll`. Cuando un elemento es observado y entra en pantalla, se le añade la clase `revealed`, que activa una transición CSS de opacidad y desplazamiento. El efecto parallax se implementa escuchando el evento `scroll` y actualizando una variable CSS personalizada (`--hero-parallax`) con el valor del desplazamiento multiplicado por un factor de 0.18, que el CSS aplica como `translateY` al fondo del hero.

### 6.3. Fragmentos de código relevantes

**JS — IntersectionObserver para elementos individuales (`javaScript.js`, línea 132):**
```javascript
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
```
- `IntersectionObserver` recibe un callback que se ejecuta cuando cambia la visibilidad de los elementos observados.
- `entry.isIntersecting` es `true` cuando el elemento es visible en pantalla.
- `observer.unobserve(entry.target)` deja de observar el elemento una vez revelado, para no gastar recursos innecesarios.
- `threshold: 0.14` significa que el callback se activa cuando el 14% del elemento es visible.

**JS — reveal con stagger en grupos horizontales (`javaScript.js`, línea 150):**
```javascript
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
}, { threshold: 0.24 });
```
- `index * 90` introduce un retraso escalonado (stagger) de 90ms entre cada hijo, creando el efecto de que las tarjetas aparecen en cascada una tras otra en lugar de todas a la vez.

**JS — parallax con variable CSS (`javaScript.js`, línea 111):**
```javascript
const actualizarParallax = () => {
    const desplazamiento = window.scrollY * 0.18;
    heroesParallax.forEach((hero) => {
        hero.style.setProperty('--hero-parallax', `${desplazamiento}px`);
    });
};

window.addEventListener('scroll', actualizarParallax, { passive: true });
```
- `window.scrollY` devuelve los píxeles desplazados desde el inicio de la página.
- Multiplicar por `0.18` hace que el fondo se mueva a un 18% de la velocidad del scroll, creando la ilusión de profundidad.
- `{ passive: true }` indica al navegador que este listener nunca llamará a `preventDefault()`, permitiéndole optimizar el rendimiento del scroll.
- `style.setProperty('--hero-parallax', ...)` actualiza la variable CSS en tiempo real, y el CSS la aplica con `transform: translateY(var(--hero-parallax))`.

**CSS — transición de reveal (`axis.css` / `fate.css`):**
```css
.reveal-on-scroll {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.7s ease, transform 0.7s ease;
}

.reveal-on-scroll.revealed {
    opacity: 1;
    transform: translateY(0);
}
```
El elemento parte invisible y desplazado 22px hacia abajo. Al añadir la clase `revealed` por JS, la transición CSS anima suavemente ambas propiedades.

**Archivos relacionados:** `javaScript.js` (observers y listener de parallax), `axis.css`, `fate.css`, `global.css` (estilos de transición de reveal).

---

## 7. Funcionalidad 5 — Intro cinematográfica y transición entre páginas

### 7.1. Descripción (qué hace)

Al entrar en la página principal (`index.html`), el usuario ve una pantalla de introducción minimalista con el título del proyecto animado, un tagline y un botón de entrada. Esta intro permanece hasta que el usuario hace clic en "Entrar" o pulsa Enter. Una vez cerrada, aparece la pantalla de selección de mundos (Axis / Fate) con una animación de entrada. Al elegir un mundo, la pantalla hace un fade-out antes de navegar a la página correspondiente, evitando los cambios de página abruptos.

### 7.2. Funcionamiento (cómo lo hace)

La intro es una capa fija (`position: fixed`) que cubre toda la pantalla con `z-index` alto. Al activar el cierre, se le añade la clase `oculta`, que dispara una transición CSS de `opacity: 0` y `visibility: hidden`. Simultáneamente se añade la clase `intro-completada` al `<body>`, que activa la animación de entrada de la pantalla de selección mediante una transición CSS de opacidad y `translateY`. Para las transiciones entre páginas, se intercepta el clic en los enlaces con `event.preventDefault()`, se añade la clase `fade-out` al contenedor, y tras esperar el tiempo de la animación (450ms) se navega programáticamente con `window.location.href`.

### 7.3. Fragmentos de código relevantes

**JS — cierre de la intro y activación de la selección (`javaScript.js`, línea 67):**
```javascript
const cerrarIntro = () => {
    if (introCinematica.classList.contains('oculta')) return;

    introCinematica.classList.add('oculta');
    document.body.classList.add('intro-completada');
};

introSkip.addEventListener('click', cerrarIntro);

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') cerrarIntro();
});
```
- La comprobación inicial evita que `cerrarIntro` se ejecute dos veces si el usuario pulsa Enter y el botón casi a la vez.
- Añadir `intro-completada` al `body` activa en CSS la aparición de `#pantalla-seleccion` mediante el selector `:has()` o una clase directa, sin necesidad de manipular el DOM de la selección desde JS.

**JS — transición de salida al navegar a otro mundo (`javaScript.js`, línea 88):**
```javascript
enlacesMundo.forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
        evento.preventDefault();
        const destino = enlace.getAttribute('href');
        pantallaSeleccion.classList.add('fade-out');

        window.setTimeout(() => {
            window.location.href = destino;
        }, 450);
    });
});
```
- `evento.preventDefault()` cancela la navegación inmediata del enlace.
- `pantallaSeleccion.classList.add('fade-out')` activa la transición CSS de desaparición.
- `window.setTimeout(..., 450)` espera exactamente los 450ms que dura la animación antes de redirigir, garantizando que el fade termina antes del cambio de página.

**CSS — animación de entrada del título (`index.css`):**
```css
@keyframes introFadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}

.intro-titulo-axis {
    animation: introFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}
.intro-titulo-sep {
    animation: introFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
}
.intro-titulo-fate {
    animation: introFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
}
```
- Cada parte del título tiene un delay diferente (`0.2s`, `0.35s`, `0.5s`), creando un efecto de aparición escalonada.
- `cubic-bezier(0.16, 1, 0.3, 1)` es una curva de aceleración de tipo "ease-out spring": arranca rápido y termina suave.
- `both` hace que la animación aplique el estado inicial antes de empezar y el estado final al terminar.

**CSS — aparición de la pantalla de selección (`index.css`):**
```css
#pantalla-seleccion {
    opacity: 0;
    transform: translateY(14px);
    filter: blur(6px);
    transition: opacity 0.8s, transform 0.8s, filter 0.8s;
}

body.intro-completada #pantalla-seleccion {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
}
```
Cuando JS añade `intro-completada` al `<body>`, el selector CSS lo detecta automáticamente y activa la transición de entrada de la pantalla de selección, sin intervención adicional de JS.

**Archivos relacionados:** `index.html` (estructura de la intro y la selección), `index.css` (todas las animaciones y transiciones de la intro), `javaScript.js` (lógica de cierre de intro y fade de navegación).

---

## 8. Funcionalidad adicional — Anomalías de Fate con nivel de amenaza persistente

### 8.1. Descripción (qué hace)

En la página de Fate, la sección de Anomalías permite al usuario asignar un **nivel de amenaza** a cada anomalía presente en el mundo: `Leve`, `Media` o `Crítica`. Este nivel queda guardado en `localStorage` y se mantiene entre sesiones, de modo que al volver a la página cada anomalía recuerda su estado asignado.

### 8.2. Funcionamiento (cómo lo hace)

Cada tarjeta de anomalía tiene un `data-anomalia-id` único. Al pulsar uno de los botones de nivel, se actualiza el estado visual de la tarjeta (chip de color y botón activo) y se serializa el estado de todas las anomalías en `localStorage` como JSON.

### 8.3. Fragmentos de código relevantes

**JS — actualización y persistencia del nivel (`javaScript.js`, línea 905):**
```javascript
const saveAnomalies = () => {
    window.localStorage.setItem(anomalyStorageKey, JSON.stringify(savedAnomalies));
};

const updateAnomalyCard = (card, level) => {
    const normalizedLevel = normalizeAnomalyLevel(level);
    const chip = card.querySelector('[data-anomalia-chip]');
    const buttons = card.querySelectorAll('[data-anomalia-level]');

    card.dataset.anomaliaState = normalizedLevel;
    if (chip) chip.textContent = anomalyLabels[normalizedLevel];

    buttons.forEach((button) => {
        const active = button.dataset.anomaliaLevel === normalizedLevel;
        button.classList.toggle('activo', active);
        button.setAttribute('aria-pressed', String(active));
    });
};
```
- `normalizeAnomalyLevel()` valida que el nivel esté en el conjunto `['leve', 'media', 'critica']`, rechazando cualquier valor inesperado.
- `card.querySelector('[data-anomalia-chip]')` busca el elemento chip dentro de la tarjeta usando un selector de atributo, sin necesidad de clases adicionales.

**Archivos relacionados:** `fate.html` (HTML de las anomalías), `javaScript.js` (lógica de anomalías, línea 880), `fate.css` (estilos de chips y botones de nivel).

---

## 9. Funcionalidad Backend — Autenticación y fichas con Firebase

### 9.1. Descripción (qué hace)

El proyecto usa Firebase como backend completo. Por un lado, **Firebase Authentication** gestiona el registro de usuarios, el inicio de sesión con email/contraseña y el inicio de sesión con Google, así como el cierre de sesión. El estado de autenticación es persistente: si el usuario cierra y vuelve a abrir el navegador, sigue conectado. Por otro lado, **Firebase Firestore** almacena las fichas de personaje que cada usuario crea desde la página `ficha.html`. Cada ficha queda vinculada al `uid` del usuario, de modo que solo puede verla él. El listado de fichas puede filtrarse por mundo (Axis o Fate).

### 9.2. Funcionamiento (cómo lo hace)

Firebase se inicializa una sola vez por instancia de la aplicación usando `getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)`, evitando inicializaciones duplicadas. `onAuthStateChanged()` es el mecanismo central: es un listener que Firebase dispara automáticamente cada vez que cambia el estado de autenticación (login, logout, carga inicial), sin necesidad de comprobarlo manualmente. Las fichas se guardan en Firestore con `addDoc()` incluyendo un `serverTimestamp()` para poder ordenarlas por fecha. La lectura usa una `query` con `where("usuarioId", "==", authUser.uid)` para devolver únicamente las fichas del usuario autenticado.

### 9.3. Fragmentos de código relevantes

**JS — inicialización de Firebase evitando duplicados (`Cuenta.js`, línea 116):**
```javascript
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
firebaseAuth = getAuth(app);

onAuthStateChanged(firebaseAuth, (user) => {
    setAuthUIState(user);
});
```
- `getApps().length > 0` comprueba si Firebase ya fue inicializado en otra parte de la página (por ejemplo, si `Cuenta.js` y `ficha.js` se cargan juntos).
- `onAuthStateChanged()` recibe un callback que Firebase ejecuta con el objeto `user` cuando hay sesión activa, o con `null` cuando no la hay.

**JS — registro e inicio de sesión con email (`Cuenta.js`, línea 124 y 146):**
```javascript
await createUserWithEmailAndPassword(firebaseAuth, email, password);

await signInWithEmailAndPassword(firebaseAuth, email, password);
```
Ambas son funciones asíncronas de Firebase Authentication. Se usan con `await` dentro de un bloque `try/catch` para capturar errores como contraseña demasiado corta o email ya registrado.

**JS — inicio de sesión con Google (`Cuenta.js`, línea 169):**
```javascript
const provider = new GoogleAuthProvider();
await signInWithPopup(firebaseAuth, provider);
```
`signInWithPopup()` abre una ventana emergente del navegador con el flujo de OAuth de Google. Firebase gestiona internamente el intercambio de tokens.

**JS — guardado de ficha en Firestore (`ficha.js`, línea 231):**
```javascript
const payload = getCharacterPayload(characterForm);
const charactersRef = collection(firestoreDb, charactersCollectionName);
await addDoc(charactersRef, payload);
```
- `collection()` crea una referencia a la colección de Firestore donde se guardan las fichas.
- `addDoc()` añade un nuevo documento con ID generado automáticamente por Firestore.
- `payload` incluye todos los campos del formulario más `usuarioId`, `usuarioEmail` y `createdAt: serverTimestamp()`.

**JS — consulta de fichas privadas del usuario (`ficha.js`, línea 177):**
```javascript
const charactersRef = collection(firestoreDb, charactersCollectionName);
const charactersQuery = query(charactersRef, where("usuarioId", "==", authUser.uid));
const snapshot = await getDocs(charactersQuery);

cachedCharacters = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
}));
```
- `where("usuarioId", "==", authUser.uid)` filtra en el servidor de Firestore, devolviendo solo los documentos del usuario autenticado.
- `snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))` transforma cada documento Firestore en un objeto JavaScript plano, añadiendo el `id` del documento a los datos.

**Archivos relacionados:** `Cuenta.js` (autenticación), `ficha.js` (Firestore y formulario), `firebase-config.js` (claves del proyecto), `ficha.html` (formulario y listado), `global.css` / `ficha.css` (estilos del panel de cuenta y las fichas).

---

## 10. Responsividad

### 10.1. Descripción (qué hace)

La web se adapta correctamente a los cinco formatos requeridos: escritorio, tablet vertical, tablet horizontal, móvil vertical y móvil horizontal. En pantallas grandes los layouts son de múltiples columnas; en tablet se simplifican las cuadrículas y los mapas; en móvil todos los contenidos pasan a una sola columna, los menús de navegación se convierten en menú hamburguesa y el panel de cuenta ocupa el ancho disponible.

### 10.2. Funcionamiento (cómo lo hace)

La responsividad se implementa mediante **media queries CSS** con breakpoints en `900px` (tablet), `600px` (móvil grande) y `480px` / `400px` (móvil pequeño). Se complementa con unidades relativas (`clamp()`, `vw`, `%`, `min()`) para que los tamaños de texto y contenedores escalen de forma fluida entre breakpoints sin saltos bruscos. El menú de navegación lateral usa JavaScript para mostrar/ocultar con la clase `abierto`, bloqueando el scroll del body mientras está visible.

### 10.3. Fragmentos de código relevantes

**CSS — tipografía fluida con `clamp()` (`axis.css`):**
```css
.hero-contenido h1 {
    font-size: clamp(3.5rem, 12vw, 7rem);
}
```
- `clamp(mínimo, preferido, máximo)` hace que el tamaño sea `12vw` (relativo al ancho de pantalla) pero nunca menor de `3.5rem` ni mayor de `7rem`. Esto elimina la necesidad de media queries solo para tipografía.

**CSS — grid adaptable de clases (`axis.css`):**
```css
.clases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
}

@media (max-width: 600px) {
    .clases-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
```
- `auto-fit` con `minmax(140px, 1fr)` crea automáticamente el número de columnas que caben en el ancho disponible, sin media queries para cada tamaño.
- En móvil se fuerza a dos columnas siempre para garantizar una distribución visual correcta independientemente del ancho exacto de la pantalla.

**CSS — panel de cuenta responsive (`global.css`):**
```css
@media (max-width: 760px) {
    .cuenta-global {
        top: 12px;
        left: 12px;
        align-items: stretch;
    }

    .cuenta-panel {
        width: 100%;
    }

    .auth-form-global .auth-acciones {
        flex-direction: column;
    }
}
```
En móvil el panel ocupa todo el ancho disponible y los botones de acción se apilan verticalmente en lugar de ir en fila, evitando que se corten o desborden.

**CSS — mapa adaptado a móvil (`axis.css`):**
```css
@media (max-width: 900px) {
    .axis-mapa-layout {
        grid-template-columns: 1fr;
    }
}
```
El layout del mapa pasa de dos columnas (mapa + panel lateral en paralelo) a una sola columna, poniendo el panel de información debajo del mapa.

**JS — menú hamburguesa con bloqueo de scroll (`javaScript.js`, línea 7):**
```javascript
const setMenuState = (abierto) => {
    navEnlaces.classList.toggle('abierto', abierto);
    menuOverlay?.classList.toggle('abierto', abierto);
    document.body.classList.toggle('menu-abierto', abierto);
    hamburguesa.setAttribute('aria-expanded', String(abierto));
};
```
- `classList.toggle('menu-abierto', abierto)` añade o quita la clase del body según el estado.
- En CSS, `body.menu-abierto { overflow: hidden; }` bloquea el scroll de la página mientras el menú está abierto, evitando que el usuario pueda hacer scroll detrás del panel.

**Archivos relacionados:** `global.css` (estilos compartidos y media queries del panel de cuenta y menú), `axis.css` (breakpoints de Axis), `fate.css` (breakpoints de Fate), `index.css` (breakpoints del index), `javaScript.js` (lógica del menú hamburguesa).

---

## 11. Funcionalidad 6 — Sistema de fichas de personaje con Firestore

### 11.1. Descripción (qué hace)

La página `ficha.html` es un archivo privado de personajes completo. El usuario puede rellenar un formulario con los datos de su personaje (nombre, clase, mundo, estadísticas, descripción, etc.) y guardarlo en la base de datos de Firestore, donde queda vinculado a su cuenta. Al iniciar sesión, el listado de fichas se carga automáticamente desde Firestore mostrando únicamente las del usuario autenticado. Las fichas se pueden filtrar por mundo (Axis, Fate o todos). Si se accede a `ficha.html` desde un enlace con parámetro `?mundo=Axis` o `?mundo=Fate`, el formulario y el filtro se preseleccionan automáticamente con ese mundo.

### 11.2. Funcionamiento (cómo lo hace)

El formulario recoge los datos con la API nativa `FormData`. Al enviarlo, `getCharacterPayload()` transforma esos datos en un objeto listo para Firestore, añadiendo el `uid` del usuario y un `serverTimestamp()`. `addDoc()` lo guarda como nuevo documento en la colección. La lectura usa una query con `where("usuarioId", "==", uid)` para garantizar que cada usuario solo ve sus propias fichas. El filtrado es local: los datos se cachean en el array `cachedCharacters` y se filtran sin volver a consultar Firestore. La precarga del mundo desde la URL se hace leyendo `URLSearchParams` al inicio del script.

### 11.3. Fragmentos de código relevantes

**JS — precarga del mundo desde parámetros de URL (`ficha.js`, línea 53):**
```javascript
const queryParams = new URLSearchParams(window.location.search);
const worldFromUrl = queryParams.get("mundo");

if (worldFromUrl === "Axis" || worldFromUrl === "Fate") {
    worldSelect.value = worldFromUrl;
    filterWorld.value = worldFromUrl;
}
```
- `window.location.search` devuelve la parte de la URL tras el `?`, por ejemplo `?mundo=Axis`.
- `URLSearchParams` la parsea como un mapa de clave/valor. `.get("mundo")` extrae el valor de ese parámetro.
- Si el valor es válido, se preseleccionan tanto el selector del formulario como el filtro del listado, ofreciendo una experiencia de navegación contextual desde Axis o Fate.

**JS — construcción del payload para Firestore (`ficha.js`, línea 79):**
```javascript
const getCharacterPayload = (form) => {
    const formData = new FormData(form);

    return {
        mundo: formData.get("mundo")?.toString().trim() || "",
        jugador: formData.get("jugador")?.toString().trim() || "",
        nombre: formData.get("nombre")?.toString().trim() || "",
        rol: formData.get("rol")?.toString().trim() || "",
        descripcion: formData.get("descripcion")?.toString().trim() || "",
        usuarioId: authUser?.uid || "",
        usuarioEmail: authUser?.email || "",
        stats: {
            STR: Number(formData.get("str") || 0),
            CON: Number(formData.get("con") || 0),
            AGI: Number(formData.get("agi") || 0),
            MGI: Number(formData.get("mgi") || 0),
            LCK: Number(formData.get("lck") || 0),
            NP:  Number(formData.get("np")  || 0)
        },
        createdAt: serverTimestamp()
    };
};
```
- `new FormData(form)` captura todos los campos del formulario sin necesidad de leerlos uno a uno.
- `?.toString().trim()` usa optional chaining para evitar errores si un campo es `null`, y `trim()` elimina espacios accidentales.
- `Number(formData.get("str") || 0)` convierte el valor del campo numérico a número, usando `0` como fallback si está vacío.
- `serverTimestamp()` es una función de Firestore que inserta la hora del servidor en el momento del guardado, no la del cliente, evitando problemas de zona horaria o relojes desincronizados.
- `usuarioId: authUser?.uid` vincula la ficha al usuario autenticado, siendo la clave que permite filtrarla después.

**JS — filtrado local de fichas sin releer Firestore (`ficha.js`, línea 128):**
```javascript
const renderCharacters = () => {
    const activeFilter = filterWorld?.value || "todos";
    const filteredCharacters = activeFilter === "todos"
        ? cachedCharacters
        : cachedCharacters.filter((character) => character.mundo === activeFilter);

    charactersList.innerHTML = "";
    filteredCharacters.forEach((character) => {
        charactersList.appendChild(createCharacterCard(character));
    });
};
```
- `cachedCharacters` es el array en memoria cargado desde Firestore. Al cambiar el filtro, se filtra ese array localmente con `.filter()`, sin hacer una nueva consulta a la base de datos, lo que hace el filtrado instantáneo.
- `charactersList.innerHTML = ""` limpia el listado anterior antes de renderizar el nuevo.

**JS — renderizado dinámico de tarjetas (`ficha.js`, línea 106):**
```javascript
const createCharacterCard = (character) => {
    const article = document.createElement("article");
    article.className = "character-card";

    const statsEntries = Object.entries(character.stats || {});
    const statsHtml = statsEntries
        .map(([key, value]) => `<li><strong>${key}</strong><br>${value}</li>`)
        .join("");

    article.innerHTML = `
        <span class="character-meta ui">${character.mundo} - ${character.rol}</span>
        <h3 class="nombre-personaje">${character.nombre}</h3>
        <p><strong>Jugador:</strong> ${character.jugador || "Sin jugador"}</p>
        <ul class="character-stats">${statsHtml}</ul>
    `;

    return article;
};
```
- `Object.entries(character.stats)` convierte el objeto de stats `{ STR: 80, CON: 70, ... }` en un array de pares `[["STR", 80], ["CON", 70], ...]` que se puede iterar con `.map()`.
- El HTML de la tarjeta se construye completamente desde JavaScript y se inserta en el DOM, sin plantillas externas.

**Archivos relacionados:** `ficha.html` (formulario y listado), `ficha.js` (toda la lógica), `Cuenta.js` (autenticación que desbloquea el guardado), `ficha.css` (estilos de la página), `firebase-config.js` (configuración de conexión).

---

## 12. Funcionalidad 7 — Red visual de relaciones entre facciones (Fate)

### 12.1. Descripción (qué hace)

Dentro de la sección de facciones de `fate.html` existe un diagrama de red interactivo que muestra visualmente las relaciones entre las cuatro facciones del mundo Fate (Black Rose, Iron Chapel, Ash Market, Fogbound Wardens). Las líneas que conectan los nodos tienen tres tipos visuales distintos: cooperación, tensión y dependencia. Al pulsar un nodo del diagrama, el panel lateral de la red se actualiza con el resumen narrativo de esa facción y sus relaciones activas. La red está completamente sincronizada con el carrusel de facciones y el dossier: seleccionar desde cualquiera de los tres actualiza los otros dos simultáneamente.

### 12.2. Funcionamiento (cómo lo hace)

Los nodos son botones HTML posicionados de forma absoluta sobre el tablero, con `data-network-faction` que los identifica por nombre. Las líneas de conexión son elementos `<line>` dentro de un SVG superpuesto, con coordenadas en porcentaje (`viewBox="0 0 100 100"`) para que escalen con el contenedor. El tipo de relación se comunica visualmente mediante clases CSS (`faction-link-alliance`, `faction-link-tension`, `faction-link-dependence`). El texto narrativo de cada nodo se almacena en un diccionario JavaScript (`factionNarrativeMap`) indexado por nombre de facción. Al activar un nodo, la función `updateFactionConsole()` sincroniza el dossier, el carrusel y el propio diagrama de red en un solo paso.

### 12.3. Fragmentos de código relevantes

**HTML — SVG de conexiones con tipos de relación (`fate.html`, línea 310):**
```html
<svg class="faction-network-links" viewBox="0 0 100 100"
     preserveAspectRatio="none" aria-hidden="true">
    <line class="faction-link-svg faction-link-tension"
          x1="27" y1="24" x2="67" y2="24"></line>
    <line class="faction-link-svg faction-link-dependence"
          x1="27" y1="24" x2="28" y2="68"></line>
    <line class="faction-link-svg faction-link-alliance"
          x1="27" y1="24" x2="69" y2="68"></line>
</svg>
```
- `viewBox="0 0 100 100"` define un sistema de coordenadas de 0 a 100 en ambos ejes. Los valores `x1`, `y1`, `x2`, `y2` son porcentajes implícitos, lo que hace que las líneas se reescalen perfectamente con el contenedor sin JavaScript.
- `preserveAspectRatio="none"` permite que el SVG se estire libremente con el contenedor.
- `aria-hidden="true"` oculta el SVG a los lectores de pantalla, ya que la información de relaciones ya está disponible en texto dentro del panel lateral.
- Cada clase (`faction-link-alliance`, `faction-link-tension`, `faction-link-dependence`) aplica un color y estilo de línea diferente en CSS, comunicando el tipo de relación visualmente.

**HTML — nodos del diagrama como botones accesibles (`fate.html`, línea 319):**
```html
<button type="button" class="faction-node faction-node-active"
    data-network-faction="Black Rose"
    style="top: 24%; left: 27%;">
    <span class="ui">BR</span>
    <strong>Black Rose</strong>
</button>
```
- Los nodos son `<button>` reales, lo que los hace accesibles por teclado y para lectores de pantalla de forma nativa, sin necesidad de añadir roles ARIA manualmente.
- `style="top: 24%; left: 27%"` posiciona cada nodo en coordenadas relativas sobre el tablero, alineadas con las coordenadas del SVG.
- `data-network-faction` es el identificador que JavaScript usa para sincronizar el nodo con su tarjeta de facción correspondiente.

**JS — diccionario narrativo y sincronización completa (`javaScript.js`, línea 764):**
```javascript
const factionNarrativeMap = {
    "Black Rose": "Opera con dependencia comercial hacia Ash Market, mantiene una tregua fragil con Iron Chapel...",
    "Iron Chapel": "Sostiene enclaves con apoyo defensivo de los Wardens, pero choca doctrinalmente con el Ash Market...",
    // ...
};

// Dentro de updateFactionConsole():
factionNetworkNodes.forEach((node) => {
    node.classList.toggle('active', node.dataset.networkFaction === activeName);
    node.setAttribute('aria-pressed', String(node.dataset.networkFaction === activeName));
});

networkFocusTitle.textContent = activeName;
networkFocusSummary.textContent = factionNarrativeMap[activeName] || 'Sin lectura narrativa.';
networkFocusRelations.innerHTML = '';
relations.forEach((relationText) => {
    const item = document.createElement('li');
    item.textContent = `${relationText}.`;
    networkFocusRelations.appendChild(item);
});
```
- `factionNarrativeMap` es un objeto-diccionario que asocia el nombre de cada facción con su texto narrativo. Acceder a él con `factionNarrativeMap[activeName]` es una operación O(1), más eficiente que buscar en el DOM.
- `classList.toggle('active', condición)` sincroniza el estado visual de todos los nodos en una sola iteración: el que coincide recibe la clase, el resto la pierde.
- `|| 'Sin lectura narrativa.'` actúa como fallback por si el nombre de la facción no existe en el diccionario, evitando mostrar `undefined` en el panel.

**JS — activación cruzada: pulsar un nodo activa su tarjeta en el carrusel (`javaScript.js`, línea 808):**
```javascript
factionNetworkNodes.forEach((node) => {
    node.addEventListener('click', () => {
        const targetName = node.dataset.networkFaction || '';
        const linkedCard = Array.from(factionCards).find(
            (card) => card.dataset.factionName === targetName
        );
        if (linkedCard) {
            updateFactionConsole(linkedCard);
            const carrusel = linkedCard.parentElement;
            if (carrusel instanceof HTMLElement) {
                const destino = linkedCard.offsetLeft
                    - ((carrusel.clientWidth - linkedCard.clientWidth) / 2);
                carrusel.scrollTo({ left: Math.max(0, destino), behavior: 'smooth' });
            }
        }
    });
});
```
- `Array.from(factionCards).find(...)` busca la tarjeta del carrusel cuyo nombre coincide con el nodo pulsado, usando el nombre como clave de sincronización entre los dos sistemas.
- La fórmula `linkedCard.offsetLeft - ((carrusel.clientWidth - linkedCard.clientWidth) / 2)` calcula el scroll necesario para centrar la tarjeta dentro del carrusel, ofreciendo una experiencia de navegación fluida.
- `carrusel.scrollTo({ behavior: 'smooth' })` anima el desplazamiento suavemente en lugar de un salto brusco.

**Archivos relacionados:** `fate.html` (HTML de nodos, SVG de líneas y panel lateral), `javaScript.js` (función `updateFactionConsole`, listeners de nodos, `factionNarrativeMap`), `fate.css` (estilos de nodos, líneas SVG y panel de red).