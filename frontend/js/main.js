document.addEventListener('DOMContentLoaded', async () => {
  const booksTableBody = document.getElementById('booksTableBody');
  const addBookBtn = document.getElementById('addBookBtn');
  const addBookModal = document.getElementById('addBookModal');
  const closeBtn = document.querySelectorAll('.close-btn');
  const addBookForm = document.getElementById('addBookForm');
  const searchInput = document.getElementById('searchInput');
  const membersSection = document.getElementById('membersSection');
  const membersTableBody = document.getElementById('membersTableBody');
  const addMemberBtn = document.getElementById('addMemberBtn');
  const transactionsSection = document.getElementById('transactionsSection');
  const transactionsTableBody = document.getElementById('transactionsTableBody');
  const borrowBookBtn = document.getElementById('borrowBookBtn');
  const returnBookBtn = document.getElementById('returnBookBtn');
  const userManagementModal = document.getElementById('userManagementModal');
  const userForm = document.getElementById('userForm');
  const usersTableBody = document.getElementById('usersTableBody');

  // Load books
  async function loadBooks() {
    try {
      const response = await fetch('http://localhost:5000/api/books');
      const books = await response.json();
      booksTableBody.innerHTML = '';
      books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${book.id || 'N/A'}</td>
          <td>${book.isbn || 'N/A'}</td>
          <td>${book.title || 'N/A'}</td>
          <td>${book.author || 'N/A'}</td>
          <td>${book.category || 'N/A'}</td>
          <td><span class="status ${book.status?.toLowerCase() || 'unknown'}">${book.status || 'Unknown'}</span></td>
          <td>
            <button class="action-btn view"><i class="fas fa-eye"></i> View</button>
            <button class="action-btn edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        booksTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  }

  // Load members
  async function loadMembers() {
    try {
      const response = await fetch('http://localhost:5000/api/members');
      const members = await response.json();
      membersTableBody.innerHTML = '';
      members.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${member.id || 'N/A'}</td>
          <td>${member.member_id || 'N/A'}</td>
          <td>${member.name || 'N/A'}</td>
          <td>${member.email || 'N/A'}</td>
          <td>
            <button class="action-btn edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        membersTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }

  // Load transactions
  async function loadTransactions() {
    try {
      const response = await fetch('http://localhost:5000/api/transactions');
      const transactions = await response.json();
      transactionsTableBody.innerHTML = '';
      transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${transaction.id || 'N/A'}</td>
          <td>${transaction.book_id || 'N/A'}</td>
          <td>${transaction.member_id || 'N/A'}</td>
          <td>${transaction.transaction_type || 'N/A'}</td>
          <td>${new Date(transaction.transaction_date).toLocaleDateString() || 'N/A'}</td>
          <td>${transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : 'N/A'}</td>
          <td><span class="status ${transaction.status?.toLowerCase() || 'unknown'}">${transaction.status || 'Unknown'}</span></td>
          <td>
            <button class="action-btn edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        transactionsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }

  // Load users
  async function loadUsers() {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': 'Bearer <token>' }
      });
      const users = await response.json();
      usersTableBody.innerHTML = '';
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id || 'N/A'}</td>
          <td>${user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.role || 'N/A'}</td>
          <td>
            <button class="action-btn edit"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-btn delete"><i class="fas fa-trash"></i> Delete</button>
          </td>
        `;
        usersTableBody.appendChild(row);
      });
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  // Update dashboard stats
  async function updateDashboardStats() {
    try {
      const booksResponse = await fetch('http://localhost:5000/api/books');
      const books = await booksResponse.json();
      document.getElementById('totalBooks').textContent = `Total Books: ${books.length}`;

      const membersResponse = await fetch('http://localhost:5000/api/members');
      const members = await membersResponse.json();
      const activeMembers = members.filter(m => m.status === 'Active' || !m.status).length;
      document.getElementById('activeMembers').textContent = `Active Members: ${activeMembers}`;

      const transactionsResponse = await fetch('http://localhost:5000/api/transactions');
      const transactions = await transactionsResponse.json();
      const borrowedBooks = transactions.filter(t => t.status === 'Active' && t.transaction_type === 'Borrow').length;
      document.getElementById('booksBorrowed').textContent = borrowedBooks;
      const overdueBooks = transactions.filter(t => t.status === 'Active' && new Date(t.due_date) < new Date() && t.transaction_type === 'Borrow').length;
      document.getElementById('overdueBooks').textContent = overdueBooks;
    } catch (err) {
      console.error('Error updating dashboard stats:', err);
    }
  }

  // Initial load
  loadBooks();
  updateDashboardStats();

  // Search functionality
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const rows = booksTableBody.getElementsByTagName('tr');
    Array.from(rows).forEach(row => {
      const [idCell, isbnCell, titleCell, authorCell, categoryCell, statusCell] = row.cells;
      const text = [isbnCell, titleCell, authorCell, categoryCell, statusCell].map(cell => cell.textContent.toLowerCase()).join(' ');
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });

  // Show modals
  addBookBtn.addEventListener('click', () => addBookModal.style.display = 'block');
  addMemberBtn.addEventListener('click', () => document.getElementById('addMemberModal').style.display = 'block');
  borrowBookBtn.addEventListener('click', () => {
    document.getElementById('transactionModalTitle').textContent = 'Borrow Book';
    document.getElementById('dueDateGroup').style.display = 'block';
    document.getElementById('transactionIdGroup').style.display = 'none';
    document.getElementById('addTransactionModal').style.display = 'block';
  });
  returnBookBtn.addEventListener('click', () => {
    document.getElementById('transactionModalTitle').textContent = 'Return Book';
    document.getElementById('dueDateGroup').style.display = 'none';
    document.getElementById('transactionIdGroup').style.display = 'block';
    document.getElementById('addTransactionModal').style.display = 'block';
  });
  document.querySelector('[data-section="users"]')?.addEventListener('click', () => {
    document.querySelectorAll('.table-section').forEach(section => section.style.display = 'none');
    document.getElementById('usersSection').style.display = 'block';
    userManagementModal.style.display = 'block';
    document.getElementById('userModalTitle').textContent = 'Register New User';
    userForm.dataset.action = 'register';
    document.getElementById('toggleLoginBtn').style.display = 'inline';
    loadUsers();
  });

  // Close modal
  closeBtn.forEach(btn => {
    btn.addEventListener('click', () => {
      addBookModal.style.display = 'none';
      document.getElementById('addMemberModal').style.display = 'none';
      document.getElementById('addTransactionModal').style.display = 'none';
      userManagementModal.style.display = 'none';
      addBookForm.reset();
      document.getElementById('addMemberForm').reset();
      document.getElementById('addTransactionForm').reset();
      userForm.reset();
      delete addBookForm.dataset.editing;
    });
  });

  // Handle form submissions
  addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookData = {
      title: document.getElementById('bookTitle').value,
      author: document.getElementById('author').value,
      isbn: document.getElementById('isbn').value,
      category: document.getElementById('category').value,
      status: document.getElementById('status').value,
      quantity: document.getElementById('quantity').value,
      description: document.getElementById('description').value
    };
    if (!bookData.title || !bookData.author || !bookData.isbn || !bookData.category || !bookData.status) {
      alert('All fields except quantity and description are required.');
      return;
    }
    const response = await fetch('http://localhost:5000/api/books');
    const books = await response.json();
    if (books.some(b => b.isbn === bookData.isbn && (!addBookForm.dataset.editing || b.id !== addBookForm.dataset.editing))) {
      alert('ISBN must be unique.');
      return;
    }
    try {
      const url = addBookForm.dataset.editing ? `http://localhost:5000/api/books/${addBookForm.dataset.editing}` : 'http://localhost:5000/api/books';
      const method = addBookForm.dataset.editing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (response.ok) {
        loadBooks();
        addBookModal.style.display = 'none';
        addBookForm.reset();
        delete addBookForm.dataset.editing;
        updateDashboardStats();
        alert(`${method === 'POST' ? 'Book added' : 'Book updated'} successfully!`);
      } else {
        const errorText = await response.text();
        alert(`Failed to ${method === 'POST' ? 'add' : 'update'} book: ${errorText || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error in book submission:', err);
      alert('Error adding/updating book.');
    }
  });

  document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberData = {
      name: document.getElementById('memberName').value,
      member_id: document.getElementById('memberId').value,
      email: document.getElementById('memberEmail').value
    };
    if (!memberData.name || !memberData.member_id) {
      alert('Name and Member ID are required.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      });
      if (response.ok) {
        loadMembers();
        document.getElementById('addMemberModal').style.display = 'none';
        document.getElementById('addMemberForm').reset();
        updateDashboardStats();
        alert('Member added successfully!');
      } else {
        const errorText = await response.text();
        alert(`Failed to add member: ${errorText}`);
      }
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Error adding member.');
    }
  });

  document.getElementById('addTransactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const action = document.getElementById('transactionModalTitle').textContent === 'Borrow Book' ? 'borrow' : 'return';
    const dueDateGroup = document.getElementById('dueDateGroup');
    const transactionIdGroup = document.getElementById('transactionIdGroup');

    // Dynamically toggle required attributes
    document.getElementById('transactionDueDate').required = (action === 'borrow' && dueDateGroup.style.display !== 'none');
    document.getElementById('transactionId').required = (action === 'return' && transactionIdGroup.style.display !== 'none');

    const transactionData = {
      book_id: document.getElementById('transactionBookId').value,
      member_id: document.getElementById('transactionMemberId').value,
      due_date: action === 'borrow' && dueDateGroup.style.display !== 'none' ? document.getElementById('transactionDueDate').value : undefined,
      transaction_id: action === 'return' && transactionIdGroup.style.display !== 'none' ? document.getElementById('transactionId').value : undefined
    };
    console.log('Action:', action);
    console.log('Transaction data:', transactionData);
    if (action === 'borrow' && (!transactionData.book_id || !transactionData.member_id || !transactionData.due_date)) {
      alert('Book ID, Member ID, and Due Date are required for borrowing.');
      return;
    } else if (action === 'return' && !transactionData.transaction_id) {
      alert('Transaction ID is required for returning.');
      return;
    }
    try {
      const url = `http://localhost:5000/api/transactions/${action}`;
      console.log('Sending request to:', url, 'with data:', JSON.stringify(transactionData));
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      if (response.ok) {
        loadTransactions();
        document.getElementById('addTransactionModal').style.display = 'none';
        document.getElementById('addTransactionForm').reset();
        loadBooks(); // Update book status
        updateDashboardStats();
        alert(`${action === 'borrow' ? 'Book borrowed' : 'Book returned'} successfully!`);
      } else {
        alert(`Failed to ${action} book: ${responseText || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing transaction:`, err);
      alert(`Error ${action}ing book. Check console for details.`);
    }
  });

  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const action = userForm.dataset.action;
    const data = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      email: document.getElementById('email').value,
      role: document.getElementById('role').value
    };
    try {
      const url = action === 'register' ? 'http://localhost:5000/api/register' : 'http://localhost:5000/api/login';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const result = await response.json();
        if (action === 'register') {
          loadUsers();
          alert('User registered successfully!');
        } else {
          alert('Login successful!');
          document.querySelector('.user-info span').textContent = result.username;
        }
        userManagementModal.style.display = 'none';
        userForm.reset();
      } else {
        const errorText = await response.text();
        alert(`Failed to ${action}: ${errorText}`);
      }
    } catch (err) {
      console.error(`Error in ${action}:`, err);
      alert(`Error during ${action}.`);
    }
  });

  document.getElementById('toggleLoginBtn').addEventListener('click', () => {
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    if (title.textContent === 'Register New User') {
      title.textContent = 'Login';
      form.dataset.action = 'login';
      document.querySelectorAll('#userForm .form-group').forEach(group => {
        if (group.querySelector('#email') || group.querySelector('#role')) group.style.display = 'none';
      });
      document.getElementById('toggleLoginBtn').textContent = 'Switch to Register';
    } else {
      title.textContent = 'Register New User';
      form.dataset.action = 'register';
      document.querySelectorAll('#userForm .form-group').forEach(group => group.style.display = '');
      document.getElementById('toggleLoginBtn').textContent = 'Switch to Login';
    }
  });

  [booksTableBody, membersTableBody, transactionsTableBody, usersTableBody].forEach(tableBody => {
    tableBody.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      const id = row.cells[0].textContent;
      const isBooks = tableBody === booksTableBody;
      const isMembers = tableBody === membersTableBody;
      const isTransactions = tableBody === transactionsTableBody;
      const isUsers = tableBody === usersTableBody;
      if (e.target.closest('.view')) {
        alert(`${isBooks ? 'View book' : isMembers ? 'View member' : isTransactions ? 'View transaction' : 'View user'} details here!`);
      } else if (e.target.closest('.edit')) {
        try {
          const url = isBooks ? '/books' : isMembers ? '/members' : isTransactions ? '/transactions' : '/users';
          const response = await fetch(`http://localhost:5000/api${url}/${id}`);
          const item = await response.json();
          if (item) {
            if (isBooks) {
              document.getElementById('bookTitle').value = item.title || '';
              document.getElementById('author').value = item.author || '';
              document.getElementById('isbn').value = item.isbn || '';
              document.getElementById('category').value = item.category || '';
              document.getElementById('status').value = item.status || '';
              document.getElementById('quantity').value = item.quantity || '';
              document.getElementById('description').value = item.description || '';
              addBookModal.style.display = 'block';
              addBookForm.dataset.editing = id;
            } else if (isMembers) {
              document.getElementById('memberName').value = item.name || '';
              document.getElementById('memberId').value = item.member_id || '';
              document.getElementById('memberEmail').value = item.email || '';
              document.getElementById('addMemberModal').style.display = 'block';
            } else if (isTransactions) {
              document.getElementById('transactionBookId').value = item.book_id || '';
              document.getElementById('transactionMemberId').value = item.member_id || '';
              document.getElementById('transactionDueDate').value = item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '';
              document.getElementById('transactionId').value = item.id || '';
              document.getElementById('addTransactionModal').style.display = 'block';
            } else if (isUsers) {
              document.getElementById('username').value = item.username || '';
              document.getElementById('email').value = item.email || '';
              document.getElementById('role').value = item.role || 'user';
              userManagementModal.style.display = 'block';
              userForm.dataset.editing = id;
              document.getElementById('userModalTitle').textContent = 'Edit User';
              document.getElementById('toggleLoginBtn').style.display = 'none';
            }
          } else {
            alert(`${isBooks ? 'Book' : isMembers ? 'Member' : isTransactions ? 'Transaction' : 'User'} not found.`);
          }
        } catch (err) {
          console.error(`Error fetching ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'} for edit:`, err);
          alert(`Error loading ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'} for editing.`);
        }
      } else if (e.target.closest('.delete')) {
        if (confirm(`Are you sure you want to delete this ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'}?`)) {
          try {
            const url = isBooks ? '/books' : isMembers ? '/members' : isTransactions ? '/transactions' : '/users';
            const response = await fetch(`http://localhost:5000/api${url}/${id}`, { method: 'DELETE' });
            if (response.ok) {
              if (isBooks) loadBooks();
              else if (isMembers) loadMembers();
              else if (isTransactions) loadTransactions();
              else if (isUsers) loadUsers();
              updateDashboardStats();
              alert(`${isBooks ? 'Book' : isMembers ? 'Member' : isTransactions ? 'Transaction' : 'User'} deleted successfully!`);
            } else {
              const errorText = await response.text();
              alert(`Failed to delete ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'}: ${errorText}`);
            }
          } catch (err) {
            console.error(`Error deleting ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'}:`, err);
            alert(`Error deleting ${isBooks ? 'book' : isMembers ? 'member' : isTransactions ? 'transaction' : 'user'}.`);
          }
        }
      }
    });
  });

  document.querySelectorAll('.sidebar ul li').forEach(li => {
    li.addEventListener('click', () => {
      document.querySelectorAll('.table-section').forEach(section => section.style.display = 'none');
      const sectionId = li.getAttribute('data-section');
      if (sectionId === 'dashboard') {
        // Dashboard logic
      } else if (sectionId === 'books') {
        loadBooks();
        document.getElementById('booksSection').style.display = 'block';
      } else if (sectionId === 'members') {
        loadMembers();
        membersSection.style.display = 'block';
      } else if (sectionId === 'transactions') {
        loadTransactions();
        transactionsSection.style.display = 'block';
      } else if (sectionId === 'reports') {
        document.getElementById('reportsSection').style.display = 'block';
      } else if (sectionId === 'users') {
        loadUsers();
        document.getElementById('usersSection').style.display = 'block';
      }
      document.querySelectorAll('.sidebar ul li').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === addBookModal || e.target === document.getElementById('addMemberModal') || e.target === document.getElementById('addTransactionModal') || e.target === userManagementModal) {
      addBookModal.style.display = 'none';
      document.getElementById('addMemberModal').style.display = 'none';
      document.getElementById('addTransactionModal').style.display = 'none';
      userManagementModal.style.display = 'none';
      addBookForm.reset();
      document.getElementById('addMemberForm').reset();
      document.getElementById('addTransactionForm').reset();
      userForm.reset();
      delete addBookForm.dataset.editing;
      delete userForm.dataset.editing;
    }
  });
});