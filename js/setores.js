
// Cadastro de setores.
// Cada setor: { codigo, nome }
// As máquinas são ligadas a um setor no cadastro de Máquinas,
// e os indicadores mostram o resultado de cada setor.

const campoCodigo = document.getElementById("codigo");
const campoNome = document.getElementById("nome");
const mensagem = document.getElementById("mensagem");

document.getElementById("btnCadastrar").addEventListener("click", cadastrarSetor);

// Botões Editar e Excluir da tabela.
// Cada botão guarda a ação e o código do setor em atributos data-.
document.getElementById("listaSetores").addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    if (botao.dataset.acao === "editar") {
        editarSetor(botao.dataset.codigo);
    }

    if (botao.dataset.acao === "excluir") {
        excluirSetor(botao.dataset.codigo);
    }
});


function cadastrarSetor() {

    const codigo = campoCodigo.value.trim();
    const nome = campoNome.value.trim();

    // Verifica se tudo foi preenchido
    if (codigo === "" || nome === "") {
        mensagem.textContent = "Preencha o código e o nome do setor.";
        return;
    }

    const setores = carregar("setores", []);

    const setor = {
        codigo: codigo,
        nome: nome
    };

    // Se o código já existe, atualiza o setor. Se não, adiciona um novo.
    const posicao = setores.findIndex(s => s.codigo === codigo);

    if (posicao >= 0) {
        setores[posicao] = setor;
        mensagem.textContent = "Setor " + codigo + " atualizado.";
    } else {
        setores.push(setor);
        mensagem.textContent = "Setor " + codigo + " cadastrado.";
    }

    salvar("setores", setores);

    // Limpa o formulário
    campoCodigo.value = "";
    campoNome.value = "";
    campoCodigo.focus();

    desenharLista();
}


// Coloca os dados do setor de volta no formulário para alterar
function editarSetor(codigo) {

    const setor = carregar("setores", []).find(s => s.codigo === codigo);

    if (!setor) {
        return;
    }

    campoCodigo.value = setor.codigo;
    campoNome.value = setor.nome;
    mensagem.textContent = "Altere o nome e clique em Cadastrar para salvar.";
}


function excluirSetor(codigo) {

    // Não deixa excluir um setor que ainda tem máquinas
    const maquinasDoSetor = carregar("maquinas", []).filter(m => m.setor === codigo);

    if (maquinasDoSetor.length > 0) {
        mensagem.textContent = "O setor " + codigo + " tem " + maquinasDoSetor.length +
            " máquina(s). Mude essas máquinas de setor antes de excluir.";
        return;
    }

    if (!confirm("Excluir o setor " + codigo + "?")) {
        return;
    }

    const setores = carregar("setores", []).filter(s => s.codigo !== codigo);
    salvar("setores", setores);

    mensagem.textContent = "Setor " + codigo + " excluído.";
    desenharLista();
}


// Mostra a tabela com os setores cadastrados
function desenharLista() {

    const lista = document.getElementById("listaSetores");
    const setores = carregar("setores", []);
    const maquinas = carregar("maquinas", []);

    if (setores.length === 0) {
        lista.innerHTML = `<tr><td colspan="4">Nenhum setor cadastrado.</td></tr>`;
        return;
    }

    let html = "";

    for (const setor of setores) {
        const codigo = escaparHTML(setor.codigo);
        const quantidade = maquinas.filter(m => m.setor === setor.codigo).length;

        html += `
            <tr>
                <td>${codigo}</td>
                <td>${escaparHTML(setor.nome)}</td>
                <td>${quantidade}</td>
                <td>
                    <button type="button" data-acao="editar" data-codigo="${codigo}">Editar</button>
                    <button type="button" data-acao="excluir" data-codigo="${codigo}">Excluir</button>
                </td>
            </tr>
        `;
    }

    lista.innerHTML = html;
}

desenharLista();
