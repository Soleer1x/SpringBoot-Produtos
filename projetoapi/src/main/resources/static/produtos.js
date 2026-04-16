// ============================================================
// PRODUTOS.JS — Gerenciamento de estado e API (nível profissional)
// ============================================================

(function() {
    "use strict";

    // ---------- Configuração ----------
    const API_BASE = '/produtos';  // Relativo ao mesmo domínio (Spring Boot)

    // Elementos DOM
    const form = document.getElementById('produto-form');
    const nomeInput = document.getElementById('nome');
    const descricaoInput = document.getElementById('descricao');
    const precoInput = document.getElementById('preco');
    const produtoIdInput = document.getElementById('produto-id');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const formTitle = document.getElementById('form-title');
    const clearFormBtn = document.getElementById('clear-form-btn');

    const produtosTbody = document.getElementById('produtos-tbody');
    const loader = document.getElementById('loader');
    const tableContainer = document.getElementById('table-container');
    const emptyState = document.getElementById('empty-state');
    const totalSpan = document.getElementById('total-produtos');
    const refreshBtn = document.getElementById('refresh-btn');

    const notificationArea = document.getElementById('notification-area');

    // Modal
    const modalOverlay = document.getElementById('delete-modal');
    const modalProdutoNome = document.getElementById('modal-produto-nome');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    // Estado
    let produtoParaDeletar = null; // { id, nome }
    let isEditing = false;

    // ---------- Helpers / Notificações ----------
    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i> ${message}`;
        notificationArea.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function showLoader(show) {
        loader.style.display = show ? 'flex' : 'none';
        tableContainer.style.display = show ? 'none' : 'table-container' ? 'block' : 'none';
        // Ajuste para exibição da tabela
        if (!show) {
            // será tratado no render
        }
    }

    function updateEmptyState(count) {
        if (count === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            tableContainer.style.display = 'block';
            emptyState.style.display = 'none';
        }
        totalSpan.textContent = count;
    }

    // ---------- Renderização da Tabela ----------
    function renderProdutos(produtos) {
        produtosTbody.innerHTML = '';
        if (!produtos || produtos.length === 0) {
            updateEmptyState(0);
            return;
        }
        updateEmptyState(produtos.length);

        produtos.forEach(prod => {
            const tr = document.createElement('tr');

            // Nome
            const tdNome = document.createElement('td');
            tdNome.textContent = prod.nome || '—';

            // Descrição
            const tdDesc = document.createElement('td');
            tdDesc.textContent = prod.descricao || '—';
            tdDesc.style.maxWidth = '300px';
            tdDesc.style.whiteSpace = 'nowrap';
            tdDesc.style.overflow = 'hidden';
            tdDesc.style.textOverflow = 'ellipsis';

            // Preço
            const tdPreco = document.createElement('td');
            const precoFormat = prod.preco ? Number(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
            tdPreco.textContent = precoFormat;
            tdPreco.style.fontWeight = '600';

            // Ações
            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'actions-cell';

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Editar';
            editBtn.addEventListener('click', () => prepararEdicao(prod));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Excluir';
            deleteBtn.addEventListener('click', () => abrirModalDelete(prod));

            tdAcoes.appendChild(editBtn);
            tdAcoes.appendChild(deleteBtn);

            tr.appendChild(tdNome);
            tr.appendChild(tdDesc);
            tr.appendChild(tdPreco);
            tr.appendChild(tdAcoes);

            produtosTbody.appendChild(tr);
        });
    }

    // ---------- API Calls ----------
    async function fetchProdutos() {
        showLoader(true);
        try {
            const response = await fetch(API_BASE);
            if (!response.ok) throw new Error('Erro ao carregar produtos');
            const data = await response.json();
            renderProdutos(data);
        } catch (error) {
            showNotification(error.message, 'error');
            renderProdutos([]);
        } finally {
            showLoader(false);
        }
    }

    async function salvarProduto(produto) {
        const method = produto.id ? 'PUT' : 'POST';
        const url = produto.id ? `${API_BASE}/${produto.id}` : API_BASE;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
            if (!response.ok) {
                const err = await response.text();
                throw new Error(err || 'Falha na operação');
            }
            showNotification(`Produto ${produto.id ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            resetForm();
            await fetchProdutos();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function deletarProduto(id) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Não foi possível excluir');
            showNotification('Produto removido', 'success');
            fecharModal();
            await fetchProdutos();
        } catch (error) {
            showNotification(error.message, 'error');
            fecharModal();
        }
    }

    // ---------- Manipulação do Formulário ----------
    function resetForm() {
        form.reset();
        produtoIdInput.value = '';
        isEditing = false;
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Novo Produto';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> <span>Salvar Produto</span>';
        cancelEditBtn.style.display = 'none';
    }

    function prepararEdicao(produto) {
        produtoIdInput.value = produto.id;
        nomeInput.value = produto.nome || '';
        descricaoInput.value = produto.descricao || '';
        precoInput.value = produto.preco || '';
        isEditing = true;
        formTitle.innerHTML = '<i class="fas fa-pen-to-square"></i> Editar Produto';
        submitBtn.innerHTML = '<i class="fas fa-pen"></i> <span>Atualizar</span>';
        cancelEditBtn.style.display = 'inline-flex';
        // Scroll suave ao formulário
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function handleSubmit(e) {
        e.preventDefault();

        const nome = nomeInput.value.trim();
        const descricao = descricaoInput.value.trim();
        const preco = parseFloat(precoInput.value);

        if (!nome) {
            showNotification('Nome do produto é obrigatório', 'error');
            return;
        }
        if (isNaN(preco) || preco <= 0) {
            showNotification('Preço deve ser um número positivo', 'error');
            return;
        }

        const produto = {
            nome,
            descricao,
            preco
        };

        const id = produtoIdInput.value;
        if (id) produto.id = id;

        salvarProduto(produto);
    }

    // ---------- Modal de Exclusão ----------
    function abrirModalDelete(produto) {
        produtoParaDeletar = { id: produto.id, nome: produto.nome };
        modalProdutoNome.textContent = produto.nome;
        modalOverlay.classList.add('active');
    }

    function fecharModal() {
        modalOverlay.classList.remove('active');
        produtoParaDeletar = null;
    }

    function confirmarDelete() {
        if (produtoParaDeletar) {
            deletarProduto(produtoParaDeletar.id);
        }
    }

    // ---------- Event Listeners ----------
    form.addEventListener('submit', handleSubmit);

    clearFormBtn.addEventListener('click', resetForm);

    cancelEditBtn.addEventListener('click', resetForm);

    refreshBtn.addEventListener('click', fetchProdutos);

    modalCancel.addEventListener('click', fecharModal);
    modalConfirm.addEventListener('click', confirmarDelete);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) fecharModal();
    });

    // Fechar modal com ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            fecharModal();
        }
    });

    // Inicialização
    fetchProdutos();

    // Expor algumas funções se necessário (para debug)
    window.produtosApp = { fetchProdutos, resetForm };
})();