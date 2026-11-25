/* 电子继承 · 第一百二十一批增量（叠在 round120…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round121SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本就绪域名冷静条 */
  async function paintHomeVersionOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionOkDomainCalmBarR121");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionOkDomainCalmBarR121";
      bar.className = "home-version-ok-domain-calm-bar-r121";
      bar.setAttribute("role", "status");
      const domainBar = $("#homeDomainBrandEnVersionCalmBarR120");
      const okBar = $("#homeOkBrandEnDomainCalmBarR119");
      const brandEn = $("#homeBrandEnDomainAppCalmBarR118");
      if (domainBar && domainBar.parentNode === home)
        domainBar.insertAdjacentElement("afterend", bar);
      else if (okBar && okBar.parentNode === home)
        okBar.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ver + " · " + ready + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-domain-calm-bar-r121-mark">版本</span>
        <span class="muted home-version-ok-domain-calm-bar-r121-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkDomainCalmGoR121">去设置</button>`;
      const btn = $("#homeVersionOkDomainCalmGoR121");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-domain-calm-bar-r121-mark">版本</span>
        <span class="muted home-version-ok-domain-calm-bar-r121-sub">版本就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkDomainCalmGoR121">去设置</button>`;
      const btn = $("#homeVersionOkDomainCalmGoR121");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+动作+受益人组合复制 */
  async function ensureLegacyTitleActionBeneficiaryCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填动作";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = title + " · " + action + " · " + bene;
      el.dataset.titleActionBeneficiary = line;
      if (el.querySelector(".lg-copy-title-action-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-action-beneficiary";
      btn.textContent = "复制标题动作受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleActionBeneficiary || "");
        softBanner(ok ? "已复制标题动作受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘提示+部门+标签组合复制 */
  async function ensureAssetHintDeptTagCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const tag = String(it.tag || "").trim() || "无标签";
      const line = hint + " · " + dept + " · " + tag;
      el.dataset.hintDeptTag = line;
      if (el.querySelector(".as-copy-hint-dept-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-dept-tag";
      btn.textContent = "复制提示部门标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintDeptTag || "");
        softBanner(ok ? "已复制提示部门标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次+可读文案 */
  async function ensureCheckinLastAgoReadablePlainR121Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoReadablePlainR121CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoReadablePlainR121CopyCard";
      card.className = "checkin-last-ago-readable-plain-r121-copy";
      const hrs = $("#checkinHoursRemainingReadablePlainR120CopyCard");
      const grace = $("#checkinGraceReadablePlainR119CopyCard");
      const nextSec = $("#checkinNextLabelSecondsPlainR118CopyCard");
      if (hrs && hrs.parentNode)
        hrs.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (nextSec && nextSec.parentNode)
        nextSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const ago = String(cd.last_ago_label || "").trim() || "—";
      const readable =
        String(cd.readable || cd.status_readable || "").trim() || "—";
      const combo = ago + " · " + readable;
      const line =
        "距上次 · 可读状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-readable-plain-r121-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoReadablePlainR121CopyBtn">复制距上次可读R121</button>`;
      const btn = $("#checkinLastAgoReadablePlainR121CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次可读R121" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次可读文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+达标+进度组合复制 */
  async function ensureTravelShortfallMetPctPlainR121Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallMetPctPlainR121CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallMetPctPlainR121CopyCard";
      card.className = "travel-shortfall-met-pct-plain-r121-copy";
      const pctMet = $("#travelPctMetBalancePlainR120CopyCard");
      const balShort = $("#travelBalanceShortfallThresholdPlainR119CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainCopyCard");
      if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const combo = short + " · " + met + " · " + pct + "%";
      const line =
        "差旅缺口 · 达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-met-pct-plain-r121-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallMetPctPlainR121CopyBtn">复制缺口达标进度</button>`;
      const btn = $("#travelShortfallMetPctPlainR121CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口达标进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口达标进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+拜访偏好+备注组合复制 */
  async function ensureAftercareStatusVisitNotesCopyButtons() {
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
      const status = String(it.status || "").trim() || "未填状态";
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = status + " · " + visit + " · " + notes;
      el.dataset.statusVisitNotes = line;
      if (el.querySelector(".ac-copy-status-visit-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-visit-notes";
      btn.textContent = "复制状态拜访备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusVisitNotes || "");
        softBanner(ok ? "已复制状态拜访备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+清单组合复制 */
  async function ensureAuthCompleteReadyChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyChecklistCopyCard";
      card.className = "av-complete-ready-checklist-copy";
      const readyComp = $("#avReadyCompleteChecklistCopyCard");
      const missGate = $("#avMissingGateChecklistCopyCard");
      const completeMiss = $("#avCompleteMissingChecklistCopyCard");
      if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else if (missGate && missGate.parentNode)
        missGate.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo = doneFlag + " · " + ready + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyChecklistCopyBtn">复制完成就绪清单</button>`;
      const btn = $("#avCompleteReadyChecklistCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+联系+口令提示组合复制 */
  async function ensureHeirRoleContactPassphraseCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const contact = String(it.contact || "").trim() || "未填联系";
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const line = role + " · " + contact + " · " + hint;
      if (el.querySelector(".bn-copy-role-contact-passphrase")) return;
      el.dataset.roleContactPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-contact-passphrase";
      btn.textContent = "复制角色联系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleContactPassphrase || "");
        softBanner(ok ? "已复制角色联系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+条目数+待办数组合复制 */
  async function ensureHandoverDomainItemCountTodosCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainItemCountTodosCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainItemCountTodosCopyCard";
      card.className = "hand-domain-item-count-todos-copy";
      const itemTodos = $("#handItemCountTodosDomainCopyCard");
      const todosExp = $("#handTodosDomainExportCopyCard");
      const domainTodos = $("#handDomainTodosBrandCopyCard");
      if (itemTodos && itemTodos.parentNode)
        itemTodos.insertAdjacentElement("afterend", card);
      else if (todosExp && todosExp.parentNode)
        todosExp.insertAdjacentElement("afterend", card);
      else if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "").trim() || "无域名";
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const combo = domain + " · " + ic + " · " + tcount;
      const line = "手册域名 · 条目 · 待办 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-item-count-todos-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainItemCountTodosCopyBtn">复制域名条目待办</button>`;
      const btn = $("#handDomainItemCountTodosCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名条目待办" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名条目待办暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+应用名+域名+就绪组合复制 + round 层含 121 */
  async function paintVersionAppDomainOkR121CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionAppDomainOkR121CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionAppDomainOkR121CopyCard";
      card.className = "card version-app-domain-ok-r121-copy-card";
      const domVer = $("#domainVersionAppOkR120CopyCard");
      const appOk = $("#appOkDomainBrandEnR119CopyCard");
      const verDom = $("#versionDomainAppOkR118CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · " + app + " · " + domain + " · " + ready;
      card.innerHTML = `<h3>版本 · 应用 · 域名 · 就绪</h3>
        <p class="muted">一键复制版本、应用名、域名与就绪状态（演示级）。</p>
        <p class="version-app-domain-ok-r121-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionAppDomainOkR121CopyBtn">复制版本应用域名就绪</button>`;
      const btn = $("#versionAppDomainOkR121CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本应用域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 应用 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList121() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 121;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 121); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round121 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleActionBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintDeptTagCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoReadablePlainR121Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallMetPctPlainR121Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusVisitNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRoleContactPassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainItemCountTodosCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleActionBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintDeptTagCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoReadablePlainR121Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallMetPctPlainR121Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusVisitNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRoleContactPassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainItemCountTodosCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionAppDomainOkR121CopyCard().catch(() => {});
        paintRoundLayerList121();
      }, 710);
      setTimeout(() => {
        paintVersionAppDomainOkR121CopyCard().catch(() => {});
        paintRoundLayerList121();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleActionBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetHintDeptTagCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoReadablePlainR121Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallMetPctPlainR121Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusVisitNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleContactPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainItemCountTodosCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionAppDomainOkR121CopyCard().catch(() => {});
      paintRoundLayerList121();
    }, 730);
  }
})();
