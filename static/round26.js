/* 电子继承 · 第二十六批增量（叠在 round25…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const CLEAR_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "已勾清除" },
    { id: "0", label: "未勾清除" },
  ];
  let _lgClearFilter = "";
  const PRINT_GAP_HINT_KEY = "einherit_print_gap_hint";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round26SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 9000);
    return el;
  }

  async function copyText(str) {
    const text = String(str || "");
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  /* 1 · 首页备忘未处置缺口一句 */
  async function paintHomeDisposePending() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDisposePendingBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDisposePendingBar";
      bar.className = "home-dispose-pending-bar";
      bar.setAttribute("role", "status");
      const guard = $("#homeGuardProgressBar");
      const dual = $("#homeDualStatusBar");
      const icu = $("#homeIcuReadyBar");
      const ring = $("#homeDeptRing");
      if (guard && guard.parentNode === home) guard.insertAdjacentElement("afterend", bar);
      else if (dual && dual.parentNode === home) dual.insertAdjacentElement("afterend", bar);
      else if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (ring && ring.parentNode === home) ring.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const pending = await api("/api/assets/dispose-pending");
      const n = Number(pending.count || 0);
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span class="home-dispose-mark">备忘还可补</span>
        <span class="muted home-dispose-sub">还有 ${n} 条未选处置 · 按自己节奏即可</span>
        <button type="button" class="btn ghost sm" id="homeDisposeGo">去备忘</button>`;
      const btn = $("#homeDisposeGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("assets");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割按清除照片/聊天筛选 */
  function itemHasClearMedia(el) {
    const raw = el.dataset.clearMedia;
    if (raw === "1" || raw === "0") return raw;
    // fallback from tags / text
    const text = (el.textContent || "").toLowerCase();
    if (/清除照片|清除聊天|clear_photos|clear_chats/.test(text) && /已|✓|是/.test(text)) {
      return "1";
    }
    return "0";
  }

  function ensureClearMediaFilterBar() {
    let bar = $("#lgClearMediaChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "lgClearMediaChipBar";
    bar.className = "chip-row lg-clear-media-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按清除照片/聊天筛选");
    bar.innerHTML = CLEAR_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _lgClearFilter ? "active" : ""}" data-lgclear="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#lgList");
    const factory = $("#lgFactoryChipBar");
    const missClear = $("#lgMissingClearBar");
    const filter = $("#lgFilterBar") || $("#lgDeptFilter");
    if (factory && factory.parentNode) factory.insertAdjacentElement("afterend", bar);
    else if (missClear && missClear.parentNode) missClear.insertAdjacentElement("afterend", bar);
    else if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lgclear]");
      if (!btn) return;
      _lgClearFilter = btn.dataset.lgclear || "";
      $$("#lgClearMediaChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.lgclear || "") === _lgClearFilter)
      );
      applyClearMediaChipFilter();
    });
    return bar;
  }

  function applyClearMediaChipFilter() {
    ensureClearMediaFilterBar();
    const list = $("#lgList");
    if (!list) return;
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgClearFilter) {
        if (el.dataset.r26ClearHidden === "1") {
          el.hidden = false;
          delete el.dataset.r26ClearHidden;
        }
        return;
      }
      const val = itemHasClearMedia(el);
      const show = val === _lgClearFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r26ClearHidden = "1";
      } else if (el.dataset.r26ClearHidden === "1") {
        el.hidden = false;
        delete el.dataset.r26ClearHidden;
      }
    });
    let tip = $("#lgClearMediaChipTip");
    if (_lgClearFilter) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgClearMediaChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _lgClearFilter === "1"
            ? "这一筛选下暂时没有已勾清除照片/聊天的条目。"
            : "这一筛选下暂时没有未勾清除照片/聊天的条目。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintClearMediaChipFilter() {
    const list = $("#lgList");
    if (!list) return;
    ensureClearMediaFilterBar();
    try {
      const data = await api("/api/legacy");
      const byId = {};
      (data.items || []).forEach((it) => {
        byId[String(it.id)] = it;
      });
      $$("#lgList .item[data-id]").forEach((el) => {
        const it = byId[el.dataset.id];
        if (it) {
          const on = !!(it.clear_photos || it.clear_chats);
          el.dataset.clearMedia = on ? "1" : "0";
          el.dataset.clearPhotos = it.clear_photos ? "1" : "0";
          el.dataset.clearChats = it.clear_chats ? "1" : "0";
        }
      });
    } catch (_) {}
    applyClearMediaChipFilter();
  }

  /* 3 · 备忘「今日已看」一键 */
  async function ensureAssetSeenTodayButtons() {
    const list = $("#asList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/assets");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    const nodes = $$("#asList .item");
    nodes.forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (it && it.review_at) el.dataset.reviewAt = String(it.review_at);
      if (!el.dataset.id || el.querySelector(".as-seen-today")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-seen-today";
      const today = todayISO();
      const already = (el.dataset.reviewAt || "").slice(0, 10) === today;
      btn.textContent = already ? "今日已看" : "今日已看";
      if (already) btn.classList.add("as-seen-today-done");
      btn.onclick = async () => {
        try {
          await api("/api/assets/review-at", {
            method: "POST",
            body: JSON.stringify({ id: Number(el.dataset.id), review_at: todayISO() }),
          });
          el.dataset.reviewAt = todayISO();
          btn.classList.add("as-seen-today-done");
          softBanner("已标今日已看", "assets");
          toast("已标今日已看");
        } catch (e) {
          toast(e.message || "未完成");
        }
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制当前间隔说明 */
  function ensureCheckinIntervalCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const intervalInput = $("#intervalHours");
    if (!intervalInput) return;
    let card = $("#checkinIntervalCopyCard");
    const host = intervalInput.closest(".card") || box;
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalCopyCard";
      card.className = "checkin-interval-copy";
      const save = $("#saveInterval");
      if (save && save.parentNode) save.insertAdjacentElement("afterend", card);
      else host.appendChild(card);
    }
    const hours = Number(intervalInput.value || 24) || 24;
    const line = "每 " + hours + " 小时报备一次（电子继承 · 演示说明）";
    card.innerHTML = `<p class="muted checkin-interval-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="checkinIntervalCopyBtn">复制间隔说明</button>`;
    const btn = $("#checkinIntervalCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const h = Number(($("#intervalHours") && $("#intervalHours").value) || hours) || 24;
        const text = "每 " + h + " 小时报备一次（电子继承 · 演示说明）";
        const ok = await copyText(text);
        softBanner(ok ? "已复制间隔说明" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 差旅建议补足金额一键填 */
  async function ensureTravelShortfallFill() {
    const input = $("#travelAmt");
    if (!input || !input.parentNode) return;
    let row = $("#travelShortfallFill");
    try {
      const { fund } = await api("/api/travel-fund");
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const bal = Number(fund.balance || 0);
      const need = Math.max(0, Math.ceil(thr - bal));
      if (need <= 0) {
        if (row) row.remove();
        return;
      }
      if (!row) {
        row = document.createElement("div");
        row.id = "travelShortfallFill";
        row.className = "travel-shortfall-fill";
        const quick = $("#travelQuickAmts");
        if (quick && quick.parentNode) quick.insertAdjacentElement("afterend", row);
        else input.parentNode.insertBefore(row, input.nextSibling);
      }
      row.innerHTML = `<p class="muted">距建议门槛还差 <b>¥${need}</b>（只读对照，不改退款流程）。</p>
        <button type="button" class="btn ghost sm" id="travelFillShortfall">填入还差 ¥${need}</button>`;
      const btn = $("#travelFillShortfall");
      if (btn) {
        btn.onclick = () => {
          const field = $("#travelAmt");
          if (field) {
            field.value = String(need);
            field.dispatchEvent(new Event("input", { bubbles: true }));
          }
          softBanner("已填入建议补足金额 ¥" + need, "travel");
          toast("已填入 ¥" + need);
        };
      }
    } catch (_) {
      if (row) row.remove();
    }
  }

  /* 6 · 善后工单状态计数条 */
  async function paintAftercareStatusCounts() {
    const bar = $("#acStatusFilterBar");
    if (!bar) return;
    let countsEl = $("#acStatusCountsBar");
    if (!countsEl) {
      countsEl = document.createElement("div");
      countsEl.id = "acStatusCountsBar";
      countsEl.className = "ac-status-counts-bar";
      countsEl.setAttribute("role", "status");
      bar.insertAdjacentElement("afterend", countsEl);
    }
    try {
      const data = await api("/api/aftercare");
      const items = data.items || [];
      const counts = { pending_auth: 0, executable: 0, done: 0, other: 0 };
      items.forEach((it) => {
        const k = it.status_key || "";
        if (k === "pending_auth") counts.pending_auth += 1;
        else if (k === "executable" || k === "in_progress") counts.executable += 1;
        else if (k === "done" || k === "completed") counts.done += 1;
        else counts.other += 1;
      });
      countsEl.innerHTML = `<span class="muted">状态计数</span>
        <span class="tag">待授权 ${counts.pending_auth}</span>
        <span class="tag">可执行 ${counts.executable}</span>
        <span class="tag">已完成 ${counts.done}</span>
        ${
          counts.other
            ? `<span class="tag">其他 ${counts.other}</span>`
            : ""
        }
        <span class="muted">共 ${items.length} 单</span>`;
    } catch (_) {
      countsEl.innerHTML = `<span class="muted">状态计数暂不可用</span>`;
    }
  }

  /* 7 · 授权视频「去上传区」聚焦 */
  function ensureAuthUploadFocus() {
    const panel = $("#authvideo");
    if (!panel) return;
    const histCard =
      ($("#avList") && $("#avList").closest(".card")) || $("#avList");
    if (!histCard) return;
    let btn = $("#avFocusUploadBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "avFocusUploadBtn";
      btn.className = "btn ghost sm av-focus-upload";
      btn.textContent = "去上传区";
      const head = histCard.querySelector("h3");
      if (head && head.parentNode) {
        const wrap = document.createElement("div");
        wrap.className = "av-focus-upload-wrap";
        head.insertAdjacentElement("afterend", wrap);
        wrap.appendChild(btn);
      } else {
        histCard.insertBefore(btn, histCard.firstChild);
      }
    }
    btn.onclick = () => {
      const card = $("#avUploadCard");
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        card.classList.add("av-upload-focus");
        clearTimeout(card._focusT);
        card._focusT = setTimeout(() => card.classList.remove("av-upload-focus"), 1600);
      }
      const file = $("#avFile");
      if (file) {
        try {
          file.focus();
        } catch (_) {}
      }
      softBanner("已定位到上传区", "authvideo");
    };
  }

  /* 8 · 受益人缺联系方式温和角标 */
  async function paintHeirMissingContactBadges() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item");
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const contact = String(it.contact || "").trim();
      let badge = el.querySelector(".bn-missing-contact");
      if (contact) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag bn-missing-contact";
        badge.textContent = "待补联系";
        const strong = el.querySelector("strong");
        if (strong && strong.parentNode) strong.insertAdjacentElement("afterend", badge);
        else el.insertBefore(badge, el.firstChild);
      }
    });
  }

  /* 9 · 手册缺口 chip 跳转回显 */
  function consumePrintGapHint(panelId) {
    try {
      const raw = sessionStorage.getItem(PRINT_GAP_HINT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem(PRINT_GAP_HINT_KEY);
      if (!data || (data.go && data.go !== panelId)) return;
      const label = data.label || data.key || "缺口";
      softBanner("来自手册缺口 · " + label + " · 按自己节奏补即可", panelId || "home");
    } catch (_) {
      try {
        sessionStorage.removeItem(PRINT_GAP_HINT_KEY);
      } catch (_) {}
    }
  }

  function bindPrintGapChipHints() {
    const row = $("#handPrintGapChips");
    if (!row || row.dataset.r26gap) return;
    row.dataset.r26gap = "1";
    row.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest(".print-gap-chip, [data-print-gap]");
        if (!btn) return;
        const go = btn.dataset.go || "";
        const key = btn.dataset.printGap || "";
        const label = (btn.textContent || "").replace(/^去补/, "").trim() || key;
        try {
          sessionStorage.setItem(
            PRINT_GAP_HINT_KEY,
            JSON.stringify({ go: go, key: key, label: label })
          );
        } catch (_) {}
      },
      true
    );
  }

  /* 10 · 设置·一键复制数据体量摘要 + round 层含 26 */
  function paintCountsCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#countsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "countsCopyCard";
      card.className = "card counts-copy-card";
      const roundList = $("#roundLayerListCard");
      if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    card.innerHTML = `<h3>数据体量摘要</h3>
      <p class="muted">一键复制交割 / 备忘 / 受益人等条数（演示级，非云同步）。</p>
      <p class="counts-copy-preview muted" id="countsCopyPreview">加载中…</p>
      <button type="button" class="btn ghost sm" id="countsCopyBtn">复制摘要</button>`;
    api("/api/counts-summary")
      .then((data) => {
        const preview = $("#countsCopyPreview");
        const text = data.text || "";
        if (preview) preview.textContent = text || "暂无摘要";
        card.dataset.copyText = text;
      })
      .catch(() => {
        const preview = $("#countsCopyPreview");
        if (preview) preview.textContent = "摘要暂不可用";
      });
    const btn = $("#countsCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        let text = card.dataset.copyText || "";
        if (!text) {
          try {
            const data = await api("/api/counts-summary");
            text = data.text || "";
            card.dataset.copyText = text;
          } catch (_) {}
        }
        const ok = await copyText(text || "电子继承 · 暂无体量摘要");
        softBanner(ok ? "已复制数据体量摘要" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList26() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 26;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 26); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读）。</p>
      <p class="round-layer-summary"><strong>已加载</strong> round${
        loaded.length ? loaded[0] : "—"
      }…round${loaded.length ? loaded[loaded.length - 1] : "—"}
        · 共 ${loaded.length} 层</p>
      <div class="round-layer-chips" role="list">${loaded
        .map(
          (n) =>
            `<span class="tag round-layer-chip" role="listitem">round${n}</span>`
        )
        .join("")}</div>
      ${
        missing.length
          ? `<p class="muted" style="margin-top:8px">未检测到：${missing
              .map((n) => "round" + n)
              .join("、")}</p>`
          : `<p class="muted" style="margin-top:8px">round6…round26 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDisposePending().catch(() => {}), 80);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => paintClearMediaChipFilter().catch(() => {}), 50);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetSeenTodayButtons().catch(() => {}), 50);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(ensureCheckinIntervalCopy, 50);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallFill().catch(() => {}), 80);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => paintAftercareStatusCounts().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(ensureAuthUploadFocus, 40);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => paintHeirMissingContactBadges().catch(() => {}), 60);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(bindPrintGapChipHints, 80);
    setTimeout(bindPrintGapChipHints, 320);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeDisposePending().catch(() => {}), 100);
    if (id === "legacy") setTimeout(() => paintClearMediaChipFilter().catch(() => {}), 80);
    if (id === "assets") setTimeout(() => ensureAssetSeenTodayButtons().catch(() => {}), 60);
    if (id === "checkin") setTimeout(ensureCheckinIntervalCopy, 80);
    if (id === "travel") setTimeout(() => ensureTravelShortfallFill().catch(() => {}), 100);
    if (id === "aftercare") setTimeout(() => paintAftercareStatusCounts().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(ensureAuthUploadFocus, 60);
    if (id === "heirs") setTimeout(() => paintHeirMissingContactBadges().catch(() => {}), 80);
    if (id === "handover") {
      setTimeout(bindPrintGapChipHints, 100);
      setTimeout(bindPrintGapChipHints, 360);
    }
    if (id === "settings") {
      setTimeout(() => {
        paintCountsCopyCard();
        paintRoundLayerList26();
      }, 120);
      setTimeout(() => {
        paintCountsCopyCard();
        paintRoundLayerList26();
      }, 400);
    }
    // gap hint after navigation
    setTimeout(() => consumePrintGapHint(id), 140);
  };

  // Boot
  setTimeout(() => paintHomeDisposePending().catch(() => {}), 140);
  setTimeout(() => paintClearMediaChipFilter().catch(() => {}), 160);
  setTimeout(() => ensureAssetSeenTodayButtons().catch(() => {}), 180);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalCopy();
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallFill().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAftercareStatusCounts().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthUploadFocus();
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    paintHeirMissingContactBadges().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    bindPrintGapChipHints();
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintCountsCopyCard();
      paintRoundLayerList26();
    }, 140);
  }
})();
