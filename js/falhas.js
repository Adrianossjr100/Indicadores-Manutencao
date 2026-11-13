
// Registro de falhas críticas (quebras graves, com impacto na produção).
// Cada falha fica ligada a um setor, uma máquina e aos funcionários que atuaram.
// Cada falha: {
//   numero, dataFalha, setor, maquina, impacto, descricao, comoAconteceu,
//   causa, atuaram: [matrículas], os, status, material, previsao,
//   solucao, acoes, dataResolucao
// }
// Status: "Aberta", "Aguardando material" ou "Fechada".

const setores = carregar("setores", []);
const maquinas = carregar("maquinas", []);
const funcionarios = carregar("funcionarios", []);
const ordens = carregar("ordens", []);

const campos = {
    dataFalha: document.getElementById("dataFalha"),
    setor: document.getElementById("setor"),
    maquina: document.getElementById("maquina"),
    impacto: document.getElementById("impacto"),
    descricao: document.getElementById("descricao"),
    comoAconteceu: document.getElementById("comoAconteceu"),
    causa: document.getElementById("causa"),
    os: document.getElementById("os"),
    status: document.getElementById("status"),
    material: document.getElementById("material"),
    previsao: document.getElementById("previsao"),
    solucao: document.getElementById("solucao"),
    acoes: document.getElementById("acoes"),
    dataResolucao: document.getElementById("dataResolucao")
};

const listaAtuaram = document.getElementById("listaAtuaram");
const buscaFuncionario = document.getElementById("buscaFuncionario");
const opcoesFuncionarios = document.getElementById("opcoesFuncionarios");

// Matrículas dos funcionários escolhidos para a falha
let atuaramSelecionados = [];
const blocoMaterial = document.getElementById("blocoMaterial");
const mensagem = document.getElementById("mensagem");
const botaoSalvar = document.getElementById("btnSalvar");
const botaoCancelar = document.getElementById("btnCancelar");
const filtroSetor = document.getElementById("filtroSetor");
const filtroStatus = document.getElementById("filtroStatus");

// Número da falha que está sendo editada (null = registrando uma nova)
let numeroEmEdicao = null;


// ---------- Preenchimento das listas ----------

for (const setor of setores) {
    const opcao = `<option value="${escaparHTML(setor.codigo)}">${escaparHTML(setor.nome)}</option>`;
    campos.setor.innerHTML += opcao;
    filtroSetor.innerHTML += opcao;
}

if (funcionarios.length === 0) {
    buscaFuncionario.disabled = true;
    buscaFuncionario.placeholder = "Nenhum funcionário cadastrado";
}

// Lista o que falta cadastrar (o aviso aparece no início da página)
const faltando = [];

if (setores.length === 0) faltando.push(`<a href="/paginas/setores.html">Setores</a>`);
if (maquinas.length === 0) faltando.push(`<a href="/paginas/maquinas.html">Máquinas</a>`);


// Quando o setor muda, mostra só as máquinas daquele setor
function atualizarMaquinas() {

    const doSetor = maquinas.filter(m => m.setor === campos.setor.value);

    if (campos.setor.value === "") {
        campos.maquina.innerHTML = `<option value="">Escolha o setor primeiro</option>`;
    } else if (doSetor.length === 0) {
        campos.maquina.innerHTML = `<option value="">Nenhuma máquina neste setor</option>`;
    } else {
        let html = `<option value="">Selecione</option>`;

        for (const maquina of doSetor) {
            html += `<option value="${escaparHTML(maquina.codigo)}">` +
                `${escaparHTML(maquina.codigo)} - ${escaparHTML(maquina.nome)}</option>`;
        }

        campos.maquina.innerHTML = html;
    }

    atualizarOrdens();
}


// Mostra só as Ordens de Serviço da máquina escolhida
function atualizarOrdens() {

    const daMaquina = ordens.filter(o => o.maquina === campos.maquina.value);

    let html = `<option value="">Nenhuma</option>`;

    for (const os of daMaquina) {
        html += `<option value="${os.numero}">${numeroOS(os.numero)} - ${escaparHTML(os.descricao)}</option>`;
    }

    campos.os.innerHTML = html;
}


// Mostra os campos de material só quando o status é "Aguardando material"
function atualizarBlocoMaterial() {

    blocoMaterial.hidden = campos.status.value !== "Aguardando material";
}

campos.setor.addEventListener("change", atualizarMaquinas);
campos.maquina.addEventListener("change", atualizarOrdens);
campos.status.addEventListener("change", atualizarBlocoMaterial);


// ---------- Ajudantes ----------

function numeroFalha(numero) {
    return "FL-" + String(numero).padStart(4, "0");
}

