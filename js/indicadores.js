
// Usado pelas páginas MTBF e MTTR.
// As duas tabelas têm a mesma estrutura:
// Código | Equipamento | Valor 1 | Valor 2 | Resultado | Ações
// MTBF = horas operando / número de falhas
// MTTR = tempo total de reparo / número de reparos

function adicionarLinha() {

    // Localiza o corpo da tabela da página (MTBF ou MTTR)
    const tabela = document.querySelector("tbody");

    // Cria uma nova linha
    const linha = tabela.insertRow();

    // Insere as células
    linha.innerHTML = `
        <td>
            <input type="text"
                   placeholder="Código">
        </td>

        <td>
            <input type="text"
                   placeholder="Nome do equipamento">
        </td>

        <td>
            <input type="number"
                   min="0"
                   step="any"
                   oninput="calcularIndicador(this)">
        </td>

        <td>
            <input type="number"
                   min="0"
                   step="1"
                   oninput="calcularIndicador(this)">
        </td>

        <td class="resultado">-</td>

        <td>
            <button onclick="removerLinha(this)">
                Excluir
            </button>
        </td>
    `;
}

const botaoAdicionar = document.getElementById("btnAdicionar");

botaoAdicionar.addEventListener("click", adicionarLinha);


function calcularIndicador(campo) {

    // Encontra a linha do campo alterado
    const linha = campo.closest("tr");

    // Seleciona os inputs dessa linha
    const inputs = linha.querySelectorAll("input");

    // Obtém os valores (0 = código, 1 = nome, 2 = valor 1, 3 = valor 2)
    // MTBF: valor 1 = horas operando, valor 2 = falhas
    // MTTR: valor 1 = tempo de reparo, valor 2 = reparos
    const valor1 = Number(inputs[2].value);
    const valor2 = Number(inputs[3].value);

    // Localiza a célula onde ficará o resultado
    const resultado = linha.querySelector(".resultado");

    // Verifica os valores
    if (
        inputs[2].value !== "" &&
        inputs[3].value !== "" &&
        valor1 >= 0 &&
        valor2 > 0 &&
        Number.isInteger(valor2)
    ) {
        const indicador = valor1 / valor2;

        resultado.textContent = indicador.toFixed(2) + " h";
    } else {
        resultado.textContent = "-";
    }
}


function removerLinha(botao) {

    const linha = botao.closest("tr");

    linha.remove();
}
