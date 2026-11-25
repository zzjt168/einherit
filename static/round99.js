/* 电子继承 · 第九十九批增量（叠在 round98…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round99SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用域名版本冷静条 */
  async function paintHomeAppDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppDomainVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppDomainVersionCalmBar";
      bar.className = "home-app-domain-version-calm-bar";
      bar.setAttribute("role", "status");
      const brandOk = $("#homeBrandEnDomainOkCalmBar");
      const okDom = $("#homeOkDomainVersionCalmBar");
      const appEn = $("#homeAppBrandEnDomainCalmBar");
      if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (appEn && appEn.parentNode === home)
        appEn.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = app + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-domain-version-calm-mark">站点</span>
        <span class="muted home-app-domain-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeAppDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-domain-version-calm-mark">站点</span>
        <span class="muted home-app-domain-version-calm-sub">应用域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeAppDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+部门+受益人组合复制 */
  async function ensureLegacyIdDeptBeneficiaryCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = "#" + it.id + " · " + dept + " · " + ben;
      el.dataset.idDeptBeneficiary = line;
      if (el.querySelector(".lg-copy-id-dept-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-dept-beneficiary";
      btn.textContent = "复制编号部门受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDeptBeneficiary || "");
        softBanner(ok ? "已复制编号部门受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签+提示组合复制 */
  async function ensureAssetPlatformTagHintCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = platform + " · " + tag + " · " + hint;
      el.dataset.platformTagHint = line;
      if (el.querySelector(".as-copy-platform-tag-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag-hint";
      btn.textContent = "复制平台标签提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTagHint || "");
        softBanner(ok ? "已复制平台标签提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔小时说明 */
  async function ensureCheckinIntervalHoursPlainR99Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursPlainR99CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursPlainR99CopyCard";
      card.className = "checkin-interval-hours-plain-r99-copy";
      const lastAt = $("#checkinLastCheckinAtPlainR98CopyCard");
      const secs = $("#checkinSecondsRemainingPlainR97CopyCard");
      const since = $("#checkinHoursSinceLastPlainR96CopyCard");
      if (lastAt && lastAt.parentNode)
        lastAt.insertAdjacentElement("afterend", card);
      else if (secs && secs.parentNode)
        secs.insertAdjacentElement("afterend", card);
      else if (since && since.parentNode)
        since.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).interval_hours;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备间隔 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-hours-plain-r99-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursPlainR99CopyBtn">复制间隔小时说明</button>`;
      const btn = $("#checkinIntervalHoursPlainR99CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制间隔小时说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔小时说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比与缺口组合复制 */
  async function ensureTravelProgressPctShortfallPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctShortfallPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctShortfallPlainCopyCard";
      card.className = "travel-progress-pct-shortfall-plain-copy";
      const metBal = $("#travelMetBalanceThresholdPlainCopyCard");
      const thrShort = $("#travelThresholdShortfallPlainR97CopyCard");
      const balMet = $("#travelBalanceMetPlainR96CopyCard");
      if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = pctStr + " · " + short;
      const line = "差旅进度 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-pct-shortfall-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctShortfallPlainCopyBtn">复制进度缺口文案</button>`;
      const btn = $("#travelProgressPctShortfallPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度缺口文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+备注+状态组合复制 */
  async function ensureAftercareTitleNotesStatusCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const status = String(it.status || "").trim() || "未填状态";
      const line = title + " · " + notes + " · " + status;
      el.dataset.titleNotesStatus = line;
      if (el.querySelector(".ac-copy-title-notes-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-notes-status";
      btn.textContent = "复制标题备注状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleNotesStatus || "");
        softBanner(ok ? "已复制标题备注状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单+进度+就绪组合复制 */
  async function ensureAuthChecklistProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistProgressReadyCopyCard";
      card.className = "av-checklist-progress-ready-copy";
      const complete = $("#avCompleteGateReadyCopyCard");
      const readyMiss = $("#avReadyMissingCountCopyCard");
      const script = $("#avScriptGateReadyCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo =
        "清单 " + count + " · " + done + "/" + total + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistProgressReadyCopyBtn">复制清单进度就绪</button>`;
      const btn = $("#avChecklistProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单进度就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单进度就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+口令提示组合复制 */
  async function ensureHeirIdNamePassphraseR99CopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + name + " · " + phrase;
      if (el.querySelector(".bn-copy-id-name-passphrase-r99")) return;
      el.dataset.idNamePassphraseR99 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-passphrase-r99";
      btn.textContent = "复制受益人编号口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNamePassphraseR99 || "");
        softBanner(ok ? "已复制受益人编号口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数与导出路径组合复制 */
  async function ensureHandoverTodoCountExportPathCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodoCountExportPathCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodoCountExportPathCopyCard";
      card.className = "hand-todo-count-export-path-copy";
      const domBrand = $("#handDomainBrandR98CopyCard");
      const itemBrand = $("#handItemCountBrandR97CopyCard");
      const pctExport = $("#handProgressPctExportPathCopyCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (pctExport && pctExport.parentNode)
        pctExport.insertAdjacentElement("afterend", card);
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
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = count + " · " + path;
      const line = "手册待办 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-todo-count-export-path-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodoCountExportPathCopyBtn">复制待办导出路径</button>`;
      const btn = $("#handTodoCountExportPathCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办导出路径" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办数与导出路径暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+域名+版本组合复制 + round 层含 99 */
  async function paintBrandEnDomainVersionR99CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnDomainVersionR99CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnDomainVersionR99CopyCard";
      card.className = "card brand-en-domain-version-r99-copy-card";
      const appOk = $("#appOkVersionR98CopyCard");
      const okBrand = $("#okBrandEnVersionR97CopyCard");
      const domApp = $("#domainAppVersionR96CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = en + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>英文品牌 · 域名 · 版本</h3>
        <p class="muted">一键复制英文品牌、域名与版本（演示级）。</p>
        <p class="brand-en-domain-version-r99-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnDomainVersionR99CopyBtn">复制英文域名版本</button>`;
      const btn = $("#brandEnDomainVersionR99CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList99() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 99;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 99); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round99 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppDomainVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdDeptBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalHoursPlainR99Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelProgressPctShortfallPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleNotesStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthChecklistProgressReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNamePassphraseR99CopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodoCountExportPathCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppDomainVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdDeptBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalHoursPlainR99Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelProgressPctShortfallPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleNotesStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistProgressReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNamePassphraseR99CopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodoCountExportPathCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnDomainVersionR99CopyCard().catch(() => {});
        paintRoundLayerList99();
      }, 710);
      setTimeout(() => {
        paintBrandEnDomainVersionR99CopyCard().catch(() => {});
        paintRoundLayerList99();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppDomainVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdDeptBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformTagHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursPlainR99Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctShortfallPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleNotesStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNamePassphraseR99CopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodoCountExportPathCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnDomainVersionR99CopyCard().catch(() => {});
      paintRoundLayerList99();
    }, 730);
  }
})();
