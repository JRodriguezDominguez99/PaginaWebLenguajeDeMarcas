// Importamos Firebase desde CDN porque este proyecto es una landing sin backend propio.
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    addDoc,
    collection,
    getDocs,
    getFirestore,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config del proyecto y nombre de la coleccion donde se guardan las fichas.
import { charactersCollectionName, firebaseConfig } from "./firebase-config.js";

// Referencias principales de la interfaz.
const formStatus = document.getElementById("form-status");
const characterForm = document.getElementById("character-form");
const charactersList = document.getElementById("characters-list");
const filterWorld = document.getElementById("filter-world");
const worldSelect = document.getElementById("mundo");

let firestoreDb = null;
let firebaseAuth = null;
let authUser = null;
let cachedCharacters = [];

// Ordena las fichas por fecha sin depender de indices extra de Firestore.
const timestampToMillis = (value) => {
    if (!value) {
        return 0;
    }

    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (value.seconds) {
        return Number(value.seconds) * 1000;
    }

    return 0;
};

// Activamos esta clase solo cuando el JS realmente ha arrancado.
document.body.classList.add("js-reveal");

// Si la URL trae ?mundo=Axis o ?mundo=Fate, lo usamos para precargar el formulario.
const queryParams = new URLSearchParams(window.location.search);
const worldFromUrl = queryParams.get("mundo");

if (worldFromUrl === "Axis" || worldFromUrl === "Fate") {
    worldSelect.value = worldFromUrl;
    filterWorld.value = worldFromUrl;
}

// Detecta si la config sigue vacia para evitar errores innecesarios.
const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value !== "");

// Estado visual comun para los mensajes de interfaz.
const setMessageState = (element, message, state = "") => {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.remove("ok", "error");

    if (state) {
        element.classList.add(state);
    }
};

// Convierte el formulario a un objeto listo para Firestore.
const getCharacterPayload = (form) => {
    const formData = new FormData(form);

    return {
        mundo: formData.get("mundo")?.toString().trim() || "",
        jugador: formData.get("jugador")?.toString().trim() || "",
        contacto: formData.get("contacto")?.toString().trim() || "",
        grupo: formData.get("grupo")?.toString().trim() || "",
        nombre: formData.get("nombre")?.toString().trim() || "",
        rol: formData.get("rol")?.toString().trim() || "",
        origen: formData.get("origen")?.toString().trim() || "",
        descripcion: formData.get("descripcion")?.toString().trim() || "",
        usuarioId: authUser?.uid || "",
        usuarioEmail: authUser?.email || "",
        stats: {
            STR: Number(formData.get("str") || 0),
            CON: Number(formData.get("con") || 0),
            AGI: Number(formData.get("agi") || 0),
            MGI: Number(formData.get("mgi") || 0),
            LCK: Number(formData.get("lck") || 0),
            NP: Number(formData.get("np") || 0)
        },
        createdAt: serverTimestamp()
    };
};

// Pinta una tarjeta HTML de personaje a partir de los datos recuperados.
const createCharacterCard = (character) => {
    const article = document.createElement("article");
    article.className = "character-card";

    const statsEntries = Object.entries(character.stats || {});
    const statsHtml = statsEntries.map(([key, value]) => `<li><strong>${key}</strong><br>${value}</li>`).join("");

    article.innerHTML = `
        <span class="character-meta ui">${character.mundo} - ${character.rol}</span>
        <h3 class="nombre-personaje">${character.nombre}</h3>
        <p><strong>Jugador:</strong> ${character.jugador || "Sin jugador"}</p>
        <p><strong>Contacto:</strong> ${character.contacto || "Sin contacto"}</p>
        <p><strong>Grupo:</strong> ${character.grupo || "Sin grupo"}</p>
        <p><strong>Origen:</strong> ${character.origen || "Sin origen"}</p>
        <p>${character.descripcion || "Sin descripcion todavia."}</p>
        <ul class="character-stats">${statsHtml}</ul>
    `;

    return article;
};

