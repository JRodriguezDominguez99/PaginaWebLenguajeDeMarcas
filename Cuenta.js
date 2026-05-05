// Panel global de cuenta: permite acceder, registrarse y cerrar sesion desde cualquier pagina.
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const cuentaToggle = document.getElementById("cuenta-toggle");
const cuentaPanel = document.getElementById("cuenta-panel");
const cuentaPill = document.getElementById("cuenta-pill");
const authForm = document.getElementById("auth-form");
const authStatus = document.getElementById("auth-status");
const authMessage = document.getElementById("auth-message");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");
const googleButton = document.getElementById("google-button");
const logoutButton = document.getElementById("logout-button");

if (!cuentaToggle || !cuentaPanel || !authForm || !authStatus || !authMessage) {
    // Si una pagina no incluye el panel, salimos sin romper nada.
} else {
    const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value !== "");
    let firebaseAuth = null;

    const setMessageState = (element, message, state = "") => {
        element.textContent = message;
        element.classList.remove("ok", "error");

        if (state) {
            element.classList.add(state);
        }
    };

    const shortEmail = (email) => {
        if (!email) {
            return "Conectado";
        }

        return email.length > 18 ? `${email.slice(0, 18)}...` : email;
    };

    const toggleCuentaPanel = (shouldOpen) => {
        const abierta = typeof shouldOpen === "boolean"
            ? shouldOpen
            : cuentaPanel.hidden;

        cuentaPanel.hidden = !abierta;
        cuentaToggle.setAttribute("aria-expanded", String(abierta));
        document.body.classList.toggle("cuenta-panel-abierto", abierta);
    };

    const setAuthUIState = (user) => {
        if (user) {
            authForm.classList.add("logueado");
            cuentaPill.textContent = shortEmail(user.email || "");
            setMessageState(authStatus, `Sesion iniciada como ${user.email || "usuario autenticado"}.`, "ok");
            setMessageState(authMessage, "Tu archivo privado esta activo. Solo veras tus propias fichas.", "ok");
        } else {
            authForm.classList.remove("logueado");
            cuentaPill.textContent = "Invitado";
            setMessageState(authStatus, "Todavia no has iniciado sesion.", "");
            setMessageState(authMessage, "Crea una cuenta o entra para vincular y proteger tus fichas.", "");
        }
    };

    const getAuthCredentials = () => ({
        email: authEmail?.value.trim() || "",
        password: authPassword?.value || ""
    });

    cuentaToggle.addEventListener("click", () => {
        toggleCuentaPanel();
    });

    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Node) || cuentaPanel.hidden) {
            return;
        }

        const clickInsidePanel = cuentaPanel.contains(target);
        const clickOnToggle = cuentaToggle.contains(target);

        if (!clickInsidePanel && !clickOnToggle) {
            toggleCuentaPanel(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            toggleCuentaPanel(false);
        }
    });

    if (!isFirebaseConfigured) {
        cuentaPill.textContent = "Offline";
        setMessageState(authStatus, "Firebase todavia no esta configurado en esta copia del proyecto.", "error");
        setMessageState(authMessage, "Completa la configuracion para activar el acceso de cuenta.", "error");
    } else {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        firebaseAuth = getAuth(app);

        onAuthStateChanged(firebaseAuth, (user) => {
            setAuthUIState(user);
        });
    }

    registerButton?.addEventListener("click", async () => {
        if (!firebaseAuth) {
            setMessageState(authMessage, "Firebase Auth todavia no esta listo.", "error");
            return;
        }

        const { email, password } = getAuthCredentials();

        if (!email || !password) {
            setMessageState(authMessage, "Introduce correo y contrasena para crear la cuenta.", "error");
            return;
        }

        try {
            await createUserWithEmailAndPassword(firebaseAuth, email, password);
            setMessageState(authMessage, "Cuenta creada correctamente. Ya puedes guardar fichas privadas.", "ok");
        } catch (error) {
            console.error("Error al crear cuenta:", error);
            setMessageState(authMessage, "No se ha podido crear la cuenta. Revisa correo, contrasena y consola.", "error");
        }
    });

    loginButton?.addEventListener("click", async () => {
        if (!firebaseAuth) {
            setMessageState(authMessage, "Firebase Auth todavia no esta listo.", "error");
            return;
        }

        const { email, password } = getAuthCredentials();

        if (!email || !password) {
            setMessageState(authMessage, "Introduce correo y contrasena para iniciar sesion.", "error");
            return;
        }

        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            setMessageState(authMessage, "Sesion iniciada correctamente.", "ok");
            toggleCuentaPanel(false);
        } catch (error) {
            console.error("Error al iniciar sesion:", error);
            setMessageState(authMessage, "No se ha podido iniciar sesion. Revisa credenciales y consola.", "error");
        }
    });

    googleButton?.addEventListener("click", async () => {
        if (!firebaseAuth) {
            setMessageState(authMessage, "Firebase Auth todavia no esta listo.", "error");
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(firebaseAuth, provider);
            setMessageState(authMessage, "Sesion iniciada con Google correctamente.", "ok");
            toggleCuentaPanel(false);
        } catch (error) {
            console.error("Error al iniciar sesion con Google:", error);
            const code = error?.code || "";

            if (code === "auth/unauthorized-domain") {
                setMessageState(authMessage, "Google bloquea este dominio. Anade localhost o 127.0.0.1 en Firebase Auth.", "error");
            } else if (code === "auth/popup-closed-by-user") {
                setMessageState(authMessage, "Has cerrado la ventana de Google antes de terminar el acceso.", "error");
            } else {
                setMessageState(authMessage, "No se ha podido iniciar sesion con Google. Revisa consola y dominios autorizados.", "error");
            }
        }
    });

    logoutButton?.addEventListener("click", async () => {
        if (!firebaseAuth) {
            setMessageState(authMessage, "Firebase Auth todavia no esta listo.", "error");
            return;
        }

        try {
            await signOut(firebaseAuth);
            setMessageState(authMessage, "Sesion cerrada correctamente.", "ok");
        } catch (error) {
            console.error("Error al cerrar sesion:", error);
            setMessageState(authMessage, "No se ha podido cerrar sesion. Revisa la consola.", "error");
        }
    });
}
