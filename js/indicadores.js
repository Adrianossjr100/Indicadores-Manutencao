
// Usado por todas as páginas de indicadores (precisa do main.js antes).
//
// As linhas das tabelas vêm dos cadastros:
//   MTBF, MTTR, Disponibilidade e Confiabilidade -> máquinas cadastradas
//   Homem Hora                                   -> funcionários cadastrados
// Na página de indicadores você só digita os dados do cálculo. Eles ficam salvos.
//
// Fórmulas:
//   MTBF            = horas de operação no mês / número de falhas
//   MTTR            = tempo total de reparo / número de reparos
//   Disponibilidade = MTBF / (MTBF + MTTR) x 100   (usa os valores das páginas MTBF e MTTR)
//   Confiabilidade  = e^(-tempo de operação / MTBF) x 100
//   Homem Hora      = horas disponíveis (horas por dia x dias trabalhados)
//                     comparadas com as horas apontadas
//
// Por setor (páginas das máquinas):
//   MTBF do setor            = soma das horas / soma das falhas
//   MTTR do setor            = soma do tempo de reparo / soma dos reparos
//   Disponibilidade do setor = MTBF do setor / (MTBF do setor + MTTR do setor) x 100
//   Confiabilidade do setor  = média da confiabilidade das máquinas do setor

// (a página pode ter outras tabelas, como o resumo por setor)
const tabela = document.querySelector("tbody[data-indicador]");

// Qual indicador é esta página (atributo data-indicador do tbody)
const indicador = tabela.dataset.indicador;

const setores = carregar("setores", []);
const maquinas = carregar("maquinas", []);
const funcionarios = carregar("funcionarios", []);
const dados = carregar("dadosIndicadores", {});


// ---------- Valores digitados ----------

// Lê um valor digitado antes. Ex.: valorSalvo("mtbf", "EQ-01", "falhas")
function valorSalvo(qualIndicador, id, campo) {

    if (dados[qualIndicador] && dados[qualIndicador][id] && dados[qualIndicador][id][campo] !== undefined) {
        return dados[qualIndicador][id][campo];
    }

    return "";
}


// Guarda um valor digitado nesta página
function guardarValor(id, campo, valor) {

    if (!dados[indicador]) {
        dados[indicador] = {};
    }

    if (!dados[indicador][id]) {
        dados[indicador][id] = {};
    }

    dados[indicador][id][campo] = valor;

    salvar("dadosIndicadores", dados);
}


// Cria um campo de número já preenchido com o valor salvo
function campoNumero(id, campo, passo) {

    const valor = valorSalvo(indicador, id, campo);

    return `
        <input type="number"
               min="0"
               step="${passo}"
               data-id="${escaparHTML(id)}"
               data-campo="${campo}"
               value="${escaparHTML(valor)}">
    `;
}


// ---------- Cálculos (devolvem null quando falta algum dado) ----------

function calcularMTBF(maquina) {

    const falhas = Number(valorSalvo("mtbf", maquina.codigo, "falhas"));

    if (!(falhas > 0) || !Number.isInteger(falhas)) {
        return null;
    }

    return maquina.horasMes / falhas;
}


function calcularMTTR(maquina) {

    const tempoReparo = valorSalvo("mttr", maquina.codigo, "tempoReparo");
    const reparos = Number(valorSalvo("mttr", maquina.codigo, "reparos"));

    if (tempoReparo === "" || !(reparos > 0) || !Number.isInteger(reparos)) {
        return null;
    }

    return Number(tempoReparo) / reparos;
}


function calcularDisponibilidade(maquina) {

    const mtbf = calcularMTBF(maquina);
    const mttr = calcularMTTR(maquina);

    if (mtbf === null || mttr === null || mtbf + mttr === 0) {
        return null;
    }

    return mtbf / (mtbf + mttr) * 100;
}


function calcularConfiabilidade(maquina) {

    const mtbf = calcularMTBF(maquina);
    const tempo = valorSalvo("confiabilidade", maquina.codigo, "tempo");

    if (mtbf === null || mtbf === 0 || tempo === "") {
        return null;
    }

    return Math.exp(-Number(tempo) / mtbf) * 100;
}


