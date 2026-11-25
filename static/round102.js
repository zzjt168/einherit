/* 电子继承 · 第一百零二批增量（叠在 round101…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round102SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用英文就绪冷静条 */
  async function paintHomeAppBrandEnOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppBrandEnOkCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppBrandEnOkCalmBar";
      bar.className = "home-app-brand-en-ok-calm-bar";
      bar.setAttribute("role", "status");
      const domBrand = $("#homeDomainBrandEnOkCalmBar");
      const okBrand = $("#homeOkBrandEnVersionCalmBar");
      const appDom = $("#homeAppDomainVersionCalmBar");
      if (domBrand && domBrand.parentNode === home)
        domBrand.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = app + " · " + en + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-brand-en-ok-calm-mark">站点</span>
        <span class="muted home-app-brand-en-ok-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppBrandEnOkCalmGo">去设置</button>`;
      const btn = $("#homeAppBrandEnOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-brand-en-ok-calm-mark">站点</span>
        <span class="muted home-app-brand-en-ok-calm-sub">应用英文就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppBrandEnOkCalmGo">去设置</button>`;
      const btn = $("#homeAppBrandEnOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+受益人组合复制 */
  async function ensureLegacyIdTitleBeneficiaryCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = "#" + it.id + " · " + title + " · " + ben;
      el.dataset.idTitleBeneficiary = line;
      if (el.querySelector(".lg-copy-id-title-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-beneficiary";
      btn.textContent = "复制编号标题受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleBeneficiary || "");
        softBanner(ok ? "已复制编号标题受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+部门+账号提示组合复制 */
  async function ensureAssetSummaryDeptHintCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const dept = String(it.dept || "").trim() || "未填部门";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = summary + " · " + dept + " · " + hint;
      el.dataset.summaryDeptHint = line;
      if (el.querySelector(".as-copy-summary-dept-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-dept-hint";
      btn.textContent = "复制摘要部门提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryDeptHint || "");
        softBanner(ok ? "已复制摘要部门提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制倒计时标签 */
  async function ensureCheckinCountdownLabelPlainR102Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinCountdownLabelPlainR102CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinCountdownLabelPlainR102CopyCard";
      card.className = "checkin-countdown-label-plain-r102-copy";
      const ago = $("#checkinLastAgoLabelPlainR101CopyCard");
      const next = $("#checkinNextSuggestedLabelPlainR100CopyCard");
      const hours = $("#checkinIntervalHoursPlainR99CopyCard");
      if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).countdown_label || "").trim() || "—";
      const line =
        "报备倒计时 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-countdown-label-plain-r102-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinCountdownLabelPlainR102CopyBtn">复制倒计时标签文案R102</button>`;
      const btn = $("#checkinCountdownLabelPlainR102CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制倒计时标签文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">倒计时标签暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+进度百分比组合复制 */
  async function ensureTravelThresholdBalancePctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalancePctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalancePctPlainCopyCard";
      card.className = "travel-threshold-balance-pct-plain-copy";
      const balShort = $("#travelBalanceShortfallMetPlainCopyCard");
      const shortMet = $("#travelShortfallThresholdMetPlainCopyCard");
      const pctShort = $("#travelProgressPctShortfallPlainCopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const combo = thr + " · " + bal + " · " + pctStr;
      const line =
        "差旅门槛 · 余额 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalancePctPlainCopyBtn">复制门槛余额进度</button>`;
      const btn = $("#travelThresholdBalancePctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+服务类型+城市组合复制 */
  async function ensureAftercareTitleServiceCityCopyButtons() {
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
      const svc = String(it.service_type || "").trim() || "未填服务";
      const city = String(it.city || "").trim() || "未填城市";
      const line = title + " · " + svc + " · " + city;
      el.dataset.titleServiceCity = line;
      if (el.querySelector(".ac-copy-title-service-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-service-city";
      btn.textContent = "复制标题服务城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleServiceCity || "");
        softBanner(ok ? "已复制标题服务城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+闸口+进度组合复制 */
  async function ensureAuthReadyGateProgressCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyGateProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyGateProgressCopyCard";
      card.className = "av-ready-gate-progress-copy";
      const complete = $("#avCompleteProgressReadyCopyCard");
      const gate = $("#avGateProgressReadyCopyCard");
      const checklist = $("#avChecklistProgressReadyCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const combo = ready + " · " + gate + " · " + done + "/" + total;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-gate-progress-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyGateProgressCopyBtn">复制就绪闸口进度</button>`;
      const btn = $("#avReadyGateProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪闸口进度" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪闸口进度暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+角色+姓名组合复制 */
  async function ensureHeirContactRoleNameCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const role = String(it.role || "").trim() || "未填角色";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = contact + " · " + role + " · " + name;
      if (el.querySelector(".bn-copy-contact-role-name")) return;
      el.dataset.contactRoleName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-role-name";
      btn.textContent = "复制联系角色姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRoleName || "");
        softBanner(ok ? "已复制联系角色姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+导出路径组合复制 */
  async function ensureHandoverBrandDomainExportPathCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainExportPathCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainExportPathCopyCard";
      card.className = "hand-brand-domain-export-path-copy";
      const domItem = $("#handDomainItemCountExportCopyCard");
      const brandItem = $("#handBrandItemCountExportCopyCard");
      const todos = $("#handTodoCountExportPathCopyCard");
      if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else if (brandItem && brandItem.parentNode)
        brandItem.insertAdjacentElement("afterend", card);
      else if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
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
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = brand + " · " + domain + " · " + path;
      const line = "手册品牌 · 域名 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-export-path-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainExportPathCopyBtn">复制品牌域名导出</button>`;
      const btn = $("#handBrandDomainExportPathCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌域名导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+就绪+域名+版本组合复制 + round 层含 102 */
  async function paintAppOkDomainVersionR102CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkDomainVersionR102CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkDomainVersionR102CopyCard";
      card.className = "card app-ok-domain-version-r102-copy-card";
      const brandOk = $("#brandEnOkVersionR101CopyCard");
      const appDom = $("#appDomainOkVersionR100CopyCard");
      const brandEn = $("#brandEnDomainVersionR99CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = app + " · " + ready + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>应用 · 就绪 · 域名 · 版本</h3>
        <p class="muted">一键复制应用名、就绪状态、域名与版本（演示级）。</p>
        <p class="app-ok-domain-version-r102-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkDomainVersionR102CopyBtn">复制应用就绪域名版本</button>`;
      const btn = $("#appOkDomainVersionR102CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 就绪 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList102() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 102;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 102); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round102 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppBrandEnOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryDeptHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinCountdownLabelPlainR102Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdBalancePctPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleServiceCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthReadyGateProgressCopy().catch(() => {}), 620);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRoleNameCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainExportPathCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppBrandEnOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryDeptHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinCountdownLabelPlainR102Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdBalancePctPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleServiceCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthReadyGateProgressCopy().catch(() => {}), 640);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRoleNameCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainExportPathCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkDomainVersionR102CopyCard().catch(() => {});
        paintRoundLayerList102();
      }, 710);
      setTimeout(() => {
        paintAppOkDomainVersionR102CopyCard().catch(() => {});
        paintRoundLayerList102();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppBrandEnOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdTitleBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetSummaryDeptHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinCountdownLabelPlainR102Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalancePctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleServiceCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyGateProgressCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRoleNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainExportPathCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkDomainVersionR102CopyCard().catch(() => {});
      paintRoundLayerList102();
    }, 730);
  }
})();
