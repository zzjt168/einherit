/* 电子继承 · 第七十九批增量（叠在 round78…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round79SoftBanner_" + (hostId || "home");
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

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
  }

  function yn(v) {
    return truthyFlag(v) ? "是" : "否";
  }

  function collectRoundLayers() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    return Array.from(new Set(found)).sort((a, b) => a - b);
  }

  function escalationLabel(raw) {
    const s = String(raw || "").trim().toLowerCase();
    if (!s || s === "ok" || s === "normal") return "平静";
    if (s === "soft" || s === "soft_overdue" || s.indexOf("soft") >= 0)
      return "可留意";
    if (s === "hard" || s === "overdue" || s.indexOf("hard") >= 0)
      return "需关注";
    return String(raw);
  }

  /* 1 · 首页升级状态冷静条 */
  async function paintHomeEscalationState() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeEscalationStateBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeEscalationStateBar";
      bar.className = "home-escalation-state-bar";
      bar.setAttribute("role", "status");
      const brand = $("#homeBrandDomainBar");
      const name = $("#homeNameBar");
      const until = $("#homeMemberUntilBar");
      if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else if (name && name.parentNode === home)
        name.insertAdjacentElement("afterend", bar);
      else if (until && until.parentNode === home)
        until.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const u = st.user || {};
      const raw = u.escalation_state;
      const label = escalationLabel(raw);
      const sub = "升级状态 · " + label;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-escalation-state-mark">节奏</span>
        <span class="muted home-escalation-state-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeEscalationStateGo">去报备</button>`;
      const btn = $("#homeEscalationStateGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-escalation-state-mark">节奏</span>
        <span class="muted home-escalation-state-sub">升级状态暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeEscalationStateGo">去报备</button>`;
      const btn = $("#homeEscalationStateGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+备注组合复制 */
  async function ensureLegacyIdTitleNotesCopyButtons() {
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
      if (!it || it.id == null) return;
      const title = String(it.title || "").trim() || "未填标题";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + title + " · " + notes;
      el.dataset.idTitleNotes = line;
      if (el.querySelector(".lg-copy-id-title-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-notes";
      btn.textContent = "复制编号标题备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleNotes || "");
        softBanner(ok ? "已复制编号标题备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+处置+标签组合复制 */
  async function ensureAssetSummaryDisposeTagCopyButtons() {
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
    $$("#asList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const summary = String(it.summary || "").trim() || "未填摘要";
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = summary + " · " + dispose + " · " + tag;
      el.dataset.summaryDisposeTag = line;
      if (el.querySelector(".as-copy-summary-dispose-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-dispose-tag";
      btn.textContent = "复制摘要处置标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryDisposeTag || "");
        softBanner(ok ? "已复制摘要处置标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制软逾期布尔 */
  async function ensureCheckinSoftOverduePlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSoftOverduePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSoftOverduePlainCopyCard";
      card.className = "checkin-soft-overdue-plain-copy";
      const due = $("#checkinDueSoonPlainCopyCard");
      const hours = $("#checkinHoursRemainingPlainCopyCard");
      const hint = $("#checkinMemberGentleHintPlainCopyCard");
      if (due && due.parentNode) due.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (hint && hint.parentNode)
        hint.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const soft = yn((st.user || {}).checkin_soft_overdue);
      const combo = "软逾期·" + soft;
      const line =
        "报备软逾期 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-soft-overdue-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSoftOverduePlainCopyBtn">复制软逾期布尔</button>`;
      const btn = $("#checkinSoftOverduePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制软逾期布尔" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">软逾期状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+门槛+金额组合复制 */
  async function ensureTravelMetThresholdAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetThresholdAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetThresholdAmountCopyCard";
      card.className = "travel-met-threshold-amount-copy";
      const shortBal = $("#travelShortfallBalanceCopyCard");
      const amtKind = $("#travelRefundAmountKindCopyCard");
      const ledger = $("#travelLedgerIdAmountCopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (amtKind && amtKind.parentNode)
        amtKind.insertAdjacentElement("afterend", card);
      else if (ledger && ledger.parentNode)
        ledger.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = met + " · " + thr + " · " + bal;
      const line = "差旅达标 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-threshold-amount-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetThresholdAmountCopyBtn">复制达标门槛金额</button>`;
      const btn = $("#travelMetThresholdAmountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标门槛金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标门槛金额暂不可用</p>`;
    }
  }

  /* 6 · 善后备注+状态+城市组合复制 */
  async function ensureAftercareNotesStatusCityCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#acList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it) return;
      const notes = String(it.notes || "").trim() || "无备注";
      const status = String(it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = notes + " · " + status + " · " + city;
      el.dataset.notesStatusCity = line;
      if (el.querySelector(".ac-copy-notes-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-notes-status-city";
      btn.textContent = "复制备注状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesStatusCity || "");
        softBanner(ok ? "已复制备注状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频进度完成/总数组合复制 */
  async function ensureAuthProgressDoneTotalCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressDoneTotalCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressDoneTotalCopyCard";
      card.className = "av-progress-done-total-copy";
      const gate = $("#avGateCompleteLabelCopyCard");
      const active = $("#avActiveLabelReadyCopyCard");
      const checklist = $("#avChecklistCountReadyCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const p = data.progress || {};
      const done = p.done == null ? "—" : String(p.done);
      const total = p.total == null ? "—" : String(p.total);
      const combo = done + "/" + total;
      const line = "授权视频进度 · " + combo;
      card.innerHTML = `<p class="muted av-progress-done-total-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressDoneTotalCopyBtn">复制进度完成总数</button>`;
      const btn = $("#avProgressDoneTotalCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成总数" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成总数暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+口令组合复制 */
  async function ensureHeirIdNamePassphraseCopyButtons() {
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
      if (!it || it.id == null) return;
      const name = String(it.name || "").trim() || "未填姓名";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + name + " · " + phrase;
      if (el.querySelector(".bn-copy-id-name-passphrase")) return;
      el.dataset.idNamePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-passphrase";
      btn.textContent = "复制编号姓名口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNamePassphrase || "");
        softBanner(ok ? "已复制编号姓名口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数与品牌组合复制 */
  async function ensureHandoverTodoCountBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodoCountBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodoCountBrandCopyCard";
      card.className = "hand-todo-count-brand-copy";
      const exportDom = $("#handExportPathDomainCopyCard");
      const memberBrand = $("#handMemberBrandCopyCard");
      const pctDom = $("#handPctDomainCopyCard");
      if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (memberBrand && memberBrand.parentNode)
        memberBrand.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todos = data.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = count + " · " + brand;
      const line = "手册待办 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-todo-count-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodoCountBrandCopyBtn">复制待办数与品牌</button>`;
      const btn = $("#handTodoCountBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办数与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办数与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+就绪+域名组合复制 + round 层含 79 */
  async function paintVersionOkDomainR79CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionOkDomainR79CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionOkDomainR79CopyCard";
      card.className = "card version-ok-domain-r79-copy-card";
      const okApp = $("#okAppBrandEnR78CopyCard");
      const verDom = $("#appVersionDomainR77CopyCard");
      const serverEn = $("#serverBrandEnR76CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (serverEn && serverEn.parentNode)
        serverEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · ok·" + okPart + " · " + domain;
      card.innerHTML = `<h3>版本 · 就绪 · 域名</h3>
        <p class="muted">一键复制版本、就绪状态与域名（演示级）。</p>
        <p class="version-ok-domain-r79-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionOkDomainR79CopyBtn">复制版本就绪域名</button>`;
      const btn = $("#versionOkDomainR79CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList79() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 79;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 79); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round79 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeEscalationState().catch(() => {}), 620);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleNotesCopyButtons().catch(() => {}),
      450
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryDisposeTagCopyButtons().catch(() => {}),
      450
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinSoftOverduePlainCopy().catch(() => {}), 440);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMetThresholdAmountCopy().catch(() => {}), 460);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareNotesStatusCityCopyButtons().catch(() => {}),
      450
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressDoneTotalCopy().catch(() => {}), 420);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNamePassphraseCopyButtons().catch(() => {}),
      450
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverTodoCountBrandCopy().catch(() => {}), 460);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeEscalationState().catch(() => {}), 620);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleNotesCopyButtons().catch(() => {}),
        470
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryDisposeTagCopyButtons().catch(() => {}),
        460
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinSoftOverduePlainCopy().catch(() => {}), 460);
    if (id === "travel")
      setTimeout(() => ensureTravelMetThresholdAmountCopy().catch(() => {}), 480);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareNotesStatusCityCopyButtons().catch(() => {}),
        470
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthProgressDoneTotalCopy().catch(() => {}), 440);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNamePassphraseCopyButtons().catch(() => {}),
        460
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverTodoCountBrandCopy().catch(() => {}), 470);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkDomainR79CopyCard().catch(() => {});
        paintRoundLayerList79();
      }, 510);
      setTimeout(() => {
        paintVersionOkDomainR79CopyCard().catch(() => {});
        paintRoundLayerList79();
      }, 1100);
    }
  };

  setTimeout(() => paintHomeEscalationState().catch(() => {}), 670);
  setTimeout(() => ensureLegacyIdTitleNotesCopyButtons().catch(() => {}), 690);
  setTimeout(
    () => ensureAssetSummaryDisposeTagCopyButtons().catch(() => {}),
    710
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSoftOverduePlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetThresholdAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareNotesStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressDoneTotalCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNamePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodoCountBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkDomainR79CopyCard().catch(() => {});
      paintRoundLayerList79();
    }, 530);
  }
})();