function calcularHorasDisponiveis(funcionario) {

    const dias = valorSalvo("hh", funcionario.matricula, "dias");

    if (dias === "") {
        return null;
    }

    return funcionario.horasDia * Number(dias);
}


function calcularHorasApontadas(funcionario) {

    const horas = valorSalvo("hh", funcionario.matricula, "horasApontadas");

    if (horas === "") {
        return null;
    }

    return Number(horas);
}


function calcularAproveitamento(funcionario) {

    const disponiveis = calcularHorasDisponiveis(funcionario);
    const apontadas = calcularHorasApontadas(funcionario);

    if (disponiveis === null || apontadas === null || disponiveis === 0) {
        return null;
    }

    return apontadas / disponiveis * 100;
}


// ---------- Montagem da tabela ----------

// Células de cada linha, conforme o indicador da página
function celulasDaLinha(item) {

    switch (indicador) {

        case "mtbf":
            return `
                <td>${escaparHTML(item.codigo)}</td>
                <td>${escaparHTML(item.nome)}</td>
                <td>${escaparHTML(nomeDoSetor(item.setor))}</td>
                <td>${formatar(item.horasMes, "h")}</td>
                <td>${campoNumero(item.codigo, "falhas", "1")}</td>
                <td class="resultado"></td>
            `;

        case "mttr":
            return `
                <td>${escaparHTML(item.codigo)}</td>
                <td>${escaparHTML(item.nome)}</td>
                <td>${escaparHTML(nomeDoSetor(item.setor))}</td>
                <td>${campoNumero(item.codigo, "tempoReparo", "any")}</td>
                <td>${campoNumero(item.codigo, "reparos", "1")}</td>
                <td class="resultado"></td>
            `;

        case "disponibilidade":
            return `
                <td>${escaparHTML(item.codigo)}</td>
                <td>${escaparHTML(item.nome)}</td>
                <td>${escaparHTML(nomeDoSetor(item.setor))}</td>
                <td>${formatar(calcularMTBF(item), "h")}</td>
                <td>${formatar(calcularMTTR(item), "h")}</td>
                <td class="resultado"></td>
            `;

        case "confiabilidade":
            return `
                <td>${escaparHTML(item.codigo)}</td>
                <td>${escaparHTML(item.nome)}</td>
                <td>${escaparHTML(nomeDoSetor(item.setor))}</td>
                <td>${formatar(calcularMTBF(item), "h")}</td>
                <td>${campoNumero(item.codigo, "tempo", "any")}</td>
                <td class="resultado"></td>
            `;

        case "hh":
            return `
                <td>${escaparHTML(item.matricula)}</td>
                <td>${escaparHTML(item.nome)}</td>
                <td>${escaparHTML(item.cargo)}</td>
                <td>${escaparHTML(item.tipo)}</td>
                <td>${formatar(item.horasDia, "h")}</td>
                <td>${campoNumero(item.matricula, "dias", "1")}</td>
                <td class="disponiveis"></td>
                <td>${campoNumero(item.matricula, "horasApontadas", "any")}</td>
                <td class="resultado"></td>
            `;
    }
}


// Atualiza os resultados de uma linha
function calcularLinha(linha) {

    const id = linha.dataset.id;
    const resultado = linha.querySelector(".resultado");

    if (indicador === "hh") {
        const funcionario = funcionarios.find(f => f.matricula === id);

        linha.querySelector(".disponiveis").textContent = formatar(calcularHorasDisponiveis(funcionario), "h");
        resultado.textContent = formatar(calcularAproveitamento(funcionario), "%");
        return;
    }

    const maquina = maquinas.find(m => m.codigo === id);

    switch (indicador) {
        case "mtbf":
            resultado.textContent = formatar(calcularMTBF(maquina), "h");
            break;
        case "mttr":
            resultado.textContent = formatar(calcularMTTR(maquina), "h");
            break;
        case "disponibilidade":
            resultado.textContent = formatar(calcularDisponibilidade(maquina), "%");
            break;
        case "confiabilidade":
            resultado.textContent = formatar(calcularConfiabilidade(maquina), "%");
            break;
    }
}


