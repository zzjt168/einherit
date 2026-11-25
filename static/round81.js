/* 电子继承 · 第八十一批增量（叠在 round80…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round81SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名冷静条 */
  async function paintHomeDomainOnly() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainOnlyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainOnlyBar";
      bar.className = "home-domain-only-bar";
      bar.setAttribute("role", "status");
      const uid = $("#homeUserIdCalmBar");
      const escState = $("#homeEscalationStateBar");
      const brand = $("#homeBrandDomainBar");
      if (uid && uid.parentNode === home)
        uid.insertAdjacentElement("afterend", bar);
      else if (escState && escState.parentNode === home)
        escState.insertAdjacentElement("afterend", bar);
      else if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      let domain = "";
      try {
        const st = await api("/api/checkin/status");
        domain = String((st.user || {}).domain || "").trim();
      } catch (_) {}
      if (!domain) {
        const h = await api("/api/health");
        domain = String(h.domain || "einherit.cn").trim();
      }
      const sub = "域名 · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-only-mark">站点</span>
        <span class="muted home-domain-only-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainOnlyGo">去设置</button>`;
      const btn = $("#homeDomainOnlyGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-only-mark">站点</span>
        <span class="muted home-domain-only-sub">域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainOnlyGo">去设置</button>`;
      const btn = $("#homeDomainOnlyGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+部门组合复制 */
  async function ensureLegacyTitleBeneficiaryDeptCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = title + " · " + ben + " · " + dept;
      el.dataset.titleBeneficiaryDept = line;
      if (el.querySelector(".lg-copy-title-beneficiary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-dept";
      btn.textContent = "复制标题受益人部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryDept || "");
        softBanner(ok ? "已复制标题受益人部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+摘要+标签组合复制 */
  async function ensureAssetIdSummaryTagCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "未填摘要";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = "#" + it.id + " · " + summary + " · " + tag;
      el.dataset.idSummaryTag = line;
      if (el.querySelector(".as-copy-id-summary-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-summary-tag";
      btn.textContent = "复制编号摘要标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idSummaryTag || "");
        softBanner(ok ? "已复制编号摘要标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次报备文案 */
  async function ensureCheckinLastAgoLabelPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoLabelPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoLabelPlainCopyCard";
      card.className = "checkin-last-ago-label-plain-copy";
      const cd = $("#checkinCountdownLabelPlainCopyCard");
      const soft = $("#checkinSoftOverduePlainCopyCard");
      const due = $("#checkinDueSoonPlainCopyCard");
      if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else if (soft && soft.parentNode)
        soft.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).last_ago_label || "").trim() ||
        "暂无上次报备文案";
      const line =
        "上次报备 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-label-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoLabelPlainCopyBtn">复制上次报备文案</button>`;
      const btn = $("#checkinLastAgoLabelPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制上次报备文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次报备文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与进度百分比组合复制 */
  async function ensureTravelMetProgressLabelCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetProgressLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetProgressLabelCopyCard";
      card.className = "travel-met-progress-label-copy";
      const pctMet = $("#travelProgressPctMetCopyCard");
      const metAmt = $("#travelMetThresholdAmountCopyCard");
      const shortBal = $("#travelShortfallBalanceCopyCard");
      if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (metAmt && metAmt.parentNode)
        metAmt.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct))) + "%";
      const combo = met + " · " + pct;
      const line = "差旅达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-progress-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetProgressLabelCopyBtn">复制达标进度文案</button>`;
      const btn = $("#travelMetProgressLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标进度文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段+预算+城市组合复制 */
  async function ensureAftercarePhaseBudgetCityCopyButtons() {
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
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const city = String(it.city || "").trim() || "未填城市";
      const line = phase + " · " + budget + " · " + city;
      el.dataset.phaseBudgetCity = line;
      if (el.querySelector(".ac-copy-phase-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-budget-city";
      btn.textContent = "复制阶段预算城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseBudgetCity || "");
        softBanner(ok ? "已复制阶段预算城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门闩文案与就绪组合复制 */
  async function ensureAuthGateReadyComboCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateReadyComboCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateReadyComboCopyCard";
      card.className = "av-gate-ready-combo-copy";
      const scriptReady = $("#avScriptCountReadyCopyCard");
      const prog = $("#avProgressDoneTotalCopyCard");
      const gate = $("#avGateCompleteLabelCopyCard");
      if (scriptReady && scriptReady.parentNode)
        scriptReady.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无门闩说明";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = gate + " · " + ready;
      const line = "授权视频门闩 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-gate-ready-combo-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateReadyComboCopyBtn">复制门闩就绪组合</button>`;
      const btn = $("#avGateReadyComboCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门闩就绪组合" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门闩就绪组合暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+联系组合复制 */
  async function ensureHeirIdRelationContactCopyButtons() {
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
      const line = "#" + it.id + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-id-relation-contact")) return;
      el.dataset.idRelationContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-contact";
      btn.textContent = "复制编号关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationContact || "");
        softBanner(ok ? "已复制编号关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径与品牌组合复制 */
  async function ensureHandoverExportPathBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathBrandCopyCard";
      card.className = "hand-export-path-brand-copy";
      const shareDom = $("#handShareHintDomainCopyCard");
      const todoBrand = $("#handTodoCountBrandCopyCard");
      const exportDom = $("#handExportPathDomainCopyCard");
      if (shareDom && shareDom.parentNode)
        shareDom.insertAdjacentElement("afterend", card);
      else if (todoBrand && todoBrand.parentNode)
        todoBrand.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "").trim() || "无导出路径";
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = path + " · " + brand;
      const line = "手册导出 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-export-path-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportPathBrandCopyBtn">复制导出路径品牌</button>`;
      const btn = $("#handExportPathBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出路径品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出路径与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+就绪+域名组合复制 + round 层含 81 */
  async function paintAppOkDomainR81CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkDomainR81CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkDomainR81CopyCard";
      card.className = "card app-ok-domain-r81-copy-card";
      const server = $("#serverVersionOkDomainR80CopyCard");
      const verOk = $("#versionOkDomainR79CopyCard");
      const okApp = $("#okAppBrandEnR78CopyCard");
      const roundList = $("#roundLayerListCard");
      if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = app + " · ok·" + okPart + " · " + domain;
      card.innerHTML = `<h3>中文品牌 · 就绪 · 域名</h3>
        <p class="muted">一键复制中文品牌、就绪状态与域名（演示级）。</p>
        <p class="app-ok-domain-r81-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkDomainR81CopyBtn">复制应用就绪域名</button>`;
      const btn = $("#appOkDomainR81CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList81() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 81;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 81); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round81 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainOnly().catch(() => {}), 640);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleBeneficiaryDeptCopyButtons().catch(() => {}),
      470
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdSummaryTagCopyButtons().catch(() => {}),
      470
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoLabelPlainCopy().catch(() => {}),
      460
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMetProgressLabelCopy().catch(() => {}), 480);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseBudgetCityCopyButtons().catch(() => {}),
      470
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateReadyComboCopy().catch(() => {}), 440);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationContactCopyButtons().catch(() => {}),
      470
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExportPathBrandCopy().catch(() => {}), 480);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainOnly().catch(() => {}), 640);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleBeneficiaryDeptCopyButtons().catch(() => {}),
        490
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdSummaryTagCopyButtons().catch(() => {}),
        480
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoLabelPlainCopy().catch(() => {}),
        480
      );
    if (id === "travel")
      setTimeout(() => ensureTravelMetProgressLabelCopy().catch(() => {}), 500);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseBudgetCityCopyButtons().catch(() => {}),
        490
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateReadyComboCopy().catch(() => {}), 460);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationContactCopyButtons().catch(() => {}),
        480
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverExportPathBrandCopy().catch(() => {}), 490);
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkDomainR81CopyCard().catch(() => {});
        paintRoundLayerList81();
      }, 530);
      setTimeout(() => {
        paintAppOkDomainR81CopyCard().catch(() => {});
        paintRoundLayerList81();
      }, 1140);
    }
  };

  setTimeout(() => paintHomeDomainOnly().catch(() => {}), 690);
  setTimeout(
    () => ensureLegacyTitleBeneficiaryDeptCopyButtons().catch(() => {}),
    710
  );
  setTimeout(() => ensureAssetIdSummaryTagCopyButtons().catch(() => {}), 730);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoLabelPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetProgressLabelCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateReadyComboCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkDomainR81CopyCard().catch(() => {});
      paintRoundLayerList81();
    }, 550);
  }
})();
