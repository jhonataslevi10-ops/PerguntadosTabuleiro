/* =========================================================
   ROLETA DO CONHECIMENTO - Lógica principal
   ========================================================= */
"use strict";

/* ---------- DADOS BASE ---------- */
const CATS_BASE = [
  { id: "his", nome: "História",      icone: "🏛️", cor: "#c98f00" },
  { id: "cie", nome: "Ciência",       icone: "🔬", cor: "#1c9c55" },
  { id: "geo", nome: "Geografia",     icone: "🌍", cor: "#1d7fd6" },
  { id: "esp", nome: "Esportes",      icone: "⚽", cor: "#d83a3f" },
  { id: "art", nome: "Arte",          icone: "🎨", cor: "#c42f87" },
  { id: "ent", nome: "Entretenimento",icone: "🎬", cor: "#7a3fd1" },
  { id: "bib", nome: "Bíblia",        icone: "📖", cor: "#8a5a2b" }
];

const NIVEIS      = { e: "FÁCIL", m: "MÉDIO", h: "DIFÍCIL" };
const CORES_NIVEL = { e: "#2fb866", m: "#f2a100", h: "#e5484d" };
const BOCA_FELIZ  = "M36 72 Q50 84 64 72";
const BOCA_TRISTE = "M36 80 Q50 68 64 80";

const PASTA_MASCOTES = "mascote/";
const EXT_MASCOTES   = ".png";

/* ---------- HELPERS ---------- */
const $ = (id) => document.getElementById(id);

function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function carregarImagem(nome, ok, falha) {
  const img = new Image();
  img.onload  = () => ok(img.src);
  img.onerror = falha || (() => {});
  img.src = PASTA_MASCOTES + nome + EXT_MASCOTES;
}

/* ---------- ESTADO ---------- */
let catAtual   = null;
let nivelAtual = null;
let usadas     = {};
let cartaAtual = null;
let mascoteCat = null;
let catsAtivas = CATS_BASE.slice();
let anguloAtual = 0;
let aGirar      = false;

/* =========================================================
   TELAS
   ========================================================= */
function mostrar(id) {
  ["t1", "t2", "t3"].forEach((t) => {
    const el = $(t);
    if (!el) return;
    el.style.display = (t === id)
      ? (t === "t1" ? "grid" : "block")
      : "none";
  });

  const areaRoleta = document.querySelector(".area-roleta");
  const toggleArea = document.querySelector(".toggle");
  if (areaRoleta) areaRoleta.style.display = id === "t1" ? "flex"  : "none";
  if (toggleArea) toggleArea.style.display = id === "t1" ? "flex"  : "none";
}

/* =========================================================
   MASCOTE
   ========================================================= */
function mostrarMascote(id, humor) {
  const elImg = $("mascoteImg");
  const elSvg = $("mascote");
  if (!elImg || !elSvg) return;

  const usarSvg = () => {
    elImg.style.display = "none";
    elSvg.style.display = "block";
  };
  const usarImg = (src) => {
    elImg.src = src;
    elImg.style.display = "block";
    elSvg.style.display = "none";
  };
  const tentarBase = () => carregarImagem(id || "quizito", usarImg, usarSvg);

  if (id && humor) carregarImagem(id + "-" + humor, usarImg, tentarBase);
  else tentarBase();
}

function falar(texto, humor) {
  const elFala = $("fala");
  const elBoca = $("boca");
  if (elFala) elFala.innerText = texto;
  if (elBoca) elBoca.setAttribute("d", humor === "triste" ? BOCA_TRISTE : BOCA_FELIZ);

  mostrarMascote(
    mascoteCat,
    humor === "feliz" || humor === "triste" ? humor : null
  );

  const alvos = [$("mascote"), $("mascoteImg")].filter(Boolean);
  alvos.forEach((el) => {
    el.classList.remove("pula", "treme");
    void el.getBoundingClientRect();
    if (humor === "feliz")  el.classList.add("pula");
    if (humor === "triste") el.classList.add("treme");
  });
}

/* =========================================================
   CATEGORIAS
   ========================================================= */
function atualizarCategoriasAtivas() {
  const toggle = $("toggleBiblia");
  const incluirBiblia = toggle ? toggle.checked : true;
  catsAtivas = CATS_BASE.filter((c) => c.id !== "bib" || incluirBiblia);
  renderizarGrade();
  desenharRoleta();
}

