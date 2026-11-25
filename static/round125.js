/* 电子继承 · 第一百二十五批增量（叠在 round124…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round125SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本域名就绪冷静条 */
  async function paintHomeVersionDomainOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionDomainOkCalmBarR125");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionDomainOkCalmBarR125";
      bar.className = "home-version-domain-ok-calm-bar-r125";
      bar.setAttribute("role", "status");
      const okVer = $("#homeOkVersionBrandEnCalmBarR124");
      const appDom = $("#homeAppDomainBrandEnCalmBarR123");
      const brandApp = $("#homeBrandEnAppDomainCalmBarR122");
      if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = ver + " · " + domain + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-ok-calm-bar-r125-mark">版本</span>
        <span class="muted home-version-domain-ok-calm-bar-r125-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainOkCalmGoR125">去设置</button>`;
      const btn = $("#homeVersionDomainOkCalmGoR125");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-ok-calm-bar-r125-mark">版本</span>
        <span class="muted home-version-domain-ok-calm-bar-r125-sub">版本域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainOkCalmGoR125">去设置</button>`;
      const btn = $("#homeVersionDomainOkCalmGoR125");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+标题+备注组合复制 */
  async function ensureLegacyBeneficiaryTitleNotesCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = bene + " · " + title + " · " + notes;
      el.dataset.beneficiaryTitleNotes = line;
      if (el.querySelector(".lg-copy-beneficiary-title-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-title-notes";
      btn.textContent = "复制受益人标题备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryTitleNotes || "");
        softBanner(ok ? "已复制受益人标题备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见度+部门+平台组合复制 */
  async function ensureAssetVisibilityDeptPlatformCopyButtons() {
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
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const dept = String(it.dept || "").trim() || "未填部门";
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = vis + " · " + dept + " · " + platform;
      el.dataset.visibilityDeptPlatform = line;
      if (el.querySelector(".as-copy-visibility-dept-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-dept-platform";
      btn.textContent = "复制可见部门平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityDeptPlatform || "");
        softBanner(ok ? "已复制可见部门平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时+宽限文案 */
  async function ensureCheckinHoursRemainingGracePlainR125Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingGracePlainR125CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingGracePlainR125CopyCard";
      card.className = "checkin-hours-remaining-grace-plain-r125-copy";
      const nextInt = $("#checkinNextLabelIntervalPlainR124CopyCard");
      const graceHrs = $("#checkinGraceHoursRemainingPlainR123CopyCard");
      const interval = $("#checkinIntervalHoursAgoPlainR122CopyCard");
      if (nextInt && nextInt.parentNode)
        nextInt.insertAdjacentElement("afterend", card);
      else if (graceHrs && graceHrs.parentNode)
        graceHrs.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const hrsRaw = cd.hours_remaining;
      const hrs =
        hrsRaw == null || hrsRaw === ""
          ? "—"
          : String(Math.round(Number(hrsRaw) * 10) / 10);
      const graceRaw =
        cd.grace_hours != null ? cd.grace_hours : (st.user || {}).grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Number(graceRaw));
      const combo = hrs + " · " + grace;
      const line =
        "剩余小时 · 宽限小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-grace-plain-r125-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingGracePlainR125CopyBtn">复制剩余宽限R125</button>`;
      const btn = $("#checkinHoursRemainingGracePlainR125CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余宽限R125" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余宽限文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度+余额+达标组合复制 */
  async function ensureTravelPctBalanceMetPlainR125Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelPctBalanceMetPlainR125CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelPctBalanceMetPlainR125CopyCard";
      card.className = "travel-pct-balance-met-plain-r125-copy";
      const shortBal = $("#travelShortfallBalanceThresholdPlainR124CopyCard");
      const balThr = $("#travelBalanceThresholdMetPlainR123CopyCard");
      const thrPct = $("#travelThresholdPctMetPlainR122CopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const combo = pct + "% · " + bal + " · " + met;
      const line =
        "差旅进度 · 余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-pct-balance-met-plain-r125-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelPctBalanceMetPlainR125CopyBtn">复制进度余额达标</button>`;
      const btn = $("#travelPctBalanceMetPlainR125CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度余额达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度余额达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后预算+备注+城市组合复制 */
  async function ensureAftercareBudgetNotesCityCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const city = String(it.city || "").trim() || "未填城市";
      const line = budget + " · " + notes + " · " + city;
      el.dataset.budgetNotesCity = line;
      if (el.querySelector(".ac-copy-budget-notes-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-notes-city";
      btn.textContent = "复制预算备注城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetNotesCity || "");
        softBanner(ok ? "已复制预算备注城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单+完成+闸口组合复制 */
  async function ensureAuthChecklistCompleteGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistCompleteGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistCompleteGateCopyCard";
      card.className = "av-checklist-complete-gate-copy";
      const completeList = $("#avCompleteChecklistReadyCopyCard");
      const missComp = $("#avMissingCompleteReadyCopyCard");
      const readyMiss = $("#avReadyMissingCompleteCopyCard");
      if (completeList && completeList.parentNode)
        completeList.insertAdjacentElement("afterend", card);
      else if (missComp && missComp.parentNode)
        missComp.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const gate = truthyFlag(data.ready) ? "闸口开" : "闸口关";
      const combo = "清单 " + list.length + " · " + doneFlag + " · " + gate;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-complete-gate-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistCompleteGateCopyBtn">复制清单完成闸口</button>`;
      const btn = $("#avChecklistCompleteGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单完成闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单完成闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系+口令提示组合复制 */
  async function ensureHeirIdContactPassphraseCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + contact + " · " + hint;
      if (el.querySelector(".bn-copy-id-contact-passphrase")) return;
      el.dataset.idContactPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-passphrase";
      btn.textContent = "复制编号联系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactPassphrase || "");
        softBanner(ok ? "已复制编号联系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+品牌+条目数组合复制 */
  async function ensureHandoverDomainBrandItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainBrandItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainBrandItemCountCopyCard";
      card.className = "hand-domain-brand-item-count-copy";
      const todosBrand = $("#handTodosBrandItemCountCopyCard");
      const brandDom = $("#handBrandDomainTodosCopyCard");
      const exportTodos = $("#handExportTodosDomainCopyCard");
      if (todosBrand && todosBrand.parentNode)
        todosBrand.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (exportTodos && exportTodos.parentNode)
        exportTodos.insertAdjacentElement("afterend", card);
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
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const combo = domain + " · " + brand + " · " + ic;
      const line = "手册域名 · 品牌 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-brand-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainBrandItemCountCopyBtn">复制域名品牌条目</button>`;
      const btn = $("#handDomainBrandItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名品牌条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名品牌条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+就绪+英文品牌+版本组合复制 + round 层含 125 */
  async function paintAppOkBrandEnVersionR125CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkBrandEnVersionR125CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkBrandEnVersionR125CopyCard";
      card.className = "card app-ok-brand-en-version-r125-copy-card";
      const brandEn = $("#brandEnVersionOkAppR124CopyCard");
      const okVer = $("#okVersionDomainAppR123CopyCard");
      const appDom = $("#appDomainVersionOkR122CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = app + " · " + ready + " · " + en + " · " + ver;
      card.innerHTML = `<h3>应用 · 就绪 · 英文 · 版本</h3>
        <p class="muted">一键复制应用名、就绪状态、英文品牌与版本（演示级）。</p>
        <p class="app-ok-brand-en-version-r125-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkBrandEnVersionR125CopyBtn">复制应用就绪英文版本</button>`;
      const btn = $("#appOkBrandEnVersionR125CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 就绪 · 英文 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList125() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 125;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 125); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round125 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryTitleNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityDeptPlatformCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingGracePlainR125Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelPctBalanceMetPlainR125Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetNotesCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthChecklistCompleteGateCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdContactPassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainBrandItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryTitleNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityDeptPlatformCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingGracePlainR125Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelPctBalanceMetPlainR125Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetNotesCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistCompleteGateCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdContactPassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainBrandItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkBrandEnVersionR125CopyCard().catch(() => {});
        paintRoundLayerList125();
      }, 710);
      setTimeout(() => {
        paintAppOkBrandEnVersionR125CopyCard().catch(() => {});
        paintRoundLayerList125();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyBeneficiaryTitleNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetVisibilityDeptPlatformCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingGracePlainR125Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelPctBalanceMetPlainR125Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetNotesCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistCompleteGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainBrandItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkBrandEnVersionR125CopyCard().catch(() => {});
      paintRoundLayerList125();
    }, 730);
  }
})();
