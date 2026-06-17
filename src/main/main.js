// ==========================================
// IMPORTS & SETUP
// ==========================================
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let db;

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
function initDB() {
    const dbPath = path.join(app.getPath('userData'), 'final.db');
    db = new Database(dbPath);

    db.prepare(`
        CREATE TABLE IF NOT EXISTS notas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            nota INTEGER,
            feito INTEGER NOT NULL CHECK (feito IN (0, 1)),
            disciplina TEXT
        )
    `).run();

    // // Ensure 'disciplina' column exists on notas (migration for older DBs)
    // try {
    //     const cols = db.prepare("PRAGMA table_info(notas)").all();
    //     const hasDisciplina = cols.some(c => c.name === 'disciplina');
    //     if (!hasDisciplina) {
    //         db.prepare("ALTER TABLE notas ADD COLUMN disciplina TEXT").run();
    //     }
    // } catch (e) {
    //     console.error('Erro ao garantir coluna disciplina em notas:', e);
    // }

    db.prepare(`
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT,
            telefone TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS disciplinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            codigo TEXT,
            professor TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS professores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT,
            telefone TEXT
        )
    `).run();
}

// ==========================================
// WINDOW CREATION
// ==========================================
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

// ==========================================
// APP LIFECYCLE
// ==========================================
app.whenReady().then(() => {
    initDB();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// ==========================================
// IPC HANDLERS
// ==========================================

// --- NOTAS ---
ipcMain.handle('get-notas', (event) => {
    try {
        const notas = db.prepare('SELECT * FROM notas').all();
        return { success: true, notas };
    } catch (error) {
        console.error('Erro ao obter notas:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-nota', (event, { name, nota, feito, disciplina = null }) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO notas (name, nota, feito, disciplina)
            VALUES (?, ?, ?, ?)
        `);
        const result = stmt.run(name, nota, feito ? 1 : 0, disciplina);
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Erro ao guardar nota:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-nota', (event, { id, name, nota, feito, disciplina = null }) => {
    try {
        const stmt = db.prepare('UPDATE notas SET name = ?, nota = ?, feito = ?, disciplina = ? WHERE id = ?');
        stmt.run(name, nota, feito ? 1 : 0, disciplina, id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar nota:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-nota', (event, { id }) => {
    try {
        const stmt = db.prepare('DELETE FROM notas WHERE id = ?');
        stmt.run(id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao eliminar nota:', error);
        return { success: false, error: error.message };
    }
});

// --- ALUNOS ---
ipcMain.handle('get-alunos', (event, { page = 1, pageSize = 10, searchField, searchValue } = {}) => {
    try {
        const offset = (page - 1) * pageSize;

        // Build WHERE clause safely depending on search parameters
        let where = '';
        const params = [];

        if (searchField && searchValue != null && String(searchValue).trim() !== '') {
            if (searchField === 'id') {
                // search by exact id (integer)
                where = 'WHERE id = ?';
                params.push(parseInt(searchValue, 10) || 0);
            } else if (searchField === 'nome') {
                where = 'WHERE nome LIKE ?';
                params.push(`%${searchValue}%`);
            } else if (searchField === 'telefone') {
                where = 'WHERE telefone LIKE ?';
                params.push(`%${searchValue}%`);
            }
        }

        const sql = `SELECT * FROM alunos ${where} ORDER BY id ASC LIMIT ? OFFSET ?`;
        const stmt = db.prepare(sql);
        const alunos = stmt.all(...params, pageSize, offset);

        const countSql = `SELECT COUNT(*) as count FROM alunos ${where}`;
        const countStmt = db.prepare(countSql);
        const totalRow = countStmt.get(...params);
        const total = totalRow ? totalRow.count : 0;

        return { success: true, alunos, total };
    } catch (error) {
        console.error('Erro ao obter alunos:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('search-alunos', (event, { prefix = '', limit = 10 } = {}) => {
    try {
        const trimmed = String(prefix).trim();
        if (trimmed === '') {
            return { success: true, alunos: [] };
        }

        const stmt = db.prepare(
            'SELECT id, nome, email, telefone FROM alunos WHERE nome LIKE ? OR CAST(id AS TEXT) LIKE ? ORDER BY nome ASC LIMIT ?'
        );
        const alunos = stmt.all(`${trimmed}%`, `${trimmed}%`, limit);
        return { success: true, alunos };
    } catch (error) {
        console.error('Erro ao pesquisar alunos:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-aluno', (event, { nome, email, telefone }) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO alunos (nome, email, telefone)
            VALUES (?, ?, ?)
        `);
        const result = stmt.run(nome, email, telefone);
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Erro ao guardar aluno:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-aluno', (event, { id, nome, email, telefone }) => {
    try {
        const stmt = db.prepare('UPDATE alunos SET nome = ?, email = ?, telefone = ? WHERE id = ?');
        stmt.run(nome, email, telefone, id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-aluno', (event, { id }) => {
    try {
        const stmt = db.prepare('DELETE FROM alunos WHERE id = ?');
        stmt.run(id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao eliminar aluno:', error);
        return { success: false, error: error.message };
    }
});

// --- PROFESSORES ---

// --- PROFESSORES ---
ipcMain.handle('get-professores', (event, { page = 1, pageSize = 10, searchField, searchValue } = {}) => {
    try {
        const offset = (page - 1) * pageSize;

        let where = '';
        const params = [];

        if (searchField && searchValue != null && String(searchValue).trim() !== '') {
            if (searchField === 'id') {
                where = 'WHERE id = ?';
                params.push(parseInt(searchValue, 10) || 0);
            } else if (searchField === 'nome') {
                where = 'WHERE nome LIKE ?';
                params.push(`%${searchValue}%`);
            } else if (searchField === 'telefone') {
                where = 'WHERE telefone LIKE ?';
                params.push(`%${searchValue}%`);
            }
        }

        const sql = `SELECT * FROM professores ${where} ORDER BY id ASC LIMIT ? OFFSET ?`;
        const stmt = db.prepare(sql);
        const pessoas = stmt.all(...params, pageSize, offset);

        const countSql = `SELECT COUNT(*) as count FROM professores ${where}`;
        const countStmt = db.prepare(countSql);
        const totalRow = countStmt.get(...params);
        const total = totalRow ? totalRow.count : 0;

        return { success: true, professores: pessoas, total };
    } catch (error) {
        console.error('Erro ao obter professores:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('search-professores', (event, { prefix = '', limit = 10 } = {}) => {
    try {
        const trimmed = String(prefix).trim();
        if (trimmed === '') {
            return { success: true, professores: [] };
        }

        const stmt = db.prepare(
            'SELECT id, nome, email, telefone FROM professores WHERE nome LIKE ? OR CAST(id AS TEXT) LIKE ? ORDER BY nome ASC LIMIT ?'
        );
        const professores = stmt.all(`${trimmed}%`, `${trimmed}%`, limit);
        return { success: true, professores };
    } catch (error) {
        console.error('Erro ao pesquisar professores:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-professor', (event, { nome, email, telefone }) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO professores (nome, email, telefone)
            VALUES (?, ?, ?)
        `);
        const result = stmt.run(nome, email, telefone);
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Erro ao guardar professor:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-professor', (event, { id, nome, email, telefone }) => {
    try {
        const stmt = db.prepare('UPDATE professores SET nome = ?, email = ?, telefone = ? WHERE id = ?');
        stmt.run(nome, email, telefone, id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar professor:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-professor', (event, { id }) => {
    try {
        const stmt = db.prepare('DELETE FROM professores WHERE id = ?');
        stmt.run(id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao eliminar professor:', error);
        return { success: false, error: error.message };
    }
});

// --- DISCIPLINAS ---
ipcMain.handle('get-disciplinas', (event) => {
    try {
        const disciplinas = db.prepare('SELECT * FROM disciplinas ORDER BY id ASC').all();
        return { success: true, disciplinas };
    } catch (error) {
        console.error('Erro ao obter disciplinas:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('save-disciplina', (event, { nome, codigo, professor }) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO disciplinas (nome, codigo, professor)
            VALUES (?, ?, ?)
        `);
        const result = stmt.run(nome, codigo, professor);
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Erro ao guardar disciplina:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-disciplina', (event, { id, nome, codigo, professor }) => {
    try {
        const stmt = db.prepare('UPDATE disciplinas SET nome = ?, codigo = ?, professor = ? WHERE id = ?');
        stmt.run(nome, codigo, professor, id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar disciplina:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-disciplina', (event, { id }) => {
    try {
        const stmt = db.prepare('DELETE FROM disciplinas WHERE id = ?');
        stmt.run(id);
        return { success: true };
    } catch (error) {
        console.error('Erro ao eliminar disciplina:', error);
        return { success: false, error: error.message };
    }
});

// ==========================================
// APP SHUTDOWN
// ==========================================
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});