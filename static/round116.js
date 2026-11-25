/* 电子继承 · 第一百一十六批增量（叠在 round115…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round116SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名就绪英文冷静条 */
  async function paintHomeDomainOkBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainOkBrandEnCalmBarR116");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainOkBrandEnCalmBarR116";
      bar.className = "home-domain-ok-brand-en-calm-bar-r116";
      bar.setAttribute("role", "status");
      const verEn = $("#homeVersionBrandEnAppCalmBarR115");
      const okDom = $("#homeOkDomainVersionCalmBarR114");
      const brandEn = $("#homeBrandEnVersionOkCalmBar");
      if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = domain + " · " + ready + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-brand-en-calm-bar-r116-mark">域名</span>
        <span class="muted home-domain-ok-brand-en-calm-bar-r116-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkBrandEnCalmGoR116">去设置</button>`;
      const btn = $("#homeDomainOkBrandEnCalmGoR116");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-brand-en-calm-bar-r116-mark">域名</span>
        <span class="muted home-domain-ok-brand-en-calm-bar-r116-sub">域名就绪英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkBrandEnCalmGoR116">去设置</button>`;
      const btn = $("#homeDomainOkBrandEnCalmGoR116");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割部门+动作+标题组合复制 */
  async function ensureLegacyDeptActionTitleCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填动作";
      const title = String(it.title || "").trim() || "未填标题";
      const line = dept + " · " + action + " · " + title;
      el.dataset.deptActionTitle = line;
      if (el.querySelector(".lg-copy-dept-action-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-action-title";
      btn.textContent = "复制部门动作标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptActionTitle || "");
        softBanner(ok ? "已复制部门动作标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置+平台+可见度组合复制 */
  async function ensureAssetDisposePlatformVisCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = dispose + " · " + platform + " · " + vis;
      el.dataset.disposePlatformVis = line;
      if (el.querySelector(".as-copy-dispose-platform-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-platform-vis";
      btn.textContent = "复制处置平台可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposePlatformVis || "");
        softBanner(ok ? "已复制处置平台可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距今标签宽限文案 */
  async function ensureCheckinAgoLabelGracePlainR116Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinAgoLabelGracePlainR116CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinAgoLabelGracePlainR116CopyCard";
      card.className = "checkin-ago-label-grace-plain-r116-copy";
      const lastLabel = $("#checkinLastLabelHoursPlainR115CopyCard");
      const labelInt = $("#checkinLabelIntervalPlainR114CopyCard");
      const secLeft = $("#checkinSecondsLeftPlainR113CopyCard");
      if (lastLabel && lastLabel.parentNode)
        lastLabel.insertAdjacentElement("afterend", card);
      else if (labelInt && labelInt.parentNode)
        labelInt.insertAdjacentElement("afterend", card);
      else if (secLeft && secLeft.parentNode)
        secLeft.insertAdjacentElement("afterend", card);
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
      const graceRaw = cd.grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Math.round(Number(graceRaw) * 100) / 100);
      const combo = ago + " · " + grace;
      const line =
        "报备距今 · 宽限 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-ago-label-grace-plain-r116-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinAgoLabelGracePlainR116CopyBtn">复制距今标签宽限R116</button>`;
      const btn = $("#checkinAgoLabelGracePlainR116CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距今标签宽限R116" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今标签宽限文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+缺口+进度百分比组合复制 */
  async function ensureTravelThresholdShortfallPctPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdShortfallPctPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdShortfallPctPlainCopyCard";
      card.className = "travel-threshold-shortfall-pct-plain-copy";
      const shortBal = $("#travelShortfallBalanceMetPlainR115CopyCard");
      const balThr = $("#travelBalanceThresholdPctPlainCopyCard");
      const shortPct = $("#travelShortfallPctMetPlainR113CopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (shortPct && shortPct.parentNode)
        shortPct.insertAdjacentElement("afterend", card);
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
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const combo = thr + " · " + short + " · " + pctStr;
      const line =
        "差旅门槛 · 缺口 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-shortfall-pct-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdShortfallPctPlainCopyBtn">复制门槛缺口进度</button>`;
      const btn = $("#travelThresholdShortfallPctPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛缺口进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛缺口进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+预算+城市组合复制 */
  async function ensureAftercareStatusBudgetCityCopyButtons() {
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
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const city = String(it.city || "").trim() || "未填城市";
      const line = status + " · " + budget + " · " + city;
      el.dataset.statusBudgetCity = line;
      if (el.querySelector(".ac-copy-status-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-budget-city";
      btn.textContent = "复制状态预算城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusBudgetCity || "");
        softBanner(ok ? "已复制状态预算城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单数+缺失数+闸口组合复制 */
  async function ensureAuthChecklistMissingGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistMissingGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistMissingGateCopyCard";
      card.className = "av-checklist-missing-gate-copy";
      const gateReady = $("#avGateReadyChecklistCopyCard");
      const missReady = $("#avMissingReadyCompleteCopyCard");
      const completeGate = $("#avCompleteGateChecklistCopyCard");
      if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const gate = truthyFlag(data.gate) ? "闸口开" : "闸口关";
      const combo =
        "清单 " + list.length + " · 缺失 " + missing.length + " · " + gate;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-missing-gate-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistMissingGateCopyBtn">复制清单缺失闸口</button>`;
      const btn = $("#avChecklistMissingGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单缺失闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单缺失闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+角色+关系组合复制 */
  async function ensureHeirPassphraseRoleRelationCopyButtons() {
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
      const phrase =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = phrase + " · " + role + " · " + relation;
      if (el.querySelector(".bn-copy-passphrase-role-relation")) return;
      el.dataset.passphraseRoleRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-role-relation";
      btn.textContent = "复制口令角色关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseRoleRelation || "");
        softBanner(ok ? "已复制口令角色关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+待办数+域名组合复制 */
  async function ensureHandoverBrandTodosDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandTodosDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandTodosDomainCopyCard";
      card.className = "hand-brand-todos-domain-copy";
      const itemExp = $("#handItemCountExportBrandCopyCard");
      const domBrand = $("#handDomainBrandExportCopyCard");
      const todos = $("#handTodosExportItemCountCopyCard");
      if (itemExp && itemExp.parentNode)
        itemExp.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
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
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = brand + " · " + tcount + " · " + domain;
      const line = "手册品牌 · 待办 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-todos-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandTodosDomainCopyBtn">复制品牌待办域名</button>`;
      const btn = $("#handBrandTodosDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌待办域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌待办域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+应用名+版本+域名组合复制 + round 层含 116 */
  async function paintOkAppVersionDomainR116CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okAppVersionDomainR116CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okAppVersionDomainR116CopyCard";
      card.className = "card ok-app-version-domain-r116-copy-card";
      const domOk = $("#domainOkAppBrandEnR115CopyCard");
      const appVer = $("#appVersionBrandEnOkR114CopyCard");
      const verOk = $("#versionOkDomainBrandEnR113CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ready + " · " + app + " · " + ver + " · " + domain;
      card.innerHTML = `<h3>就绪 · 应用 · 版本 · 域名</h3>
        <p class="muted">一键复制就绪状态、应用名、版本与域名（演示级）。</p>
        <p class="ok-app-version-domain-r116-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okAppVersionDomainR116CopyBtn">复制就绪应用版本域名</button>`;
      const btn = $("#okAppVersionDomainR116CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪应用版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 应用 · 版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList116() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 116;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 116); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round116 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainOkBrandEn().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeptActionTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposePlatformVisCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinAgoLabelGracePlainR116Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdShortfallPctPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusBudgetCityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthChecklistMissingGateCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseRoleRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandTodosDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainOkBrandEn().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeptActionTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposePlatformVisCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinAgoLabelGracePlainR116Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdShortfallPctPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusBudgetCityCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistMissingGateCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseRoleRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandTodosDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkAppVersionDomainR116CopyCard().catch(() => {});
        paintRoundLayerList116();
      }, 710);
      setTimeout(() => {
        paintOkAppVersionDomainR116CopyCard().catch(() => {});
        paintRoundLayerList116();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainOkBrandEn().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyDeptActionTitleCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDisposePlatformVisCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinAgoLabelGracePlainR116Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdShortfallPctPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistMissingGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseRoleRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandTodosDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkAppVersionDomainR116CopyCard().catch(() => {});
      paintRoundLayerList116();
    }, 730);
  }
})();
