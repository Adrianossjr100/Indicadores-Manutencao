
// Dashboard: resumo de tudo o que foi cadastrado no sistema.
// Lê os mesmos dados das outras páginas (salvos no navegador) e não altera nada.
// O filtro de setor no topo vale para todos os números e gráficos.

const setores = carregar("setores", []);
const maquinas = carregar("maquinas", []);
const funcionarios = carregar("funcionarios", []);
const ordens = carregar("ordens", []);
const falhas = carregar("falhas", []);
const dados = carregar("dadosIndicadores", {});

const filtroSetor = document.getElementById("filtroSetor");

for (const setor of setores) {
    filtroSetor.innerHTML += `<option value="${escaparHTML(setor.codigo)}">${escaparHTML(setor.nome)}</option>`;
}

filtroSetor.addEventListener("change", desenharDashboard);


// ---------- Cálculos (as mesmas fórmulas da página de indicadores) ----------

function valorSalvo(indicador, id, campo) {

    if (dados[indicador] && dados[indicador][id] && dados[indicador][id][campo] !== undefined) {
        return dados[indicador][id][campo];
    }

    return "";
}


// MTBF de um grupo de máquinas = soma das horas / soma das falhas
function mtbfDoGrupo(lista) {

    let horas = 0;
    let falhasTotal = 0;

    for (const maquina of lista) {
        const qtd = Number(valorSalvo("mtbf", maquina.codigo, "falhas"));

        if (qtd > 0) {
            horas += maquina.horasMes;
            falhasTotal += qtd;
        }
    }

    return falhasTotal > 0 ? horas / falhasTotal : null;
}


// MTTR de um grupo = soma do tempo de reparo / soma dos reparos
function mttrDoGrupo(lista) {

    let tempo = 0;
    let reparos = 0;

    for (const maquina of lista) {
        const t = valorSalvo("mttr", maquina.codigo, "tempoReparo");
        const r = Number(valorSalvo("mttr", maquina.codigo, "reparos"));

        if (t !== "" && r > 0) {
            tempo += Number(t);
            reparos += r;
        }
    }

    return reparos > 0 ? tempo / reparos : null;
}


function disponibilidadeDoGrupo(lista) {

    const mtbf = mtbfDoGrupo(lista);
    const mttr = mttrDoGrupo(lista);

    if (mtbf === null || mttr === null || mtbf + mttr === 0) {
        return null;
    }

    return mtbf / (mtbf + mttr) * 100;
}


// Horas entre duas datas (null se faltar alguma)
function horasEntre(inicio, fim) {

    if (!inicio || !fim) {
        return null;
    }

    return (new Date(fim) - new Date(inicio)) / (1000 * 60 * 60);
}


// Aproveitamento do HH = horas apontadas / horas disponíveis
function aproveitamentoHH(lista) {

    let disponiveis = 0;
    let apontadas = 0;

    for (const funcionario of lista) {
        const dias = valorSalvo("hh", funcionario.matricula, "dias");
        const horas = valorSalvo("hh", funcionario.matricula, "horasApontadas");

        if (dias !== "" && horas !== "") {
            disponiveis += funcionario.horasDia * Number(dias);
            apontadas += Number(horas);
        }
    }

    return disponiveis > 0 ? apontadas / disponiveis * 100 : null;
}


// ---------- Peças visuais ----------

// Um cartão com um número grande
function cartao(titulo, valor, detalhe) {

    return `
        <div class="cartao">
            <span class="cartao-titulo">${titulo}</span>
            <span class="cartao-valor">${valor}</span>
            <span class="cartao-detalhe">${detalhe}</span>
        </div>
    `;
}


// Gráfico de barras horizontais.
// itens: [{ rotulo, valor, texto, classe }]
//   valor  -> tamanho da barra (número)
//   texto  -> o que aparece escrito ao lado da barra
//   classe -> cor opcional da barra (ex.: "barra-aberta")
function graficoBarras(elemento, itens, maximo) {

    const comValor = itens.filter(item => item.valor !== null);

    if (comValor.length === 0) {
        elemento.innerHTML = `<p class="vazio">Sem dados ainda.</p>`;
        return;
    }

    // A maior barra ocupa a largura toda (ou o máximo informado, ex.: 100 para %)
    const maior = maximo || Math.max(...comValor.map(item => item.valor), 1);

    let html = "";

    for (const item of itens) {
        const largura = item.valor === null ? 0 : Math.max(item.valor / maior * 100, 0.5);

        html += `
            <div class="barra-linha" title="${escaparHTML(item.rotulo)}: ${item.texto}">
                <span class="barra-rotulo">${escaparHTML(item.rotulo)}</span>
                <div class="barra-trilho">
                    <div class="barra ${item.classe || ""}" style="width: ${largura}%"></div>
                </div>
                <span class="barra-valor">${item.texto}</span>
            </div>
        `;
    }

    elemento.innerHTML = html;
}


function numeroFalha(numero) {
    return "FL-" + String(numero).padStart(4, "0");
}


// ---------- Montagem do dashboard ----------

