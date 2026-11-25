/* 电子继承 · 第四十批增量（叠在 round39…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round40SoftBanner_" + (hostId || "home");
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

  function visLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "private") return "仅自己";
    if (v === "family") return "家人可见";
    return String(raw || "");
  }

  function fmtMoneyAmt(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return "";
    if (typeof fmtMoney === "function") return fmtMoney(x);
    const sign = x < 0 ? "-" : "";
    return sign + "¥" + Math.abs(x).toFixed(x % 1 ? 2 : 0);
  }

  /* 1 · 首页急症前清册条数一句 */
  async function paintHomeIcuCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeIcuCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeIcuCountBar";
      bar.className = "home-icu-count-bar";
      bar.setAttribute("role", "status");
      const med = $("#homeMedIntentsBar");
      const md = $("#homeMemberDaysBar");
      const ready = $("#homeIcuReadyBar");
      if (med && med.parentNode === home) med.insertAdjacentElement("afterend", bar);
      else if (md && md.parentNode === home) md.insertAdjacentElement("afterend", bar);
      else if (ready && ready.parentNode === home)
        ready.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/icu-pack");
      const n =
        data.count != null
          ? Number(data.count)
          : (data.pack || data.items || []).length;
      const ready = !!(data.ready);
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-icu-mark">急症前清册</span>
          <span class="muted home-icu-sub">可先列几项 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeIcuCountGo">去清册</button>`;
      } else {
        bar.innerHTML = `<span class="home-icu-mark">急症前清册</span>
          <span class="muted home-icu-sub">已列 ${n} 项${ready ? " · 可按节奏核对" : " · 可继续补齐"}</span>
          <button type="button" class="btn ghost sm" id="homeIcuCountGo">去清册</button>`;
      }
      const btn = $("#homeIcuCountGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("icu");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割缺备注温和角标 */
  async function ensureLegacyMissingNotesBadges() {
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
      const notes = String(it.notes || "").trim();
      let badge = el.querySelector(".lg-missing-notes");
      if (notes) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag lg-missing-notes";
        badge.textContent = "待补备注";
        el.appendChild(badge);
      }
    });
  }

  /* 3 · 备忘可见性一键复制 */
  async function ensureAssetVisibilityCopyButtons() {
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
      const label = visLabel(it.visibility || el.dataset.visibility || "");
      el.dataset.visLabel = label;
      if (!label || el.querySelector(".as-copy-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-vis";
      btn.textContent = "复制可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visLabel || "");
        softBanner(ok ? "已复制可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔小时数 */
  async function ensureCheckinIntervalHoursCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursCopyCard";
      card.className = "checkin-interval-hours-copy";
      const hard = $("#checkinHardDueCopyCard");
      const gentle = $("#checkinGentleHintCopyCard");
      const combo = $("#checkinComboCopyCard");
      if (hard && hard.parentNode) hard.insertAdjacentElement("afterend", card);
      else if (gentle && gentle.parentNode)
        gentle.insertAdjacentElement("afterend", card);
      else if (combo && combo.parentNode) combo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = Number((st.user || {}).checkin_interval_hours);
      const line = !Number.isNaN(hours)
        ? "报备间隔 " + hours + " 小时（电子继承 · 演示说明，不改外呼流程）"
        : "报备间隔暂不可用";
      card.innerHTML = `<p class="muted checkin-interval-hours-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursCopyBtn"${
          Number.isNaN(hours) ? " disabled" : ""
        }>复制间隔小时数</button>`;
      const btn = $("#checkinIntervalHoursCopyBtn");
      if (btn && !Number.isNaN(hours)) {
        btn.onclick = async () => {
          const ok = await copyText(String(hours));
          softBanner(ok ? "已复制间隔小时数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备间隔暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近一笔金额一键复制 */
  async function ensureTravelLatestAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLatestAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLatestAmountCopyCard";
      card.className = "travel-latest-amount-copy";
      const kind = $("#travelKindLabelCopyCard");
      const note = $("#travelLatestNoteCopyCard");
      const upd = $("#travelUpdatedAtCopyCard");
      if (kind && kind.parentNode) kind.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (upd && upd.parentNode) upd.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      const latest = ledger[0];
      const amt = latest && latest.amount != null ? fmtMoneyAmt(latest.amount) : "";
      const line = amt ? "最近流水金额 · " + amt : "暂无流水金额";
      card.innerHTML = `<p class="muted travel-latest-amount-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelLatestAmountCopyBtn"${
          amt ? "" : " disabled"
        }>复制最近金额</button>`;
      const btn = $("#travelLatestAmountCopyBtn");
      if (btn && amt) {
        btn.onclick = async () => {
          const ok = await copyText(amt);
          softBanner(ok ? "已复制最近流水金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近流水金额暂不可用</p>`;
    }
  }

  /* 6 · 善后工单编号一键复制 */
  async function ensureAftercareIdCopyButtons() {
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
      if (!it || it.id == null) return;
      el.dataset.id = String(it.id);
      if (el.querySelector(".ac-copy-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.id || String(it.id));
        softBanner(ok ? "已复制善后编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效备注一键复制 */
  async function ensureAuthActiveNoteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveNoteCopyCard";
      card.className = "av-active-note-copy";
      const prog = $("#avProgressCopyCard");
      const active = $("#avActiveIdCopyCard");
      const complete = $("#avCompleteLabelCopyCard");
      if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const active = st.current_active || st.latest || {};
      const note = String(active.note || "").trim();
      const line = note || "生效视频暂无备注";
      card.innerHTML = `<p class="muted av-active-note-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avActiveNoteCopyBtn"${
          note ? "" : " disabled"
        }>复制生效备注</button>`;
      const btn = $("#avActiveNoteCopyBtn");
      if (btn && note) {
        btn.onclick = async () => {
          const ok = await copyText(note);
          softBanner(ok ? "已复制生效备注" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效备注暂不可用</p>`;
    }
  }

  /* 8 · 受益人缺备注温和角标 */
  async function ensureHeirMissingNoteBadges() {
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
      const note = String(it.note || "").trim();
      let badge = el.querySelector(".bn-missing-note");
      if (note) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag bn-missing-note";
        badge.textContent = "待补备注";
        el.appendChild(badge);
      }
    });
  }

  /* 9 · 手册品牌名一键复制 */
  async function ensureHandoverBrandOnlyCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandOnlyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandOnlyCopyCard";
      card.className = "hand-brand-only-copy";
      const items = $("#handItemCountCopyCard");
      const bene = $("#handBeneCountCopyCard");
      const brand = $("#handBrandCopyCard");
      if (items && items.parentNode) items.insertAdjacentElement("afterend", card);
      else if (bene && bene.parentNode) bene.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode) brand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "E-Inherit 交割手册";
      card.innerHTML = `<p class="muted hand-brand-only-copy-line">${esc(brand)}</p>
        <button type="button" class="btn ghost sm" id="handBrandOnlyCopyBtn">复制手册品牌名</button>`;
      const btn = $("#handBrandOnlyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(brand);
          softBanner(ok ? "已复制手册品牌名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册品牌名暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制英文品牌+版本 + round 层含 40 */
  async function paintEnBrandVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#enBrandVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "enBrandVersionCopyCard";
      card.className = "card en-brand-version-copy-card";
      const ready = $("#serviceReadyCopyCard");
      const align = $("#exportAlignCopyCard");
      const slogan = $("#sloganCopyCard");
      const roundList = $("#roundLayerListCard");
      if (ready && ready.parentNode) ready.insertAdjacentElement("beforebegin", card);
      else if (align && align.parentNode) align.insertAdjacentElement("beforebegin", card);
      else if (slogan && slogan.parentNode)
        slogan.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const en = h.brand_en || "E-Inherit";
      const ver = h.version || "0.5.0";
      const line = en + " · v" + ver;
      card.innerHTML = `<h3>英文品牌与版本</h3>
        <p class="muted">一键复制英文品牌 + 版本号（演示级）。</p>
        <p class="en-brand-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="enBrandVersionCopyBtn">复制英文品牌与版本</button>`;
      const btn = $("#enBrandVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌与版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌与版本</h3><p class="muted">品牌版本暂不可用</p>`;
    }
  }

  function paintRoundLayerList40() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 40;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 40); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round40 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeIcuCount().catch(() => {}), 230);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyMissingNotesBadges().catch(() => {}), 140);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetVisibilityCopyButtons().catch(() => {}), 140);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinIntervalHoursCopy().catch(() => {}), 130);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLatestAmountCopy().catch(() => {}), 150);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareIdCopyButtons().catch(() => {}), 140);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveNoteCopy().catch(() => {}), 110);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirMissingNoteBadges().catch(() => {}), 140);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBrandOnlyCopy().catch(() => {}), 150);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeIcuCount().catch(() => {}), 230);
    if (id === "legacy")
      setTimeout(() => ensureLegacyMissingNotesBadges().catch(() => {}), 160);
    if (id === "assets")
      setTimeout(() => ensureAssetVisibilityCopyButtons().catch(() => {}), 150);
    if (id === "checkin")
      setTimeout(() => ensureCheckinIntervalHoursCopy().catch(() => {}), 150);
    if (id === "travel")
      setTimeout(() => ensureTravelLatestAmountCopy().catch(() => {}), 170);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareIdCopyButtons().catch(() => {}), 160);
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveNoteCopy().catch(() => {}), 130);
    if (id === "heirs")
      setTimeout(() => ensureHeirMissingNoteBadges().catch(() => {}), 150);
    if (id === "handover")
      setTimeout(() => ensureHandoverBrandOnlyCopy().catch(() => {}), 160);
    if (id === "settings") {
      setTimeout(() => {
        paintEnBrandVersionCopyCard().catch(() => {});
        paintRoundLayerList40();
      }, 200);
      setTimeout(() => {
        paintEnBrandVersionCopyCard().catch(() => {});
        paintRoundLayerList40();
      }, 580);
    }
  };

  // Boot
  setTimeout(() => paintHomeIcuCount().catch(() => {}), 290);
  setTimeout(() => ensureLegacyMissingNotesBadges().catch(() => {}), 310);
  setTimeout(() => ensureAssetVisibilityCopyButtons().catch(() => {}), 330);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLatestAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveNoteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirMissingNoteBadges().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandOnlyCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintEnBrandVersionCopyCard().catch(() => {});
      paintRoundLayerList40();
    }, 220);
  }
})();