function numeroOS(numero) {
    return "OS-" + String(numero).padStart(4, "0");
}


// Horas que a máquina ficou parada (da falha até voltar a funcionar)
function tempoParada(falha) {

    if (!falha.dataFalha || !falha.dataResolucao) {
        return null;
    }

    return (new Date(falha.dataResolucao) - new Date(falha.dataFalha)) / (1000 * 60 * 60);
}


// Ex.: "2026-11-12T08:30" -> "12/11/2026 08:30"
function dataHoraBrasileira(valor) {

    if (!valor) {
        return "-";
    }

    const [data, hora] = valor.split("T");
    const [ano, mes, dia] = data.split("-");

    return dia + "/" + mes + "/" + ano + (hora ? " " + hora : "");
}


function nomeDaMaquina(codigo) {

    const maquina = maquinas.find(m => m.codigo === codigo);

    return maquina ? maquina.codigo + " - " + maquina.nome : codigo + " (excluída)";
}


function nomesDosFuncionarios(matriculas) {

    if (!matriculas || matriculas.length === 0) {
        return "-";
    }

    return matriculas.map(matricula => {
        const funcionario = funcionarios.find(f => f.matricula === matricula);
        return funcionario ? funcionario.nome : matricula + " (excluído)";
    }).join(", ");
}


// Nome da classe CSS que dá a cor do status. Ex.: "Aguardando material" -> "status-aguardando-material"
function classeDoStatus(status) {

    return "status-" + status
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/ /g, "-");
}


// Data e hora de agora no formato do campo (aaaa-mm-ddThh:mm)
function agora() {

    const data = new Date();
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

    return data.toISOString().slice(0, 16);
}


// ---------- Funcionários que atuaram ----------
// Você digita parte do nome ou da matrícula, o navegador sugere,
// e cada funcionário adicionado vira uma etiqueta com um "x" para remover.

// Texto que aparece nas sugestões. Ex.: "101 - Ana (Elétrica)"
function textoDoFuncionario(funcionario) {

    return funcionario.matricula + " - " + funcionario.nome + " (" + funcionario.tipo + ")";
}


// Sugestões: só os funcionários que ainda não foram escolhidos
function atualizarSugestoes() {

    let html = "";

    for (const funcionario of funcionarios) {
        if (!atuaramSelecionados.includes(funcionario.matricula)) {
            html += `<option value="${escaparHTML(textoDoFuncionario(funcionario))}"></option>`;
        }
    }

    opcoesFuncionarios.innerHTML = html;
}


// Mostra os escolhidos como etiquetas
function desenharEtiquetas() {

    let html = "";

    for (const matricula of atuaramSelecionados) {
        html += `
            <span class="etiqueta">
                ${escaparHTML(nomesDosFuncionarios([matricula]))}
                <button type="button" data-matricula="${escaparHTML(matricula)}" title="Remover">&times;</button>
            </span>
        `;
    }

    listaAtuaram.innerHTML = html;
    atualizarSugestoes();
}


function adicionarFuncionario() {

    const texto = buscaFuncionario.value.trim().toLowerCase();

    if (texto === "") {
        return;
    }

    // Aceita o texto da sugestão, a matrícula exata ou o nome exato
    const funcionario = funcionarios.find(f =>
        textoDoFuncionario(f).toLowerCase() === texto ||
        f.matricula.toLowerCase() === texto ||
        f.nome.toLowerCase() === texto
    );

    if (!funcionario) {
        mensagem.textContent = "Funcionário não encontrado. Escolha uma das sugestões da lista.";
        return;
    }

    if (!atuaramSelecionados.includes(funcionario.matricula)) {
        atuaramSelecionados.push(funcionario.matricula);
    }

    buscaFuncionario.value = "";
    mensagem.textContent = "";
    desenharEtiquetas();
    buscaFuncionario.focus();
}

document.getElementById("btnAdicionarFuncionario").addEventListener("click", adicionarFuncionario);

// Enter no campo também adiciona
buscaFuncionario.addEventListener("keydown", function (evento) {

    if (evento.key === "Enter") {
        evento.preventDefault();
        adicionarFuncionario();
    }
});

// O "x" da etiqueta remove o funcionário
listaAtuaram.addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    atuaramSelecionados = atuaramSelecionados.filter(m => m !== botao.dataset.matricula);
    desenharEtiquetas();
});


// ---------- Salvar, editar e excluir ----------

botaoSalvar.addEventListener("click", salvarFalha);
botaoCancelar.addEventListener("click", limparFormulario);


