/* 电子继承 · 第一百零四批增量（叠在 round103…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round104SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文应用版本冷静条 */
  async function paintHomeBrandEnAppVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnAppVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnAppVersionCalmBar";
      bar.className = "home-brand-en-app-version-calm-bar";
      bar.setAttribute("role", "status");
      const okApp = $("#homeOkAppDomainCalmBar");
      const appBrand = $("#homeAppBrandEnOkCalmBar");
      const domBrand = $("#homeDomainBrandEnOkCalmBar");
      if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else if (appBrand && appBrand.parentNode === home)
        appBrand.insertAdjacentElement("afterend", bar);
      else if (domBrand && domBrand.parentNode === home)
        domBrand.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = en + " · " + app + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-app-version-calm-mark">站点</span>
        <span class="muted home-brand-en-app-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnAppVersionCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnAppVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-app-version-calm-mark">站点</span>
        <span class="muted home-brand-en-app-version-calm-sub">英文应用版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnAppVersionCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnAppVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+分类+部门组合复制 */
  async function ensureLegacyBeneficiaryCategoryDeptCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const category = String(it.category || "").trim() || "未填分类";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = ben + " · " + category + " · " + dept;
      el.dataset.beneficiaryCategoryDept = line;
      if (el.querySelector(".lg-copy-beneficiary-category-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-category-dept";
      btn.textContent = "复制受益人分类部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryCategoryDept || "");
        softBanner(ok ? "已复制受益人分类部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见度+平台+账号提示组合复制 */
  async function ensureAssetVisibilityPlatformHintCopyButtons() {
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
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const platform = String(it.platform || "").trim() || "未填平台";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = vis + " · " + platform + " · " + hint;
      el.dataset.visibilityPlatformHint = line;
      if (el.querySelector(".as-copy-visibility-platform-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-platform-hint";
      btn.textContent = "复制可见平台提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityPlatformHint || "");
        softBanner(ok ? "已复制可见平台提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限小时说明 */
  async function ensureCheckinGraceHoursPlainR104Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursPlainR104CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursPlainR104CopyCard";
      card.className = "checkin-grace-hours-plain-r104-copy";
      const rem = $("#checkinHoursRemainingPlainR103CopyCard");
      const cdLabel = $("#checkinCountdownLabelPlainR102CopyCard");
      const ago = $("#checkinLastAgoLabelPlainR101CopyCard");
      if (rem && rem.parentNode)
        rem.insertAdjacentElement("afterend", card);
      else if (cdLabel && cdLabel.parentNode)
        cdLabel.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      let raw = cd.grace_hours;
      if (raw == null && st.user) raw = st.user.grace_hours;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备宽限 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-plain-r104-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursPlainR104CopyBtn">复制宽限小时说明</button>`;
      const btn = $("#checkinGraceHoursPlainR104CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制宽限小时说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限小时说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+进度百分比+门槛组合复制 */
  async function ensureTravelBalancePctThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalancePctThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalancePctThresholdPlainCopyCard";
      card.className = "travel-balance-pct-threshold-plain-copy";
      const metShort = $("#travelMetShortfallThresholdPlainCopyCard");
      const thrBal = $("#travelThresholdBalancePctPlainCopyCard");
      const balShort = $("#travelBalanceShortfallMetPlainCopyCard");
      if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = bal + " · " + pctStr + " · " + thr;
      const line =
        "差旅余额 · 进度 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-pct-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalancePctThresholdPlainCopyBtn">复制余额进度门槛</button>`;
      const btn = $("#travelBalancePctThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额进度门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额进度门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+服务类型+预算组合复制 */
  async function ensureAftercareCityServiceBudgetCopyButtons() {
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
      const svc = String(it.service_type || "").trim() || "未填服务";
      const budget =
        it.travel_budget == null
          ? "未填预算"
          : String(Math.round(Number(it.travel_budget)));
      const line = city + " · " + svc + " · " + budget;
      el.dataset.cityServiceBudget = line;
      if (el.querySelector(".ac-copy-city-service-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-service-budget";
      btn.textContent = "复制城市服务预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityServiceBudget || "");
        softBanner(ok ? "已复制城市服务预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失数+进度+就绪组合复制 */
  async function ensureAuthMissingProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingProgressReadyCopyCard";
      card.className = "av-missing-progress-ready-copy";
      const script = $("#avScriptProgressReadyCopyCard");
      const readyGate = $("#avReadyGateProgressCopyCard");
      const complete = $("#avCompleteProgressReadyCopyCard");
      if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const count = missing.length;
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo =
        "缺失 " + count + " · " + done + "/" + total + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingProgressReadyCopyBtn">复制缺失进度就绪</button>`;
      const btn = $("#avMissingProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失进度就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失进度就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+联系组合复制 */
  async function ensureHeirRelationNameContactCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = relation + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-relation-name-contact")) return;
      el.dataset.relationNameContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-contact";
      btn.textContent = "复制关系姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNameContact || "");
        softBanner(ok ? "已复制关系姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+域名+品牌组合复制 */
  async function ensureHandoverExportPathDomainBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathDomainBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathDomainBrandCopyCard";
      card.className = "hand-export-path-domain-brand-copy";
      const progItem = $("#handProgressItemCountBrandCopyCard");
      const brandDom = $("#handBrandDomainExportPathCopyCard");
      const domItem = $("#handDomainItemCountExportCopyCard");
      if (progItem && progItem.parentNode)
        progItem.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "").trim() || "无导出路径";
      const domain = String(data.domain || "").trim() || "无域名";
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = path + " · " + domain + " · " + brand;
      const line = "手册导出 · 域名 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-export-path-domain-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportPathDomainBrandCopyBtn">复制导出域名品牌</button>`;
      const btn = $("#handExportPathDomainBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出域名品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出域名品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+英文品牌+域名+就绪组合复制 + round 层含 104 */
  async function paintAppBrandEnDomainOkR104CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appBrandEnDomainOkR104CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appBrandEnDomainOkR104CopyCard";
      card.className = "card app-brand-en-domain-ok-r104-copy-card";
      const okDom = $("#okDomainBrandEnVersionR103CopyCard");
      const appOk = $("#appOkDomainVersionR102CopyCard");
      const brandOk = $("#brandEnOkVersionR101CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + en + " · " + domain + " · " + ready;
      card.innerHTML = `<h3>应用 · 英文品牌 · 域名 · 就绪</h3>
        <p class="muted">一键复制应用名、英文品牌、域名与就绪状态（演示级）。</p>
        <p class="app-brand-en-domain-ok-r104-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appBrandEnDomainOkR104CopyBtn">复制应用英文域名就绪</button>`;
      const btn = $("#appBrandEnDomainOkR104CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用英文域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 英文品牌 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList104() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 104;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 104); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round104 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnAppVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryCategoryDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityPlatformHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceHoursPlainR104Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalancePctThresholdPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityServiceBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingProgressReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNameContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportPathDomainBrandCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnAppVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryCategoryDeptCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityPlatformHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceHoursPlainR104Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalancePctThresholdPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityServiceBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingProgressReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNameContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportPathDomainBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppBrandEnDomainOkR104CopyCard().catch(() => {});
        paintRoundLayerList104();
      }, 710);
      setTimeout(() => {
        paintAppBrandEnDomainOkR104CopyCard().catch(() => {});
        paintRoundLayerList104();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnAppVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyBeneficiaryCategoryDeptCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetVisibilityPlatformHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursPlainR104Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalancePctThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityServiceBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathDomainBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppBrandEnDomainOkR104CopyCard().catch(() => {});
      paintRoundLayerList104();
    }, 730);
  }
})();
