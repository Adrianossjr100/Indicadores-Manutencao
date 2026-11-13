
// Cadastro de funcionários.
// Cada funcionário: { matricula, nome, cargo, tipo, horasDia }
// Os funcionários cadastrados aparecem sozinhos na página de Homem Hora.

const campoMatricula = document.getElementById("matricula");
const campoNome = document.getElementById("nome");
const campoCargo = document.getElementById("cargo");
const campoTipo = document.getElementById("tipo");
const campoHorasDia = document.getElementById("horasDia");
const mensagem = document.getElementById("mensagem");

// Preenche a lista de tipos de manutenção (definida em main.js)
for (const tipo of TIPOS_MANUTENCAO) {
    campoTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
}

document.getElementById("btnCadastrar").addEventListener("click", cadastrarFuncionario);

// Botões Editar e Excluir da tabela.
// Cada botão guarda a ação e a matrícula em atributos data-.
document.getElementById("listaFuncionarios").addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    if (botao.dataset.acao === "editar") {
        editarFuncionario(botao.dataset.matricula);
    }

    if (botao.dataset.acao === "excluir") {
        excluirFuncionario(botao.dataset.matricula);
    }
});


function cadastrarFuncionario() {

    const matricula = campoMatricula.value.trim();
    const nome = campoNome.value.trim();
    const cargo = campoCargo.value.trim();
    const tipo = campoTipo.value;
    const horasDia = campoHorasDia.value;

    // Verifica se tudo foi preenchido
    if (matricula === "" || nome === "" || cargo === "" || tipo === "" ||
        horasDia === "" || Number(horasDia) < 0 || Number(horasDia) > 24) {
        mensagem.textContent = "Preencha todos os campos. Horas por dia deve ficar entre 0 e 24.";
        return;
    }

    const funcionarios = carregar("funcionarios", []);

    const funcionario = {
        matricula: matricula,
        nome: nome,
        cargo: cargo,
        tipo: tipo,
        horasDia: Number(horasDia)
    };

    // Se a matrícula já existe, atualiza. Se não, adiciona.
    const posicao = funcionarios.findIndex(f => f.matricula === matricula);

    if (posicao >= 0) {
        funcionarios[posicao] = funcionario;
        mensagem.textContent = "Funcionário " + matricula + " atualizado.";
    } else {
        funcionarios.push(funcionario);
        mensagem.textContent = "Funcionário " + matricula + " cadastrado.";
    }

    salvar("funcionarios", funcionarios);

    // Limpa o formulário
    campoMatricula.value = "";
    campoNome.value = "";
    campoCargo.value = "";
    campoTipo.value = "";
    campoHorasDia.value = "";
    campoMatricula.focus();

    desenharLista();
}


// Coloca os dados do funcionário de volta no formulário para alterar
function editarFuncionario(matricula) {

    const funcionario = carregar("funcionarios", []).find(f => f.matricula === matricula);

    if (!funcionario) {
        return;
    }

    campoMatricula.value = funcionario.matricula;
    campoNome.value = funcionario.nome;
    campoCargo.value = funcionario.cargo;
    campoTipo.value = funcionario.tipo;
    campoHorasDia.value = funcionario.horasDia;
    mensagem.textContent = "Altere os dados e clique em Cadastrar para salvar.";
}


function excluirFuncionario(matricula) {

    if (!confirm("Excluir o funcionário " + matricula + "?")) {
        return;
    }

    const funcionarios = carregar("funcionarios", []).filter(f => f.matricula !== matricula);
    salvar("funcionarios", funcionarios);

    // Apaga também as horas apontadas dele no Homem Hora
    const dados = carregar("dadosIndicadores", {});

    if (dados.hh) {
        delete dados.hh[matricula];
    }

    salvar("dadosIndicadores", dados);

    mensagem.textContent = "Funcionário " + matricula + " excluído.";
    desenharLista();
}


// Mostra a tabela com os funcionários cadastrados
function desenharLista() {

    const lista = document.getElementById("listaFuncionarios");
    const funcionarios = carregar("funcionarios", []);

    if (funcionarios.length === 0) {
        lista.innerHTML = `<tr><td colspan="6">Nenhum funcionário cadastrado.</td></tr>`;
        return;
    }

    let html = "";

    for (const funcionario of funcionarios) {
        const matricula = escaparHTML(funcionario.matricula);

        html += `
            <tr>
                <td>${matricula}</td>
                <td>${escaparHTML(funcionario.nome)}</td>
                <td>${escaparHTML(funcionario.cargo)}</td>
                <td>${escaparHTML(funcionario.tipo)}</td>
                <td>${formatar(funcionario.horasDia, "h")}</td>
                <td>
                    <button type="button" data-acao="editar" data-matricula="${matricula}">Editar</button>
                    <button type="button" data-acao="excluir" data-matricula="${matricula}">Excluir</button>
                </td>
            </tr>
        `;
    }

    lista.innerHTML = html;
}

desenharLista();
