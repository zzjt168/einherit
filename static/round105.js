/* 电子继承 · 第一百零五批增量（叠在 round104…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round105SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名就绪应用冷静条 */
  async function paintHomeDomainOkApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainOkAppCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainOkAppCalmBar";
      bar.className = "home-domain-ok-app-calm-bar";
      bar.setAttribute("role", "status");
      const brandApp = $("#homeBrandEnAppVersionCalmBar");
      const okApp = $("#homeOkAppDomainCalmBar");
      const appBrand = $("#homeAppBrandEnOkCalmBar");
      if (brandApp && brandApp.parentNode === home)
        brandApp.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else if (appBrand && appBrand.parentNode === home)
        appBrand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const sub = domain + " · " + ready + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-app-calm-mark">站点</span>
        <span class="muted home-domain-ok-app-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkAppCalmGo">去设置</button>`;
      const btn = $("#homeDomainOkAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-app-calm-mark">站点</span>
        <span class="muted home-domain-ok-app-calm-sub">域名就绪应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkAppCalmGo">去设置</button>`;
      const btn = $("#homeDomainOkAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+标题+分类组合复制 */
  async function ensureLegacyNotesTitleCategoryCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const title = String(it.title || "").trim() || "未填标题";
      const category = String(it.category || "").trim() || "未填分类";
      const line = notes + " · " + title + " · " + category;
      el.dataset.notesTitleCategory = line;
      if (el.querySelector(".lg-copy-notes-title-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-title-category";
      btn.textContent = "复制备注标题分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesTitleCategory || "");
        softBanner(ok ? "已复制备注标题分类" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置+摘要+标签组合复制 */
  async function ensureAssetDisposeSummaryTagCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = dispose + " · " + summary + " · " + tag;
      el.dataset.disposeSummaryTag = line;
      if (el.querySelector(".as-copy-dispose-summary-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-summary-tag";
      btn.textContent = "复制处置摘要标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeSummaryTag || "");
        softBanner(ok ? "已复制处置摘要标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制报备可读文案 */
  async function ensureCheckinReadablePlainR105Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinReadablePlainR105CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinReadablePlainR105CopyCard";
      card.className = "checkin-readable-plain-r105-copy";
      const grace = $("#checkinGraceHoursPlainR104CopyCard");
      const rem = $("#checkinHoursRemainingPlainR103CopyCard");
      const cdLabel = $("#checkinCountdownLabelPlainR102CopyCard");
      if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (rem && rem.parentNode)
        rem.insertAdjacentElement("afterend", card);
      else if (cdLabel && cdLabel.parentNode)
        cdLabel.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).readable || "").trim() || "—";
      const line =
        "报备可读 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-readable-plain-r105-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinReadablePlainR105CopyBtn">复制报备可读文案</button>`;
      const btn = $("#checkinReadablePlainR105CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制报备可读文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备可读文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+余额+进度百分比组合复制 */
  async function ensureTravelShortfallBalancePctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalancePctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalancePctPlainCopyCard";
      card.className = "travel-shortfall-balance-pct-plain-copy";
      const balPct = $("#travelBalancePctThresholdPlainCopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainCopyCard");
      const thrBal = $("#travelThresholdBalancePctPlainCopyCard");
      if (balPct && balPct.parentNode)
        balPct.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
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
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const combo = short + " · " + bal + " · " + pctStr;
      const line =
        "差旅缺口 · 余额 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalancePctPlainCopyBtn">复制缺口余额进度</button>`;
      const btn = $("#travelShortfallBalancePctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口余额进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口余额进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+拜访偏好+状态组合复制 */
  async function ensureAftercareIdVisitStatusCopyButtons() {
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
      const visit = String(it.visit_pref || "").trim() || "未填拜访偏好";
      const status = String(it.status || "").trim() || "未填状态";
      const line = "#" + it.id + " · " + visit + " · " + status;
      el.dataset.idVisitStatus = line;
      if (el.querySelector(".ac-copy-id-visit-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-visit-status";
      btn.textContent = "复制编号拜访状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisitStatus || "");
        softBanner(ok ? "已复制编号拜访状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+闸口组合复制 */
  async function ensureAuthCompleteReadyGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyGateCopyCard";
      card.className = "av-complete-ready-gate-copy";
      const missing = $("#avMissingProgressReadyCopyCard");
      const script = $("#avScriptProgressReadyCopyCard");
      const readyGate = $("#avReadyGateProgressCopyCard");
      if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const combo = doneFlag + " · " + ready + " · " + gate;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-gate-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyGateCopyBtn">复制完成就绪闸口</button>`;
      const btn = $("#avCompleteReadyGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+口令提示+编号组合复制 */
  async function ensureHeirRolePassphraseIdCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = role + " · " + phrase + " · #" + it.id;
      if (el.querySelector(".bn-copy-role-passphrase-id")) return;
      el.dataset.rolePassphraseId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-passphrase-id";
      btn.textContent = "复制角色口令编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.rolePassphraseId || "");
        softBanner(ok ? "已复制角色口令编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数+品牌+域名组合复制 */
  async function ensureHandoverTodosBrandDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodosBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodosBrandDomainCopyCard";
      card.className = "hand-todos-brand-domain-copy";
      const exportDom = $("#handExportPathDomainBrandCopyCard");
      const progItem = $("#handProgressItemCountBrandCopyCard");
      const brandDom = $("#handBrandDomainExportPathCopyCard");
      if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (progItem && progItem.parentNode)
        progItem.insertAdjacentElement("afterend", card);
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
      const todos = data.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      const brand = String(data.brand || "").trim() || "无品牌";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = count + " · " + brand + " · " + domain;
      const line = "手册待办 · 品牌 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-todos-brand-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodosBrandDomainCopyBtn">复制待办品牌域名</button>`;
      const btn = $("#handTodosBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办品牌域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办品牌域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+英文品牌+就绪+版本组合复制 + round 层含 105 */
  async function paintDomainBrandEnOkVersionR105CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainBrandEnOkVersionR105CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainBrandEnOkVersionR105CopyCard";
      card.className = "card domain-brand-en-ok-version-r105-copy-card";
      const appBrand = $("#appBrandEnDomainOkR104CopyCard");
      const okDom = $("#okDomainBrandEnVersionR103CopyCard");
      const appOk = $("#appOkDomainVersionR102CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = domain + " · " + en + " · " + ready + " · " + ver;
      card.innerHTML = `<h3>域名 · 英文品牌 · 就绪 · 版本</h3>
        <p class="muted">一键复制域名、英文品牌、就绪状态与版本（演示级）。</p>
        <p class="domain-brand-en-ok-version-r105-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainBrandEnOkVersionR105CopyBtn">复制域名英文就绪版本</button>`;
      const btn = $("#domainBrandEnOkVersionR105CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名英文就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 英文品牌 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList105() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 105;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 105); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round105 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainOkApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesTitleCategoryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposeSummaryTagCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinReadablePlainR105Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallBalancePctPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdVisitStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthCompleteReadyGateCopy().catch(() => {}), 620);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRolePassphraseIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodosBrandDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainOkApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesTitleCategoryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposeSummaryTagCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinReadablePlainR105Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallBalancePctPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdVisitStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthCompleteReadyGateCopy().catch(() => {}), 640);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRolePassphraseIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodosBrandDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandEnOkVersionR105CopyCard().catch(() => {});
        paintRoundLayerList105();
      }, 710);
      setTimeout(() => {
        paintDomainBrandEnOkVersionR105CopyCard().catch(() => {});
        paintRoundLayerList105();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainOkApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyNotesTitleCategoryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDisposeSummaryTagCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinReadablePlainR105Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalancePctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdVisitStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRolePassphraseIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodosBrandDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandEnOkVersionR105CopyCard().catch(() => {});
      paintRoundLayerList105();
    }, 730);
  }
})();
