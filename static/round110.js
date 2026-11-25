/* 电子继承 · 第一百一十批增量（叠在 round109…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round110SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪应用英文冷静条 */
  async function paintHomeOkAppBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkAppBrandEnCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkAppBrandEnCalmBar";
      bar.className = "home-ok-app-brand-en-calm-bar";
      bar.setAttribute("role", "status");
      const verOk = $("#homeVersionOkAppCalmBar");
      const brandEn = $("#homeBrandEnOkDomainCalmBar");
      const appVer = $("#homeAppVersionDomainCalmBar");
      if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ready + " · " + app + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-app-brand-en-calm-mark">品牌</span>
        <span class="muted home-ok-app-brand-en-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkAppBrandEnCalmGo">去设置</button>`;
      const btn = $("#homeOkAppBrandEnCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-app-brand-en-calm-mark">品牌</span>
        <span class="muted home-ok-app-brand-en-calm-sub">就绪应用英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkAppBrandEnCalmGo">去设置</button>`;
      const btn = $("#homeOkAppBrandEnCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割动作+受益人+分类组合复制 */
  async function ensureLegacyActionBeneficiaryCategoryCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const cat = String(it.category || "").trim() || "未填分类";
      const line = action + " · " + ben + " · " + cat;
      el.dataset.actionBeneficiaryCategory = line;
      if (el.querySelector(".lg-copy-action-beneficiary-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-beneficiary-category";
      btn.textContent = "复制动作受益人分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionBeneficiaryCategory || "");
        softBanner(ok ? "已复制动作受益人分类" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见度+编号组合复制 */
  async function ensureAssetSummaryVisibilityIdCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = summary + " · " + vis + " · #" + it.id;
      el.dataset.summaryVisibilityId = line;
      if (el.querySelector(".as-copy-summary-visibility-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-visibility-id";
      btn.textContent = "复制摘要可见编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryVisibilityId || "");
        softBanner(ok ? "已复制摘要可见编号" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近报备间隔文案 */
  async function ensureCheckinLastAtIntervalPlainR110Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAtIntervalPlainR110CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAtIntervalPlainR110CopyCard";
      card.className = "checkin-last-at-interval-plain-r110-copy";
      const nextAt = $("#checkinNextAtPlainR109CopyCard");
      const hoursAgo = $("#checkinHoursAgoIntervalPlainR108CopyCard");
      const interval = $("#checkinIntervalReadablePlainR107CopyCard");
      if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const lastRaw = cd.last_checkin_at;
      const last =
        lastRaw == null || lastRaw === ""
          ? "—"
          : String(Math.round(Number(lastRaw) * 1000) / 1000);
      const intRaw = cd.interval_hours;
      const hours =
        intRaw == null || intRaw === ""
          ? "—"
          : String(Math.round(Number(intRaw) * 100) / 100);
      const combo = last + " · " + hours;
      const line =
        "最近报备 · 间隔 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-at-interval-plain-r110-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAtIntervalPlainR110CopyBtn">复制最近报备间隔R110</button>`;
      const btn = $("#checkinLastAtIntervalPlainR110CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制最近报备间隔R110" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近报备间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+达标+缺口组合复制 */
  async function ensureTravelBalanceMetShortfallPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetShortfallPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetShortfallPlainCopyCard";
      card.className = "travel-balance-met-shortfall-plain-copy";
      const metPct = $("#travelMetPctThresholdPlainCopyCard");
      const pctShort = $("#travelPctShortfallBalancePlainCopyCard");
      const thrMet = $("#travelThresholdMetShortfallPlainCopyCard");
      if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
      else if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = bal + " · " + met + " · " + short;
      const line =
        "差旅余额 · 达标 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-met-shortfall-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetShortfallPlainCopyBtn">复制余额达标缺口</button>`;
      const btn = $("#travelBalanceMetShortfallPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额达标缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额达标缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+标题+服务类型组合复制 */
  async function ensureAftercareStatusTitleServiceCopyButtons() {
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
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const title = String(it.title || "").trim() || "未填标题";
      const svc = String(it.service_type || "").trim() || "未填服务";
      const line = status + " · " + title + " · " + svc;
      el.dataset.statusTitleService = line;
      if (el.querySelector(".ac-copy-status-title-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-title-service";
      btn.textContent = "复制状态标题服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusTitleService || "");
        softBanner(ok ? "已复制状态标题服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失数+清单数+就绪组合复制 */
  async function ensureAuthMissingChecklistReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingChecklistReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingChecklistReadyCopyCard";
      card.className = "av-missing-checklist-ready-copy";
      const gate = $("#avGateCompleteReadyCopyCard");
      const readyList = $("#avReadyChecklistCompleteCopyCard");
      const completeMiss = $("#avCompleteMissingReadyCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (readyList && readyList.parentNode)
        readyList.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo =
        "缺失 " + missing.length + " · 清单 " + list.length + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-checklist-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingChecklistReadyCopyBtn">复制缺失清单就绪</button>`;
      const btn = $("#avMissingChecklistReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失清单就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失清单就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系+姓名组合复制 */
  async function ensureHeirIdContactNameCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = "#" + it.id + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-id-contact-name")) return;
      el.dataset.idContactName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-name";
      btn.textContent = "复制编号联系姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactName || "");
        softBanner(ok ? "已复制编号联系姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数+品牌+待办数组合复制 */
  async function ensureHandoverItemCountBrandTodosCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountBrandTodosCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountBrandTodosCopyCard";
      card.className = "hand-item-count-brand-todos-copy";
      const exportBrand = $("#handExportTodosBrandCopyCard");
      const domainTodos = $("#handDomainTodosItemCountCopyCard");
      const brandTodos = $("#handBrandTodosExportCopyCard");
      if (exportBrand && exportBrand.parentNode)
        exportBrand.insertAdjacentElement("afterend", card);
      else if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else if (brandTodos && brandTodos.parentNode)
        brandTodos.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const brand = String(data.brand || "").trim() || "无品牌";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const combo = icount + " · " + brand + " · " + tcount;
      const line = "手册条目 · 品牌 · 待办 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-brand-todos-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountBrandTodosCopyBtn">复制条目品牌待办</button>`;
      const btn = $("#handItemCountBrandTodosCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目品牌待办" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目品牌待办暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+域名+英文品牌+就绪组合复制 + round 层含 110 */
  async function paintAppDomainBrandEnOkR110CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainBrandEnOkR110CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainBrandEnOkR110CopyCard";
      card.className = "card app-domain-brand-en-ok-r110-copy-card";
      const okDom = $("#okDomainAppVersionR109CopyCard");
      const brandEn = $("#brandEnAppOkDomainR108CopyCard");
      const appOk = $("#appOkBrandEnVersionR107CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + domain + " · " + en + " · " + ready;
      card.innerHTML = `<h3>应用 · 域名 · 英文品牌 · 就绪</h3>
        <p class="muted">一键复制应用名、域名、英文品牌与就绪状态（演示级）。</p>
        <p class="app-domain-brand-en-ok-r110-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainBrandEnOkR110CopyBtn">复制应用域名英文就绪</button>`;
      const btn = $("#appDomainBrandEnOkR110CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用域名英文就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 域名 · 英文品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList110() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 110;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 110); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round110 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkAppBrandEn().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionBeneficiaryCategoryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryVisibilityIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAtIntervalPlainR110Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceMetShortfallPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusTitleServiceCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingChecklistReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdContactNameCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountBrandTodosCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkAppBrandEn().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyActionBeneficiaryCategoryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryVisibilityIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAtIntervalPlainR110Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceMetShortfallPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusTitleServiceCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingChecklistReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdContactNameCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountBrandTodosCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainBrandEnOkR110CopyCard().catch(() => {});
        paintRoundLayerList110();
      }, 710);
      setTimeout(() => {
        paintAppDomainBrandEnOkR110CopyCard().catch(() => {});
        paintRoundLayerList110();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkAppBrandEn().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyActionBeneficiaryCategoryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetSummaryVisibilityIdCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAtIntervalPlainR110Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetShortfallPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusTitleServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingChecklistReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountBrandTodosCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainBrandEnOkR110CopyCard().catch(() => {});
      paintRoundLayerList110();
    }, 730);
  }
})();
