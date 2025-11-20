// 1. Importamos las funciones necesarias desde los servidores de Google (CDN)
// Usamos la versión compatible con módulos (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. Tu configuración de Firebase (La que me acabas de dar)
const firebaseConfig = {
  apiKey: "AIzaSyCfNsojvs-A40KCyUknK6Kv-YFeMfHK9OQ",
  authDomain: "rebeca-gestalt-comments.firebaseapp.com",
  projectId: "rebeca-gestalt-comments",
  storageBucket: "rebeca-gestalt-comments.firebasestorage.app",
  messagingSenderId: "469916329968",
  appId: "1:469916329968:web:ca0a1a2a3dea1fde3b1f35"
};

// 3. Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Conexión a la base de datos

// 4. Lógica de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    /**
     * Agrega un comentario al DOM visualmente (lo muestra en pantalla).
     */
    function addCommentToDOM(comment) {
        // Sanitización básica para evitar inyección de código HTML
        const safeName = comment.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeText = comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Si por alguna razón no hay fecha, mostramos algo por defecto
        const displayDate = comment.date || 'Fecha desconocida';

        const commentElement = document.createElement('div');
        commentElement.classList.add('comment', 'mb-3');
        commentElement.innerHTML = `
            <p class="mb-1">
                <strong class="comment-author">${safeName}</strong>
                <span class="comment-date ms-2">- ${displayDate}</span>
            </p>
            <p class="mb-0">${safeText}</p>
        `;
        // Prepend lo pone al principio de la lista
        commentsList.prepend(commentElement);
    }

    /**
     * Carga los comentarios desde Firebase Firestore
     */
    async function loadComments() {
        // Mostramos un mensaje temporal de carga
        commentsList.innerHTML = '<p class="text-muted">Cargando comentarios...</p>';
        
        try {
            // Consulta: pedimos la colección 'comentarios' ordenados por timestamp (fecha)
            const q = query(collection(db, "comentarios"), orderBy("timestamp", "asc"));
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                commentsList.innerHTML = ''; // Limpiamos el mensaje de carga
                
                // Iteramos sobre cada documento que nos devolvió Firebase
                querySnapshot.forEach((doc) => {
                    // doc.data() contiene { name, text, date, ... }
                    addCommentToDOM(doc.data());
                });
            } else {
                 commentsList.innerHTML = '<p class="text-muted">Aún no hay comentarios. ¡Sé el primero!</p>';
            }
        } catch (error) {
            console.error("Error cargando comentarios de Firebase:", error);
            commentsList.innerHTML = '<p class="text-danger">Error al cargar comentarios. Intenta recargar la página.</p>';
        }
    }

    // --- Event listener para cuando el usuario envía el formulario ---
    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = commentNameInput.value.trim();
        const text = commentTextInput.value.trim();

        // Validación simple
        if (name === '' || text === '') {
            return;
        }
        
        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()} a las ${date.toLocaleTimeString()}`;

        // Objeto que vamos a guardar en la nube
        const newComment = {
            name: name,
            text: text,
            date: formattedDate,
            timestamp: date.getTime() // Guardamos milisegundos para poder ordenar correctamente
        };

        try {
            // Feedback visual: Deshabilitar botón mientras se envía
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Enviando...';
            submitBtn.disabled = true;

            // 1. GUARDAR EN FIREBASE: Enviamos los datos a Firestore
            await addDoc(collection(db, "comentarios"), newComment);

            // 2. Si no hubo error, actualizamos la pantalla
            // Si existía el mensaje de "no hay comentarios", lo quitamos
            if (commentsList.querySelector('p.text-muted')) {
                commentsList.innerHTML = '';
            }
            
            // Agregamos el comentario nuevo al DOM inmediatamente
            addCommentToDOM(newComment);

            // 3. Limpiamos el formulario
            commentForm.reset();

        } catch (error) {
            console.error("Error guardando documento: ", error);
            alert("Hubo un problema al guardar tu comentario. Revisa tu conexión.");
        } finally {
            // Restauramos el botón, pase lo que pase
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Enviar Comentario';
            submitBtn.disabled = false;
        }
    });

    // --- Carga inicial al abrir la página ---
    loadComments();
});