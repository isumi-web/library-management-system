// routes.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

// PostgreSQL Pool setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// --- Utility Functions ---

async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

// Middleware to check authentication (basic placeholder - replace with actual JWT validation)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn('Authentication: No token provided.');
        return res.status(401).json({ message: 'Access denied. No token provided.' }); // Changed to json()
    }

    // This is a placeholder. In a real app, use jsonwebtoken to verify:
    // jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    //     if (err) {
    //         console.warn('Authentication: Invalid token.', err.message);
    //         return res.status(403).json({ message: 'Invalid token.' });
    //     }
    //     req.user = user;
    //     next();
    // });

    console.log('Authentication: Token present (placeholder validation).');
    next();
};

// Enable CORS for this router
router.use(cors());

// --- User Routes ---

// Register a new user
router.post('/register', async (req, res) => {
    console.log('Received POST /register:', req.body);
    const { username, password, email, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required.' }); // Changed to json()
    }
    try {
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(
            'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, hashedPassword, email || null, role]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error in POST /register:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Username or email already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: 'Server Error during registration.' }); // Changed to json()
        }
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('Received POST /login:', req.body);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' }); // Changed to json()
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid username or password.' }); // Changed to json()
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid username or password.' }); // Changed to json()
        res.json({ id: user.id, username: user.username, role: user.role, message: 'Login successful' });
    } catch (err) {
        console.error('Error in POST /login:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error during login.' }); // Changed to json()
    }
});

// Get all users
router.get('/users', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching all users');
        const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /users:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching users.' }); // Changed to json()
    }
});

// Get user by ID
router.get('/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching user with ID: ${id}`);
    try {
        const result = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /users/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching user by ID.' }); // Changed to json()
    }
});

// Update user
router.put('/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    console.log(`Received PUT /users/${id}:`, req.body);
    const { username, email, role } = req.body;
    if (!username || !role) {
        return res.status(400).json({ message: 'Username and role are required for update.' }); // Changed to json()
    }
    try {
        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, username, email, role, created_at',
            [username, email || null, role, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in PUT /users/:id:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Username or email already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: 'Server Error updating user.' }); // Changed to json()
        }
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting user with ID: ${id}`);
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' }); // Changed to json()
        res.status(200).json({ message: 'User deleted successfully.' }); // Changed to json()
    } catch (err) {
        console.error('Error in DELETE /users/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error deleting user.' }); // Changed to json()
    }
});

// --- Books Routes ---

// Get all books
router.get('/books', async (req, res) => {
    try {
        console.log('Fetching all books');
        const result = await pool.query('SELECT * FROM books ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /books:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching books.' }); // Changed to json()
    }
});

// Add a new book
router.post('/books', async (req, res) => {
    console.log('Received POST /books:', req.body);
    const { title, author, isbn, category, status, quantity, description } = req.body;
    if (!title || !author || !isbn || !category || status === undefined || quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'Title, author, ISBN, category, status, and a non-negative quantity are required.' }); // Changed to json()
    }
    try {
        const result = await pool.query(
            'INSERT INTO books (title, author, isbn, category, status, quantity, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, author, isbn, category, status, quantity, description || null]
        );
        console.log('Book inserted successfully:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error in POST /books:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Book with this ISBN already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: `Server Error: ${err.message || 'Database insertion failed'}` }); // Changed to json()
        }
    }
});

// Get book by ID
router.get('/books/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching book with ID: ${id}`);
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Book not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /books/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching book by ID.' }); // Changed to json()
    }
});

// Update book
router.put('/books/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Received PUT /books/${id}:`, req.body);
    const { title, author, isbn, category, status, quantity, description } = req.body;
    if (!title || !author || !isbn || !category || status === undefined || quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'All book fields (including a non-negative quantity) are required for update.' }); // Changed to json()
    }
    try {
        const result = await pool.query(
            'UPDATE books SET title = $1, author = $2, isbn = $3, category = $4, status = $5, quantity = $6, description = $7 WHERE id = $8 RETURNING *',
            [title, author, isbn, category, status, quantity, description || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Book not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in PUT /books/:id:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Book with this ISBN already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: `Server Error: ${err.message || 'Database update failed'}` }); // Changed to json()
        }
    }
});

