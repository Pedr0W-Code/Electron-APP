// ==========================================
// UI VIEW MANAGEMENT
// ==========================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    const nav = document.getElementById('mainNav');
    if (viewId === 'homeView') {
        if (nav) nav.classList.remove('active');
    } else {
        if (nav) nav.classList.add('active');
    }

    document.getElementById(viewId).classList.add('active');
}

// ==========================================
// STATE MANAGEMENT
// ==========================================
let notesCurrentPage = 1;
const notesPageSize = 50;
let notesSearchField = null;
let notesSearchValue = null;
let notesData = null;
let currentEditNotaId = null;

let studentsCurrentPage = 1;
const studentsPageSize = 10;
let studentsSearchField = null;
let studentsSearchValue = null;
let currentEditAlunoId = null;

let disciplinasCurrentPage = 1;
const disciplinasPageSize = 10;
let disciplinasSearchField = null;
let disciplinasSearchValue = null;
let disciplinasCache = null;
let currentEditDisciplinaId = null;

let professoresCurrentPage = 1;
const professoresPageSize = 10;
let professoresSearchField = null;
let professoresSearchValue = null;
let currentEditProfessorId = null;

function clearEditState() {
    currentEditNotaId = null;
    currentEditAlunoId = null;
    currentEditDisciplinaId = null;
    currentEditProfessorId = null;
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    showView('homeView');

    // ==========================================
    // NAVIGATION BUTTONS
    // ==========================================
    const addNotesBtn = document.getElementById('AddNotes');
    if (addNotesBtn) {
        addNotesBtn.addEventListener('click', () => {
            showView('addView');
        });
    }

    document.getElementById('navHomeBtn').addEventListener('click', () => {
        showView('homeView');
    });

    document.getElementById('navNotesBtn').addEventListener('click', async () => {
        await loadNotas(1);
        showView('viewNotes');
    });

    document.getElementById('navStudentsBtn').addEventListener('click', async () => {
        await loadStudents(1);
        showView('students');
    });

    document.getElementById('navDisciplinasBtn').addEventListener('click', async () => {
        await loadDisciplinas(1);
        showView('disciplinas');
    });

    document.getElementById('navProfessoresBtn').addEventListener('click', async () => {
        await loadProfessores(1);
        showView('professores');
    });

    // ==========================================
    // NOTAS SECTION
    // ==========================================
    async function loadNotas(page = 1) {
        notesCurrentPage = page;
        if (!notesData) {
            const res = await window.electronAPI.getNotas();
            if (!res.success) {
                const notesList = document.getElementById('notesList');
                notesList.innerHTML = '<li>Erro ao carregar notas</li>';
                console.error('Erro ao carregar notas:', res.error);
                return;
            }
            notesData = res.notas || [];
        }

        let filtered = notesData;
        if (notesSearchField && notesSearchValue) {
            const q = notesSearchValue.toLowerCase();
            filtered = notesData.filter(n => {
                if (notesSearchField === 'name') return (n.name || '').toLowerCase().includes(q);
                if (notesSearchField === 'disciplina') return (n.disciplina || '').toLowerCase().includes(q);
                if (notesSearchField === 'nota') return String(n.nota || '').toLowerCase().includes(q);
                if (notesSearchField === 'feito') return (n.feito ? 'feito' : 'não feito').toLowerCase().includes(q);
                return true;
            });
        }

        const notesBody = document.getElementById('notesBody');
        notesBody.innerHTML = '';
        if (filtered.length === 0) {
            notesBody.innerHTML = '<tr><td colspan="5">Nenhuma nota encontrada</td></tr>';
            return;
        }

        const start = (notesCurrentPage - 1) * notesPageSize;
        const pageItems = filtered.slice(start, start + notesPageSize);
        pageItems.forEach(nota => {
            const row = document.createElement('tr');
            const status = nota.feito ? '<span class="status done">✓</span>' : '<span class="status not-done">✗</span>';
            row.innerHTML = `
                <td>${nota.name || '-'}</td>
                <td>${nota.disciplina || '-'}</td>
                <td>${nota.nota != null ? nota.nota : '-'}</td>
                <td>${status}</td>
                <td class="table-actions-cell"><div class="table-actions">
                    <button class="btn-edit btn-action" data-action="edit" data-type="nota" data-id="${nota.id}">Editar</button>
                    <button class="btn-delete btn-action" data-action="delete" data-type="nota" data-id="${nota.id}">Eliminar</button>
                </div></td>
            `;
            notesBody.appendChild(row);
        });
    }

    document.getElementById('ViewNotes').addEventListener('click', async () => {
        await loadNotas(1);
        showView('viewNotes');
    });

    document.getElementById('notesSearchBtn').addEventListener('click', async () => {
        const field = document.getElementById('notesSearchField').value;
        const value = document.getElementById('notesSearchInput').value.trim();
        notesSearchField = value === '' ? null : field;
        notesSearchValue = value === '' ? null : value;
        await loadNotas(1);
    });

    document.getElementById('notesClearSearch').addEventListener('click', async () => {
        document.getElementById('notesSearchInput').value = '';
        notesSearchField = null;
        notesSearchValue = null;
        await loadNotas(1);
    });

    const addNotesFromViewBtn = document.getElementById('AddNotesFromView');
    if (addNotesFromViewBtn) {
        addNotesFromViewBtn.addEventListener('click', () => {
            document.getElementById('name').value = '';
            const discInp = document.getElementById('disciplinaInput');
            if (discInp) discInp.value = '';
            document.getElementById('nota').value = '';
            const cb = document.querySelector('#addView input[type="checkbox"]');
            if (cb) cb.checked = false;
            showView('addView');
        });
    }

    // ==========================================
    // ALUNOS SECTION
    // ==========================================
    async function loadStudents(page = 1) {
        studentsCurrentPage = page;
        const result = await window.electronAPI.getAlunos(page, studentsPageSize, studentsSearchField, studentsSearchValue);

        const studentsBody = document.getElementById('studentsBody');
        studentsBody.innerHTML = '';

        if (!result.success) {
            studentsBody.innerHTML = '<tr><td colspan="5">Erro ao carregar alunos</td></tr>';
            console.error('Erro ao carregar alunos: ', result.error);
        } else if (!result.alunos || result.alunos.length === 0) {
            studentsBody.innerHTML = '<tr><td colspan="5">Nenhum aluno encontrado</td></tr>';
        } else {
            result.alunos.forEach(aluno => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${aluno.id}</td>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email || '-'}</td>
                    <td>${aluno.telefone || '-'}</td>
                    <td class="table-actions-cell"><div class="table-actions">
                        <button class="btn-edit btn-action" data-action="edit" data-type="aluno" data-id="${aluno.id}">Editar</button>
                        <button class="btn-delete btn-action" data-action="delete" data-type="aluno" data-id="${aluno.id}">Eliminar</button>
                    </div></td>
                `;
                studentsBody.appendChild(row);
            });
        }

        const pageInfo = document.getElementById('studentsPageInfo');
        const prevBtn = document.getElementById('studentsPrev');
        const nextBtn = document.getElementById('studentsNext');

        const total = result && result.total ? result.total : 0;
        const totalPages = Math.max(1, Math.ceil(total / studentsPageSize));

        pageInfo.textContent = `Página ${studentsCurrentPage} / ${totalPages}`;
        prevBtn.disabled = studentsCurrentPage <= 1;
        nextBtn.disabled = studentsCurrentPage >= totalPages;
    }

    document.getElementById('ViewStudents').addEventListener('click', async () => {
        await loadStudents(1);
        showView('students');
    });

    document.getElementById('studentsSearchBtn').addEventListener('click', async () => {
        const field = document.getElementById('studentsSearchField').value;
        const value = document.getElementById('studentsSearchInput').value.trim();
        studentsSearchField = value === '' ? null : field;
        studentsSearchValue = value === '' ? null : value;
        await loadStudents(1);
    });

    document.getElementById('studentsClearSearch').addEventListener('click', async () => {
        document.getElementById('studentsSearchInput').value = '';
        studentsSearchField = null;
        studentsSearchValue = null;
        await loadStudents(1);
    });

    document.getElementById('studentsPrev').addEventListener('click', async () => {
        if (studentsCurrentPage > 1) {
            await loadStudents(studentsCurrentPage - 1);
        }
    });

    document.getElementById('studentsNext').addEventListener('click', async () => {
        const meta = await window.electronAPI.getAlunos(1, studentsPageSize, studentsSearchField, studentsSearchValue);
        const total = meta && meta.total ? meta.total : 0;
        const totalPages = Math.max(1, Math.ceil(total / studentsPageSize));
        if (studentsCurrentPage < totalPages) {
            await loadStudents(studentsCurrentPage + 1);
        }
    });

    // ==========================================
    // DISCIPLINAS SECTION
    // ==========================================
    async function loadDisciplinas(page = 1) {
        disciplinasCurrentPage = page;
        if (!disciplinasCache) {
            const result = await window.electronAPI.getDisciplinas();
            if (!result.success) {
                const disciplinasBody = document.getElementById('disciplinasBody');
                disciplinasBody.innerHTML = '<tr><td colspan="4">Erro ao carregar disciplinas</td></tr>';
                console.error('Erro ao carregar disciplinas:', result.error);
                return;
            }
            disciplinasCache = result.disciplinas || [];
        }

        let filtered = disciplinasCache;
        if (disciplinasSearchField && disciplinasSearchValue) {
            const q = disciplinasSearchValue.toLowerCase();
            filtered = disciplinasCache.filter(d => {
                if (disciplinasSearchField === 'nome') return (d.nome || '').toLowerCase().includes(q);
                if (disciplinasSearchField === 'codigo') return (d.codigo || '').toLowerCase().includes(q);
                if (disciplinasSearchField === 'professor') return (d.professor || '').toLowerCase().includes(q);
                return true;
            });
        }

        const disciplinasBody = document.getElementById('disciplinasBody');
        disciplinasBody.innerHTML = '';

        if (!filtered || filtered.length === 0) {
            disciplinasBody.innerHTML = '<tr><td colspan="5">Nenhuma disciplina encontrada</td></tr>';
            document.getElementById('disciplinasPageInfo').textContent = 'Página 1 / 1';
            document.getElementById('disciplinasPrev').disabled = true;
            document.getElementById('disciplinasNext').disabled = true;
            return;
        }

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / disciplinasPageSize));
        const start = (disciplinasCurrentPage - 1) * disciplinasPageSize;
        const pageItems = filtered.slice(start, start + disciplinasPageSize);

        pageItems.forEach(disciplina => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${disciplina.id}</td>
                <td>${disciplina.nome}</td>
                <td>${disciplina.codigo || '-'}</td>
                <td>${disciplina.professor || '-'}</td>
                <td class="table-actions-cell"><div class="table-actions">
                    <button class="btn-edit btn-action" data-action="edit" data-type="disciplina" data-id="${disciplina.id}">Editar</button>
                    <button class="btn-delete btn-action" data-action="delete" data-type="disciplina" data-id="${disciplina.id}">Eliminar</button>
                </div></td>
            `;
            disciplinasBody.appendChild(row);
        });

        document.getElementById('disciplinasPageInfo').textContent = `Página ${disciplinasCurrentPage} / ${totalPages}`;
        document.getElementById('disciplinasPrev').disabled = disciplinasCurrentPage <= 1;
        document.getElementById('disciplinasNext').disabled = disciplinasCurrentPage >= totalPages;
    }

    document.getElementById('ViewDisciplinas').addEventListener('click', async () => {
        await loadDisciplinas();
        showView('disciplinas');
    });

    document.getElementById('disciplinasSearchBtn').addEventListener('click', async () => {
        const field = document.getElementById('disciplinasSearchField').value;
        const value = document.getElementById('disciplinasSearchInput').value.trim();
        disciplinasSearchField = value === '' ? null : field;
        disciplinasSearchValue = value === '' ? null : value;
        await loadDisciplinas(1);
    });

    document.getElementById('disciplinasClearSearch').addEventListener('click', async () => {
        document.getElementById('disciplinasSearchInput').value = '';
        disciplinasSearchField = null;
        disciplinasSearchValue = null;
        await loadDisciplinas(1);
    });

    document.getElementById('disciplinasPrev').addEventListener('click', async () => {
        if (disciplinasCurrentPage > 1) await loadDisciplinas(disciplinasCurrentPage - 1);
    });

    document.getElementById('disciplinasNext').addEventListener('click', async () => {
        const filtered = (disciplinasSearchField && disciplinasSearchValue)
            ? (disciplinasCache || []).filter(d => {
                const q = disciplinasSearchValue.toLowerCase();
                if (disciplinasSearchField === 'nome') return (d.nome || '').toLowerCase().includes(q);
                if (disciplinasSearchField === 'codigo') return (d.codigo || '').toLowerCase().includes(q);
                if (disciplinasSearchField === 'professor') return (d.professor || '').toLowerCase().includes(q);
                return true;
            })
            : (disciplinasCache || []);
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / disciplinasPageSize));
        if (disciplinasCurrentPage < totalPages) await loadDisciplinas(disciplinasCurrentPage + 1);
    });

    // ==========================================
    // PROFESSORES SECTION
    // ==========================================
    async function loadProfessores(page = 1) {
        professoresCurrentPage = page;
        const result = await window.electronAPI.getProfessores(page, professoresPageSize, professoresSearchField, professoresSearchValue);
        const professoresBody = document.getElementById('professoresBody');
        professoresBody.innerHTML = '';

        if (!result.success) {
            professoresBody.innerHTML = '<tr><td colspan="5">Erro ao carregar professores</td></tr>';
            console.error('Erro ao carregar professores:', result.error);
            return;
        }

        if (!result.professores || result.professores.length === 0) {
            professoresBody.innerHTML = '<tr><td colspan="5">Nenhum professor encontrado</td></tr>';
        } else {
            result.professores.forEach(professor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${professor.id}</td>
                    <td>${professor.nome}</td>
                    <td>${professor.email || '-'}</td>
                    <td>${professor.telefone || '-'}</td>
                    <td class="table-actions-cell"><div class="table-actions">
                        <button class="btn-edit btn-action" data-action="edit" data-type="professor" data-id="${professor.id}">Editar</button>
                        <button class="btn-delete btn-action" data-action="delete" data-type="professor" data-id="${professor.id}">Eliminar</button>
                    </div></td>
                `;
                professoresBody.appendChild(row);
            });
        }

        const pageInfo = document.getElementById('professoresPageInfo');
        const prevBtn = document.getElementById('professoresPrev');
        const nextBtn = document.getElementById('professoresNext');

        const total = result && result.total ? result.total : 0;
        const totalPages = Math.max(1, Math.ceil(total / professoresPageSize));

        pageInfo.textContent = `Página ${professoresCurrentPage} / ${totalPages}`;
        prevBtn.disabled = professoresCurrentPage <= 1;
        nextBtn.disabled = professoresCurrentPage >= totalPages;
    }

    document.getElementById('ViewProfessores').addEventListener('click', async () => {
        await loadProfessores(1);
        showView('professores');
    });

    document.getElementById('professoresSearchBtn').addEventListener('click', async () => {
        const field = document.getElementById('professoresSearchField').value;
        const value = document.getElementById('professoresSearchInput').value.trim();
        professoresSearchField = value === '' ? null : field;
        professoresSearchValue = value === '' ? null : value;
        await loadProfessores(1);
    });

    document.getElementById('professoresClearSearch').addEventListener('click', async () => {
        document.getElementById('professoresSearchInput').value = '';
        professoresSearchField = null;
        professoresSearchValue = null;
        await loadProfessores(1);
    });

    document.getElementById('professoresPrev').addEventListener('click', async () => {
        if (professoresCurrentPage > 1) {
            await loadProfessores(professoresCurrentPage - 1);
        }
    });

    document.getElementById('professoresNext').addEventListener('click', async () => {
        const meta = await window.electronAPI.getProfessores(1, professoresPageSize, professoresSearchField, professoresSearchValue);
        const total = meta && meta.total ? meta.total : 0;
        const totalPages = Math.max(1, Math.ceil(total / professoresPageSize));
        if (professoresCurrentPage < totalPages) {
            await loadProfessores(professoresCurrentPage + 1);
        }
    });

    // ==========================================
    // TABLE ACTIONS (DELETE & EDIT)
    // ==========================================
    async function handleTableAction(event) {
        try {
            let target = event.target;
            while (target && target.nodeType !== Node.ELEMENT_NODE) {
                target = target.parentNode;
            }
            if (!target) return;

            const button = target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const type = button.dataset.type;
            const id = Number(button.dataset.id);
            if (!action || !type || Number.isNaN(id)) return;

            const row = button.closest('tr');
            if (!row) return;

            if (action === 'delete') {
                if (!confirm('Tem certeza que deseja eliminar este registro?')) return;

                let result;
                switch (type) {
                    case 'aluno':
                        result = await window.electronAPI.deleteAluno(id);
                        if (result.success) await loadStudents(studentsCurrentPage);
                        break;
                    case 'professor':
                        result = await window.electronAPI.deleteProfessor(id);
                        if (result.success) await loadProfessores(professoresCurrentPage);
                        break;
                    case 'disciplina':
                        result = await window.electronAPI.deleteDisciplina(id);
                        if (result.success) await loadDisciplinas(disciplinasCurrentPage);
                        break;
                    case 'nota':
                        result = await window.electronAPI.deleteNota(id);
                        if (result.success) {
                            notesData = null;
                            await loadNotas(notesCurrentPage);
                        }
                        break;
                }

                if (result && result.success) {
                    alert('Registro eliminado com sucesso!');
                } else {
                    alert('Erro ao eliminar registro: ' + (result ? result.error : 'resultado inválido'));
                }
                return;
            }

            if (action === 'edit') {
                const rowData = {
                    id,
                    tipo: type,
                    celulas: row.children
                };

                if (type === 'aluno') {
                    currentEditAlunoId = id;
                    document.getElementById('editStudentName').value = rowData.celulas[1].textContent.trim();
                    document.getElementById('editStudentEmail').value = rowData.celulas[2].textContent.trim();
                    document.getElementById('editStudentPhone').value = rowData.celulas[3].textContent.trim();
                    showView('editStudentView');
                } else if (type === 'professor') {
                    currentEditProfessorId = id;
                    document.getElementById('editProfessorName').value = rowData.celulas[1].textContent.trim();
                    document.getElementById('editProfessorEmail').value = rowData.celulas[2].textContent.trim();
                    document.getElementById('editProfessorPhone').value = rowData.celulas[3].textContent.trim();
                    showView('editProfessorView');
                } else if (type === 'disciplina') {
                    currentEditDisciplinaId = id;
                    document.getElementById('editDisciplinaNome').value = rowData.celulas[1].textContent.trim();
                    document.getElementById('editDisciplinaCodigo').value = rowData.celulas[2].textContent.trim();
                    document.getElementById('editDisciplinaProfessor').value = rowData.celulas[3].textContent.trim();
                    showView('editDisciplinaView');
                } else if (type === 'nota') {
                    currentEditNotaId = id;
                    document.getElementById('editName').value = rowData.celulas[0].textContent.trim();
                    document.getElementById('editDisciplina').value = rowData.celulas[1].textContent.trim();
                    document.getElementById('editNota').value = rowData.celulas[2].textContent.trim();
                    document.getElementById('editFeitoCheckbox').checked = rowData.celulas[3].textContent.trim() === '✓';
                    showView('editNoteView');
                }
            }
        } catch (error) {
            console.error('Erro no handleTableAction:', error);
        }
    }

    document.body.addEventListener('click', handleTableAction);

    // ==========================================
    // AUTOCOMPLETE/LIVE SEARCH
    // ==========================================
    const nameInput = document.getElementById('name');
    const nameSuggestions = document.getElementById('nameSuggestions');
    const editNameInput = document.getElementById('editName');
    const editNameSuggestions = document.getElementById('editNameSuggestions');
    const editStudentNameInput = document.getElementById('editStudentName');
    const editStudentNameSuggestions = document.getElementById('editStudentNameSuggestions');
    let autocompleteTimer = null;
    let editNameTimer = null;
    let editStudentNameTimer = null;

    async function updateNameSuggestions(query, suggestionsElement) {
        if (!suggestionsElement) return;
        if (!query || query.trim().length === 0) {
            suggestionsElement.innerHTML = '';
            suggestionsElement.style.display = 'none';
            return;
        }

        const result = await window.electronAPI.searchAlunos(query, 10);
        if (!result.success || !result.alunos || result.alunos.length === 0) {
            suggestionsElement.innerHTML = '<div class="autocomplete-item empty">Nenhum aluno encontrado</div>';
            suggestionsElement.style.display = 'block';
            return;
        }

        suggestionsElement.innerHTML = result.alunos.map(aluno => `
            <div class="autocomplete-item" data-name="${aluno.nome}">
                <strong>${aluno.nome}</strong>
                <span class="autocomplete-meta">${aluno.telefone || 'sem telefone'}</span>
            </div>
        `).join('');
        suggestionsElement.style.display = 'block';
    }

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            clearTimeout(autocompleteTimer);
            autocompleteTimer = setTimeout(() => {
                updateNameSuggestions(nameInput.value, nameSuggestions);
            }, 180);
        });

        nameInput.addEventListener('focus', () => {
            if (nameInput.value.trim()) {
                updateNameSuggestions(nameInput.value, nameSuggestions);
            }
        });

        nameInput.addEventListener('blur', () => {
            setTimeout(() => {
                nameSuggestions.style.display = 'none';
            }, 150);
        });
    }

    if (nameSuggestions) {
        nameSuggestions.addEventListener('click', event => {
            const item = event.target.closest('.autocomplete-item');
            if (item && item.dataset.name) {
                nameInput.value = item.dataset.name;
                nameSuggestions.style.display = 'none';
            }
        });
    }

    if (editNameInput) {
        editNameInput.addEventListener('input', () => {
            clearTimeout(editNameTimer);
            editNameTimer = setTimeout(() => {
                updateNameSuggestions(editNameInput.value, editNameSuggestions);
            }, 180);
        });

        editNameInput.addEventListener('focus', () => {
            if (editNameInput.value.trim()) {
                updateNameSuggestions(editNameInput.value, editNameSuggestions);
            }
        });

        editNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                editNameSuggestions.style.display = 'none';
            }, 150);
        });

        if (editNameSuggestions) {
            editNameSuggestions.addEventListener('click', event => {
                const item = event.target.closest('.autocomplete-item');
                if (item && item.dataset.name) {
                    editNameInput.value = item.dataset.name;
                    editNameSuggestions.style.display = 'none';
                }
            });
        }
    }

    if (editStudentNameInput) {
        editStudentNameInput.addEventListener('input', () => {
            clearTimeout(editStudentNameTimer);
            editStudentNameTimer = setTimeout(() => {
                updateNameSuggestions(editStudentNameInput.value, editStudentNameSuggestions);
            }, 180);
        });

        editStudentNameInput.addEventListener('focus', () => {
            if (editStudentNameInput.value.trim()) {
                updateNameSuggestions(editStudentNameInput.value, editStudentNameSuggestions);
            }
        });

        editStudentNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (editStudentNameSuggestions) editStudentNameSuggestions.style.display = 'none';
            }, 150);
        });

        if (editStudentNameSuggestions) {
            editStudentNameSuggestions.addEventListener('click', event => {
                const item = event.target.closest('.autocomplete-item');
                if (item && item.dataset.name) {
                    editStudentNameInput.value = item.dataset.name;
                    editStudentNameSuggestions.style.display = 'none';
                }
            });
        }
    }

    // --- Disciplina Live Search ---
    const disciplinaInput = document.getElementById('disciplinaInput');
    const disciplinaSuggestions = document.getElementById('disciplinaSuggestions');
    const editDisciplinaInput = document.getElementById('editDisciplina');
    const editDisciplinaSuggestions = document.getElementById('editDisciplinaSuggestions');
    let disciplinaTimer = null;

    async function updateDisciplinaSuggestions(query, suggestionsElement) {
        if (!suggestionsElement) return;
        if (!query || query.trim().length === 0) {
            suggestionsElement.innerHTML = '';
            suggestionsElement.style.display = 'none';
            return;
        }

        if (!disciplinasCache) {
            const res = await window.electronAPI.getDisciplinas();
            if (!res.success) {
                suggestionsElement.innerHTML = '<div class="autocomplete-item empty">Erro ao carregar disciplinas</div>';
                suggestionsElement.style.display = 'block';
                return;
            }
            disciplinasCache = res.disciplinas || [];
        }

        const q = query.toLowerCase();
        const matches = (disciplinasCache || []).filter(d => (d.nome || '').toLowerCase().includes(q) || (d.codigo || '').toLowerCase().includes(q));
        if (!matches || matches.length === 0) {
            suggestionsElement.innerHTML = '<div class="autocomplete-item empty">Nenhuma disciplina encontrada</div>';
            suggestionsElement.style.display = 'block';
            return;
        }

        suggestionsElement.innerHTML = matches.slice(0, 12).map(d => `
            <div class="autocomplete-item" data-nome="${d.nome}">
                <strong>${d.nome}</strong>
                <span class="autocomplete-meta">${d.codigo || ''}</span>
            </div>
        `).join('');
        suggestionsElement.style.display = 'block';
    }

    if (disciplinaInput) {
        disciplinaInput.addEventListener('input', () => {
            clearTimeout(disciplinaTimer);
            disciplinaTimer = setTimeout(() => updateDisciplinaSuggestions(disciplinaInput.value, disciplinaSuggestions), 120);
        });

        disciplinaInput.addEventListener('focus', () => {
            if (disciplinaInput.value.trim()) updateDisciplinaSuggestions(disciplinaInput.value, disciplinaSuggestions);
        });

        disciplinaInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (disciplinaSuggestions) disciplinaSuggestions.style.display = 'none';
            }, 150);
        });

        if (disciplinaSuggestions) {
            disciplinaSuggestions.addEventListener('click', event => {
                const item = event.target.closest('.autocomplete-item');
                if (item && item.dataset.nome) {
                    disciplinaInput.value = item.dataset.nome;
                    disciplinaSuggestions.style.display = 'none';
                }
            });
        }
    }

    if (editDisciplinaInput) {
        editDisciplinaInput.addEventListener('input', () => {
            clearTimeout(disciplinaTimer);
            disciplinaTimer = setTimeout(() => updateDisciplinaSuggestions(editDisciplinaInput.value, editDisciplinaSuggestions), 120);
        });

        editDisciplinaInput.addEventListener('focus', () => {
            if (editDisciplinaInput.value.trim()) updateDisciplinaSuggestions(editDisciplinaInput.value, editDisciplinaSuggestions);
        });

        editDisciplinaInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (editDisciplinaSuggestions) editDisciplinaSuggestions.style.display = 'none';
            }, 150);
        });

        if (editDisciplinaSuggestions) {
            editDisciplinaSuggestions.addEventListener('click', event => {
                const item = event.target.closest('.autocomplete-item');
                if (item && item.dataset.nome) {
                    editDisciplinaInput.value = item.dataset.nome;
                    editDisciplinaSuggestions.style.display = 'none';
                }
            });
        }
    }

    // --- Professor Live Search ---
    const editDisciplinaProfessorInput = document.getElementById('editDisciplinaProfessor');
    const editDisciplinaProfessorSuggestions = document.getElementById('editDisciplinaProfessorSuggestions');
    let professorTimer = null;

    async function updateProfessorSuggestions(query, suggestionsElement) {
        if (!suggestionsElement) return;
        if (!query || query.trim().length === 0) {
            suggestionsElement.innerHTML = '';
            suggestionsElement.style.display = 'none';
            return;
        }

        const result = await window.electronAPI.searchProfessores(query, 10);
        if (!result.success || !result.professores || result.professores.length === 0) {
            suggestionsElement.innerHTML = '<div class="autocomplete-item empty">Nenhum professor encontrado</div>';
            suggestionsElement.style.display = 'block';
            return;
        }

        suggestionsElement.innerHTML = result.professores.map(professor => `
            <div class="autocomplete-item" data-name="${professor.nome}">
                <strong>${professor.nome}</strong>
                <span class="autocomplete-meta">${professor.email || 'sem email'}</span>
            </div>
        `).join('');
        suggestionsElement.style.display = 'block';
    }

    if (editDisciplinaProfessorInput) {
        editDisciplinaProfessorInput.addEventListener('input', () => {
            clearTimeout(professorTimer);
            professorTimer = setTimeout(() => updateProfessorSuggestions(editDisciplinaProfessorInput.value, editDisciplinaProfessorSuggestions), 180);
        });

        editDisciplinaProfessorInput.addEventListener('focus', () => {
            if (editDisciplinaProfessorInput.value.trim()) {
                updateProfessorSuggestions(editDisciplinaProfessorInput.value, editDisciplinaProfessorSuggestions);
            }
        });

        editDisciplinaProfessorInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (editDisciplinaProfessorSuggestions) editDisciplinaProfessorSuggestions.style.display = 'none';
            }, 150);
        });

        if (editDisciplinaProfessorSuggestions) {
            editDisciplinaProfessorSuggestions.addEventListener('click', event => {
                const item = event.target.closest('.autocomplete-item');
                if (item && item.dataset.name) {
                    editDisciplinaProfessorInput.value = item.dataset.name;
                    editDisciplinaProfessorSuggestions.style.display = 'none';
                }
            });
        }
    }

    // ==========================================
    // ADD BUTTONS
    // ==========================================
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        document.getElementById('studentName').value = '';
        document.getElementById('studentEmail').value = '';
        document.getElementById('studentPhone').value = '';
        showView('addStudentView');
    });

    document.getElementById('addDisciplinaBtn').addEventListener('click', () => {
        document.getElementById('disciplinaNome').value = '';
        document.getElementById('disciplinaCodigo').value = '';
        document.getElementById('disciplinaProfessor').value = '';
        showView('addDisciplinaView');
    });

    document.getElementById('addProfessorBtn').addEventListener('click', () => {
        document.getElementById('professorNome').value = '';
        document.getElementById('professorEmail').value = '';
        document.getElementById('professorTelefone').value = '';
        showView('addProfessorView');
    });

    // ==========================================
    // SAVE BUTTONS (ADD)
    // ==========================================
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const name = document.getElementById('name').value;
        const nota = document.getElementById('nota').value;
        const feito = document.querySelector('#addView input[type="checkbox"]').checked;
        const disciplina = (document.getElementById('disciplinaInput') || {}).value || '';

        if (!name || !nota) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        const result = await window.electronAPI.saveNota(name, nota, feito, disciplina);
        
        if (result.success) {
            alert('Nota guardada com sucesso!');
            document.getElementById('name').value = '';
            document.getElementById('nota').value = '';
            const discEl = document.getElementById('disciplinaInput');
            if (discEl) discEl.value = '';
            document.querySelector('#addView input[type="checkbox"]').checked = false;
            notesData = null;
            await loadNotas(1);
            showView('viewNotes');
        } else {
            alert('Erro ao guardar nota: ' + result.error);
        }
    });

    document.getElementById('saveStudentBtn').addEventListener('click', async () => {
        const nome = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        const telefone = document.getElementById('studentPhone').value;

        if (!nome) {
            alert('Por favor, preencha o nome do aluno');
            return;
        }

        const result = await window.electronAPI.saveAluno(nome, email, telefone);

        if (result.success) {
            alert('Aluno guardado com sucesso!');
            const meta = await window.electronAPI.getAlunos(1, studentsPageSize, studentsSearchField, studentsSearchValue);
            const total = meta && meta.total ? meta.total : 0;
            const lastPage = Math.max(1, Math.ceil(total / studentsPageSize));
            await loadStudents(lastPage);
            showView('students');
        } else {
            alert('Erro ao guardar aluno: ' + result.error);
        }
    });

    document.getElementById('saveDisciplinaBtn').addEventListener('click', async () => {
        const nome = document.getElementById('disciplinaNome').value.trim();
        const codigo = document.getElementById('disciplinaCodigo').value.trim();
        const professor = document.getElementById('disciplinaProfessor').value.trim();

        if (!nome) {
            alert('Por favor, preencha o nome da disciplina');
            return;
        }

        const result = await window.electronAPI.saveDisciplina(nome, codigo, professor);
        if (result.success) {
            alert('Disciplina guardada com sucesso!');
            disciplinasCache = null;
            await loadDisciplinas();
            showView('disciplinas');
        } else {
            alert('Erro ao guardar disciplina: ' + result.error);
        }
    });

    document.getElementById('saveProfessorBtn').addEventListener('click', async () => {
        const nome = document.getElementById('professorNome').value.trim();
        const email = document.getElementById('professorEmail').value.trim();
        const telefone = document.getElementById('professorTelefone').value.trim();

        if (!nome) {
            alert('Por favor, preencha o nome do professor');
            return;
        }

        const result = await window.electronAPI.saveProfessor(nome, email, telefone);
        if (result.success) {
            alert('Professor guardado com sucesso!');
            const meta = await window.electronAPI.getProfessores(1, professoresPageSize);
            const total = meta && meta.total ? meta.total : 0;
            const lastPage = Math.max(1, Math.ceil(total / professoresPageSize));
            await loadProfessores(lastPage);
            showView('professores');
        } else {
            alert('Erro ao guardar professor: ' + result.error);
        }
    });

    // ==========================================
    // SAVE BUTTONS (EDIT)
    // ==========================================
    document.getElementById('saveEditBtn').addEventListener('click', async () => {
        if (!currentEditNotaId) {
            alert('Nenhuma nota selecionada para edição.');
            return;
        }

        const name = document.getElementById('editName').value.trim();
        const disciplina = document.getElementById('editDisciplina').value.trim();
        const nota = Number(document.getElementById('editNota').value);
        const feito = document.getElementById('editFeitoCheckbox').checked;

        if (!name || Number.isNaN(nota)) {
            alert('Por favor, preencha o nome e a nota corretamente.');
            return;
        }

        const result = await window.electronAPI.updateNota(currentEditNotaId, name, nota, feito, disciplina);
        if (result.success) {
            alert('Nota atualizada com sucesso!');
            notesData = null;
            await loadNotas(notesCurrentPage);
            clearEditState();
            showView('viewNotes');
        } else {
            alert('Erro ao atualizar nota: ' + result.error);
        }
    });

    document.getElementById('saveEditStudentBtn').addEventListener('click', async () => {
        if (!currentEditAlunoId) {
            alert('Nenhum aluno selecionado para edição.');
            return;
        }

        const nome = document.getElementById('editStudentName').value.trim();
        const email = document.getElementById('editStudentEmail').value.trim();
        const telefone = document.getElementById('editStudentPhone').value.trim();

        if (!nome) {
            alert('Nome do aluno é obrigatório.');
            return;
        }

        const result = await window.electronAPI.updateAluno(currentEditAlunoId, nome, email, telefone);
        if (result.success) {
            alert('Aluno atualizado com sucesso!');
            await loadStudents(studentsCurrentPage);
            clearEditState();
            showView('students');
        } else {
            alert('Erro ao atualizar aluno: ' + result.error);
        }
    });

    document.getElementById('saveEditDisciplinaBtn').addEventListener('click', async () => {
        if (!currentEditDisciplinaId) {
            alert('Nenhuma disciplina selecionada para edição.');
            return;
        }

        const nome = document.getElementById('editDisciplinaNome').value.trim();
        const codigo = document.getElementById('editDisciplinaCodigo').value.trim();
        const professor = document.getElementById('editDisciplinaProfessor').value.trim();

        if (!nome) {
            alert('Nome da disciplina é obrigatório.');
            return;
        }

        const result = await window.electronAPI.updateDisciplina(currentEditDisciplinaId, nome, codigo, professor);
        if (result.success) {
            alert('Disciplina atualizada com sucesso!');
            disciplinasCache = null;
            await loadDisciplinas(disciplinasCurrentPage);
            clearEditState();
            showView('disciplinas');
        } else {
            alert('Erro ao atualizar disciplina: ' + result.error);
        }
    });

    document.getElementById('saveEditProfessorBtn').addEventListener('click', async () => {
        if (!currentEditProfessorId) {
            alert('Nenhum professor selecionado para edição.');
            return;
        }

        const nome = document.getElementById('editProfessorName').value.trim();
        const email = document.getElementById('editProfessorEmail').value.trim();
        const telefone = document.getElementById('editProfessorPhone').value.trim();

        if (!nome) {
            alert('Nome do professor é obrigatório.');
            return;
        }

        const result = await window.electronAPI.updateProfessor(currentEditProfessorId, nome, email, telefone);
        if (result.success) {
            alert('Professor atualizado com sucesso!');
            await loadProfessores(professoresCurrentPage);
            clearEditState();
            showView('professores');
        } else {
            alert('Erro ao atualizar professor: ' + result.error);
        }
    });

    // ==========================================
    // BACK BUTTONS
    // ==========================================
    document.getElementById('backFromEditNote').addEventListener('click', () => {
        clearEditState();
        showView('viewNotes');
    });

    document.getElementById('backFromEditStudent').addEventListener('click', () => {
        clearEditState();
        showView('students');
    });

    document.getElementById('backFromEditDisciplina').addEventListener('click', () => {
        clearEditState();
        showView('disciplinas');
    });

    document.getElementById('backFromEditProfessor').addEventListener('click', () => {
        clearEditState();
        showView('professores');
    });

    document.getElementById('backFromAddStudent').addEventListener('click', () => {
        showView('students');
    });

    document.getElementById('backFromAddDisciplina').addEventListener('click', () => {
        showView('disciplinas');
    });

    document.getElementById('backFromAddProfessor').addEventListener('click', () => {
        showView('professores');
    });

    document.getElementById('backFromDisciplinas').addEventListener('click', () => {
        showView('homeView');
    });

    document.getElementById('backFromProfessores').addEventListener('click', () => {
        showView('homeView');
    });

    const backButtons = document.querySelectorAll('#backBtn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showView('homeView');
        });
    });
});
