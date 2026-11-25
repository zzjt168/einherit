/* 电子继承 · 第一百二十八批增量（叠在 round127…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round128SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+应用+域名冷静条 */
  async function paintHomeOkAppDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkAppDomainCalmBarR128");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkAppDomainCalmBarR128";
      bar.className = "home-ok-app-domain-calm-r128";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnDomainOkCalmBarR127");
      const domVer = $("#homeDomainVersionAppCalmBarR126");
      const verDom = $("#homeVersionDomainOkCalmBarR125");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
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
      bar.innerHTML = `<span class="home-ok-app-domain-calm-r128-mark">就绪</span>
        <span class="muted home-ok-app-domain-calm-r128-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkAppDomainCalmGoR128">去设置</button>`;
      const btn = $("#homeOkAppDomainCalmGoR128");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-app-domain-calm-r128-mark">就绪</span>
        <span class="muted home-ok-app-domain-calm-r128-sub">就绪应用域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkAppDomainCalmGoR128">去设置</button>`;
      const btn = $("#homeOkAppDomainCalmGoR128");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+分类组合复制 */
  async function ensureLegacyTitleBeneficiaryCategoryCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const category = String(it.category || "").trim() || "未填分类";
      const line = title + " · " + bene + " · " + category;
      el.dataset.titleBeneficiaryCategory = line;
      if (el.querySelector(".lg-copy-title-beneficiary-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-category";
      btn.textContent = "复制标题受益人分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryCategory || "");
        softBanner(ok ? "已复制标题受益人分类" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签+可见性组合复制 */
  async function ensureAssetPlatformTagVisibilityCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "无标签";
      const vis = String(it.visibility || "").trim() || "未填可见性";
      const line = platform + " · " + tag + " · " + vis;
      el.dataset.platformTagVisibility = line;
      if (el.querySelector(".as-copy-platform-tag-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag-visibility";
      btn.textContent = "复制平台标签可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTagVisibility || "");
        softBanner(ok ? "已复制平台标签可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时+间隔文案 */
  async function ensureCheckinHoursRemainingIntervalPlainR128Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingIntervalPlainR128CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingIntervalPlainR128CopyCard";
      card.className = "checkin-hours-remaining-interval-plain-r128-copy";
      const lastOk = $("#checkinLastOkNextDuePlainR127CopyCard");
      const intNext = $("#checkinIntervalNextLabelPlainR126CopyCard");
      const hrsGrace = $("#checkinHoursRemainingGracePlainR125CopyCard");
      if (lastOk && lastOk.parentNode)
        lastOk.insertAdjacentElement("afterend", card);
      else if (intNext && intNext.parentNode)
        intNext.insertAdjacentElement("afterend", card);
      else if (hrsGrace && hrsGrace.parentNode)
        hrsGrace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const hrsRaw = cd.hours_remaining;
      const hrs =
        hrsRaw == null || hrsRaw === ""
          ? "—"
          : String(Math.round(Number(hrsRaw) * 100) / 100);
      const intervalRaw = cd.interval_hours;
      const interval =
        intervalRaw == null || intervalRaw === ""
          ? "—"
          : String(Number(intervalRaw));
      const combo = hrs + " · " + interval;
      const line =
        "剩余小时 · 报备间隔 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-interval-plain-r128-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingIntervalPlainR128CopyBtn">复制剩余间隔R128</button>`;
      const btn = $("#checkinHoursRemainingIntervalPlainR128CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余间隔R128" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+进度+门槛组合复制 */
  async function ensureTravelShortfallProgressThresholdPlainR128Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallProgressThresholdPlainR128CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallProgressThresholdPlainR128CopyCard";
      card.className = "travel-shortfall-progress-threshold-plain-r128-copy";
      const curBal = $("#travelCurrencyBalanceMetPlainR127CopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainR126CopyCard");
      const pctBal = $("#travelPctBalanceMetPlainR125CopyCard");
      if (curBal && curBal.parentNode)
        curBal.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (pctBal && pctBal.parentNode)
        pctBal.insertAdjacentElement("afterend", card);
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
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = short + " · " + pct + "% · " + thr;
      const line =
        "差旅缺口 · 进度 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-progress-threshold-plain-r128-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallProgressThresholdPlainR128CopyBtn">复制缺口进度门槛</button>`;
      const btn = $("#travelShortfallProgressThresholdPlainR128CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口进度门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口进度门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后拜访偏好+标题+服务类型组合复制 */
  async function ensureAftercareVisitTitleServiceCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = visit + " · " + title + " · " + service;
      el.dataset.visitTitleService = line;
      if (el.querySelector(".ac-copy-visit-title-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-title-service";
      btn.textContent = "复制拜访标题服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitTitleService || "");
        softBanner(ok ? "已复制拜访标题服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口+就绪+清单项数组合复制 */
  async function ensureAuthGateReadyChecklistCountCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateReadyChecklistCountR128CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateReadyChecklistCountR128CopyCard";
      card.className = "av-gate-ready-checklist-count-r128";
      const readyMiss = $("#avReadyCompleteMissingCountR127CopyCard");
      const gate = $("#avGateMissingReadyCopyCard");
      const checklist = $("#avChecklistCompleteGateCopyCard");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gateOpen = truthyFlag(data.ready) ? "闸口开" : "闸口关";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const checklist = Array.isArray(data.checklist)
        ? data.checklist
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.missing)
            ? data.missing
            : [];
      const combo =
        gateOpen + " · " + ready + " · 清单 " + checklist.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-ready-checklist-count-r128-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateReadyChecklistCountR128CopyBtn">复制闸口就绪清单</button>`;
      const btn = $("#avGateReadyChecklistCountR128CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制闸口就绪清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">闸口就绪清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+关系+口令提示组合复制 */
  async function ensureHeirContactRelationPassphraseCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const line = contact + " · " + relation + " · " + hint;
      if (el.querySelector(".bn-copy-contact-relation-passphrase")) return;
      el.dataset.contactRelationPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-passphrase";
      btn.textContent = "复制联系关系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationPassphrase || "");
        softBanner(ok ? "已复制联系关系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数+域名+品牌组合复制 */
  async function ensureHandoverTodosDomainBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodosDomainBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodosDomainBrandCopyCard";
      card.className = "hand-todos-domain-brand-copy";
      const brandVer = $("#handBrandVersionItemCountCopyCard");
      const itemBrand = $("#handItemCountBrandDomainCopyCard");
      const domainBrand = $("#handDomainBrandItemCountCopyCard");
      if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (domainBrand && domainBrand.parentNode)
        domainBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todosN = Array.isArray(data.todos)
        ? String(data.todos.length)
        : data.item_count != null
          ? String(data.item_count)
          : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = todosN + " · " + domain + " · " + brand;
      const line = "手册待办 · 域名 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-todos-domain-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodosDomainBrandCopyBtn">复制待办域名品牌</button>`;
      const btn = $("#handTodosDomainBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办域名品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办域名品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+域名+应用组合复制 + round 层含 128 */
  async function paintOkBrandEnDomainAppR128CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnDomainAppR128CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnDomainAppR128CopyCard";
      card.className = "card settings-ok-brand-en-domain-app-r128-copy-card";
      const appDom = $("#settingsAppDomainVersionOkR127CopyCard");
      const verDom = $("#versionDomainOkBrandEnR126CopyCard");
      const appOk = $("#appOkBrandEnVersionR125CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
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
      card.innerHTML = `<h3>就绪 · 英文 · 域名 · 应用</h3>
        <p class="muted">一键复制就绪状态、英文品牌、域名与应用名（演示级）。</p>
        <p class="settings-ok-brand-en-domain-app-r128-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnDomainAppR128CopyBtn">复制就绪英文域名应用</button>`;
      const btn = $("#settingsOkBrandEnDomainAppR128CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文域名应用" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文 · 域名 · 应用</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList128() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 128;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 128); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round128 均已挂载。</p>`
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
      () => ensureLegacyTitleBeneficiaryCategoryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingIntervalPlainR128Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallProgressThresholdPlainR128Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitTitleServiceCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthGateReadyChecklistCountCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRelationPassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodosDomainBrandCopy().catch(() => {}),
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
        () => ensureLegacyTitleBeneficiaryCategoryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinHoursRemainingIntervalPlainR128Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallProgressThresholdPlainR128Copy().catch(
            () => {}
          ),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitTitleServiceCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthGateReadyChecklistCountCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRelationPassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodosDomainBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnDomainAppR128CopyCard().catch(() => {});
        paintRoundLayerList128();
      }, 710);
      setTimeout(() => {
        paintOkBrandEnDomainAppR128CopyCard().catch(() => {});
        paintRoundLayerList128();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkAppDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleBeneficiaryCategoryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingIntervalPlainR128Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallProgressThresholdPlainR128Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitTitleServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateReadyChecklistCountCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodosDomainBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnDomainAppR128CopyCard().catch(() => {});
      paintRoundLayerList128();
    }, 730);
  }
})();