function salvarFalha() {

    const falha = { numero: numeroEmEdicao };

    // Copia o valor de cada campo do formulário para a falha
    for (const nome in campos) {
        falha[nome] = campos[nome].value.trim();
    }

    falha.os = falha.os === "" ? null : Number(falha.os);
    falha.atuaram = [...atuaramSelecionados];

    // Campos obrigatórios
    if (falha.dataFalha === "" || falha.setor === "" || falha.maquina === "" ||
        falha.impacto === "" || falha.descricao === "") {
        mensagem.textContent = "Preencha data, setor, máquina, impacto e o que aconteceu.";
        return;
    }

    if (falha.status === "Aguardando material" && falha.material === "") {
        mensagem.textContent = "Informe qual material está sendo aguardado.";
        return;
    }

    // Para fechar, a análise precisa estar completa
    if (falha.status === "Fechada") {
        if (falha.causa === "" || falha.solucao === "" || falha.dataResolucao === "" ||
            falha.atuaram.length === 0) {
            mensagem.textContent = "Para fechar, preencha causa raiz, quem atuou, como foi resolvido " +
                "e quando a máquina voltou a funcionar.";
            return;
        }
    }

    if (falha.dataResolucao !== "" && new Date(falha.dataResolucao) < new Date(falha.dataFalha)) {
        mensagem.textContent = "A data em que voltou a funcionar está antes da data da falha.";
        return;
    }

    // Material só fica guardado enquanto estiver aguardando
    if (falha.status !== "Aguardando material") {
        falha.material = "";
        falha.previsao = "";
    }

    const falhas = carregar("falhas", []);
    let texto = "";

    if (numeroEmEdicao === null) {
        const maior = falhas.reduce((max, f) => Math.max(max, f.numero), 0);
        falha.numero = maior + 1;
        falhas.push(falha);
        texto = numeroFalha(falha.numero) + " registrada.";
    } else {
        const posicao = falhas.findIndex(f => f.numero === numeroEmEdicao);
        falhas[posicao] = falha;
        texto = numeroFalha(falha.numero) + " atualizada.";
    }

    salvar("falhas", falhas);

    limparFormulario();
    mensagem.textContent = texto;
    desenharLista();
}


function editarFalha(numero) {

    const falha = carregar("falhas", []).find(f => f.numero === numero);

    if (!falha) {
        return;
    }

    numeroEmEdicao = numero;

    campos.dataFalha.value = falha.dataFalha;
    campos.setor.value = falha.setor;
    atualizarMaquinas();
    campos.maquina.value = falha.maquina;
    atualizarOrdens();
    campos.os.value = falha.os === null ? "" : String(falha.os);
    campos.impacto.value = falha.impacto;
    campos.descricao.value = falha.descricao;
    campos.comoAconteceu.value = falha.comoAconteceu;
    campos.causa.value = falha.causa;
    campos.status.value = falha.status;
    campos.material.value = falha.material;
    campos.previsao.value = falha.previsao;
    campos.solucao.value = falha.solucao;
    campos.acoes.value = falha.acoes;
    campos.dataResolucao.value = falha.dataResolucao;
    atualizarBlocoMaterial();

    atuaramSelecionados = [...falha.atuaram];
    desenharEtiquetas();

    document.getElementById("tituloFormulario").textContent = "Editando " + numeroFalha(numero);
    botaoSalvar.textContent = "Salvar alterações";
    botaoCancelar.hidden = false;
    mensagem.textContent = "";

    window.scrollTo(0, 0);
}


// Botão "Fechar": abre a falha no formulário já como Fechada,
// para completar a análise antes de salvar
function fecharFalha(numero) {

    editarFalha(numero);

    campos.status.value = "Fechada";
    atualizarBlocoMaterial();

    if (campos.dataResolucao.value === "") {
        campos.dataResolucao.value = agora();
    }

    mensagem.textContent = "Complete a análise (causa, quem atuou e como foi resolvido) e clique em Salvar alterações.";
}


function excluirFalha(numero) {

    if (!confirm("Excluir a " + numeroFalha(numero) + "?")) {
        return;
    }

    const falhas = carregar("falhas", []).filter(f => f.numero !== numero);
    salvar("falhas", falhas);

    if (numeroEmEdicao === numero) {
        limparFormulario();
    }

    mensagem.textContent = numeroFalha(numero) + " excluída.";
    desenharLista();
}


function limparFormulario() {

    numeroEmEdicao = null;

    for (const nome in campos) {
        campos[nome].value = "";
    }

    campos.dataFalha.value = agora();
    campos.status.value = "Aberta";
    atualizarMaquinas();
    atualizarBlocoMaterial();

    atuaramSelecionados = [];
    buscaFuncionario.value = "";
    desenharEtiquetas();

    document.getElementById("tituloFormulario").textContent = "Registrar Falha";
    botaoSalvar.textContent = "Registrar falha";
    botaoCancelar.hidden = true;
    mensagem.textContent = "";
}


