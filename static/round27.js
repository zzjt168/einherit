/* 电子继承 · 第二十七批增量（叠在 round26…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const NOTE_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "有备注" },
    { id: "0", label: "无备注" },
  ];
  let _lgNoteFilter = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round27SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页受益人就绪一句 */
  async function paintHomeHeirsReady() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHeirsReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHeirsReadyBar";
      bar.className = "home-heirs-ready-bar";
      bar.setAttribute("role", "status");
      const dispose = $("#homeDisposePendingBar");
      const guard = $("#homeGuardProgressBar");
      const dual = $("#homeDualStatusBar");
      const ring = $("#homeDeptRing");
      if (dispose && dispose.parentNode === home) dispose.insertAdjacentElement("afterend", bar);
      else if (guard && guard.parentNode === home) guard.insertAdjacentElement("afterend", bar);
      else if (dual && dual.parentNode === home) dual.insertAdjacentElement("afterend", bar);
      else if (ring && ring.parentNode === home) ring.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/beneficiaries");
      const n = (data.items || []).length;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-heirs-mark">受益人</span>
          <span class="muted home-heirs-sub">可先加一位 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeHeirsGo">去受益人</button>`;
      } else {
        bar.innerHTML = `<span class="home-heirs-mark">受益人就绪</span>
          <span class="muted home-heirs-sub">已登记 ${n} 位 · 名单可随时补</span>
          <button type="button" class="btn ghost sm" id="homeHeirsGo">去受益人</button>`;
      }
      const btn = $("#homeHeirsGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("heirs");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割按备注有无筛选 */
  function itemHasNotes(el) {
    const raw = el.dataset.hasNotes;
    if (raw === "1" || raw === "0") return raw;
    const muted = el.querySelector(".muted");
    const text = ((muted && muted.textContent) || el.textContent || "").trim();
    // strip common prefixes; treat leftover as notes when non-empty after 接收人
    if (/接收人：/.test(text)) {
      const after = text.replace(/接收人：[^·]*·?\s*/, "").trim();
      return after ? "1" : "0";
    }
    return text ? "1" : "0";
  }

  function ensureNoteFilterBar() {
    let bar = $("#lgNoteChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "lgNoteChipBar";
    bar.className = "chip-row lg-note-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按备注有无筛选");
    bar.innerHTML = NOTE_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _lgNoteFilter ? "active" : ""}" data-lgnote="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#lgList");
    const clearBar = $("#lgClearMediaChipBar");
    const factory = $("#lgFactoryChipBar");
    const filter = $("#lgFilterBar") || $("#lgDeptFilter");
    if (clearBar && clearBar.parentNode) clearBar.insertAdjacentElement("afterend", bar);
    else if (factory && factory.parentNode) factory.insertAdjacentElement("afterend", bar);
    else if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lgnote]");
      if (!btn) return;
      _lgNoteFilter = btn.dataset.lgnote || "";
      $$("#lgNoteChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.lgnote || "") === _lgNoteFilter)
      );
      applyNoteChipFilter();
    });
    return bar;
  }

  function applyNoteChipFilter() {
    ensureNoteFilterBar();
    const list = $("#lgList");
    if (!list) return;
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgNoteFilter) {
        if (el.dataset.r27NoteHidden === "1") {
          el.hidden = false;
          delete el.dataset.r27NoteHidden;
        }
        return;
      }
      const val = itemHasNotes(el);
      const show = val === _lgNoteFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r27NoteHidden = "1";
      } else if (el.dataset.r27NoteHidden === "1") {
        el.hidden = false;
        delete el.dataset.r27NoteHidden;
      }
    });
    let tip = $("#lgNoteChipTip");
    if (_lgNoteFilter) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgNoteChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _lgNoteFilter === "1"
            ? "这一筛选下暂时没有带备注的交割条目。"
            : "这一筛选下暂时没有无备注的交割条目。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintNoteChipFilter() {
    const list = $("#lgList");
    if (!list) return;
    ensureNoteFilterBar();
    try {
      const data = await api("/api/legacy");
      const byId = {};
      (data.items || []).forEach((it) => {
        byId[String(it.id)] = it;
      });
      $$("#lgList .item[data-id]").forEach((el) => {
        const it = byId[el.dataset.id];
        if (it) {
          const notes = String(it.notes || "").trim();
          el.dataset.hasNotes = notes ? "1" : "0";
        }
      });
    } catch (_) {}
    applyNoteChipFilter();
  }

  /* 3 · 备忘摘要一键复制 */
  async function ensureAssetCopySummaryButtons() {
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
      if (it) {
        el.dataset.platform = String(it.platform || "");
        el.dataset.summary = String(it.summary || "");
      }
      if (!el.dataset.id || el.querySelector(".as-copy-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary";
      btn.textContent = "复制摘要";
      btn.onclick = async () => {
        const platform = el.dataset.platform || "";
        const summary = el.dataset.summary || "";
        const line =
          (platform && summary ? platform + " · " + summary : platform || summary || "电子继承 · 备忘").trim();
        const ok = await copyText(line);
        softBanner(ok ? "已复制备忘摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次报备时间 */
  async function ensureCheckinLastCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const doBtn = $("#doCheckin");
    if (!doBtn) return;
    let card = $("#checkinLastCopyCard");
    const host = doBtn.closest(".card") || box;
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastCopyCard";
      card.className = "checkin-last-copy";
      doBtn.parentNode.insertAdjacentElement("afterend", card);
    }
    let label = "暂无上次报备时间";
    let copyVal = "";
    try {
      const hist = await api("/api/checkin/history?limit=1");
      const item = (hist.items || [])[0];
      if (item) {
        const at = item.at || item.created_at || item.ts || "";
        const ts = parseTs(at);
        const abs =
          typeof fmtTime === "function" && ts
            ? fmtTime(ts)
            : String(at || "");
        label = abs ? "上次报备 · " + abs : "上次报备时间可读";
        copyVal = abs || String(at);
      } else {
        const st = await api("/api/checkin/status");
        const user = st.user || {};
        const last = user.last_checkin || user.last_checkin_at || "";
        const ts = parseTs(last);
        if (ts) {
          const abs = typeof fmtTime === "function" ? fmtTime(ts) : String(last);
          label = "上次报备 · " + abs;
          copyVal = abs;
        }
      }
    } catch (_) {}
    card.innerHTML = `<p class="muted checkin-last-copy-line">${esc(label)}</p>
      <button type="button" class="btn ghost sm" id="checkinLastCopyBtn" ${
        copyVal ? "" : "disabled"
      }>复制上次报备时间</button>`;
    const btn = $("#checkinLastCopyBtn");
    if (btn && copyVal) {
      btn.onclick = async () => {
        const ok = await copyText(String(copyVal));
        softBanner(ok ? "已复制上次报备时间" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 差旅余额摘要一键复制 */
  async function ensureTravelBalanceCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceCopyCard";
      card.className = "travel-balance-copy";
      const input = $("#travelAmt");
      const shortfall = $("#travelShortfallFill");
      if (shortfall && shortfall.parentNode) shortfall.insertAdjacentElement("afterend", card);
      else if (input && input.parentNode) {
        const host = input.closest(".card") || input.parentNode;
        host.appendChild(card);
      } else {
        box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal = Number(fund.balance || 0);
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const line =
        "差旅余额 ¥" +
        bal +
        " · 门槛 ¥" +
        thr +
        "（电子继承 · 演示摘要）";
      card.innerHTML = `<p class="muted travel-balance-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceCopyBtn">复制余额摘要</button>`;
      card.dataset.copyText = line;
      const btn = $("#travelBalanceCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(card.dataset.copyText || line);
          softBanner(ok ? "已复制差旅余额摘要" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额摘要暂不可用</p>`;
    }
  }

  /* 6 · 善后缺城市温和角标 */
  async function paintAftercareMissingCityBadges() {
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
      const city = String(it.city || "").trim();
      let badge = el.querySelector(".ac-missing-city");
      if (city) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag ac-missing-city";
        badge.textContent = "待补城市";
        const strong = el.querySelector("strong");
        if (strong && strong.parentNode) strong.insertAdjacentElement("afterend", badge);
        else el.insertBefore(badge, el.firstChild);
      }
    });
  }

  /* 7 · 授权视频脚本总字数 */
  async function paintAuthScriptCharCount() {
    const panel = $("#authvideo");
    if (!panel) return;
    const scriptEl = $("#authScript");
    if (!scriptEl) return;
    let bar = $("#avScriptCharCount");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avScriptCharCount";
      bar.className = "muted av-script-char-count";
      bar.setAttribute("role", "status");
      scriptEl.insertAdjacentElement("afterend", bar);
    }
    try {
      const st = await api("/api/auth-video");
      const parts = st.script || [];
      let total = 0;
      parts.forEach((s) => {
        total += String(s.title || "").length;
        total += String(s.hint || s.body || s.text || "").length;
      });
      bar.textContent =
        parts.length > 0
          ? "脚本合计约 " + total + " 字 · " + parts.length + " 段（只读）"
          : "脚本暂不可用";
    } catch (_) {
      bar.textContent = "脚本字数暂不可用";
    }
  }

  /* 8 · 受益人角色人数小计条 */
  async function paintHeirRoleCounts() {
    const box = $("#heirsBox");
    if (!box) return;
    let bar = $("#bnRoleCountsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bnRoleCountsBar";
      bar.className = "bn-role-counts-bar";
      bar.setAttribute("role", "status");
      const card = box.querySelector(".card");
      if (card) {
        const h3 = card.querySelector("h3");
        if (h3) h3.insertAdjacentElement("afterend", bar);
        else card.insertBefore(bar, card.firstChild);
      } else {
        box.insertBefore(bar, box.firstChild);
      }
    }
    try {
      const data = await api("/api/beneficiaries");
      const items = data.items || [];
      const counts = { heir: 0, family: 0, executor: 0, other: 0 };
      items.forEach((b) => {
        const r = String(b.role || "").toLowerCase();
        if (r === "heir") counts.heir += 1;
        else if (r === "family") counts.family += 1;
        else if (r === "executor") counts.executor += 1;
        else counts.other += 1;
      });
      bar.innerHTML = `<span class="muted">角色小计</span>
        <span class="tag">继承人 ${counts.heir}</span>
        <span class="tag">家人 ${counts.family}</span>
        <span class="tag">执行人 ${counts.executor}</span>
        ${
          counts.other
            ? `<span class="tag">其他 ${counts.other}</span>`
            : ""
        }
        <span class="muted">共 ${items.length} 位</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">角色小计暂不可用</span>`;
    }
  }

  /* 9 · 手册最近快照时间一句 */
  async function paintHandoverLastSnap() {
    const box = $("#handoverBox");
    if (!box) return;
    let bar = $("#handLastSnapBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "handLastSnapBar";
      bar.className = "hand-last-snap-bar";
      bar.setAttribute("role", "status");
      const firstCard = box.querySelector(".card");
      if (firstCard) firstCard.insertAdjacentElement("afterend", bar);
      else box.insertBefore(bar, box.firstChild);
    }
    try {
      const snaps = await api("/api/snapshots");
      const items = snaps.items || [];
      if (!items.length) {
        bar.innerHTML = `<span class="hand-snap-mark">历史快照</span>
          <span class="muted">尚无快照 · 可先保存一版</span>
          <button type="button" class="btn ghost sm" id="handLastSnapFocus">去快照区</button>`;
      } else {
        const top = items[0];
        const ts = parseTs(top.created_at);
        const ago = relativeAgo(ts) || "不久前";
        const label = top.label ? String(top.label) : "未命名";
        bar.innerHTML = `<span class="hand-snap-mark">最近快照</span>
          <span class="muted">${esc(label)} · ${esc(ago)}</span>
          <button type="button" class="btn ghost sm" id="handLastSnapFocus">去快照区</button>`;
      }
      const btn = $("#handLastSnapFocus");
      if (btn) {
        btn.onclick = () => {
          const cards = $$("#handoverBox .card");
          let target = null;
          cards.forEach((c) => {
            const h = c.querySelector("h3");
            if (h && /快照/.test(h.textContent || "")) target = c;
          });
          if (!target && cards.length) target = cards[cards.length - 1];
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            target.classList.add("hand-snap-focus");
            clearTimeout(target._snapT);
            target._snapT = setTimeout(() => target.classList.remove("hand-snap-focus"), 1600);
          }
          softBanner("已定位到历史快照区", "handover");
        };
      }
    } catch (_) {
      bar.innerHTML = `<span class="muted">快照时间暂不可用</span>`;
    }
  }

  /* 10 · 设置·一键复制品牌署名 + round 层含 27 */
  function paintBrandCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandCopyCard";
      card.className = "card brand-copy-card";
      const counts = $("#countsCopyCard");
      const roundList = $("#roundLayerListCard");
      if (counts && counts.parentNode) counts.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    const line = "电子继承 App · E-Inherit · einherit.cn";
    card.innerHTML = `<h3>品牌署名</h3>
      <p class="muted">一键复制正式品牌行（演示级，便于对外说明）。</p>
      <p class="brand-copy-preview" id="brandCopyPreview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="brandCopyBtn">复制品牌署名</button>`;
    const btn = $("#brandCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制品牌署名" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList27() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 27;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 27); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round27 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeHeirsReady().catch(() => {}), 90);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => paintNoteChipFilter().catch(() => {}), 60);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetCopySummaryButtons().catch(() => {}), 60);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastCopy().catch(() => {}), 60);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceCopy().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => paintAftercareMissingCityBadges().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthScriptCharCount().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => paintHeirRoleCounts().catch(() => {}), 70);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => paintHandoverLastSnap().catch(() => {}), 80);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeHeirsReady().catch(() => {}), 110);
    if (id === "legacy") setTimeout(() => paintNoteChipFilter().catch(() => {}), 90);
    if (id === "assets") setTimeout(() => ensureAssetCopySummaryButtons().catch(() => {}), 70);
    if (id === "checkin") setTimeout(() => ensureCheckinLastCopy().catch(() => {}), 90);
    if (id === "travel") setTimeout(() => ensureTravelBalanceCopy().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => paintAftercareMissingCityBadges().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => paintAuthScriptCharCount().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => paintHeirRoleCounts().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => paintHandoverLastSnap().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintBrandCopyCard();
        paintRoundLayerList27();
      }, 130);
      setTimeout(() => {
        paintBrandCopyCard();
        paintRoundLayerList27();
      }, 420);
    }
  };

  // Boot
  setTimeout(() => paintHomeHeirsReady().catch(() => {}), 150);
  setTimeout(() => paintNoteChipFilter().catch(() => {}), 170);
  setTimeout(() => ensureAssetCopySummaryButtons().catch(() => {}), 190);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAftercareMissingCityBadges().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthScriptCharCount().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    paintHeirRoleCounts().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    paintHandoverLastSnap().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandCopyCard();
      paintRoundLayerList27();
    }, 150);
  }
})();
