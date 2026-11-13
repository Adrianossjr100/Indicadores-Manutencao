
// Cadastro de máquinas.
// Cada máquina: { codigo, nome, setor, horasMes }
// "setor" guarda o código do setor (cadastrado na página Setores).
// As máquinas cadastradas aparecem sozinhas nas páginas de MTBF, MTTR,
// Disponibilidade e Confiabilidade.

const campoCodigo = document.getElementById("codigo");
const campoNome = document.getElementById("nome");
const campoSetor = document.getElementById("setor");
const campoHorasMes = document.getElementById("horasMes");
const mensagem = document.getElementById("mensagem");

// Preenche a lista de setores com os setores cadastrados
const setores = carregar("setores", []);

for (const setor of setores) {
    campoSetor.innerHTML += `<option value="${escaparHTML(setor.codigo)}">${escaparHTML(setor.nome)}</option>`;
}

if (setores.length === 0) {
    mensagem.innerHTML = `Nenhum setor cadastrado. Cadastre primeiro na página <a href="/paginas/setores.html">Setores</a>.`;
}

document.getElementById("btnCadastrar").addEventListener("click", cadastrarMaquina);

// Botões Editar e Excluir da tabela.
// Cada botão guarda a ação e o código da máquina em atributos data-.
document.getElementById("listaMaquinas").addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    if (botao.dataset.acao === "editar") {
        editarMaquina(botao.dataset.codigo);
    }

    if (botao.dataset.acao === "excluir") {
        excluirMaquina(botao.dataset.codigo);
    }
});


function cadastrarMaquina() {

    const codigo = campoCodigo.value.trim();
    const nome = campoNome.value.trim();
    const setor = campoSetor.value;
    const horasMes = campoHorasMes.value;

    // Verifica se tudo foi preenchido
    if (codigo === "" || nome === "" || setor === "" || horasMes === "" || Number(horasMes) < 0) {
        mensagem.textContent = "Preencha código, nome, setor e horas de operação por mês.";
        return;
    }

    const maquinas = carregar("maquinas", []);

    const maquina = {
        codigo: codigo,
        nome: nome,
        setor: setor,
        horasMes: Number(horasMes)
    };

    // Se o código já existe, atualiza a máquina. Se não, adiciona uma nova.
    const posicao = maquinas.findIndex(m => m.codigo === codigo);

    if (posicao >= 0) {
        maquinas[posicao] = maquina;
        mensagem.textContent = "Máquina " + codigo + " atualizada.";
    } else {
        maquinas.push(maquina);
        mensagem.textContent = "Máquina " + codigo + " cadastrada.";
    }

    salvar("maquinas", maquinas);

    // Limpa o formulário
    campoCodigo.value = "";
    campoNome.value = "";
    campoSetor.value = "";
    campoHorasMes.value = "";
    campoCodigo.focus();

    desenharLista();
}


// Coloca os dados da máquina de volta no formulário para alterar
function editarMaquina(codigo) {

    const maquina = carregar("maquinas", []).find(m => m.codigo === codigo);

    if (!maquina) {
        return;
    }

    campoCodigo.value = maquina.codigo;
    campoNome.value = maquina.nome;
    campoSetor.value = maquina.setor || "";
    campoHorasMes.value = maquina.horasMes;
    mensagem.textContent = "Altere os dados e clique em Cadastrar para salvar.";
}


function excluirMaquina(codigo) {

    if (!confirm("Excluir a máquina " + codigo + "?")) {
        return;
    }

    const maquinas = carregar("maquinas", []).filter(m => m.codigo !== codigo);
    salvar("maquinas", maquinas);

    // Apaga também os valores digitados para ela nos indicadores
    const dados = carregar("dadosIndicadores", {});

    for (const indicador of ["mtbf", "mttr", "confiabilidade"]) {
        if (dados[indicador]) {
            delete dados[indicador][codigo];
        }
    }

    salvar("dadosIndicadores", dados);

    mensagem.textContent = "Máquina " + codigo + " excluída.";
    desenharLista();
}


// Mostra a tabela com as máquinas cadastradas
function desenharLista() {

    const lista = document.getElementById("listaMaquinas");
    const maquinas = carregar("maquinas", []);

    if (maquinas.length === 0) {
        lista.innerHTML = `<tr><td colspan="5">Nenhuma máquina cadastrada.</td></tr>`;
        return;
    }

    let html = "";

    for (const maquina of maquinas) {
        const codigo = escaparHTML(maquina.codigo);

        html += `
            <tr>
                <td>${codigo}</td>
                <td>${escaparHTML(maquina.nome)}</td>
                <td>${escaparHTML(nomeDoSetor(maquina.setor))}</td>
                <td>${formatar(maquina.horasMes, "h")}</td>
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
