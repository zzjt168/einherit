/* 电子继承 · 第五十二批增量（叠在 round51…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round52SoftBanner_" + (hostId || "home");
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

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    const fallback = {
      production: "生产部",
      finance: "财务部",
      ip: "知识产权部",
      admin: "行政部",
      hr: "人事部",
    };
    return (
      shortMap[dept] || nameMap[dept] || fallback[dept] || String(dept || "")
    );
  }

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
  }

  /* 1 · 首页英文品牌一句 */
  async function paintHomeBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnBar";
      bar.className = "home-brand-en-bar";
      bar.setAttribute("role", "status");
      const sv = $("#homeServerVersionBar");
      const r50 = $("#homeRound50ReadyBar");
      const health = $("#homeHealthReadyBar");
      if (sv && sv.parentNode === home)
        sv.insertAdjacentElement("afterend", bar);
      else if (r50 && r50.parentNode === home)
        r50.insertAdjacentElement("afterend", bar);
      else if (health && health.parentNode === home)
        health.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      const en = String(h.brand_en || "E-Inherit").trim();
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-mark">品牌</span>
        <span class="muted home-brand-en-sub">${esc(
          en
        )} · 电子继承英文名</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnGo">去设置</button>`;
      const btn = $("#homeBrandEnGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割处置+部门组合复制 */
  async function ensureLegacyActionDeptCopyButtons() {
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
      const action = String(it.action || "").trim();
      const dept = deptLabel(it.dept);
      const line =
        action && dept ? action + " · " + dept : action || dept;
      el.dataset.actionDept = line;
      if (!line || el.querySelector(".lg-copy-action-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-dept";
      btn.textContent = "复制处置与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionDept || "");
        softBanner(ok ? "已复制处置与部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+可见性组合复制 */
  async function ensureAssetIdVisibilityCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const line = "#" + it.id + " · " + vis;
      el.dataset.idVisibility = line;
      if (el.querySelector(".as-copy-id-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-visibility";
      btn.textContent = "复制编号与可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisibility || "");
        softBanner(ok ? "已复制编号与可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员剩余天数纯数字 */
  async function ensureCheckinMemberDaysNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberDaysNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberDaysNumCopyCard";
      card.className = "checkin-member-days-num-copy";
      const interval = $("#checkinIntervalHoursNumCopyCard");
      const grace = $("#checkinGraceHoursNumCopyCard");
      const hoursRem = $("#checkinHoursRemainingNumCopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (hoursRem && hoursRem.parentNode)
        hoursRem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const days = (st.user || {}).member_days_left;
      if (days == null) {
        card.innerHTML = `<p class="muted">会员剩余天数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(days)));
      const line =
        "会员剩余天数数字 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-member-days-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberDaysNumCopyBtn">复制剩余天数</button>`;
      const btn = $("#checkinMemberDaysNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制剩余天数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余天数暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水是否关联善后一键复制 */
  async function ensureTravelHasAftercareRefCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelHasAftercareRefCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelHasAftercareRefCopyCard";
      card.className = "travel-has-aftercare-ref-copy";
      const kind = $("#travelLedgerKindCopyCard");
      const prog = $("#travelProgressLabelCopyCard");
      const amt = $("#travelLastRefundAmountNumCopyCard");
      if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode)
        amt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0] || {};
      const has =
        row.has_aftercare_ref === true ||
        row.aftercare_id != null ||
        row.order_ref != null ||
        row.order_id != null;
      const status = has ? "有关联善后" : "无关联善后";
      const line = "最近流水 · " + status;
      card.innerHTML = `<p class="muted travel-has-aftercare-ref-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelHasAftercareRefCopyBtn">复制关联状态</button>`;
      const btn = $("#travelHasAftercareRefCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制关联状态" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">关联状态暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+阶段组合复制 */
  async function ensureAftercareIdPhaseCopyButtons() {
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
      const phase = String(it.phase_label || "").trim();
      const line = phase ? "#" + it.id + " · " + phase : "#" + it.id;
      el.dataset.idPhase = line;
      if (el.querySelector(".ac-copy-id-phase")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-phase";
      btn.textContent = "复制编号与阶段";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPhase || "");
        softBanner(ok ? "已复制编号与阶段" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第二段脚本标题一键复制 */
  async function ensureAuthScriptTitle1Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptTitle1CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptTitle1CopyCard";
      card.className = "av-script-title1-copy";
      const t0 = $("#avScriptTitle0CopyCard");
      const done = $("#avProgressDoneNumCopyCard");
      const h1 = $("#avScriptHint1CopyCard");
      if (t0 && t0.parentNode) t0.insertAdjacentElement("afterend", card);
      else if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else if (h1 && h1.parentNode)
        h1.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const title = String((script[1] && script[1].title) || "").trim();
      if (!title) {
        card.innerHTML = `<p class="muted">授权段脚本标题暂不可用</p>`;
        return;
      }
      const line = "授权视频授权段标题 · " + title;
      card.innerHTML = `<p class="muted av-script-title1-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptTitle1CopyBtn">复制授权段标题</button>`;
      const btn = $("#avScriptTitle1CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(title);
          softBanner(ok ? "已复制授权段标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">授权段标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色英文键一键复制 */
  async function ensureHeirRoleKeyCopyButtons() {
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
      const role = String(it.role || "").trim().toLowerCase();
      if (!role || el.querySelector(".bn-copy-role-key")) return;
      el.dataset.roleKey = role;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-key";
      btn.textContent = "复制角色键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleKey || "");
        softBanner(ok ? "已复制角色键" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册处置种类总数纯数字一键复制 */
  async function ensureHandoverTotalTypesNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTotalTypesNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTotalTypesNumCopyCard";
      card.className = "hand-total-types-num-copy";
      const filled = $("#handFilledTypesNumCopyCard");
      const brandEx = $("#handBrandExecutorCopyCard");
      const heirs = $("#handHeirsNamesCopyCard");
      if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else if (brandEx && brandEx.parentNode)
        brandEx.insertAdjacentElement("afterend", card);
      else if (heirs && heirs.parentNode)
        heirs.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let total = prog.total_types;
      if (total == null && Array.isArray(prog.by_action))
        total = prog.by_action.length;
      if (total == null) {
        card.innerHTML = `<p class="muted">处置种类总数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(total)));
      const line = "手册处置种类总数 · " + num;
      card.innerHTML = `<p class="muted hand-total-types-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTotalTypesNumCopyBtn">复制种类总数</button>`;
      const btn = $("#handTotalTypesNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制种类总数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">种类总数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制应用版本号纯文本 + round 层含 52 */
  async function paintVersionPlainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionPlainCopyCard";
      card.className = "card version-plain-copy-card";
      const appVer = $("#appVersionCopyCard");
      const range = $("#round50RangeCopyCard");
      const verDom = $("#versionDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (range && range.parentNode)
        range.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").replace(/^v/i, "");
      card.innerHTML = `<h3>应用版本号</h3>
        <p class="muted">一键复制纯版本号（无 v 前缀 · 演示级）。</p>
        <p class="version-plain-copy-preview">${esc(ver)}</p>
        <button type="button" class="btn ghost sm" id="versionPlainCopyBtn">复制版本号</button>`;
      const btn = $("#versionPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(ver);
          softBanner(ok ? "已复制版本号" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本号</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList52() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 52;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 52); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round52 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEn().catch(() => {}), 350);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyActionDeptCopyButtons().catch(() => {}), 260);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdVisibilityCopyButtons().catch(() => {}),
      260
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberDaysNumCopy().catch(() => {}), 250);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelHasAftercareRefCopy().catch(() => {}), 270);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareIdPhaseCopyButtons().catch(() => {}), 260);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptTitle1Copy().catch(() => {}), 230);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleKeyCopyButtons().catch(() => {}), 260);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverTotalTypesNumCopy().catch(() => {}), 270);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEn().catch(() => {}), 350);
    if (id === "legacy")
      setTimeout(() => ensureLegacyActionDeptCopyButtons().catch(() => {}), 280);
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdVisibilityCopyButtons().catch(() => {}),
        270
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinMemberDaysNumCopy().catch(() => {}), 270);
    if (id === "travel")
      setTimeout(() => ensureTravelHasAftercareRefCopy().catch(() => {}), 290);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareIdPhaseCopyButtons().catch(() => {}), 280);
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptTitle1Copy().catch(() => {}), 250);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleKeyCopyButtons().catch(() => {}), 270);
    if (id === "handover")
      setTimeout(() => ensureHandoverTotalTypesNumCopy().catch(() => {}), 280);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionPlainCopyCard().catch(() => {});
        paintRoundLayerList52();
      }, 320);
      setTimeout(() => {
        paintVersionPlainCopyCard().catch(() => {});
        paintRoundLayerList52();
      }, 820);
    }
  };

  // Boot
  setTimeout(() => paintHomeBrandEn().catch(() => {}), 410);
  setTimeout(() => ensureLegacyActionDeptCopyButtons().catch(() => {}), 430);
  setTimeout(() => ensureAssetIdVisibilityCopyButtons().catch(() => {}), 450);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberDaysNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelHasAftercareRefCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdPhaseCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptTitle1Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleKeyCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTotalTypesNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionPlainCopyCard().catch(() => {});
      paintRoundLayerList52();
    }, 340);
  }
})();