// Monta uma linha para cada máquina ou funcionário cadastrado
function desenharTabela() {

    const colunas = tabela.closest("table").querySelectorAll("thead th").length;

    let lista = maquinas;
    let aviso = `Nenhuma máquina cadastrada. Cadastre na página <a href="/paginas/maquinas.html">Máquinas</a>.`;

    if (indicador === "hh") {
        lista = funcionarios;
        aviso = `Nenhum funcionário cadastrado. Cadastre na página <a href="/paginas/funcionarios.html">Funcionários</a>.`;
    }

    if (lista.length === 0) {
        tabela.innerHTML = `<tr><td colspan="${colunas}">${aviso}</td></tr>`;
        return;
    }

    tabela.innerHTML = "";

    for (const item of lista) {
        const linha = tabela.insertRow();

        if (indicador === "hh") {
            linha.dataset.id = item.matricula;
        } else {
            linha.dataset.id = item.codigo;
            linha.dataset.setor = codigoDoGrupo(item);
        }

        linha.innerHTML = celulasDaLinha(item);
        calcularLinha(linha);
    }
}


// ---------- Setores ----------

// Código usado para agrupar a máquina: o código do setor, ou "sem" se não tiver setor válido
function codigoDoGrupo(maquina) {

    if (setores.some(s => s.codigo === maquina.setor)) {
        return maquina.setor;
    }

    return "sem";
}


// Separa as máquinas por setor: [{ codigo, nome, maquinas: [...] }, ...]
function gruposPorSetor() {

    const grupos = [];

    for (const setor of setores) {
        grupos.push({
            codigo: setor.codigo,
            nome: setor.nome,
            maquinas: maquinas.filter(m => m.setor === setor.codigo)
        });
    }

    const semSetor = maquinas.filter(m => codigoDoGrupo(m) === "sem");

    if (semSetor.length > 0) {
        grupos.push({ codigo: "sem", nome: "Sem setor", maquinas: semSetor });
    }

    return grupos;
}


function mtbfDoGrupo(lista) {

    let horas = 0;
    let falhas = 0;

    for (const maquina of lista) {
        // Só entra no cálculo a máquina que já tem falhas informadas
        if (calcularMTBF(maquina) !== null) {
            horas += maquina.horasMes;
            falhas += Number(valorSalvo("mtbf", maquina.codigo, "falhas"));
        }
    }

    if (falhas === 0) {
        return null;
    }

    return horas / falhas;
}


function mttrDoGrupo(lista) {

    let tempo = 0;
    let reparos = 0;

    for (const maquina of lista) {
        if (calcularMTTR(maquina) !== null) {
            tempo += Number(valorSalvo("mttr", maquina.codigo, "tempoReparo"));
            reparos += Number(valorSalvo("mttr", maquina.codigo, "reparos"));
        }
    }

    if (reparos === 0) {
        return null;
    }

    return tempo / reparos;
}


function disponibilidadeDoGrupo(lista) {

    const mtbf = mtbfDoGrupo(lista);
    const mttr = mttrDoGrupo(lista);

    if (mtbf === null || mttr === null || mtbf + mttr === 0) {
        return null;
    }

    return mtbf / (mtbf + mttr) * 100;
}


function confiabilidadeDoGrupo(lista) {

    const valores = lista.map(calcularConfiabilidade).filter(v => v !== null);

    if (valores.length === 0) {
        return null;
    }

    const soma = valores.reduce((total, v) => total + v, 0);

    return soma / valores.length;
}


