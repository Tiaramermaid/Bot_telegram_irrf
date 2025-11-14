// ================================================
// ARQUIVO DE CONFIGURAÇÃO DO BOT DE IMPOSTO DE RENDA
// ================================================

// Carrega variáveis do arquivo .env
require('dotenv').config();

// Importa Telegraf
const { Telegraf, Markup } = require('telegraf');

// Inicialização
const token = process.env.BOT_TOKEN;
const timestamp = new Date().toISOString();

if (!token) {
    console.error("ERRO: Token do bot não foi encontrado no arquivo .env!");
    process.exit(1);
}

const tokenDisplay = token.substring(0, 6) + '...';
console.log(`[${timestamp}] INFO: Token recebido com sucesso — Início: ${tokenDisplay} 🤖`);

const bot = new Telegraf(token);

// ======================================================
// FUNÇÃO AUXILIAR DE LOG
// ======================================================
function logAcao(ctx, command, acao, isCommand = true) {
    const message = ctx.message || ctx.update.message;
    const userId = ctx.from.id;
    const userName = ctx.from.username || 'N/A';
    const firstName = ctx.from.first_name || 'N/A';
    const chatType = ctx.chat.type;

    const logCommand = isCommand ? command : 'TEXTO';

    const logMessage = `[${new Date().toISOString()}] COMANDO:${logCommand} | TIPO:${chatType} | USUARIO_ID:${userId} | USUARIO_NOME:@${userName} | FIRST_NAME:${firstName} | AÇÃO:${acao}`;
    console.log(logMessage);
}

// ======================================================
// MENU PRINCIPAL / START
// ======================================================
let modoCalculo = null;

bot.start((ctx) => {
    ctx.reply(
        "Olá!! Eu sou o bot de cálculo de impostos CLT. Escolha uma opção:",
        Markup.inlineKeyboard([
            [Markup.button.callback("💸 Calcular IRRF", "irrf")],
            [Markup.button.callback("💼 Calcular INSS", "inss")],
            [Markup.button.callback("🏦 Calcular FGTS", "fgts")]
        ])
    );

    logAcao(ctx, '/start', 'Mensagem inicial enviada.');
});

// ======================================================
// AÇÕES DOS BOTÕES
// ======================================================
bot.action("irrf", (ctx) => {
    modoCalculo = "irrf";
    ctx.reply("📊 Envie o salário bruto e o número de dependentes.\nExemplo: `3000 2`", { parse_mode: "Markdown" });
    logAcao(ctx, 'irrf', 'Cálculo de IRRF selecionado.');
});

bot.action("inss", (ctx) => {
    modoCalculo = "inss";
    ctx.reply("💼 Informe o valor do salário:");
    logAcao(ctx, 'inss', 'Cálculo de INSS selecionado.');
});

bot.action("fgts", (ctx) => {
    modoCalculo = "fgts";
    ctx.reply("🏦 Digite o salário para calcular o FGTS:");
    logAcao(ctx, 'fgts', 'Cálculo de FGTS selecionado.');
});

