document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    // Remove the initial message if there are comments
    let firstComment = true;

    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = commentNameInput.value.trim();
        const text = commentTextInput.value.trim();

        if (name === '' || text === '') {
            alert('Por favor, completa todos los campos.');
            return;
        }

        if (firstComment) {
            commentsList.innerHTML = ''; // Clear the initial message
            firstComment = false;
        }

        // Create comment element
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment', 'mb-3');

        const date = new Date();
        const formattedDate = `${date.toLocaleDateString()} a las ${date.toLocaleTimeString()}`;

        commentElement.innerHTML = `
            <p class="mb-1">
                <strong class="comment-author">${name}</strong>
                <span class="comment-date ms-2">- ${formattedDate}</span>
            </p>
            <p class="mb-0">${text}</p>
        `;

        // Add the new comment to the top of the list
        commentsList.prepend(commentElement);

        // Clear form fields
        commentNameInput.value = '';
        commentTextInput.value = '';
    });
});