// Preenche a tabela "Resultado por Setor"
function atualizarResumoSetores() {

    const corpo = document.getElementById("resumoSetores");

    // Só existe nas páginas das máquinas
    if (!corpo) {
        return;
    }

    const grupos = gruposPorSetor();

    if (grupos.length === 0) {
        corpo.innerHTML = `<tr><td colspan="3">Nenhum setor cadastrado. Cadastre na página <a href="/paginas/setores.html">Setores</a>.</td></tr>`;
        return;
    }

    let html = "";

    for (const grupo of grupos) {
        let resultado = "-";

        switch (indicador) {
            case "mtbf":
                resultado = formatar(mtbfDoGrupo(grupo.maquinas), "h");
                break;
            case "mttr":
                resultado = formatar(mttrDoGrupo(grupo.maquinas), "h");
                break;
            case "disponibilidade":
                resultado = formatar(disponibilidadeDoGrupo(grupo.maquinas), "%");
                break;
            case "confiabilidade":
                resultado = formatar(confiabilidadeDoGrupo(grupo.maquinas), "%");
                break;
        }

        html += `
            <tr>
                <td>${escaparHTML(grupo.nome)}</td>
                <td>${grupo.maquinas.length}</td>
                <td>${resultado}</td>
            </tr>
        `;
    }

    corpo.innerHTML = html;
}


// Lista de setores do filtro e o que acontece ao escolher um
function prepararFiltro() {

    const filtro = document.getElementById("filtroSetor");

    // Só existe nas páginas das máquinas
    if (!filtro) {
        return;
    }

    for (const grupo of gruposPorSetor()) {
        filtro.innerHTML += `<option value="${escaparHTML(grupo.codigo)}">${escaparHTML(grupo.nome)}</option>`;
    }

    // Mostra só as linhas do setor escolhido ("" = todos)
    filtro.addEventListener("change", function () {

        for (const linha of tabela.querySelectorAll("tr[data-id]")) {
            if (filtro.value === "" || linha.dataset.setor === filtro.value) {
                linha.style.display = "";
            } else {
                linha.style.display = "none";
            }
        }
    });
}


// ---------- Resumo do Homem Hora ----------

// Soma horas disponíveis e apontadas por tipo de manutenção
function atualizarResumoHH() {

    const resumo = document.getElementById("resumoHH");

    // Só existe na página de Homem Hora
    if (!resumo) {
        return;
    }

    if (funcionarios.length === 0) {
        resumo.innerHTML = "<li>Nenhum funcionário cadastrado</li>";
        return;
    }

    const totais = {};

    for (const tipo of TIPOS_MANUTENCAO) {
        totais[tipo] = { disponiveis: 0, apontadas: 0 };
    }

    const geral = { disponiveis: 0, apontadas: 0 };

    for (const funcionario of funcionarios) {
        const disponiveis = calcularHorasDisponiveis(funcionario) || 0;
        const apontadas = calcularHorasApontadas(funcionario) || 0;

        if (totais[funcionario.tipo]) {
            totais[funcionario.tipo].disponiveis += disponiveis;
            totais[funcionario.tipo].apontadas += apontadas;
        }

        geral.disponiveis += disponiveis;
        geral.apontadas += apontadas;
    }

    let html = "";

    for (const tipo of TIPOS_MANUTENCAO) {
        html += `<li>${tipo}: ${formatar(totais[tipo].apontadas, "HH")} apontadas de ${formatar(totais[tipo].disponiveis, "h")} disponíveis</li>`;
    }

    html += `<li><strong>Total: ${formatar(geral.apontadas, "HH")} apontadas de ${formatar(geral.disponiveis, "h")} disponíveis</strong></li>`;

    resumo.innerHTML = html;
}


// ---------- Início ----------

// Quando um campo é alterado: salva o valor e recalcula a linha
tabela.addEventListener("input", function (evento) {

    const campo = evento.target;

    if (!campo.dataset.campo) {
        return;
    }

    guardarValor(campo.dataset.id, campo.dataset.campo, campo.value);
    calcularLinha(campo.closest("tr"));
    atualizarResumoHH();
    atualizarResumoSetores();
});

desenharTabela();
prepararFiltro();
atualizarResumoHH();
atualizarResumoSetores();
