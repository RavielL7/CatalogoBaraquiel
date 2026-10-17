"use strict";

(() => {
    const config = window.CATALOGO;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

    const safeUrl = value => {
        try {
            const url = new URL(value, document.baseURI);
            return ["https:", "http:", "file:"].includes(url.protocol) ? url.href : "#";
        } catch {
            return "#";
        }
    };

    const productDialog = $("#product-dialog");
    const infoDialog = $("#info-dialog");
    const searchDialog = $("#search-dialog");
    const productGrid = $("#product-grid");
    const mobileNavigation = $("#mobile-navigation");
    const menuToggle = $(".alternador-menu");
    const siteHeader = $(".cabecalho-site");
    const heroCard = $(".cartao-destaque");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousFocus = null;

    const productArt = product => config.placeholders
        ? "assets/images/placeholder.svg"
        : product.imagem;

    function renderProducts() {
        productGrid.innerHTML = config.produtos.map((product, index) => `
            <article class="cartao-produto revelar">
                <button class="abrir-produto" type="button" data-product="${escapeHtml(product.id)}"
                    aria-haspopup="dialog" aria-label="Ver ${escapeHtml(product.titulo)} — ${escapeHtml(product.preco)}">
                    <span class="visual-produto">
                        <img src="${escapeHtml(safeUrl(productArt(product)))}" alt="" width="517" height="690"
                            loading="eager" decoding="async"${index < 2 ? ' fetchpriority="high"' : ''}>
                        <span class="numero-produto" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                        <span class="seta-produto" aria-hidden="true">↗</span>
                    </span>
                    <span class="texto-produto">
                        <span class="meta-produto">
                            <span class="preco-produto">${escapeHtml(product.preco)}</span>
                        </span>
                        <span class="titulo-produto">${escapeHtml(product.titulo)}</span>
                    </span>
                </button>
            </article>
        `).join("");

        $$(".visual-produto img").forEach(image => {
            const showFallback = () => {
                if (image.dataset.fallback === "true") return;
                image.dataset.fallback = "true";
                image.src = "assets/images/placeholder.svg";
            };
            image.addEventListener("error", showFallback, { once: true });
            if (image.complete && image.naturalWidth === 0) showFallback();
        });
    }

    function openDialog(dialog, focusSelector = "[data-close]") {
        if (!dialog || dialog.open) return;
        previousFocus = document.activeElement;
        dialog.showModal();
        document.body.classList.add("modal-aberto");
        dialog.scrollTop = 0;
        requestAnimationFrame(() => $(focusSelector, dialog)?.focus());
    }

    function closeDialog(dialog) {
        if (dialog?.open) {
            dialog.close();
        }
    }

    function openProduct(productId) {
        const product = config.produtos.find(item => item.id === productId);
        if (!product) return;

        $("#product-title").textContent = product.titulo;
        $("#product-price").textContent = product.preco;
        const facts = product.descricao.match(/[^.?!]+[.?!]+/g) || [product.descricao];
        $("#product-description").innerHTML = facts.map((text, i) =>
            `<li style="--i:${i}">${escapeHtml(text.trim())}</li>`).join("");

        const image = $("#product-image");
        image.src = safeUrl(productArt(product));
        image.alt = config.placeholders
            ? `Espaço reservado para a arte de ${product.titulo}`
            : `Arte de ${product.titulo}`;

        $("#product-contact").href = safeUrl(config.links.formulario);
        openDialog(productDialog);
    }

    function closeMenu() {
        mobileNavigation.classList.remove("esta-aberto");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-aberto");
    }

    menuToggle.addEventListener("click", () => {
        const opened = mobileNavigation.classList.toggle("esta-aberto");
        menuToggle.setAttribute("aria-expanded", String(opened));
        document.body.classList.toggle("menu-aberto", opened);
    });

    mobileNavigation.addEventListener("click", event => {
        if (event.target.closest("a, button")) closeMenu();
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".cabecalho-site")) closeMenu();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && mobileNavigation.classList.contains("esta-aberto")) {
            closeMenu();
            menuToggle.focus();
        }
    });

    const desktopQuery = window.matchMedia("(min-width: 881px)");
    desktopQuery.addEventListener?.("change", closeMenu);

    $$("dialog").forEach(dialog => {
        $("[data-close]", dialog).addEventListener("click", () => closeDialog(dialog));
        let pointerStartedOutside = false;

        const outsideDialog = event => {
            const rect = dialog.getBoundingClientRect();
            return event.clientX < rect.left || event.clientX > rect.right
                || event.clientY < rect.top || event.clientY > rect.bottom;
        };

        dialog.addEventListener("pointerdown", event => {
            pointerStartedOutside = event.target === dialog && outsideDialog(event);
        });

        dialog.addEventListener("click", event => {
            if (pointerStartedOutside && event.target === dialog && outsideDialog(event)) {
                dialog.close();
            }
            pointerStartedOutside = false;
        });

        dialog.addEventListener("close", () => {
            document.body.classList.remove("modal-aberto");
            if (previousFocus?.isConnected) previousFocus.focus();
        });
    });

    productGrid.addEventListener("click", event => {
        const trigger = event.target.closest("[data-product]");
        if (trigger) openProduct(trigger.dataset.product);
    });

    $("#product-image").addEventListener("error", event => {
        event.currentTarget.src = "assets/images/placeholder.svg";
    }, { once: true });

    const icons = {
        whatsapp: "M20.5 3.5A11.7 11.7 0 0 0 2.1 17.6L.5 23.5l6-1.6A11.7 11.7 0 0 0 20.5 3.5ZM12 21a9 9 0 0 1-4.6-1.3l-.4-.2-3.5.9.9-3.4-.2-.4A9.2 9.2 0 1 1 12 21Zm5.1-6.8c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.3-1.6-1.5-1.9-.1-.3 0-.4.1-.5l.4-.5.3-.4c.1-.2 0-.3 0-.5L9.5 7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4.1.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3Z",
        instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
        tiktok: "M16 2c.3 2.5 1.7 4 4 4.2v3.3a8.2 8.2 0 0 1-4-1.2v7.1a6.4 6.4 0 1 1-6.4-6.3h1v3.4a3 3 0 1 0 2 2.9V2H16Z",
        x: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l4.4 6.8L18.9 2Zm-1.1 18h1.7L6.3 4H4.5l13.3 16Z"
    };

    function social(key, title, detail = "") {
        const iconKey = key === "avisos" ? "whatsapp" : key;
        const icon = icons[iconKey];
        return `
            <a class="link-rede" href="${escapeHtml(safeUrl(config.links[key]))}" target="_blank"
                rel="noopener noreferrer">
                ${icon ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg>` : ""}
                <span>${escapeHtml(title)}${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</span>
                <span class="seta-rede" aria-hidden="true">↗</span>
            </a>
        `;
    }

    const panels = {
        contato: {
            title: "Contato e redes sociais",
            body: () => `
                ${config.links.formulario ? `
                    <h3>Formulário de tiragem</h3>
                    <p>Escolheu sua tiragem? Preencha o formulário para entrar na fila de atendimento.
                        Serviços de magia precisam ser conversados diretamente primeiro.</p>
                    <div class="lista-redes">${social("formulario", "Abrir formulário")}</div>
                ` : ""}
                <h3>Contato e redes sociais</h3>
                <div class="lista-redes">
                    ${social("whatsapp", "WhatsApp", "+92 8152-3570")}
                    ${social("avisos", "Central de avisos", "Agenda e informações dos atendimentos")}
                    ${social("instagram", "Instagram", "@baraquiel.xx · feedbacks")}
                    ${social("tiktok", "TikTok", "@baraquiel.xx")}
                    ${social("x", "X", "@baraquielxx")}
                </div>
            `
        },
        magia: {
            title: "Feitiços convencionais",
            body: () => `
                <h3>Atendimento sob avaliação</h3>
                <p>Para serviços de magia, converse diretamente com Baraquiel antes de solicitar ou realizar qualquer
                    pagamento. O trabalho adequado é definido após a análise da situação.</p>
                <div class="lista-redes">${social("whatsapp", "Conversar sobre magia")}</div>
            `
        },
        termos: {
            title: "Termos e condições",
            body: () => `
                <h3>Prazo de atendimento</h3>
                <p>O prazo para entrega é de até <strong>7 dias úteis</strong> após a confirmação do formulário</p>
                <h3>Reembolsos</h3>
                <p>Não são realizados reembolsos por desistência ou insatisfação com o conteúdo da consulta. Caso o
                    prazo informado seja ultrapassado, o reembolso poderá ser solicitado ou a oportunidade de incluir uma pergunta/conselho adicional.</p>
                <h3>Limites das consultas</h3>
                <p>Não confirmo gravidez, diagnósticos de doenças ou transtornos mentais, garantias jurídicas e tiragens sobre
                    traição para <u>homens</u>. Para essas questões, procure um profissional qualificado.</p>
                <h3>Serviços de magia</h3>
                <p>Feitiços amorosos, destrutivos ou voltados ao desenvolvimento espiritual não são realizados para
                    menores de 18 anos. Consulte diretamente Baraquiel sobre as condições.</p>
                <h3>Responsabilidade do consulente</h3>
                <p class="nota-termos">As decisões tomadas após o atendimento são de responsabilidade do consulente.
                    As cartas não substituem orientações médicas, psicológicas, jurídicas ou financeiras.</p>
            `
        },
        privacidade: {
            title: "Aviso de Privacidade",
            body: () => `
                <p><strong>Última atualização:</strong> 17/10/2026</p>
                <h3>Quem é responsável pelos dados</h3>
                <p>O site Baraquiel é mantido por YCARO PEDROZA MUNIZ, nome artístico BARAQUIEL, inscrito no CNPJ sob o nº 64.243.109/0001-32.</p>
                <p>Para dúvidas, solicitações ou assuntos relacionados à privacidade, entre em contato por:<br><strong>WhatsApp:</strong> +55 92 8152-3570</p>
                <h3>Quais dados podem ser coletados</h3>
                <p>O site Baraquiel é um catálogo estático e não possui cadastro, login, área de usuário ou pagamento dentro do próprio site.</p>
                <p>Quando você acessa o formulário externo do Notion, poderá fornecer voluntariamente dados como: nome ou identificação, telefone com DDD, contexto ou resumo da consulta e outras informações preenchidas diretamente por você.</p>
                <h3>Para que os dados são utilizados</h3>
                <p>As informações são utilizadas para organizar a fila de atendimento, entrar em contato com você, entender qual atendimento foi solicitado, combinar a forma de atendimento e pagamento e responder dúvidas.</p>
                <p>O site e o formulário não solicitam senhas, dados de cartão ou informações bancárias.</p>
                <h3>Dados sensíveis</h3>
                <p>Evite enviar pelo formulário ou pelo WhatsApp: documentos pessoais, senhas, dados bancários e informações médicas.</p>
                <h3>Onde os dados são armazenados e com quem podem ser compartilhados</h3>
                <p>As respostas do formulário são armazenadas no Notion, serviço utilizado para receber e organizar as solicitações.</p>
                <p>Os dados também poderão ser tratados pelos serviços utilizados que você escolhe entrar em contato, ou seja: WhatsApp, Instagram, TikTok ou X. Cada plataforma possui sua própria política de privacidade.</p>
                <p>Não vendemos ou alugamos seus dados pessoais.</p>
                <p>A base de respostas do Notion deve permanecer privada, sendo acessível somente ao responsável pelo atendimento e a pessoas autorizadas.</p>
                <h3>Prazo de armazenamento</h3>
                <p>As respostas serão mantidas somente pelo tempo necessário para organizar e realizar o atendimento.</p>
                <p>Quando não houver mais necessidade de manter os dados, eles serão excluídos. Como regra geral, as respostas poderão ser apagadas até <strong>6 meses após o último contato</strong>, salvo quando houver obrigação legal ou necessidade de preservar informações para defesa de direitos.</p>
                <h3>Segurança</h3>
                <p>São adotadas medidas razoáveis para proteger as informações, como acesso restrito à base de respostas, não publicação da página que contém as respostas, não solicitação de senhas ou dados de cartão e exclusão de informações que não sejam mais necessárias.</p>
                <p>Nenhum serviço digital é completamente livre de riscos, mas buscamos manter os dados protegidos e limitados ao uso necessário.</p>
                <h3>Seus direitos</h3>
                <p>Você pode solicitar confirmação sobre o uso dos seus dados, acesso às informações armazenadas, correção de dados incorretos, exclusão de dados que não sejam mais necessários e informações sobre o compartilhamento dos dados.</p>
                <p>Para fazer uma solicitação, entre em contato pelo WhatsApp indicado nesta página.</p>
                <h3>Cookies e links externos</h3>
                <p>Atualmente, o site Baraquiel não utiliza cadastro, cookies de publicidade ou ferramentas próprias de análise de visitantes.</p>
                <p>Links para Notion, WhatsApp, Instagram, TikTok, X e outros sites levam a serviços externos, que podem coletar informações conforme suas próprias políticas de privacidade.</p>
                <h3>Atualizações</h3>
                <p>Este Aviso de Privacidade poderá ser atualizado para refletir mudanças no site, no formulário ou na forma de atendimento. A versão mais recente estará sempre disponível nesta página.</p>
            `
        }
    };

    $$("[data-panel]").forEach(button => {
        button.addEventListener("click", () => {
            const panel = panels[button.dataset.panel];
            if (!panel) return;
            $("#info-title").textContent = panel.title;
            $("#info-content").innerHTML = panel.body();
            openDialog(infoDialog);
        });
    });

    function renderSearch(query = "") {
        const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
        const matches = config.produtos.filter(product => {
            const haystack = [
                product.titulo,
                product.preco
            ].join(" ").toLocaleLowerCase("pt-BR");
            return !normalizedQuery || haystack.includes(normalizedQuery);
        });

        $("#search-results").innerHTML = matches.length
            ? matches.map(product => `
                <button class="resultado-busca" type="button" data-search-product="${escapeHtml(product.id)}">
                    <img src="${escapeHtml(safeUrl(productArt(product)))}" alt="" width="54" height="54">
                    <span><strong>${escapeHtml(product.titulo)}</strong><small>${escapeHtml(product.preco)}</small></span>
                    <span aria-hidden="true">↗</span>
                </button>
            `).join("")
            : '<p class="busca-vazia">Nenhuma tiragem encontrada. Tente outra palavra.</p>';
    }

    $$(".acionador-busca").forEach(button => {
        button.addEventListener("click", () => {
            closeMenu();
            renderSearch();
            // No celular, manter o foco no botão de fechar evita abrir o teclado automaticamente.
            // O campo recebe foco normalmente quando a pessoa toca nele.
            const searchFocus = window.matchMedia("(max-width: 880px)").matches
                ? "[data-close]"
                : "#catalog-search";
            openDialog(searchDialog, searchFocus);
        });
    });

    $("#catalog-search").addEventListener("input", event => renderSearch(event.target.value));

    $("#search-results").addEventListener("click", event => {
        const result = event.target.closest("[data-search-product]");
        if (!result) return;
        const productId = result.dataset.searchProduct;
        searchDialog.close();
        setTimeout(() => openProduct(productId), 80);
    });

    const questionPrices = {
        1: "R$ 25,00",
        2: "R$ 40,00",
        3: "R$ 60,00",
        4: "R$ 80,00"
    };

    $$("[data-questions]").forEach(button => {
        button.addEventListener("click", () => {
            const amount = Number(button.dataset.questions);
            $$("[data-questions]").forEach(item => {
                item.setAttribute("aria-pressed", String(item === button));
            });
            $("#question-count").textContent = amount;
            $("#question-count").nextElementSibling.textContent = amount === 1 ? "pergunta" : "perguntas";
            $("#question-price").textContent = questionPrices[amount];
            [$("#question-count"), $("#question-price")].forEach(el => {
                el.classList.remove("pulso"); void el.offsetWidth; el.classList.add("pulso");
            });
            $("#builder-contact").innerHTML = `Solicitar ${amount} ${amount === 1 ? "pergunta" : "perguntas"}
                <span aria-hidden="true">↗</span>`;
        });
    });

    $("#builder-contact").href = safeUrl(config.links.formulario);

    $$(".lista-duvidas details").forEach(detail => {
        detail.addEventListener("toggle", () => {
            if (!detail.open) return;
            $$(".lista-duvidas details").forEach(other => {
                if (other !== detail) other.open = false;
            });
        });
    });

    if (config.links.formulario) {
        $$('[data-form-link]').forEach(link => {
            link.href = safeUrl(config.links.formulario);
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.hidden = false;
        });
    }

    $("#year").textContent = new Date().getFullYear();

    const video = $("#hero-video");
    if (config.video) {
        video.src = safeUrl(config.video);
        video.load();
        video.play().catch(() => {
            const startVideo = () => video.play().catch(() => {});
            document.addEventListener("pointerdown", startVideo, { once: true });
        });
    }

    renderProducts();

    // Onda de clique a partir do ponto tocado.
    document.addEventListener("pointerdown", event => {
        const target = event.target.closest(".botao-acao, .botao-pilula, .pilula-pequena, .botoes-escolha button, .link-rede, .resultado-busca, .botao-fechar, .navegacao-mobile a, .navegacao-mobile button, .navegacao-desktop a, .rodape a, .rodape button, .lista-duvidas summary, .abrir-produto");
        if (!target || reducedMotionQuery.matches) return;
        const box = target.getBoundingClientRect();
        const size = Math.max(box.width, box.height) * 2;
        const wave = document.createElement("span");
        wave.className = "onda-clique";
        wave.setAttribute("aria-hidden", "true");
        wave.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - box.left - size / 2}px;top:${event.clientY - box.top - size / 2}px`;
        target.appendChild(wave);
        wave.addEventListener("animationend", () => wave.remove(), { once: true });
        window.setTimeout(() => wave.remove(), 700);
    }, { passive: true });

    const revealElements = $$(".revelar");
    revealElements.forEach((element, index) => {
        element.style.setProperty("--reveal-delay", `${Math.min((index % 4) * 75, 225)}ms`);
    });

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("esta-visivel");
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });

        revealElements.forEach(element => revealObserver.observe(element));
    } else {
        revealElements.forEach(element => element.classList.add("esta-visivel"));
    }

    // Movimento sutil ligado ao scroll, limitado a transformações compostas para permanecer fluido.
    let motionFrame = 0;
    const updateScrollMotion = () => {
        motionFrame = 0;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        siteHeader?.classList.toggle("esta-rolado", scrollTop > 8);

        if (!heroCard) return;
        if (reducedMotionQuery.matches) {
            heroCard.style.setProperty("--hero-parallax", "0px");
            heroCard.style.setProperty("--hero-copy-shift", "0px");
            heroCard.style.setProperty("--hero-copy-opacity", "1");
            return;
        }

        const rect = heroCard.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
        const mobile = window.matchMedia("(max-width: 680px)").matches;
        heroCard.style.setProperty("--hero-parallax", `${(progress * (mobile ? 7 : 20)).toFixed(2)}px`);
        heroCard.style.setProperty("--hero-copy-shift", `${(progress * (mobile ? -4 : -12)).toFixed(2)}px`);
        heroCard.style.setProperty("--hero-copy-opacity", `${(1 - progress * .16).toFixed(3)}`);
    };

    const scheduleScrollMotion = () => {
        if (!motionFrame) motionFrame = window.requestAnimationFrame(updateScrollMotion);
    };

    window.addEventListener("scroll", scheduleScrollMotion, { passive: true });
    window.addEventListener("resize", scheduleScrollMotion, { passive: true });
    reducedMotionQuery.addEventListener?.("change", scheduleScrollMotion);
    updateScrollMotion();
})();
