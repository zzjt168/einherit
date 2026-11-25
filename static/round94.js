/* 电子继承 · 第九十四批增量（叠在 round93…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round94SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌版本冷静条 */
  async function paintHomeBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionCalmBar";
      bar.className = "home-brand-en-version-calm-bar";
      bar.setAttribute("role", "status");
      const appOk = $("#homeAppOkDomainCalmBar");
      const domVer = $("#homeDomainVersionCalmBar");
      const okEn = $("#homeOkBrandEnCalmBar");
      if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-calm-mark">品牌</span>
        <span class="muted home-brand-en-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-calm-mark">品牌</span>
        <span class="muted home-brand-en-version-calm-sub">英文品牌版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+处置+部门组合复制 */
  async function ensureLegacyIdActionDeptCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + action + " · " + dept;
      el.dataset.idActionDept = line;
      if (el.querySelector(".lg-copy-id-action-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-action-dept";
      btn.textContent = "复制编号处置部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idActionDept || "");
        softBanner(ok ? "已复制编号处置部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性+平台组合复制 */
  async function ensureAssetSummaryVisPlatformCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = summary + " · " + vis + " · " + platform;
      el.dataset.summaryVisPlatform = line;
      if (el.querySelector(".as-copy-summary-vis-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-vis-platform";
      btn.textContent = "复制摘要可见平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryVisPlatform || "");
        softBanner(ok ? "已复制摘要可见平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制建议报备时间 */
  async function ensureCheckinNextSuggestedAtPlainR94Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedAtPlainR94CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedAtPlainR94CopyCard";
      card.className = "checkin-next-suggested-at-plain-r94-copy";
      const readable = $("#checkinReadablePlainR93CopyCard");
      const lastAgo = $("#checkinLastAgoPlainR92CopyCard");
      const hours = $("#checkinHoursRemainingPlainR91CopyCard");
      if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
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
      const cd = st.countdown || {};
      const plain =
        String(cd.next_suggested_label || "").trim() ||
        (cd.next_suggested_at == null
          ? "—"
          : String(cd.next_suggested_at));
      const line =
        "报备建议 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-at-plain-r94-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedAtPlainR94CopyBtn">复制建议报备时间</button>`;
      const btn = $("#checkinNextSuggestedAtPlainR94CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制建议报备时间" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">建议报备时间暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口与余额组合复制 */
  async function ensureTravelShortfallBalancePlainR94Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalancePlainR94CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalancePlainR94CopyCard";
      card.className = "travel-shortfall-balance-plain-r94-copy";
      const metThr = $("#travelMetThresholdPlainR93CopyCard");
      const pctThr = $("#travelProgressPctThresholdPlainCopyCard");
      const shortMet = $("#travelShortfallMetPlainCopyCard");
      if (metThr && metThr.parentNode)
        metThr.insertAdjacentElement("afterend", card);
      else if (pctThr && pctThr.parentNode)
        pctThr.insertAdjacentElement("afterend", card);
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
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = short + " · " + bal;
      const line = "差旅缺口 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-plain-r94-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalancePlainR94CopyBtn">复制缺口余额文案</button>`;
      const btn = $("#travelShortfallBalancePlainR94CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+预算+城市组合复制 */
  async function ensureAftercareTitleBudgetCityCopyButtons() {
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
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const city = String(it.city || "").trim() || "未填城市";
      const line = title + " · " + budget + " · " + city;
      el.dataset.titleBudgetCity = line;
      if (el.querySelector(".ac-copy-title-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-budget-city";
      btn.textContent = "复制标题预算城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBudgetCity || "");
        softBanner(ok ? "已复制标题预算城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单条数与闸口组合复制 */
  async function ensureAuthChecklistGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistGateCopyCard";
      card.className = "av-checklist-gate-copy";
      const prog = $("#avProgressCompleteLabelCopyCard");
      const gate = $("#avGateCompleteComboCopyCard");
      const miss = $("#avMissingLabelsCompleteCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const combo = "清单 " + count + " · " + gate;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-gate-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistGateCopyBtn">复制清单与闸口</button>`;
      const btn = $("#avChecklistGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单与闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单与闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+口令提示组合复制 */
  async function ensureHeirIdRelationPassphraseCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + relation + " · " + phrase;
      if (el.querySelector(".bn-copy-id-relation-passphrase")) return;
      el.dataset.idRelationPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-passphrase";
      btn.textContent = "复制编号关系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationPassphrase || "");
        softBanner(ok ? "已复制编号关系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数与分享提示组合复制 */
  async function ensureHandoverTodoCountShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodoCountShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodoCountShareHintCopyCard";
      card.className = "hand-todo-count-share-hint-copy";
      const exportShare = $("#handExportPathShareHintR93CopyCard");
      const itemDom = $("#handItemCountDomainR92CopyCard");
      const pctShare = $("#handProgressPctShareHintCopyCard");
      if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else if (pctShare && pctShare.parentNode)
        pctShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todos = data.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = count + " · " + hint;
      const line = "手册待办 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-todo-count-share-hint-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodoCountShareHintCopyBtn">复制待办分享提示</button>`;
      const btn = $("#handTodoCountShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办分享提示" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办数与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+应用名+域名组合复制 + round 层含 94 */
  async function paintVersionAppDomainR94CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionAppDomainR94CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionAppDomainR94CopyCard";
      card.className = "card version-app-domain-r94-copy-card";
      const okDom = $("#okDomainBrandEnR93CopyCard");
      const verDom = $("#versionDomainBrandEnR92CopyCard");
      const appDom = $("#appDomainBrandEnR91CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · " + app + " · " + domain;
      card.innerHTML = `<h3>版本 · 应用 · 域名</h3>
        <p class="muted">一键复制版本、应用名与域名（演示级）。</p>
        <p class="version-app-domain-r94-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionAppDomainR94CopyBtn">复制版本应用域名</button>`;
      const btn = $("#versionAppDomainR94CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本应用域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 应用 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList94() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 94;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 94); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round94 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersion().catch(() => {}), 770);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdActionDeptCopyButtons().catch(() => {}),
      600
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryVisPlatformCopyButtons().catch(() => {}),
      600
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextSuggestedAtPlainR94Copy().catch(() => {}),
      590
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallBalancePlainR94Copy().catch(() => {}),
      610
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleBudgetCityCopyButtons().catch(() => {}),
      600
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthChecklistGateCopy().catch(() => {}), 570);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationPassphraseCopyButtons().catch(() => {}),
      600
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodoCountShareHintCopy().catch(() => {}),
      610
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersion().catch(() => {}), 770);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdActionDeptCopyButtons().catch(() => {}),
        620
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryVisPlatformCopyButtons().catch(() => {}),
        610
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextSuggestedAtPlainR94Copy().catch(() => {}),
        610
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallBalancePlainR94Copy().catch(() => {}),
        630
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleBudgetCityCopyButtons().catch(() => {}),
        620
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthChecklistGateCopy().catch(() => {}), 590);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationPassphraseCopyButtons().catch(() => {}),
        610
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodoCountShareHintCopy().catch(() => {}),
        620
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionAppDomainR94CopyCard().catch(() => {});
        paintRoundLayerList94();
      }, 660);
      setTimeout(() => {
        paintVersionAppDomainR94CopyCard().catch(() => {});
        paintRoundLayerList94();
      }, 1340);
    }
  };

  setTimeout(() => paintHomeBrandEnVersion().catch(() => {}), 820);
  setTimeout(
    () => ensureLegacyIdActionDeptCopyButtons().catch(() => {}),
    840
  );
  setTimeout(
    () => ensureAssetSummaryVisPlatformCopyButtons().catch(() => {}),
    860
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedAtPlainR94Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalancePlainR94Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodoCountShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionAppDomainR94CopyCard().catch(() => {});
      paintRoundLayerList94();
    }, 680);
  }
})();
