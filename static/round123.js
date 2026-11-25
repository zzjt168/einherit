/* 电子继承 · 第一百二十三批增量（叠在 round122…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round123SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用域名英文冷静条 */
  async function paintHomeAppDomainBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppDomainBrandEnCalmBarR123");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppDomainBrandEnCalmBarR123";
      bar.className = "home-app-domain-brand-en-calm-bar-r123";
      bar.setAttribute("role", "status");
      const brandApp = $("#homeBrandEnAppDomainCalmBarR122");
      const verOk = $("#homeVersionOkDomainCalmBarR121");
      const domainBar = $("#homeDomainBrandEnVersionCalmBarR120");
      if (brandApp && brandApp.parentNode === home)
        brandApp.insertAdjacentElement("afterend", bar);
      else if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (domainBar && domainBar.parentNode === home)
        domainBar.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = app + " · " + domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-domain-brand-en-calm-bar-r123-mark">应用</span>
        <span class="muted home-app-domain-brand-en-calm-bar-r123-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppDomainBrandEnCalmGoR123">去设置</button>`;
      const btn = $("#homeAppDomainBrandEnCalmGoR123");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-domain-brand-en-calm-bar-r123-mark">应用</span>
        <span class="muted home-app-domain-brand-en-calm-bar-r123-sub">应用域名英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppDomainBrandEnCalmGoR123">去设置</button>`;
      const btn = $("#homeAppDomainBrandEnCalmGoR123");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+动作+标题组合复制 */
  async function ensureLegacyIdActionTitleCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填动作";
      const title = String(it.title || "").trim() || "未填标题";
      const line = "#" + it.id + " · " + action + " · " + title;
      el.dataset.idActionTitle = line;
      if (el.querySelector(".lg-copy-id-action-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-action-title";
      btn.textContent = "复制编号动作标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idActionTitle || "");
        softBanner(ok ? "已复制编号动作标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要+可见度组合复制 */
  async function ensureAssetPlatformSummaryVisibilityCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const summary = String(it.summary || "").trim() || "无摘要";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = platform + " · " + summary + " · " + vis;
      el.dataset.platformSummaryVisibility = line;
      if (el.querySelector(".as-copy-platform-summary-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary-visibility";
      btn.textContent = "复制平台摘要可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformSummaryVisibility || "");
        softBanner(ok ? "已复制平台摘要可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限+剩余小时文案 */
  async function ensureCheckinGraceHoursRemainingPlainR123Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursRemainingPlainR123CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursRemainingPlainR123CopyCard";
      card.className = "checkin-grace-hours-remaining-plain-r123-copy";
      const interval = $("#checkinIntervalHoursAgoPlainR122CopyCard");
      const lastAgo = $("#checkinLastAgoReadablePlainR121CopyCard");
      const hrs = $("#checkinHoursRemainingReadablePlainR120CopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else if (hrs && hrs.parentNode)
        hrs.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const graceRaw =
        cd.grace_hours != null ? cd.grace_hours : (st.user || {}).grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Number(graceRaw));
      const hrsRaw = cd.hours_remaining;
      const hrs =
        hrsRaw == null || hrsRaw === ""
          ? "—"
          : String(Math.round(Number(hrsRaw) * 10) / 10);
      const combo = grace + " · " + hrs;
      const line =
        "宽限小时 · 剩余小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-remaining-plain-r123-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursRemainingPlainR123CopyBtn">复制宽限剩余小时R123</button>`;
      const btn = $("#checkinGraceHoursRemainingPlainR123CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制宽限剩余小时R123" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限剩余小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+达标组合复制 */
  async function ensureTravelBalanceThresholdMetPlainR123Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdMetPlainR123CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdMetPlainR123CopyCard";
      card.className = "travel-balance-threshold-met-plain-r123-copy";
      const thrPct = $("#travelThresholdPctMetPlainR122CopyCard");
      const shortMet = $("#travelShortfallMetPctPlainR121CopyCard");
      const pctMet = $("#travelPctMetBalancePlainR120CopyCard");
      if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
      else if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const combo = bal + " · " + thr + " · " + met;
      const line =
        "差旅余额 · 门槛 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-met-plain-r123-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdMetPlainR123CopyBtn">复制余额门槛达标</button>`;
      const btn = $("#travelBalanceThresholdMetPlainR123CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+状态+预算组合复制 */
  async function ensureAftercareServiceStatusBudgetCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status = String(it.status || "").trim() || "未填状态";
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const line = service + " · " + status + " · " + budget;
      el.dataset.serviceStatusBudget = line;
      if (el.querySelector(".ac-copy-service-status-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-status-budget";
      btn.textContent = "复制服务状态预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceStatusBudget || "");
        softBanner(ok ? "已复制服务状态预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失+完成+就绪组合复制 */
  async function ensureAuthMissingCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCompleteReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCompleteReadyCopyCard";
      card.className = "av-missing-complete-ready-copy";
      const readyMiss = $("#avReadyMissingCompleteCopyCard");
      const completeReady = $("#avCompleteReadyChecklistCopyCard");
      const readyComp = $("#avReadyCompleteChecklistCopyCard");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo =
        "缺失 " + missing.length + " · " + doneFlag + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-complete-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCompleteReadyCopyBtn">复制缺失完成就绪</button>`;
      const btn = $("#avMissingCompleteReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系+角色组合复制 */
  async function ensureHeirNameContactRoleCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const role = String(it.role || "").trim() || "未填角色";
      const line = name + " · " + contact + " · " + role;
      if (el.querySelector(".bn-copy-name-contact-role")) return;
      el.dataset.nameContactRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-role";
      btn.textContent = "复制姓名联系角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactRole || "");
        softBanner(ok ? "已复制姓名联系角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+待办数组合复制 */
  async function ensureHandoverBrandDomainTodosCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainTodosCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainTodosCopyCard";
      card.className = "hand-brand-domain-todos-copy";
      const exportTodos = $("#handExportTodosDomainCopyCard");
      const domainItem = $("#handDomainItemCountTodosCopyCard");
      const itemTodos = $("#handItemCountTodosDomainCopyCard");
      if (exportTodos && exportTodos.parentNode)
        exportTodos.insertAdjacentElement("afterend", card);
      else if (domainItem && domainItem.parentNode)
        domainItem.insertAdjacentElement("afterend", card);
      else if (itemTodos && itemTodos.parentNode)
        itemTodos.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "无品牌";
      const domain = String(data.domain || "").trim() || "无域名";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const combo = brand + " · " + domain + " · " + tcount;
      const line = "手册品牌 · 域名 · 待办 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-todos-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainTodosCopyBtn">复制品牌域名待办</button>`;
      const btn = $("#handBrandDomainTodosCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌域名待办" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名待办暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+版本+域名+应用名组合复制 + round 层含 123 */
  async function paintOkVersionDomainAppR123CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okVersionDomainAppR123CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okVersionDomainAppR123CopyCard";
      card.className = "card ok-version-domain-app-r123-copy-card";
      const appDom = $("#appDomainVersionOkR122CopyCard");
      const verApp = $("#versionAppDomainOkR121CopyCard");
      const domVer = $("#domainVersionAppOkR120CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const line = ready + " · " + ver + " · " + domain + " · " + app;
      card.innerHTML = `<h3>就绪 · 版本 · 域名 · 应用</h3>
        <p class="muted">一键复制就绪状态、版本、域名与应用名（演示级）。</p>
        <p class="ok-version-domain-app-r123-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okVersionDomainAppR123CopyBtn">复制就绪版本域名应用</button>`;
      const btn = $("#okVersionDomainAppR123CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本域名应用" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 域名 · 应用</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList123() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 123;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 123); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round123 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppDomainBrandEn().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdActionTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceHoursRemainingPlainR123Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceThresholdMetPlainR123Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceStatusBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactRoleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainTodosCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppDomainBrandEn().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdActionTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceHoursRemainingPlainR123Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceThresholdMetPlainR123Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceStatusBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactRoleCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainTodosCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionDomainAppR123CopyCard().catch(() => {});
        paintRoundLayerList123();
      }, 710);
      setTimeout(() => {
        paintOkVersionDomainAppR123CopyCard().catch(() => {});
        paintRoundLayerList123();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppDomainBrandEn().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdActionTitleCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursRemainingPlainR123Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdMetPlainR123Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceStatusBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainTodosCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionDomainAppR123CopyCard().catch(() => {});
      paintRoundLayerList123();
    }, 730);
  }
})();
