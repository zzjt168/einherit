/* 电子继承 · 第九十六批增量（叠在 round95…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round96SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用英文域名冷静条 */
  async function paintHomeAppBrandEnDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppBrandEnDomainCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppBrandEnDomainCalmBar";
      bar.className = "home-app-brand-en-domain-calm-bar";
      bar.setAttribute("role", "status");
      const okVer = $("#homeOkVersionCalmBar");
      const brandVer = $("#homeBrandEnVersionCalmBar");
      const appOk = $("#homeAppOkDomainCalmBar");
      if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
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
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = app + " · " + en + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-brand-en-domain-calm-mark">品牌</span>
        <span class="muted home-app-brand-en-domain-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppBrandEnDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppBrandEnDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-brand-en-domain-calm-mark">品牌</span>
        <span class="muted home-app-brand-en-domain-calm-sub">应用英文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppBrandEnDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppBrandEnDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+分类组合复制 */
  async function ensureLegacyIdTitleCategoryCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const cat = String(it.category || "").trim() || "未填分类";
      const line = "#" + it.id + " · " + title + " · " + cat;
      el.dataset.idTitleCategory = line;
      if (el.querySelector(".lg-copy-id-title-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-category";
      btn.textContent = "复制编号标题分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleCategory || "");
        softBanner(ok ? "已复制编号标题分类" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置+标签+部门组合复制 */
  async function ensureAssetDisposeTagDeptCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const tag = String(it.tag || "").trim() || "未填标签";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = dispose + " · " + tag + " · " + dept;
      el.dataset.disposeTagDept = line;
      if (el.querySelector(".as-copy-dispose-tag-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-tag-dept";
      btn.textContent = "复制处置标签部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeTagDept || "");
        softBanner(ok ? "已复制处置标签部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次小时文案 */
  async function ensureCheckinHoursSinceLastPlainR96Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursSinceLastPlainR96CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursSinceLastPlainR96CopyCard";
      card.className = "checkin-hours-since-last-plain-r96-copy";
      const countdown = $("#checkinCountdownLabelPlainR95CopyCard");
      const nextAt = $("#checkinNextSuggestedAtPlainR94CopyCard");
      const readable = $("#checkinReadablePlainR93CopyCard");
      if (countdown && countdown.parentNode)
        countdown.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
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
      const raw = (st.countdown || {}).hours_since_last;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备距上次 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-since-last-plain-r96-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursSinceLastPlainR96CopyBtn">复制距上次小时文案</button>`;
      const btn = $("#checkinHoursSinceLastPlainR96CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制距上次小时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与达标组合复制 */
  async function ensureTravelBalanceMetPlainR96Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetPlainR96CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetPlainR96CopyCard";
      card.className = "travel-balance-met-plain-r96-copy";
      const pctMet = $("#travelProgressPctMetPlainR95CopyCard");
      const shortBal = $("#travelShortfallBalancePlainR94CopyCard");
      const metThr = $("#travelMetThresholdPlainR93CopyCard");
      if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (metThr && metThr.parentNode)
        metThr.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = bal + " · " + met;
      const line = "差旅余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-met-plain-r96-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetPlainR96CopyBtn">复制差旅余额达标</button>`;
      const btn = $("#travelBalanceMetPlainR96CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制差旅余额达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">差旅余额达标暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+标题+探访偏好组合复制 */
  async function ensureAftercareIdTitleVisitPrefCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const pref = String(it.visit_pref || "").trim() || "未填偏好";
      const line = "#" + it.id + " · " + title + " · " + pref;
      el.dataset.idTitleVisitPref = line;
      if (el.querySelector(".ac-copy-id-title-visit-pref")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-title-visit-pref";
      btn.textContent = "复制编号标题探访";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleVisitPref || "");
        softBanner(ok ? "已复制编号标题探访" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本条数+闸口+就绪组合复制 */
  async function ensureAuthScriptGateReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptGateReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptGateReadyCopyCard";
      card.className = "av-script-gate-ready-copy";
      const miss = $("#avMissingTextCompleteCopyCard");
      const checklist = $("#avChecklistGateCopyCard");
      const prog = $("#avProgressCompleteLabelCopyCard");
      if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const scripts = Array.isArray(data.script) ? data.script : [];
      const count = scripts.length;
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = "脚本 " + count + " · " + gate + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-script-gate-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptGateReadyCopyBtn">复制脚本闸口就绪</button>`;
      const btn = $("#avScriptGateReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制脚本闸口就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本闸口就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+角色+联系组合复制 */
  async function ensureHeirIdRoleContactCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = "#" + it.id + " · " + role + " · " + contact;
      if (el.querySelector(".bn-copy-id-role-contact")) return;
      el.dataset.idRoleContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-role-contact";
      btn.textContent = "复制编号角色联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRoleContact || "");
        softBanner(ok ? "已复制编号角色联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比与导出路径组合复制 */
  async function ensureHandoverProgressPctExportPathCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctExportPathCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctExportPathCopyCard";
      card.className = "hand-progress-pct-export-path-copy";
      const genShare = $("#handGeneratedAtShareHintCopyCard");
      const todoShare = $("#handTodoCountShareHintCopyCard");
      const exportShare = $("#handExportPathShareHintR93CopyCard");
      if (genShare && genShare.parentNode)
        genShare.insertAdjacentElement("afterend", card);
      else if (todoShare && todoShare.parentNode)
        todoShare.insertAdjacentElement("afterend", card);
      else if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const pctRaw = (data.progress || {}).pct;
      const pct =
        pctRaw == null || pctRaw === ""
          ? "—"
          : String(Math.round(Number(pctRaw))) + "%";
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = pct + " · " + path;
      const line = "手册进度 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-export-path-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctExportPathCopyBtn">复制进度导出路径</button>`;
      const btn = $("#handProgressPctExportPathCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度导出路径" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度与导出路径暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+应用名+版本组合复制 + round 层含 96 */
  async function paintDomainAppVersionR96CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainAppVersionR96CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainAppVersionR96CopyCard";
      card.className = "card domain-app-version-r96-copy-card";
      const brandOk = $("#brandEnAppOkR95CopyCard");
      const verApp = $("#versionAppDomainR94CopyCard");
      const okDom = $("#okDomainBrandEnR93CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = domain + " · " + app + " · " + ver;
      card.innerHTML = `<h3>域名 · 应用 · 版本</h3>
        <p class="muted">一键复制域名、应用名与版本（演示级）。</p>
        <p class="domain-app-version-r96-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainAppVersionR96CopyBtn">复制域名应用版本</button>`;
      const btn = $("#domainAppVersionR96CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名应用版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 应用 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList96() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 96;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 96); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round96 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppBrandEnDomain().catch(() => {}), 790);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleCategoryCopyButtons().catch(() => {}),
      620
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposeTagDeptCopyButtons().catch(() => {}),
      620
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursSinceLastPlainR96Copy().catch(() => {}),
      610
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceMetPlainR96Copy().catch(() => {}),
      630
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdTitleVisitPrefCopyButtons().catch(() => {}),
      620
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptGateReadyCopy().catch(() => {}), 590);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRoleContactCopyButtons().catch(() => {}),
      620
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctExportPathCopy().catch(() => {}),
      630
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppBrandEnDomain().catch(() => {}), 790);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleCategoryCopyButtons().catch(() => {}),
        640
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposeTagDeptCopyButtons().catch(() => {}),
        630
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursSinceLastPlainR96Copy().catch(() => {}),
        630
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceMetPlainR96Copy().catch(() => {}),
        650
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdTitleVisitPrefCopyButtons().catch(() => {}),
        640
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptGateReadyCopy().catch(() => {}), 610);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRoleContactCopyButtons().catch(() => {}),
        630
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctExportPathCopy().catch(() => {}),
        640
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainAppVersionR96CopyCard().catch(() => {});
        paintRoundLayerList96();
      }, 680);
      setTimeout(() => {
        paintDomainAppVersionR96CopyCard().catch(() => {});
        paintRoundLayerList96();
      }, 1360);
    }
  };

  setTimeout(() => paintHomeAppBrandEnDomain().catch(() => {}), 840);
  setTimeout(
    () => ensureLegacyIdTitleCategoryCopyButtons().catch(() => {}),
    860
  );
  setTimeout(
    () => ensureAssetDisposeTagDeptCopyButtons().catch(() => {}),
    880
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursSinceLastPlainR96Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetPlainR96Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdTitleVisitPrefCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptGateReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRoleContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctExportPathCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainAppVersionR96CopyCard().catch(() => {});
      paintRoundLayerList96();
    }, 700);
  }
})();