// Muestra las fichas filtradas por el selector actual.
const renderCharacters = () => {
    if (!charactersList) {
        return;
    }

    if (!authUser) {
        charactersList.innerHTML = `
            <article class="character-empty">
                <h3 class="nombre-personaje">Archivo privado bloqueado</h3>
                <p>
                    Inicia sesion para ver unicamente las fichas guardadas en tu cuenta.
                </p>
            </article>
        `;
        return;
    }

    const activeFilter = filterWorld?.value || "todos";
    const filteredCharacters = activeFilter === "todos"
        ? cachedCharacters
        : cachedCharacters.filter((character) => character.mundo === activeFilter);

    charactersList.innerHTML = "";

    if (filteredCharacters.length === 0) {
        charactersList.innerHTML = `
            <article class="character-empty">
                <h3 class="nombre-personaje">Sin fichas en este filtro</h3>
                <p>
                    Esta cuenta todavia no tiene personajes guardados para el mundo seleccionado.
                </p>
            </article>
        `;
        return;
    }

    filteredCharacters.forEach((character) => {
        charactersList.appendChild(createCharacterCard(character));
    });
};

// Lee solo las fichas privadas de la cuenta autenticada.
const loadCharacters = async () => {
    if (!firestoreDb || !authUser) {
        cachedCharacters = [];
        renderCharacters();
        return;
    }

    const charactersRef = collection(firestoreDb, charactersCollectionName);
    const charactersQuery = query(charactersRef, where("usuarioId", "==", authUser.uid));
    const snapshot = await getDocs(charactersQuery);

    cachedCharacters = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    cachedCharacters.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));

    renderCharacters();
};

// Inicializacion principal de Firebase.
const initializeFirebase = async () => {
    if (!isFirebaseConfigured) {
        setMessageState(formStatus, "Completa firebase-config.js para activar el guardado real.", "error");
        renderCharacters();
        return;
    }

    try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        firestoreDb = getFirestore(app);
        firebaseAuth = getAuth(app);

        setMessageState(formStatus, "Formulario listo para guardar en Firestore.", "ok");

        onAuthStateChanged(firebaseAuth, async (user) => {
            authUser = user;
            await loadCharacters();
        });
    } catch (error) {
        console.error("Error al iniciar Firebase:", error);
        setMessageState(formStatus, "Firebase no ha arrancado. Mira la consola para ver el error.", "error");
    }
};

// Guardado del formulario.
if (characterForm) {
    characterForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!firestoreDb) {
            setMessageState(formStatus, "Todavia no hay conexion real con Firestore.", "error");
            return;
        }

        if (!authUser) {
            setMessageState(formStatus, "Inicia sesion antes de guardar una ficha para vincularla a tu cuenta.", "error");
            return;
        }

        try {
            const payload = getCharacterPayload(characterForm);
            const charactersRef = collection(firestoreDb, charactersCollectionName);

            await addDoc(charactersRef, payload);

            setMessageState(formStatus, "Ficha guardada correctamente en Firestore.", "ok");
            characterForm.reset();

            if (worldFromUrl === "Axis" || worldFromUrl === "Fate") {
                worldSelect.value = worldFromUrl;
            }

            await loadCharacters();
        } catch (error) {
            console.error("Error al guardar personaje:", error);
            setMessageState(formStatus, "No se ha podido guardar la ficha. Revisa la consola.", "error");
        }
    });
}

// Cambio de filtro del listado.
if (filterWorld) {
    filterWorld.addEventListener("change", renderCharacters);
}

// Reveal para mantener consistencia con el resto del proyecto.
const revealElements = document.querySelectorAll(".reveal-on-scroll");

if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    revealElements.forEach((element) => {
        revealObserver.observe(element);
    });
}

// Arrancamos la preparacion de Firebase.
initializeFirebase();
