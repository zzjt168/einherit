/* 电子继承 · 第八十四批增量（叠在 round83…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round84SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪状态冷静条 */
  async function paintHomeOkStatus() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkStatusBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkStatusBar";
      bar.className = "home-ok-status-bar";
      bar.setAttribute("role", "status");
      const ver = $("#homeVersionCalmBar");
      const en = $("#homeEnglishBrandBar");
      const domain = $("#homeDomainOnlyBar");
      if (ver && ver.parentNode === home)
        ver.insertAdjacentElement("afterend", bar);
      else if (en && en.parentNode === home)
        en.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = "服务 · " + okPart;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-status-mark">状态</span>
        <span class="muted home-ok-status-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkStatusGo">去设置</button>`;
      const btn = $("#homeOkStatusGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-status-mark">状态</span>
        <span class="muted home-ok-status-sub">就绪状态暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkStatusGo">去设置</button>`;
      const btn = $("#homeOkStatusGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+分类+备注组合复制 */
  async function ensureLegacyTitleCategoryNotesCopyButtons() {
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
      if (!it) return;
      const title = String(it.title || "").trim() || "未填标题";
      const cat = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = title + " · " + cat + " · " + notes;
      el.dataset.titleCategoryNotes = line;
      if (el.querySelector(".lg-copy-title-category-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-category-notes";
      btn.textContent = "复制标题分类备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategoryNotes || "");
        softBanner(ok ? "已复制标题分类备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘部门+标签+摘要组合复制 */
  async function ensureAssetDeptTagSummaryCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const tag = String(it.tag || "").trim() || "未填标签";
      const summary = String(it.summary || "").trim() || "未填摘要";
      const line = dept + " · " + tag + " · " + summary;
      el.dataset.deptTagSummary = line;
      if (el.querySelector(".as-copy-dept-tag-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dept-tag-summary";
      btn.textContent = "复制部门标签摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptTagSummary || "");
        softBanner(ok ? "已复制部门标签摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制可读倒计时文案 */
  async function ensureCheckinReadableCountdownPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinReadableCountdownPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinReadableCountdownPlainCopyCard";
      card.className = "checkin-readable-countdown-plain-copy";
      const hours = $("#checkinHoursSinceLastPlainCopyCard");
      const next = $("#checkinNextSuggestedPlainCopyCard");
      const last = $("#checkinLastAgoLabelPlainCopyCard");
      if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).readable || "").trim() ||
        "暂无可读倒计时";
      const line =
        "可读倒计时 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-readable-countdown-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinReadableCountdownPlainCopyBtn">复制可读倒计时文案</button>`;
      const btn = $("#checkinReadableCountdownPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制可读倒计时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">可读倒计时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅最新流水种类与金额组合复制 */
  async function ensureTravelKindAmountLatestCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelKindAmountLatestCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelKindAmountLatestCopyCard";
      card.className = "travel-kind-amount-latest-copy";
      const balMet = $("#travelBalanceMetPlainCopyCard");
      const shortThr = $("#travelShortfallThresholdCopyCard");
      const metProg = $("#travelMetProgressLabelCopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      const row = ledger[0] || {};
      const kind =
        String(row.kind_label || row.kind || "").trim() || "无流水";
      const amt =
        row.amount == null
          ? "—"
          : String(Math.round(Number(row.amount)));
      const combo = kind + " · " + amt;
      const line = "最新流水 · 金额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-kind-amount-latest-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelKindAmountLatestCopyBtn">复制最新流水种类金额</button>`;
      const btn = $("#travelKindAmountLatestCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制最新流水种类金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最新流水种类金额暂不可用</p>`;
    }
  }

  /* 6 · 善后探访偏好+预算+城市组合复制 */
  async function ensureAftercareVisitPrefBudgetCityCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim() || "未填偏好";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const city = String(it.city || "").trim() || "未填城市";
      const line = pref + " · " + budget + " · " + city;
      el.dataset.visitPrefBudgetCity = line;
      if (el.querySelector(".ac-copy-visit-pref-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-pref-budget-city";
      btn.textContent = "复制探访预算城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitPrefBudgetCity || "");
        softBanner(ok ? "已复制探访预算城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频进度与就绪组合复制 */
  async function ensureAuthProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressReadyCopyCard";
      card.className = "av-progress-ready-copy";
      const missing = $("#avMissingTextReadyCopyCard");
      const readyComp = $("#avReadyCompleteLabelCopyCard");
      const gateReady = $("#avGateReadyComboCopyCard");
      if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const p = data.progress || {};
      const done = p.done == null ? "—" : String(p.done);
      const total = p.total == null ? "—" : String(p.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = done + "/" + total + " · " + ready;
      const line = "授权视频进度 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressReadyCopyBtn">复制进度与就绪</button>`;
      const btn = $("#avProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+角色+口令组合复制 */
  async function ensureHeirIdRolePassphraseCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + role + " · " + phrase;
      if (el.querySelector(".bn-copy-id-role-passphrase")) return;
      el.dataset.idRolePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-role-passphrase";
      btn.textContent = "复制编号角色口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRolePassphrase || "");
        softBanner(ok ? "已复制编号角色口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册分享提示与品牌组合复制 */
  async function ensureHandoverShareHintBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handShareHintBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handShareHintBrandCopyCard";
      card.className = "hand-share-hint-brand-copy";
      const domBrand = $("#handDomainBrandCopyCard");
      const pctBrand = $("#handProgressPctBrandCopyCard");
      const exportBrand = $("#handExportPathBrandCopyCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (pctBrand && pctBrand.parentNode)
        pctBrand.insertAdjacentElement("afterend", card);
      else if (exportBrand && exportBrand.parentNode)
        exportBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = hint + " · " + brand;
      const line = "手册分享 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-share-hint-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handShareHintBrandCopyBtn">复制分享提示品牌</button>`;
      const btn = $("#handShareHintBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制分享提示品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">分享提示与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+就绪组合复制 + round 层含 84 */
  async function paintAppBrandEnOkR84CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appBrandEnOkR84CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appBrandEnOkR84CopyCard";
      card.className = "card app-brand-en-ok-r84-copy-card";
      const verEn = $("#versionBrandEnDomainR83CopyCard");
      const brandEn = $("#brandEnVersionOkR82CopyCard");
      const appOk = $("#appOkDomainR81CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + en + " · ok·" + okPart;
      card.innerHTML = `<h3>中英品牌 · 就绪</h3>
        <p class="muted">一键复制中英文品牌与就绪状态（演示级）。</p>
        <p class="app-brand-en-ok-r84-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appBrandEnOkR84CopyBtn">复制应用英文就绪</button>`;
      const btn = $("#appBrandEnOkR84CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用英文就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中英品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList84() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 84;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 84); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round84 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkStatus().catch(() => {}), 670);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleCategoryNotesCopyButtons().catch(() => {}),
      500
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDeptTagSummaryCopyButtons().catch(() => {}),
      500
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinReadableCountdownPlainCopy().catch(() => {}),
      490
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelKindAmountLatestCopy().catch(() => {}), 510);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitPrefBudgetCityCopyButtons().catch(() => {}),
      500
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressReadyCopy().catch(() => {}), 470);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRolePassphraseCopyButtons().catch(() => {}),
      500
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverShareHintBrandCopy().catch(() => {}), 510);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkStatus().catch(() => {}), 670);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleCategoryNotesCopyButtons().catch(() => {}),
        520
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDeptTagSummaryCopyButtons().catch(() => {}),
        510
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinReadableCountdownPlainCopy().catch(() => {}),
        510
      );
    if (id === "travel")
      setTimeout(() => ensureTravelKindAmountLatestCopy().catch(() => {}), 530);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitPrefBudgetCityCopyButtons().catch(() => {}),
        520
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthProgressReadyCopy().catch(() => {}), 490);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRolePassphraseCopyButtons().catch(() => {}),
        510
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverShareHintBrandCopy().catch(() => {}), 520);
    if (id === "settings") {
      setTimeout(() => {
        paintAppBrandEnOkR84CopyCard().catch(() => {});
        paintRoundLayerList84();
      }, 560);
      setTimeout(() => {
        paintAppBrandEnOkR84CopyCard().catch(() => {});
        paintRoundLayerList84();
      }, 1200);
    }
  };

  setTimeout(() => paintHomeOkStatus().catch(() => {}), 720);
  setTimeout(
    () => ensureLegacyTitleCategoryNotesCopyButtons().catch(() => {}),
    740
  );
  setTimeout(() => ensureAssetDeptTagSummaryCopyButtons().catch(() => {}), 760);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinReadableCountdownPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelKindAmountLatestCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitPrefBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRolePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverShareHintBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppBrandEnOkR84CopyCard().catch(() => {});
      paintRoundLayerList84();
    }, 580);
  }
})();
