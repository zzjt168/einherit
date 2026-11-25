/* 电子继承 · 第八十九批增量（叠在 round88…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round89SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名英文品牌冷静条 */
  async function paintHomeDomainBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnBar";
      bar.className = "home-domain-brand-en-bar";
      bar.setAttribute("role", "status");
      const brandOk = $("#homeBrandEnOkBar");
      const appName = $("#homeAppNameCalmBar");
      const appOk = $("#homeAppOkCalmBar");
      if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (appName && appName.parentNode === home)
        appName.insertAdjacentElement("afterend", bar);
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
      const sub = domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-mark">站点</span>
        <span class="muted home-domain-brand-en-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnGo">去设置</button>`;
      const btn = $("#homeDomainBrandEnGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-mark">站点</span>
        <span class="muted home-domain-brand-en-sub">域名英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnGo">去设置</button>`;
      const btn = $("#homeDomainBrandEnGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+备注组合复制 */
  async function ensureLegacyTitleBeneficiaryNotesCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = title + " · " + ben + " · " + notes;
      el.dataset.titleBeneficiaryNotes = line;
      if (el.querySelector(".lg-copy-title-beneficiary-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-notes";
      btn.textContent = "复制标题受益人备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryNotes || "");
        softBanner(ok ? "已复制标题受益人备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+平台+处置组合复制 */
  async function ensureAssetIdPlatformDisposeCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const line = "#" + it.id + " · " + platform + " · " + dispose;
      el.dataset.idPlatformDispose = line;
      if (el.querySelector(".as-copy-id-platform-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-platform-dispose";
      btn.textContent = "复制编号平台处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlatformDispose || "");
        softBanner(ok ? "已复制编号平台处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制冷静期小时文案 */
  async function ensureCheckinGraceHoursPlainR89Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursPlainR89CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursPlainR89CopyCard";
      card.className = "checkin-grace-hours-plain-r89-copy";
      const interval = $("#checkinIntervalHoursPlainR88CopyCard");
      const secs = $("#checkinSecondsRemainingPlainR87CopyCard");
      const last = $("#checkinLastCheckinLabelPlainCopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (secs && secs.parentNode)
        secs.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).grace_hours;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备冷静期 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-plain-r89-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursPlainR89CopyBtn">复制冷静期小时文案</button>`;
      const btn = $("#checkinGraceHoursPlainR89CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制冷静期小时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">冷静期小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛与余额组合复制 */
  async function ensureTravelThresholdBalancePlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalancePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalancePlainCopyCard";
      card.className = "travel-threshold-balance-plain-copy";
      const metBal = $("#travelMetBalancePlainCopyCard");
      const balShort = $("#travelBalanceShortfallPlainCopyCard");
      const shortPct = $("#travelShortfallProgressPctCopyCard");
      if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = thr + " · " + bal;
      const line = "差旅门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalancePlainCopyBtn">复制门槛余额文案</button>`;
      const btn = $("#travelThresholdBalancePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+阶段+备注组合复制 */
  async function ensureAftercareTitlePhaseNotesCopyButtons() {
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
      const phase = String(it.phase || "").trim() || "未填阶段";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = title + " · " + phase + " · " + notes;
      el.dataset.titlePhaseNotes = line;
      if (el.querySelector(".ac-copy-title-phase-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-phase-notes";
      btn.textContent = "复制标题阶段备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titlePhaseNotes || "");
        softBanner(ok ? "已复制标题阶段备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本条数与完成文案组合复制 */
  async function ensureAuthScriptCountCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptCountCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptCountCompleteCopyCard";
      card.className = "av-script-count-complete-copy";
      const checklist = $("#avChecklistReadyCopyCard");
      const active = $("#avActiveIdReadyCopyCard");
      const complete = $("#avCompleteLabelReadyComboCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const scripts = Array.isArray(data.script) ? data.script : [];
      const count = scripts.length;
      const label =
        String(data.complete_label || "").trim() ||
        (truthyFlag(data.complete) ? "已完成" : "未完成");
      const combo = "脚本 " + count + " · " + label;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-script-count-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptCountCompleteCopyBtn">复制脚本数与完成</button>`;
      const btn = $("#avScriptCountCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制脚本数与完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本数与完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+口令提示组合复制 */
  async function ensureHeirNameRelationPassphraseCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = name + " · " + relation + " · " + phrase;
      if (el.querySelector(".bn-copy-name-relation-passphrase")) return;
      el.dataset.nameRelationPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-passphrase";
      btn.textContent = "复制姓名关系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationPassphrase || "");
        softBanner(ok ? "已复制姓名关系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数与域名组合复制 */
  async function ensureHandoverTodoCountDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodoCountDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodoCountDomainCopyCard";
      card.className = "hand-todo-count-domain-copy";
      const itemShare = $("#handItemCountShareHintCopyCard");
      const exportShare = $("#handExportPathShareHintCopyCard");
      const genDom = $("#handGeneratedAtDomainCopyCard");
      if (itemShare && itemShare.parentNode)
        itemShare.insertAdjacentElement("afterend", card);
      else if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todos = data.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      const domain = String(data.domain || "einherit.cn").trim();
      const combo = count + " · " + domain;
      const line = "手册待办 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-todo-count-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodoCountDomainCopyBtn">复制待办数域名</button>`;
      const btn = $("#handTodoCountDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办数域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办数与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+就绪+英文品牌组合复制 + round 层含 89 */
  async function paintVersionOkBrandEnR89CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionOkBrandEnR89CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionOkBrandEnR89CopyCard";
      card.className = "card version-ok-brand-en-r89-copy-card";
      const domainOk = $("#domainOkBrandEnR88CopyCard");
      const appVer = $("#appVersionBrandEnR87CopyCard");
      const server = $("#serverOkBrandEnR86CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · ok·" + okPart + " · " + en;
      card.innerHTML = `<h3>版本 · 就绪 · 英文品牌</h3>
        <p class="muted">一键复制版本、就绪状态与英文品牌（演示级）。</p>
        <p class="version-ok-brand-en-r89-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionOkBrandEnR89CopyBtn">复制版本就绪英文</button>`;
      const btn = $("#versionOkBrandEnR89CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 就绪 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList89() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 89;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 89); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round89 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEn().catch(() => {}), 720);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleBeneficiaryNotesCopyButtons().catch(() => {}),
      550
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdPlatformDisposeCopyButtons().catch(() => {}),
      550
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceHoursPlainR89Copy().catch(() => {}),
      540
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdBalancePlainCopy().catch(() => {}),
      560
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitlePhaseNotesCopyButtons().catch(() => {}),
      550
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthScriptCountCompleteCopy().catch(() => {}),
      520
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationPassphraseCopyButtons().catch(() => {}),
      550
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodoCountDomainCopy().catch(() => {}),
      560
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEn().catch(() => {}), 720);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleBeneficiaryNotesCopyButtons().catch(() => {}),
        570
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdPlatformDisposeCopyButtons().catch(() => {}),
        560
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceHoursPlainR89Copy().catch(() => {}),
        560
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdBalancePlainCopy().catch(() => {}),
        580
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitlePhaseNotesCopyButtons().catch(() => {}),
        570
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthScriptCountCompleteCopy().catch(() => {}),
        540
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationPassphraseCopyButtons().catch(() => {}),
        560
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodoCountDomainCopy().catch(() => {}),
        570
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkBrandEnR89CopyCard().catch(() => {});
        paintRoundLayerList89();
      }, 610);
      setTimeout(() => {
        paintVersionOkBrandEnR89CopyCard().catch(() => {});
        paintRoundLayerList89();
      }, 1290);
    }
  };

  setTimeout(() => paintHomeDomainBrandEn().catch(() => {}), 770);
  setTimeout(
    () => ensureLegacyTitleBeneficiaryNotesCopyButtons().catch(() => {}),
    790
  );
  setTimeout(
    () => ensureAssetIdPlatformDisposeCopyButtons().catch(() => {}),
    810
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursPlainR89Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalancePlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitlePhaseNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptCountCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodoCountDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkBrandEnR89CopyCard().catch(() => {});
      paintRoundLayerList89();
    }, 630);
  }
})();