// Delete book
router.delete('/books/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete book with ID: ${id}`);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const activeTransactions = await client.query(
            'SELECT id FROM transactions WHERE book_id = $1 AND status = $2',
            [id, 'Active']
        );

        if (activeTransactions.rows.length > 0) {
            await client.query('ROLLBACK');
            console.warn(`Attempted to delete book ${id} with active transactions.`);
            return res.status(400).json({ message: 'Cannot delete book: It has active borrowed transactions. Return all copies first.' }); // Changed to json()
        }

        const result = await client.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length > 0) {
            await client.query('COMMIT');
            console.log(`Book ${id} deleted successfully.`);
            res.status(200).json({ message: 'Book deleted successfully', deletedBook: result.rows[0] }); // Changed to json()
        } else {
            await client.query('ROLLBACK');
            console.warn(`Attempted to delete non-existent book ${id}.`);
            res.status(404).json({ message: 'Book not found.' }); // Changed to json()
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in DELETE /books/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server error during book deletion.' }); // Changed to json()
    } finally {
        client.release();
    }
});


// --- Members Routes ---

// Get all members
router.get('/members', async (req, res) => {
    try {
        console.log('Fetching all members');
        const result = await pool.query('SELECT * FROM members ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /members:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching members.' }); // Changed to json()
    }
});

// Add a new member
router.post('/members', async (req, res) => {
    console.log('Received POST /members:', req.body);
    const { name, member_id, email } = req.body;
    if (!name || !member_id) {
        return res.status(400).json({ message: 'Name and Member ID are required.' }); // Changed to json()
    }
    try {
        const result = await pool.query(
            'INSERT INTO members (name, member_id, email) VALUES ($1, $2, $3) RETURNING *',
            [name, member_id, email || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error in POST /members:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Member ID or email already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: 'Server Error adding member.' }); // Changed to json()
        }
    }
});

// Get member by ID
router.get('/members/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching member with ID: ${id}`);
    try {
        const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Member not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /members/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching member by ID.' }); // Changed to json()
    }
});

// Update member
router.put('/members/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Received PUT /members/${id}:`, req.body);
    const { name, member_id, email } = req.body;
    if (!name || !member_id) {
        return res.status(400).json({ message: 'Name and Member ID are required for update.' }); // Changed to json()
    }
    try {
        const result = await pool.query(
            'UPDATE members SET name = $1, member_id = $2, email = $3 WHERE id = $4 RETURNING *',
            [name, member_id, email || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Member not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in PUT /members/:id:', err.message, err.stack);
        if (err.code === '23505') {
            res.status(409).json({ message: 'Member ID or email already exists.' }); // Changed to json()
        } else {
            res.status(500).json({ message: 'Server Error updating member.' }); // Changed to json()
        }
    }
});

// Delete member
router.delete('/members/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete member with ID: ${id}`);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const activeTransactions = await client.query(
            'SELECT id FROM transactions WHERE member_id = $1 AND status = $2',
            [id, 'Active']
        );

        if (activeTransactions.rows.length > 0) {
            await client.query('ROLLBACK');
            console.warn(`Attempted to delete member ${id} with active borrowed books.`);
            return res.status(400).json({ message: 'Cannot delete member: They have active borrowed books. Ensure all books are returned.' }); // Changed to json()
        }

        const result = await client.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            console.warn(`Attempted to delete non-existent member ${id}.`);
            return res.status(404).json({ message: 'Member not found.' }); // Changed to json()
        }

        await client.query('COMMIT');
        console.log(`Member ${id} deleted successfully.`);
        res.status(200).json({ message: 'Member deleted successfully.' }); // Changed to json()
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in DELETE /members/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error deleting member.' }); // Changed to json()
    } finally {
        client.release();
    }
});


// --- Transactions Routes ---

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        console.log('Fetching all transactions');
        const result = await pool.query(`
            SELECT
                t.id,
                t.transaction_type,
                t.transaction_date,
                t.due_date,
                t.return_date,
                t.status,
                b.title AS book_title,
                b.author AS book_author,
                m.name AS member_name,
                m.member_id AS member_unique_id
            FROM
                transactions t
            JOIN
                books b ON t.book_id = b.id
            JOIN
                members m ON t.member_id = m.id
            ORDER BY t.transaction_date DESC;
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /transactions:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching transactions.' }); // Changed to json()
    }
});

// Get transaction by ID
router.get('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching transaction with ID: ${id}`);
    try {
        const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /transactions/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error fetching transaction by ID.' }); // Changed to json()
    }
});

