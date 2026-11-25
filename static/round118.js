/* 电子继承 · 第一百一十八批增量（叠在 round117…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round118SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文域名应用冷静条 */
  async function paintHomeBrandEnDomainApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainAppCalmBarR118");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainAppCalmBarR118";
      bar.className = "home-brand-en-domain-app-calm-bar-r118";
      bar.setAttribute("role", "status");
      const appOk = $("#homeAppOkVersionCalmBarR117");
      const domOk = $("#homeDomainOkBrandEnCalmBarR116");
      const verEn = $("#homeVersionBrandEnAppCalmBarR115");
      if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const sub = en + " · " + domain + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-app-calm-bar-r118-mark">品牌</span>
        <span class="muted home-brand-en-domain-app-calm-bar-r118-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainAppCalmGoR118">去设置</button>`;
      const btn = $("#homeBrandEnDomainAppCalmGoR118");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-app-calm-bar-r118-mark">品牌</span>
        <span class="muted home-brand-en-domain-app-calm-bar-r118-sub">英文域名应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainAppCalmGoR118">去设置</button>`;
      const btn = $("#homeBrandEnDomainAppCalmGoR118");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+动作+编号组合复制 */
  async function ensureLegacyNotesActionIdCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const action = String(it.action || "").trim() || "未填动作";
      const line = notes + " · " + action + " · #" + it.id;
      el.dataset.notesActionId = line;
      if (el.querySelector(".lg-copy-notes-action-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-action-id";
      btn.textContent = "复制备注动作编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesActionId || "");
        softBanner(ok ? "已复制备注动作编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘提示+可见度+摘要组合复制 */
  async function ensureAssetHintVisibilitySummaryCopyButtons() {
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
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const summary = String(it.summary || "").trim() || "无摘要";
      const line = hint + " · " + vis + " · " + summary;
      el.dataset.hintVisibilitySummary = line;
      if (el.querySelector(".as-copy-hint-visibility-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-visibility-summary";
      btn.textContent = "复制提示可见摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintVisibilitySummary || "");
        softBanner(ok ? "已复制提示可见摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次标签秒数文案 */
  async function ensureCheckinNextLabelSecondsPlainR118Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextLabelSecondsPlainR118CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextLabelSecondsPlainR118CopyCard";
      card.className = "checkin-next-label-seconds-plain-r118-copy";
      const readable = $("#checkinReadableIntervalPlainR117CopyCard");
      const agoGrace = $("#checkinAgoLabelGracePlainR116CopyCard");
      const lastLabel = $("#checkinLastLabelHoursPlainR115CopyCard");
      if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (agoGrace && agoGrace.parentNode)
        agoGrace.insertAdjacentElement("afterend", card);
      else if (lastLabel && lastLabel.parentNode)
        lastLabel.insertAdjacentElement("afterend", card);
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
      const secRaw = cd.seconds_remaining;
      const sec =
        secRaw == null || secRaw === ""
          ? "—"
          : String(Math.round(Number(secRaw)));
      const combo = nextLabel + " · " + sec;
      const line =
        "下次建议标签 · 剩余秒数 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-label-seconds-plain-r118-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextLabelSecondsPlainR118CopyBtn">复制下次标签秒数R118</button>`;
      const btn = $("#checkinNextLabelSecondsPlainR118CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次标签秒数R118" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次标签秒数文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+门槛+余额组合复制 */
  async function ensureTravelShortfallThresholdBalancePlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdBalancePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdBalancePlainCopyCard";
      card.className = "travel-shortfall-threshold-balance-plain-copy";
      const metPct = $("#travelMetPctBalancePlainR117CopyCard");
      const thrShort = $("#travelThresholdShortfallPctPlainCopyCard");
      const shortBal = $("#travelShortfallBalanceMetPlainR115CopyCard");
      if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = short + " · " + thr + " · " + bal;
      const line =
        "差旅缺口 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-balance-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdBalancePlainCopyBtn">复制缺口门槛余额</button>`;
      const btn = $("#travelShortfallThresholdBalancePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口门槛余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+拜访偏好+预算组合复制 */
  async function ensureAftercareCityVisitBudgetCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const line = city + " · " + visit + " · " + budget;
      el.dataset.cityVisitBudget = line;
      if (el.querySelector(".ac-copy-city-visit-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-visit-budget";
      btn.textContent = "复制城市拜访预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityVisitBudget || "");
        softBanner(ok ? "已复制城市拜访预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+缺失数+清单数组合复制 */
  async function ensureAuthCompleteMissingChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingChecklistCopyCard";
      card.className = "av-complete-missing-checklist-copy";
      const readyMiss = $("#avReadyCompleteMissingCopyCard");
      const checklist = $("#avChecklistMissingGateCopyCard");
      const gateReady = $("#avGateReadyChecklistCopyCard");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo =
        doneFlag + " · 缺失 " + missing.length + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingChecklistCopyBtn">复制完成缺失清单</button>`;
      const btn = $("#avCompleteMissingChecklistCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+姓名+联系组合复制 */
  async function ensureHeirRoleNameContactCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = role + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-role-name-contact")) return;
      el.dataset.roleNameContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-name-contact";
      btn.textContent = "复制角色姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleNameContact || "");
        softBanner(ok ? "已复制角色姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+待办数+品牌组合复制 */
  async function ensureHandoverDomainTodosBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainTodosBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainTodosBrandCopyCard";
      card.className = "hand-domain-todos-brand-copy";
      const exportItem = $("#handExportItemCountTodosCopyCard");
      const brandTodos = $("#handBrandTodosDomainCopyCard");
      const itemExp = $("#handItemCountExportBrandCopyCard");
      if (exportItem && exportItem.parentNode)
        exportItem.insertAdjacentElement("afterend", card);
      else if (brandTodos && brandTodos.parentNode)
        brandTodos.insertAdjacentElement("afterend", card);
      else if (itemExp && itemExp.parentNode)
        itemExp.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "").trim() || "无域名";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = domain + " · " + tcount + " · " + brand;
      const line = "手册域名 · 待办 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-todos-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainTodosBrandCopyBtn">复制域名待办品牌</button>`;
      const btn = $("#handDomainTodosBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名待办品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名待办品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+应用名+就绪组合复制 + round 层含 118 */
  async function paintVersionDomainAppOkR118CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionDomainAppOkR118CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionDomainAppOkR118CopyCard";
      card.className = "card version-domain-app-ok-r118-copy-card";
      const brandEn = $("#brandEnOkAppDomainR117CopyCard");
      const okApp = $("#okAppVersionDomainR116CopyCard");
      const domOk = $("#domainOkAppBrandEnR115CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · " + domain + " · " + app + " · " + ready;
      card.innerHTML = `<h3>版本 · 域名 · 应用 · 就绪</h3>
        <p class="muted">一键复制版本、域名、应用名与就绪状态（演示级）。</p>
        <p class="version-domain-app-ok-r118-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionDomainAppOkR118CopyBtn">复制版本域名应用就绪</button>`;
      const btn = $("#versionDomainAppOkR118CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名应用就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 应用 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList118() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 118;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 118); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round118 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesActionIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintVisibilitySummaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextLabelSecondsPlainR118Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallThresholdBalancePlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityVisitBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRoleNameContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainTodosBrandCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesActionIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintVisibilitySummaryCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextLabelSecondsPlainR118Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallThresholdBalancePlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityVisitBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRoleNameContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainTodosBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainAppOkR118CopyCard().catch(() => {});
        paintRoundLayerList118();
      }, 710);
      setTimeout(() => {
        paintVersionDomainAppOkR118CopyCard().catch(() => {});
        paintRoundLayerList118();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyNotesActionIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetHintVisibilitySummaryCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextLabelSecondsPlainR118Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdBalancePlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityVisitBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainTodosBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainAppOkR118CopyCard().catch(() => {});
      paintRoundLayerList118();
    }, 730);
  }
})();
