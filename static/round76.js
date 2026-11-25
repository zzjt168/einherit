/* 电子继承 · 第七十六批增量（叠在 round75…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round76SoftBanner_" + (hostId || "home");
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

  function yn(v) {
    return truthyFlag(v) ? "是" : "否";
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

  /* 1 · 首页会员到期日冷静条 */
  async function paintHomeMemberUntil() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberUntilBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberUntilBar";
      bar.className = "home-member-until-bar";
      bar.setAttribute("role", "status");
      const inGrace = $("#homeInGraceBar");
      const interval = $("#homeIntervalHoursBar");
      const grace = $("#homeGraceHoursBar");
      if (inGrace && inGrace.parentNode === home)
        inGrace.insertAdjacentElement("afterend", bar);
      else if (interval && interval.parentNode === home)
        interval.insertAdjacentElement("afterend", bar);
      else if (grace && grace.parentNode === home)
        grace.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const until =
        String((st.user || {}).member_until_iso || "").trim() || "未填到期日";
      const sub = "到期 · " + until;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-until-mark">到期</span>
        <span class="muted home-member-until-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeMemberUntilGo">去报备</button>`;
      const btn = $("#homeMemberUntilGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-until-mark">到期</span>
        <span class="muted home-member-until-sub">会员到期日暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeMemberUntilGo">去报备</button>`;
      const btn = $("#homeMemberUntilGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割标题+备注+处置组合复制 */
  async function ensureLegacyTitleNotesActionCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const action = String(it.action || "").trim() || "未填处置";
      const line = title + " · " + notes + " · " + action;
      el.dataset.titleNotesAction = line;
      if (el.querySelector(".lg-copy-title-notes-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-notes-action";
      btn.textContent = "复制标题备注处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleNotesAction || "");
        softBanner(ok ? "已复制标题备注处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+部门+标签组合复制 */
  async function ensureAssetIdDeptTagCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const tag = String(it.tag || "").trim() || "无标签";
      const line = "#" + it.id + " · " + dept + " · " + tag;
      el.dataset.idDeptTag = line;
      if (el.querySelector(".as-copy-id-dept-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-dept-tag";
      btn.textContent = "复制编号部门标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDeptTag || "");
        softBanner(ok ? "已复制编号部门标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员温柔提示 */
  async function ensureCheckinMemberGentleHintPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberGentleHintPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberGentleHintPlainCopyCard";
      card.className = "checkin-member-gentle-hint-plain-copy";
      const inGrace = $("#checkinInGracePlainCopyCard");
      const interval = $("#checkinIntervalHoursPlainCopyCard");
      const grace = $("#checkinGraceHoursPlainCopyCard");
      if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
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
      const hint = String((st.user || {}).member_gentle_hint || "").trim();
      if (!hint) {
        card.innerHTML = `<p class="muted">会员温柔提示暂不可用</p>`;
        return;
      }
      const line =
        "会员温柔提示 · " +
        hint +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-member-gentle-hint-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberGentleHintPlainCopyBtn">复制温柔提示纯</button>`;
      const btn = $("#checkinMemberGentleHintPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制温柔提示" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员温柔提示暂不可用</p>`;
    }
  }

  /* 5 · 差旅流水编号+金额组合复制 */
  async function ensureTravelLedgerIdAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerIdAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerIdAmountCopyCard";
      card.className = "travel-ledger-id-amount-copy";
      const refund = $("#travelRefundIdKindCopyCard");
      const metPct = $("#travelMetProgressPctCopyCard");
      const prog = $("#travelProgressPctLabelCopyCard");
      if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
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
        card.innerHTML = `<p class="muted">流水编号与金额暂不可用</p>`;
        return;
      }
      const row = ledger[0] || {};
      if (row.id == null && row.amount == null) {
        card.innerHTML = `<p class="muted">流水编号与金额暂不可用</p>`;
        return;
      }
      const idPart = row.id == null ? "—" : "#" + String(row.id);
      const amtPart =
        row.amount == null ? "—" : String(Math.round(Number(row.amount)));
      const combo = idPart + " · " + amtPart;
      const line = "差旅流水编号 · 金额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-ledger-id-amount-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerIdAmountCopyBtn">复制流水编号与金额</button>`;
      const btn = $("#travelLedgerIdAmountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制流水编号与金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水编号与金额暂不可用</p>`;
    }
  }

  /* 6 · 善后状态语气+城市组合复制 */
  async function ensureAftercareStatusToneCityCopyButtons() {
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
      const tone = String(it.status_tone || "").trim() || "未填语气";
      const city = String(it.city || "").trim() || "未填城市";
      const line = tone + " · " + city;
      el.dataset.statusToneCity = line;
      if (el.querySelector(".ac-copy-status-tone-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-tone-city";
      btn.textContent = "复制状态语气城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusToneCity || "");
        softBanner(ok ? "已复制状态语气城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单条数与就绪布尔组合复制 */
  async function ensureAuthChecklistCountReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistCountReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistCountReadyCopyCard";
      card.className = "av-checklist-count-ready-copy";
      const missing = $("#avMissingCountReadyCopyCard");
      const script = $("#avScriptReadyCopyCard");
      const complete = $("#avCompleteLabelReadyCopyCard");
      if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = data.checklist;
      const n = Array.isArray(list) ? list.length : 0;
      const ready = yn(data.ready);
      const combo = "清单·" + String(n) + " 项 · 就绪·" + ready;
      const line = "授权视频清单 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-count-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistCountReadyCopyBtn">复制清单数与就绪</button>`;
      const btn = $("#avChecklistCountReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单数与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单数与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+口令提示+角色组合复制 */
  async function ensureHeirIdPassphraseRoleCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const line = "#" + it.id + " · " + hint + " · " + role;
      if (el.querySelector(".bn-copy-id-passphrase-role")) return;
      el.dataset.idPassphraseRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-passphrase-role";
      btn.textContent = "复制编号口令角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPassphraseRole || "");
        softBanner(ok ? "已复制编号口令角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册覆盖百分比与域名组合复制 */
  async function ensureHandoverPctDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handPctDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handPctDomainCopyCard";
      card.className = "hand-pct-domain-copy";
      const execBrand = $("#handExecutorBrandCopyCard");
      const shareBrand = $("#handShareBrandCopyCard");
      const genBrand = $("#handGeneratedBrandCopyCard");
      if (execBrand && execBrand.parentNode)
        execBrand.insertAdjacentElement("afterend", card);
      else if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct = prog.pct != null ? prog.pct : data.pct;
      const domain = String(data.domain || "").trim();
      if (pct == null && !domain) {
        card.innerHTML = `<p class="muted">覆盖与域名暂不可用</p>`;
        return;
      }
      const pctPart =
        pct == null ? "—" : String(Math.round(Number(pct))) + "%";
      const combo = domain ? pctPart + " · " + domain : pctPart;
      const line = "手册覆盖 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-pct-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handPctDomainCopyBtn">复制覆盖与域名</button>`;
      const btn = $("#handPctDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制覆盖与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">覆盖与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·服务端版本+英文品牌组合复制 + round 层含 76 */
  async function paintServerBrandEnR76CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverBrandEnR76CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverBrandEnR76CopyCard";
      card.className = "card server-brand-en-r76-copy-card";
      const appOk = $("#appBrandOkR75CopyCard");
      const enVer = $("#brandEnVersionR74CopyCard");
      const verOk = $("#versionOkR73CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.server_version || h.version || "").trim() || "—";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + en;
      card.innerHTML = `<h3>服务端与英文品牌</h3>
        <p class="muted">一键复制服务端版本与英文品牌（演示级）。</p>
        <p class="server-brand-en-r76-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverBrandEnR76CopyBtn">复制服务端与英文</button>`;
      const btn = $("#serverBrandEnR76CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务端与英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端与英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList76() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 76;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 76); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round76 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMemberUntil().catch(() => {}), 590);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleNotesActionCopyButtons().catch(() => {}),
      420
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdDeptTagCopyButtons().catch(() => {}), 420);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinMemberGentleHintPlainCopy().catch(() => {}),
      410
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerIdAmountCopy().catch(() => {}), 430);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusToneCityCopyButtons().catch(() => {}),
      420
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthChecklistCountReadyCopy().catch(() => {}), 390);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdPassphraseRoleCopyButtons().catch(() => {}),
      420
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverPctDomainCopy().catch(() => {}), 430);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeMemberUntil().catch(() => {}), 590);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleNotesActionCopyButtons().catch(() => {}),
        440
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdDeptTagCopyButtons().catch(() => {}), 430);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinMemberGentleHintPlainCopy().catch(() => {}),
        430
      );
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerIdAmountCopy().catch(() => {}), 450);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusToneCityCopyButtons().catch(() => {}),
        440
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthChecklistCountReadyCopy().catch(() => {}), 410);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdPassphraseRoleCopyButtons().catch(() => {}),
        430
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverPctDomainCopy().catch(() => {}), 440);
    if (id === "settings") {
      setTimeout(() => {
        paintServerBrandEnR76CopyCard().catch(() => {});
        paintRoundLayerList76();
      }, 480);
      setTimeout(() => {
        paintServerBrandEnR76CopyCard().catch(() => {});
        paintRoundLayerList76();
      }, 1060);
    }
  };

  setTimeout(() => paintHomeMemberUntil().catch(() => {}), 640);
  setTimeout(
    () => ensureLegacyTitleNotesActionCopyButtons().catch(() => {}),
    660
  );
  setTimeout(() => ensureAssetIdDeptTagCopyButtons().catch(() => {}), 680);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberGentleHintPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerIdAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusToneCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistCountReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPassphraseRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverPctDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerBrandEnR76CopyCard().catch(() => {});
      paintRoundLayerList76();
    }, 500);
  }
})();
