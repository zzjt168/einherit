/* 电子继承 · 第三十一批增量（叠在 round30…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const REVIEW_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "有复习日" },
    { id: "0", label: "无复习日" },
  ];
  const NOTES_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "有备注" },
    { id: "0", label: "无备注" },
  ];
  let _asReviewFilter = "";
  let _acNotesFilter = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round31SoftBanner_" + (hostId || "home");
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

  function fmtMoneyLocal(n) {
    if (typeof fmtMoney === "function") return fmtMoney(n);
    const v = Number(n);
    if (Number.isNaN(v)) return String(n || "");
    return "¥" + v;
  }

  /* 1 · 首页备忘条数一句 */
  async function paintHomeAssetsCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAssetsCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAssetsCountBar";
      bar.className = "home-assets-count-bar";
      bar.setAttribute("role", "status");
      const lg = $("#homeLegacyCountBar");
      const ex = $("#homeExecutorReadyBar");
      if (lg && lg.parentNode === home) lg.insertAdjacentElement("afterend", bar);
      else if (ex && ex.parentNode === home) ex.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      let n = 0;
      try {
        const summary = await api("/api/counts-summary");
        n = Number((summary.counts || {}).assets || 0);
      } catch (_) {
        const data = await api("/api/assets");
        n = (data.items || []).length;
      }
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-as-mark">备忘</span>
          <span class="muted home-as-sub">可先记一笔平台 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeAssetsGo">去备忘</button>`;
      } else {
        bar.innerHTML = `<span class="home-as-mark">备忘条目</span>
          <span class="muted home-as-sub">已有 ${n} 条 · 可随时补</span>
          <button type="button" class="btn ghost sm" id="homeAssetsGo">去备忘</button>`;
      }
      const btn = $("#homeAssetsGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("assets");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割处置动作一键复制 */
  async function ensureLegacyActionCopyButtons() {
    const list = $("#lgList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/legacy");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const action = it ? String(it.action || "").trim() : "";
      if (it) el.dataset.action = action;
      if (!action || el.querySelector(".lg-copy-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action";
      btn.textContent = "复制处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.action || "处置");
        softBanner(ok ? "已复制交割处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘按有无复习日筛选 */
  function ensureReviewFilterBar() {
    let bar = $("#asReviewChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "asReviewChipBar";
    bar.className = "chip-row as-review-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按有无复习日筛选");
    bar.innerHTML = REVIEW_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _asReviewFilter ? "active" : ""}" data-asreview="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#asList");
    const tags = $("#asTagCountsBar");
    const draft = $("#asDraftChipBar");
    if (tags && tags.parentNode) tags.insertAdjacentElement("afterend", bar);
    else if (draft && draft.parentNode) draft.insertAdjacentElement("afterend", bar);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-asreview]");
      if (!btn) return;
      _asReviewFilter = btn.dataset.asreview || "";
      $$("#asReviewChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.asreview || "") === _asReviewFilter)
      );
      applyReviewChipFilter();
    });
    return bar;
  }

  function applyReviewChipFilter() {
    ensureReviewFilterBar();
    const list = $("#asList");
    if (!list) return;
    $$("#asList .item[data-id]").forEach((el) => {
      if (!_asReviewFilter) {
        if (el.dataset.r31ReviewHidden === "1") {
          el.hidden = false;
          delete el.dataset.r31ReviewHidden;
        }
        return;
      }
      const val = el.dataset.hasReview || "0";
      const show = val === _asReviewFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r31ReviewHidden = "1";
      } else if (el.dataset.r31ReviewHidden === "1") {
        el.hidden = false;
        delete el.dataset.r31ReviewHidden;
      }
    });
    let tip = $("#asReviewChipTip");
    if (_asReviewFilter) {
      const visible = $$("#asList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "asReviewChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _asReviewFilter === "1"
            ? "这一筛选下暂时没有已设复习日的备忘。"
            : "这一筛选下暂时没有未设复习日的备忘。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintReviewChipFilter() {
    const list = $("#asList");
    if (!list) return;
    ensureReviewFilterBar();
    try {
      const data = await api("/api/assets");
      const byId = {};
      (data.items || []).forEach((it) => {
        byId[String(it.id)] = it;
      });
      $$("#asList .item").forEach((el, i) => {
        const it = (el.dataset.id && byId[el.dataset.id]) || (data.items || [])[i];
        if (it && it.id != null) el.dataset.id = String(it.id);
        if (it) el.dataset.hasReview = String(it.review_at || "").trim() ? "1" : "0";
      });
    } catch (_) {}
    applyReviewChipFilter();
  }

  /* 4 · 报备页复制会员开通状态 */
  async function ensureCheckinMemberCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberCopyCard";
      card.className = "checkin-member-copy";
      const backup = $("#checkinBackupCopyCard");
      const ex = $("#checkinExecutorCopyCard");
      if (backup && backup.parentNode) backup.insertAdjacentElement("afterend", card);
      else if (ex && ex.parentNode) ex.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    try {
      const st = await api("/api/checkin/status");
      const user = st.user || {};
      const on = !!user.is_member;
      const line = on
        ? "会员已开通（电子继承 · 演示状态）"
        : "会员未开通（电子继承 · 演示状态）";
      card.innerHTML = `<p class="muted checkin-member-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberCopyBtn">复制会员状态</button>`;
      const btn = $("#checkinMemberCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制会员开通状态" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅复制最近一笔流水摘要 */
  async function ensureTravelLedgerCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerCopyCard";
      card.className = "travel-ledger-copy";
      const count = $("#travelLedgerCountBar");
      const ago = $("#travelLedgerLatestAgo");
      if (count && count.parentNode) count.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode) ago.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      if (!ledger.length) {
        card.innerHTML = `<p class="muted">尚无流水可复制</p>`;
        return;
      }
      const top = ledger[0];
      const kind = top.kind || top.note || "流水";
      const amt = fmtMoneyLocal(top.amount);
      const line = "最近流水 · " + kind + " · " + amt + "（电子继承 · 演示）";
      card.innerHTML = `<p class="muted travel-ledger-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerCopyBtn">复制最近流水摘要</button>`;
      const btn = $("#travelLedgerCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制最近流水摘要" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水摘要暂不可用</p>`;
    }
  }

  /* 6 · 善后按有无备注筛选 */
  function ensureAcNotesFilterBar() {
    let bar = $("#acNotesChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "acNotesChipBar";
    bar.className = "chip-row ac-notes-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按有无备注筛选");
    bar.innerHTML = NOTES_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _acNotesFilter ? "active" : ""}" data-acnotes="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#acList");
    const svc = $("#acServiceCountsBar");
    const status = $("#acStatusCountsBar");
    if (svc && svc.parentNode) svc.insertAdjacentElement("afterend", bar);
    else if (status && status.parentNode) status.insertAdjacentElement("afterend", bar);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-acnotes]");
      if (!btn) return;
      _acNotesFilter = btn.dataset.acnotes || "";
      $$("#acNotesChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.acnotes || "") === _acNotesFilter)
      );
      applyAcNotesChipFilter();
    });
    return bar;
  }

  function applyAcNotesChipFilter() {
    ensureAcNotesFilterBar();
    const list = $("#acList");
    if (!list) return;
    $$("#acList .item").forEach((el) => {
      if (!_acNotesFilter) {
        if (el.dataset.r31NotesHidden === "1") {
          el.hidden = false;
          delete el.dataset.r31NotesHidden;
        }
        return;
      }
      const val = el.dataset.hasNotes || "0";
      const show = val === _acNotesFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r31NotesHidden = "1";
      } else if (el.dataset.r31NotesHidden === "1") {
        el.hidden = false;
        delete el.dataset.r31NotesHidden;
      }
    });
    let tip = $("#acNotesChipTip");
    if (_acNotesFilter) {
      const visible = $$("#acList .item").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "acNotesChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _acNotesFilter === "1"
            ? "这一筛选下暂时没有带备注的工单。"
            : "这一筛选下暂时没有无备注的工单。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintAcNotesChipFilter() {
    const list = $("#acList");
    if (!list) return;
    ensureAcNotesFilterBar();
    try {
      const data = await api("/api/aftercare");
      const items = data.items || [];
      $$("#acList .item").forEach((el, i) => {
        const it = items[i];
        if (!it) return;
        if (it.id != null) el.dataset.id = String(it.id);
        el.dataset.hasNotes = String(it.notes || "").trim() ? "1" : "0";
      });
    } catch (_) {}
    applyAcNotesChipFilter();
  }

  /* 7 · 授权视频历史上传条数 */
  async function paintAuthHistoryCount() {
    const panel = $("#authvideo");
    if (!panel) return;
    let bar = $("#avHistoryCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avHistoryCountBar";
      bar.className = "muted av-history-count";
      bar.setAttribute("role", "status");
      const active = $("#avActiveNameCopyCard");
      const pct = $("#avGatePercentBar");
      if (active && active.parentNode) active.insertAdjacentElement("afterend", bar);
      else if (pct && pct.parentNode) pct.insertAdjacentElement("afterend", bar);
      else {
        const list = $("#avList");
        if (list) list.insertAdjacentElement("beforebegin", bar);
        else panel.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/auth-video");
      const n = (st.items || []).length;
      bar.textContent = "历史上传共 " + n + " 条 · 只读";
    } catch (_) {
      bar.textContent = "历史上传条数暂不可用";
    }
  }

  /* 8 · 受益人联系方式一键复制 */
  async function ensureHeirContactCopyButtons() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const contact = String(it.contact || "").trim();
      el.dataset.contact = contact;
      let btn = el.querySelector(".bn-copy-contact");
      if (!contact) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact";
      btn.textContent = "复制联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contact || "");
        softBanner(ok ? "已复制联系方式" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌域名一键复制 */
  async function ensureHandoverBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandCopyCard";
      card.className = "hand-brand-copy";
      const todo = $("#handTodoCountBar");
      const ex = $("#handExecutorCopyCard");
      if (todo && todo.parentNode) todo.insertAdjacentElement("afterend", card);
      else if (ex && ex.parentNode) ex.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "电子继承 App").trim();
      const domain = String(data.domain || "einherit.cn").trim();
      const line = brand + " · " + domain;
      card.innerHTML = `<p class="muted hand-brand-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handBrandCopyBtn">复制品牌域名</button>`;
      const btn = $("#handBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制手册品牌域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制隐私页路径 + round 层含 31 */
  function paintPrivacyPathCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#privacyPathCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "privacyPathCopyCard";
      card.className = "card privacy-path-copy-card";
      const range = $("#roundRangeCopyCard");
      const today = $("#todayStatusCopyCard");
      const roundList = $("#roundLayerListCard");
      if (range && range.parentNode) range.insertAdjacentElement("beforebegin", card);
      else if (today && today.parentNode) today.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    const line = "电子继承 App · 隐私说明 · /privacy.html · einherit.cn";
    card.innerHTML = `<h3>隐私页路径</h3>
      <p class="muted">一键复制隐私说明路径（演示级）。</p>
      <p class="privacy-path-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="privacyPathCopyBtn">复制隐私页路径</button>`;
    const btn = $("#privacyPathCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制隐私页路径" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList31() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 31;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 31); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round31 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAssetsCount().catch(() => {}), 130);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyActionCopyButtons().catch(() => {}), 70);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => paintReviewChipFilter().catch(() => {}), 70);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberCopy().catch(() => {}), 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerCopy().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => paintAcNotesChipFilter().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthHistoryCount().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirContactCopyButtons().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBrandCopy().catch(() => {}), 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeAssetsCount().catch(() => {}), 140);
    if (id === "legacy") setTimeout(() => ensureLegacyActionCopyButtons().catch(() => {}), 90);
    if (id === "assets") setTimeout(() => paintReviewChipFilter().catch(() => {}), 80);
    if (id === "checkin") setTimeout(() => ensureCheckinMemberCopy().catch(() => {}), 90);
    if (id === "travel") setTimeout(() => ensureTravelLedgerCopy().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => paintAcNotesChipFilter().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => paintAuthHistoryCount().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => ensureHeirContactCopyButtons().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => ensureHandoverBrandCopy().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintPrivacyPathCopyCard();
        paintRoundLayerList31();
      }, 140);
      setTimeout(() => {
        paintPrivacyPathCopyCard();
        paintRoundLayerList31();
      }, 460);
    }
  };

  // Boot
  setTimeout(() => paintHomeAssetsCount().catch(() => {}), 190);
  setTimeout(() => ensureLegacyActionCopyButtons().catch(() => {}), 210);
  setTimeout(() => paintReviewChipFilter().catch(() => {}), 230);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAcNotesChipFilter().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthHistoryCount().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintPrivacyPathCopyCard();
      paintRoundLayerList31();
    }, 160);
  }
})();
