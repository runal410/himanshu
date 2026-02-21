const form = document.getElementById('book-form');
const bookList = document.getElementById('book-list');
const searchInput = document.getElementById('search');
const message = document.getElementById('form-message');
const emptyState = document.getElementById('empty-state');

const totalCount = document.getElementById('total-count');
const availableCount = document.getElementById('available-count');
const issuedCount = document.getElementById('issued-count');

let books = JSON.parse(localStorage.getItem('library-books') || '[]');

function saveBooks() {
  localStorage.setItem('library-books', JSON.stringify(books));
}

function updateStats() {
  const total = books.length;
  const available = books.filter((book) => book.status === 'Available').length;
  totalCount.textContent = total;
  availableCount.textContent = available;
  issuedCount.textContent = total - available;
}

function renderBooks(query = '') {
  const q = query.toLowerCase().trim();
  const filtered = books.filter((book) =>
    [book.title, book.author, book.category, book.isbn]
      .some((v) => v.toLowerCase().includes(q))
  );

  bookList.innerHTML = '';

  filtered.forEach((book) => {
    const tr = document.createElement('tr');
    const badgeClass = book.status === 'Available' ? 'available' : 'issued';
    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.category}</td>
      <td>${book.isbn}</td>
      <td><span class="badge ${badgeClass}">${book.status}</span></td>
      <td><button class="secondary" data-action="toggle" data-id="${book.id}">${book.status === 'Available' ? 'Issue' : 'Return'}</button></td>
      <td><button data-action="delete" data-id="${book.id}">Delete</button></td>
    `;
    bookList.appendChild(tr);
  });

  emptyState.style.display = filtered.length ? 'none' : 'block';
  updateStats();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const book = {
    id: crypto.randomUUID(),
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value.trim(),
    category: document.getElementById('category').value.trim(),
    isbn: document.getElementById('isbn').value.trim(),
    status: 'Available',
  };

  if (books.some((item) => item.isbn.toLowerCase() === book.isbn.toLowerCase())) {
    message.textContent = 'ISBN already exists.';
    return;
  }

  books.unshift(book);
  saveBooks();
  form.reset();
  message.textContent = 'Book added successfully.';
  renderBooks(searchInput.value);
});

bookList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const { action, id } = target.dataset;
  const index = books.findIndex((book) => book.id === id);
  if (index < 0) return;

  if (action === 'toggle') {
    books[index].status = books[index].status === 'Available' ? 'Issued' : 'Available';
  }

  if (action === 'delete') {
    books.splice(index, 1);
  }

  saveBooks();
  renderBooks(searchInput.value);
});

searchInput.addEventListener('input', () => {
  renderBooks(searchInput.value);
});

renderBooks();
