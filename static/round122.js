/* 电子继承 · 第一百二十二批增量（叠在 round121…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round122SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文应用域名冷静条 */
  async function paintHomeBrandEnAppDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnAppDomainCalmBarR122");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnAppDomainCalmBarR122";
      bar.className = "home-brand-en-app-domain-calm-bar-r122";
      bar.setAttribute("role", "status");
      const verOk = $("#homeVersionOkDomainCalmBarR121");
      const domainBar = $("#homeDomainBrandEnVersionCalmBarR120");
      const okBar = $("#homeOkBrandEnDomainCalmBarR119");
      if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (domainBar && domainBar.parentNode === home)
        domainBar.insertAdjacentElement("afterend", bar);
      else if (okBar && okBar.parentNode === home)
        okBar.insertAdjacentElement("afterend", bar);
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
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + app + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-app-domain-calm-bar-r122-mark">品牌</span>
        <span class="muted home-brand-en-app-domain-calm-bar-r122-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnAppDomainCalmGoR122">去设置</button>`;
      const btn = $("#homeBrandEnAppDomainCalmGoR122");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-app-domain-calm-bar-r122-mark">品牌</span>
        <span class="muted home-brand-en-app-domain-calm-bar-r122-sub">英文应用域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnAppDomainCalmGoR122">去设置</button>`;
      const btn = $("#homeBrandEnAppDomainCalmGoR122");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+部门+受益人组合复制 */
  async function ensureLegacyNotesDeptBeneficiaryCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = notes + " · " + dept + " · " + bene;
      el.dataset.notesDeptBeneficiary = line;
      if (el.querySelector(".lg-copy-notes-dept-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-dept-beneficiary";
      btn.textContent = "复制备注部门受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesDeptBeneficiary || "");
        softBanner(ok ? "已复制备注部门受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置+提示+可见度组合复制 */
  async function ensureAssetDisposeHintVisibilityCopyButtons() {
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
      const dispose =
        String(it.dispose_note || it.dispose || "").trim() || "无处置";
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = dispose + " · " + hint + " · " + vis;
      el.dataset.disposeHintVisibility = line;
      if (el.querySelector(".as-copy-dispose-hint-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-hint-visibility";
      btn.textContent = "复制处置提示可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeHintVisibility || "");
        softBanner(ok ? "已复制处置提示可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔+距上次小时文案 */
  async function ensureCheckinIntervalHoursAgoPlainR122Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursAgoPlainR122CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursAgoPlainR122CopyCard";
      card.className = "checkin-interval-hours-ago-plain-r122-copy";
      const lastAgo = $("#checkinLastAgoReadablePlainR121CopyCard");
      const hrs = $("#checkinHoursRemainingReadablePlainR120CopyCard");
      const grace = $("#checkinGraceReadablePlainR119CopyCard");
      if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else if (hrs && hrs.parentNode)
        hrs.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const intervalRaw = cd.interval_hours;
      const interval =
        intervalRaw == null || intervalRaw === ""
          ? "—"
          : String(Number(intervalRaw));
      const sinceRaw = cd.hours_since_last;
      const since =
        sinceRaw == null || sinceRaw === ""
          ? "—"
          : String(Math.round(Number(sinceRaw) * 10) / 10);
      const combo = interval + " · " + since;
      const line =
        "报备间隔小时 · 距上次小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-hours-ago-plain-r122-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursAgoPlainR122CopyBtn">复制间隔距上次R122</button>`;
      const btn = $("#checkinIntervalHoursAgoPlainR122CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制间隔距上次R122" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+进度+达标组合复制 */
  async function ensureTravelThresholdPctMetPlainR122Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdPctMetPlainR122CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdPctMetPlainR122CopyCard";
      card.className = "travel-threshold-pct-met-plain-r122-copy";
      const shortMet = $("#travelShortfallMetPctPlainR121CopyCard");
      const pctMet = $("#travelPctMetBalancePlainR120CopyCard");
      const balShort = $("#travelBalanceShortfallThresholdPlainR119CopyCard");
      if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const combo = thr + " · " + pct + "% · " + met;
      const line =
        "差旅门槛 · 进度 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-pct-met-plain-r122-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdPctMetPlainR122CopyBtn">复制门槛进度达标</button>`;
      const btn = $("#travelThresholdPctMetPlainR122CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛进度达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛进度达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+标题+状态组合复制 */
  async function ensureAftercareCityTitleStatusCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const status = String(it.status || "").trim() || "未填状态";
      const line = city + " · " + title + " · " + status;
      el.dataset.cityTitleStatus = line;
      if (el.querySelector(".ac-copy-city-title-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-title-status";
      btn.textContent = "复制城市标题状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityTitleStatus || "");
        softBanner(ok ? "已复制城市标题状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+缺失+完成组合复制 */
  async function ensureAuthReadyMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingCompleteCopyCard";
      card.className = "av-ready-missing-complete-copy";
      const completeReady = $("#avCompleteReadyChecklistCopyCard");
      const readyComp = $("#avReadyCompleteChecklistCopyCard");
      const missGate = $("#avMissingGateChecklistCopyCard");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else if (missGate && missGate.parentNode)
        missGate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo =
        ready + " · 缺失 " + missing.length + " · " + doneFlag;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingCompleteCopyBtn">复制就绪缺失完成</button>`;
      const btn = $("#avReadyMissingCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪缺失完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+联系组合复制 */
  async function ensureHeirRelationIdContactCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = relation + " · #" + it.id + " · " + contact;
      if (el.querySelector(".bn-copy-relation-id-contact")) return;
      el.dataset.relationIdContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-contact";
      btn.textContent = "复制关系编号联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdContact || "");
        softBanner(ok ? "已复制关系编号联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+待办数+域名组合复制 */
  async function ensureHandoverExportTodosDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportTodosDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportTodosDomainCopyCard";
      card.className = "hand-export-todos-domain-copy";
      const domainItem = $("#handDomainItemCountTodosCopyCard");
      const itemTodos = $("#handItemCountTodosDomainCopyCard");
      const todosExp = $("#handTodosDomainExportCopyCard");
      if (domainItem && domainItem.parentNode)
        domainItem.insertAdjacentElement("afterend", card);
      else if (itemTodos && itemTodos.parentNode)
        itemTodos.insertAdjacentElement("afterend", card);
      else if (todosExp && todosExp.parentNode)
        todosExp.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const exportPath =
        String(data.export_path || "").trim() || "无导出路径";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = exportPath + " · " + tcount + " · " + domain;
      const line = "手册导出 · 待办 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-export-todos-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportTodosDomainCopyBtn">复制导出待办域名</button>`;
      const btn = $("#handExportTodosDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出待办域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出待办域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+域名+版本+就绪组合复制 + round 层含 122 */
  async function paintAppDomainVersionOkR122CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainVersionOkR122CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainVersionOkR122CopyCard";
      card.className = "card app-domain-version-ok-r122-copy-card";
      const verApp = $("#versionAppDomainOkR121CopyCard");
      const domVer = $("#domainVersionAppOkR120CopyCard");
      const appOk = $("#appOkDomainBrandEnR119CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + domain + " · " + ver + " · " + ready;
      card.innerHTML = `<h3>应用 · 域名 · 版本 · 就绪</h3>
        <p class="muted">一键复制应用名、域名、版本与就绪状态（演示级）。</p>
        <p class="app-domain-version-ok-r122-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainVersionOkR122CopyBtn">复制应用域名版本就绪</button>`;
      const btn = $("#appDomainVersionOkR122CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用域名版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 域名 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList122() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 122;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 122); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round122 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnAppDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesDeptBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposeHintVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalHoursAgoPlainR122Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdPctMetPlainR122Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityTitleStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportTodosDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnAppDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesDeptBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposeHintVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalHoursAgoPlainR122Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdPctMetPlainR122Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityTitleStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportTodosDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainVersionOkR122CopyCard().catch(() => {});
        paintRoundLayerList122();
      }, 710);
      setTimeout(() => {
        paintAppDomainVersionOkR122CopyCard().catch(() => {});
        paintRoundLayerList122();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnAppDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyNotesDeptBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDisposeHintVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursAgoPlainR122Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdPctMetPlainR122Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityTitleStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportTodosDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainVersionOkR122CopyCard().catch(() => {});
      paintRoundLayerList122();
    }, 730);
  }
})();