// ======================================================
// PROCESSA MENSAGENS DE TEXTO
// ======================================================
bot.on("text", (ctx) => {
    const texto = ctx.message.text;
    const valores = texto.split(" ").map(Number);

    // ----------------------------- IRRF ---------------------------------
    if (modoCalculo === "irrf") {

        const salario = valores[0];
        const dependentes = valores[1] || 0;

        const resultado = calcularIRRF(salario, dependentes);
        const salarioLiquido = calcularSalarioLiquido(salario);
        const fgts = calcularFGTS(salario);
        const inss = calcularINSS(salario);

        const mensagem = `
📊 *RESULTADO DO CÁLCULO CLT*
--------------------------------------
💰 *Salário bruto:* R$ ${salario.toFixed(2)}
🏦 *FGTS (8%):* R$ ${fgts.toFixed(2)} _(depositado pela empresa)_

👤 *Descontos do Funcionário*
• INSS: R$ ${inss.toFixed(2)}
• IRRF: R$ ${resultado.irrf.toFixed(2)}

📘 *Detalhes do IRRF*
• Base de Cálculo: R$ ${resultado.baseDeCalculo.toFixed(2)}
• Dedução INSS: R$ ${inss.toFixed(2)}
• Dedução Dependentes: R$ ${resultado.valorPorDependentes.toFixed(2)}
• Alíquota: ${(resultado.aliquota * 100).toFixed(1)}%
• Parcela a Deduzir: R$ ${resultado.deducao.toFixed(2)}

🏁 *Resultado Final*
✔ *Salário Líquido:* R$ ${salarioLiquido.toFixed(2)}
`;

        ctx.reply(mensagem, { parse_mode: "Markdown" });

        ctx.reply(
            "Escolha uma opção:",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Novo cálculo", "irrf")]
            ])
        );

        logAcao(ctx, "irrf", "Cálculo do IRRF realizado.");
    }

    // ----------------------------- INSS ---------------------------------
    else if (modoCalculo === "inss") {
        const salario = valores[0];
        const desconto = calcularINSS(salario);
        const liquido = calcularSalarioLiquido(salario);

        ctx.reply(`💼 INSS calculado: R$ ${desconto.toFixed(2)}`);
        ctx.reply(`💰 Salário Líquido: R$ ${liquido.toFixed(2)}`);
        ctx.reply("O INSS é calculado de forma progressiva, faixa por faixa, assim como o IRRF.");

        logAcao(ctx, "inss", "Cálculo do INSS realizado.");
    }

    // ----------------------------- FGTS ---------------------------------
    else if (modoCalculo === "fgts") {
        const salario = valores[0];
        const resultado = calcularFGTS(salario);
        ctx.reply(`🏦 FGTS calculado: R$ ${resultado.toFixed(2)}`);
        ctx.reply("O FGTS é depositado pela empresa. É sempre 8% do salário bruto.");

        logAcao(ctx, "fgts", "Cálculo do FGTS realizado.");
    }

    // ----------------------------- ERRO ---------------------------------
    else {
        ctx.reply("⚠ Escolha uma opção primeiro usando /start");
    }
});

// ======================================================
// FUNÇÕES DE CÁLCULO
// ======================================================
function calcularIRRF(salario, dependentes) {
    const salarioLiquido = calcularSalarioLiquido(salario);
    const valorPorDependentes = 189.59;
    const deducaoDependentes = dependentes * valorPorDependentes;

    const baseDeCalculo = salarioLiquido - deducaoDependentes;

    let aliquota = 0;
    let deducao = 0;

    if (baseDeCalculo <= 1903.98) {
        aliquota = 0;
    } else if (baseDeCalculo <= 2826.65) {
        aliquota = 0.075;
        deducao = 142.80;
    } else if (baseDeCalculo <= 3751.05) {
        aliquota = 0.15;
        deducao = 354.80;
    } else if (baseDeCalculo <= 4664.68) {
        aliquota = 0.225;
        deducao = 636.13;
    } else {
        aliquota = 0.275;
        deducao = 869.36;
    }

    const irrf = Math.max(0, baseDeCalculo * aliquota - deducao);

    return { salario, dependentes, valorPorDependentes, baseDeCalculo, aliquota, deducao, irrf };
}

function calcularINSS(salario) {
    const limiteFaixa1 = 1412.00;
    const limiteFaixa2 = 2666.68;
    const limiteFaixa3 = 4000.03;
    const limiteFaixa4 = 7786.02;

    let desconto = 0;

    if (salario <= limiteFaixa1) {
        desconto = salario * 0.075;
    } else if (salario <= limiteFaixa2) {
        desconto =
            limiteFaixa1 * 0.075 +
            (salario - limiteFaixa1) * 0.09;
    } else if (salario <= limiteFaixa3) {
        desconto =
            limiteFaixa1 * 0.075 +
            (limiteFaixa2 - limiteFaixa1) * 0.09 +
            (salario - limiteFaixa2) * 0.12;
    } else if (salario <= limiteFaixa4) {
        desconto =
            limiteFaixa1 * 0.075 +
            (limiteFaixa2 - limiteFaixa1) * 0.09 +
            (limiteFaixa3 - limiteFaixa2) * 0.12 +
            (salario - limiteFaixa3) * 0.14;
    } else {
        // TETO DO INSS
        desconto =
            limiteFaixa1 * 0.075 +
            (limiteFaixa2 - limiteFaixa1) * 0.09 +
            (limiteFaixa3 - limiteFaixa2) * 0.12 +
            (limiteFaixa4 - limiteFaixa3) * 0.14;
    }

    return desconto;
}

function calcularFGTS(salario) {
    return salario * 0.08;
}

function calcularSalarioLiquido(salario) {
    return salario - calcularINSS(salario);
}

// ======================================================
// INICIALIZA O BOT
// ======================================================
bot.launch();
console.log("🤖 Bot iniciado com sucesso!");

