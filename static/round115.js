/* 电子继承 · 第一百一十五批增量（叠在 round114…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round115SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本英文应用冷静条 */
  async function paintHomeVersionBrandEnApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandEnAppCalmBarR115");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandEnAppCalmBarR115";
      bar.className = "home-version-brand-en-app-calm-bar-r115";
      bar.setAttribute("role", "status");
      const okDom = $("#homeOkDomainVersionCalmBarR114");
      const brandEn = $("#homeBrandEnVersionOkCalmBar");
      const appOk = $("#homeAppOkDomainCalmBarR112");
      if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const app = String(h.app || "电子继承 App").trim();
      const sub = ver + " · " + en + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-en-app-calm-bar-r115-mark">版本</span>
        <span class="muted home-version-brand-en-app-calm-bar-r115-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandEnAppCalmGoR115">去设置</button>`;
      const btn = $("#homeVersionBrandEnAppCalmGoR115");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-en-app-calm-bar-r115-mark">版本</span>
        <span class="muted home-version-brand-en-app-calm-bar-r115-sub">版本英文应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandEnAppCalmGoR115">去设置</button>`;
      const btn = $("#homeVersionBrandEnAppCalmGoR115");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+编号+备注组合复制 */
  async function ensureLegacyCategoryIdNotesCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = cat + " · #" + it.id + " · " + notes;
      el.dataset.categoryIdNotes = line;
      if (el.querySelector(".lg-copy-category-id-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-id-notes";
      btn.textContent = "复制分类编号备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryIdNotes || "");
        softBanner(ok ? "已复制分类编号备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+提示组合复制 */
  async function ensureAssetSummaryTagHintCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const line = summary + " · " + tag + " · " + hint;
      el.dataset.summaryTagHint = line;
      if (el.querySelector(".as-copy-summary-tag-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-hint";
      btn.textContent = "复制摘要标签提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagHint || "");
        softBanner(ok ? "已复制摘要标签提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近标签小时文案 */
  async function ensureCheckinLastLabelHoursPlainR115Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastLabelHoursPlainR115CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastLabelHoursPlainR115CopyCard";
      card.className = "checkin-last-label-hours-plain-r115-copy";
      const labelInt = $("#checkinLabelIntervalPlainR114CopyCard");
      const secLeft = $("#checkinSecondsLeftPlainR113CopyCard");
      const readable = $("#checkinReadableGracePlainR112CopyCard");
      if (labelInt && labelInt.parentNode)
        labelInt.insertAdjacentElement("afterend", card);
      else if (secLeft && secLeft.parentNode)
        secLeft.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const lastLabel = String(cd.last_checkin_label || "").trim() || "—";
      const sinceRaw = cd.hours_since_last;
      const since =
        sinceRaw == null || sinceRaw === ""
          ? "—"
          : String(Math.round(Number(sinceRaw) * 100) / 100);
      const combo = lastLabel + " · " + since;
      const line =
        "最近报备标签 · 距今小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-label-hours-plain-r115-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastLabelHoursPlainR115CopyBtn">复制最近标签小时R115</button>`;
      const btn = $("#checkinLastLabelHoursPlainR115CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制最近标签小时R115" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近标签小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+余额+达标组合复制 */
  async function ensureTravelShortfallBalanceMetPlainR115Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceMetPlainR115CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceMetPlainR115CopyCard";
      card.className = "travel-shortfall-balance-met-plain-r115-copy";
      const balThr = $("#travelBalanceThresholdPctPlainCopyCard");
      const shortPct = $("#travelShortfallPctMetPlainR113CopyCard");
      const pctBal = $("#travelPctBalanceThresholdPlainCopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (shortPct && shortPct.parentNode)
        shortPct.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = short + " · " + bal + " · " + met;
      const line =
        "差旅缺口 · 余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-met-plain-r115-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceMetPlainR115CopyBtn">复制缺口余额达标R115</button>`;
      const btn = $("#travelShortfallBalanceMetPlainR115CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额达标R115" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后拜访偏好+城市+服务类型组合复制 */
  async function ensureAftercareVisitCityServiceCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const svc = String(it.service_type || "").trim() || "未填服务";
      const line = visit + " · " + city + " · " + svc;
      el.dataset.visitCityService = line;
      if (el.querySelector(".ac-copy-visit-city-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-city-service";
      btn.textContent = "复制拜访城市服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitCityService || "");
        softBanner(ok ? "已复制拜访城市服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口+就绪+清单数组合复制 */
  async function ensureAuthGateReadyChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateReadyChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateReadyChecklistCopyCard";
      card.className = "av-gate-ready-checklist-copy";
      const missReady = $("#avMissingReadyCompleteCopyCard");
      const completeGate = $("#avCompleteGateChecklistCopyCard");
      const readyGate = $("#avReadyGateMissingCopyCard");
      if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = truthyFlag(data.gate) ? "闸口开" : "闸口关";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo = gate + " · " + ready + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-ready-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateReadyChecklistCopyBtn">复制闸口就绪清单</button>`;
      const btn = $("#avGateReadyChecklistCopyBtn");
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

  /* 8 · 受益人联系+编号+角色组合复制 */
  async function ensureHeirContactIdRoleCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const line = contact + " · #" + it.id + " · " + role;
      if (el.querySelector(".bn-copy-contact-id-role")) return;
      el.dataset.contactIdRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-id-role";
      btn.textContent = "复制联系编号角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactIdRole || "");
        softBanner(ok ? "已复制联系编号角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数+导出路径+品牌组合复制 */
  async function ensureHandoverItemCountExportBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountExportBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountExportBrandCopyCard";
      card.className = "hand-item-count-export-brand-copy";
      const domBrand = $("#handDomainBrandExportCopyCard");
      const todos = $("#handTodosExportItemCountCopyCard");
      const exportDom = $("#handExportDomainTodosCopyCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
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
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = icount + " · " + exportPath + " · " + brand;
      const line = "手册条目 · 导出 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-export-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountExportBrandCopyBtn">复制条目导出品牌</button>`;
      const btn = $("#handItemCountExportBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目导出品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目导出品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+应用名+英文品牌组合复制 + round 层含 115 */
  async function paintDomainOkAppBrandEnR115CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainOkAppBrandEnR115CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainOkAppBrandEnR115CopyCard";
      card.className = "card domain-ok-app-brand-en-r115-copy-card";
      const appVer = $("#appVersionBrandEnOkR114CopyCard");
      const verOk = $("#versionOkDomainBrandEnR113CopyCard");
      const okBrand = $("#okBrandEnDomainAppR112CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + ready + " · " + app + " · " + en;
      card.innerHTML = `<h3>域名 · 就绪 · 应用 · 英文品牌</h3>
        <p class="muted">一键复制域名、就绪状态、应用名与英文品牌（演示级）。</p>
        <p class="domain-ok-app-brand-en-r115-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainOkAppBrandEnR115CopyBtn">复制域名就绪应用英文</button>`;
      const btn = $("#domainOkAppBrandEnR115CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪应用英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 应用 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList115() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 115;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 115); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round115 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandEnApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryIdNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastLabelHoursPlainR115Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallBalanceMetPlainR115Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitCityServiceCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthGateReadyChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactIdRoleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountExportBrandCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandEnApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryIdNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastLabelHoursPlainR115Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallBalanceMetPlainR115Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitCityServiceCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthGateReadyChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactIdRoleCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountExportBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkAppBrandEnR115CopyCard().catch(() => {});
        paintRoundLayerList115();
      }, 710);
      setTimeout(() => {
        paintDomainOkAppBrandEnR115CopyCard().catch(() => {});
        paintRoundLayerList115();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeVersionBrandEnApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyCategoryIdNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetSummaryTagHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastLabelHoursPlainR115Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceMetPlainR115Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitCityServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateReadyChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactIdRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountExportBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkAppBrandEnR115CopyCard().catch(() => {});
      paintRoundLayerList115();
    }, 730);
  }
})();
