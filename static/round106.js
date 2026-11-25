/* 电子继承 · 第一百零六批增量（叠在 round105…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round106SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪英文应用冷静条 */
  async function paintHomeOkBrandEnApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnAppCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnAppCalmBar";
      bar.className = "home-ok-brand-en-app-calm-bar";
      bar.setAttribute("role", "status");
      const domOk = $("#homeDomainOkAppCalmBar");
      const brandApp = $("#homeBrandEnAppVersionCalmBar");
      const okApp = $("#homeOkAppDomainCalmBar");
      if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
      else if (brandApp && brandApp.parentNode === home)
        brandApp.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
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
      const app = String(h.app || "电子继承 App").trim();
      const sub = ready + " · " + en + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-app-calm-mark">站点</span>
        <span class="muted home-ok-brand-en-app-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnAppCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-app-calm-mark">站点</span>
        <span class="muted home-ok-brand-en-app-calm-sub">就绪英文应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnAppCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割部门+标题+动作组合复制 */
  async function ensureLegacyDeptTitleActionCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const title = String(it.title || "").trim() || "未填标题";
      const action = String(it.action || "").trim() || "未填动作";
      const line = dept + " · " + title + " · " + action;
      el.dataset.deptTitleAction = line;
      if (el.querySelector(".lg-copy-dept-title-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-title-action";
      btn.textContent = "复制部门标题动作";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptTitleAction || "");
        softBanner(ok ? "已复制部门标题动作" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+账号提示+可见度组合复制 */
  async function ensureAssetTagHintVisibilityCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = tag + " · " + hint + " · " + vis;
      el.dataset.tagHintVisibility = line;
      if (el.querySelector(".as-copy-tag-hint-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-hint-visibility";
      btn.textContent = "复制标签提示可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagHintVisibility || "");
        softBanner(ok ? "已复制标签提示可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制即将到期说明 */
  async function ensureCheckinDueSoonPlainR106Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueSoonPlainR106CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueSoonPlainR106CopyCard";
      card.className = "checkin-due-soon-plain-r106-copy";
      const readable = $("#checkinReadablePlainR105CopyCard");
      const grace = $("#checkinGraceHoursPlainR104CopyCard");
      const rem = $("#checkinHoursRemainingPlainR103CopyCard");
      if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (rem && rem.parentNode)
        rem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const due = truthyFlag((st.countdown || {}).due_soon)
        ? "即将到期"
        : "未到期";
      const line =
        "报备到期 · " +
        due +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-due-soon-plain-r106-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDueSoonPlainR106CopyBtn">复制即将到期说明</button>`;
      const btn = $("#checkinDueSoonPlainR106CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(due);
          softBanner(ok ? "已复制即将到期说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">即将到期说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+余额+进度百分比组合复制 */
  async function ensureTravelMetBalancePctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetBalancePctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetBalancePctPlainCopyCard";
      card.className = "travel-met-balance-pct-plain-copy";
      const shortBal = $("#travelShortfallBalancePctPlainCopyCard");
      const balPct = $("#travelBalancePctThresholdPlainCopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainCopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balPct && balPct.parentNode)
        balPct.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
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
      const combo = met + " · " + bal + " · " + pctStr;
      const line =
        "差旅达标 · 余额 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-balance-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetBalancePctPlainCopyBtn">复制达标余额进度</button>`;
      const btn = $("#travelMetBalancePctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标余额进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标余额进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后备注+预算+城市组合复制 */
  async function ensureAftercareNotesBudgetCityCopyButtons() {
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
      const budget =
        it.travel_budget == null
          ? "未填预算"
          : String(Math.round(Number(it.travel_budget)));
      const city = String(it.city || "").trim() || "未填城市";
      const line = notes + " · " + budget + " · " + city;
      el.dataset.notesBudgetCity = line;
      if (el.querySelector(".ac-copy-notes-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-notes-budget-city";
      btn.textContent = "复制备注预算城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesBudgetCity || "");
        softBanner(ok ? "已复制备注预算城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单数+就绪+闸口组合复制 */
  async function ensureAuthChecklistReadyGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistReadyGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistReadyGateCopyCard";
      card.className = "av-checklist-ready-gate-copy";
      const complete = $("#avCompleteReadyGateCopyCard");
      const missing = $("#avMissingProgressReadyCopyCard");
      const script = $("#avScriptProgressReadyCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const combo = "清单 " + count + " · " + ready + " · " + gate;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-ready-gate-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistReadyGateCopyBtn">复制清单就绪闸口</button>`;
      const btn = $("#avChecklistReadyGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单就绪闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单就绪闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+关系+编号组合复制 */
  async function ensureHeirPassphraseRelationIdCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = phrase + " · " + relation + " · #" + it.id;
      if (el.querySelector(".bn-copy-passphrase-relation-id")) return;
      el.dataset.passphraseRelationId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-relation-id";
      btn.textContent = "复制口令关系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseRelationId || "");
        softBanner(ok ? "已复制口令关系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数+域名+导出路径组合复制 */
  async function ensureHandoverItemCountDomainExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountDomainExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountDomainExportCopyCard";
      card.className = "hand-item-count-domain-export-copy";
      const todos = $("#handTodosBrandDomainCopyCard");
      const exportDom = $("#handExportPathDomainBrandCopyCard");
      const progItem = $("#handProgressItemCountBrandCopyCard");
      if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (progItem && progItem.parentNode)
        progItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const domain = String(data.domain || "").trim() || "无域名";
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = count + " · " + domain + " · " + path;
      const line = "手册条目 · 域名 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-domain-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountDomainExportCopyBtn">复制条目域名导出</button>`;
      const btn = $("#handItemCountDomainExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目域名导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目域名导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+应用名+英文品牌+域名组合复制 + round 层含 106 */
  async function paintOkAppBrandEnDomainR106CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okAppBrandEnDomainR106CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okAppBrandEnDomainR106CopyCard";
      card.className = "card ok-app-brand-en-domain-r106-copy-card";
      const domBrand = $("#domainBrandEnOkVersionR105CopyCard");
      const appBrand = $("#appBrandEnDomainOkR104CopyCard");
      const okDom = $("#okDomainBrandEnVersionR103CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ready + " · " + app + " · " + en + " · " + domain;
      card.innerHTML = `<h3>就绪 · 应用 · 英文品牌 · 域名</h3>
        <p class="muted">一键复制就绪状态、应用名、英文品牌与域名（演示级）。</p>
        <p class="ok-app-brand-en-domain-r106-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okAppBrandEnDomainR106CopyBtn">复制就绪应用英文域名</button>`;
      const btn = $("#okAppBrandEnDomainR106CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪应用英文域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 应用 · 英文品牌 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList106() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 106;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 106); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round106 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeptTitleActionCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagHintVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinDueSoonPlainR106Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetBalancePctPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareNotesBudgetCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthChecklistReadyGateCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseRelationIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountDomainExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeptTitleActionCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagHintVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinDueSoonPlainR106Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetBalancePctPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareNotesBudgetCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistReadyGateCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseRelationIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountDomainExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkAppBrandEnDomainR106CopyCard().catch(() => {});
        paintRoundLayerList106();
      }, 710);
      setTimeout(() => {
        paintOkAppBrandEnDomainR106CopyCard().catch(() => {});
        paintRoundLayerList106();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkBrandEnApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyDeptTitleActionCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetTagHintVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueSoonPlainR106Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetBalancePctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareNotesBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistReadyGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseRelationIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountDomainExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkAppBrandEnDomainR106CopyCard().catch(() => {});
      paintRoundLayerList106();
    }, 730);
  }
})();