// ---------- Lista ----------

const lista = document.getElementById("listaFalhas");

// Botões da tabela
lista.addEventListener("click", function (evento) {

    const botao = evento.target.closest("button");

    if (!botao) {
        return;
    }

    const numero = Number(botao.dataset.numero);

    switch (botao.dataset.acao) {
        case "detalhes":
            alternarDetalhes(numero, botao);
            break;
        case "fechar":
            fecharFalha(numero);
            break;
        case "editar":
            editarFalha(numero);
            break;
        case "excluir":
            excluirFalha(numero);
            break;
    }
});

filtroSetor.addEventListener("change", desenharLista);
filtroStatus.addEventListener("change", desenharLista);


// Mostra ou esconde a análise completa embaixo da linha
function alternarDetalhes(numero, botao) {

    const linhaDetalhes = lista.querySelector(`tr.detalhes[data-numero="${numero}"]`);

    linhaDetalhes.hidden = !linhaDetalhes.hidden;
    botao.textContent = linhaDetalhes.hidden ? "Detalhes" : "Ocultar";
}


// Texto com quebras de linha mantidas
function paragrafo(texto) {

    if (!texto) {
        return "-";
    }

    return escaparHTML(texto).replace(/\n/g, "<br>");
}


function htmlDetalhes(falha) {

    let material = "";

    if (falha.status === "Aguardando material") {
        material = `
            <p><strong>Material aguardado:</strong> ${paragrafo(falha.material)}</p>
            <p><strong>Previsão de chegada:</strong> ${dataHoraBrasileira(falha.previsao)}</p>
        `;
    }

    return `
        <div class="analise">
            <p><strong>Como aconteceu:</strong> ${paragrafo(falha.comoAconteceu)}</p>
            <p><strong>Causa raiz:</strong> ${paragrafo(falha.causa)}</p>
            <p><strong>Quem atuou:</strong> ${escaparHTML(nomesDosFuncionarios(falha.atuaram))}</p>
            <p><strong>Ordem de Serviço:</strong> ${falha.os === null ? "-" : numeroOS(falha.os)}</p>
            ${material}
            <p><strong>Como foi resolvido:</strong> ${paragrafo(falha.solucao)}</p>
            <p><strong>Ações para não acontecer de novo:</strong> ${paragrafo(falha.acoes)}</p>
            <p><strong>Voltou a funcionar em:</strong> ${dataHoraBrasileira(falha.dataResolucao)}</p>
        </div>
    `;
}


function desenharLista() {

    // Aplica os filtros e mostra as mais recentes primeiro
    const falhas = carregar("falhas", [])
        .filter(f => filtroSetor.value === "" || f.setor === filtroSetor.value)
        .filter(f => filtroStatus.value === "" || f.status === filtroStatus.value)
        .sort((a, b) => b.numero - a.numero);

    if (falhas.length === 0) {
        lista.innerHTML = `<tr><td colspan="9">Nenhuma falha encontrada.</td></tr>`;
        return;
    }

    let html = "";

    for (const falha of falhas) {

        let botaoFechar = "";

        if (falha.status !== "Fechada") {
            botaoFechar = `<button type="button" data-acao="fechar" data-numero="${falha.numero}">Fechar</button>`;
        }

        html += `
            <tr>
                <td>${numeroFalha(falha.numero)}</td>
                <td>${dataHoraBrasileira(falha.dataFalha)}</td>
                <td>${escaparHTML(nomeDoSetor(falha.setor))}</td>
                <td>${escaparHTML(nomeDaMaquina(falha.maquina))}</td>
                <td>${escaparHTML(falha.impacto)}</td>
                <td>${escaparHTML(falha.descricao)}</td>
                <td>${formatar(tempoParada(falha), "h")}</td>
                <td><span class="status ${classeDoStatus(falha.status)}">${escaparHTML(falha.status)}</span></td>
                <td>
                    <button type="button" data-acao="detalhes" data-numero="${falha.numero}">Detalhes</button>
                    ${botaoFechar}
                    <button type="button" data-acao="editar" data-numero="${falha.numero}">Editar</button>
                    <button type="button" data-acao="excluir" data-numero="${falha.numero}">Excluir</button>
                </td>
            </tr>
            <tr class="detalhes" data-numero="${falha.numero}" hidden>
                <td colspan="9">${htmlDetalhes(falha)}</td>
            </tr>
        `;
    }

    lista.innerHTML = html;
}


// ---------- Início ----------

limparFormulario();

if (faltando.length > 0) {
    mensagem.innerHTML = "Antes de registrar uma falha, cadastre: " + faltando.join(", ") + ".";
}

desenharLista();
