/* 电子继承 · 第一百零八批增量（叠在 round107…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round108SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文就绪域名冷静条 */
  async function paintHomeBrandEnOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnOkDomainCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnOkDomainCalmBar";
      bar.className = "home-brand-en-ok-domain-calm-bar";
      bar.setAttribute("role", "status");
      const appVer = $("#homeAppVersionDomainCalmBar");
      const okBrand = $("#homeOkBrandEnAppCalmBar");
      const domOk = $("#homeDomainOkAppCalmBar");
      if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + ready + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-mark">站点</span>
        <span class="muted home-brand-en-ok-domain-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-mark">站点</span>
        <span class="muted home-brand-en-ok-domain-calm-sub">英文就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+动作+标题组合复制 */
  async function ensureLegacyBeneficiaryActionTitleCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const action = String(it.action || "").trim() || "未填动作";
      const title = String(it.title || "").trim() || "未填标题";
      const line = ben + " · " + action + " · " + title;
      el.dataset.beneficiaryActionTitle = line;
      if (el.querySelector(".lg-copy-beneficiary-action-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-action-title";
      btn.textContent = "复制受益人动作标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryActionTitle || "");
        softBanner(ok ? "已复制受益人动作标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+处置+可见度组合复制 */
  async function ensureAssetIdDisposeVisibilityCopyButtons() {
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
      if (!it || it.id == null) return;
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const line = "#" + it.id + " · " + dispose + " · " + vis;
      el.dataset.idDisposeVisibility = line;
      if (el.querySelector(".as-copy-id-dispose-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-dispose-visibility";
      btn.textContent = "复制编号处置可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDisposeVisibility || "");
        softBanner(ok ? "已复制编号处置可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距今间隔文案 */
  async function ensureCheckinHoursAgoIntervalPlainR108Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursAgoIntervalPlainR108CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursAgoIntervalPlainR108CopyCard";
      card.className = "checkin-hours-ago-interval-plain-r108-copy";
      const interval = $("#checkinIntervalReadablePlainR107CopyCard");
      const due = $("#checkinDueSoonPlainR106CopyCard");
      const readable = $("#checkinReadablePlainR105CopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
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
      const sinceRaw = cd.hours_since_last;
      const since =
        sinceRaw == null || sinceRaw === ""
          ? "—"
          : String(Math.round(Number(sinceRaw) * 100) / 100);
      const intRaw = cd.interval_hours;
      const hours =
        intRaw == null || intRaw === ""
          ? "—"
          : String(Math.round(Number(intRaw) * 100) / 100);
      const combo = since + " · " + hours;
      const line =
        "报备距今 · 间隔 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-ago-interval-plain-r108-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursAgoIntervalPlainR108CopyBtn">复制距今间隔文案</button>`;
      const btn = $("#checkinHoursAgoIntervalPlainR108CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距今间隔文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+缺口+余额组合复制 */
  async function ensureTravelPctShortfallBalancePlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelPctShortfallBalancePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelPctShortfallBalancePlainCopyCard";
      card.className = "travel-pct-shortfall-balance-plain-copy";
      const thrMet = $("#travelThresholdMetShortfallPlainCopyCard");
      const metBal = $("#travelMetBalancePctPlainCopyCard");
      const shortBal = $("#travelShortfallBalancePctPlainCopyCard");
      if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
      else if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = pctStr + " · " + short + " · " + bal;
      const line =
        "差旅进度 · 缺口 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-pct-shortfall-balance-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelPctShortfallBalancePlainCopyBtn">复制进度缺口余额</button>`;
      const btn = $("#travelPctShortfallBalancePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度缺口余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度缺口余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+服务类型+备注组合复制 */
  async function ensureAftercareIdServiceNotesCopyButtons() {
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
      const svc = String(it.service_type || "").trim() || "未填服务";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + svc + " · " + notes;
      el.dataset.idServiceNotes = line;
      if (el.querySelector(".ac-copy-id-service-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-service-notes";
      btn.textContent = "复制编号服务备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idServiceNotes || "");
        softBanner(ok ? "已复制编号服务备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+清单数+完成组合复制 */
  async function ensureAuthReadyChecklistCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyChecklistCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyChecklistCompleteCopyCard";
      card.className = "av-ready-checklist-complete-copy";
      const completeMiss = $("#avCompleteMissingReadyCopyCard");
      const checklist = $("#avChecklistReadyGateCopyCard");
      const complete = $("#avCompleteReadyGateCopyCard");
      if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = ready + " · 清单 " + count + " · " + doneFlag;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-checklist-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyChecklistCompleteCopyBtn">复制就绪清单完成</button>`;
      const btn = $("#avReadyChecklistCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪清单完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪清单完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+姓名+编号组合复制 */
  async function ensureHeirRoleNameIdCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const line = role + " · " + name + " · #" + it.id;
      if (el.querySelector(".bn-copy-role-name-id")) return;
      el.dataset.roleNameId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-name-id";
      btn.textContent = "复制角色姓名编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleNameId || "");
        softBanner(ok ? "已复制角色姓名编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+待办数+条目数组合复制 */
  async function ensureHandoverDomainTodosItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainTodosItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainTodosItemCountCopyCard";
      card.className = "hand-domain-todos-item-count-copy";
      const brandTodos = $("#handBrandTodosExportCopyCard");
      const itemDom = $("#handItemCountDomainExportCopyCard");
      const todos = $("#handTodosBrandDomainCopyCard");
      if (brandTodos && brandTodos.parentNode)
        brandTodos.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
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
      const domain = String(data.domain || "").trim() || "无域名";
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const combo = domain + " · " + tcount + " · " + icount;
      const line = "手册域名 · 待办 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-todos-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainTodosItemCountCopyBtn">复制域名待办条目</button>`;
      const btn = $("#handDomainTodosItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名待办条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名待办条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+应用名+就绪+域名组合复制 + round 层含 108 */
  async function paintBrandEnAppOkDomainR108CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnAppOkDomainR108CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnAppOkDomainR108CopyCard";
      card.className = "card brand-en-app-ok-domain-r108-copy-card";
      const appOk = $("#appOkBrandEnVersionR107CopyCard");
      const okApp = $("#okAppBrandEnDomainR106CopyCard");
      const domBrand = $("#domainBrandEnOkVersionR105CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + app + " · " + ready + " · " + domain;
      card.innerHTML = `<h3>英文品牌 · 应用 · 就绪 · 域名</h3>
        <p class="muted">一键复制英文品牌、应用名、就绪状态与域名（演示级）。</p>
        <p class="brand-en-app-ok-domain-r108-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnAppOkDomainR108CopyBtn">复制英文应用就绪域名</button>`;
      const btn = $("#brandEnAppOkDomainR108CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文应用就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 应用 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList108() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 108;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 108); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round108 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryActionTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdDisposeVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursAgoIntervalPlainR108Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelPctShortfallBalancePlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdServiceNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyChecklistCompleteCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleNameIdCopyButtons().catch(() => {}), 650);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainTodosItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryActionTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdDisposeVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursAgoIntervalPlainR108Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelPctShortfallBalancePlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdServiceNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyChecklistCompleteCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleNameIdCopyButtons().catch(() => {}), 660);
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainTodosItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnAppOkDomainR108CopyCard().catch(() => {});
        paintRoundLayerList108();
      }, 710);
      setTimeout(() => {
        paintBrandEnAppOkDomainR108CopyCard().catch(() => {});
        paintRoundLayerList108();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyBeneficiaryActionTitleCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetIdDisposeVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursAgoIntervalPlainR108Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelPctShortfallBalancePlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdServiceNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyChecklistCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleNameIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainTodosItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnAppOkDomainR108CopyCard().catch(() => {});
      paintRoundLayerList108();
    }, 730);
  }
})();
