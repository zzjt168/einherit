/* 电子继承 · 第一百二十批增量（叠在 round119…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round120SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名英文版本冷静条 */
  async function paintHomeDomainBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnVersionCalmBarR120");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnVersionCalmBarR120";
      bar.className = "home-domain-brand-en-version-calm-bar-r120";
      bar.setAttribute("role", "status");
      const okBar = $("#homeOkBrandEnDomainCalmBarR119");
      const brandEn = $("#homeBrandEnDomainAppCalmBarR118");
      const appOk = $("#homeAppOkVersionCalmBarR117");
      if (okBar && okBar.parentNode === home)
        okBar.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-bar-r120-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-bar-r120-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR120">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR120");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-bar-r120-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-bar-r120-sub">域名英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR120">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR120");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割动作+备注+受益人组合复制 */
  async function ensureLegacyActionNotesBeneficiaryCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = action + " · " + notes + " · " + bene;
      el.dataset.actionNotesBeneficiary = line;
      if (el.querySelector(".lg-copy-action-notes-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-notes-beneficiary";
      btn.textContent = "复制动作备注受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionNotesBeneficiary || "");
        softBanner(ok ? "已复制动作备注受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+部门+可见度组合复制 */
  async function ensureAssetPlatformDeptVisibilityCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = platform + " · " + dept + " · " + vis;
      el.dataset.platformDeptVisibility = line;
      if (el.querySelector(".as-copy-platform-dept-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-dept-visibility";
      btn.textContent = "复制平台部门可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformDeptVisibility || "");
        softBanner(ok ? "已复制平台部门可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时+可读文案 */
  async function ensureCheckinHoursRemainingReadablePlainR120Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingReadablePlainR120CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingReadablePlainR120CopyCard";
      card.className = "checkin-hours-remaining-readable-plain-r120-copy";
      const grace = $("#checkinGraceReadablePlainR119CopyCard");
      const nextSec = $("#checkinNextLabelSecondsPlainR118CopyCard");
      const readable = $("#checkinReadableIntervalPlainR117CopyCard");
      if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (nextSec && nextSec.parentNode)
        nextSec.insertAdjacentElement("afterend", card);
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
      const hrsRaw = cd.hours_remaining;
      const hrs =
        hrsRaw == null || hrsRaw === ""
          ? "—"
          : String(Math.round(Number(hrsRaw) * 10) / 10);
      const readable =
        String(cd.readable || cd.status_readable || "").trim() || "—";
      const combo = hrs + " · " + readable;
      const line =
        "剩余小时 · 可读状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-readable-plain-r120-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingReadablePlainR120CopyBtn">复制剩余小时可读R120</button>`;
      const btn = $("#checkinHoursRemainingReadablePlainR120CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余小时可读R120" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余小时可读文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度+达标+余额组合复制 */
  async function ensureTravelPctMetBalancePlainR120Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelPctMetBalancePlainR120CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelPctMetBalancePlainR120CopyCard";
      card.className = "travel-pct-met-balance-plain-r120-copy";
      const balShort = $("#travelBalanceShortfallThresholdPlainR119CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainCopyCard");
      const metPct = $("#travelMetPctBalancePlainR117CopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = pct + "% · " + met + " · " + bal;
      const line =
        "差旅进度 · 达标 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-pct-met-balance-plain-r120-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelPctMetBalancePlainR120CopyBtn">复制进度达标余额</button>`;
      const btn = $("#travelPctMetBalancePlainR120CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度达标余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度达标余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+拜访偏好+预算组合复制 */
  async function ensureAftercareTitleVisitBudgetCopyButtons() {
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
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const line = title + " · " + visit + " · " + budget;
      el.dataset.titleVisitBudget = line;
      if (el.querySelector(".ac-copy-title-visit-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-visit-budget";
      btn.textContent = "复制标题拜访预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleVisitBudget || "");
        softBanner(ok ? "已复制标题拜访预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成+清单组合复制 */
  async function ensureAuthReadyCompleteChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteChecklistCopyCard";
      card.className = "av-ready-complete-checklist-copy";
      const missGate = $("#avMissingGateChecklistCopyCard");
      const completeMiss = $("#avCompleteMissingChecklistCopyCard");
      const readyMiss = $("#avReadyCompleteMissingCopyCard");
      if (missGate && missGate.parentNode)
        missGate.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo = ready + " · " + doneFlag + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteChecklistCopyBtn">复制就绪完成清单</button>`;
      const btn = $("#avReadyCompleteChecklistCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+口令提示+关系组合复制 */
  async function ensureHeirContactPassphraseRelationCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · " + hint + " · " + relation;
      if (el.querySelector(".bn-copy-contact-passphrase-relation")) return;
      el.dataset.contactPassphraseRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-passphrase-relation";
      btn.textContent = "复制联系口令关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactPassphraseRelation || "");
        softBanner(ok ? "已复制联系口令关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数+待办数+域名组合复制 */
  async function ensureHandoverItemCountTodosDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountTodosDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountTodosDomainCopyCard";
      card.className = "hand-item-count-todos-domain-copy";
      const todosExp = $("#handTodosDomainExportCopyCard");
      const domainTodos = $("#handDomainTodosBrandCopyCard");
      const exportItem = $("#handExportItemCountTodosCopyCard");
      if (todosExp && todosExp.parentNode)
        todosExp.insertAdjacentElement("afterend", card);
      else if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else if (exportItem && exportItem.parentNode)
        exportItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = ic + " · " + tcount + " · " + domain;
      const line = "手册条目 · 待办 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-todos-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountTodosDomainCopyBtn">复制条目待办域名</button>`;
      const btn = $("#handItemCountTodosDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目待办域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目待办域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+版本+应用名+就绪组合复制 + round 层含 120 */
  async function paintDomainVersionAppOkR120CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainVersionAppOkR120CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainVersionAppOkR120CopyCard";
      card.className = "card domain-version-app-ok-r120-copy-card";
      const appOk = $("#appOkDomainBrandEnR119CopyCard");
      const verDom = $("#versionDomainAppOkR118CopyCard");
      const brandEn = $("#brandEnOkAppDomainR117CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = domain + " · " + ver + " · " + app + " · " + ready;
      card.innerHTML = `<h3>域名 · 版本 · 应用 · 就绪</h3>
        <p class="muted">一键复制域名、版本、应用名与就绪状态（演示级）。</p>
        <p class="domain-version-app-ok-r120-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainVersionAppOkR120CopyBtn">复制域名版本应用就绪</button>`;
      const btn = $("#domainVersionAppOkR120CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名版本应用就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 版本 · 应用 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList120() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 120;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 120); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round120 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionNotesBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformDeptVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingReadablePlainR120Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelPctMetBalancePlainR120Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleVisitBudgetCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactPassphraseRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountTodosDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionNotesBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformDeptVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingReadablePlainR120Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelPctMetBalancePlainR120Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleVisitBudgetCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactPassphraseRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountTodosDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainVersionAppOkR120CopyCard().catch(() => {});
        paintRoundLayerList120();
      }, 710);
      setTimeout(() => {
        paintDomainVersionAppOkR120CopyCard().catch(() => {});
        paintRoundLayerList120();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyActionNotesBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformDeptVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingReadablePlainR120Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelPctMetBalancePlainR120Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleVisitBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactPassphraseRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountTodosDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainVersionAppOkR120CopyCard().catch(() => {});
      paintRoundLayerList120();
    }, 730);
  }
})();
