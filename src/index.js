//arquivo para fazer as configuraçoes do bot de imposto de renda

//carrega as variaveis de ambiente do arquivo .env
require('dotenv').config();

//importa o modulo do telegraf
const {Telegraf} = require('telegraf');

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

    //coletar dados para o log
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

