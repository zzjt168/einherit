/* 电子继承 · 第一百零三批增量（叠在 round102…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round103SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪应用域名冷静条 */
  async function paintHomeOkAppDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkAppDomainCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkAppDomainCalmBar";
      bar.className = "home-ok-app-domain-calm-bar";
      bar.setAttribute("role", "status");
      const appBrand = $("#homeAppBrandEnOkCalmBar");
      const domBrand = $("#homeDomainBrandEnOkCalmBar");
      const okBrand = $("#homeOkBrandEnVersionCalmBar");
      if (appBrand && appBrand.parentNode === home)
        appBrand.insertAdjacentElement("afterend", bar);
      else if (domBrand && domBrand.parentNode === home)
        domBrand.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
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
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ready + " · " + app + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-app-domain-calm-mark">站点</span>
        <span class="muted home-ok-app-domain-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkAppDomainCalmGo">去设置</button>`;
      const btn = $("#homeOkAppDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-app-domain-calm-mark">站点</span>
        <span class="muted home-ok-app-domain-calm-sub">就绪应用域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkAppDomainCalmGo">去设置</button>`;
      const btn = $("#homeOkAppDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割动作+分类+备注组合复制 */
  async function ensureLegacyActionCategoryNotesCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填动作";
      const category = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = action + " · " + category + " · " + notes;
      el.dataset.actionCategoryNotes = line;
      if (el.querySelector(".lg-copy-action-category-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-category-notes";
      btn.textContent = "复制动作分类备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionCategoryNotes || "");
        softBanner(ok ? "已复制动作分类备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+标签+部门组合复制 */
  async function ensureAssetIdTagDeptCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + tag + " · " + dept;
      el.dataset.idTagDept = line;
      if (el.querySelector(".as-copy-id-tag-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-tag-dept";
      btn.textContent = "复制编号标签部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTagDept || "");
        softBanner(ok ? "已复制编号标签部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时说明 */
  async function ensureCheckinHoursRemainingPlainR103Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingPlainR103CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingPlainR103CopyCard";
      card.className = "checkin-hours-remaining-plain-r103-copy";
      const cdLabel = $("#checkinCountdownLabelPlainR102CopyCard");
      const ago = $("#checkinLastAgoLabelPlainR101CopyCard");
      const next = $("#checkinNextSuggestedLabelPlainR100CopyCard");
      if (cdLabel && cdLabel.parentNode)
        cdLabel.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).hours_remaining;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备剩余 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-plain-r103-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingPlainR103CopyBtn">复制剩余小时说明</button>`;
      const btn = $("#checkinHoursRemainingPlainR103CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制剩余小时说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余小时说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+缺口+门槛组合复制 */
  async function ensureTravelMetShortfallThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetShortfallThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetShortfallThresholdPlainCopyCard";
      card.className = "travel-met-shortfall-threshold-plain-copy";
      const thrBal = $("#travelThresholdBalancePctPlainCopyCard");
      const balShort = $("#travelBalanceShortfallMetPlainCopyCard");
      const shortMet = $("#travelShortfallThresholdMetPlainCopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + short + " · " + thr;
      const line =
        "差旅达标 · 缺口 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-shortfall-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetShortfallThresholdPlainCopyBtn">复制达标缺口门槛</button>`;
      const btn = $("#travelMetShortfallThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标缺口门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标缺口门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后预算+状态+标题组合复制 */
  async function ensureAftercareBudgetStatusTitleCopyButtons() {
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
      const budget =
        it.travel_budget == null
          ? "未填预算"
          : String(Math.round(Number(it.travel_budget)));
      const status = String(it.status || "").trim() || "未填状态";
      const title = String(it.title || "").trim() || "未填标题";
      const line = budget + " · " + status + " · " + title;
      el.dataset.budgetStatusTitle = line;
      if (el.querySelector(".ac-copy-budget-status-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-status-title";
      btn.textContent = "复制预算状态标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetStatusTitle || "");
        softBanner(ok ? "已复制预算状态标题" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本数+进度+就绪组合复制 */
  async function ensureAuthScriptProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptProgressReadyCopyCard";
      card.className = "av-script-progress-ready-copy";
      const readyGate = $("#avReadyGateProgressCopyCard");
      const complete = $("#avCompleteProgressReadyCopyCard");
      const gate = $("#avGateProgressReadyCopyCard");
      if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const scripts = Array.isArray(data.script) ? data.script : [];
      const count = scripts.length;
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo =
        "脚本 " + count + " · " + done + "/" + total + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-script-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptProgressReadyCopyBtn">复制脚本进度就绪</button>`;
      const btn = $("#avScriptProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制脚本进度就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本进度就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+口令提示+关系组合复制 */
  async function ensureHeirIdPassphraseRelationCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = "#" + it.id + " · " + phrase + " · " + relation;
      if (el.querySelector(".bn-copy-id-passphrase-relation")) return;
      el.dataset.idPassphraseRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-passphrase-relation";
      btn.textContent = "复制编号口令关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPassphraseRelation || "");
        softBanner(ok ? "已复制编号口令关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+条目数+品牌组合复制 */
  async function ensureHandoverProgressItemCountBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressItemCountBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressItemCountBrandCopyCard";
      card.className = "hand-progress-item-count-brand-copy";
      const brandDom = $("#handBrandDomainExportPathCopyCard");
      const domItem = $("#handDomainItemCountExportCopyCard");
      const brandItem = $("#handBrandItemCountExportCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else if (brandItem && brandItem.parentNode)
        brandItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct =
        prog.pct == null ? "—" : String(Math.round(Number(prog.pct))) + "%";
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = pct + " · " + count + " · " + brand;
      const line = "手册进度 · 条目 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-item-count-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressItemCountBrandCopyBtn">复制进度条目品牌</button>`;
      const btn = $("#handProgressItemCountBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度条目品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度条目品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+域名+英文品牌+版本组合复制 + round 层含 103 */
  async function paintOkDomainBrandEnVersionR103CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okDomainBrandEnVersionR103CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okDomainBrandEnVersionR103CopyCard";
      card.className = "card ok-domain-brand-en-version-r103-copy-card";
      const appOk = $("#appOkDomainVersionR102CopyCard");
      const brandOk = $("#brandEnOkVersionR101CopyCard");
      const appDom = $("#appDomainOkVersionR100CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = ready + " · " + domain + " · " + en + " · " + ver;
      card.innerHTML = `<h3>就绪 · 域名 · 英文品牌 · 版本</h3>
        <p class="muted">一键复制就绪状态、域名、英文品牌与版本（演示级）。</p>
        <p class="ok-domain-brand-en-version-r103-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okDomainBrandEnVersionR103CopyBtn">复制就绪域名英文版本</button>`;
      const btn = $("#okDomainBrandEnVersionR103CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 英文品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList103() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 103;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 103); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round103 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkAppDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionCategoryNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdTagDeptCopyButtons().catch(() => {}), 650);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingPlainR103Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetShortfallThresholdPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetStatusTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthScriptProgressReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdPassphraseRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressItemCountBrandCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkAppDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionCategoryNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdTagDeptCopyButtons().catch(() => {}), 660);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingPlainR103Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetShortfallThresholdPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetStatusTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthScriptProgressReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdPassphraseRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressItemCountBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainBrandEnVersionR103CopyCard().catch(() => {});
        paintRoundLayerList103();
      }, 710);
      setTimeout(() => {
        paintOkDomainBrandEnVersionR103CopyCard().catch(() => {});
        paintRoundLayerList103();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkAppDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyActionCategoryNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(() => ensureAssetIdTagDeptCopyButtons().catch(() => {}), 910);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingPlainR103Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetShortfallThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetStatusTitleCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPassphraseRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressItemCountBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainBrandEnVersionR103CopyCard().catch(() => {});
      paintRoundLayerList103();
    }, 730);
  }
})();
