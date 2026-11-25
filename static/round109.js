/* 电子继承 · 第一百零九批增量（叠在 round108…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round109SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本就绪应用冷静条 */
  async function paintHomeVersionOkApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionOkAppCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionOkAppCalmBar";
      bar.className = "home-version-ok-app-calm-bar";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnOkDomainCalmBar");
      const appVer = $("#homeAppVersionDomainCalmBar");
      const okBrand = $("#homeOkBrandEnAppCalmBar");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const sub = ver + " · " + ready + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-app-calm-mark">版本</span>
        <span class="muted home-version-ok-app-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkAppCalmGo">去设置</button>`;
      const btn = $("#homeVersionOkAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-app-calm-mark">版本</span>
        <span class="muted home-version-ok-app-calm-sub">版本就绪应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkAppCalmGo">去设置</button>`;
      const btn = $("#homeVersionOkAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+备注+部门组合复制 */
  async function ensureLegacyIdNotesDeptCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + notes + " · " + dept;
      el.dataset.idNotesDept = line;
      if (el.querySelector(".lg-copy-id-notes-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-notes-dept";
      btn.textContent = "复制编号备注部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNotesDept || "");
        softBanner(ok ? "已复制编号备注部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘提示+标签+平台组合复制 */
  async function ensureAssetHintTagPlatformCopyButtons() {
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
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const tag = String(it.tag || "").trim() || "未填标签";
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = hint + " · " + tag + " · " + platform;
      el.dataset.hintTagPlatform = line;
      if (el.querySelector(".as-copy-hint-tag-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-tag-platform";
      btn.textContent = "复制提示标签平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintTagPlatform || "");
        softBanner(ok ? "已复制提示标签平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时刻文案 */
  async function ensureCheckinNextAtPlainR109Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtPlainR109CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtPlainR109CopyCard";
      card.className = "checkin-next-at-plain-r109-copy";
      const hoursAgo = $("#checkinHoursAgoIntervalPlainR108CopyCard");
      const interval = $("#checkinIntervalReadablePlainR107CopyCard");
      const due = $("#checkinDueSoonPlainR106CopyCard");
      if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
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
      const cd = st.countdown || {};
      const raw = cd.next_suggested_at;
      const plain =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 1000) / 1000);
      const line =
        "下次建议时刻 · " +
        plain +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-plain-r109-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtPlainR109CopyBtn">复制下次建议时刻R109</button>`;
      const btn = $("#checkinNextAtPlainR109CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制下次建议时刻R109" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议时刻文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+进度百分比+门槛组合复制 */
  async function ensureTravelMetPctThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetPctThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetPctThresholdPlainCopyCard";
      card.className = "travel-met-pct-threshold-plain-copy";
      const pctShort = $("#travelPctShortfallBalancePlainCopyCard");
      const thrMet = $("#travelThresholdMetShortfallPlainCopyCard");
      const metBal = $("#travelMetBalancePctPlainCopyCard");
      if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
      else if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
      else if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + pctStr + " · " + thr;
      const line =
        "差旅达标 · 进度 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-pct-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetPctThresholdPlainCopyBtn">复制达标进度门槛</button>`;
      const btn = $("#travelMetPctThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标进度门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标进度门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后预算+城市+拜访偏好组合复制 */
  async function ensureAftercareBudgetCityVisitCopyButtons() {
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
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const city = String(it.city || "").trim() || "未填城市";
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const line = budget + " · " + city + " · " + visit;
      el.dataset.budgetCityVisit = line;
      if (el.querySelector(".ac-copy-budget-city-visit")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-city-visit";
      btn.textContent = "复制预算城市拜访";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetCityVisit || "");
        softBanner(ok ? "已复制预算城市拜访" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口+完成+就绪组合复制 */
  async function ensureAuthGateCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateCompleteReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateCompleteReadyCopyCard";
      card.className = "av-gate-complete-ready-copy";
      const readyList = $("#avReadyChecklistCompleteCopyCard");
      const completeMiss = $("#avCompleteMissingReadyCopyCard");
      const checklist = $("#avChecklistReadyGateCopyCard");
      if (readyList && readyList.parentNode)
        readyList.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = truthyFlag(data.gate) ? "闸口开" : "闸口关";
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = gate + " · " + doneFlag + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-complete-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateCompleteReadyCopyBtn">复制闸口完成就绪</button>`;
      const btn = $("#avGateCompleteReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制闸口完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">闸口完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+角色+口令提示组合复制 */
  async function ensureHeirRelationRolePassphraseCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const role = String(it.role || "").trim() || "未填角色";
      const phrase =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const line = relation + " · " + role + " · " + phrase;
      if (el.querySelector(".bn-copy-relation-role-passphrase")) return;
      el.dataset.relationRolePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-role-passphrase";
      btn.textContent = "复制关系角色口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationRolePassphrase || "");
        softBanner(ok ? "已复制关系角色口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+待办数+品牌组合复制 */
  async function ensureHandoverExportTodosBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportTodosBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportTodosBrandCopyCard";
      card.className = "hand-export-todos-brand-copy";
      const domainTodos = $("#handDomainTodosItemCountCopyCard");
      const brandTodos = $("#handBrandTodosExportCopyCard");
      const itemDom = $("#handItemCountDomainExportCopyCard");
      if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else if (brandTodos && brandTodos.parentNode)
        brandTodos.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const brand = String(data.brand || "").trim() || "无品牌";
      const combo = exportPath + " · " + tcount + " · " + brand;
      const line = "手册导出 · 待办 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-export-todos-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportTodosBrandCopyBtn">复制导出待办品牌</button>`;
      const btn = $("#handExportTodosBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出待办品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出待办品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+域名+应用名+版本组合复制 + round 层含 109 */
  async function paintOkDomainAppVersionR109CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okDomainAppVersionR109CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okDomainAppVersionR109CopyCard";
      card.className = "card ok-domain-app-version-r109-copy-card";
      const brandEn = $("#brandEnAppOkDomainR108CopyCard");
      const appOk = $("#appOkBrandEnVersionR107CopyCard");
      const okApp = $("#okAppBrandEnDomainR106CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = ready + " · " + domain + " · " + app + " · " + ver;
      card.innerHTML = `<h3>就绪 · 域名 · 应用 · 版本</h3>
        <p class="muted">一键复制就绪状态、域名、应用名与版本（演示级）。</p>
        <p class="ok-domain-app-version-r109-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okDomainAppVersionR109CopyBtn">复制就绪域名应用版本</button>`;
      const btn = $("#okDomainAppVersionR109CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名应用版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 应用 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList109() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 109;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 109); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round109 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionOkApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdNotesDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintTagPlatformCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtPlainR109Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetPctThresholdPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetCityVisitCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthGateCompleteReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationRolePassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportTodosBrandCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionOkApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdNotesDeptCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintTagPlatformCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtPlainR109Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetPctThresholdPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetCityVisitCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthGateCompleteReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationRolePassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportTodosBrandCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainAppVersionR109CopyCard().catch(() => {});
        paintRoundLayerList109();
      }, 710);
      setTimeout(() => {
        paintOkDomainAppVersionR109CopyCard().catch(() => {});
        paintRoundLayerList109();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeVersionOkApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdNotesDeptCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetHintTagPlatformCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtPlainR109Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetPctThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetCityVisitCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationRolePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportTodosBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainAppVersionR109CopyCard().catch(() => {});
      paintRoundLayerList109();
    }, 730);
  }
})();
