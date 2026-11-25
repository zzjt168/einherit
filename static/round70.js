/* 电子继承 · 第七十批增量（叠在 round69…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round70SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌冷静条 */
  async function paintHomeBrandApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandAppBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandAppBar";
      bar.className = "home-brand-app-bar";
      bar.setAttribute("role", "status");
      const exec = $("#homeExecutorNameBar");
      const backup = $("#homeBackupCountBar");
      const overdue = $("#homeOverdueBar");
      if (exec && exec.parentNode === home)
        exec.insertAdjacentElement("afterend", bar);
      else if (backup && backup.parentNode === home)
        backup.insertAdjacentElement("afterend", bar);
      else if (overdue && overdue.parentNode === home)
        overdue.insertAdjacentElement("afterend", bar);
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
      const sub = "品牌 · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-app-mark">品牌</span>
        <span class="muted home-brand-app-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandAppGo">去设置</button>`;
      const btn = $("#homeBrandAppGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-app-mark">品牌</span>
        <span class="muted home-brand-app-sub">品牌信息暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandAppGo">去设置</button>`;
      const btn = $("#homeBrandAppGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+部门+处置组合复制 */
  async function ensureLegacyTitleDeptActionCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const dept = String(it.dept || "").trim() || "未填部门";
      const action = String(it.action || "").trim() || "未填处置";
      const line = title + " · " + dept + " · " + action;
      el.dataset.titleDeptAction = line;
      if (el.querySelector(".lg-copy-title-dept-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-dept-action";
      btn.textContent = "复制标题部门处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDeptAction || "");
        softBanner(ok ? "已复制标题部门处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+账号提示组合复制 */
  async function ensureAssetSummaryHintCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = summary + " · " + hint;
      el.dataset.summaryHint = line;
      if (el.querySelector(".as-copy-summary-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-hint";
      btn.textContent = "复制摘要与账号提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryHint || "");
        softBanner(ok ? "已复制摘要与账号提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制手机号 */
  async function ensureCheckinPhonePlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinPhonePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinPhonePlainCopyCard";
      card.className = "checkin-phone-plain-copy";
      const softHard = $("#checkinSoftHardDueCopyCard");
      const backup = $("#checkinBackupCountCopyCard");
      const until = $("#checkinMemberUntilDaysCopyCard");
      if (softHard && softHard.parentNode)
        softHard.insertAdjacentElement("afterend", card);
      else if (backup && backup.parentNode)
        backup.insertAdjacentElement("afterend", card);
      else if (until && until.parentNode)
        until.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const phone = String((st.user || {}).phone || "").trim();
      if (!phone) {
        card.innerHTML = `<p class="muted">报备手机号暂不可用</p>`;
        return;
      }
      const line =
        "报备手机号 · " +
        phone +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-phone-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinPhonePlainCopyBtn">复制报备手机号</button>`;
      const btn = $("#checkinPhonePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(phone);
          softBanner(ok ? "已复制报备手机号" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备手机号暂不可用</p>`;
    }
  }

  /* 5 · 差旅流水善后关联与金额组合复制 */
  async function ensureTravelHasAftercareAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelHasAftercareAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelHasAftercareAmountCopyCard";
      card.className = "travel-has-aftercare-amount-copy";
      const refund = $("#travelRefundKindNoteCopyCard");
      const kindAmt = $("#travelLedgerKindAmountCopyCard");
      const balMet = $("#travelBalanceMetCopyCard");
      if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else if (kindAmt && kindAmt.parentNode)
        kindAmt.insertAdjacentElement("afterend", card);
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
      const ledger = data.ledger || [];
      if (!ledger.length) {
        card.innerHTML = `<p class="muted">善后关联与金额暂不可用</p>`;
        return;
      }
      const row = ledger[0] || {};
      const linked = truthyFlag(row.has_aftercare_ref)
        ? "已关联善后"
        : "未关联善后";
      const amt =
        row.amount == null ? "—" : String(Math.round(Number(row.amount)));
      const combo = linked + " · " + amt;
      const line = "差旅流水善后关联 · 金额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-has-aftercare-amount-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelHasAftercareAmountCopyBtn">复制善后关联与金额</button>`;
      const btn = $("#travelHasAftercareAmountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制善后关联与金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">善后关联与金额暂不可用</p>`;
    }
  }

  /* 6 · 善后备注+城市组合复制 */
  async function ensureAftercareNotesCityCopyButtons() {
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
      const city = String(it.city || "").trim();
      const line = city ? notes + " · " + city : notes;
      el.dataset.notesCity = line;
      if (el.querySelector(".ac-copy-notes-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-notes-city";
      btn.textContent = "复制备注与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesCity || "");
        softBanner(ok ? "已复制备注与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效编号+状态组合复制 */
  async function ensureAuthActiveIdStatusCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveIdStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveIdStatusCopyCard";
      card.className = "av-active-id-status-copy";
      const thresh = $("#avThresholdReadyCopyCard");
      const filename = $("#avFilenameStatusCopyCard");
      const bools = $("#avCompleteReadyBoolCopyCard");
      if (thresh && thresh.parentNode)
        thresh.insertAdjacentElement("afterend", card);
      else if (filename && filename.parentNode)
        filename.insertAdjacentElement("afterend", card);
      else if (bools && bools.parentNode)
        bools.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const id =
        active.id != null
          ? active.id
          : data.current_active_id != null
          ? data.current_active_id
          : null;
      const status = String(active.status || "").trim();
      if (id == null && !status) {
        card.innerHTML = `<p class="muted">生效编号与状态暂不可用</p>`;
        return;
      }
      const idPart = id == null ? "—" : "#" + String(id);
      const combo = status ? idPart + " · " + status : idPart;
      const line = "授权视频生效 · " + combo;
      card.innerHTML = `<p class="muted av-active-id-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avActiveIdStatusCopyBtn">复制生效编号与状态</button>`;
      const btn = $("#avActiveIdStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生效编号与状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效编号与状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+角色组合复制 */
  async function ensureHeirNameRelationRoleCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const role = String(it.role || "").trim() || "未填角色";
      const line = name + " · " + relation + " · " + role;
      if (el.querySelector(".bn-copy-name-relation-role")) return;
      el.dataset.nameRelationRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-role";
      btn.textContent = "复制姓名关系角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationRole || "");
        softBanner(ok ? "已复制姓名关系角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目总数与域名组合复制 */
  async function ensureHandoverItemCountDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountDomainCopyCard";
      card.className = "hand-item-count-domain-copy";
      const share = $("#handShareDomainCopyCard");
      const genDom = $("#handGeneratedDomainCopyCard");
      const itemPct = $("#handItemPctCopyCard");
      if (share && share.parentNode)
        share.insertAdjacentElement("afterend", card);
      else if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else if (itemPct && itemPct.parentNode)
        itemPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count = data.item_count;
      const domain = String(data.domain || "").trim();
      if (count == null && !domain) {
        card.innerHTML = `<p class="muted">条目与域名暂不可用</p>`;
        return;
      }
      const countPart = count == null ? "—" : String(count);
      const combo = domain ? countPart + " · " + domain : countPart;
      const line = "手册条目 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountDomainCopyBtn">复制条目与域名</button>`;
      const btn = $("#handItemCountDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+域名+英文品牌组合复制 + round 层含 70 */
  async function paintAppBrandDomainEnCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appBrandDomainEnR70CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appBrandDomainEnR70CopyCard";
      card.className = "card app-brand-domain-en-r70-copy-card";
      const brandOk = $("#brandEnOkR69CopyCard");
      const verDom = $("#appVerDomainR68CopyCard");
      const enServer = $("#enServerCopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (enServer && enServer.parentNode)
        enServer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = app + " · " + domain + " · " + en;
      card.innerHTML = `<h3>品牌 · 域名 · 英文</h3>
        <p class="muted">一键复制中文品牌、域名与英文品牌（演示级 · 里程碑 round70）。</p>
        <p class="app-brand-domain-en-r70-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appBrandDomainEnR70CopyBtn">复制品牌域名英文</button>`;
      const btn = $("#appBrandDomainEnR70CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList70() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 70;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 70); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round70 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandApp().catch(() => {}), 530);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDeptActionCopyButtons().catch(() => {}),
      360
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryHintCopyButtons().catch(() => {}),
      360
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinPhonePlainCopy().catch(() => {}), 350);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelHasAftercareAmountCopy().catch(() => {}), 370);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareNotesCityCopyButtons().catch(() => {}),
      360
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveIdStatusCopy().catch(() => {}), 330);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationRoleCopyButtons().catch(() => {}),
      360
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverItemCountDomainCopy().catch(() => {}), 370);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandApp().catch(() => {}), 530);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleDeptActionCopyButtons().catch(() => {}),
        380
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryHintCopyButtons().catch(() => {}),
        370
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinPhonePlainCopy().catch(() => {}), 370);
    if (id === "travel")
      setTimeout(() => ensureTravelHasAftercareAmountCopy().catch(() => {}), 390);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareNotesCityCopyButtons().catch(() => {}),
        380
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveIdStatusCopy().catch(() => {}), 350);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationRoleCopyButtons().catch(() => {}),
        370
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverItemCountDomainCopy().catch(() => {}), 380);
    if (id === "settings") {
      setTimeout(() => {
        paintAppBrandDomainEnCopyCard().catch(() => {});
        paintRoundLayerList70();
      }, 420);
      setTimeout(() => {
        paintAppBrandDomainEnCopyCard().catch(() => {});
        paintRoundLayerList70();
      }, 1000);
    }
  };

  setTimeout(() => paintHomeBrandApp().catch(() => {}), 580);
  setTimeout(() => ensureLegacyTitleDeptActionCopyButtons().catch(() => {}), 600);
  setTimeout(() => ensureAssetSummaryHintCopyButtons().catch(() => {}), 620);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinPhonePlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelHasAftercareAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareNotesCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveIdStatusCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppBrandDomainEnCopyCard().catch(() => {});
      paintRoundLayerList70();
    }, 440);
  }
})();
