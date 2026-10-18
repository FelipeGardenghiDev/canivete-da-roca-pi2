
const botaoSair = document.querySelector("#botao-sair");

if (botaoSair) {
    botaoSair.addEventListener("click", async () => {
        botaoSair.disabled = true;
        botaoSair.textContent = "Saindo...";

        try {
            const resposta = await fetch("/api/admin/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível sair."
                );
            }

            window.location.replace("login-admin.html");
        } catch (erro) {
            alert(erro.message || "Erro ao encerrar a sessão.");
            botaoSair.disabled = false;
            botaoSair.textContent = "Sair";
        }
    });
}
