/* 电子继承 · 第七十四批增量（叠在 round73…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round74SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页报备间隔小时冷静条 */
  async function paintHomeIntervalHours() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeIntervalHoursBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeIntervalHoursBar";
      bar.className = "home-interval-hours-bar";
      bar.setAttribute("role", "status");
      const grace = $("#homeGraceHoursBar");
      const member = $("#homeIsMemberDaysBar");
      const phone = $("#homePhoneBar");
      if (grace && grace.parentNode === home)
        grace.insertAdjacentElement("afterend", bar);
      else if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else if (phone && phone.parentNode === home)
        phone.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = (st.user || {}).checkin_interval_hours;
      const hoursPart =
        hours == null ? "—" : String(Math.round(Number(hours)));
      const sub = "间隔 · " + hoursPart + " 小时";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-interval-hours-mark">间隔</span>
        <span class="muted home-interval-hours-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeIntervalHoursGo">去报备</button>`;
      const btn = $("#homeIntervalHoursGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-interval-hours-mark">间隔</span>
        <span class="muted home-interval-hours-sub">报备间隔暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeIntervalHoursGo">去报备</button>`;
      const btn = $("#homeIntervalHoursGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割备注+处置动作组合复制 */
  async function ensureLegacyNotesActionCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const action = String(it.action || "").trim() || "未填处置";
      const line = notes + " · " + action;
      el.dataset.notesAction = line;
      if (el.querySelector(".lg-copy-notes-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-action";
      btn.textContent = "复制备注与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesAction || "");
        softBanner(ok ? "已复制备注与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+摘要+可见性组合复制 */
  async function ensureAssetIdSummaryVisCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const vis = visibilityLabel(it.visibility);
      const line = "#" + it.id + " · " + summary + " · " + vis;
      el.dataset.idSummaryVis = line;
      if (el.querySelector(".as-copy-id-summary-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-summary-vis";
      btn.textContent = "复制编号摘要可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idSummaryVis || "");
        softBanner(ok ? "已复制编号摘要可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔小时纯数字 */
  async function ensureCheckinIntervalHoursPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursPlainCopyCard";
      card.className = "checkin-interval-hours-plain-copy";
      const grace = $("#checkinGraceHoursPlainCopyCard");
      const days = $("#checkinMemberDaysLeftPlainCopyCard");
      const ago = $("#checkinLastAgoPlainCopyCard");
      if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
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
      const hours = (st.user || {}).checkin_interval_hours;
      if (hours == null) {
        card.innerHTML = `<p class="muted">报备间隔小时暂不可用</p>`;
        return;
      }
      const combo = String(Math.round(Number(hours)));
      const line =
        "报备间隔小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-hours-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursPlainCopyBtn">复制间隔小时纯</button>`;
      const btn = $("#checkinIntervalHoursPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制间隔小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备间隔小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与进度百分比组合复制 */
  async function ensureTravelMetProgressPctCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetProgressPctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetProgressPctCopyCard";
      card.className = "travel-met-progress-pct-copy";
      const prog = $("#travelProgressPctLabelCopyCard");
      const balThr = $("#travelBalanceThresholdPlainCopyCard");
      const shortfall = $("#travelShortfallMetCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met || fund.meets_threshold);
      const pct = fund.progress_pct;
      if (fund.met == null && fund.meets_threshold == null && pct == null) {
        card.innerHTML = `<p class="muted">达标与进度暂不可用</p>`;
        return;
      }
      const metPart = met ? "已达标" : "未达标";
      const pctPart =
        pct == null ? "—" : String(Math.round(Number(pct))) + "%";
      const combo = metPart + " · " + pctPart;
      const line = "差旅达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-progress-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetProgressPctCopyBtn">复制达标与进度</button>`;
      const btn = $("#travelMetProgressPctCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标与进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标与进度暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+阶段+城市组合复制 */
  async function ensureAftercareIdPhaseCityCopyButtons() {
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
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + phase + " · " + city;
      el.dataset.idPhaseCity = line;
      if (el.querySelector(".ac-copy-id-phase-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-phase-city";
      btn.textContent = "复制编号阶段城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPhaseCity || "");
        softBanner(ok ? "已复制编号阶段城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本条数与就绪布尔组合复制 */
  async function ensureAuthScriptReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptReadyCopyCard";
      card.className = "av-script-ready-copy";
      const complete = $("#avCompleteLabelReadyCopyCard");
      const gate = $("#avGateLabelReadyCopyCard");
      const prog = $("#avProgressMissingCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script;
      const n = Array.isArray(script) ? script.length : 0;
      const ready = truthyFlag(data.ready) ? "是" : "否";
      const combo = "脚本·" + String(n) + " 条 · 就绪·" + ready;
      const line = "授权视频脚本 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-script-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptReadyCopyBtn">复制脚本与就绪</button>`;
      const btn = $("#avScriptReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制脚本与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+备注+角色组合复制 */
  async function ensureHeirNameNoteRoleCopyButtons() {
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
      const note = String(it.note || "").trim() || "无备注";
      const role = String(it.role || "").trim() || "未填角色";
      const line = name + " · " + note + " · " + role;
      if (el.querySelector(".bn-copy-name-note-role")) return;
      el.dataset.nameNoteRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-note-role";
      btn.textContent = "复制姓名备注角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameNoteRole || "");
        softBanner(ok ? "已复制姓名备注角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册分享提示与品牌组合复制 */
  async function ensureHandoverShareBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handShareBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handShareBrandCopyCard";
      card.className = "hand-share-brand-copy";
      const genBrand = $("#handGeneratedBrandCopyCard");
      const itemBrand = $("#handItemCountBrandCopyCard");
      const brandDom = $("#handBrandDomainCopyCard");
      if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const brand = String(data.brand || "").trim();
      const combo = brand ? hint + " · " + brand : hint;
      const line = "手册分享 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-share-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handShareBrandCopyBtn">复制分享与品牌</button>`;
      const btn = $("#handShareBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制分享与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">分享与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+应用版本组合复制 + round 层含 74 */
  async function paintBrandEnVersionR74CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnVersionR74CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnVersionR74CopyCard";
      card.className = "card brand-en-version-r74-copy-card";
      const verOk = $("#versionOkR73CopyCard");
      const okDom = $("#okDomainR72CopyCard");
      const serverVer = $("#serverVerOkR71CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (serverVer && serverVer.parentNode)
        serverVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const line = en + " · " + ver;
      card.innerHTML = `<h3>英文品牌与版本</h3>
        <p class="muted">一键复制英文品牌与应用版本（演示级）。</p>
        <p class="brand-en-version-r74-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnVersionR74CopyBtn">复制英文与版本</button>`;
      const btn = $("#brandEnVersionR74CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文与版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌与版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList74() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 74;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 74); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round74 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeIntervalHours().catch(() => {}), 570);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesActionCopyButtons().catch(() => {}),
      400
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdSummaryVisCopyButtons().catch(() => {}),
      400
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalHoursPlainCopy().catch(() => {}),
      390
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMetProgressPctCopy().catch(() => {}), 410);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdPhaseCityCopyButtons().catch(() => {}),
      400
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptReadyCopy().catch(() => {}), 370);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameNoteRoleCopyButtons().catch(() => {}),
      400
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverShareBrandCopy().catch(() => {}), 410);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeIntervalHours().catch(() => {}), 570);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesActionCopyButtons().catch(() => {}),
        420
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdSummaryVisCopyButtons().catch(() => {}),
        410
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalHoursPlainCopy().catch(() => {}),
        410
      );
    if (id === "travel")
      setTimeout(() => ensureTravelMetProgressPctCopy().catch(() => {}), 430);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdPhaseCityCopyButtons().catch(() => {}),
        420
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptReadyCopy().catch(() => {}), 390);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameNoteRoleCopyButtons().catch(() => {}),
        410
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverShareBrandCopy().catch(() => {}), 420);
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionR74CopyCard().catch(() => {});
        paintRoundLayerList74();
      }, 460);
      setTimeout(() => {
        paintBrandEnVersionR74CopyCard().catch(() => {});
        paintRoundLayerList74();
      }, 1040);
    }
  };

  setTimeout(() => paintHomeIntervalHours().catch(() => {}), 620);
  setTimeout(() => ensureLegacyNotesActionCopyButtons().catch(() => {}), 640);
  setTimeout(() => ensureAssetIdSummaryVisCopyButtons().catch(() => {}), 660);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetProgressPctCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdPhaseCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameNoteRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverShareBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionR74CopyCard().catch(() => {});
      paintRoundLayerList74();
    }, 480);
  }
})();