function aplicarImagemCategoria(botao, id) {
  carregarImagem(
    id,
    (src) => {
      const span = botao.querySelector("span");
      if (span) span.innerHTML = "<img src='" + src + "' alt=''>";
    },
    () => {}
  );
}

function renderizarGrade() {
  const grade = $("t1");
  if (!grade) return;
  grade.innerHTML = "";

  catsAtivas.forEach((cat) => {
    const b = document.createElement("button");
    b.className = "cat";
    b.style.background = cat.cor;
    b.innerHTML = "<span>" + cat.icone + "</span>" + cat.nome;
    b.addEventListener("click", () => selecionarCategoria(cat));
    grade.appendChild(b);
    aplicarImagemCategoria(b, cat.id);
  });
}

function selecionarCategoria(cat) {
  catAtual   = cat;
  mascoteCat = cat.id;

  const tag = $("tagCat2");
  if (tag) {
    tag.innerText = catAtual.nome;
    tag.style.background = catAtual.cor;
  }

  falar("Boa! " + catAtual.nome + ". Qual o nível?", "feliz");
  mostrar("t2");
}

/* =========================================================
   ROLETA
   ========================================================= */
function desenharRoleta() {
  const canvas = $("canvasRoleta");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const qtd = catsAtivas.length;
  if (qtd === 0) return;

  const raio  = canvas.width / 2;
  const fatia = (2 * Math.PI) / qtd;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < qtd; i++) {
    const ang = anguloAtual + i * fatia;

    ctx.beginPath();
    ctx.moveTo(raio, raio);
    ctx.arc(raio, raio, raio - 4, ang, ang + fatia);
    ctx.closePath();
    ctx.fillStyle = catsAtivas[i].cor;
    ctx.fill();
    ctx.lineWidth   = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.save();
    ctx.translate(raio, raio);
    ctx.rotate(ang + fatia / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Trebuchet MS', sans-serif";
    ctx.fillText(catsAtivas[i].nome, raio - 24, 5);
    ctx.restore();
  }

  // Centro
  ctx.beginPath();
  ctx.arc(raio, raio, 20, 0, 2 * Math.PI);
  ctx.fillStyle = "#2b1a5e";
  ctx.fill();
  ctx.lineWidth   = 3;
  ctx.strokeStyle = "#ffc83d";
  ctx.stroke();
}

