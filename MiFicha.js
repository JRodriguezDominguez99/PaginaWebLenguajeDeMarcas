// Este script rellena la zona "Mi ficha" solo con la ficha del usuario autenticado
// en el mundo actual para mantener la privacidad entre cuentas.

import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    collection,
    getDocs,
    getFirestore,
    where,
    query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { charactersCollectionName, firebaseConfig } from "./firebase-config.js";

const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value !== "");

const getInitials = (value) => {
    const cleaned = value.trim();

    if (!cleaned) {
        return "--";
    }

    const words = cleaned.split(/\s+/).slice(0, 2);
    return words.map((word) => word[0]?.toUpperCase() || "").join("");
};

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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const loadLatestCharacterByWorld = async (world, userId = "") => {
    if (!userId) {
        return null;
    }

    const db = getFirestore(app);
    const charactersRef = collection(db, charactersCollectionName);
    const worldQuery = query(charactersRef, where("mundo", "==", world), where("usuarioId", "==", userId));
    const snapshot = await getDocs(worldQuery);

    const characters = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    characters.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));

    return characters[0] || null;
};

const renderAxisMyFichaEmpty = (message) => {
    const avatar = document.getElementById("axis-mi-ficha-avatar");
    const title = document.getElementById("axis-mi-ficha-title");
    const summary = document.getElementById("axis-mi-ficha-summary");
    const status = document.getElementById("axis-mi-ficha-status");
    const record = document.getElementById("axis-mi-ficha-record");
    const vida = document.getElementById("axis-mi-ficha-vida");
    const energia = document.getElementById("axis-mi-ficha-energia");
    const rol = document.getElementById("axis-mi-ficha-rol");
    const origen = document.getElementById("axis-mi-ficha-origen");
    const list = document.getElementById("axis-mi-ficha-list");

    if (!avatar || !title || !summary || !status || !record || !vida || !energia || !rol || !origen || !list) {
        return;
    }

    avatar.textContent = "AX";
    title.textContent = "Tu personaje de Axis aparecera aqui";
    summary.textContent = message;
    status.innerHTML = "<strong>Estado:</strong> Archivo privado";
    record.innerHTML = "<strong>Ficha:</strong> Sin datos vinculados";
    vida.textContent = "--";
    energia.textContent = "--";
    rol.textContent = "--";
    origen.textContent = "--";
    list.innerHTML = `
        <li>Inicia sesion para cargar tu ficha personal.</li>
        <li>Guarda al menos un personaje de Axis en tu cuenta.</li>
        <li>Las fichas de otros usuarios no se muestran aqui.</li>
    `;
};

const renderFateMyFichaEmpty = (message) => {
    const avatar = document.getElementById("fate-mi-ficha-avatar");
    const title = document.getElementById("fate-mi-ficha-title");
    const summary = document.getElementById("fate-mi-ficha-summary");
    const status = document.getElementById("fate-mi-ficha-status");
    const record = document.getElementById("fate-mi-ficha-record");
    const vida = document.getElementById("fate-mi-ficha-vida");
    const energia = document.getElementById("fate-mi-ficha-energia");
    const faccion = document.getElementById("fate-mi-ficha-faccion");
    const rango = document.getElementById("fate-mi-ficha-rango");
    const list = document.getElementById("fate-mi-ficha-list");

    if (!avatar || !title || !summary || !status || !record || !vida || !energia || !faccion || !rango || !list) {
        return;
    }

    avatar.textContent = "FT";
    title.textContent = "Tu ficha de Fate ira aqui";
    summary.textContent = message;
    status.innerHTML = "<strong>Estado:</strong> Archivo privado";
    record.innerHTML = "<strong>Sesion:</strong> Sin datos vinculados";
    vida.textContent = "--";
    energia.textContent = "--";
    faccion.textContent = "--";
    rango.textContent = "--";
    list.innerHTML = `
        <li>Inicia sesion para cargar tu ficha personal.</li>
        <li>Guarda al menos un personaje de Fate en tu cuenta.</li>
        <li>Las fichas de otros usuarios no se muestran aqui.</li>
    `;
};