// Borrow a book
router.post('/transactions/borrow', async (req, res) => {
    console.log('Received POST /transactions/borrow:', req.body);
    const { book_id, member_id, due_date } = req.body;

    if (!book_id || !member_id || !due_date) {
        return res.status(400).json({ message: 'Book ID, Member ID, and Due Date are required.' });
    }

    const parsedBookId = parseInt(book_id, 10);
    const parsedMemberId = parseInt(member_id, 10);

    if (isNaN(parsedBookId) || isNaN(parsedMemberId)) {
        return res.status(400).json({ message: 'Book ID and Member ID must be valid numbers.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const bookResult = await client.query('SELECT id, quantity, status FROM books WHERE id = $1 FOR UPDATE', [parsedBookId]);
        const book = bookResult.rows[0];

        if (!book) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Book not found.' });
        }
        if (book.quantity <= 0 || book.status !== 'Available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Book is currently unavailable or out of stock.' });
        }

        const memberResult = await client.query('SELECT id FROM members WHERE id = $1', [parsedMemberId]);
        if (memberResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found.' });
        }

        const transactionResult = await client.query(
            'INSERT INTO transactions (book_id, member_id, transaction_type, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [parsedBookId, parsedMemberId, 'Borrow', due_date, 'Active']
        );

        await client.query('UPDATE books SET quantity = quantity - 1, status = CASE WHEN quantity - 1 > 0 THEN \'Available\' ELSE \'Unavailable\' END WHERE id = $1', [parsedBookId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Book borrowed successfully', transaction: transactionResult.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in POST /transactions/borrow:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error during borrow operation.', error: err.message });
    } finally {
        client.release();
    }
});

// Return a book
router.post('/transactions/return', async (req, res) => {
    console.log('Received POST /transactions/return:', req.body);
    const { transaction_id } = req.body;

    if (!transaction_id) {
        return res.status(400).json({ message: 'Transaction ID is required.' });
    }
    const parsedTransactionId = parseInt(transaction_id, 10);
    if (isNaN(parsedTransactionId)) {
        return res.status(400).json({ message: 'Transaction ID must be a valid number.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const transactionResult = await client.query(
            'SELECT id, book_id, status FROM transactions WHERE id = $1 AND transaction_type = $2 AND status = $3 FOR UPDATE',
            [parsedTransactionId, 'Borrow', 'Active']
        );
        const transaction = transactionResult.rows[0];

        if (!transaction) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Active borrow transaction not found for this ID.' });
        }

        const updateTransactionResult = await client.query(
            'UPDATE transactions SET status = $1, return_date = NOW() WHERE id = $2 RETURNING *',
            ['Completed', parsedTransactionId]
        );

        const bookId = transaction.book_id;
        await client.query(
            'UPDATE books SET quantity = quantity + 1, status = \'Available\' WHERE id = $1',
            [bookId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Book returned successfully', transaction: updateTransactionResult.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in POST /transactions/return:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error during return operation.', error: err.message });
    } finally {
        client.release();
    }
});

// Update transaction (consider carefully if this should be allowed for borrow/return transactions)
router.put('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Received PUT /transactions/${id}:`, req.body);
    const { book_id, member_id, transaction_type, due_date, status, transaction_date, return_date } = req.body;

    if (!book_id || !member_id || !transaction_type || !status) {
        return res.status(400).json({ message: 'Book ID, Member ID, Type, and Status are required for update.' }); // Changed to json()
    }

    try {
        const result = await pool.query(
            'UPDATE transactions SET book_id = $1, member_id = $2, transaction_type = $3, due_date = $4, status = $5, transaction_date = $6, return_date = $7 WHERE id = $8 RETURNING *',
            [book_id, member_id, transaction_type, due_date || null, status, transaction_date || 'NOW()', return_date || null, id] // Changed NOW() to 'NOW()' for string literal
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Transaction not found.' }); // Changed to json()
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in PUT /transactions/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error updating transaction.' }); // Changed to json()
    }
});

// Delete transaction
router.delete('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete transaction with ID: ${id}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const transactionCheck = await client.query('SELECT book_id, status, transaction_type FROM transactions WHERE id = $1 FOR UPDATE', [id]);

        if (transactionCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            console.warn(`Attempted to delete non-existent transaction ${id}.`);
            return res.status(404).json({ message: 'Transaction not found.' }); // Changed to json()
        }

        const transaction = transactionCheck.rows[0];

        if (transaction.transaction_type === 'Borrow' && transaction.status === 'Active') {
            await client.query('UPDATE books SET quantity = quantity + 1, status = $1 WHERE id = $2', ['Available', transaction.book_id]);
            console.log(`Incremented quantity for book ${transaction.book_id} due to deletion of active borrow transaction ${id}`);
        }

        const result = await client.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            console.warn(`Transaction ${id} not found after initial check during deletion attempt.`);
            return res.status(404).json({ message: 'Transaction not found after check.' }); // Changed to json()
        }

        await client.query('COMMIT');
        console.log(`Transaction ${id} deleted successfully.`);
        res.status(200).json({ message: 'Transaction deleted successfully.' }); // Changed to json()
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in DELETE /transactions/:id:', err.message, err.stack);
        res.status(500).json({ message: 'Server Error deleting transaction.' }); // Changed to json()
    } finally {
        client.release();
    }
});


// Export the router
module.exports = router;