// 1. Importamos las funciones necesarias (Agregamos doc, updateDoc, arrayUnion)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. Tu configuración de Firebase
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
const db = getFirestore(app);

// 4. Lógica de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    /**
     * Función auxiliar para sanitizar texto (evitar inyección HTML)
     */
    function sanitize(str) {
        if (!str) return "";
        return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /**
     * Agrega un comentario al DOM visualmente.
     * @param {string} id - El ID del documento en Firestore.
     * @param {object} comment - Los datos del comentario.
     */
    function addCommentToDOM(id, comment) {
        const safeName = sanitize(comment.name);
        const safeText = sanitize(comment.text);
        const displayDate = comment.date || 'Fecha desconocida';
        
        // Manejo de respuestas antiguas y nuevas
        // Si no existe el campo 'replies', usamos un array vacío
        const replies = comment.replies || []; 

        // Generamos el HTML de las respuestas existentes
        let repliesHTML = '';
        replies.forEach(reply => {
            repliesHTML += `
                <div class="respuesta-item" style="margin-left: 30px; border-left: 2px solid #ccc; padding-left: 10px; margin-top: 5px; background: #f9f9f9; padding: 8px; border-radius: 4px;">
                    <strong>${sanitize(reply.name)}</strong> <small class="text-muted">- ${reply.date}</small>
                    <p class="mb-0">${sanitize(reply.text)}</p>
                </div>
            `;
        });

        const commentElement = document.createElement('div');
        commentElement.classList.add('comment', 'mb-3', 'p-3', 'border', 'rounded');
        commentElement.id = `comment-${id}`; // ID único para el DOM
        
        commentElement.innerHTML = `
            <div class="main-comment">
                <p class="mb-1">
                    <strong class="comment-author">${safeName}</strong>
                    <span class="comment-date ms-2 text-muted">- ${displayDate}</span>
                </p>
                <p class="mb-2">${safeText}</p>
                
                <button class="btn-reply-toggle" onclick="window.toggleReplyForm('${id}')">Responder</button>
            </div>

            <div id="replies-container-${id}" class="mt-2">
                ${repliesHTML}
            </div>

            <div id="reply-form-${id}" class="mt-2" style="display:none; background: #eef; padding: 10px; border-radius: 5px;">
                <input type="text" id="reply-name-${id}" class="form-control mb-1 input-sm" placeholder="Tu nombre" required>
                <input type="text" id="reply-text-${id}" class="form-control mb-1 input-sm" placeholder="Escribe una respuesta..." required>
                <button class="btn btn-sm btn-primary mt-1" onclick="window.submitReply('${id}')">Enviar Respuesta</button>
            </div>
        `;
        
        // Prepend lo pone al principio de la lista
        commentsList.prepend(commentElement);
    }

    /**
     * Carga los comentarios desde Firebase Firestore
     */
    async function loadComments() {
        commentsList.innerHTML = '<p class="text-muted">Cargando comentarios...</p>';
        try {
            const q = query(collection(db, "comentarios"), orderBy("timestamp", "asc"));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                commentsList.innerHTML = ''; 
                querySnapshot.forEach((doc) => {
                    // IMPORTANTE: Pasamos el ID del documento y sus datos
                    addCommentToDOM(doc.id, doc.data());
                });
            } else {
                 commentsList.innerHTML = '<p class="text-muted">Aún no hay comentarios. ¡Sé el primero!</p>';
            }
        } catch (error) {
            console.error("Error cargando comentarios:", error);
            commentsList.innerHTML = '<p class="text-danger">Error al cargar. Intenta recargar.</p>';
        }
    }

    // --- Envío de Comentario Principal ---
    commentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = commentNameInput.value.trim();
        const text = commentTextInput.value.trim();

        if (name === '' || text === '') return;
        
        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()} a las ${date.toLocaleTimeString()}`;

        const newComment = {
            name: name,
            text: text,
            date: formattedDate,
            timestamp: date.getTime(),
            replies: [] // Inicializamos el array de respuestas vacío
        };

        try {
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Enviando...';
            submitBtn.disabled = true;

            // Guardamos y obtenemos la referencia del documento creado
            const docRef = await addDoc(collection(db, "comentarios"), newComment);

            if (commentsList.querySelector('p.text-muted')) {
                commentsList.innerHTML = '';
            }
            
            // Pasamos el ID nuevo generado por Firebase para pintar el comentario
            addCommentToDOM(docRef.id, newComment);
            commentForm.reset();

        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error al guardar comentario.");
        } finally {
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Enviar Comentario';
            submitBtn.disabled = false;
        }
    });

    // --- FUNCIONES GLOBALES PARA RESPUESTAS ---
    // (Necesarias para que el HTML onclick las encuentre)

    window.toggleReplyForm = (id) => {
        const form = document.getElementById(`reply-form-${id}`);
        if (form.style.display === "none") {
            form.style.display = "block";
        } else {
            form.style.display = "none";
        }
    };

    window.submitReply = async (parentId) => {
        const nameInput = document.getElementById(`reply-name-${parentId}`);
        const textInput = document.getElementById(`reply-text-${parentId}`);
        
        const name = nameInput.value.trim();
        const text = textInput.value.trim();

        if (!name || !text) {
            alert("Por favor llena nombre y mensaje.");
            return;
        }

        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()} a las ${date.toLocaleTimeString()}`;

        // Objeto respuesta
        const replyData = {
            name: name,
            text: text,
            date: formattedDate,
            timestamp: date.getTime()
        };

        try {
            // Referencia al comentario original
            const commentRef = doc(db, "comentarios", parentId);

            // ATÓMICO: Actualizamos el documento agregando la respuesta al array "replies"
            await updateDoc(commentRef, {
                replies: arrayUnion(replyData)
            });

            // Actualizar UI manualmente para no recargar toda la lista
            const repliesContainer = document.getElementById(`replies-container-${parentId}`);
            const newReplyHTML = `
                <div class="respuesta-item" style="margin-left: 30px; border-left: 2px solid #ccc; padding-left: 10px; margin-top: 5px; background: #f9f9f9; padding: 8px; border-radius: 4px;">
                    <strong>${sanitize(name)}</strong> <small class="text-muted">- ${formattedDate}</small>
                    <p class="mb-0">${sanitize(text)}</p>
                </div>
            `;
            repliesContainer.innerHTML += newReplyHTML;

            // Limpiar
            nameInput.value = "";
            textInput.value = "";
            window.toggleReplyForm(parentId); // Ocultar form

        } catch (error) {
            console.error("Error al responder:", error);
            alert("No se pudo enviar la respuesta.");
        }
    };

    // Carga inicial
    loadComments();
});