const renderAxisMyFicha = (character) => {
    const avatar = document.getElementById("axis-mi-ficha-avatar");
    const title = document.getElementById("axis-mi-ficha-title");
    const summary = document.getElementById("axis-mi-ficha-summary");
    const status = document.getElementById("axis-mi-ficha-status");
    const record = document.getElementById("axis-mi-ficha-record");
    const vida = document.getElementById("axis-mi-ficha-vida");
    const energia = document.getElementById("axis-mi-ficha-energia");
    const rol = document.getElementById("axis-mi-ficha-rol");
    const origen = document.getElementById("axis-mi-ficha-origen");
    const list = document.getElementById("axis-mi-ficha-list");

    if (!character || !avatar || !title || !summary || !status || !record || !vida || !energia || !rol || !origen || !list) {
        return;
    }

    avatar.textContent = getInitials(character.nombre || "AX");
    title.textContent = character.nombre || "Ficha de Axis";
    summary.textContent = character.descripcion || "Sin descripcion todavia.";
    status.innerHTML = `<strong>Estado:</strong> ${character.jugador || "Jugador sin nombre"}`;
    record.innerHTML = `<strong>Ficha:</strong> ${character.id || "Sin id"}`;
    vida.textContent = String(character.stats?.STR ?? "--");
    energia.textContent = String(character.stats?.NP ?? "--");
    rol.textContent = character.rol || "--";
    origen.textContent = character.origen || "--";
    list.innerHTML = `
        <li>Jugador vinculado: ${character.jugador || "Sin nombre"}.</li>
        <li>Grupo o mesa: ${character.grupo || "Sin grupo"}.</li>
        <li>Contacto: ${character.contacto || "Sin contacto"}.</li>
    `;
};

const renderFateMyFicha = (character) => {
    const avatar = document.getElementById("fate-mi-ficha-avatar");
    const title = document.getElementById("fate-mi-ficha-title");
    const summary = document.getElementById("fate-mi-ficha-summary");
    const status = document.getElementById("fate-mi-ficha-status");
    const record = document.getElementById("fate-mi-ficha-record");
    const vida = document.getElementById("fate-mi-ficha-vida");
    const energia = document.getElementById("fate-mi-ficha-energia");
    const faccion = document.getElementById("fate-mi-ficha-faccion");
    const rango = document.getElementById("fate-mi-ficha-rango");
    const list = document.getElementById("fate-mi-ficha-list");

    if (!character || !avatar || !title || !summary || !status || !record || !vida || !energia || !faccion || !rango || !list) {
        return;
    }

    avatar.textContent = getInitials(character.nombre || "FT");
    title.textContent = character.nombre || "Ficha de Fate";
    summary.textContent = character.descripcion || "Sin descripcion todavia.";
    status.innerHTML = `<strong>Estado:</strong> ${character.jugador || "Jugador sin nombre"}`;
    record.innerHTML = `<strong>Sesion:</strong> ${character.id || "Sin id"}`;
    vida.textContent = String(character.stats?.STR ?? "--");
    energia.textContent = String(character.stats?.NP ?? "--");
    faccion.textContent = character.rol || "--";
    rango.textContent = character.origen || "--";
    list.innerHTML = `
        <li>Jugador vinculado: ${character.jugador || "Sin nombre"}.</li>
        <li>Grupo o mesa: ${character.grupo || "Sin grupo"}.</li>
        <li>Contacto: ${character.contacto || "Sin contacto"}.</li>
    `;
};

const initializeMyFicha = async () => {
    if (!isFirebaseConfigured) {
        return;
    }

    const auth = getAuth(app);
    const axisSection = document.querySelector('[data-mi-ficha-world="Axis"]');
    const fateSection = document.querySelector('[data-mi-ficha-world="Fate"]');

    onAuthStateChanged(auth, async (user) => {
        try {
            if (axisSection) {
                const axisCharacter = await loadLatestCharacterByWorld("Axis", user?.uid || "");

                if (axisCharacter) {
                    renderAxisMyFicha(axisCharacter);
                } else {
                    renderAxisMyFichaEmpty("Cuando inicies sesion y guardes una ficha de Axis, aparecera aqui automaticamente.");
                }
            }

            if (fateSection) {
                const fateCharacter = await loadLatestCharacterByWorld("Fate", user?.uid || "");

                if (fateCharacter) {
                    renderFateMyFicha(fateCharacter);
                } else {
                    renderFateMyFichaEmpty("Cuando inicies sesion y guardes una ficha de Fate, aparecera aqui automaticamente.");
                }
            }
        } catch (error) {
            console.error("No se ha podido cargar la zona de mi ficha:", error);
        }
    });
};

initializeMyFicha();
