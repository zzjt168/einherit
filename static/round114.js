/* 电子继承 · 第一百一十四批增量（叠在 round113…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round114SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪域名版本冷静条 */
  async function paintHomeOkDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkDomainVersionCalmBarR114");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkDomainVersionCalmBarR114";
      bar.className = "home-ok-domain-version-calm-bar-r114";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnVersionOkCalmBar");
      const appOk = $("#homeAppOkDomainCalmBarR112");
      const domVer = $("#homeDomainVersionAppCalmBar");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = ready + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-version-calm-bar-r114-mark">状态</span>
        <span class="muted home-ok-domain-version-calm-bar-r114-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainVersionCalmGoR114">去设置</button>`;
      const btn = $("#homeOkDomainVersionCalmGoR114");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-version-calm-bar-r114-mark">状态</span>
        <span class="muted home-ok-domain-version-calm-bar-r114-sub">就绪域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainVersionCalmGoR114">去设置</button>`;
      const btn = $("#homeOkDomainVersionCalmGoR114");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割动作+部门+编号组合复制 */
  async function ensureLegacyActionDeptIdCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填动作";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = action + " · " + dept + " · #" + it.id;
      el.dataset.actionDeptId = line;
      if (el.querySelector(".lg-copy-action-dept-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-dept-id";
      btn.textContent = "复制动作部门编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionDeptId || "");
        softBanner(ok ? "已复制动作部门编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+可见度+编号组合复制 */
  async function ensureAssetPlatformVisibilityIdCopyButtons() {
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
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = platform + " · " + vis + " · #" + it.id;
      el.dataset.platformVisibilityId = line;
      if (el.querySelector(".as-copy-platform-visibility-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-visibility-id";
      btn.textContent = "复制平台可见编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformVisibilityId || "");
        softBanner(ok ? "已复制平台可见编号" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制标签间隔文案 */
  async function ensureCheckinLabelIntervalPlainR114Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLabelIntervalPlainR114CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLabelIntervalPlainR114CopyCard";
      card.className = "checkin-label-interval-plain-r114-copy";
      const secLeft = $("#checkinSecondsLeftPlainR113CopyCard");
      const readable = $("#checkinReadableGracePlainR112CopyCard");
      const hoursLeft = $("#checkinHoursLeftDuePlainR111CopyCard");
      if (secLeft && secLeft.parentNode)
        secLeft.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (hoursLeft && hoursLeft.parentNode)
        hoursLeft.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const label = String(cd.countdown_label || "").trim() || "—";
      const intRaw = cd.interval_hours;
      const hours =
        intRaw == null || intRaw === ""
          ? "—"
          : String(Math.round(Number(intRaw) * 100) / 100);
      const combo = label + " · " + hours;
      const line =
        "报备标签 · 间隔 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-label-interval-plain-r114-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLabelIntervalPlainR114CopyBtn">复制标签间隔文案R114</button>`;
      const btn = $("#checkinLabelIntervalPlainR114CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制标签间隔文案R114" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">标签间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+进度百分比组合复制 */
  async function ensureTravelBalanceThresholdPctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdPctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdPctPlainCopyCard";
      card.className = "travel-balance-threshold-pct-plain-copy";
      const shortPct = $("#travelShortfallPctMetPlainR113CopyCard");
      const pctBal = $("#travelPctBalanceThresholdPlainCopyCard");
      const thrBal = $("#travelThresholdBalanceMetPlainCopyCard");
      if (shortPct && shortPct.parentNode)
        shortPct.insertAdjacentElement("afterend", card);
      else if (pctBal && pctBal.parentNode)
        pctBal.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const combo = bal + " · " + thr + " · " + pctStr;
      const line =
        "差旅余额 · 门槛 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdPctPlainCopyBtn">复制余额门槛进度</button>`;
      const btn = $("#travelBalanceThresholdPctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+城市+状态组合复制 */
  async function ensureAftercareIdCityStatusCopyButtons() {
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
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const line = "#" + it.id + " · " + city + " · " + status;
      el.dataset.idCityStatus = line;
      if (el.querySelector(".ac-copy-id-city-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-city-status";
      btn.textContent = "复制编号城市状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCityStatus || "");
        softBanner(ok ? "已复制编号城市状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失数+就绪+完成组合复制 */
  async function ensureAuthMissingReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingReadyCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingReadyCompleteCopyCard";
      card.className = "av-missing-ready-complete-copy";
      const completeGate = $("#avCompleteGateChecklistCopyCard");
      const readyGate = $("#avReadyGateMissingCopyCard");
      const checklist = $("#avChecklistCountCompleteCopyCard");
      if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo =
        "缺失 " + missing.length + " · " + ready + " · " + doneFlag;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-ready-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingReadyCompleteCopyBtn">复制缺失就绪完成</button>`;
      const btn = $("#avMissingReadyCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+编号+关系组合复制 */
  async function ensureHeirNameIdRelationCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = name + " · #" + it.id + " · " + relation;
      if (el.querySelector(".bn-copy-name-id-relation")) return;
      el.dataset.nameIdRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-id-relation";
      btn.textContent = "复制姓名编号关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameIdRelation || "");
        softBanner(ok ? "已复制姓名编号关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+品牌+导出路径组合复制 */
  async function ensureHandoverDomainBrandExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainBrandExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainBrandExportCopyCard";
      card.className = "hand-domain-brand-export-copy";
      const todos = $("#handTodosExportItemCountCopyCard");
      const exportDom = $("#handExportDomainTodosCopyCard");
      const brandDom = $("#handBrandDomainItemCountCopyCard");
      if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "").trim() || "无域名";
      const brand = String(data.brand || "").trim() || "无品牌";
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const combo = domain + " · " + brand + " · " + exportPath;
      const line = "手册域名 · 品牌 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-brand-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainBrandExportCopyBtn">复制域名品牌导出</button>`;
      const btn = $("#handDomainBrandExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名品牌导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名品牌导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+版本+英文品牌+就绪组合复制 + round 层含 114 */
  async function paintAppVersionBrandEnOkR114CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appVersionBrandEnOkR114CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appVersionBrandEnOkR114CopyCard";
      card.className = "card app-version-brand-en-ok-r114-copy-card";
      const verOk = $("#versionOkDomainBrandEnR113CopyCard");
      const okBrand = $("#okBrandEnDomainAppR112CopyCard");
      const domApp = $("#domainAppVersionOkR111CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (domApp && domApp.parentNode)
        domApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + ver + " · " + en + " · " + ready;
      card.innerHTML = `<h3>应用 · 版本 · 英文品牌 · 就绪</h3>
        <p class="muted">一键复制应用名、版本、英文品牌与就绪状态（演示级）。</p>
        <p class="app-version-brand-en-ok-r114-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appVersionBrandEnOkR114CopyBtn">复制应用版本英文就绪</button>`;
      const btn = $("#appVersionBrandEnOkR114CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用版本英文就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 版本 · 英文品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList114() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 114;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 114); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round114 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionDeptIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformVisibilityIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLabelIntervalPlainR114Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceThresholdPctPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdCityStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameIdRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainBrandExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionDeptIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformVisibilityIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLabelIntervalPlainR114Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceThresholdPctPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdCityStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameIdRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainBrandExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppVersionBrandEnOkR114CopyCard().catch(() => {});
        paintRoundLayerList114();
      }, 710);
      setTimeout(() => {
        paintAppVersionBrandEnOkR114CopyCard().catch(() => {});
        paintRoundLayerList114();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyActionDeptIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformVisibilityIdCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLabelIntervalPlainR114Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdPctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdCityStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameIdRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainBrandExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppVersionBrandEnOkR114CopyCard().catch(() => {});
      paintRoundLayerList114();
    }, 730);
  }
})();
