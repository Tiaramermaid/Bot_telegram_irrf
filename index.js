//arquivo para fazer as configuraçoes do bot de imposto de renda

//carrega as variaveis de ambiente do arquivo .env
require('dotenv').config();

//importa o modulo do telegraf
const {Telegraf, Markup} = require('telegraf');

//Configuraçao e Inicialização 

const token = process.env.BOT_TOKEN;

//cria uma nova instancia do bot
const timestamp = new Date().toISOString();

if (!token){
    console.error("ERRO: Token do bot não foi encontrado no arquivo .env.!");
    process.exit(1);
}

const tokenDisplay = token.substring(0, 6) + '...';
const sucessMessage = `[${timestamp}] INFO: INICIALIZAÇAO | MENSAGEM: token recebido com sucesso. Inicio: ${tokenDisplay} bot esta rodando🤖`;
console.log(sucessMessage);

const bot = new Telegraf(token);

//Função auxiliar para a criaçao de um log personalizado
function logAcao(ctx, command, acao, isCommand = true){
    const message = ctx.message || ctx.update.message;

    //coletar dados p ara o log
    const userId = ctx.from.id;
    const userName = ctx.from.username || 'N/A';
    const firstName = ctx.from.firstName || 'N/A';
    const chatType = ctx.chat.type; //ex.: 'private', 'group', 'channel'

    //define o comando/tipo de evento para o log
    const logCommand = isCommand ? command : 'TEXTO';

    const logMessage = `[${new Date().toISOString()}] COMANDO:${logCommand} | TIPO:|${chatType} | USUARIO_ID:${userId} | USUARIO_NOME: @${userName} | NOME_COMPLETO:${firstName} | Ação:${acao}`;
    console.log(logMessage);
}

//Comandos e Logica do Servidor

//comando de inicio
// bot.start((ctx) => {
//     //mensagem de resposta do Bot
//     let replyMsg = "Olá eu sou um bot de calculo de Imposto.\n"+
//     "\nUse:" +
//     "\n- /irrf" +
//     "\n- /FGTS" +
//     "\n- /INSS";

//     ctx.reply(replyMsg); //envia mensagem

//     //log do sistema
//     logAcao(ctx, '/start', 'Mensagem de inicio enviada.');
// });

let modoCalculo = null;

bot.start((ctx) => {
    ctx.reply(
        "Olá!! Eu sou o bot de calculo de impostos CLT.",
        Markup.inlineKeyboard([
            [Markup.button.callback("💸 Calcular IRRF", "irrf")],
            [Markup.button.callback("💼 Calcular INSS", "inss")],
            [Markup.button.callback("🏦 Calcular FGTS", "fgts")],
        ])
    );
    //log ação
    logAcao(ctx,'/start', 'mensagem de inicio enviada.');
});

//açoes dos botoes
bot.action("irrf", (ctx) => {
    modoCalculo = "irrf";
    ctx.reply("📊 Vamos calcular o IRRF! Envie o valor do salário bruto e a quantidade de dependentes.\nExemplo: 3000 2");
    logAcao(ctx, '/irrf', 'mensagem de calculo de irrf foi selecionada.');
});
bot.action("inss", (ctx) => {
    modoCalculo = "inss";
    ctx.reply("💼 Cálculo de INSS selecionado. Informe o valor do salário:");
    logAcao(ctx, 'inss', 'mensagem de calculo do inss foi selecionada.');
});
bot.action("fgts", (ctx) => {
    modoCalculo = "fgts";
    ctx.reply("🏦 Cálculo de FGTS selecionado. Digite o salário para continuar:");
    logAcao(ctx, 'fgts', 'mensagem de calculo do inss foi selecionada.');
});

bot.launch();

//captura as mensagens de texto 
bot.on("text", (ctx) => {
    const texto = ctx.message.text;
    const valores = texto.split(" ").map(Number);

    if(modoCalculo === "irrf"){
        const salario = valores[0];
        const dependentes = valores[1] || 0;
        const resultado = calcularIRRF(salario, dependentes);
    ctx.reply(`💸 IRRF calculado: R$ ${resultado.toFixed(2)}`);
    }
    else if (modoCalculo === "inss"){
        const salario = valores[0];
        const resultado = calcularINSS(salario);
        ctx.reply(`💼 INSS calculado: ${resultado.toFixed(2)}`);
    }
    else if (modoCalculo === "fgts"){
        const salario = valores[0];
        const resultado = calcularFGTS(salario);
        ctx.reply(`🏦 FGTS calculado: ${resultado.toFixed(2)}`);
        ctx.reply("O FGTS é um valor que não é descontado do seu salario mas que a empresa deposita mensalmente e  fica guradado na caixa economica como um seguro desemprego. é 8% do seu salario bruto")
    }
    else{
        ctx.reply("ERRO. Escolha uma opção primeiro com /start");
    }
});

//função de calculo IRRF Detalhado
function calcularIRRF(salario, dependentes){
    
}

//funçao de calculo INSS
function calcularINSS(salario){
    const desconto = 0;

    //faixa 1
    if (salario <= 1412.00){
        desconto = salario * 0.075;
    }
}

//função de calculo FGTS 
function calcularFGTS(salario){
    const oliquota = 0.08; // 8%
    const fgts = salario * oliquota;
    return fgts;
}

