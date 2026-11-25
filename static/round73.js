/* 电子继承 · 第七十三批增量（叠在 round72…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round73SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页宽限小时冷静条 */
  async function paintHomeGraceHours() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeGraceHoursBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeGraceHoursBar";
      bar.className = "home-grace-hours-bar";
      bar.setAttribute("role", "status");
      const member = $("#homeIsMemberDaysBar");
      const phone = $("#homePhoneBar");
      const brand = $("#homeBrandAppBar");
      if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else if (phone && phone.parentNode === home)
        phone.insertAdjacentElement("afterend", bar);
      else if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = (st.user || {}).grace_hours;
      const hoursPart =
        hours == null ? "—" : String(Math.round(Number(hours)));
      const sub = "宽限 · " + hoursPart + " 小时";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-grace-hours-mark">宽限</span>
        <span class="muted home-grace-hours-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeGraceHoursGo">去报备</button>`;
      const btn = $("#homeGraceHoursGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-grace-hours-mark">宽限</span>
        <span class="muted home-grace-hours-sub">宽限小时暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeGraceHoursGo">去报备</button>`;
      const btn = $("#homeGraceHoursGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+分类+部门组合复制 */
  async function ensureLegacyIdCategoryDeptCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + cat + " · " + dept;
      el.dataset.idCategoryDept = line;
      if (el.querySelector(".lg-copy-id-category-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-category-dept";
      btn.textContent = "复制编号分类部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCategoryDept || "");
        softBanner(ok ? "已复制编号分类部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置备注+可见性组合复制 */
  async function ensureAssetDisposeVisCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const vis = visibilityLabel(it.visibility);
      const line = dispose + " · " + vis;
      el.dataset.disposeVis = line;
      if (el.querySelector(".as-copy-dispose-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-vis";
      btn.textContent = "复制处置与可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeVis || "");
        softBanner(ok ? "已复制处置与可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限小时纯数字 */
  async function ensureCheckinGraceHoursPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursPlainCopyCard";
      card.className = "checkin-grace-hours-plain-copy";
      const days = $("#checkinMemberDaysLeftPlainCopyCard");
      const ago = $("#checkinLastAgoPlainCopyCard");
      const phone = $("#checkinPhonePlainCopyCard");
      if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = (st.user || {}).grace_hours;
      if (hours == null) {
        card.innerHTML = `<p class="muted">宽限小时暂不可用</p>`;
        return;
      }
      const combo = String(Math.round(Number(hours)));
      const line =
        "宽限小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursPlainCopyBtn">复制宽限小时</button>`;
      const btn = $("#checkinGraceHoursPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制宽限小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比与文案组合复制 */
  async function ensureTravelProgressPctLabelCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctLabelCopyCard";
      card.className = "travel-progress-pct-label-copy";
      const balThr = $("#travelBalanceThresholdPlainCopyCard");
      const shortfall = $("#travelShortfallMetCopyCard");
      const aftercare = $("#travelHasAftercareAmountCopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (aftercare && aftercare.parentNode)
        aftercare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct = fund.progress_pct;
      const label = String(fund.progress_label || "").trim();
      if (pct == null && !label) {
        card.innerHTML = `<p class="muted">进度百分比与文案暂不可用</p>`;
        return;
      }
      const pctPart = pct == null ? "—" : String(Math.round(Number(pct))) + "%";
      const combo = label ? pctPart + " · " + label : pctPart;
      const line = "差旅进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-pct-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctLabelCopyBtn">复制进度百分比文案</button>`;
      const btn = $("#travelProgressPctLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度百分比文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度百分比与文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+城市+状态组合复制 */
  async function ensureAftercareTitleCityStatusCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const line = title + " · " + city + " · " + status;
      el.dataset.titleCityStatus = line;
      if (el.querySelector(".ac-copy-title-city-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-city-status";
      btn.textContent = "复制标题城市状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCityStatus || "");
        softBanner(ok ? "已复制标题城市状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频齐备文案与就绪布尔组合复制 */
  async function ensureAuthCompleteLabelReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteLabelReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteLabelReadyCopyCard";
      card.className = "av-complete-label-ready-copy";
      const gate = $("#avGateLabelReadyCopyCard");
      const prog = $("#avProgressMissingCopyCard");
      const active = $("#avActiveIdStatusCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const label = String(data.complete_label || "").trim() || "无齐备说明";
      const ready = truthyFlag(data.ready) ? "是" : "否";
      const combo = label + " · 就绪·" + ready;
      const line = "授权视频齐备 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-complete-label-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteLabelReadyCopyBtn">复制齐备文案与就绪</button>`;
      const btn = $("#avCompleteLabelReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制齐备文案与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">齐备文案与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人备注+角色组合复制 */
  async function ensureHeirNoteRoleCopyButtons() {
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
      const note = String(it.note || "").trim() || "无备注";
      const role = String(it.role || "").trim() || "未填角色";
      const line = note + " · " + role;
      if (el.querySelector(".bn-copy-note-role")) return;
      el.dataset.noteRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-note-role";
      btn.textContent = "复制备注与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.noteRole || "");
        softBanner(ok ? "已复制备注与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间与品牌组合复制 */
  async function ensureHandoverGeneratedBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedBrandCopyCard";
      card.className = "hand-generated-brand-copy";
      const itemBrand = $("#handItemCountBrandCopyCard");
      const brandDom = $("#handBrandDomainCopyCard");
      const itemDom = $("#handItemCountDomainCopyCard");
      if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const iso = String(data.generated_at_iso || "").trim();
      const brand = String(data.brand || "").trim();
      if (!iso && !brand) {
        card.innerHTML = `<p class="muted">生成时间与品牌暂不可用</p>`;
        return;
      }
      const combo = iso && brand ? iso + " · " + brand : iso || brand;
      const line = "手册生成 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-generated-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedBrandCopyBtn">复制生成时间与品牌</button>`;
      const btn = $("#handGeneratedBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生成时间与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生成时间与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用版本+就绪组合复制 + round 层含 73 */
  async function paintVersionOkR73CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionOkR73CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionOkR73CopyCard";
      card.className = "card version-ok-r73-copy-card";
      const okDom = $("#okDomainR72CopyCard");
      const serverVer = $("#serverVerOkR71CopyCard");
      const brandTriple = $("#appBrandDomainEnR70CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (serverVer && serverVer.parentNode)
        serverVer.insertAdjacentElement("beforebegin", card);
      else if (brandTriple && brandTriple.parentNode)
        brandTriple.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · ok·" + okPart;
      card.innerHTML = `<h3>应用版本与就绪</h3>
        <p class="muted">一键复制应用版本与就绪状态（演示级）。</p>
        <p class="version-ok-r73-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionOkR73CopyBtn">复制应用版本就绪</button>`;
      const btn = $("#versionOkR73CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本与就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList73() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 73;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 73); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round73 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeGraceHours().catch(() => {}), 560);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdCategoryDeptCopyButtons().catch(() => {}),
      390
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDisposeVisCopyButtons().catch(() => {}), 390);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinGraceHoursPlainCopy().catch(() => {}), 380);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressPctLabelCopy().catch(() => {}), 400);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleCityStatusCopyButtons().catch(() => {}),
      390
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthCompleteLabelReadyCopy().catch(() => {}), 360);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNoteRoleCopyButtons().catch(() => {}), 390);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverGeneratedBrandCopy().catch(() => {}), 400);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeGraceHours().catch(() => {}), 560);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdCategoryDeptCopyButtons().catch(() => {}),
        410
      );
    if (id === "assets")
      setTimeout(() => ensureAssetDisposeVisCopyButtons().catch(() => {}), 400);
    if (id === "checkin")
      setTimeout(() => ensureCheckinGraceHoursPlainCopy().catch(() => {}), 400);
    if (id === "travel")
      setTimeout(() => ensureTravelProgressPctLabelCopy().catch(() => {}), 420);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleCityStatusCopyButtons().catch(() => {}),
        410
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthCompleteLabelReadyCopy().catch(() => {}), 380);
    if (id === "heirs")
      setTimeout(() => ensureHeirNoteRoleCopyButtons().catch(() => {}), 400);
    if (id === "handover")
      setTimeout(() => ensureHandoverGeneratedBrandCopy().catch(() => {}), 410);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkR73CopyCard().catch(() => {});
        paintRoundLayerList73();
      }, 450);
      setTimeout(() => {
        paintVersionOkR73CopyCard().catch(() => {});
        paintRoundLayerList73();
      }, 1030);
    }
  };

  setTimeout(() => paintHomeGraceHours().catch(() => {}), 610);
  setTimeout(() => ensureLegacyIdCategoryDeptCopyButtons().catch(() => {}), 630);
  setTimeout(() => ensureAssetDisposeVisCopyButtons().catch(() => {}), 650);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctLabelCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleCityStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteLabelReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNoteRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkR73CopyCard().catch(() => {});
      paintRoundLayerList73();
    }, 470);
  }
})();
