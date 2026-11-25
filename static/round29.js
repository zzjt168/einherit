/* 电子继承 · 第二十九批增量（叠在 round28…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const ROLE_CHIPS = [
    { id: "", label: "全部" },
    { id: "heir", label: "继承人" },
    { id: "family", label: "家人" },
    { id: "executor", label: "执行人" },
  ];
  let _bnRoleFilter = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round29SoftBanner_" + (hostId || "home");
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

  function relativeAgo(ts) {
    const t = Number(ts) || 0;
    if (!t) return "";
    const sec = Math.max(0, Date.now() / 1000 - t);
    if (sec < 60) return "约不到一分钟前";
    if (sec < 3600) return "约 " + Math.max(1, Math.floor(sec / 60)) + " 分钟前";
    if (sec < 86400) return "约 " + Math.max(1, Math.floor(sec / 3600)) + " 小时前";
    const days = Math.floor(sec / 86400);
    if (days < 30) return "约 " + days + " 天前";
    return "约 " + Math.floor(days / 30) + " 个月前";
  }

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  /* 1 · 首页执行人就绪一句 */
  async function paintHomeExecutorReady() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeExecutorReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeExecutorReadyBar";
      bar.className = "home-executor-ready-bar";
      bar.setAttribute("role", "status");
      const ac = $("#homeAftercareOpenBar");
      const heirs = $("#homeHeirsReadyBar");
      const dispose = $("#homeDisposePendingBar");
      if (ac && ac.parentNode === home) ac.insertAdjacentElement("afterend", bar);
      else if (heirs && heirs.parentNode === home) heirs.insertAdjacentElement("afterend", bar);
      else if (dispose && dispose.parentNode === home) dispose.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/me");
      const user = data.user || data;
      const name = String(user.executor_name || "").trim();
      bar.hidden = false;
      if (!name) {
        bar.innerHTML = `<span class="home-ex-mark">执行人</span>
          <span class="muted home-ex-sub">可先指定一位 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeExecutorGo">去设置</button>`;
      } else {
        bar.innerHTML = `<span class="home-ex-mark">执行人就绪</span>
          <span class="muted home-ex-sub">执行人 · ${esc(name)}</span>
          <button type="button" class="btn ghost sm" id="homeExecutorGo">去设置</button>`;
      }
      const btn = $("#homeExecutorGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割接收人一键复制 */
  async function ensureLegacyBeneCopyButtons() {
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
      const bene = it ? String(it.beneficiary || "").trim() : "";
      if (it) el.dataset.beneficiary = bene;
      let btn = el.querySelector(".lg-copy-bene");
      if (!bene) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-bene";
      btn.textContent = "复制接收人";
      btn.onclick = async () => {
        const name = el.dataset.beneficiary || "";
        const ok = await copyText(name || "电子继承 · 接收人");
        softBanner(ok ? "已复制接收人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性计数条 */
  async function paintAssetVisibilityCounts() {
    const list = $("#asList");
    if (!list || !list.parentNode) return;
    let bar = $("#asVisibilityCountsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "asVisibilityCountsBar";
      bar.className = "as-visibility-counts-bar";
      bar.setAttribute("role", "status");
      const draft = $("#asDraftChipBar");
      if (draft && draft.parentNode) draft.insertAdjacentElement("beforebegin", bar);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const data = await api("/api/assets");
      const items = data.items || [];
      let priv = 0;
      let fam = 0;
      let other = 0;
      items.forEach((it) => {
        const v = String(it.visibility || "").toLowerCase();
        if (v === "private" || v === "私密") priv += 1;
        else if (v === "family" || v === "家人" || v === "家庭") fam += 1;
        else other += 1;
      });
      bar.innerHTML = `<span class="muted">可见性</span>
        <span class="tag">私密 ${priv}</span>
        <span class="tag">家人 ${fam}</span>
        ${other ? `<span class="tag">其他 ${other}</span>` : ""}
        <span class="muted">共 ${items.length} 条</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">可见性计数暂不可用</span>`;
    }
  }

  /* 4 · 报备页复制执行人姓名 */
  function ensureCheckinExecutorCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const input = $("#executorName");
    if (!input) return;
    let card = $("#checkinExecutorCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinExecutorCopyCard";
      card.className = "checkin-executor-copy";
      const grace = $("#checkinGraceCopyCard");
      const interval = $("#checkinIntervalCopyCard");
      if (grace && grace.parentNode) grace.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode) interval.insertAdjacentElement("afterend", card);
      else {
        const save = $("#saveInterval");
        if (save && save.parentNode) save.insertAdjacentElement("afterend", card);
        else (input.closest(".card") || box).appendChild(card);
      }
    }
    const name = String(input.value || "").trim();
    const line = name
      ? "执行人 · " + name + "（电子继承 · 演示）"
      : "尚未填写执行人姓名";
    card.innerHTML = `<p class="muted checkin-executor-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="checkinExecutorCopyBtn" ${
        name ? "" : "disabled"
      }>复制执行人姓名</button>`;
    const btn = $("#checkinExecutorCopyBtn");
    if (btn && name) {
      btn.onclick = async () => {
        const cur = String(($("#executorName") && $("#executorName").value) || name).trim();
        const ok = await copyText(cur);
        softBanner(ok ? "已复制执行人姓名" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 差旅最近一笔流水相对时间 */
  async function paintTravelLedgerLatestAgo() {
    const box = $("#travelBox");
    if (!box) return;
    let bar = $("#travelLedgerLatestAgo");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "travelLedgerLatestAgo";
      bar.className = "muted travel-ledger-latest-ago";
      bar.setAttribute("role", "status");
      const balCopy = $("#travelBalanceCopyCard");
      const shortfall = $("#travelShortfallFill");
      if (balCopy && balCopy.parentNode) balCopy.insertAdjacentElement("afterend", bar);
      else if (shortfall && shortfall.parentNode) shortfall.insertAdjacentElement("afterend", bar);
      else box.insertBefore(bar, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      if (!ledger.length) {
        bar.textContent = "尚无差旅流水 · 充值后会显示最近一笔时间";
        return;
      }
      const top = ledger[0];
      const ts = parseTs(top.created_at);
      const ago = relativeAgo(ts) || "不久前";
      const kind = top.kind || top.note || "流水";
      bar.textContent = "最近流水 · " + kind + " · " + ago + "（只读）";
    } catch (_) {
      bar.textContent = "最近流水时间暂不可用";
    }
  }

  /* 6 · 善后缺备注温和角标 */
  async function paintAftercareMissingNotesBadges() {
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
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const notes = String(it.notes || "").trim();
      let badge = el.querySelector(".ac-missing-notes");
      if (notes) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag ac-missing-notes";
        badge.textContent = "待补备注";
        const strong = el.querySelector("strong");
        if (strong && strong.parentNode) strong.insertAdjacentElement("afterend", badge);
        else el.insertBefore(badge, el.firstChild);
      }
    });
  }

  /* 7 · 授权视频门槛进度百分比 */
  async function paintAuthGatePercent() {
    const panel = $("#authvideo");
    if (!panel) return;
    let bar = $("#avGatePercentBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avGatePercentBar";
      bar.className = "muted av-gate-percent";
      bar.setAttribute("role", "status");
      const status = $("#avStatus");
      const script = $("#authScript");
      if (status && status.parentNode) status.insertAdjacentElement("afterend", bar);
      else if (script && script.parentNode) script.insertAdjacentElement("beforebegin", bar);
      else panel.insertBefore(bar, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      let okN = 0;
      if (st.ready) {
        okN = 3;
      } else {
        const latest = st.latest || (st.items || [])[0] || {};
        if (latest.has_greeting) okN += 1;
        if (latest.has_authorize) okN += 1;
        if (latest.has_plan) okN += 1;
      }
      const pct = Math.round((okN / 3) * 100);
      bar.textContent = "门槛进度 · " + okN + "/3 · " + pct + "%（只读）";
    } catch (_) {
      bar.textContent = "门槛进度暂不可用";
    }
  }

  /* 8 · 受益人按角色筛选 */
  function ensureHeirRoleFilterBar() {
    let bar = $("#bnRoleChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "bnRoleChipBar";
    bar.className = "chip-row bn-role-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按角色筛选受益人");
    bar.innerHTML = ROLE_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _bnRoleFilter ? "active" : ""}" data-bnrole="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const box = $("#heirsBox");
    if (!box) return bar;
    const counts = $("#bnRoleCountsBar");
    if (counts && counts.parentNode) counts.insertAdjacentElement("afterend", bar);
    else {
      const list = box.querySelector(".list");
      if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
      else box.appendChild(bar);
    }
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bnrole]");
      if (!btn) return;
      _bnRoleFilter = btn.dataset.bnrole || "";
      $$("#bnRoleChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.bnrole || "") === _bnRoleFilter)
      );
      applyHeirRoleFilter();
    });
    return bar;
  }

  function applyHeirRoleFilter() {
    ensureHeirRoleFilterBar();
    const box = $("#heirsBox");
    if (!box) return;
    const items = $$("#heirsBox .list .item, #heirsBox .item").filter((el) =>
      el.querySelector("strong")
    );
    items.forEach((el) => {
      if (!_bnRoleFilter) {
        if (el.dataset.r29RoleHidden === "1") {
          el.hidden = false;
          delete el.dataset.r29RoleHidden;
        }
        return;
      }
      const role = String(el.dataset.role || "").toLowerCase();
      const show = role === _bnRoleFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r29RoleHidden = "1";
      } else if (el.dataset.r29RoleHidden === "1") {
        el.hidden = false;
        delete el.dataset.r29RoleHidden;
      }
    });
    let tip = $("#bnRoleChipTip");
    const listHost = ($("#heirsBox .list") || $("#heirsBox"));
    if (_bnRoleFilter) {
      const visible = items.filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "bnRoleChipTip";
          tip.className = "muted";
          listHost.appendChild(tip);
        }
        tip.textContent = "这一角色下暂时没有受益人。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintHeirRoleFilter() {
    const box = $("#heirsBox");
    if (!box) return;
    ensureHeirRoleFilterBar();
    try {
      const data = await api("/api/beneficiaries");
      const items = data.items || [];
      const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
      nodes.forEach((el, i) => {
        const it = items[i];
        if (!it) return;
        if (it.id != null) el.dataset.id = String(it.id);
        el.dataset.role = String(it.role || "").toLowerCase();
      });
    } catch (_) {}
    applyHeirRoleFilter();
  }

  /* 9 · 手册执行人姓名一键复制 */
  async function ensureHandoverExecutorCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExecutorCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExecutorCopyCard";
      card.className = "hand-executor-copy";
      const snapCount = $("#handSnapCountBar");
      const lastSnap = $("#handLastSnapBar");
      if (snapCount && snapCount.parentNode) snapCount.insertAdjacentElement("afterend", card);
      else if (lastSnap && lastSnap.parentNode) lastSnap.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const name = String(data.executor || "").trim();
      const line = name ? "手册执行人 · " + name : "手册尚未填写执行人";
      card.innerHTML = `<p class="muted hand-executor-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handExecutorCopyBtn" ${
          name ? "" : "disabled"
        }>复制执行人姓名</button>`;
      const btn = $("#handExecutorCopyBtn");
      if (btn && name) {
        btn.onclick = async () => {
          const ok = await copyText(name);
          softBanner(ok ? "已复制手册执行人" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">执行人信息暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制今日服务状态行 + round 层含 29 */
  async function paintTodayStatusCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#todayStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "todayStatusCopyCard";
      card.className = "card today-status-copy-card";
      const version = $("#versionCopyCard");
      const brand = $("#brandCopyCard");
      const roundList = $("#roundLayerListCard");
      if (version && version.parentNode) version.insertAdjacentElement("beforebegin", card);
      else if (brand && brand.parentNode) brand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = h.ok ? "服务正常" : "服务暂不可用";
      const line =
        ready +
        " · v" +
        (h.version || "?") +
        " · " +
        (h.domain || "einherit.cn") +
        " · " +
        todayISO() +
        "（电子继承 App）";
      card.innerHTML = `<h3>今日服务状态</h3>
        <p class="muted">一键复制健康状态 + 版本 + 今日日期（演示级）。</p>
        <p class="today-status-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="todayStatusCopyBtn">复制今日服务状态行</button>`;
      card.dataset.copyText = line;
      const btn = $("#todayStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(card.dataset.copyText || line);
          softBanner(ok ? "已复制今日服务状态行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>今日服务状态</h3><p class="muted">状态暂不可用</p>`;
    }
  }

  function paintRoundLayerList29() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 29;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 29); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round29 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeExecutorReady().catch(() => {}), 110);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyBeneCopyButtons().catch(() => {}), 70);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => paintAssetVisibilityCounts().catch(() => {}), 70);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(ensureCheckinExecutorCopy, 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => paintTravelLedgerLatestAgo().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => paintAftercareMissingNotesBadges().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthGatePercent().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => paintHeirRoleFilter().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExecutorCopy().catch(() => {}), 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeExecutorReady().catch(() => {}), 120);
    if (id === "legacy") setTimeout(() => ensureLegacyBeneCopyButtons().catch(() => {}), 90);
    if (id === "assets") setTimeout(() => paintAssetVisibilityCounts().catch(() => {}), 80);
    if (id === "checkin") setTimeout(ensureCheckinExecutorCopy, 90);
    if (id === "travel") setTimeout(() => paintTravelLedgerLatestAgo().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => paintAftercareMissingNotesBadges().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => paintAuthGatePercent().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => paintHeirRoleFilter().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => ensureHandoverExecutorCopy().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintTodayStatusCopyCard().catch(() => {});
        paintRoundLayerList29();
      }, 140);
      setTimeout(() => {
        paintTodayStatusCopyCard().catch(() => {});
        paintRoundLayerList29();
      }, 450);
    }
  };

  // Boot
  setTimeout(() => paintHomeExecutorReady().catch(() => {}), 170);
  setTimeout(() => ensureLegacyBeneCopyButtons().catch(() => {}), 190);
  setTimeout(() => paintAssetVisibilityCounts().catch(() => {}), 210);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinExecutorCopy();
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    paintTravelLedgerLatestAgo().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAftercareMissingNotesBadges().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthGatePercent().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    paintHeirRoleFilter().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExecutorCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintTodayStatusCopyCard().catch(() => {});
      paintRoundLayerList29();
    }, 160);
  }
})();
