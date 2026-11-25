/* 电子继承 · 第五十一批增量（叠在 round50…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round51SoftBanner_" + (hostId || "home");
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

  function serviceLabel(raw) {
    const map =
      typeof SERVICE_LABEL === "object" && SERVICE_LABEL
        ? SERVICE_LABEL
        : {
            delete_data: "删除电子数据",
            field_visit: "上门执行",
          };
    const k = String(raw || "");
    return map[k] || k || "未指定类型";
  }

  /* 1 · 首页服务端版本一句 */
  async function paintHomeServerVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeServerVersionBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeServerVersionBar";
      bar.className = "home-server-version-bar";
      bar.setAttribute("role", "status");
      const r50 = $("#homeRound50ReadyBar");
      const health = $("#homeHealthReadyBar");
      const items = $("#homeHandoverItemsBar");
      if (r50 && r50.parentNode === home)
        r50.insertAdjacentElement("afterend", bar);
      else if (health && health.parentNode === home)
        health.insertAdjacentElement("afterend", bar);
      else if (items && items.parentNode === home)
        items.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      const sv = String(h.server_version || h.version || "").trim();
      bar.hidden = false;
      if (!sv) {
        bar.innerHTML = `<span class="home-server-version-mark">服务端</span>
          <span class="muted home-server-version-sub">版本暂不可用 · 可去设置查看</span>
          <button type="button" class="btn ghost sm" id="homeServerVersionGo">去设置</button>`;
      } else {
        bar.innerHTML = `<span class="home-server-version-mark">服务端</span>
          <span class="muted home-server-version-sub">${esc(
            sv
          )} · 演示环境可随时核对</span>
          <button type="button" class="btn ghost sm" id="homeServerVersionGo">去设置</button>`;
      }
      const btn = $("#homeServerVersionGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割编号+部门组合复制 */
  async function ensureLegacyIdDeptCopyButtons() {
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
      const dept = deptLabel(it.dept);
      const line = dept ? "#" + it.id + " · " + dept : "#" + it.id;
      el.dataset.idDept = line;
      if (el.querySelector(".lg-copy-id-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-dept";
      btn.textContent = "复制编号与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDept || "");
        softBanner(ok ? "已复制编号与部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签组合复制 */
  async function ensureAssetSummaryTagCopyButtons() {
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
      const summary = String(it.summary || "").trim();
      const tag = String(it.tag || "").trim();
      const line =
        summary && tag ? summary + " · " + tag : summary || tag;
      el.dataset.summaryTag = line;
      if (!line || el.querySelector(".as-copy-summary-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag";
      btn.textContent = "复制摘要与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTag || "");
        softBanner(ok ? "已复制摘要与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制报备间隔小时纯数字 */
  async function ensureCheckinIntervalHoursNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursNumCopyCard";
      card.className = "checkin-interval-hours-num-copy";
      const grace = $("#checkinGraceHoursNumCopyCard");
      const hoursRem = $("#checkinHoursRemainingNumCopyCard");
      const next = $("#checkinNextSuggestedCopyCard");
      if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (hoursRem && hoursRem.parentNode)
        hoursRem.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const user = st.user || {};
      const cd = st.countdown || {};
      const raw =
        user.checkin_interval_hours != null
          ? user.checkin_interval_hours
          : cd.interval_hours != null
            ? cd.interval_hours
            : null;
      if (raw == null) {
        card.innerHTML = `<p class="muted">报备间隔小时暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(raw)));
      const line =
        "报备间隔小时数字 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-hours-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursNumCopyBtn">复制间隔小时</button>`;
      const btn = $("#checkinIntervalHoursNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制间隔小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水种类键一键复制 */
  async function ensureTravelLedgerKindCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerKindCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerKindCopyCard";
      card.className = "travel-ledger-kind-copy";
      const prog = $("#travelProgressLabelCopyCard");
      const amt = $("#travelLastRefundAmountNumCopyCard");
      const rid = $("#travelLastRefundIdCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode)
        amt.insertAdjacentElement("afterend", card);
      else if (rid && rid.parentNode)
        rid.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0] || {};
      const kind = String(row.kind || "").trim();
      if (!kind) {
        card.innerHTML = `<p class="muted">最近流水种类键暂不可用</p>`;
        return;
      }
      const line = "最近流水种类键 · " + kind;
      card.innerHTML = `<p class="muted travel-ledger-kind-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerKindCopyBtn">复制种类键</button>`;
      const btn = $("#travelLedgerKindCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(kind);
          softBanner(ok ? "已复制种类键" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">种类键暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+服务类型组合复制 */
  async function ensureAftercareIdServiceCopyButtons() {
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
      const svc = serviceLabel(it.service_type);
      const line = "#" + it.id + " · " + svc;
      el.dataset.idService = line;
      if (el.querySelector(".ac-copy-id-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-service";
      btn.textContent = "复制编号与类型";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idService || "");
        softBanner(ok ? "已复制编号与类型" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频首段脚本标题一键复制 */
  async function ensureAuthScriptTitle0Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptTitle0CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptTitle0CopyCard";
      card.className = "av-script-title0-copy";
      const done = $("#avProgressDoneNumCopyCard");
      const h2 = $("#avScriptHint2CopyCard");
      const h0 = $("#avScriptHint0CopyCard");
      if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else if (h2 && h2.parentNode)
        h2.insertAdjacentElement("afterend", card);
      else if (h0 && h0.parentNode)
        h0.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const title = String((script[0] && script[0].title) || "").trim();
      if (!title) {
        card.innerHTML = `<p class="muted">首段脚本标题暂不可用</p>`;
        return;
      }
      const line = "授权视频首段标题 · " + title;
      card.innerHTML = `<p class="muted av-script-title0-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptTitle0CopyBtn">复制首段标题</button>`;
      const btn = $("#avScriptTitle0CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(title);
          softBanner(ok ? "已复制首段标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">首段标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系组合复制 */
  async function ensureHeirIdRelationCopyButtons() {
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
      const relation = String(it.relation || "").trim();
      const line = relation ? "#" + it.id + " · " + relation : "#" + it.id;
      el.dataset.idRelation = line;
      if (el.querySelector(".bn-copy-id-relation")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation";
      btn.textContent = "复制编号与关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelation || "");
        softBanner(ok ? "已复制编号与关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册处置种类已覆盖数纯数字一键复制 */
  async function ensureHandoverFilledTypesNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handFilledTypesNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handFilledTypesNumCopyCard";
      card.className = "hand-filled-types-num-copy";
      const brandEx = $("#handBrandExecutorCopyCard");
      const heirs = $("#handHeirsNamesCopyCard");
      const align = $("#handExportAlignCopyCard");
      if (brandEx && brandEx.parentNode)
        brandEx.insertAdjacentElement("afterend", card);
      else if (heirs && heirs.parentNode)
        heirs.insertAdjacentElement("afterend", card);
      else if (align && align.parentNode)
        align.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const filled =
        prog.filled_types != null
          ? prog.filled_types
          : Array.isArray(prog.by_action)
            ? prog.by_action.filter((r) => r && r.filled).length
            : null;
      if (filled == null) {
        card.innerHTML = `<p class="muted">处置种类覆盖数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(filled)));
      const line = "手册处置种类已覆盖数 · " + num;
      card.innerHTML = `<p class="muted hand-filled-types-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handFilledTypesNumCopyBtn">复制覆盖数</button>`;
      const btn = $("#handFilledTypesNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制覆盖数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">覆盖数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制中文品牌+应用版本 + round 层含 51 */
  async function paintAppVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appVersionCopyCard";
      card.className = "card app-version-copy-card";
      const range = $("#round50RangeCopyCard");
      const verDom = $("#versionDomainCopyCard");
      const enSv = $("#enServerVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (range && range.parentNode)
        range.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (enSv && enSv.parentNode)
        enSv.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = h.app || "电子继承 App";
      const ver = String(h.version || "0.5.0").replace(/^v/i, "");
      const line = app + " · v" + ver;
      card.innerHTML = `<h3>中文品牌 · 应用版本</h3>
        <p class="muted">一键复制中文品牌 + 应用版本（演示级）。</p>
        <p class="app-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appVersionCopyBtn">复制中文品牌与版本</button>`;
      const btn = $("#appVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制中文品牌与版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 应用版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList51() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 51;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 51); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round51 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeServerVersion().catch(() => {}), 340);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdDeptCopyButtons().catch(() => {}), 250);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetSummaryTagCopyButtons().catch(() => {}), 250);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinIntervalHoursNumCopy().catch(() => {}), 240);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerKindCopy().catch(() => {}), 260);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdServiceCopyButtons().catch(() => {}),
      250
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptTitle0Copy().catch(() => {}), 220);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdRelationCopyButtons().catch(() => {}), 250);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverFilledTypesNumCopy().catch(() => {}), 260);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeServerVersion().catch(() => {}), 340);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdDeptCopyButtons().catch(() => {}), 270);
    if (id === "assets")
      setTimeout(() => ensureAssetSummaryTagCopyButtons().catch(() => {}), 260);
    if (id === "checkin")
      setTimeout(() => ensureCheckinIntervalHoursNumCopy().catch(() => {}), 260);
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerKindCopy().catch(() => {}), 280);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdServiceCopyButtons().catch(() => {}),
        270
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptTitle0Copy().catch(() => {}), 240);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdRelationCopyButtons().catch(() => {}), 260);
    if (id === "handover")
      setTimeout(() => ensureHandoverFilledTypesNumCopy().catch(() => {}), 270);
    if (id === "settings") {
      setTimeout(() => {
        paintAppVersionCopyCard().catch(() => {});
        paintRoundLayerList51();
      }, 310);
      setTimeout(() => {
        paintAppVersionCopyCard().catch(() => {});
        paintRoundLayerList51();
      }, 800);
    }
  };

  // Boot
  setTimeout(() => paintHomeServerVersion().catch(() => {}), 400);
  setTimeout(() => ensureLegacyIdDeptCopyButtons().catch(() => {}), 420);
  setTimeout(() => ensureAssetSummaryTagCopyButtons().catch(() => {}), 440);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerKindCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptTitle0Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverFilledTypesNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppVersionCopyCard().catch(() => {});
      paintRoundLayerList51();
    }, 330);
  }
})();
