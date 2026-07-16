const contentNode = document.getElementById("portal-content-data");

if (contentNode) {
  const publishedContent = JSON.parse(contentNode.textContent || "{}");
  const body = document.body;
  const basePath = body.dataset.portalBase || "/";
  const apiBase = (body.dataset.adminApi || "").replace(/\/$/, "");
  const editorEntry = document.querySelector("[data-editor-toggle]");
  const editorToolbar = document.querySelector("[data-editor-toolbar]");
  const editorStatus = document.querySelector("[data-editor-status]");
  const navigationDialog = document.querySelector("[data-navigation-dialog]");
  const navigationForm = document.querySelector("[data-navigation-form]");
  const cardDialog = document.querySelector("[data-card-dialog]");
  const cardForm = document.querySelector("[data-card-form]");
  const deleteDialog = document.querySelector("[data-delete-dialog]");
  const deleteForm = document.querySelector("[data-delete-form]");
  const releasesDialog = document.querySelector("[data-releases-dialog]");
  const releaseList = document.querySelector("[data-release-list]");
  const pageEditor = document.querySelector("[data-page-editor]");
  const pageEditorCanvas = document.querySelector("[data-page-editor-canvas]");
  const pageEditorPreview = document.querySelector("[data-page-editor-preview-pane]");
  const toast = document.querySelector("[data-editor-toast]");
  const slideTrack = document.querySelector("[data-track]");
  const tabsContainer = document.querySelector(".tabs");

  const state = {
    content: structuredClone(publishedContent),
    revision: 0,
    isAdmin: false,
    isEditing: false,
    isPreviewing: false,
    isSaving: false,
    isPublishing: false,
    activeNavigationId: "string",
    activePageId: null,
    pendingDelete: null,
    draggedNavigationId: null,
    draggedCard: null,
    saveTimer: null,
    lastSaved: "",
    token: sessionStorage.getItem("portal-admin-token") || "",
    assetPreviews: new Map(),
  };

  const localAdmin = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    && sessionStorage.getItem("portal-local-admin") === "true";

  const clone = (value) => structuredClone(value);
  const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
  const normalizeRoute = (value) => String(value || "").replace(/^\/+|\/+$/g, "");
  const slugify = (value) => String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "") || "page";
  const isExternal = (href) => /^(https?:|mailto:|#|data:|blob:)/.test(String(href || ""));
  const withBase = (path = "") => isExternal(path) ? path : `${basePath}${String(path).replace(/^\/+/, "")}`;
  const findNavigation = (id) => state.content.navigation.find((item) => item.id === id);
  const findPage = (id) => state.content.pages.find((item) => item.id === id);
  const pageForCard = (card) => card?.destination?.kind === "page" ? findPage(card.destination.pageId) : null;
  const imagePreview = (src) => state.assetPreviews.get(src) || src;

  function showToast(message, duration = 2400) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, duration);
  }

  function setStatus(message) {
    if (editorStatus) editorStatus.textContent = message;
  }

  function safeLink(href) {
    const value = String(href || "").trim();
    if (!value) return "";
    if (/^(javascript|vbscript):/i.test(value)) return "";
    return value;
  }

  function element(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.href) node.setAttribute("href", options.href);
    if (options.type) node.setAttribute("type", options.type);
    if (options.hidden) node.hidden = true;
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([name, value]) => {
        if (value !== undefined && value !== null) node.setAttribute(name, String(value));
      });
    }
    const items = Array.isArray(children) ? children : [children];
    items.filter(Boolean).forEach((child) => node.append(child));
    return node;
  }

  function button(label, action, extra = {}) {
    return element("button", {
      className: extra.className,
      text: label,
      type: "button",
      attrs: { "data-editor-action": action, ...extra.attrs },
    });
  }

  function controls(items) {
    return element("div", { className: "editor-inline-controls" }, items);
  }

  function cardHref(card) {
    if (!card.destination) return null;
    if (card.destination.kind === "url") return withBase(safeLink(card.destination.href));
    const page = findPage(card.destination.pageId);
    return page ? withBase(`${normalizeRoute(page.route)}/`) : null;
  }

  function protectReservedContent() {
    const stringItem = findNavigation("string");
    const blogItem = findNavigation("blog");
    if (!stringItem || !blogItem) throw new Error("Protected navigation is missing.");
    stringItem.locked = true;
    blogItem.locked = true;
    const others = state.content.navigation.filter((item) => item.id !== "string" && item.id !== "blog");
    state.content.navigation = [stringItem, blogItem, ...others];
  }

  function renderNavigationTabs() {
    if (!tabsContainer || !editorEntry) return;
    Array.from(tabsContainer.children).forEach((child) => {
      if (child.matches("[data-navigation-tab], [data-navigation-shell]")) child.remove();
    });

    state.content.navigation.forEach((navigation, index) => {
      const tab = element("button", {
        className: `tab ${navigation.id === state.activeNavigationId ? "is-active" : ""}`,
        text: navigation.label,
        type: "button",
        attrs: {
          "data-page": index,
          "data-navigation-tab": "",
          "data-navigation-id": navigation.id,
          "data-navigation-locked": navigation.locked,
          "aria-selected": navigation.id === state.activeNavigationId,
        },
      });
      const shell = element("span", {
        className: "editor-nav-shell",
        attrs: {
          "data-navigation-shell": "",
          "data-navigation-id": navigation.id,
          draggable: state.isEditing && !state.isPreviewing && !navigation.locked,
        },
      }, tab);

      if (state.isEditing && !state.isPreviewing && !navigation.locked) {
        shell.append(controls([
          button("Edit", "edit-navigation", { attrs: { "data-navigation-id": navigation.id } }),
          button("Delete", "delete-navigation", { attrs: { "data-navigation-id": navigation.id, "data-action": "delete" } }),
        ]));
      }
      tabsContainer.insertBefore(shell, editorEntry);
    });
  }

  function renderCardContent(card) {
    const href = cardHref(card);
    const cardNode = element(href ? "a" : "article", {
      className: `directory-card managed-card managed-card--${card.width}`,
      href: href || undefined,
      attrs: {
        "data-managed-card": "",
        "data-card-id": card.id,
        "data-card-type": card.type,
        "data-card-width": card.width,
      },
    });

    if (card.image?.src) {
      const image = element("img", {
        attrs: { src: imagePreview(card.image.src), alt: card.image.alt || "", loading: "lazy" },
      });
      const figure = element("figure", { className: "managed-card-image" }, image);
      if (card.image.caption) figure.append(element("figcaption", { text: card.image.caption }));
      cardNode.append(figure);
    }

    const badge = element("span", { text: card.badge, attrs: { "data-inline-field": "badge" } });
    const title = element("h3", { text: card.title, attrs: { "data-inline-field": "title" } });
    const summary = element("p", { text: card.summary, attrs: { "data-inline-field": "summary" } });
    if (state.isEditing && !state.isPreviewing) {
      [badge, title, summary].forEach((node) => {
        node.setAttribute("contenteditable", "true");
        node.setAttribute("spellcheck", "true");
      });
    }
    cardNode.append(badge, title, summary);

    if (Array.isArray(card.actions) && card.actions.length) {
      const actions = element("div", { className: "managed-card-actions" });
      card.actions.forEach((action) => {
        const hrefValue = safeLink(action.href);
        if (hrefValue) actions.append(element("a", { text: action.label, href: withBase(hrefValue) }));
      });
      cardNode.append(actions);
    }
    if (href) cardNode.append(element("small", { className: "managed-card-open", text: "Open" }));
    return cardNode;
  }

  function renderManagedGrid(navigation) {
    const grid = element("div", {
      className: "managed-card-grid",
      attrs: { "data-managed-card-grid": "", "data-navigation-id": navigation.id },
    });

    navigation.blocks.forEach((card) => {
      const shell = element("div", {
        className: `managed-card-shell managed-card-shell--${card.width}`,
        attrs: {
          "data-card-shell": "",
          "data-card-id": card.id,
          "data-navigation-id": navigation.id,
          draggable: state.isEditing && !state.isPreviewing,
        },
      }, renderCardContent(card));
      if (state.isEditing && !state.isPreviewing) {
        const cardControls = [
          button("Edit", "edit-card", { attrs: { "data-navigation-id": navigation.id, "data-card-id": card.id } }),
          button("Copy", "duplicate-card", { attrs: { "data-navigation-id": navigation.id, "data-card-id": card.id } }),
        ];
        if (pageForCard(card)) {
          cardControls.push(button("Page", "edit-page", { attrs: { "data-page-id": pageForCard(card).id } }));
        }
        cardControls.push(button("Delete", "delete-card", {
          attrs: { "data-navigation-id": navigation.id, "data-card-id": card.id, "data-action": "delete" },
        }));
        shell.append(controls(cardControls));
      }
      grid.append(shell);
    });

    if (state.isEditing && !state.isPreviewing) {
      grid.append(element("button", {
        className: "editor-add-slot",
        text: "+ Add block",
        type: "button",
        attrs: { "data-editor-action": "add-card", "data-navigation-id": navigation.id },
      }));
    }
    return grid;
  }

  function renderRichBlock(block) {
    if (block.type === "paragraph") return element("p", { text: block.text });
    if (block.type === "heading") return element(block.level === 3 ? "h3" : "h2", { text: block.text });
    if (block.type === "image") {
      const figure = element("figure", { className: `rich-image rich-image--${block.width || "normal"}` });
      figure.append(element("img", { attrs: { src: imagePreview(block.src), alt: block.alt || "", loading: "lazy" } }));
      if (block.caption) figure.append(element("figcaption", { text: block.caption }));
      return figure;
    }
    if (block.type === "list") {
      const list = element(block.style === "ordered" ? "ol" : "ul", { className: block.style === "todo" ? "todo-list" : "" });
      block.items.forEach((item) => list.append(element("li", { text: item })));
      return list;
    }
    if (block.type === "link") {
      const link = element("a", { className: "rich-link-button", text: block.label, href: withBase(safeLink(block.href)) });
      return element("p", {}, link);
    }
    if (block.type === "quote") return element("blockquote", { text: block.text });
    if (block.type === "divider") return element("hr");
    const code = element("code", { text: block.code, attrs: { class: block.language ? `language-${block.language}` : "" } });
    return element("pre", {}, code);
  }

  function renderRichContent(blocks) {
    const container = element("div", { className: "rich-content", attrs: { "data-rich-content": "" } });
    blocks.forEach((block) => {
      const node = renderRichBlock(block);
      node.dataset.contentBlock = "";
      node.dataset.blockId = block.id;
      node.dataset.blockType = block.type;
      container.append(node);
    });
    return container;
  }

  function renderManagedPanels() {
    if (!slideTrack) return;
    slideTrack.querySelectorAll("[data-navigation-panel], [data-managed-page]").forEach((node) => node.remove());
    const blogPanel = slideTrack.querySelector('[data-panel="blog"]');
    if (!blogPanel) return;
    const fragment = document.createDocumentFragment();

    state.content.navigation.filter((item) => item.kind === "managed").forEach((navigation) => {
      const panel = element("article", {
        className: "page managed-navigation-page",
        attrs: {
          "data-panel": navigation.id,
          "data-route": `${navigation.slug}/`,
          "data-tab": state.content.navigation.findIndex((item) => item.id === navigation.id),
          "data-navigation-panel": "",
          "data-navigation-id": navigation.id,
        },
      });
      const heading = element("div", { className: "page-heading" }, [
        element("p", { text: "Navigation" }),
        element("h2", { text: navigation.title, attrs: { "data-navigation-title": "" } }),
      ]);
      panel.append(heading, element("p", {
        className: "page-intro",
        text: navigation.description,
        attrs: { "data-navigation-description": "" },
      }), renderManagedGrid(navigation));
      if (!navigation.blocks.length && !state.isEditing) {
        panel.append(element("div", { className: "managed-empty" }, [
          element("strong", { text: "Nothing here yet." }),
          element("span", { text: "The first block has not been published." }),
        ]));
      }
      fragment.append(panel);
    });

    state.content.pages.forEach((page) => {
      const parent = findNavigation(page.parentNavigationId);
      if (!parent) return;
      const panel = element("article", {
        className: "page detail-page managed-detail-page",
        attrs: {
          "data-panel": `managed-${page.id}`,
          "data-route": `${normalizeRoute(page.route)}/`,
          "data-tab": state.content.navigation.findIndex((item) => item.id === parent.id),
          "data-managed-page": "",
          "data-page-id": page.id,
        },
      });
      panel.append(
        element("a", {
          className: "panel-back",
          text: `Back to ${parent.title}`,
          href: withBase(`${parent.slug}/`),
          attrs: { "data-portal-route": `${parent.slug}/` },
        }),
        element("header", { className: "section-header" }, [
          element("p", { text: parent.title }),
          element("div", {}, element("span", { className: "section-badge", text: page.badge })),
          element("h1", { text: page.title }),
          element("span", { text: page.description }),
        ]),
        renderRichContent(page.content),
      );
      if (state.isEditing && !state.isPreviewing) {
        panel.append(element("button", {
          className: "editor-button editor-page-edit-button",
          text: "Edit page content",
          type: "button",
          attrs: { "data-editor-action": "edit-page", "data-page-id": page.id },
        }));
      }
      fragment.append(panel);
    });
    blogPanel.after(fragment);
  }

  function renderPortal(options = {}) {
    protectReservedContent();
    const requestedPanel = options.panelName
      || document.querySelector("[data-panel].is-current")?.dataset.panel
      || state.activeNavigationId;
    renderNavigationTabs();
    renderManagedPanels();
    window.portalRouter?.refresh();
    if (!window.portalRouter?.openPanel(requestedPanel, null)) {
      const fallback = findNavigation(state.activeNavigationId)?.kind === "managed" ? state.activeNavigationId : "home";
      window.portalRouter?.openPanel(fallback, null);
    }
    body.classList.toggle("is-editing", state.isEditing && !state.isPreviewing);
    editorToolbar.hidden = !state.isEditing;
    const previewButton = editorToolbar?.querySelector("[data-preview-draft]");
    if (previewButton) previewButton.textContent = state.isPreviewing ? "Resume editing" : "Preview";
  }

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    return response;
  }

  async function loadDraft() {
    setStatus("Loading draft…");
    if (localAdmin) {
      const saved = localStorage.getItem("portal-local-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        state.content = parsed.content || clone(publishedContent);
        state.revision = Number(parsed.revision || 0);
      } else {
        state.content = clone(publishedContent);
      }
      state.lastSaved = JSON.stringify(state.content);
      setStatus("Local draft loaded");
      return;
    }
    if (!apiBase || !state.token) throw new Error("Admin API is not configured.");
    const response = await apiFetch("/v1/draft");
    if (response.status === 404) {
      state.content = clone(publishedContent);
      state.revision = 0;
      state.lastSaved = JSON.stringify(state.content);
      setStatus("Published version loaded");
      return;
    }
    if (!response.ok) throw new Error("The cloud draft could not be loaded.");
    const data = await response.json();
    state.content = data.content;
    state.revision = Number(data.revision || 0);
    state.assetPreviews = new Map(Object.entries(data.assetPreviews || {}));
    state.lastSaved = JSON.stringify(state.content);
    setStatus("Cloud draft loaded");
  }

  function scheduleSave() {
    window.clearTimeout(state.saveTimer);
    setStatus("Unsaved changes");
    state.saveTimer = window.setTimeout(() => saveDraft(), 700);
  }

  async function saveDraft(force = false) {
    const serialized = JSON.stringify(state.content);
    if (!force && (serialized === state.lastSaved || state.isSaving)) return;
    state.isSaving = true;
    setStatus("Saving draft…");
    try {
      if (localAdmin) {
        state.revision += 1;
        localStorage.setItem("portal-local-draft", JSON.stringify({ revision: state.revision, content: state.content }));
      } else {
        const response = await apiFetch("/v1/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: state.revision, content: state.content }),
        });
        if (response.status === 409) {
          const conflict = await response.json();
          const reload = window.confirm("A newer draft exists on another device. Reload the cloud version? Choose Cancel to keep this version and save it as the latest draft.");
          if (reload) {
            state.content = conflict.content;
            state.revision = Number(conflict.revision || 0);
            state.assetPreviews = new Map(Object.entries(conflict.assetPreviews || {}));
            state.lastSaved = JSON.stringify(state.content);
            renderPortal();
            setStatus("Newer cloud draft loaded");
            return;
          }
          state.revision = Number(conflict.revision || state.revision);
          state.isSaving = false;
          return saveDraft(true);
        }
        if (!response.ok) throw new Error("Draft save failed.");
        const data = await response.json();
        state.revision = Number(data.revision || state.revision + 1);
      }
      state.lastSaved = serialized;
      setStatus("Draft saved");
    } catch (error) {
      console.error(error);
      setStatus("Draft save failed");
      showToast(error.message || "Draft save failed.", 4000);
    } finally {
      state.isSaving = false;
    }
  }

  async function enterEditor() {
    if (!state.isAdmin) return;
    if (!state.isEditing) {
      try {
        await loadDraft();
      } catch (error) {
        showToast(error.message || "The editor could not start.", 4200);
        return;
      }
    }
    state.isEditing = true;
    state.isPreviewing = false;
    renderPortal();
  }

  async function exitEditor() {
    await saveDraft();
    state.isEditing = false;
    state.isPreviewing = false;
    renderPortal();
  }

  function currentManagedNavigation() {
    const active = document.querySelector("[data-navigation-tab].is-active")?.dataset.navigationId || state.activeNavigationId;
    const navigation = findNavigation(active);
    return navigation?.kind === "managed" ? navigation : null;
  }

  function uniqueNavigationSlug(source, currentId = null) {
    const baseSlug = slugify(source);
    let result = baseSlug;
    let suffix = 2;
    while (state.content.navigation.some((item) => item.id !== currentId && item.slug === result)) {
      result = `${baseSlug}-${suffix++}`;
    }
    return result;
  }

  function uniquePageRoute(navigation, source, currentPageId = null) {
    const pageSlug = slugify(source);
    const baseRoute = `${normalizeRoute(navigation.slug)}/${pageSlug}`;
    let route = baseRoute;
    let suffix = 2;
    while (state.content.pages.some((page) => page.id !== currentPageId && normalizeRoute(page.route) === route)) {
      route = `${baseRoute}-${suffix++}`;
    }
    return route;
  }

  function openNavigationDialog(navigationId = null) {
    const navigation = navigationId ? findNavigation(navigationId) : null;
    if (navigation?.locked) return showToast("STRING and BLOG are protected in version 1.");
    navigationForm.reset();
    navigationForm.elements.navigationId.value = navigation?.id || "";
    navigationForm.elements.title.value = navigation?.title || "";
    navigationForm.elements.label.value = navigation?.label || "";
    navigationForm.elements.slug.value = navigation?.slug || "";
    navigationForm.elements.description.value = navigation?.description || "";
    navigationDialog.querySelector("[data-navigation-dialog-title]").textContent = navigation ? "Edit navigation" : "Add navigation";
    navigationDialog.showModal();
  }

  function toggleCardFields() {
    const isPage = cardForm.elements.type.value === "page";
    cardDialog.querySelector("[data-page-card-fields]").hidden = !isPage;
    cardDialog.querySelector("[data-text-card-fields]").hidden = isPage;
    const isUrl = cardForm.elements.destinationKind.value === "url";
    cardDialog.querySelector("[data-card-url-field]").hidden = !isPage || !isUrl;
  }

  function openCardDialog(navigationId, cardId = null) {
    const navigation = findNavigation(navigationId);
    if (!navigation || navigation.locked) return showToast("This navigation is protected.");
    const card = cardId ? navigation.blocks.find((item) => item.id === cardId) : null;
    cardForm.reset();
    cardForm.elements.navigationId.value = navigationId;
    cardForm.elements.cardId.value = card?.id || "";
    cardForm.elements.type.value = card?.type || "text";
    cardForm.elements.width.value = card?.width || "half";
    cardForm.elements.badge.value = card?.badge || "";
    cardForm.elements.title.value = card?.title || "";
    cardForm.elements.summary.value = card?.summary || "";
    cardForm.elements.imageSrc.value = card?.image?.src?.startsWith("asset://") ? "" : card?.image?.src || "";
    cardForm.elements.imageAlt.value = card?.image?.alt || "";
    cardForm.elements.imageCaption.value = card?.image?.caption || "";
    cardForm.elements.actionLabel.value = card?.actions?.[0]?.label || "";
    cardForm.elements.actionHref.value = card?.actions?.[0]?.href || "";
    cardForm.elements.destinationKind.value = card?.destination?.kind === "url" ? "url" : "new-page";
    cardForm.elements.destinationUrl.value = card?.destination?.kind === "url" ? card.destination.href : "";
    cardDialog.querySelector("[data-card-dialog-title]").textContent = card ? "Edit block" : "Add block";
    toggleCardFields();
    cardDialog.showModal();
  }

  async function uploadImage(file) {
    if (!file) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
    if (file.size > 10 * 1024 * 1024) throw new Error("The image must be 10 MB or smaller.");
    if (localAdmin) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { src: dataUrl, previewUrl: dataUrl };
    }
    const payload = new FormData();
    payload.append("file", file);
    const response = await apiFetch("/v1/uploads", { method: "POST", body: payload });
    if (!response.ok) throw new Error("Image upload failed.");
    const data = await response.json();
    const src = `asset://${data.assetId}`;
    state.assetPreviews.set(src, data.previewUrl);
    return { src, previewUrl: data.previewUrl };
  }

  function deletionImpactForNavigation(navigation) {
    const pages = state.content.pages.filter((page) => page.parentNavigationId === navigation.id);
    const images = navigation.blocks.filter((card) => card.image?.src).length
      + pages.reduce((count, page) => count + page.content.filter((block) => block.type === "image").length, 0);
    return { blocks: navigation.blocks.length, pages: pages.length, images, urls: pages.length + 1 };
  }

  function renderDeleteImpact(impact) {
    const list = deleteDialog.querySelector("[data-delete-impact]");
    list.replaceChildren();
    Object.entries(impact).forEach(([label, value]) => {
      const row = element("div", {}, [element("dt", { text: label[0].toUpperCase() + label.slice(1) }), element("dd", { text: value })]);
      list.append(row);
    });
  }

  function openDeleteNavigation(navigationId) {
    const navigation = findNavigation(navigationId);
    if (!navigation || navigation.locked) return showToast("This navigation is protected.");
    state.pendingDelete = { kind: "navigation", navigationId };
    deleteDialog.querySelector("[data-delete-title]").textContent = `Delete ${navigation.label}?`;
    deleteDialog.querySelector("[data-delete-summary]").textContent = "This navigation and all managed content inside it will be permanently removed from the draft.";
    renderDeleteImpact(deletionImpactForNavigation(navigation));
    const field = deleteDialog.querySelector("[data-delete-confirm-field]");
    field.hidden = false;
    field.querySelector("strong").textContent = navigation.label;
    deleteForm.elements.confirmation.value = "";
    deleteDialog.showModal();
  }

  function openDeleteCard(navigationId, cardId) {
    const navigation = findNavigation(navigationId);
    const card = navigation?.blocks.find((item) => item.id === cardId);
    if (!navigation || !card) return;
    const page = pageForCard(card);
    state.pendingDelete = { kind: "card", navigationId, cardId };
    deleteDialog.querySelector("[data-delete-title]").textContent = `Delete ${card.title}?`;
    deleteDialog.querySelector("[data-delete-summary]").textContent = page
      ? "The block and its linked page will be permanently removed from the draft."
      : "The block will be permanently removed from the draft.";
    renderDeleteImpact({ blocks: 1, pages: page ? 1 : 0, images: Number(Boolean(card.image?.src)) + (page?.content.filter((item) => item.type === "image").length || 0), urls: page ? 1 : 0 });
    deleteDialog.querySelector("[data-delete-confirm-field]").hidden = true;
    deleteForm.elements.confirmation.value = "";
    deleteDialog.showModal();
  }

  function duplicateCard(navigationId, cardId) {
    const navigation = findNavigation(navigationId);
    const index = navigation?.blocks.findIndex((item) => item.id === cardId) ?? -1;
    if (!navigation || index < 0) return;
    const source = navigation.blocks[index];
    const copy = clone(source);
    copy.id = makeId("card");
    copy.title = `${copy.title} copy`;
    if (copy.destination?.kind === "page") {
      const sourcePage = findPage(copy.destination.pageId);
      if (sourcePage) {
        const pageCopy = clone(sourcePage);
        pageCopy.id = makeId("page");
        pageCopy.title = `${pageCopy.title} copy`;
        pageCopy.slug = slugify(pageCopy.title);
        pageCopy.route = uniquePageRoute(navigation, pageCopy.title);
        pageCopy.content.forEach((block) => { block.id = makeId(block.type); });
        state.content.pages.push(pageCopy);
        copy.destination.pageId = pageCopy.id;
      }
    }
    navigation.blocks.splice(index + 1, 0, copy);
    scheduleSave();
    renderPortal({ panelName: navigationId });
  }

  function richBlockEditor(block, index, total) {
    const wrapper = element("section", {
      className: "rich-block-editor",
      attrs: { "data-rich-block-editor": "", "data-block-id": block.id },
    });
    wrapper.append(element("div", { className: "rich-block-editor-toolbar" }, [
      element("strong", { text: block.type }),
      element("div", {}, [
        button("↑", "move-rich-up", { attrs: { "data-block-id": block.id }, ...(index === 0 ? { attrs: { "data-block-id": block.id, disabled: true } } : {}) }),
        button("↓", "move-rich-down", { attrs: { "data-block-id": block.id, ...(index === total - 1 ? { disabled: true } : {}) } }),
        button("×", "delete-rich-block", { attrs: { "data-block-id": block.id, "aria-label": "Delete content block" } }),
      ]),
    ]));

    const field = (tag, name, value, attrs = {}) => element(tag, {
      attrs: { "data-rich-field": name, value: tag === "input" ? value : undefined, ...attrs },
      text: tag === "textarea" ? value : undefined,
    });

    if (block.type === "paragraph" || block.type === "quote") wrapper.append(field("textarea", "text", block.text, { rows: 4 }));
    if (block.type === "heading") {
      const level = element("select", { attrs: { "data-rich-field": "level" } }, [
        element("option", { text: "Heading 2", attrs: { value: 2 } }),
        element("option", { text: "Heading 3", attrs: { value: 3 } }),
      ]);
      level.value = String(block.level);
      wrapper.append(level, field("input", "text", block.text));
    }
    if (block.type === "image") {
      wrapper.append(field("input", "src", block.src.startsWith("asset://") ? "" : block.src, { placeholder: "Image URL" }));
      const file = field("input", "file", "", { type: "file", accept: "image/jpeg,image/png,image/webp", "data-image-upload": "" });
      wrapper.append(file, field("input", "alt", block.alt, { placeholder: "Alt text" }), field("input", "caption", block.caption || "", { placeholder: "Caption" }));
      const width = element("select", { attrs: { "data-rich-field": "width" } }, [
        element("option", { text: "Normal width", attrs: { value: "normal" } }),
        element("option", { text: "Full width", attrs: { value: "full" } }),
      ]);
      width.value = block.width || "normal";
      wrapper.append(width);
    }
    if (block.type === "list") {
      const style = element("select", { attrs: { "data-rich-field": "style" } }, [
        element("option", { text: "Bullet list", attrs: { value: "unordered" } }),
        element("option", { text: "Numbered list", attrs: { value: "ordered" } }),
        element("option", { text: "Todo list", attrs: { value: "todo" } }),
      ]);
      style.value = block.style;
      wrapper.append(style, field("textarea", "items", block.items.join("\n"), { rows: 5, placeholder: "One item per line" }));
    }
    if (block.type === "link") wrapper.append(field("input", "label", block.label, { placeholder: "Button label" }), field("input", "href", block.href, { placeholder: "https://… or /path/" }));
    if (block.type === "code") wrapper.append(field("input", "language", block.language || "", { placeholder: "Language (optional)" }), field("textarea", "code", block.code, { rows: 8 }));
    if (block.type === "divider") wrapper.append(element("small", { text: "A horizontal divider will appear here." }));
    return wrapper;
  }

  function renderPageEditor() {
    const page = findPage(state.activePageId);
    if (!page || !pageEditorCanvas || !pageEditorPreview) return;
    pageEditor.querySelector("[data-page-editor-title]").textContent = page.title;
    pageEditorCanvas.replaceChildren();
    page.content.forEach((block, index) => pageEditorCanvas.append(richBlockEditor(block, index, page.content.length)));
    if (!page.content.length) pageEditorCanvas.append(element("div", { className: "managed-empty" }, [
      element("strong", { text: "This page is empty." }),
      element("span", { text: "Choose a content block from the left." }),
    ]));
    pageEditorPreview.replaceChildren(
      element("header", { className: "section-header" }, [
        element("p", { text: findNavigation(page.parentNavigationId)?.title || "Page" }),
        element("div", {}, element("span", { className: "section-badge", text: page.badge })),
        element("h1", { text: page.title }),
        element("span", { text: page.description }),
      ]),
      renderRichContent(page.content),
    );
  }

  function openPageEditor(pageId) {
    if (!findPage(pageId)) return;
    state.activePageId = pageId;
    pageEditor.hidden = false;
    body.style.overflow = "hidden";
    renderPageEditor();
  }

  function closePageEditor() {
    if (!pageEditor) return;
    pageEditor.hidden = true;
    pageEditor.classList.remove("is-previewing");
    body.style.removeProperty("overflow");
    scheduleSave();
    const panelName = state.activePageId ? `managed-${state.activePageId}` : state.activeNavigationId;
    renderPortal({ panelName });
    state.activePageId = null;
  }

  function addRichBlock(type) {
    const page = findPage(state.activePageId);
    if (!page) return;
    const defaults = {
      paragraph: { id: makeId("paragraph"), type: "paragraph", text: "Start writing…" },
      heading: { id: makeId("heading"), type: "heading", level: 2, text: "Section heading" },
      image: { id: makeId("image"), type: "image", src: "", alt: "", caption: "", width: "normal" },
      list: { id: makeId("list"), type: "list", style: "unordered", items: ["First item"] },
      link: { id: makeId("link"), type: "link", label: "Open link", href: "https://" },
      quote: { id: makeId("quote"), type: "quote", text: "Add a quote…" },
      divider: { id: makeId("divider"), type: "divider" },
      code: { id: makeId("code"), type: "code", language: "", code: "// Add code" },
    };
    page.content.push(defaults[type]);
    scheduleSave();
    renderPageEditor();
  }

  async function publishDraft() {
    if (state.isPublishing) return;
    if (localAdmin || !apiBase) return showToast("Connect the Google Cloud admin API before publishing.", 4200);
    const confirmed = window.confirm("Publish this draft to String020/String020.github.io? The public website will update after GitHub Pages finishes building.");
    if (!confirmed) return;
    state.isPublishing = true;
    setStatus("Publishing…");
    try {
      while (state.isSaving) await new Promise((resolve) => window.setTimeout(resolve, 80));
      await saveDraft(true);
      const response = await apiFetch("/v1/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: state.revision }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "Publish failed.");
      const result = await response.json();
      state.revision = Number(result.revision || state.revision);
      setStatus("Published to GitHub");
      showToast(`Published commit ${String(result.commitSha || "").slice(0, 7)}. GitHub Pages is building.`, 5200);
    } catch (error) {
      setStatus("Publish failed");
      showToast(error.message || "Publish failed.", 5200);
    } finally {
      state.isPublishing = false;
    }
  }

  async function openReleaseHistory() {
    if (localAdmin || !apiBase) return showToast("Release history is available after the Google Cloud admin API is connected.", 4200);
    releaseList.replaceChildren(element("p", { text: "Loading releases..." }));
    releasesDialog.showModal();
    try {
      const response = await apiFetch("/v1/releases");
      if (!response.ok) throw new Error("Release history could not be loaded.");
      const { releases = [] } = await response.json();
      if (!releases.length) {
        releaseList.replaceChildren(element("p", { text: "No content releases have been published yet." }));
        return;
      }
      releaseList.replaceChildren(...releases.map((release) => element("article", { className: "editor-release-item" }, [
        element("div", {}, [
          element("strong", { text: String(release.message || "Portal release").split("\n")[0] }),
          element("small", { text: `${String(release.sha).slice(0, 7)} · ${release.publishedAt ? new Date(release.publishedAt).toLocaleString() : "Unknown date"}` }),
        ]),
        element("button", {
          className: "editor-button",
          text: "Restore",
          type: "button",
          attrs: { "data-restore-release": release.sha },
        }),
      ])));
    } catch (error) {
      releaseList.replaceChildren(element("p", { text: error.message || "Release history could not be loaded." }));
    }
  }

  async function restoreRelease(sha, button) {
    if (!window.confirm(`Restore release ${sha.slice(0, 7)} and publish it as a new commit?`)) return;
    button.disabled = true;
    button.textContent = "Restoring...";
    try {
      const response = await apiFetch(`/v1/releases/${encodeURIComponent(sha)}/restore`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "Restore failed.");
      releasesDialog.close();
      await loadDraft();
      renderPortal();
      showToast("The selected release was restored and published as a new commit.", 5200);
    } catch (error) {
      showToast(error.message || "Restore failed.", 5200);
      button.disabled = false;
      button.textContent = "Restore";
    }
  }

  navigationForm?.addEventListener("input", (event) => {
    if (navigationForm.elements.navigationId.value || event.target.name !== "title") return;
    navigationForm.elements.label.value = event.target.value.toUpperCase();
    navigationForm.elements.slug.value = slugify(event.target.value);
  });

  navigationForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(navigationForm);
    const navigationId = String(values.get("navigationId") || "");
    const existing = navigationId ? findNavigation(navigationId) : null;
    const title = String(values.get("title") || "").trim();
    const label = String(values.get("label") || title).trim().toUpperCase();
    const slug = uniqueNavigationSlug(values.get("slug") || title, navigationId || null);
    const description = String(values.get("description") || "").trim();
    if (existing) Object.assign(existing, { title, label, slug, description });
    else {
      const navigation = { id: makeId("nav"), kind: "managed", title, label, slug, description, locked: false, blocks: [] };
      state.content.navigation.push(navigation);
      state.activeNavigationId = navigation.id;
    }
    navigationDialog.close();
    scheduleSave();
    renderPortal({ panelName: state.activeNavigationId });
  });

  cardForm?.addEventListener("change", (event) => {
    if (["type", "destinationKind"].includes(event.target.name)) toggleCardFields();
  });

  cardForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = cardForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const values = new FormData(cardForm);
      const navigation = findNavigation(String(values.get("navigationId") || ""));
      if (!navigation || navigation.locked) throw new Error("This navigation cannot be edited.");
      const cardId = String(values.get("cardId") || "");
      const existing = cardId ? navigation.blocks.find((item) => item.id === cardId) : null;
      const oldPage = pageForCard(existing);
      const type = String(values.get("type"));
      if (oldPage && type === "text") {
        const confirmed = window.confirm("Changing this to an information block will permanently delete its linked page. Continue?");
        if (!confirmed) return;
        state.content.pages = state.content.pages.filter((page) => page.id !== oldPage.id);
      }
      let image = existing?.image || null;
      const imageFile = values.get("imageFile");
      if (imageFile instanceof File && imageFile.size) {
        const uploaded = await uploadImage(imageFile);
        image = { src: uploaded.src, alt: String(values.get("imageAlt") || ""), caption: String(values.get("imageCaption") || "") };
      } else if (String(values.get("imageSrc") || "").trim()) {
        image = { src: safeLink(values.get("imageSrc")), alt: String(values.get("imageAlt") || ""), caption: String(values.get("imageCaption") || "") };
      } else if (image) {
        image.alt = String(values.get("imageAlt") || image.alt || "");
        image.caption = String(values.get("imageCaption") || "");
      }
      const card = existing || { id: makeId("card") };
      Object.assign(card, {
        type,
        width: String(values.get("width")),
        badge: String(values.get("badge") || "").trim().toUpperCase(),
        title: String(values.get("title") || "").trim(),
        summary: String(values.get("summary") || "").trim(),
        image,
      });
      if (type === "text") {
        delete card.destination;
        const actionLabel = String(values.get("actionLabel") || "").trim();
        const actionHref = safeLink(values.get("actionHref"));
        card.actions = actionLabel && actionHref ? [{ id: makeId("action"), label: actionLabel, href: actionHref }] : [];
      } else {
        card.actions = [];
        if (String(values.get("destinationKind")) === "url") {
          card.destination = { kind: "url", href: safeLink(values.get("destinationUrl")) };
        } else if (oldPage) {
          Object.assign(oldPage, { title: card.title, description: card.summary, badge: card.badge });
          card.destination = { kind: "page", pageId: oldPage.id };
        } else {
          const page = {
            id: makeId("page"),
            parentNavigationId: navigation.id,
            title: card.title,
            slug: slugify(card.title),
            route: uniquePageRoute(navigation, card.title),
            description: card.summary,
            badge: card.badge,
            shareImage: image?.src || null,
            content: [{ id: makeId("paragraph"), type: "paragraph", text: card.summary }],
          };
          state.content.pages.push(page);
          card.destination = { kind: "page", pageId: page.id };
        }
      }
      if (!existing) navigation.blocks.push(card);
      cardDialog.close();
      scheduleSave();
      renderPortal({ panelName: navigation.id });
    } catch (error) {
      showToast(error.message || "The block could not be saved.", 4200);
    } finally {
      submitButton.disabled = false;
    }
  });

  deleteForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const pending = state.pendingDelete;
    if (!pending) return;
    if (pending.kind === "navigation") {
      const navigation = findNavigation(pending.navigationId);
      if (!navigation || navigation.locked) return;
      if (deleteForm.elements.confirmation.value.trim() !== navigation.label) {
        return showToast(`Type ${navigation.label} exactly to confirm.`);
      }
      const pageIds = new Set(state.content.pages.filter((page) => page.parentNavigationId === navigation.id).map((page) => page.id));
      state.content.pages = state.content.pages.filter((page) => !pageIds.has(page.id));
      state.content.navigation = state.content.navigation.filter((item) => item.id !== navigation.id);
      state.content.navigation.forEach((item) => {
        item.blocks = item.blocks.filter((card) => card.destination?.kind !== "page" || !pageIds.has(card.destination.pageId));
      });
      state.activeNavigationId = "string";
    } else {
      const navigation = findNavigation(pending.navigationId);
      const card = navigation?.blocks.find((item) => item.id === pending.cardId);
      const page = pageForCard(card);
      if (page) state.content.pages = state.content.pages.filter((item) => item.id !== page.id);
      if (navigation) navigation.blocks = navigation.blocks.filter((item) => item.id !== pending.cardId);
    }
    state.pendingDelete = null;
    deleteDialog.close();
    scheduleSave();
    renderPortal({ panelName: state.activeNavigationId });
  });

  document.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-close-dialog]");
    if (close) {
      close.closest("dialog")?.close();
      return;
    }
    const tab = event.target.closest("[data-navigation-tab]");
    if (tab) state.activeNavigationId = tab.dataset.navigationId;
    const actionNode = event.target.closest("[data-editor-action]");
    if (!actionNode) return;
    event.preventDefault();
    event.stopPropagation();
    const action = actionNode.dataset.editorAction;
    if (action === "edit-navigation") openNavigationDialog(actionNode.dataset.navigationId);
    if (action === "delete-navigation") openDeleteNavigation(actionNode.dataset.navigationId);
    if (action === "add-card") openCardDialog(actionNode.dataset.navigationId);
    if (action === "edit-card") openCardDialog(actionNode.dataset.navigationId, actionNode.dataset.cardId);
    if (action === "delete-card") openDeleteCard(actionNode.dataset.navigationId, actionNode.dataset.cardId);
    if (action === "duplicate-card") duplicateCard(actionNode.dataset.navigationId, actionNode.dataset.cardId);
    if (action === "edit-page") openPageEditor(actionNode.dataset.pageId);
    if (["move-rich-up", "move-rich-down", "delete-rich-block"].includes(action)) {
      const page = findPage(state.activePageId);
      const index = page?.content.findIndex((block) => block.id === actionNode.dataset.blockId) ?? -1;
      if (!page || index < 0) return;
      if (action === "delete-rich-block") page.content.splice(index, 1);
      if (action === "move-rich-up" && index > 0) [page.content[index - 1], page.content[index]] = [page.content[index], page.content[index - 1]];
      if (action === "move-rich-down" && index < page.content.length - 1) [page.content[index + 1], page.content[index]] = [page.content[index], page.content[index + 1]];
      scheduleSave();
      renderPageEditor();
    }
  }, true);

  document.addEventListener("input", (event) => {
    const inline = event.target.closest("[data-inline-field]");
    if (inline && state.isEditing) {
      const cardNode = inline.closest("[data-managed-card]");
      const shell = cardNode?.closest("[data-card-shell]");
      const navigation = findNavigation(shell?.dataset.navigationId);
      const card = navigation?.blocks.find((item) => item.id === shell?.dataset.cardId);
      if (card) {
        card[inline.dataset.inlineField] = inline.textContent.trim();
        const page = pageForCard(card);
        if (page) {
          if (inline.dataset.inlineField === "title") page.title = card.title;
          if (inline.dataset.inlineField === "summary") page.description = card.summary;
          if (inline.dataset.inlineField === "badge") page.badge = card.badge;
        }
        scheduleSave();
      }
    }
    const richField = event.target.closest("[data-rich-field]");
    if (richField && state.activePageId) {
      const page = findPage(state.activePageId);
      const editor = richField.closest("[data-rich-block-editor]");
      const block = page?.content.find((item) => item.id === editor?.dataset.blockId);
      if (!block) return;
      const fieldName = richField.dataset.richField;
      if (fieldName === "items") block.items = richField.value.split("\n").map((item) => item.trim()).filter(Boolean);
      else if (fieldName === "level") block.level = Number(richField.value);
      else block[fieldName] = richField.value;
      scheduleSave();
      renderPageEditorPreviewOnly();
    }
  });

  function renderPageEditorPreviewOnly() {
    const page = findPage(state.activePageId);
    if (!page || !pageEditorPreview) return;
    pageEditorPreview.replaceChildren(
      element("header", { className: "section-header" }, [
        element("p", { text: findNavigation(page.parentNavigationId)?.title || "Page" }),
        element("div", {}, element("span", { className: "section-badge", text: page.badge })),
        element("h1", { text: page.title }),
        element("span", { text: page.description }),
      ]),
      renderRichContent(page.content),
    );
  }

  document.addEventListener("change", async (event) => {
    const imageInput = event.target.closest("[data-image-upload]");
    if (!imageInput?.files?.[0] || !state.activePageId) return;
    const page = findPage(state.activePageId);
    const editor = imageInput.closest("[data-rich-block-editor]");
    const block = page?.content.find((item) => item.id === editor?.dataset.blockId);
    if (!block || block.type !== "image") return;
    try {
      const uploaded = await uploadImage(imageInput.files[0]);
      block.src = uploaded.src;
      scheduleSave();
      renderPageEditor();
    } catch (error) {
      showToast(error.message || "Image upload failed.");
    }
  });

  pageEditorCanvas?.addEventListener("paste", async (event) => {
    const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
    if (!file || !state.activePageId) return;
    event.preventDefault();
    try {
      const uploaded = await uploadImage(file);
      const page = findPage(state.activePageId);
      page.content.push({ id: makeId("image"), type: "image", src: uploaded.src, alt: "", caption: "", width: "normal" });
      scheduleSave();
      renderPageEditor();
    } catch (error) {
      showToast(error.message || "Pasted image upload failed.");
    }
  });

  document.addEventListener("dragstart", (event) => {
    const navShell = event.target.closest("[data-navigation-shell]");
    if (navShell && state.isEditing) state.draggedNavigationId = navShell.dataset.navigationId;
    const cardShell = event.target.closest("[data-card-shell]");
    if (cardShell && state.isEditing) state.draggedCard = { navigationId: cardShell.dataset.navigationId, cardId: cardShell.dataset.cardId };
  });

  document.addEventListener("dragover", (event) => {
    if (state.draggedNavigationId && event.target.closest("[data-navigation-shell]")) event.preventDefault();
    if (state.draggedCard && event.target.closest("[data-card-shell]")) event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    const navTarget = event.target.closest("[data-navigation-shell]");
    if (navTarget && state.draggedNavigationId) {
      event.preventDefault();
      const from = state.content.navigation.findIndex((item) => item.id === state.draggedNavigationId);
      const to = state.content.navigation.findIndex((item) => item.id === navTarget.dataset.navigationId);
      if (from >= 2 && to >= 2 && from !== to) {
        const [item] = state.content.navigation.splice(from, 1);
        state.content.navigation.splice(to, 0, item);
        scheduleSave();
        renderPortal({ panelName: state.activeNavigationId });
      }
      state.draggedNavigationId = null;
      return;
    }
    const cardTarget = event.target.closest("[data-card-shell]");
    if (cardTarget && state.draggedCard && cardTarget.dataset.navigationId === state.draggedCard.navigationId) {
      event.preventDefault();
      const navigation = findNavigation(state.draggedCard.navigationId);
      const from = navigation.blocks.findIndex((item) => item.id === state.draggedCard.cardId);
      const to = navigation.blocks.findIndex((item) => item.id === cardTarget.dataset.cardId);
      if (from >= 0 && to >= 0 && from !== to) {
        const [item] = navigation.blocks.splice(from, 1);
        navigation.blocks.splice(to, 0, item);
        scheduleSave();
        renderPortal({ panelName: navigation.id });
      }
      state.draggedCard = null;
    }
  });

  editorEntry?.addEventListener("click", () => enterEditor());
  document.querySelector("[data-add-navigation]")?.addEventListener("click", () => openNavigationDialog());
  document.querySelector("[data-add-card]")?.addEventListener("click", () => {
    const navigation = currentManagedNavigation();
    if (!navigation) return showToast("Open an editable navigation page before adding a block.");
    openCardDialog(navigation.id);
  });
  document.querySelector("[data-exit-editor]")?.addEventListener("click", () => exitEditor());
  document.querySelector("[data-preview-draft]")?.addEventListener("click", () => {
    state.isPreviewing = !state.isPreviewing;
    renderPortal();
  });
  document.querySelector("[data-publish-draft]")?.addEventListener("click", () => publishDraft());
  document.querySelector("[data-release-history]")?.addEventListener("click", () => openReleaseHistory());
  releaseList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-restore-release]");
    if (button) restoreRelease(button.dataset.restoreRelease, button);
  });
  document.querySelectorAll("[data-close-page-editor]").forEach((node) => node.addEventListener("click", closePageEditor));
  document.querySelector("[data-page-editor-preview]")?.addEventListener("click", () => {
    pageEditor.classList.toggle("is-previewing");
  });
  document.querySelectorAll("[data-add-rich-block]").forEach((node) => node.addEventListener("click", () => addRichBlock(node.dataset.addRichBlock)));

  async function initializeAdmin() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const tokenFromHash = hash.get("admin_token");
    if (tokenFromHash) {
      state.token = tokenFromHash;
      sessionStorage.setItem("portal-admin-token", tokenFromHash);
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
    if (localAdmin) state.isAdmin = true;
    else if (apiBase && state.token) {
      try {
        const response = await apiFetch("/v1/session");
        state.isAdmin = response.ok && (await response.json()).login?.toLowerCase() === "string020";
      } catch {
        state.isAdmin = false;
      }
    }
    editorEntry.hidden = !state.isAdmin;
    if (state.isAdmin && new URLSearchParams(location.search).get("edit") === "1") enterEditor();
  }

  initializeAdmin();
}
