
// Funções usadas por todas as páginas do sistema.
// Os dados ficam salvos no navegador (localStorage), então continuam lá
// mesmo depois de fechar a página.
//
// Chaves usadas:
//   "setores"          -> lista de setores cadastrados
//   "maquinas"         -> lista de máquinas cadastradas
//   "funcionarios"     -> lista de funcionários cadastrados
//   "dadosIndicadores" -> valores digitados nas páginas de indicadores

const TIPOS_MANUTENCAO = ["Civil", "Elétrica", "Mecânica", "Refrigeração"];


// Lê um valor salvo. Se não existir, devolve o valor padrão.
function carregar(chave, padrao) {

    try {
        const texto = localStorage.getItem(chave);

        if (texto === null) {
            return padrao;
        }

        return JSON.parse(texto);
    } catch (erro) {
        return padrao;
    }
}


// Salva um valor (lista ou objeto) no navegador.
function salvar(chave, valor) {

    localStorage.setItem(chave, JSON.stringify(valor));
}


// Evita que um texto digitado (ex.: um nome com "<") quebre o HTML da página.
function escaparHTML(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


// Mostra um número com 2 casas decimais e a unidade, ou "-" se não houver valor.
function formatar(valor, unidade) {

    if (valor === null || !Number.isFinite(valor)) {
        return "-";
    }

    return valor.toFixed(2) + " " + unidade;
}


// Devolve o nome do setor a partir do código (ou "Sem setor").
function nomeDoSetor(codigo) {

    const setor = carregar("setores", []).find(s => s.codigo === codigo);

    if (!setor) {
        return "Sem setor";
    }

    return setor.nome;
}
