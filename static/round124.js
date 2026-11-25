/* 电子继承 · 第一百二十四批增量（叠在 round123…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round124SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪版本英文冷静条 */
  async function paintHomeOkVersionBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkVersionBrandEnCalmBarR124");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkVersionBrandEnCalmBarR124";
      bar.className = "home-ok-version-brand-en-calm-bar-r124";
      bar.setAttribute("role", "status");
      const appDom = $("#homeAppDomainBrandEnCalmBarR123");
      const brandApp = $("#homeBrandEnAppDomainCalmBarR122");
      const verOk = $("#homeVersionOkDomainCalmBarR121");
      if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
      else if (brandApp && brandApp.parentNode === home)
        brandApp.insertAdjacentElement("afterend", bar);
      else if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ready + " · " + ver + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-brand-en-calm-bar-r124-mark">状态</span>
        <span class="muted home-ok-version-brand-en-calm-bar-r124-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionBrandEnCalmGoR124">去设置</button>`;
      const btn = $("#homeOkVersionBrandEnCalmGoR124");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-brand-en-calm-bar-r124-mark">状态</span>
        <span class="muted home-ok-version-brand-en-calm-bar-r124-sub">就绪版本英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionBrandEnCalmGoR124">去设置</button>`;
      const btn = $("#homeOkVersionBrandEnCalmGoR124");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割部门+分类+备注组合复制 */
  async function ensureLegacyDeptCategoryNotesCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const category = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = dept + " · " + category + " · " + notes;
      el.dataset.deptCategoryNotes = line;
      if (el.querySelector(".lg-copy-dept-category-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-category-notes";
      btn.textContent = "复制部门分类备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptCategoryNotes || "");
        softBanner(ok ? "已复制部门分类备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+提示+摘要组合复制 */
  async function ensureAssetIdHintSummaryCopyButtons() {
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
      if (!it || it.id == null) return;
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const summary = String(it.summary || "").trim() || "无摘要";
      const line = "#" + it.id + " · " + hint + " · " + summary;
      el.dataset.idHintSummary = line;
      if (el.querySelector(".as-copy-id-hint-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-hint-summary";
      btn.textContent = "复制编号提示摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idHintSummary || "");
        softBanner(ok ? "已复制编号提示摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次标签+间隔文案 */
  async function ensureCheckinNextLabelIntervalPlainR124Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextLabelIntervalPlainR124CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextLabelIntervalPlainR124CopyCard";
      card.className = "checkin-next-label-interval-plain-r124-copy";
      const graceHrs = $("#checkinGraceHoursRemainingPlainR123CopyCard");
      const interval = $("#checkinIntervalHoursAgoPlainR122CopyCard");
      const lastAgo = $("#checkinLastAgoReadablePlainR121CopyCard");
      if (graceHrs && graceHrs.parentNode)
        graceHrs.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const nextLabel = String(cd.next_suggested_label || "").trim() || "—";
      const intervalRaw = cd.interval_hours;
      const interval =
        intervalRaw == null || intervalRaw === ""
          ? "—"
          : String(Number(intervalRaw));
      const combo = nextLabel + " · " + interval;
      const line =
        "下次建议标签 · 间隔小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-label-interval-plain-r124-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextLabelIntervalPlainR124CopyBtn">复制下次标签间隔R124</button>`;
      const btn = $("#checkinNextLabelIntervalPlainR124CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次标签间隔R124" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次标签间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+余额+门槛组合复制 */
  async function ensureTravelShortfallBalanceThresholdPlainR124Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceThresholdPlainR124CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceThresholdPlainR124CopyCard";
      card.className = "travel-shortfall-balance-threshold-plain-r124-copy";
      const balThr = $("#travelBalanceThresholdMetPlainR123CopyCard");
      const thrPct = $("#travelThresholdPctMetPlainR122CopyCard");
      const shortMet = $("#travelShortfallMetPctPlainR121CopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
      else if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = short + " · " + bal + " · " + thr;
      const line =
        "差旅缺口 · 余额 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-threshold-plain-r124-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceThresholdPlainR124CopyBtn">复制缺口余额门槛</button>`;
      const btn = $("#travelShortfallBalanceThresholdPlainR124CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后拜访偏好+状态+城市组合复制 */
  async function ensureAftercareVisitStatusCityCopyButtons() {
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
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const status = String(it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = visit + " · " + status + " · " + city;
      el.dataset.visitStatusCity = line;
      if (el.querySelector(".ac-copy-visit-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-status-city";
      btn.textContent = "复制拜访状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitStatusCity || "");
        softBanner(ok ? "已复制拜访状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+清单+就绪组合复制 */
  async function ensureAuthCompleteChecklistReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteChecklistReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteChecklistReadyCopyCard";
      card.className = "av-complete-checklist-ready-copy";
      const missComp = $("#avMissingCompleteReadyCopyCard");
      const readyMiss = $("#avReadyMissingCompleteCopyCard");
      const completeReady = $("#avCompleteReadyChecklistCopyCard");
      if (missComp && missComp.parentNode)
        missComp.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = doneFlag + " · 清单 " + list.length + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-checklist-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteChecklistReadyCopyBtn">复制完成清单就绪</button>`;
      const btn = $("#avCompleteChecklistReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成清单就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成清单就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+关系+姓名组合复制 */
  async function ensureHeirPassphraseRelationNameCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = hint + " · " + relation + " · " + name;
      if (el.querySelector(".bn-copy-passphrase-relation-name")) return;
      el.dataset.passphraseRelationName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-relation-name";
      btn.textContent = "复制口令关系姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseRelationName || "");
        softBanner(ok ? "已复制口令关系姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数+品牌+条目数组合复制 */
  async function ensureHandoverTodosBrandItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodosBrandItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodosBrandItemCountCopyCard";
      card.className = "hand-todos-brand-item-count-copy";
      const brandDom = $("#handBrandDomainTodosCopyCard");
      const exportTodos = $("#handExportTodosDomainCopyCard");
      const domainItem = $("#handDomainItemCountTodosCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (exportTodos && exportTodos.parentNode)
        exportTodos.insertAdjacentElement("afterend", card);
      else if (domainItem && domainItem.parentNode)
        domainItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const brand = String(data.brand || "").trim() || "无品牌";
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : String(tcount);
      const combo = tcount + " · " + brand + " · " + ic;
      const line = "手册待办 · 品牌 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-todos-brand-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodosBrandItemCountCopyBtn">复制待办品牌条目</button>`;
      const btn = $("#handTodosBrandItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办品牌条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办品牌条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+版本+就绪+应用名组合复制 + round 层含 124 */
  async function paintBrandEnVersionOkAppR124CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnVersionOkAppR124CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnVersionOkAppR124CopyCard";
      card.className = "card brand-en-version-ok-app-r124-copy-card";
      const okVer = $("#okVersionDomainAppR123CopyCard");
      const appDom = $("#appDomainVersionOkR122CopyCard");
      const verApp = $("#versionAppDomainOkR121CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const line = en + " · " + ver + " · " + ready + " · " + app;
      card.innerHTML = `<h3>英文 · 版本 · 就绪 · 应用</h3>
        <p class="muted">一键复制英文品牌、版本、就绪状态与应用名（演示级）。</p>
        <p class="brand-en-version-ok-app-r124-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnVersionOkAppR124CopyBtn">复制英文版本就绪应用</button>`;
      const btn = $("#brandEnVersionOkAppR124CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文版本就绪应用" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 版本 · 就绪 · 应用</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList124() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 124;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 124); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round124 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeptCategoryNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdHintSummaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextLabelIntervalPlainR124Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallBalanceThresholdPlainR124Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitStatusCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteChecklistReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseRelationNameCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodosBrandItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeptCategoryNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdHintSummaryCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextLabelIntervalPlainR124Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallBalanceThresholdPlainR124Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitStatusCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteChecklistReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseRelationNameCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodosBrandItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionOkAppR124CopyCard().catch(() => {});
        paintRoundLayerList124();
      }, 710);
      setTimeout(() => {
        paintBrandEnVersionOkAppR124CopyCard().catch(() => {});
        paintRoundLayerList124();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyDeptCategoryNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetIdHintSummaryCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextLabelIntervalPlainR124Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceThresholdPlainR124Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteChecklistReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseRelationNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodosBrandItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionOkAppR124CopyCard().catch(() => {});
      paintRoundLayerList124();
    }, 730);
  }
})();
