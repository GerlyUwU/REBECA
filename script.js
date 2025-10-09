document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');
    // Key for storing comments in localStorage
    const commentsStorageKey = 'gestaltComments';

    /**
     * Adds a comment object to the top of the comments list in the DOM.
     * @param {object} comment - The comment object with name, text, and date properties.
     */
    function addCommentToDOM(comment) {
        // Basic sanitization to prevent simple HTML injection.
        const safeName = comment.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeText = comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const commentElement = document.createElement('div');
        commentElement.classList.add('comment', 'mb-3');
        commentElement.innerHTML = `
            <p class="mb-1">
                <strong class="comment-author">${safeName}</strong>
                <span class="comment-date ms-2">- ${comment.date}</span>
            </p>
            <p class="mb-0">${safeText}</p>
        `;
        // Prepend adds the new element to the beginning of the list.
        commentsList.prepend(commentElement);
    }

    /**
     * Loads all comments from localStorage and renders them in the DOM.
     */
    function loadComments() {
        const comments = JSON.parse(localStorage.getItem(commentsStorageKey)) || [];
        if (comments.length > 0) {
            commentsList.innerHTML = ''; // Clear the initial "no comments" message
            
            // We iterate through the saved comments and add each one to the DOM.
            // Since we use prepend, the last comment in the array (the newest) will end up at the top.
            comments.forEach(comment => {
                addCommentToDOM(comment);
            });
        }
    }

    // --- Event listener for the comment form submission ---
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = commentNameInput.value.trim();
        const text = commentTextInput.value.trim();

        // The 'required' attribute in the HTML handles validation, but we check again.
        if (name === '' || text === '') {
            return;
        }
        
        // If the initial "no comments" message is present, clear it.
        if (commentsList.querySelector('p.text-muted')) {
            commentsList.innerHTML = '';
        }

        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()} a las ${date.toLocaleTimeString()}`;

        const newComment = {
            name: name,
            text: text,
            date: formattedDate
        };

        // 1. Add the new comment to the page visually
        addCommentToDOM(newComment);

        // 2. Save the updated list to localStorage
        const comments = JSON.parse(localStorage.getItem(commentsStorageKey)) || [];
        comments.push(newComment);
        localStorage.setItem(commentsStorageKey, JSON.stringify(comments));

        // 3. Reset the form fields for the next comment
        commentForm.reset();
    });

    // --- Initial load of comments when the page is ready ---
    loadComments();
});

