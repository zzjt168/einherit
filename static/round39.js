/* 电子继承 · 第三十九批增量（叠在 round38…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round39SoftBanner_" + (hostId || "home");
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

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatTs(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  function coopLabel(raw) {
    const s = String(raw || "").toLowerCase();
    if (s === "pending") return "待协同";
    if (s === "reachable" || s === "ok") return "可联系";
    if (s === "unreachable") return "暂未联系上";
    if (s === "done" || s === "closed") return "已结束";
    return String(raw || "");
  }

  /* 1 · 首页医旅意向条数一句 */
  async function paintHomeMedIntents() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMedIntentsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMedIntentsBar";
      bar.className = "home-med-intents-bar";
      bar.setAttribute("role", "status");
      const md = $("#homeMemberDaysBar");
      const co = $("#homeCompanyProgressBar");
      const snap = $("#homeSnapshotCountBar");
      if (md && md.parentNode === home) md.insertAdjacentElement("afterend", bar);
      else if (co && co.parentNode === home) co.insertAdjacentElement("afterend", bar);
      else if (snap && snap.parentNode === home) snap.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/hospitals/intents").catch(() => ({ items: [] }));
      const n = (data.items || []).length;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-med-mark">医旅</span>
          <span class="muted home-med-sub">可先看一家 · 按自己节奏筛选即可</span>
          <button type="button" class="btn ghost sm" id="homeMedGo">去医旅</button>`;
      } else {
        bar.innerHTML = `<span class="home-med-mark">医旅意向</span>
          <span class="muted home-med-sub">已提交 ${n} 条 · 名单可随时调整</span>
          <button type="button" class="btn ghost sm" id="homeMedGo">去医旅</button>`;
      }
      const btn = $("#homeMedGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("med");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割类别+处置组合复制 */
  async function ensureLegacyCatActionCopyButtons() {
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
      const cat = String(it.category || "").trim();
      const action = String(it.action || "").trim();
      const line = cat && action ? cat + " · " + action : cat || action;
      el.dataset.catAction = line;
      if (!line || el.querySelector(".lg-copy-cat-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-cat-action";
      btn.textContent = "复制类别与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.catAction || "");
        softBanner(ok ? "已复制类别与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘条目编号一键复制 */
  async function ensureAssetIdCopyButtons() {
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
      const id = it && it.id != null ? String(it.id) : el.dataset.id || "";
      if (!id || el.querySelector(".as-copy-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.id || id);
        softBanner(ok ? "已复制备忘编号" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制硬建议节点 */
  async function ensureCheckinHardDueCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHardDueCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHardDueCopyCard";
      card.className = "checkin-hard-due-copy";
      const gentle = $("#checkinGentleHintCopyCard");
      const name = $("#checkinNameCopyCard");
      const lastNext = $("#checkinLastNextCopyCard");
      if (gentle && gentle.parentNode) gentle.insertAdjacentElement("afterend", card);
      else if (name && name.parentNode) name.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.user || {}).checkin_hard_due_at;
      const pretty = formatTs(raw);
      const line = pretty
        ? "硬建议节点 · " + pretty + "（电子继承 · 演示说明，不改外呼流程）"
        : "硬建议节点暂不可用";
      card.innerHTML = `<p class="muted checkin-hard-due-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinHardDueCopyBtn"${
          pretty ? "" : " disabled"
        }>复制硬建议节点</button>`;
      const btn = $("#checkinHardDueCopyBtn");
      if (btn && pretty) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制硬建议节点" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">硬建议节点暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水种类标签一键复制 */
  async function ensureTravelKindLabelCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelKindLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelKindLabelCopyCard";
      card.className = "travel-kind-label-copy";
      const note = $("#travelLatestNoteCopyCard");
      const upd = $("#travelUpdatedAtCopyCard");
      const shortfall = $("#travelShortfallCopyCard");
      if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (upd && upd.parentNode) upd.insertAdjacentElement("afterend", card);
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
      const ledger = data.ledger || [];
      const latest = ledger[0] || {};
      const label = String(latest.kind_label || latest.kind || "").trim();
      const line = label || "暂无流水种类";
      card.innerHTML = `<p class="muted travel-kind-label-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelKindLabelCopyBtn"${
          label ? "" : " disabled"
        }>复制流水种类</button>`;
      const btn = $("#travelKindLabelCopyBtn");
      if (btn && label) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制流水种类" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水种类暂不可用</p>`;
    }
  }

  /* 6 · 善后协作状态一键复制 */
  async function ensureAftercareCoopCopyButtons() {
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
      const raw = String(it.coop_state || "").trim();
      const label = coopLabel(raw) || raw;
      el.dataset.coopLabel = label;
      if (!label || el.querySelector(".ac-copy-coop")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-coop";
      btn.textContent = "复制协作状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.coopLabel || "");
        softBanner(ok ? "已复制协作状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频三勾进度数字一键复制 */
  async function ensureAuthProgressCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressCopyCard";
      card.className = "av-progress-copy";
      const active = $("#avActiveIdCopyCard");
      const vis = $("#avVisibleCountBar");
      const complete = $("#avCompleteLabelCopyCard");
      if (active && active.parentNode) active.insertAdjacentElement("afterend", card);
      else if (vis && vis.parentNode) vis.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const prog = st.progress || {};
      const done = prog.done != null ? Number(prog.done) : (st.checklist || []).filter((c) => c.done).length;
      const total =
        prog.total != null
          ? Number(prog.total)
          : (st.checklist || []).length || 3;
      const line = "授权视频三勾进度 · " + done + "/" + total + "（电子继承 · 演示）";
      card.innerHTML = `<p class="muted av-progress-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avProgressCopyBtn">复制三勾进度</button>`;
      const btn = $("#avProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制三勾进度" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">三勾进度暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号一键复制 */
  async function ensureHeirIdCopyButtons() {
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
      el.dataset.id = String(it.id);
      if (el.querySelector(".bn-copy-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.id || String(it.id));
        softBanner(ok ? "已复制受益人编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册交割条目数一键复制 */
  async function ensureHandoverItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountCopyCard";
      card.className = "hand-item-count-copy";
      const bene = $("#handBeneCountCopyCard");
      const note = $("#handNoteCopyCard");
      const share = $("#handShareHintCopyCard");
      if (bene && bene.parentNode) bene.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (share && share.parentNode) share.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const n =
        data.item_count != null
          ? Number(data.item_count)
          : (data.todos || []).length;
      const line = "手册交割条目 " + (Number.isNaN(n) ? 0 : n) + " 条（电子继承 · 演示）";
      card.innerHTML = `<p class="muted hand-item-count-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handItemCountCopyBtn">复制条目数</button>`;
      const btn = $("#handItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制手册条目数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册条目数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务就绪行 + round 层含 39 */
  async function paintServiceReadyCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serviceReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serviceReadyCopyCard";
      card.className = "card service-ready-copy-card";
      const align = $("#exportAlignCopyCard");
      const slogan = $("#sloganCopyCard");
      const zh = $("#zhBrandDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (align && align.parentNode) align.insertAdjacentElement("beforebegin", card);
      else if (slogan && slogan.parentNode)
        slogan.insertAdjacentElement("beforebegin", card);
      else if (zh && zh.parentNode) zh.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = h.ok ? "服务就绪" : "健康检查已返回";
      const domain = h.domain || "einherit.cn";
      const line = ready + " · " + domain + (h.ok ? " · ok" : "");
      card.innerHTML = `<h3>服务就绪</h3>
        <p class="muted">一键复制服务就绪行（演示级）。</p>
        <p class="service-ready-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serviceReadyCopyBtn">复制服务就绪行</button>`;
      const btn = $("#serviceReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务就绪行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务就绪</h3><p class="muted">就绪信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList39() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 39;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 39); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round39 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMedIntents().catch(() => {}), 220);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyCatActionCopyButtons().catch(() => {}), 130);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdCopyButtons().catch(() => {}), 130);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinHardDueCopy().catch(() => {}), 120);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelKindLabelCopy().catch(() => {}), 140);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareCoopCopyButtons().catch(() => {}), 130);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressCopy().catch(() => {}), 100);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdCopyButtons().catch(() => {}), 130);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverItemCountCopy().catch(() => {}), 140);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeMedIntents().catch(() => {}), 220);
    if (id === "legacy")
      setTimeout(() => ensureLegacyCatActionCopyButtons().catch(() => {}), 150);
    if (id === "assets") setTimeout(() => ensureAssetIdCopyButtons().catch(() => {}), 140);
    if (id === "checkin") setTimeout(() => ensureCheckinHardDueCopy().catch(() => {}), 140);
    if (id === "travel") setTimeout(() => ensureTravelKindLabelCopy().catch(() => {}), 160);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareCoopCopyButtons().catch(() => {}), 150);
    if (id === "authvideo") setTimeout(() => ensureAuthProgressCopy().catch(() => {}), 120);
    if (id === "heirs") setTimeout(() => ensureHeirIdCopyButtons().catch(() => {}), 140);
    if (id === "handover")
      setTimeout(() => ensureHandoverItemCountCopy().catch(() => {}), 150);
    if (id === "settings") {
      setTimeout(() => {
        paintServiceReadyCopyCard().catch(() => {});
        paintRoundLayerList39();
      }, 190);
      setTimeout(() => {
        paintServiceReadyCopyCard().catch(() => {});
        paintRoundLayerList39();
      }, 560);
    }
  };

  // Boot
  setTimeout(() => paintHomeMedIntents().catch(() => {}), 280);
  setTimeout(() => ensureLegacyCatActionCopyButtons().catch(() => {}), 300);
  setTimeout(() => ensureAssetIdCopyButtons().catch(() => {}), 320);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHardDueCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelKindLabelCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCoopCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServiceReadyCopyCard().catch(() => {});
      paintRoundLayerList39();
    }, 210);
  }
})();
