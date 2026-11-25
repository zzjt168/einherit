/* 电子继承 · 第一百零七批增量（叠在 round106…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round107SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用版本域名冷静条 */
  async function paintHomeAppVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppVersionDomainCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppVersionDomainCalmBar";
      bar.className = "home-app-version-domain-calm-bar";
      bar.setAttribute("role", "status");
      const okBrand = $("#homeOkBrandEnAppCalmBar");
      const domOk = $("#homeDomainOkAppCalmBar");
      const brandApp = $("#homeBrandEnAppVersionCalmBar");
      if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
      else if (brandApp && brandApp.parentNode === home)
        brandApp.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = app + " · " + ver + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-version-domain-calm-mark">站点</span>
        <span class="muted home-app-version-domain-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppVersionDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppVersionDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-version-domain-calm-mark">站点</span>
        <span class="muted home-app-version-domain-calm-sub">应用版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppVersionDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppVersionDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+备注+编号组合复制 */
  async function ensureLegacyCategoryNotesIdCopyButtons() {
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
      const category = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = category + " · " + notes + " · #" + it.id;
      el.dataset.categoryNotesId = line;
      if (el.querySelector(".lg-copy-category-notes-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-notes-id";
      btn.textContent = "复制分类备注编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryNotesId || "");
        softBanner(ok ? "已复制分类备注编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要+部门组合复制 */
  async function ensureAssetPlatformSummaryDeptCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = platform + " · " + summary + " · " + dept;
      el.dataset.platformSummaryDept = line;
      if (el.querySelector(".as-copy-platform-summary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary-dept";
      btn.textContent = "复制平台摘要部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformSummaryDept || "");
        softBanner(ok ? "已复制平台摘要部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔可读文案 */
  async function ensureCheckinIntervalReadablePlainR107Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalReadablePlainR107CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalReadablePlainR107CopyCard";
      card.className = "checkin-interval-readable-plain-r107-copy";
      const due = $("#checkinDueSoonPlainR106CopyCard");
      const readable = $("#checkinReadablePlainR105CopyCard");
      const grace = $("#checkinGraceHoursPlainR104CopyCard");
      if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const raw = cd.interval_hours;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const readable = String(cd.readable || "").trim() || "—";
      const combo = hours + " · " + readable;
      const line =
        "报备间隔 · 可读 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-readable-plain-r107-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalReadablePlainR107CopyBtn">复制间隔可读文案</button>`;
      const btn = $("#checkinIntervalReadablePlainR107CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制间隔可读文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔可读文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+达标+缺口组合复制 */
  async function ensureTravelThresholdMetShortfallPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdMetShortfallPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdMetShortfallPlainCopyCard";
      card.className = "travel-threshold-met-shortfall-plain-copy";
      const metBal = $("#travelMetBalancePctPlainCopyCard");
      const shortBal = $("#travelShortfallBalancePctPlainCopyCard");
      const balPct = $("#travelBalancePctThresholdPlainCopyCard");
      if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balPct && balPct.parentNode)
        balPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = thr + " · " + met + " · " + short;
      const line =
        "差旅门槛 · 达标 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-met-shortfall-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdMetShortfallPlainCopyBtn">复制门槛达标缺口</button>`;
      const btn = $("#travelThresholdMetShortfallPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛达标缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛达标缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+状态+拜访偏好组合复制 */
  async function ensureAftercareTitleStatusVisitCopyButtons() {
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
      const status = String(it.status || "").trim() || "未填状态";
      const visit = String(it.visit_pref || "").trim() || "未填拜访偏好";
      const line = title + " · " + status + " · " + visit;
      el.dataset.titleStatusVisit = line;
      if (el.querySelector(".ac-copy-title-status-visit")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-status-visit";
      btn.textContent = "复制标题状态拜访";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleStatusVisit || "");
        softBanner(ok ? "已复制标题状态拜访" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+缺失数+就绪组合复制 */
  async function ensureAuthCompleteMissingReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingReadyCopyCard";
      card.className = "av-complete-missing-ready-copy";
      const checklist = $("#avChecklistReadyGateCopyCard");
      const complete = $("#avCompleteReadyGateCopyCard");
      const missing = $("#avMissingProgressReadyCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const miss = Array.isArray(data.missing) ? data.missing : [];
      const count = miss.length;
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = doneFlag + " · 缺失 " + count + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingReadyCopyBtn">复制完成缺失就绪</button>`;
      const btn = $("#avCompleteMissingReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+姓名+编号组合复制 */
  async function ensureHeirContactNameIdCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const line = contact + " · " + name + " · #" + it.id;
      if (el.querySelector(".bn-copy-contact-name-id")) return;
      el.dataset.contactNameId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-id";
      btn.textContent = "复制联系姓名编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameId || "");
        softBanner(ok ? "已复制联系姓名编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+待办数+导出路径组合复制 */
  async function ensureHandoverBrandTodosExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandTodosExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandTodosExportCopyCard";
      card.className = "hand-brand-todos-export-copy";
      const itemDom = $("#handItemCountDomainExportCopyCard");
      const todos = $("#handTodosBrandDomainCopyCard");
      const exportDom = $("#handExportPathDomainBrandCopyCard");
      if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
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
      const brand = String(data.brand || "").trim() || "无品牌";
      const todos = data.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = brand + " · " + count + " · " + path;
      const line = "手册品牌 · 待办 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-todos-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandTodosExportCopyBtn">复制品牌待办导出</button>`;
      const btn = $("#handBrandTodosExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌待办导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌待办导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+就绪+英文品牌+版本组合复制 + round 层含 107 */
  async function paintAppOkBrandEnVersionR107CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkBrandEnVersionR107CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkBrandEnVersionR107CopyCard";
      card.className = "card app-ok-brand-en-version-r107-copy-card";
      const okApp = $("#okAppBrandEnDomainR106CopyCard");
      const domBrand = $("#domainBrandEnOkVersionR105CopyCard");
      const appBrand = $("#appBrandEnDomainOkR104CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = app + " · " + ready + " · " + en + " · " + ver;
      card.innerHTML = `<h3>应用 · 就绪 · 英文品牌 · 版本</h3>
        <p class="muted">一键复制应用名、就绪状态、英文品牌与版本（演示级）。</p>
        <p class="app-ok-brand-en-version-r107-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkBrandEnVersionR107CopyBtn">复制应用就绪英文版本</button>`;
      const btn = $("#appOkBrandEnVersionR107CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 就绪 · 英文品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList107() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 107;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 107); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round107 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppVersionDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryNotesIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformSummaryDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalReadablePlainR107Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdMetShortfallPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleStatusVisitCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandTodosExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppVersionDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryNotesIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformSummaryDeptCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalReadablePlainR107Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdMetShortfallPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleStatusVisitCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandTodosExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkBrandEnVersionR107CopyCard().catch(() => {});
        paintRoundLayerList107();
      }, 710);
      setTimeout(() => {
        paintAppOkBrandEnVersionR107CopyCard().catch(() => {});
        paintRoundLayerList107();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppVersionDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyCategoryNotesIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformSummaryDeptCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalReadablePlainR107Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdMetShortfallPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleStatusVisitCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandTodosExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkBrandEnVersionR107CopyCard().catch(() => {});
      paintRoundLayerList107();
    }, 730);
  }
})();
