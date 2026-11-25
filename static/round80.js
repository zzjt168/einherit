/* 电子继承 · 第八十批增量（里程碑；叠在 round79…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round80SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页用户编号冷静条 */
  async function paintHomeUserIdCalm() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeUserIdCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeUserIdCalmBar";
      bar.className = "home-user-id-calm-bar";
      bar.setAttribute("role", "status");
      const escState = $("#homeEscalationStateBar");
      const brand = $("#homeBrandDomainBar");
      const name = $("#homeNameBar");
      if (escState && escState.parentNode === home)
        escState.insertAdjacentElement("afterend", bar);
      else if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else if (name && name.parentNode === home)
        name.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const uid = (st.user || {}).id;
      const sub =
        uid == null || uid === ""
          ? "用户编号暂不可用"
          : "用户编号 · #" + uid;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-user-id-calm-mark">编号</span>
        <span class="muted home-user-id-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeUserIdCalmGo">去设置</button>`;
      const btn = $("#homeUserIdCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-user-id-calm-mark">编号</span>
        <span class="muted home-user-id-calm-sub">用户编号暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeUserIdCalmGo">去设置</button>`;
      const btn = $("#homeUserIdCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+分类+处置组合复制 */
  async function ensureLegacyIdCategoryActionCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const line = "#" + it.id + " · " + cat + " · " + action;
      el.dataset.idCategoryAction = line;
      if (el.querySelector(".lg-copy-id-category-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-category-action";
      btn.textContent = "复制编号分类处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCategoryAction || "");
        softBanner(ok ? "已复制编号分类处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘账号提示+平台+部门组合复制 */
  async function ensureAssetHintPlatformDeptCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const platform = String(it.platform || "").trim() || "未填平台";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = hint + " · " + platform + " · " + dept;
      el.dataset.hintPlatformDept = line;
      if (el.querySelector(".as-copy-hint-platform-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-platform-dept";
      btn.textContent = "复制提示平台部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintPlatformDept || "");
        softBanner(ok ? "已复制提示平台部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制倒计时文案 */
  async function ensureCheckinCountdownLabelPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinCountdownLabelPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinCountdownLabelPlainCopyCard";
      card.className = "checkin-countdown-label-plain-copy";
      const soft = $("#checkinSoftOverduePlainCopyCard");
      const due = $("#checkinDueSoonPlainCopyCard");
      const hours = $("#checkinHoursRemainingPlainCopyCard");
      if (soft && soft.parentNode) soft.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).countdown_label || "").trim() ||
        "暂无倒计时文案";
      const line =
        "报备倒计时 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-countdown-label-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinCountdownLabelPlainCopyBtn">复制倒计时文案</button>`;
      const btn = $("#checkinCountdownLabelPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制倒计时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">倒计时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比与达标组合复制 */
  async function ensureTravelProgressPctMetCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctMetCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctMetCopyCard";
      card.className = "travel-progress-pct-met-copy";
      const metAmt = $("#travelMetThresholdAmountCopyCard");
      const shortBal = $("#travelShortfallBalanceCopyCard");
      const amtKind = $("#travelRefundAmountKindCopyCard");
      if (metAmt && metAmt.parentNode)
        metAmt.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (amtKind && amtKind.parentNode)
        amtKind.insertAdjacentElement("afterend", card);
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
          : String(Math.round(Number(fund.progress_pct))) + "%";
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = pct + " · " + met;
      const line = "差旅进度 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-pct-met-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctMetCopyBtn">复制进度达标</button>`;
      const btn = $("#travelProgressPctMetCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度达标暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+标题+城市组合复制 */
  async function ensureAftercareIdTitleCityCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + title + " · " + city;
      el.dataset.idTitleCity = line;
      if (el.querySelector(".ac-copy-id-title-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-title-city";
      btn.textContent = "复制编号标题城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleCity || "");
        softBanner(ok ? "已复制编号标题城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本段数与就绪组合复制 */
  async function ensureAuthScriptCountReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptCountReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptCountReadyCopyCard";
      card.className = "av-script-count-ready-copy";
      const prog = $("#avProgressDoneTotalCopyCard");
      const gate = $("#avGateCompleteLabelCopyCard");
      const active = $("#avActiveLabelReadyCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const scripts = Array.isArray(data.script) ? data.script : [];
      const count = scripts.length;
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = "脚本段 " + count + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-script-count-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptCountReadyCopyBtn">复制脚本数与就绪</button>`;
      const btn = $("#avScriptCountReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制脚本数与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本数与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+角色+联系组合复制 */
  async function ensureHeirNameRoleContactCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + role + " · " + contact;
      if (el.querySelector(".bn-copy-name-role-contact")) return;
      el.dataset.nameRoleContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-role-contact";
      btn.textContent = "复制姓名角色联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRoleContact || "");
        softBanner(ok ? "已复制姓名角色联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册分享提示与域名组合复制 */
  async function ensureHandoverShareHintDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handShareHintDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handShareHintDomainCopyCard";
      card.className = "hand-share-hint-domain-copy";
      const todoBrand = $("#handTodoCountBrandCopyCard");
      const exportDom = $("#handExportPathDomainCopyCard");
      const memberBrand = $("#handMemberBrandCopyCard");
      if (todoBrand && todoBrand.parentNode)
        todoBrand.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (memberBrand && memberBrand.parentNode)
        memberBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const domain = String(data.domain || "").trim();
      const combo = domain ? hint + " · " + domain : hint;
      const line = "手册分享 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-share-hint-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handShareHintDomainCopyBtn">复制分享提示域名</button>`;
      const btn = $("#handShareHintDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制分享提示域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">分享提示与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·服务版本+就绪+域名组合复制 + round 层含 80 */
  async function paintServerVersionOkDomainR80CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverVersionOkDomainR80CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverVersionOkDomainR80CopyCard";
      card.className = "card server-version-ok-domain-r80-copy-card";
      const verOk = $("#versionOkDomainR79CopyCard");
      const okApp = $("#okAppBrandEnR78CopyCard");
      const verDom = $("#appVersionDomainR77CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const server =
        String(h.server_version || h.version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = server + " · ok·" + okPart + " · " + domain;
      card.innerHTML = `<h3>服务版本 · 就绪 · 域名</h3>
        <p class="muted">一键复制服务版本、就绪状态与域名（里程碑 · 演示级）。</p>
        <p class="server-version-ok-domain-r80-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverVersionOkDomainR80CopyBtn">复制服务版本就绪域名</button>`;
      const btn = $("#serverVersionOkDomainR80CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务版本就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务版本 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList80() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 80;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 80); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读 · 里程碑）。</p>
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
          : `<p class="muted" style="margin-top:8px">round6…round80 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeUserIdCalm().catch(() => {}), 630);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdCategoryActionCopyButtons().catch(() => {}),
      460
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintPlatformDeptCopyButtons().catch(() => {}),
      460
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinCountdownLabelPlainCopy().catch(() => {}),
      450
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressPctMetCopy().catch(() => {}), 470);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdTitleCityCopyButtons().catch(() => {}),
      460
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptCountReadyCopy().catch(() => {}), 430);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRoleContactCopyButtons().catch(() => {}),
      460
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverShareHintDomainCopy().catch(() => {}), 470);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeUserIdCalm().catch(() => {}), 630);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdCategoryActionCopyButtons().catch(() => {}),
        480
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintPlatformDeptCopyButtons().catch(() => {}),
        470
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinCountdownLabelPlainCopy().catch(() => {}),
        470
      );
    if (id === "travel")
      setTimeout(() => ensureTravelProgressPctMetCopy().catch(() => {}), 490);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdTitleCityCopyButtons().catch(() => {}),
        480
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptCountReadyCopy().catch(() => {}), 450);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRoleContactCopyButtons().catch(() => {}),
        470
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverShareHintDomainCopy().catch(() => {}), 480);
    if (id === "settings") {
      setTimeout(() => {
        paintServerVersionOkDomainR80CopyCard().catch(() => {});
        paintRoundLayerList80();
      }, 520);
      setTimeout(() => {
        paintServerVersionOkDomainR80CopyCard().catch(() => {});
        paintRoundLayerList80();
      }, 1120);
    }
  };

  setTimeout(() => paintHomeUserIdCalm().catch(() => {}), 680);
  setTimeout(
    () => ensureLegacyIdCategoryActionCopyButtons().catch(() => {}),
    700
  );
  setTimeout(
    () => ensureAssetHintPlatformDeptCopyButtons().catch(() => {}),
    720
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinCountdownLabelPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctMetCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdTitleCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptCountReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRoleContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverShareHintDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerVersionOkDomainR80CopyCard().catch(() => {});
      paintRoundLayerList80();
    }, 540);
  }
})();
