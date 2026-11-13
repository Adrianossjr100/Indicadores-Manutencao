
// Ordens de Serviço (OS).
// Cada OS fica ligada a um setor, uma máquina e um funcionário já cadastrados.
// Cada OS: { numero, data, setor, maquina, funcionario, tipo, descricao, inicio, fim, status }
//   setor       -> código do setor
//   maquina     -> código da máquina
//   funcionario -> matrícula do funcionário
//   inicio/fim  -> data e hora do reparo (o tempo de reparo é calculado com eles)

const setores = carregar("setores", []);
const maquinas = carregar("maquinas", []);
const funcionarios = carregar("funcionarios", []);

const campoData = document.getElementById("data");
const campoSetor = document.getElementById("setor");
const campoMaquina = document.getElementById("maquina");
const campoFuncionario = document.getElementById("funcionario");
const campoTipo = document.getElementById("tipo");
const campoDescricao = document.getElementById("descricao");
const campoInicio = document.getElementById("inicio");
const campoFim = document.getElementById("fim");
const campoStatus = document.getElementById("status");
const mensagem = document.getElementById("mensagem");
const botaoSalvar = document.getElementById("btnSalvar");
const botaoCancelar = document.getElementById("btnCancelar");
const filtroSetor = document.getElementById("filtroSetor");
const filtroStatus = document.getElementById("filtroStatus");

// Número da OS que está sendo editada (null = abrindo uma OS nova)
let numeroEmEdicao = null;


// ---------- Preenchimento das listas ----------

for (const setor of setores) {
    const opcao = `<option value="${escaparHTML(setor.codigo)}">${escaparHTML(setor.nome)}</option>`;
    campoSetor.innerHTML += opcao;
    filtroSetor.innerHTML += opcao;
}

for (const funcionario of funcionarios) {
    campoFuncionario.innerHTML += `<option value="${escaparHTML(funcionario.matricula)}">` +
        `${escaparHTML(funcionario.nome)} (${escaparHTML(funcionario.tipo)})</option>`;
}

// Lista o que falta cadastrar (o aviso aparece no início da página)
const faltando = [];

if (setores.length === 0) faltando.push(`<a href="/paginas/setores.html">Setores</a>`);
if (maquinas.length === 0) faltando.push(`<a href="/paginas/maquinas.html">Máquinas</a>`);
if (funcionarios.length === 0) faltando.push(`<a href="/paginas/funcionarios.html">Funcionários</a>`);


// Quando o setor muda, mostra só as máquinas daquele setor
function atualizarMaquinas() {

    const doSetor = maquinas.filter(m => m.setor === campoSetor.value);

    if (campoSetor.value === "") {
        campoMaquina.innerHTML = `<option value="">Escolha o setor primeiro</option>`;
        return;
    }

    if (doSetor.length === 0) {
        campoMaquina.innerHTML = `<option value="">Nenhuma máquina neste setor</option>`;
        return;
    }

    let html = `<option value="">Selecione</option>`;

    for (const maquina of doSetor) {
        html += `<option value="${escaparHTML(maquina.codigo)}">` +
            `${escaparHTML(maquina.codigo)} - ${escaparHTML(maquina.nome)}</option>`;
    }

    campoMaquina.innerHTML = html;
}

campoSetor.addEventListener("change", atualizarMaquinas);


// ---------- Ajudantes ----------

// Ex.: 7 -> "OS-0007"
function numeroFormatado(numero) {

    return "OS-" + String(numero).padStart(4, "0");
}


// Horas entre o início e o fim do reparo (null se faltar algum)
function tempoDeReparo(os) {

    if (!os.inicio || !os.fim) {
        return null;
    }

    const milissegundos = new Date(os.fim) - new Date(os.inicio);

    return milissegundos / (1000 * 60 * 60);
}


// Ex.: "2026-11-12" -> "12/11/2026"
function dataBrasileira(data) {

    if (!data) {
        return "-";
    }

    const [ano, mes, dia] = data.split("-");

    return dia + "/" + mes + "/" + ano;
}


function nomeDaMaquina(codigo) {

    const maquina = maquinas.find(m => m.codigo === codigo);

    return maquina ? maquina.codigo + " - " + maquina.nome : codigo + " (excluída)";
}


function nomeDoFuncionario(matricula) {

    const funcionario = funcionarios.find(f => f.matricula === matricula);

    return funcionario ? funcionario.nome : matricula + " (excluído)";
}


