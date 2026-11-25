/* 电子继承 · 第一百一十二批增量（叠在 round111…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round112SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用就绪域名冷静条 */
  async function paintHomeAppOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppOkDomainCalmBarR112");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppOkDomainCalmBarR112";
      bar.className = "home-app-ok-domain-calm-bar-r112";
      bar.setAttribute("role", "status");
      const domVer = $("#homeDomainVersionAppCalmBar");
      const okApp = $("#homeOkAppBrandEnCalmBar");
      const verOk = $("#homeVersionOkAppCalmBar");
      if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
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
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = app + " · " + ready + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-domain-calm-bar-r112-mark">应用</span>
        <span class="muted home-app-ok-domain-calm-bar-r112-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppOkDomainCalmGoR112">去设置</button>`;
      const btn = $("#homeAppOkDomainCalmGoR112");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-domain-calm-bar-r112-mark">应用</span>
        <span class="muted home-app-ok-domain-calm-bar-r112-sub">应用就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppOkDomainCalmGoR112">去设置</button>`;
      const btn = $("#homeAppOkDomainCalmGoR112");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+动作+备注组合复制 */
  async function ensureLegacyCategoryActionNotesCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const action = String(it.action || "").trim() || "未填动作";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = cat + " · " + action + " · " + notes;
      el.dataset.categoryActionNotes = line;
      if (el.querySelector(".lg-copy-category-action-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-action-notes";
      btn.textContent = "复制分类动作备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryActionNotes || "");
        softBanner(ok ? "已复制分类动作备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+平台+摘要组合复制 */
  async function ensureAssetIdPlatformSummaryCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const summary = String(it.summary || "").trim() || "无摘要";
      const line = "#" + it.id + " · " + platform + " · " + summary;
      el.dataset.idPlatformSummary = line;
      if (el.querySelector(".as-copy-id-platform-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-platform-summary";
      btn.textContent = "复制编号平台摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlatformSummary || "");
        softBanner(ok ? "已复制编号平台摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制可读宽限文案 */
  async function ensureCheckinReadableGracePlainR112Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinReadableGracePlainR112CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinReadableGracePlainR112CopyCard";
      card.className = "checkin-readable-grace-plain-r112-copy";
      const hoursLeft = $("#checkinHoursLeftDuePlainR111CopyCard");
      const lastAt = $("#checkinLastAtIntervalPlainR110CopyCard");
      const nextAt = $("#checkinNextAtPlainR109CopyCard");
      if (hoursLeft && hoursLeft.parentNode)
        hoursLeft.insertAdjacentElement("afterend", card);
      else if (lastAt && lastAt.parentNode)
        lastAt.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const readable = String(cd.readable || "").trim() || "—";
      const graceRaw = cd.grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Math.round(Number(graceRaw) * 100) / 100);
      const combo = readable + " · " + grace;
      const line =
        "报备可读 · 宽限 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-readable-grace-plain-r112-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinReadableGracePlainR112CopyBtn">复制可读宽限文案R112</button>`;
      const btn = $("#checkinReadableGracePlainR112CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制可读宽限文案R112" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">可读宽限文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+余额+门槛组合复制 */
  async function ensureTravelPctBalanceThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelPctBalanceThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelPctBalanceThresholdPlainCopyCard";
      card.className = "travel-pct-balance-threshold-plain-copy";
      const thrBal = $("#travelThresholdBalanceMetPlainCopyCard");
      const balMet = $("#travelBalanceMetShortfallPlainCopyCard");
      const metPct = $("#travelMetPctThresholdPlainCopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = pctStr + " · " + bal + " · " + thr;
      const line =
        "差旅进度 · 余额 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-pct-balance-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelPctBalanceThresholdPlainCopyBtn">复制进度余额门槛</button>`;
      const btn = $("#travelPctBalanceThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度余额门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度余额门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+城市+预算组合复制 */
  async function ensureAftercareTitleCityBudgetCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const city = String(it.city || "").trim() || "未填城市";
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const line = title + " · " + city + " · " + budget;
      el.dataset.titleCityBudget = line;
      if (el.querySelector(".ac-copy-title-city-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-city-budget";
      btn.textContent = "复制标题城市预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCityBudget || "");
        softBanner(ok ? "已复制标题城市预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+闸口+缺失数组合复制 */
  async function ensureAuthReadyGateMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyGateMissingCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyGateMissingCopyCard";
      card.className = "av-ready-gate-missing-copy";
      const checklist = $("#avChecklistCountCompleteCopyCard");
      const miss = $("#avMissingChecklistReadyCopyCard");
      const gate = $("#avGateCompleteReadyCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const gate = truthyFlag(data.gate) ? "闸口开" : "闸口关";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const combo = ready + " · " + gate + " · 缺失 " + missing.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-gate-missing-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyGateMissingCopyBtn">复制就绪闸口缺失</button>`;
      const btn = $("#avReadyGateMissingCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪闸口缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪闸口缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+姓名+联系组合复制 */
  async function ensureHeirPassphraseNameContactCopyButtons() {
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
      const phrase =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = phrase + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-passphrase-name-contact")) return;
      el.dataset.passphraseNameContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-name-contact";
      btn.textContent = "复制口令姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseNameContact || "");
        softBanner(ok ? "已复制口令姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+域名+待办数组合复制 */
  async function ensureHandoverExportDomainTodosCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportDomainTodosCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportDomainTodosCopyCard";
      card.className = "hand-export-domain-todos-copy";
      const brandDom = $("#handBrandDomainItemCountCopyCard");
      const itemBrand = $("#handItemCountBrandTodosCopyCard");
      const exportBrand = $("#handExportTodosBrandCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
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
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const domain = String(data.domain || "").trim() || "无域名";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const combo = exportPath + " · " + domain + " · " + tcount;
      const line = "手册导出 · 域名 · 待办 · " + combo;
      card.innerHTML = `<p class="muted hand-export-domain-todos-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportDomainTodosCopyBtn">复制导出域名待办</button>`;
      const btn = $("#handExportDomainTodosCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出域名待办" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出域名待办暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+域名+应用名组合复制 + round 层含 112 */
  async function paintOkBrandEnDomainAppR112CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okBrandEnDomainAppR112CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okBrandEnDomainAppR112CopyCard";
      card.className = "card ok-brand-en-domain-app-r112-copy-card";
      const domApp = $("#domainAppVersionOkR111CopyCard");
      const appDom = $("#appDomainBrandEnOkR110CopyCard");
      const okDom = $("#okDomainAppVersionR109CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domApp && domApp.parentNode)
        domApp.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const line = ready + " · " + en + " · " + domain + " · " + app;
      card.innerHTML = `<h3>就绪 · 英文品牌 · 域名 · 应用</h3>
        <p class="muted">一键复制就绪状态、英文品牌、域名与应用名（演示级）。</p>
        <p class="ok-brand-en-domain-app-r112-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okBrandEnDomainAppR112CopyBtn">复制就绪英文域名应用</button>`;
      const btn = $("#okBrandEnDomainAppR112CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文域名应用" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文品牌 · 域名 · 应用</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList112() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 112;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 112); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round112 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryActionNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdPlatformSummaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinReadableGracePlainR112Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelPctBalanceThresholdPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleCityBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyGateMissingCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseNameContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportDomainTodosCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryActionNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdPlatformSummaryCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinReadableGracePlainR112Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelPctBalanceThresholdPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleCityBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyGateMissingCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseNameContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportDomainTodosCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnDomainAppR112CopyCard().catch(() => {});
        paintRoundLayerList112();
      }, 710);
      setTimeout(() => {
        paintOkBrandEnDomainAppR112CopyCard().catch(() => {});
        paintRoundLayerList112();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyCategoryActionNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetIdPlatformSummaryCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinReadableGracePlainR112Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelPctBalanceThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleCityBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyGateMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportDomainTodosCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnDomainAppR112CopyCard().catch(() => {});
      paintRoundLayerList112();
    }, 730);
  }
})();
