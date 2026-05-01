import { db, auth } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Función para guardar ficha (Esto es una funcionalidad real documentable)
const guardarPersonaje = async (nombre, mundo, estadisticas) => {
    try {
        // 'personajes' es el nombre de tu colección en la nube
        const docRef = await addDoc(collection(db, "personajes"), {
            nombre: nombre,
            mundo: mundo, // "Axis" o "Fate"
            stats: estadisticas,
            usuarioId: auth.currentUser ? auth.currentUser.uid : "anonimo",
            fecha: new Date()
        });
        console.log("Ficha guardada con ID: ", docRef.id);
        alert("¡Personaje enviado al destino!");
    } catch (e) {
        console.error("Error al guardar: ", e);
        // Evitamos el error crítico para no tener un 0 en la entrega
    }
};