function desenharDashboard() {

    const setorEscolhido = filtroSetor.value;

    // Aplica o filtro de setor
    const setoresVisiveis = setores.filter(s => setorEscolhido === "" || s.codigo === setorEscolhido);
    const maquinasVisiveis = maquinas.filter(m => setorEscolhido === "" || m.setor === setorEscolhido);
    const ordensVisiveis = ordens.filter(o => setorEscolhido === "" || o.setor === setorEscolhido);
    const falhasVisiveis = falhas.filter(f => setorEscolhido === "" || f.setor === setorEscolhido);

    // ----- Cartões -----
    const osPendentes = ordensVisiveis.filter(o => o.status !== "Concluída").length;
    const osAndamento = ordensVisiveis.filter(o => o.status === "Em andamento").length;
    const falhasAbertas = falhasVisiveis.filter(f => f.status !== "Fechada");
    const aguardando = falhasAbertas.filter(f => f.status === "Aguardando material").length;
    const disponibilidade = disponibilidadeDoGrupo(maquinasVisiveis);
    const aproveitamento = aproveitamentoHH(funcionarios);

    document.getElementById("cartoes").innerHTML =
        cartao("Máquinas", maquinasVisiveis.length, setoresVisiveis.length + " setor(es)") +
        cartao("OS pendentes", osPendentes, osAndamento + " em andamento") +
        cartao("Falhas em aberto", falhasAbertas.length, aguardando + " aguardando material") +
        cartao("Disponibilidade", formatar(disponibilidade, "%"), "MTBF ÷ (MTBF + MTTR)") +
        cartao("Aproveitamento HH", formatar(aproveitamento, "%"), "todos os funcionários");

    // ----- Gráficos por setor -----
    const grupos = setoresVisiveis.map(setor => ({
        nome: setor.nome,
        codigo: setor.codigo,
        maquinas: maquinas.filter(m => m.setor === setor.codigo)
    }));

    graficoBarras(document.getElementById("graficoDisponibilidade"), grupos.map(g => {
        const valor = disponibilidadeDoGrupo(g.maquinas);
        return { rotulo: g.nome, valor: valor, texto: formatar(valor, "%") };
    }), 100);

    graficoBarras(document.getElementById("graficoMTBF"), grupos.map(g => {
        const valor = mtbfDoGrupo(g.maquinas);
        return { rotulo: g.nome, valor: valor, texto: formatar(valor, "h") };
    }));

    graficoBarras(document.getElementById("graficoMTTR"), grupos.map(g => {
        const valor = mttrDoGrupo(g.maquinas);
        return { rotulo: g.nome, valor: valor, texto: formatar(valor, "h") };
    }));

    graficoBarras(document.getElementById("graficoParada"), grupos.map(g => {
        let horas = 0;
        let temDado = false;

        for (const falha of falhas.filter(f => f.setor === g.codigo)) {
            const parada = horasEntre(falha.dataFalha, falha.dataResolucao);

            if (parada !== null) {
                horas += parada;
                temDado = true;
            }
        }

        const valor = temDado ? horas : null;
        return { rotulo: g.nome, valor: valor, texto: formatar(valor, "h") };
    }));

    // ----- Máquinas com mais falhas (as 8 primeiras) -----
    const contagem = {};

    for (const falha of falhasVisiveis) {
        contagem[falha.maquina] = (contagem[falha.maquina] || 0) + 1;
    }

    const ranking = Object.keys(contagem)
        .map(codigo => {
            const maquina = maquinas.find(m => m.codigo === codigo);
            return { rotulo: maquina ? maquina.nome : codigo, valor: contagem[codigo] };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8)
        .map(item => ({ ...item, texto: item.valor + (item.valor === 1 ? " falha" : " falhas") }));

    graficoBarras(document.getElementById("graficoFalhasMaquina"), ranking);

    // ----- OS por status (com a cor de cada status) -----
    const status = [
        { nome: "Aberta", classe: "barra-aberta" },
        { nome: "Em andamento", classe: "barra-andamento" },
        { nome: "Concluída", classe: "barra-concluida" }
    ];

    graficoBarras(document.getElementById("graficoOS"), ordensVisiveis.length === 0 ? [] : status.map(s => {
        const qtd = ordensVisiveis.filter(o => o.status === s.nome).length;
        return { rotulo: s.nome, valor: qtd, texto: String(qtd), classe: s.classe };
    }));

    // ----- Tabela de falhas em aberto (as mais antigas primeiro) -----
    const corpo = document.getElementById("tabelaPendencias");

    if (falhasAbertas.length === 0) {
        corpo.innerHTML = `<tr><td colspan="6">Nenhuma falha em aberto.</td></tr>`;
        return;
    }

    let html = "";

    for (const falha of falhasAbertas.sort((a, b) => new Date(a.dataFalha) - new Date(b.dataFalha))) {
        const maquina = maquinas.find(m => m.codigo === falha.maquina);
        const dias = Math.floor(horasEntre(falha.dataFalha, new Date()) / 24);
        const classe = falha.status === "Aguardando material" ? "selo-aguardando" : "selo-aberta";

        html += `
            <tr>
                <td>${numeroFalha(falha.numero)}</td>
                <td>${escaparHTML(maquina ? maquina.nome : falha.maquina)}</td>
                <td>${escaparHTML(nomeDoSetor(falha.setor))}</td>
                <td>${escaparHTML(falha.impacto)}</td>
                <td><span class="selo ${classe}">${escaparHTML(falha.status)}</span></td>
                <td>${dias} ${dias === 1 ? "dia" : "dias"}</td>
            </tr>
        `;
    }

    corpo.innerHTML = html;
}

desenharDashboard();
