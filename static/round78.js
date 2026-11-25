/* 电子继承 · 第七十八批增量（叠在 round77…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round78SoftBanner_" + (hostId || "home");
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

  function yn(v) {
    return truthyFlag(v) ? "是" : "否";
  }

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
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

  /* 1 · 首页品牌与域名冷静条 */
  async function paintHomeBrandDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainBar";
      bar.className = "home-brand-domain-bar";
      bar.setAttribute("role", "status");
      const name = $("#homeNameBar");
      const until = $("#homeMemberUntilBar");
      const inGrace = $("#homeInGraceBar");
      if (name && name.parentNode === home)
        name.insertAdjacentElement("afterend", bar);
      else if (until && until.parentNode === home)
        until.insertAdjacentElement("afterend", bar);
      else if (inGrace && inGrace.parentNode === home)
        inGrace.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      let brand = "";
      let domain = "";
      try {
        const st = await api("/api/checkin/status");
        brand = String((st.user || {}).brand || "").trim();
        domain = String((st.user || {}).domain || "").trim();
      } catch (_) {}
      if (!brand || !domain) {
        const h = await api("/api/health");
        brand = brand || String(h.app || h.brand || "电子继承 App").trim();
        domain = domain || String(h.domain || "einherit.cn").trim();
      }
      const sub = brand + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-mark">品牌</span>
        <span class="muted home-brand-domain-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainGo">去设置</button>`;
      const btn = $("#homeBrandDomainGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-mark">品牌</span>
        <span class="muted home-brand-domain-sub">品牌与域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainGo">去设置</button>`;
      const btn = $("#homeBrandDomainGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+处置+部门组合复制 */
  async function ensureLegacyCategoryActionDeptCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = cat + " · " + action + " · " + dept;
      el.dataset.categoryActionDept = line;
      if (el.querySelector(".lg-copy-category-action-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-action-dept";
      btn.textContent = "复制分类处置部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryActionDept || "");
        softBanner(ok ? "已复制分类处置部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+平台+可见性组合复制 */
  async function ensureAssetIdPlatformVisCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const line = "#" + it.id + " · " + platform + " · " + vis;
      el.dataset.idPlatformVis = line;
      if (el.querySelector(".as-copy-id-platform-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-platform-vis";
      btn.textContent = "复制编号平台可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlatformVis || "");
        softBanner(ok ? "已复制编号平台可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制临近到期布尔 */
  async function ensureCheckinDueSoonPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueSoonPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueSoonPlainCopyCard";
      card.className = "checkin-due-soon-plain-copy";
      const hours = $("#checkinHoursRemainingPlainCopyCard");
      const hint = $("#checkinMemberGentleHintPlainCopyCard");
      const inGrace = $("#checkinInGracePlainCopyCard");
      if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (hint && hint.parentNode)
        hint.insertAdjacentElement("afterend", card);
      else if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const due = yn((st.countdown || {}).due_soon);
      const combo = "临近到期·" + due;
      const line =
        "报备临近到期 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-due-soon-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDueSoonPlainCopyBtn">复制临近到期布尔</button>`;
      const btn = $("#checkinDueSoonPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制临近到期布尔" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">临近到期状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差与余额组合复制 */
  async function ensureTravelShortfallBalanceCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceCopyCard";
      card.className = "travel-shortfall-balance-copy";
      const amtKind = $("#travelRefundAmountKindCopyCard");
      const ledger = $("#travelLedgerIdAmountCopyCard");
      const refund = $("#travelRefundIdKindCopyCard");
      if (amtKind && amtKind.parentNode)
        amtKind.insertAdjacentElement("afterend", card);
      else if (ledger && ledger.parentNode)
        ledger.insertAdjacentElement("afterend", card);
      else if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall = fund.shortfall;
      const bal = fund.balance;
      if (shortfall == null && bal == null) {
        card.innerHTML = `<p class="muted">短差与余额暂不可用</p>`;
        return;
      }
      const shortPart =
        shortfall == null ? "—" : String(Math.round(Number(shortfall)));
      const balPart = bal == null ? "—" : String(Math.round(Number(bal)));
      const combo = shortPart + " · " + balPart;
      const line = "差旅短差 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceCopyBtn">复制短差与余额</button>`;
      const btn = $("#travelShortfallBalanceCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差与余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差与余额暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+阶段+预算组合复制 */
  async function ensureAftercareTitlePhaseBudgetCopyButtons() {
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
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = title + " · " + phase + " · " + budget;
      el.dataset.titlePhaseBudget = line;
      if (el.querySelector(".ac-copy-title-phase-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-phase-budget";
      btn.textContent = "复制标题阶段预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titlePhaseBudget || "");
        softBanner(ok ? "已复制标题阶段预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门闩文案与齐备文案组合复制 */
  async function ensureAuthGateCompleteLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateCompleteLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateCompleteLabelCopyCard";
      card.className = "av-gate-complete-label-copy";
      const active = $("#avActiveLabelReadyCopyCard");
      const checklist = $("#avChecklistCountReadyCopyCard");
      const missing = $("#avMissingCountReadyCopyCard");
      if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无门闩说明";
      const complete =
        String(data.complete_label || "").trim() || "无齐备说明";
      const combo = gate + " · " + complete;
      const line = "授权视频门闩 · 齐备 · " + combo;
      card.innerHTML = `<p class="muted av-gate-complete-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateCompleteLabelCopyBtn">复制门闩与齐备</button>`;
      const btn = $("#avGateCompleteLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门闩与齐备" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门闩与齐备暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+联系+关系组合复制 */
  async function ensureHeirRoleContactRelationCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = role + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-role-contact-relation")) return;
      el.dataset.roleContactRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-contact-relation";
      btn.textContent = "复制角色联系关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleContactRelation || "");
        softBanner(ok ? "已复制角色联系关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径与域名组合复制 */
  async function ensureHandoverExportPathDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathDomainCopyCard";
      card.className = "hand-export-path-domain-copy";
      const memberBrand = $("#handMemberBrandCopyCard");
      const pctDom = $("#handPctDomainCopyCard");
      const execBrand = $("#handExecutorBrandCopyCard");
      if (memberBrand && memberBrand.parentNode)
        memberBrand.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (execBrand && execBrand.parentNode)
        execBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "").trim() || "无导出路径";
      const domain = String(data.domain || "").trim();
      const combo = domain ? path + " · " + domain : path;
      const line = "手册导出 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-export-path-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportPathDomainCopyBtn">复制导出路径域名</button>`;
      const btn = $("#handExportPathDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出路径域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出路径与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+中文品牌+英文品牌组合复制 + round 层含 78 */
  async function paintOkAppBrandEnR78CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okAppBrandEnR78CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okAppBrandEnR78CopyCard";
      card.className = "card ok-app-brand-en-r78-copy-card";
      const verDom = $("#appVersionDomainR77CopyCard");
      const serverEn = $("#serverBrandEnR76CopyCard");
      const appOk = $("#appBrandOkR75CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (serverEn && serverEn.parentNode)
        serverEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = "ok·" + okPart + " · " + app + " · " + en;
      card.innerHTML = `<h3>就绪 · 中英品牌</h3>
        <p class="muted">一键复制就绪状态与中英文品牌（演示级）。</p>
        <p class="ok-app-brand-en-r78-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okAppBrandEnR78CopyBtn">复制就绪应用英文</button>`;
      const btn = $("#okAppBrandEnR78CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪应用英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 中英品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList78() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 78;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 78); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round78 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomain().catch(() => {}), 610);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryActionDeptCopyButtons().catch(() => {}),
      440
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdPlatformVisCopyButtons().catch(() => {}),
      440
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinDueSoonPlainCopy().catch(() => {}), 430);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallBalanceCopy().catch(() => {}), 450);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitlePhaseBudgetCopyButtons().catch(() => {}),
      440
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateCompleteLabelCopy().catch(() => {}), 410);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRoleContactRelationCopyButtons().catch(() => {}),
      440
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExportPathDomainCopy().catch(() => {}), 450);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomain().catch(() => {}), 610);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryActionDeptCopyButtons().catch(() => {}),
        460
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdPlatformVisCopyButtons().catch(() => {}),
        450
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinDueSoonPlainCopy().catch(() => {}), 450);
    if (id === "travel")
      setTimeout(() => ensureTravelShortfallBalanceCopy().catch(() => {}), 470);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitlePhaseBudgetCopyButtons().catch(() => {}),
        460
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateCompleteLabelCopy().catch(() => {}), 430);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRoleContactRelationCopyButtons().catch(() => {}),
        450
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverExportPathDomainCopy().catch(() => {}), 460);
    if (id === "settings") {
      setTimeout(() => {
        paintOkAppBrandEnR78CopyCard().catch(() => {});
        paintRoundLayerList78();
      }, 500);
      setTimeout(() => {
        paintOkAppBrandEnR78CopyCard().catch(() => {});
        paintRoundLayerList78();
      }, 1080);
    }
  };

  setTimeout(() => paintHomeBrandDomain().catch(() => {}), 660);
  setTimeout(
    () => ensureLegacyCategoryActionDeptCopyButtons().catch(() => {}),
    680
  );
  setTimeout(() => ensureAssetIdPlatformVisCopyButtons().catch(() => {}), 700);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueSoonPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitlePhaseBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateCompleteLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleContactRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkAppBrandEnR78CopyCard().catch(() => {});
      paintRoundLayerList78();
    }, 520);
  }
})();
