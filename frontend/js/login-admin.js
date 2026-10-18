
const API = "/api";

const formulario = document.querySelector("#form-login");
const campoUsuario = document.querySelector("#usuario");
const campoSenha = document.querySelector("#senha");
const botao = document.querySelector("#botao-login");
const mensagem = document.querySelector("#mensagem");

async function verificarSessao() {
    try {
        const resposta = await fetch(`${API}/admin/sessao`, {
            credentials: "same-origin"
        });

        if (resposta.ok) {
            window.location.replace("admin.html");
        }
    } catch (erro) {
        console.error("Falha ao verificar sessão:", erro);
        mensagem.textContent =
            "Falha de conexão. Confira o endereço da página e o servidor.";
    }
}

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    mensagem.textContent = "";
    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
        const resposta = await fetch(`${API}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                usuario: campoUsuario.value.trim(),
                senha: campoSenha.value
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível entrar."
            );
        }

        window.location.replace("admin.html");
    } catch (erro) {
        mensagem.textContent =
            erro.message || "Erro ao realizar login.";
    } finally {
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});

verificarSessao();
