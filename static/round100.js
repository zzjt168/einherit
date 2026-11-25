/* 电子继承 · 第一百批增量（叠在 round99…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round100SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪英文版本冷静条 */
  async function paintHomeOkBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnVersionCalmBar";
      bar.className = "home-ok-brand-en-version-calm-bar";
      bar.setAttribute("role", "status");
      const appDom = $("#homeAppDomainVersionCalmBar");
      const brandOk = $("#homeBrandEnDomainOkCalmBar");
      const okDom = $("#homeOkDomainVersionCalmBar");
      if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = ready + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-mark">站点</span>
        <span class="muted home-ok-brand-en-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-mark">站点</span>
        <span class="muted home-ok-brand-en-version-calm-sub">就绪英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+动作+部门组合复制 */
  async function ensureLegacyTitleActionDeptCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const action = String(it.action || "").trim() || "未填动作";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = title + " · " + action + " · " + dept;
      el.dataset.titleActionDept = line;
      if (el.querySelector(".lg-copy-title-action-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-action-dept";
      btn.textContent = "复制标题动作部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleActionDept || "");
        softBanner(ok ? "已复制标题动作部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+摘要+可见度组合复制 */
  async function ensureAssetIdSummaryVisibilityCopyButtons() {
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
      const line = "#" + it.id + " · " + summary + " · " + vis;
      el.dataset.idSummaryVisibility = line;
      if (el.querySelector(".as-copy-id-summary-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-summary-visibility";
      btn.textContent = "复制编号摘要可见度";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idSummaryVisibility || "");
        softBanner(ok ? "已复制编号摘要可见度" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议标签 */
  async function ensureCheckinNextSuggestedLabelPlainR100Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedLabelPlainR100CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedLabelPlainR100CopyCard";
      card.className = "checkin-next-suggested-label-plain-r100-copy";
      const hours = $("#checkinIntervalHoursPlainR99CopyCard");
      const lastAt = $("#checkinLastCheckinAtPlainR98CopyCard");
      const secs = $("#checkinSecondsRemainingPlainR97CopyCard");
      if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (lastAt && lastAt.parentNode)
        lastAt.insertAdjacentElement("afterend", card);
      else if (secs && secs.parentNode)
        secs.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).next_suggested_label || "").trim() ||
        "—";
      const line =
        "下次建议 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-label-plain-r100-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedLabelPlainR100CopyBtn">复制下次建议标签</button>`;
      const btn = $("#checkinNextSuggestedLabelPlainR100CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制下次建议标签" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议标签暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+门槛+达标组合复制 */
  async function ensureTravelShortfallThresholdMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdMetPlainCopyCard";
      card.className = "travel-shortfall-threshold-met-plain-copy";
      const pctShort = $("#travelProgressPctShortfallPlainCopyCard");
      const metBal = $("#travelMetBalanceThresholdPlainCopyCard");
      const thrShort = $("#travelThresholdShortfallPlainR97CopyCard");
      if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
      else if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = short + " · " + thr + " · " + met;
      const line = "差旅缺口 · 门槛 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdMetPlainCopyBtn">复制缺口门槛达标</button>`;
      const btn = $("#travelShortfallThresholdMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口门槛达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口门槛达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+城市+预算组合复制 */
  async function ensureAftercareIdCityBudgetCopyButtons() {
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
      if (!it || it.id == null) return;
      const city = String(it.city || "").trim() || "未填城市";
      const budget =
        it.travel_budget == null
          ? "未填预算"
          : String(Math.round(Number(it.travel_budget)));
      const line = "#" + it.id + " · " + city + " · " + budget;
      el.dataset.idCityBudget = line;
      if (el.querySelector(".ac-copy-id-city-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-city-budget";
      btn.textContent = "复制编号城市预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCityBudget || "");
        softBanner(ok ? "已复制编号城市预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口+进度+就绪组合复制 */
  async function ensureAuthGateProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateProgressReadyCopyCard";
      card.className = "av-gate-progress-ready-copy";
      const checklist = $("#avChecklistProgressReadyCopyCard");
      const complete = $("#avCompleteGateReadyCopyCard");
      const readyMiss = $("#avReadyMissingCountCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = gate + " · " + done + "/" + total + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateProgressReadyCopyBtn">复制闸口进度就绪</button>`;
      const btn = $("#avGateProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制闸口进度就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">闸口进度就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+关系+联系组合复制 */
  async function ensureHeirRoleRelationContactCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = role + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-role-relation-contact")) return;
      el.dataset.roleRelationContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-relation-contact";
      btn.textContent = "复制角色关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleRelationContact || "");
        softBanner(ok ? "已复制角色关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+条目数+导出路径组合复制 */
  async function ensureHandoverBrandItemCountExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandItemCountExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandItemCountExportCopyCard";
      card.className = "hand-brand-item-count-export-copy";
      const todos = $("#handTodoCountExportPathCopyCard");
      const domBrand = $("#handDomainBrandR98CopyCard");
      const itemBrand = $("#handItemCountBrandR97CopyCard");
      if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "无品牌";
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = brand + " · " + count + " · " + path;
      const line = "手册品牌 · 条目 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-item-count-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandItemCountExportCopyBtn">复制品牌条目导出</button>`;
      const btn = $("#handBrandItemCountExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌条目导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌条目导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+域名+就绪+版本组合复制 + round 层含 100 */
  async function paintAppDomainOkVersionR100CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainOkVersionR100CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainOkVersionR100CopyCard";
      card.className = "card app-domain-ok-version-r100-copy-card";
      const brandEn = $("#brandEnDomainVersionR99CopyCard");
      const appOk = $("#appOkVersionR98CopyCard");
      const okBrand = $("#okBrandEnVersionR97CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = app + " · " + domain + " · " + ready + " · " + ver;
      card.innerHTML = `<h3>应用 · 域名 · 就绪 · 版本</h3>
        <p class="muted">一键复制应用名、域名、就绪状态与版本（演示级）。</p>
        <p class="app-domain-ok-version-r100-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainOkVersionR100CopyBtn">复制应用域名就绪版本</button>`;
      const btn = $("#appDomainOkVersionR100CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用域名就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 域名 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList100() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 100;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 100); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round100 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleActionDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdSummaryVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextSuggestedLabelPlainR100Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallThresholdMetPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdCityBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateProgressReadyCopy().catch(() => {}), 620);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRoleRelationContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandItemCountExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleActionDeptCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdSummaryVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextSuggestedLabelPlainR100Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallThresholdMetPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdCityBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateProgressReadyCopy().catch(() => {}), 640);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRoleRelationContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandItemCountExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainOkVersionR100CopyCard().catch(() => {});
        paintRoundLayerList100();
      }, 710);
      setTimeout(() => {
        paintAppDomainOkVersionR100CopyCard().catch(() => {});
        paintRoundLayerList100();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleActionDeptCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetIdSummaryVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedLabelPlainR100Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdCityBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandItemCountExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainOkVersionR100CopyCard().catch(() => {});
      paintRoundLayerList100();
    }, 730);
  }
})();