function girarRoleta() {
  if (aGirar) return;
  if (catsAtivas.length === 0) return;

  aGirar = true;
  const btn = $("btnGirar");
  if (btn) btn.disabled = true;

  falar("Girando a roleta...", "neutro");

  const voltasCompletas = 5 + Math.floor(Math.random() * 5);
  const variacaoRad     = Math.random() * 2 * Math.PI;
  const radTotal        = voltasCompletas * (2 * Math.PI) + variacaoRad;
  const inicio          = performance.now();
  const duracao         = 3800;
  const anguloInicial   = anguloAtual;

  function animar(agora) {
    const decorrido = agora - inicio;
    const t         = Math.min(decorrido / duracao, 1);
    const progresso = 1 - Math.pow(1 - t, 3); // easeOutCubic

    anguloAtual = anguloInicial + radTotal * progresso;
    desenharRoleta();

    if (t < 1) {
      requestAnimationFrame(animar);
      return;
    }

    aGirar = false;
    if (btn) btn.disabled = false;

    // Ponteiro no topo = -PI/2 = 1.5*PI
    const fatia = (2 * Math.PI) / catsAtivas.length;
    const anguloNormalizado = ((anguloAtual % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const diferenca = (1.5 * Math.PI - anguloNormalizado + 2 * Math.PI) % (2 * Math.PI);
    const indiceVencedor = Math.floor(diferenca / fatia) % catsAtivas.length;

    const sorteada = catsAtivas[indiceVencedor];
    setTimeout(() => selecionarCategoria(sorteada), 700);
  }
  requestAnimationFrame(animar);
}

/* =========================================================
   PERGUNTAS
   ========================================================= */
function cartaLocal() {
  if (typeof BARALHO === "undefined" || !BARALHO[catAtual.id] || !BARALHO[catAtual.id][nivelAtual]) {
    console.error("Baralho não encontrado para", catAtual.id, nivelAtual);
    return {
      q: "Erro ao carregar pergunta. Verifique o BARALHO.",
      certaTxt: "OK",
      erradas: ["A", "B", "C"],
      api: false
    };
  }

  const baralho = BARALHO[catAtual.id][nivelAtual];
  const chave   = catAtual.id + nivelAtual;

  if (!usadas[chave] || usadas[chave].length >= baralho.length) usadas[chave] = [];

  const livres = [];
  for (let k = 0; k < baralho.length; k++) {
    if (usadas[chave].indexOf(k) === -1) livres.push(k);
  }

  const escolhida = livres[Math.floor(Math.random() * livres.length)];
  usadas[chave].push(escolhida);

  const p = baralho[escolhida].split("|");
  return { q: p[0], certaTxt: p[1], erradas: p.slice(2), api: false };
}

function sortearCarta() {
  const aviso = $("aviso");
  if (aviso) aviso.className = "";

  const outra   = $("outra");
  const proximo = $("proximo");
  if (outra)   outra.style.display   = "none";
  if (proximo) proximo.style.display = "none";

  falar("Pense bem...", "neutro");
  mostrarCarta(cartaLocal());
}

function mostrarCarta(c) {
  const alternativas = embaralhar(c.erradas.concat([c.certaTxt]));
  cartaAtual = { certa: alternativas.indexOf(c.certaTxt) };

  const tagCat3  = $("tagCat3");
  const tagNivel = $("tagNivel");
  const pergunta = $("pergunta");
  const ops      = $("ops");

  if (tagCat3) {
    tagCat3.innerText = catAtual.nome;
    tagCat3.style.background = catAtual.cor;
  }
  if (tagNivel) {
    tagNivel.innerText = "NÍVEL " + NIVEIS[nivelAtual];
    tagNivel.style.background = CORES_NIVEL[nivelAtual];
  }
  if (pergunta) pergunta.innerText = c.q;

  if (!ops) return;
  ops.innerHTML = "";

  alternativas.forEach((txt, i) => {
    const o = document.createElement("button");
    o.className = "op";
    o.innerText = txt;
    o.setAttribute("data-i", i);
    o.addEventListener("click", function () {
      responder(parseInt(this.getAttribute("data-i"), 10));
    });
    ops.appendChild(o);
  });
}

function responder(escolha) {
  const ops = $("ops");
  if (!ops || !cartaAtual) return;

  const botoes = ops.querySelectorAll(".op");
  botoes.forEach((b, i) => {
    b.disabled = true;
    if (i === cartaAtual.certa) b.classList.add("certa");
  });

  const aviso = $("aviso");
  if (escolha === cartaAtual.certa) {
    if (aviso) {
      aviso.innerText = "ACERTOU! Avance sua peça no tabuleiro.";
      aviso.className = "ok";
    }
    falar("Mandou bem!", "feliz");
  } else {
    if (botoes[escolha]) botoes[escolha].classList.add("errada");
    if (aviso) {
      aviso.innerText = "ERROU! Passe a vez para o próximo jogador.";
      aviso.className = "no";
    }
    falar("Ops! Na próxima vai.", "triste");
  }

  const outra   = $("outra");
  const proximo = $("proximo");
  if (outra)   outra.style.display   = "block";
  if (proximo) proximo.style.display = "block";
}

/* =========================================================
   EVENTOS
   ========================================================= */
function ligarEventos() {
  const btnGirar = $("btnGirar");
  if (btnGirar) btnGirar.addEventListener("click", girarRoleta);

  const toggleBiblia = $("toggleBiblia");
  if (toggleBiblia) toggleBiblia.addEventListener("change", atualizarCategoriasAtivas);

  document.querySelectorAll(".nivel").forEach((n) => {
    n.addEventListener("click", function () {
      nivelAtual = this.getAttribute("data-d");
      mostrar("t3");
      sortearCarta();
    });
  });

  const voltar = $("voltar");
  if (voltar) {
    voltar.addEventListener("click", () => {
      mascoteCat = null;
      falar("Escolha uma categoria e vamos jogar!", "feliz");
      mostrar("t1");
    });
  }

  const outra = $("outra");
  if (outra) outra.addEventListener("click", sortearCarta);

  const proximo = $("proximo");
  if (proximo) {
    proximo.addEventListener("click", () => {
      mascoteCat = null;
      falar("Próximo jogador! Escolha a categoria.", "feliz");
      mostrar("t1");
    });
  }

  // Redimensiona o canvas da roleta se necessário
  window.addEventListener("resize", () => {
    if ($("canvasRoleta")) desenharRoleta();
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
function init() {
  ligarEventos();
  atualizarCategoriasAtivas();
  mostrar("t1");
  mostrarMascote(null);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
