const { enviarEmailPedidoCriado } = require("./email");

const pedidoTeste = {
    numero: "TESTE-EMAIL-REAL",
    cliente: {
        nome: "Felipe Gonçalves",
        email: "canivetedarocaunivesp@gmail.com",
        cep: "14170460",
        endereco: "Rua das Rosas, 100",
        cidade: "Sertãozinho",
        estado: "SP"
    },
    itens: [
        { nome: "Canivete Campeiro Aço 5160", quantidade: 1, preco: 189.90, subtotal: 189.90 }
    ],
    subtotal: 189.90,
    frete: {
        nome: "Correios SEDEX",
        transportadora: "Correios",
        servico: "SEDEX",
        valor: 11.93,
        prazo: 2
    },
    total: 201.83,
    pagamento: {
        metodo: "pix",
        qr_code: "00020126500014br.gov.bcb.pix0128canivetedarocaunivesp@gmail.com5204000053039865406201.835802BR5920CANIVETE DA ROCA PI26011SERTAOZINHO62200516TESTEEMAILREAL6304ABCD",
        qr_code_url: ""
    }
};

(async () => {
    console.log("--> Iniciando teste de disparo de e-mail...");
    await enviarEmailPedidoCriado(pedidoTeste);
    console.log("--> Teste concluído!");
})();
