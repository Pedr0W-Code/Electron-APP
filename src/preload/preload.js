const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getNotas: () => ipcRenderer.invoke('get-notas'),
    saveNota: (name, nota, feito, disciplina) => ipcRenderer.invoke('save-nota', { name, nota, feito, disciplina }),
    getAlunos: (page, pageSize, searchField, searchValue) => ipcRenderer.invoke('get-alunos', { page, pageSize, searchField, searchValue }),
    saveAluno: (nome, email, telefone) => ipcRenderer.invoke('save-aluno', { nome, email, telefone }),
    getDisciplinas: () => ipcRenderer.invoke('get-disciplinas'),
    saveDisciplina: (nome, codigo, professor) => ipcRenderer.invoke('save-disciplina', { nome, codigo, professor }),
    getProfessores: (page, pageSize, searchField, searchValue) => ipcRenderer.invoke('get-professores', { page, pageSize, searchField, searchValue }),
    saveProfessor: (nome, email, telefone) => ipcRenderer.invoke('save-professor', { nome, email, telefone }),
    updateProfessor: (id, nome, email, telefone) => ipcRenderer.invoke('update-professor', { id, nome, email, telefone }),
    deleteProfessor: (id) => ipcRenderer.invoke('delete-professor', { id }),
    updateAluno: (id, nome, email, telefone) => ipcRenderer.invoke('update-aluno', { id, nome, email, telefone }),
    deleteAluno: (id) => ipcRenderer.invoke('delete-aluno', { id }),
    updateDisciplina: (id, nome, codigo, professor) => ipcRenderer.invoke('update-disciplina', { id, nome, codigo, professor }),
    deleteDisciplina: (id) => ipcRenderer.invoke('delete-disciplina', { id }),
    updateNota: (id, name, nota, feito, disciplina) => ipcRenderer.invoke('update-nota', { id, name, nota, feito, disciplina }),
    deleteNota: (id) => ipcRenderer.invoke('delete-nota', { id }),
    searchAlunos: (prefix, limit) => ipcRenderer.invoke('search-alunos', { prefix, limit }),
    searchProfessores: (prefix, limit) => ipcRenderer.invoke('search-professores', { prefix, limit })
});