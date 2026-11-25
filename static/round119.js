/* 电子继承 · 第一百一十九批增量（叠在 round118…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round119SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文域名应用冷静条 */
  async function paintHomeOkBrandEnDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnDomainCalmBarR119");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnDomainCalmBarR119";
      bar.className = "home-ok-brand-en-domain-calm-bar-r119";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnDomainAppCalmBarR118");
      const appOk = $("#homeAppOkVersionCalmBarR117");
      const domOk = $("#homeDomainOkBrandEnCalmBarR116");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ready + " · " + en + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-domain-calm-bar-r119-mark">状态</span>
        <span class="muted home-ok-brand-en-domain-calm-bar-r119-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnDomainCalmGoR119">去设置</button>`;
      const btn = $("#homeOkBrandEnDomainCalmGoR119");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-domain-calm-bar-r119-mark">状态</span>
        <span class="muted home-ok-brand-en-domain-calm-bar-r119-sub">就绪英文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnDomainCalmGoR119">去设置</button>`;
      const btn = $("#homeOkBrandEnDomainCalmGoR119");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+备注+编号组合复制 */
  async function ensureLegacyBeneficiaryNotesIdCopyButtons() {
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
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = bene + " · " + notes + " · #" + it.id;
      el.dataset.beneficiaryNotesId = line;
      if (el.querySelector(".lg-copy-beneficiary-notes-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-notes-id";
      btn.textContent = "复制受益人备注编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryNotesId || "");
        softBanner(ok ? "已复制受益人备注编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘部门+可见度+摘要组合复制 */
  async function ensureAssetDeptVisibilitySummaryCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const summary = String(it.summary || "").trim() || "无摘要";
      const line = dept + " · " + vis + " · " + summary;
      el.dataset.deptVisibilitySummary = line;
      if (el.querySelector(".as-copy-dept-visibility-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dept-visibility-summary";
      btn.textContent = "复制部门可见摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptVisibilitySummary || "");
        softBanner(ok ? "已复制部门可见摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限+可读文案 */
  async function ensureCheckinGraceReadablePlainR119Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceReadablePlainR119CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceReadablePlainR119CopyCard";
      card.className = "checkin-grace-readable-plain-r119-copy";
      const nextSec = $("#checkinNextLabelSecondsPlainR118CopyCard");
      const readable = $("#checkinReadableIntervalPlainR117CopyCard");
      const agoGrace = $("#checkinAgoLabelGracePlainR116CopyCard");
      if (nextSec && nextSec.parentNode)
        nextSec.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (agoGrace && agoGrace.parentNode)
        agoGrace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const graceRaw = cd.grace_hours != null ? cd.grace_hours : (st.user || {}).grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Number(graceRaw));
      const readable = String(cd.readable || cd.status_readable || cd.label || "").trim() || "—";
      const combo = grace + " · " + readable;
      const line =
        "宽限小时 · 可读状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-readable-plain-r119-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceReadablePlainR119CopyBtn">复制宽限可读R119</button>`;
      const btn = $("#checkinGraceReadablePlainR119CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制宽限可读R119" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限可读文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+缺口+门槛组合复制 */
  async function ensureTravelBalanceShortfallThresholdPlainR119Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallThresholdPlainR119CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallThresholdPlainR119CopyCard";
      card.className = "travel-balance-shortfall-threshold-plain-r119-copy";
      const shortThr = $("#travelShortfallThresholdBalancePlainCopyCard");
      const metPct = $("#travelMetPctBalancePlainR117CopyCard");
      const thrShort = $("#travelThresholdShortfallPctPlainCopyCard");
      if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = bal + " · " + short + " · " + thr;
      const line =
        "差旅余额 · 缺口 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-threshold-plain-r119-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallThresholdPlainR119CopyBtn">复制余额缺口门槛</button>`;
      const btn = $("#travelBalanceShortfallThresholdPlainR119CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额缺口门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额缺口门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后备注+拜访偏好+服务类型组合复制 */
  async function ensureAftercareNotesVisitServiceCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = notes + " · " + visit + " · " + service;
      el.dataset.notesVisitService = line;
      if (el.querySelector(".ac-copy-notes-visit-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-notes-visit-service";
      btn.textContent = "复制备注拜访服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesVisitService || "");
        softBanner(ok ? "已复制备注拜访服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失+闸口+清单组合复制 */
  async function ensureAuthMissingGateChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingGateChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingGateChecklistCopyCard";
      card.className = "av-missing-gate-checklist-copy";
      const completeMiss = $("#avCompleteMissingChecklistCopyCard");
      const readyMiss = $("#avReadyCompleteMissingCopyCard");
      const checklist = $("#avChecklistMissingGateCopyCard");
      if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const gate = truthyFlag(data.ready) ? "闸口开" : "闸口关";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo =
        "缺失 " + missing.length + " · " + gate + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-gate-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingGateChecklistCopyBtn">复制缺失闸口清单</button>`;
      const btn = $("#avMissingGateChecklistCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失闸口清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失闸口清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+口令提示+姓名组合复制 */
  async function ensureHeirIdPassphraseNameCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = "#" + it.id + " · " + hint + " · " + name;
      if (el.querySelector(".bn-copy-id-passphrase-name")) return;
      el.dataset.idPassphraseName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-passphrase-name";
      btn.textContent = "复制编号口令姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPassphraseName || "");
        softBanner(ok ? "已复制编号口令姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数+域名+导出路径组合复制 */
  async function ensureHandoverTodosDomainExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodosDomainExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodosDomainExportCopyCard";
      card.className = "hand-todos-domain-export-copy";
      const domainTodos = $("#handDomainTodosBrandCopyCard");
      const exportItem = $("#handExportItemCountTodosCopyCard");
      const brandTodos = $("#handBrandTodosDomainCopyCard");
      if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else if (exportItem && exportItem.parentNode)
        exportItem.insertAdjacentElement("afterend", card);
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
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const domain = String(data.domain || "").trim() || "无域名";
      const exportPath =
        String(data.export_path || "").trim() || "无导出路径";
      const combo = tcount + " · " + domain + " · " + exportPath;
      const line = "手册待办 · 域名 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-todos-domain-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodosDomainExportCopyBtn">复制待办域名导出</button>`;
      const btn = $("#handTodosDomainExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办域名导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办域名导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+就绪+域名+英文品牌组合复制 + round 层含 119 */
  async function paintAppOkDomainBrandEnR119CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkDomainBrandEnR119CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkDomainBrandEnR119CopyCard";
      card.className = "card app-ok-domain-brand-en-r119-copy-card";
      const verDom = $("#versionDomainAppOkR118CopyCard");
      const brandEn = $("#brandEnOkAppDomainR117CopyCard");
      const okApp = $("#okAppVersionDomainR116CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = app + " · " + ready + " · " + domain + " · " + en;
      card.innerHTML = `<h3>应用 · 就绪 · 域名 · 英文</h3>
        <p class="muted">一键复制应用名、就绪状态、域名与英文品牌（演示级）。</p>
        <p class="app-ok-domain-brand-en-r119-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkDomainBrandEnR119CopyBtn">复制应用就绪域名英文</button>`;
      const btn = $("#appOkDomainBrandEnR119CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 就绪 · 域名 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList119() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 119;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 119); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round119 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryNotesIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDeptVisibilitySummaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceReadablePlainR119Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceShortfallThresholdPlainR119Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareNotesVisitServiceCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingGateChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdPassphraseNameCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodosDomainExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryNotesIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDeptVisibilitySummaryCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceReadablePlainR119Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceShortfallThresholdPlainR119Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareNotesVisitServiceCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingGateChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdPassphraseNameCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodosDomainExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkDomainBrandEnR119CopyCard().catch(() => {});
        paintRoundLayerList119();
      }, 710);
      setTimeout(() => {
        paintAppOkDomainBrandEnR119CopyCard().catch(() => {});
        paintRoundLayerList119();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyBeneficiaryNotesIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDeptVisibilitySummaryCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceReadablePlainR119Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallThresholdPlainR119Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareNotesVisitServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingGateChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPassphraseNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodosDomainExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkDomainBrandEnR119CopyCard().catch(() => {});
      paintRoundLayerList119();
    }, 730);
  }
})();
