$(document).ready(function () {
  let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }

  // Carregar modo mobile
  if (localStorage.getItem("mobileMode") === "true") {
    $("body").addClass("mobile-mode");
  }

  // Objeto de tradução para Settings
  const translations = {
    "pt-BR": {
      "home": "Início",
      "search": "Pesquisa",
      "language": "Idioma",
      "apply": "Aplicar"
    },
    "en": {
      "home": "Home",
      "search": "Search",
      "language": "Language",
      "apply": "Apply"
    }
  };

  // Carregar linguagem
  const currentLanguage = localStorage.getItem("language") || "pt-BR";
  $("#language-select").val(currentLanguage);
  function applyTranslations() {
    $("[data-i18n]").each(function () {
      const key = $(this).attr("data-i18n");
      $(this).text(`[${translations[currentLanguage][key] || key}]`);
    });
  }
  applyTranslations();

  // Aplicar mudança de linguagem
  $("#apply-language").click(function () {
    const selectedLanguage = $("#language-select").val();
    localStorage.setItem("language", selectedLanguage);
    alert("Language changed to " + (selectedLanguage === "pt-BR" ? "Português" : "English"));
    window.location.reload();
  });

  // Alternar modo mobile
  $("#mobile-btn, #mobile-btn-footer").click(function (e) {
    e.preventDefault();
    $("body").toggleClass("mobile-mode");
    localStorage.setItem("mobileMode", $("body").hasClass("mobile-mode"));
  });

  // Logout
  $("#btnLogout").click(function () {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("mobileMode");
    window.location.href = "login.html";
  });
});