// Data e hora de agora no formato do campo de data e hora (aaaa-mm-ddThh:mm)
function agora() {

    const data = new Date();
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

    return data.toISOString().slice(0, 16);
}


// Nome da classe CSS que dá a cor do status. Ex.: "Em andamento" -> "status-em-andamento"
function classeDoStatus(status) {

    return "status-" + status
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, "-");
}


// Data de hoje no formato do campo de data (aaaa-mm-dd)
function hoje() {

    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());

    return agora.toISOString().slice(0, 10);
}


// ---------- Salvar, editar e excluir ----------

botaoSalvar.addEventListener("click", salvarOS);
botaoCancelar.addEventListener("click", limparFormulario);


function salvarOS() {

    const os = {
        numero: numeroEmEdicao,
        data: campoData.value,
        setor: campoSetor.value,
        maquina: campoMaquina.value,
        funcionario: campoFuncionario.value,
        tipo: campoTipo.value,
        descricao: campoDescricao.value.trim(),
        inicio: campoInicio.value,
        fim: campoFim.value,
        status: campoStatus.value
    };

    // Verifica os campos obrigatórios
    if (os.data === "" || os.setor === "" || os.maquina === "" || os.funcionario === "" ||
        os.tipo === "" || os.descricao === "") {
        mensagem.textContent = "Preencha data, setor, máquina, funcionário, tipo e descrição.";
        return;
    }

    // O fim do reparo não pode ser antes do início
    if (os.inicio && os.fim && new Date(os.fim) < new Date(os.inicio)) {
        mensagem.textContent = "O fim do reparo está antes do início.";
        return;
    }

    // Uma OS concluída precisa ter início e fim do reparo
    if (os.status === "Concluída" && (!os.inicio || !os.fim)) {
        mensagem.textContent = "Para concluir a OS, informe o início e o fim do reparo.";
        return;
    }

    const ordens = carregar("ordens", []);

    if (numeroEmEdicao === null) {
        // Nova OS: o número é o maior que já existe + 1
        const maior = ordens.reduce((max, o) => Math.max(max, o.numero), 0);
        os.numero = maior + 1;
        ordens.push(os);
        mensagem.textContent = numeroFormatado(os.numero) + " aberta.";
    } else {
        const posicao = ordens.findIndex(o => o.numero === numeroEmEdicao);
        ordens[posicao] = os;
        mensagem.textContent = numeroFormatado(os.numero) + " atualizada.";
    }

    salvar("ordens", ordens);

    const texto = mensagem.textContent;
    limparFormulario();
    mensagem.textContent = texto;

    desenharLista();
}


function editarOS(numero) {

    const os = carregar("ordens", []).find(o => o.numero === numero);

    if (!os) {
        return;
    }

    numeroEmEdicao = numero;

    campoData.value = os.data;
    campoSetor.value = os.setor;
    atualizarMaquinas();
    campoMaquina.value = os.maquina;
    campoFuncionario.value = os.funcionario;
    campoTipo.value = os.tipo;
    campoDescricao.value = os.descricao;
    campoInicio.value = os.inicio;
    campoFim.value = os.fim;
    campoStatus.value = os.status;

    document.getElementById("tituloFormulario").textContent = "Editando " + numeroFormatado(numero);
    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelar.hidden = false;
    mensagem.textContent = "";

    window.scrollTo(0, 0);
}


function excluirOS(numero) {

    if (!confirm("Excluir a " + numeroFormatado(numero) + "?")) {
        return;
    }

    const ordens = carregar("ordens", []).filter(o => o.numero !== numero);
    salvar("ordens", ordens);

    if (numeroEmEdicao === numero) {
        limparFormulario();
    }

    mensagem.textContent = numeroFormatado(numero) + " excluída.";
    desenharLista();
}


function limparFormulario() {

    numeroEmEdicao = null;

    campoData.value = hoje();
    campoSetor.value = "";
    atualizarMaquinas();
    campoFuncionario.value = "";
    campoTipo.value = "";
    campoDescricao.value = "";
    campoInicio.value = "";
    campoFim.value = "";
    campoStatus.value = "Aberta";

    document.getElementById("tituloFormulario").textContent = "Nova Ordem de Serviço";
    botaoSalvar.textContent = "Abrir OS";
    botaoCancelar.hidden = true;
    mensagem.textContent = "";
}


