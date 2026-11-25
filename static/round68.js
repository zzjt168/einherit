/* 电子继承 · 第六十八批增量（叠在 round67…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round68SoftBanner_" + (hostId || "home");
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

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
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

  /* 1 · 首页备用联系人数冷静条 */
  async function paintHomeBackupCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBackupCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBackupCountBar";
      bar.className = "home-backup-count-bar";
      bar.setAttribute("role", "status");
      const overdue = $("#homeOverdueBar");
      const domain = $("#homeDomainBrandBar");
      const member = $("#homeIsMemberBar");
      if (overdue && overdue.parentNode === home)
        overdue.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const list = (st.user || {}).backup_contacts || [];
      const n = Array.isArray(list) ? list.length : 0;
      const sub = "备用联系人 · " + String(n) + " 位";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-backup-count-mark">备用</span>
        <span class="muted home-backup-count-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBackupCountGo">去报备</button>`;
      const btn = $("#homeBackupCountGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-backup-count-mark">备用</span>
        <span class="muted home-backup-count-sub">备用联系人数暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBackupCountGo">去报备</button>`;
      const btn = $("#homeBackupCountGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+双清除状态组合复制 */
  async function ensureLegacyIdClearBothCopyButtons() {
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
      const photos = truthyFlag(it.clear_photos)
        ? "已勾清除照片"
        : "未勾清除照片";
      const chats = truthyFlag(it.clear_chats)
        ? "已勾清除聊天"
        : "未勾清除聊天";
      const line = "#" + it.id + " · " + photos + " · " + chats;
      el.dataset.idClearBoth = line;
      if (el.querySelector(".lg-copy-id-clear-both")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-clear-both";
      btn.textContent = "复制编号与双清除";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idClearBoth || "");
        softBanner(ok ? "已复制编号与双清除" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+处置备注组合复制 */
  async function ensureAssetVisDisposeCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const line = vis + " · " + dispose;
      el.dataset.visDispose = line;
      if (el.querySelector(".as-copy-vis-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-vis-dispose";
      btn.textContent = "复制可见性与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visDispose || "");
        softBanner(ok ? "已复制可见性与处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制备用联系人数 */
  async function ensureCheckinBackupCountCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinBackupCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinBackupCountCopyCard";
      card.className = "checkin-backup-count-copy";
      const until = $("#checkinMemberUntilDaysCopyCard");
      const due = $("#checkinDueSoonHoursCopyCard");
      const ago = $("#checkinLastAgoHoursSinceCopyCard");
      if (until && until.parentNode)
        until.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const list = (st.user || {}).backup_contacts || [];
      const n = Array.isArray(list) ? list.length : 0;
      const combo = String(n);
      const line =
        "备用联系人数 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-backup-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinBackupCountCopyBtn">复制备用联系人数</button>`;
      const btn = $("#checkinBackupCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制备用联系人数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">备用联系人数暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水种类+金额组合复制 */
  async function ensureTravelLedgerKindAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerKindAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerKindAmountCopyCard";
      card.className = "travel-ledger-kind-amount-copy";
      const balMet = $("#travelBalanceMetCopyCard");
      const metShort = $("#travelMetShortfallCopyCard");
      const prog = $("#travelProgressLabelPctCopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
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
        card.innerHTML = `<p class="muted">流水种类与金额暂不可用</p>`;
        return;
      }
      const row = ledger[0] || {};
      const kind = String(row.kind || row.kind_label || "").trim();
      const amt = row.amount;
      if (!kind && amt == null) {
        card.innerHTML = `<p class="muted">流水种类与金额暂不可用</p>`;
        return;
      }
      const amtPart =
        amt == null ? "—" : String(Math.round(Number(amt)));
      const combo = kind ? kind + " · " + amtPart : amtPart;
      const line = "差旅流水种类 · 金额 · " + combo;
      card.innerHTML = `<p class="muted travel-ledger-kind-amount-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerKindAmountCopyBtn">复制种类与金额</button>`;
      const btn = $("#travelLedgerKindAmountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制种类与金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水种类与金额暂不可用</p>`;
    }
  }

  /* 6 · 善后到访偏好+城市组合复制 */
  async function ensureAftercareVisitCityCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim() || "未填到访偏好";
      const city = String(it.city || "").trim();
      const line = city ? pref + " · " + city : pref;
      el.dataset.visitCity = line;
      if (el.querySelector(".ac-copy-visit-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-city";
      btn.textContent = "复制到访偏好与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitCity || "");
        softBanner(ok ? "已复制到访偏好与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频文件名+状态组合复制 */
  async function ensureAuthFilenameStatusCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avFilenameStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avFilenameStatusCopyCard";
      card.className = "av-filename-status-copy";
      const bools = $("#avCompleteReadyBoolCopyCard");
      const missing = $("#avMissingLabelsCopyCard");
      const gate = $("#avGateCopyCard");
      if (bools && bools.parentNode)
        bools.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const name = String(active.filename || "").trim();
      const status = String(active.status || "").trim();
      if (!name && !status) {
        card.innerHTML = `<p class="muted">文件名与状态暂不可用</p>`;
        return;
      }
      const combo =
        name && status ? name + " · " + status : name || status;
      const line = "授权视频文件名 · 状态 · " + combo;
      card.innerHTML = `<p class="muted av-filename-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avFilenameStatusCopyBtn">复制文件名与状态</button>`;
      const btn = $("#avFilenameStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制文件名与状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">文件名与状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+口令提示组合复制 */
  async function ensureHeirRelationPassphraseCopyButtons() {
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
      const relation = String(it.relation || "").trim();
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = relation ? relation + " · " + hint : hint;
      if (!line || el.querySelector(".bn-copy-relation-passphrase")) return;
      el.dataset.relationPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-passphrase";
      btn.textContent = "复制关系与口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPassphrase || "");
        softBanner(ok ? "已复制关系与口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间与域名组合复制 */
  async function ensureHandoverGeneratedDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedDomainCopyCard";
      card.className = "hand-generated-domain-copy";
      const itemPct = $("#handItemPctCopyCard");
      const brand = $("#handBrandMemberCopyCard");
      const domainExec = $("#handDomainExecutorCopyCard");
      if (itemPct && itemPct.parentNode)
        itemPct.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode)
        brand.insertAdjacentElement("afterend", card);
      else if (domainExec && domainExec.parentNode)
        domainExec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const iso = String(data.generated_at_iso || "").trim();
      const domain = String(data.domain || "").trim();
      if (!iso && !domain) {
        card.innerHTML = `<p class="muted">生成时间与域名暂不可用</p>`;
        return;
      }
      const combo =
        iso && domain ? iso + " · " + domain : iso || domain;
      const line = "手册生成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-generated-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedDomainCopyBtn">复制生成时间与域名</button>`;
      const btn = $("#handGeneratedDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生成时间与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生成时间与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用版本+域名组合复制 + round 层含 68 */
  async function paintAppVerDomainR68CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appVerDomainR68CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appVerDomainR68CopyCard";
      card.className = "card app-ver-domain-r68-copy-card";
      const enServer = $("#enServerCopyCard");
      const okVer = $("#okVersionCopyCard");
      const serverDomain = $("#serverVersionDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (enServer && enServer.parentNode)
        enServer.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (serverDomain && serverDomain.parentNode)
        serverDomain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · " + domain;
      card.innerHTML = `<h3>版本与域名</h3>
        <p class="muted">一键复制应用版本与域名（演示级）。</p>
        <p class="app-ver-domain-r68-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appVerDomainR68CopyBtn">复制版本号与域名</button>`;
      const btn = $("#appVerDomainR68CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本号与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList68() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 68;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 68); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round68 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBackupCount().catch(() => {}), 510);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdClearBothCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisDisposeCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinBackupCountCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerKindAmountCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitCityCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthFilenameStatusCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPassphraseCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverGeneratedDomainCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBackupCount().catch(() => {}), 510);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdClearBothCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisDisposeCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinBackupCountCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerKindAmountCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitCityCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthFilenameStatusCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPassphraseCopyButtons().catch(() => {}),
        350
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverGeneratedDomainCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintAppVerDomainR68CopyCard().catch(() => {});
        paintRoundLayerList68();
      }, 400);
      setTimeout(() => {
        paintAppVerDomainR68CopyCard().catch(() => {});
        paintRoundLayerList68();
      }, 980);
    }
  };

  setTimeout(() => paintHomeBackupCount().catch(() => {}), 560);
  setTimeout(() => ensureLegacyIdClearBothCopyButtons().catch(() => {}), 580);
  setTimeout(() => ensureAssetVisDisposeCopyButtons().catch(() => {}), 600);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinBackupCountCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerKindAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthFilenameStatusCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppVerDomainR68CopyCard().catch(() => {});
      paintRoundLayerList68();
    }, 420);
  }
})();
