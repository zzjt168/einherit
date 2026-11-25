/* 电子继承 · 第三十批增量（叠在 round29…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round30SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页交割条目总数一句 */
  async function paintHomeLegacyCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeLegacyCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeLegacyCountBar";
      bar.className = "home-legacy-count-bar";
      bar.setAttribute("role", "status");
      const ex = $("#homeExecutorReadyBar");
      const ac = $("#homeAftercareOpenBar");
      const heirs = $("#homeHeirsReadyBar");
      if (ex && ex.parentNode === home) ex.insertAdjacentElement("afterend", bar);
      else if (ac && ac.parentNode === home) ac.insertAdjacentElement("afterend", bar);
      else if (heirs && heirs.parentNode === home) heirs.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      let n = 0;
      try {
        const summary = await api("/api/counts-summary");
        const c = summary.counts || {};
        n = Number(c.legacy != null ? c.legacy : c.handover_items || 0);
      } catch (_) {
        const data = await api("/api/legacy");
        n = (data.items || []).length;
      }
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-lg-mark">交割</span>
          <span class="muted home-lg-sub">可先记一条安排 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeLegacyGo">去交割</button>`;
      } else {
        bar.innerHTML = `<span class="home-lg-mark">交割条目</span>
          <span class="muted home-lg-sub">已有 ${n} 条 · 名单可随时补</span>
          <button type="button" class="btn ghost sm" id="homeLegacyGo">去交割</button>`;
      }
      const btn = $("#homeLegacyGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("legacy");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割类别一键复制 */
  async function ensureLegacyCategoryCopyButtons() {
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
      const cat = it ? String(it.category || it.tag || "").trim() : "";
      if (it) el.dataset.category = cat;
      if (!cat || el.querySelector(".lg-copy-cat")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-cat";
      btn.textContent = "复制类别";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.category || "其他");
        softBanner(ok ? "已复制交割类别" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签计数条 */
  async function paintAssetTagCounts() {
    const list = $("#asList");
    if (!list || !list.parentNode) return;
    let bar = $("#asTagCountsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "asTagCountsBar";
      bar.className = "as-tag-counts-bar";
      bar.setAttribute("role", "status");
      const vis = $("#asVisibilityCountsBar");
      const draft = $("#asDraftChipBar");
      if (vis && vis.parentNode) vis.insertAdjacentElement("afterend", bar);
      else if (draft && draft.parentNode) draft.insertAdjacentElement("beforebegin", bar);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const data = await api("/api/assets");
      const items = data.items || [];
      const counts = {};
      items.forEach((it) => {
        const t = String(it.tag || "其他").trim() || "其他";
        counts[t] = (counts[t] || 0) + 1;
      });
      const chips = Object.keys(counts)
        .sort()
        .map((k) => `<span class="tag">${esc(k)} ${counts[k]}</span>`)
        .join("");
      bar.innerHTML = `<span class="muted">标签计数</span>${
        chips || `<span class="muted">暂无备忘</span>`
      }<span class="muted">共 ${items.length} 条</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">标签计数暂不可用</span>`;
    }
  }

  /* 4 · 报备页复制备用联系人摘要 */
  async function ensureCheckinBackupCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const bkList = $("#bkList");
    let card = $("#checkinBackupCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinBackupCopyCard";
      card.className = "checkin-backup-copy";
      const exCopy = $("#checkinExecutorCopyCard");
      const grace = $("#checkinGraceCopyCard");
      if (exCopy && exCopy.parentNode) exCopy.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode) grace.insertAdjacentElement("afterend", card);
      else if (bkList && bkList.parentNode) bkList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    let names = [];
    try {
      const st = await api("/api/checkin/status");
      const contacts = (st.user || {}).backup_contacts || [];
      names = contacts
        .map((c) => String(c.name || "").trim())
        .filter(Boolean);
    } catch (_) {
      $$("#bkList .bkName, #bkList input.bkName").forEach((inp) => {
        const v = String(inp.value || "").trim();
        if (v) names.push(v);
      });
    }
    const n = names.length;
    const line = n
      ? "备用联系人 " + n + " 人：" + names.join("、") + "（电子继承 · 演示）"
      : "尚未登记备用联系人";
    card.innerHTML = `<p class="muted checkin-backup-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="checkinBackupCopyBtn" ${
        n ? "" : "disabled"
      }>复制备用联系人摘要</button>`;
    const btn = $("#checkinBackupCopyBtn");
    if (btn && n) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制备用联系人摘要" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 差旅流水条数只读 */
  async function paintTravelLedgerCount() {
    const box = $("#travelBox");
    if (!box) return;
    let bar = $("#travelLedgerCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "travelLedgerCountBar";
      bar.className = "muted travel-ledger-count";
      bar.setAttribute("role", "status");
      const ago = $("#travelLedgerLatestAgo");
      const bal = $("#travelBalanceCopyCard");
      if (ago && ago.parentNode) ago.insertAdjacentElement("afterend", bar);
      else if (bal && bal.parentNode) bal.insertAdjacentElement("afterend", bar);
      else box.insertBefore(bar, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const n = (data.ledger || []).length;
      bar.textContent = "差旅流水共 " + n + " 笔 · 只读";
    } catch (_) {
      bar.textContent = "流水条数暂不可用";
    }
  }

  /* 6 · 善后工单标题一键复制 */
  async function ensureAftercareTitleCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#acList .item").forEach((el, i) => {
      const it = items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (it) el.dataset.title = String(it.title || "");
      if (!el.dataset.title && !(el.querySelector("strong") || {}).textContent) return;
      if (el.querySelector(".ac-copy-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title";
      btn.textContent = "复制标题";
      btn.onclick = async () => {
        const title =
          el.dataset.title ||
          ((el.querySelector("strong") || {}).textContent || "").trim() ||
          "电子继承 · 善后工单";
        const ok = await copyText(title);
        softBanner(ok ? "已复制工单标题" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频复制当前生效文件名 */
  async function ensureAuthActiveNameCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveNameCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveNameCopyCard";
      card.className = "av-active-name-copy";
      const pct = $("#avGatePercentBar");
      const status = $("#avStatus");
      if (pct && pct.parentNode) pct.insertAdjacentElement("afterend", card);
      else if (status && status.parentNode) status.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const items = st.items || [];
      const active =
        items.find((x) => x.current_active || x.active_label) ||
        items.find((x) => x.threshold_passed) ||
        items[0];
      if (!active) {
        card.innerHTML = `<p class="muted">尚无生效视频 · 可去上传区补一条</p>`;
        return;
      }
      const name = String(active.original_name || active.filename || "视频").trim();
      card.innerHTML = `<p class="muted av-active-name-line">当前生效 · ${esc(name)}</p>
        <button type="button" class="btn ghost sm" id="avActiveNameCopyBtn">复制文件名</button>`;
      const btn = $("#avActiveNameCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(name);
          softBanner(ok ? "已复制生效视频文件名" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效视频信息暂不可用</p>`;
    }
  }

  /* 8 · 受益人缺关系温和角标 */
  async function paintHeirMissingRelationBadges() {
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
      if (it.id != null) el.dataset.id = String(it.id);
      const rel = String(it.relation || "").trim();
      let badge = el.querySelector(".bn-missing-relation");
      if (rel) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag bn-missing-relation";
        badge.textContent = "待补关系";
        const strong = el.querySelector("strong");
        if (strong && strong.parentNode) strong.insertAdjacentElement("afterend", badge);
        else el.insertBefore(badge, el.firstChild);
      }
    });
  }

  /* 9 · 手册待办条数只读条 */
  async function paintHandoverTodoCount() {
    const box = $("#handoverBox");
    if (!box) return;
    let bar = $("#handTodoCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "handTodoCountBar";
      bar.className = "hand-todo-count-bar";
      bar.setAttribute("role", "status");
      const exCopy = $("#handExecutorCopyCard");
      const snapCount = $("#handSnapCountBar");
      if (exCopy && exCopy.parentNode) exCopy.insertAdjacentElement("afterend", bar);
      else if (snapCount && snapCount.parentNode) snapCount.insertAdjacentElement("afterend", bar);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", bar);
        else box.insertBefore(bar, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const n =
        data.item_count != null
          ? Number(data.item_count)
          : (data.todos || []).length;
      bar.innerHTML = `<span class="hand-todo-mark">手册待办</span>
        <span class="muted">共 ${n} 条 · 只读</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">待办条数暂不可用</span>`;
    }
  }

  /* 10 · 设置·一键复制体验层范围 + round 层含 30 */
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

  function paintRoundLayerList30() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 30;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 30); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round30 均已挂载。</p>`
      }`;
  }

  function paintRoundRangeCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#roundRangeCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "roundRangeCopyCard";
      card.className = "card round-range-copy-card";
      const today = $("#todayStatusCopyCard");
      const version = $("#versionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (today && today.parentNode) today.insertAdjacentElement("beforebegin", card);
      else if (version && version.parentNode) version.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    const uniq = collectRoundLayers();
    const from = uniq.length ? uniq[0] : 6;
    const to = uniq.length ? uniq[uniq.length - 1] : 30;
    const line =
      "电子继承体验层 round" +
      from +
      "…round" +
      Math.max(to, 30) +
      " · 共 " +
      Math.max(uniq.length, 1) +
      " 层 · einherit.cn";
    card.innerHTML = `<h3>体验层范围</h3>
      <p class="muted">一键复制已加载 round 层范围（演示诊断）。</p>
      <p class="round-range-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="roundRangeCopyBtn">复制体验层范围</button>`;
    const btn = $("#roundRangeCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制体验层范围" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeLegacyCount().catch(() => {}), 120);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyCategoryCopyButtons().catch(() => {}), 70);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => paintAssetTagCounts().catch(() => {}), 70);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinBackupCopy().catch(() => {}), 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => paintTravelLedgerCount().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareTitleCopyButtons().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveNameCopy().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => paintHeirMissingRelationBadges().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => paintHandoverTodoCount().catch(() => {}), 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeLegacyCount().catch(() => {}), 130);
    if (id === "legacy") setTimeout(() => ensureLegacyCategoryCopyButtons().catch(() => {}), 90);
    if (id === "assets") setTimeout(() => paintAssetTagCounts().catch(() => {}), 80);
    if (id === "checkin") setTimeout(() => ensureCheckinBackupCopy().catch(() => {}), 90);
    if (id === "travel") setTimeout(() => paintTravelLedgerCount().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => ensureAftercareTitleCopyButtons().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => ensureAuthActiveNameCopy().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => paintHeirMissingRelationBadges().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => paintHandoverTodoCount().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintRoundRangeCopyCard();
        paintRoundLayerList30();
      }, 140);
      setTimeout(() => {
        paintRoundRangeCopyCard();
        paintRoundLayerList30();
      }, 460);
    }
  };

  // Boot
  setTimeout(() => paintHomeLegacyCount().catch(() => {}), 180);
  setTimeout(() => ensureLegacyCategoryCopyButtons().catch(() => {}), 200);
  setTimeout(() => paintAssetTagCounts().catch(() => {}), 220);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinBackupCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    paintTravelLedgerCount().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveNameCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    paintHeirMissingRelationBadges().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    paintHandoverTodoCount().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintRoundRangeCopyCard();
      paintRoundLayerList30();
    }, 160);
  }
})();
