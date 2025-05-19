$(document).ready(function () {
  // Verificar se jQuery carregou
  if (typeof $ === "undefined") {
    console.error("jQuery não carregado. Verifique o CDN ou inclua localmente.");
    return;
  }
  console.log("jQuery carregado com sucesso.");

  // Determinar o board atual com base no nome do arquivo
  const currentPage = window.location.pathname.split("/").pop();
  let currentBoard = "k"; // Padrão é /k
  if (currentPage === "board-a.html") currentBoard = "a";
  else if (currentPage === "board-g.html") currentBoard = "g";
  else if (currentPage === "board-co.html") currentBoard = "co";

  console.log("Board atual:", currentBoard);

  // Carregar usuarioLogado com try-catch
  let usuarioLogado = null;
  try {
    usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  } catch (e) {
    console.error("Erro ao carregar usuarioLogado:", e);
  }
  if (!usuarioLogado) {
    console.log("Nenhum usuário logado. Redirecionando para login.html.");
    window.location.href = "login.html";
    return;
  }
  console.log("Usuário logado:", usuarioLogado);

  // Objeto de tradução
  const translations = {
    "pt-BR": {
      "home": "Início",
      "settings": "Config",
      "search": "Pesquisa",
      "start-thread": "Iniciar um Novo Tópico",
      "name": "Nome",
      "options": "Opções",
      "image-placeholder": "URL da imagem (opcional)",
      "subject": "Assunto",
      "subject-placeholder": "Assunto",
      "comment": "Comentário",
      "comment-placeholder": "Mensagem...",
      "verification": "Verificação",
      "get-captcha": "Obter CAPTCHA",
      "captcha-placeholder": "DIGITE O CAPTCHA AQUI",
      "captcha-bypass": "Usuários com 4chan Pass podem ignorar esta verificação.",
      "choose-file": "Escolher arquivo",
      "no-file": "Nenhum arquivo escolhido",
      "rules-faq": "Por favor, leia as <a href='#'>Regras</a> e <a href='#'>FAQ</a> antes de postar.",
      "post": "Postar",
      "show-hide-replies": "Mostrar/Ocultar Respostas",
      "reply": "Responder",
      "send-reply": "Enviar",
      "search-placeholder": "Pesquisar por nome ou comentário...",
      "no-results": "Nenhum resultado encontrado."
    },
    "en": {
      "home": "Home",
      "settings": "Settings",
      "search": "Search",
      "start-thread": "Start a New Thread",
      "name": "Name",
      "options": "Options",
      "image-placeholder": "Image URL (optional)",
      "subject": "Subject",
      "subject-placeholder": "Subject",
      "comment": "Comment",
      "comment-placeholder": "Message...",
      "verification": "Verification",
      "get-captcha": "Get CAPTCHA",
      "captcha-placeholder": "TYPE THE CAPTCHA HERE",
      "captcha-bypass": "4chan Pass users can bypass this verification.",
      "choose-file": "Choose file",
      "no-file": "No file chosen",
      "rules-faq": "Please read the <a href='#'>Rules</a> and <a href='#'>FAQ</a> before posting.",
      "post": "Post",
      "show-hide-replies": "Show/Hide Replies",
      "reply": "Reply",
      "send-reply": "Send",
      "search-placeholder": "Search by name or comment...",
      "no-results": "No results found."
    }
  };

  // Carregar linguagem
  const currentLanguage = localStorage.getItem("language") || "pt-BR";
  function applyTranslations() {
    try {
      $("[data-i18n]").each(function () {
        const key = $(this).attr("data-i18n");
        $(this).text(`[${translations[currentLanguage][key] || key}]`);
      });
      $("[data-i18n-placeholder]").each(function () {
        const key = $(this).attr("data-i18n-placeholder");
        $(this).attr("placeholder", translations[currentLanguage][key] || key);
      });
      $("#startThreadLink").text(`[${translations[currentLanguage]["start-thread"]}]`);
      console.log("Traduções aplicadas para:", currentLanguage);
    } catch (e) {
      console.error("Erro ao aplicar traduções:", e);
    }
  }
  applyTranslations();

  // Carregar modo mobile
  if (localStorage.getItem("mobileMode") === "true") {
    $("body").addClass("mobile-mode");
    console.log("Modo mobile ativado.");
  }

  let topicos = [];

  // Função para buscar tópicos do servidor
  async function carregarTopicos() {
    try {
      const response = await fetch(`/api/topics/${currentBoard}`);
      if (!response.ok) throw new Error('Erro ao buscar tópicos');
      topicos = await response.json();
      console.log("Tópicos carregados:", topicos);
      exibirTopicos();
    } catch (e) {
      console.error("Erro ao carregar tópicos:", e);
    }
  }

  function exibirTopicos() {
    try {
      $("#topicos").empty();
      topicos.forEach((topico, index) => {
        const post = $(`
          <div class="post" data-index="${index}" data-id="${topico.id}" id="post-${index}">
            <strong>${topico.nome}</strong><br>
            ${
              topico.imagem
                ? `<img src="${topico.imagem}" class="imagem-preview"><br>`
                : ""
            }
            <p>${topico.comentario}</p>
            <button class="mostrarRespostas">${translations[currentLanguage]["show-hide-replies"]}</button>
            <button class="responderBtn">${translations[currentLanguage]["reply"]}</button>
            <div class="respostas" style="display:none;"></div>
          </div>
        `);

        topico.respostas.forEach((res) => {
          const resposta = $(`
            <div class="resposta">
              <strong>${res.nome}</strong><br>
              <p>${res.texto}</p>
            </div>
          `);
          post.find(".respostas").append(resposta);
        });

        $("#topicos").prepend(post);
      });

      // Rolar para o post se houver um hash na URL
      if (window.location.hash) {
        const postId = window.location.hash.substring(1);
        const postElement = $(`#${postId}`);
        if (postElement.length) {
          $("html, body").animate({ scrollTop: postElement.offset().top }, 500);
        }
      }
      console.log("Tópicos exibidos:", topicos.length);
      exibirPopularThreads();
    } catch (e) {
      console.error("Erro ao exibir tópicos:", e);
    }
  }

  function exibirPopularThreads() {
    try {
      $("#popular-threads").empty();
      const popular = topicos
        .sort((a, b) => (b.respostas?.length || 0) - (a.respostas?.length || 0))
        .slice(0, 3); // Pegar os 3 mais populares
      if (popular.length === 0) {
        $("#popular-threads").append("<p>No popular threads yet.</p>");
        return;
      }
      popular.forEach((topico, index) => {
        $("#popular-threads").append(`
          <a href="#post-${topicos.indexOf(topico)}">${topico.nome}: ${topico.comentario.substring(0, 20)}${topico.comentario.length > 20 ? "..." : ""}</a><br>
        `);
      });
      console.log("Popular threads exibidos:", popular.length);
    } catch (e) {
      console.error("Erro ao exibir popular threads:", e);
    }
  }

  // Carregar tópicos ao iniciar
  carregarTopicos();

  // Mostrar/esconder barra de pesquisa
  $("#search-btn, #search-btn-footer").click(function (e) {
    try {
      e.preventDefault();
      $(".search-section").slideToggle();
      $("#search-input").focus();
      console.log("Barra de pesquisa toggled.");
    } catch (e) {
      console.error("Erro ao toggle barra de pesquisa:", e);
    }
  });

  // Pesquisa de tópicos
  $("#search-input").on("input", function () {
    try {
      const query = $(this).val().toLowerCase();
      const results = topicos.filter((topico, index) =>
        topico.nome.toLowerCase().includes(query) ||
        topico.comentario.toLowerCase().includes(query)
      );

      $("#search-results").empty();
      if (query.trim() === "") return;

      if (results.length === 0) {
        $("#search-results").append(`<p class="search-result">${translations[currentLanguage]["no-results"]}</p>`);
        return;
      }

      results.forEach((topico, index) => {
        const result = $(`
          <div class="search-result">
            <strong>${topico.nome}</strong><br>
            <p>${topico.comentario.substring(0, 100)}${topico.comentario.length > 100 ? "..." : ""}</p>
            <a href="#post-${topicos.indexOf(topico)}">View Topic</a>
          </div>
        `);
        $("#search-results").append(result);
      });
      console.log("Resultados da pesquisa:", results.length);
    } catch (e) {
      console.error("Erro na pesquisa:", e);
    }
  });

  $("#startThreadBtn").click(function () {
    try {
      $(".formulario").slideToggle();
      console.log("Formulário de novo tópico toggled.");
    } catch (e) {
      console.error("Erro ao toggle formulário:", e);
    }
  });

  $("#criarTopico").click(async function () {
    try {
      const nomeInput = $("#nome").val();
      const nome = nomeInput ? nomeInput : usuarioLogado.usuario;
      const imagem = $("#imagem").val();
      const comentario = $("#comentario").val();

      if (comentario.trim() === "") {
        console.log("Comentário vazio, tópico não criado.");
        return;
      }

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: currentBoard, nome, imagem, comentario })
      });

      if (!response.ok) throw new Error('Erro ao criar tópico');

      $("#nome").val("");
      $("#imagem").val("");
      $("#comentario").val("");

      $(".formulario").slideUp();
      await carregarTopicos();
      console.log("Novo tópico criado:", { nome, comentario });
    } catch (e) {
      console.error("Erro ao criar tópico:", e);
    }
  });

  $("#topicos").on("click", ".mostrarRespostas", function () {
    try {
      $(this).siblings(".respostas").slideToggle();
      console.log("Respostas toggled.");
    } catch (e) {
      console.error("Erro ao toggle respostas:", e);
    }
  });

  $("#topicos").on("click", ".responderBtn", function (e) {
    try {
      e.preventDefault();
      console.log("Botão Responder clicado.");

      const existingForm = $(this).siblings(".formulario");
      if (existingForm.length) {
        existingForm.slideToggle();
        console.log("Formulário de resposta já existe, toggled.");
        return;
      }

      const campo = $(`
        <div class="formulario resposta-form">
          <input type="text" class="resNome" placeholder="${translations[currentLanguage]["name"]}" /><br />
          <textarea class="resTexto" placeholder="${translations[currentLanguage]["comment-placeholder"]}" rows="2" cols="30"></textarea><br />
          <button class="enviarResposta">${translations[currentLanguage]["send-reply"]}</button>
        </div>
      `);

      $(this).after(campo);
      campo.slideDown();
      console.log("Formulário de resposta adicionado para post:", $(this).closest(".post").data("index"));
    } catch (e) {
      console.error("Erro ao adicionar formulário de resposta:", e);
    }
  });

  $("#topicos").on("click", ".enviarResposta", async function (e) {
    try {
      e.preventDefault();
      console.log("Botão Enviar Resposta clicado.");

      const respostaBox = $(this).closest(".formulario");
      const nome = respostaBox.find(".resNome").val() || usuarioLogado.usuario;
      const texto = respostaBox.find(".resTexto").val();

      if (texto.trim() === "") {
        console.log("Resposta vazia, não enviada.");
        return;
      }

      const post = respostaBox.closest(".post");
      const topic_id = post.data("id");

      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id, nome, texto })
      });

      if (!response.ok) throw new Error('Erro ao criar resposta');

      respostaBox.slideUp(function () {
        $(this).remove();
      });
      await carregarTopicos();
      console.log("Resposta enviada:", { nome, texto, topic_id });
    } catch (e) {
      console.error("Erro ao enviar resposta:", e);
    }
  });

  // Alternar modo mobile
  $("#mobile-btn, #mobile-btn-footer").click(function (e) {
    try {
      e.preventDefault();
      $("body").toggleClass("mobile-mode");
      localStorage.setItem("mobileMode", $("body").hasClass("mobile-mode"));
      console.log("Modo mobile toggled:", $("body").hasClass("mobile-mode"));
    } catch (e) {
      console.error("Erro ao toggle modo mobile:", e);
    }
  });

  // Logout
  $("#btnLogout").click(function () {
    try {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("mobileMode");
      window.location.href = "login.html";
      console.log("Logout realizado.");
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
  });
});