// Botão "Iniciar": marca o início do reparo com a hora atual
function iniciarOS(numero) {

    const ordens = carregar("ordens", []);
    const os = ordens.find(o => o.numero === numero);

    if (!os) {
        return;
    }

    os.inicio = agora();
    os.status = "Em andamento";

    salvar("ordens", ordens);

    mensagem.textContent = numeroFormatado(numero) + " em andamento desde agora.";
    desenharLista();
}


// Botão "Fechar OS": marca o fim do reparo com a hora atual e conclui
function fecharOS(numero) {

    const ordens = carregar("ordens", []);
    const os = ordens.find(o => o.numero === numero);

    if (!os) {
        return;
    }

    // Sem o início não dá para calcular o tempo de reparo:
    // abre a OS no formulário para a pessoa informar
    if (!os.inicio) {
        editarOS(numero);
        campoFim.value = agora();
        campoStatus.value = "Concluída";
        mensagem.textContent = "Informe o início do reparo e clique em Salvar alterações.";
        campoInicio.focus();
        return;
    }

    const fim = agora();

    if (new Date(fim) < new Date(os.inicio)) {
        mensagem.textContent = "O início do reparo está no futuro. Corrija em Editar.";
        return;
    }

    os.fim = fim;
    os.status = "Concluída";

    salvar("ordens", ordens);

    mensagem.textContent = numeroFormatado(numero) + " fechada. Tempo de reparo: " +
        formatar(tempoDeReparo(os), "h") + ".";
    desenharLista();
}


// ---------- Lista ----------

// Botões Editar e Excluir da tabela
document.getElementById("listaOS").addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    const numero = Number(botao.dataset.numero);

    if (botao.dataset.acao === "editar") {
        editarOS(numero);
    }

    if (botao.dataset.acao === "excluir") {
        excluirOS(numero);
    }

    if (botao.dataset.acao === "iniciar") {
        iniciarOS(numero);
    }

    if (botao.dataset.acao === "fechar") {
        fecharOS(numero);
    }
});

filtroSetor.addEventListener("change", desenharLista);
filtroStatus.addEventListener("change", desenharLista);


function desenharLista() {

    const lista = document.getElementById("listaOS");

    // Aplica os filtros e mostra as mais recentes primeiro
    const ordens = carregar("ordens", [])
        .filter(o => filtroSetor.value === "" || o.setor === filtroSetor.value)
        .filter(o => filtroStatus.value === "" || o.status === filtroStatus.value)
        .sort((a, b) => b.numero - a.numero);

    if (ordens.length === 0) {
        lista.innerHTML = `<tr><td colspan="10">Nenhuma ordem de serviço encontrada.</td></tr>`;
        return;
    }

    let html = "";

    for (const os of ordens) {

        // Botões extras conforme o status
        let botoesStatus = "";

        if (os.status === "Aberta") {
            botoesStatus = `<button type="button" data-acao="iniciar" data-numero="${os.numero}">Iniciar</button>`;
        }

        if (os.status !== "Concluída") {
            botoesStatus += ` <button type="button" data-acao="fechar" data-numero="${os.numero}">Fechar OS</button>`;
        }

        html += `
            <tr>
                <td>${numeroFormatado(os.numero)}</td>
                <td>${dataBrasileira(os.data)}</td>
                <td>${escaparHTML(nomeDoSetor(os.setor))}</td>
                <td>${escaparHTML(nomeDaMaquina(os.maquina))}</td>
                <td>${escaparHTML(nomeDoFuncionario(os.funcionario))}</td>
                <td>${escaparHTML(os.tipo)}</td>
                <td>${escaparHTML(os.descricao)}</td>
                <td>${formatar(tempoDeReparo(os), "h")}</td>
                <td><span class="status ${classeDoStatus(os.status)}">${escaparHTML(os.status)}</span></td>
                <td>
                    ${botoesStatus}
                    <button type="button" data-acao="editar" data-numero="${os.numero}">Editar</button>
                    <button type="button" data-acao="excluir" data-numero="${os.numero}">Excluir</button>
                </td>
            </tr>
        `;
    }

    lista.innerHTML = html;
}


// ---------- Início ----------

limparFormulario();

if (faltando.length > 0) {
    mensagem.innerHTML = "Antes de abrir uma OS, cadastre: " + faltando.join(", ") + ".";
}

desenharLista();
