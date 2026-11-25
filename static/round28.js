/* 电子继承 · 第二十八批增量（叠在 round27…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const DRAFT_CHIPS = [
    { id: "", label: "全部" },
    { id: "1", label: "草稿" },
    { id: "0", label: "正式" },
  ];
  let _asDraftFilter = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round28SoftBanner_" + (hostId || "home");
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

  function isAftercareOpen(it) {
    const k = String(it.status_key || "").toLowerCase();
    const st = String(it.status || "").toLowerCase();
    if (k === "done" || k === "completed") return false;
    if (st === "done" || st === "completed" || st === "已完成") return false;
    return true;
  }

  function isAssetDraft(it) {
    return !String(it.dispose_note || "").trim();
  }

  /* 1 · 首页善后未完成工单一句 */
  async function paintHomeAftercareOpen() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAftercareOpenBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAftercareOpenBar";
      bar.className = "home-aftercare-open-bar";
      bar.setAttribute("role", "status");
      const heirs = $("#homeHeirsReadyBar");
      const dispose = $("#homeDisposePendingBar");
      const dual = $("#homeDualStatusBar");
      if (heirs && heirs.parentNode === home) heirs.insertAdjacentElement("afterend", bar);
      else if (dispose && dispose.parentNode === home) dispose.insertAdjacentElement("afterend", bar);
      else if (dual && dual.parentNode === home) dual.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/aftercare");
      const open = (data.items || []).filter(isAftercareOpen);
      const n = open.length;
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ac-mark">善后进行中</span>
        <span class="muted home-ac-sub">还有 ${n} 单未完成 · 按自己节奏即可</span>
        <button type="button" class="btn ghost sm" id="homeAftercareGo">去善后</button>`;
      const btn = $("#homeAftercareGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("aftercare");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题一键复制 */
  async function ensureLegacyTitleCopyButtons() {
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
      if (it) el.dataset.title = String(it.title || "");
      if (!el.dataset.id || el.querySelector(".lg-copy-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title";
      btn.textContent = "复制标题";
      btn.onclick = async () => {
        const title = el.dataset.title || (el.querySelector("strong") || {}).textContent || "";
        const ok = await copyText(String(title).trim() || "电子继承 · 交割条目");
        softBanner(ok ? "已复制交割标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘按草稿/正式筛选（无处置=草稿） */
  function ensureDraftFilterBar() {
    let bar = $("#asDraftChipBar");
    if (bar) return bar;
    bar = document.createElement("div");
    bar.id = "asDraftChipBar";
    bar.className = "chip-row as-draft-chips";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "按草稿/正式筛选");
    bar.innerHTML = DRAFT_CHIPS.map(
      (c) =>
        `<button type="button" class="chip ${c.id === _asDraftFilter ? "active" : ""}" data-asdraft="${esc(
          c.id
        )}">${esc(c.label)}</button>`
    ).join("");
    const list = $("#asList");
    const search = $("#asSearchClear") || $("#asSearch") || $("#asQ");
    const dept = $("#asDeptChipBar") || $("#asDeptFilter");
    if (dept && dept.parentNode) dept.insertAdjacentElement("afterend", bar);
    else if (search && search.parentNode) search.parentNode.insertBefore(bar, search.nextSibling);
    else if (list && list.parentNode) list.parentNode.insertBefore(bar, list);
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-asdraft]");
      if (!btn) return;
      _asDraftFilter = btn.dataset.asdraft || "";
      $$("#asDraftChipBar .chip").forEach((c) =>
        c.classList.toggle("active", (c.dataset.asdraft || "") === _asDraftFilter)
      );
      applyDraftChipFilter();
    });
    return bar;
  }

  function applyDraftChipFilter() {
    ensureDraftFilterBar();
    const list = $("#asList");
    if (!list) return;
    $$("#asList .item[data-id]").forEach((el) => {
      if (!_asDraftFilter) {
        if (el.dataset.r28DraftHidden === "1") {
          el.hidden = false;
          delete el.dataset.r28DraftHidden;
        }
        return;
      }
      const val = el.dataset.isDraft || "0";
      const show = val === _asDraftFilter;
      if (!show) {
        el.hidden = true;
        el.dataset.r28DraftHidden = "1";
      } else if (el.dataset.r28DraftHidden === "1") {
        el.hidden = false;
        delete el.dataset.r28DraftHidden;
      }
    });
    let tip = $("#asDraftChipTip");
    if (_asDraftFilter) {
      const visible = $$("#asList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "asDraftChipTip";
          tip.className = "muted";
          list.appendChild(tip);
        }
        tip.textContent =
          _asDraftFilter === "1"
            ? "这一筛选下暂时没有草稿（未填处置）备忘。"
            : "这一筛选下暂时没有正式（已填处置）备忘。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  async function paintDraftChipFilter() {
    const list = $("#asList");
    if (!list) return;
    ensureDraftFilterBar();
    try {
      const data = await api("/api/assets");
      const byId = {};
      (data.items || []).forEach((it) => {
        byId[String(it.id)] = it;
      });
      $$("#asList .item").forEach((el, i) => {
        const it = (el.dataset.id && byId[el.dataset.id]) || (data.items || [])[i];
        if (it && it.id != null) el.dataset.id = String(it.id);
        if (it) el.dataset.isDraft = isAssetDraft(it) ? "1" : "0";
      });
    } catch (_) {}
    applyDraftChipFilter();
  }

  /* 4 · 报备页复制冷静期说明 */
  function ensureCheckinGraceCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const graceInput = $("#graceHours");
    if (!graceInput) return;
    let card = $("#checkinGraceCopyCard");
    const host = graceInput.closest(".card") || box;
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceCopyCard";
      card.className = "checkin-grace-copy";
      const intervalCopy = $("#checkinIntervalCopyCard");
      if (intervalCopy && intervalCopy.parentNode) {
        intervalCopy.insertAdjacentElement("afterend", card);
      } else {
        const save = $("#saveInterval");
        if (save && save.parentNode) save.insertAdjacentElement("afterend", card);
        else host.appendChild(card);
      }
    }
    const hours = Number(graceInput.value != null ? graceInput.value : 72);
    const n = Number.isFinite(hours) ? hours : 72;
    const line = "冷静期 " + n + " 小时（电子继承 · 演示说明，不改外呼流程）";
    card.innerHTML = `<p class="muted checkin-grace-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="checkinGraceCopyBtn">复制冷静期说明</button>`;
    const btn = $("#checkinGraceCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const h = Number(($("#graceHours") && $("#graceHours").value) || n);
        const text =
          "冷静期 " +
          (Number.isFinite(h) ? h : 72) +
          " 小时（电子继承 · 演示说明，不改外呼流程）";
        const ok = await copyText(text);
        softBanner(ok ? "已复制冷静期说明" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 会员页一键复制权益就绪摘要 */
  async function paintMemberBenefitsCopy() {
    const box = $("#memberBox");
    if (!box) return;
    let card = $("#memberBenefitsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "memberBenefitsCopyCard";
      card.className = "member-benefits-copy";
      const bene = $("#memberBenefitsCard");
      if (bene && bene.parentNode) bene.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.appendChild(card);
      }
    }
    try {
      const data = await api("/api/membership/benefits");
      const rows = data.rows || [];
      const lines = rows.map((r) => {
        const mark = r.ready ? "就绪" : "可补";
        return (r.label || r.key || "") + " · " + mark + (r.detail ? " · " + r.detail : "");
      });
      const summary =
        (data.text || "会员权益对照") +
        (lines.length ? "\n" + lines.join("\n") : "") +
        "\n电子继承 App · einherit.cn";
      card.innerHTML = `<p class="muted member-benefits-copy-line">${esc(
        data.text || "会员权益摘要"
      )}</p>
        <button type="button" class="btn ghost sm" id="memberBenefitsCopyBtn">复制权益摘要</button>`;
      card.dataset.copyText = summary;
      const btn = $("#memberBenefitsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(card.dataset.copyText || summary);
          softBanner(ok ? "已复制权益就绪摘要" : "复制未完成", "member");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">权益摘要暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型计数条 */
  async function paintAftercareServiceCounts() {
    const list = $("#acList");
    if (!list || !list.parentNode) return;
    let bar = $("#acServiceCountsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "acServiceCountsBar";
      bar.className = "ac-service-counts-bar";
      bar.setAttribute("role", "status");
      const statusCounts = $("#acStatusCountsBar");
      const filter = $("#acStatusFilterBar");
      if (statusCounts && statusCounts.parentNode) {
        statusCounts.insertAdjacentElement("afterend", bar);
      } else if (filter && filter.parentNode) {
        filter.insertAdjacentElement("afterend", bar);
      } else {
        list.parentNode.insertBefore(bar, list);
      }
    }
    try {
      const data = await api("/api/aftercare");
      const items = data.items || [];
      const counts = {};
      items.forEach((it) => {
        const k = String(it.service_type || "other");
        counts[k] = (counts[k] || 0) + 1;
      });
      const labels =
        (typeof SERVICE_LABEL === "object" && SERVICE_LABEL) || {
          field_visit: "上门探访",
          delete_data: "数据清除",
        };
      const chips = Object.keys(counts)
        .sort()
        .map(
          (k) =>
            `<span class="tag">${esc(labels[k] || k)} ${counts[k]}</span>`
        )
        .join("");
      bar.innerHTML = `<span class="muted">服务类型</span>${
        chips || `<span class="muted">暂无工单</span>`
      }<span class="muted">共 ${items.length} 单</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">服务类型计数暂不可用</span>`;
    }
  }

  /* 7 · 授权视频最近上传相对时间 */
  async function paintAuthLatestAgo() {
    const panel = $("#authvideo");
    if (!panel) return;
    const list = $("#avList");
    if (!list) return;
    let bar = $("#avLatestAgoBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "avLatestAgoBar";
      bar.className = "muted av-latest-ago";
      bar.setAttribute("role", "status");
      const charCount = $("#avScriptCharCount");
      if (charCount && charCount.parentNode) charCount.insertAdjacentElement("afterend", bar);
      else list.insertAdjacentElement("beforebegin", bar);
    }
    try {
      const st = await api("/api/auth-video");
      const items = st.items || [];
      if (!items.length) {
        bar.textContent = "尚无上传记录 · 可去上传区补一条";
        return;
      }
      const top = items[0];
      const ts = parseTs(top.created_at);
      const ago = relativeAgo(ts) || "不久前";
      const name = top.original_name || top.filename || "视频";
      bar.textContent = "最近上传 · " + name + " · " + ago + "（只读）";
    } catch (_) {
      bar.textContent = "最近上传时间暂不可用";
    }
  }

  /* 8 · 受益人姓名一键复制 */
  async function ensureHeirNameCopyButtons() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#heirsBox .item").forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      el.dataset.name = String(it.name || "");
      el.dataset.contact = String(it.contact || "");
      if (el.querySelector(".bn-copy-name")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name";
      btn.textContent = "复制姓名";
      btn.onclick = async () => {
        const name = el.dataset.name || "";
        const contact = (el.dataset.contact || "").trim();
        const line = contact ? name + " · " + contact : name || "电子继承 · 受益人";
        const ok = await copyText(line);
        softBanner(ok ? "已复制受益人姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册快照份数只读条 */
  async function paintHandoverSnapCount() {
    const box = $("#handoverBox");
    if (!box) return;
    let bar = $("#handSnapCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "handSnapCountBar";
      bar.className = "hand-snap-count-bar";
      bar.setAttribute("role", "status");
      const last = $("#handLastSnapBar");
      if (last && last.parentNode) last.insertAdjacentElement("afterend", bar);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", bar);
        else box.insertBefore(bar, box.firstChild);
      }
    }
    try {
      const snaps = await api("/api/snapshots");
      const n = (snaps.items || []).length;
      bar.innerHTML = `<span class="hand-snap-count-mark">快照份数</span>
        <span class="muted">历史快照共 ${n} 份 · 只读</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">快照份数暂不可用</span>`;
    }
  }

  /* 10 · 设置·一键复制应用版本行 + round 层含 28 */
  async function paintVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionCopyCard";
      card.className = "card version-copy-card";
      const brand = $("#brandCopyCard");
      const counts = $("#countsCopyCard");
      const roundList = $("#roundLayerListCard");
      if (brand && brand.parentNode) brand.insertAdjacentElement("beforebegin", card);
      else if (counts && counts.parentNode) counts.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const line =
        (h.app || "电子继承 App") +
        " · v" +
        (h.version || "?") +
        " · " +
        (h.domain || "einherit.cn") +
        (h.server_version ? " · " + h.server_version : "");
      card.innerHTML = `<h3>应用版本</h3>
        <p class="muted">一键复制健康检查中的版本行（演示级）。</p>
        <p class="version-copy-preview" id="versionCopyPreview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionCopyBtn">复制应用版本行</button>`;
      card.dataset.copyText = line;
      const btn = $("#versionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(card.dataset.copyText || line);
          softBanner(ok ? "已复制应用版本行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本</h3><p class="muted">版本信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList28() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 28;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 28); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round28 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAftercareOpen().catch(() => {}), 100);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyTitleCopyButtons().catch(() => {}), 60);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => paintDraftChipFilter().catch(() => {}), 60);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(ensureCheckinGraceCopy, 60);
  };

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    setTimeout(() => paintMemberBenefitsCopy().catch(() => {}), 80);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => paintAftercareServiceCounts().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthLatestAgo().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNameCopyButtons().catch(() => {}), 70);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => paintHandoverSnapCount().catch(() => {}), 80);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeAftercareOpen().catch(() => {}), 120);
    if (id === "legacy") setTimeout(() => ensureLegacyTitleCopyButtons().catch(() => {}), 90);
    if (id === "assets") setTimeout(() => paintDraftChipFilter().catch(() => {}), 80);
    if (id === "checkin") setTimeout(ensureCheckinGraceCopy, 90);
    if (id === "member") setTimeout(() => paintMemberBenefitsCopy().catch(() => {}), 100);
    if (id === "aftercare") setTimeout(() => paintAftercareServiceCounts().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => paintAuthLatestAgo().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => ensureHeirNameCopyButtons().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => paintHandoverSnapCount().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionCopyCard().catch(() => {});
        paintRoundLayerList28();
      }, 140);
      setTimeout(() => {
        paintVersionCopyCard().catch(() => {});
        paintRoundLayerList28();
      }, 440);
    }
  };

  // Boot
  setTimeout(() => paintHomeAftercareOpen().catch(() => {}), 160);
  setTimeout(() => ensureLegacyTitleCopyButtons().catch(() => {}), 180);
  setTimeout(() => paintDraftChipFilter().catch(() => {}), 200);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceCopy();
  }
  if ($("#member") && $("#member").classList.contains("active")) {
    paintMemberBenefitsCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    paintAftercareServiceCounts().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthLatestAgo().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    paintHandoverSnapCount().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionCopyCard().catch(() => {});
      paintRoundLayerList28();
    }, 160);
  }
})();
