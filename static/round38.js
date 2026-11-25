/* 电子继承 · 第三十八批增量（叠在 round37…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round38SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页会员剩余天数一句 */
  async function paintHomeMemberDays() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberDaysBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberDaysBar";
      bar.className = "home-member-days-bar";
      bar.setAttribute("role", "status");
      const co = $("#homeCompanyProgressBar");
      const snap = $("#homeSnapshotCountBar");
      const mb = $("#homeMemberStatusBar");
      if (co && co.parentNode === home) co.insertAdjacentElement("afterend", bar);
      else if (snap && snap.parentNode === home) snap.insertAdjacentElement("afterend", bar);
      else if (mb && mb.parentNode === home) mb.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const u = st.user || {};
      bar.hidden = false;
      if (!u.is_member) {
        bar.innerHTML = `<span class="home-md-mark">会员</span>
          <span class="muted home-md-sub">未开通 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeMemberDaysGo">去会员</button>`;
      } else {
        const days = u.member_days_left != null ? Math.max(0, Math.floor(Number(u.member_days_left))) : null;
        const sub =
          days != null && !Number.isNaN(days)
            ? "还剩约 " + days + " 天 · 续费可按自己节奏"
            : "已开通 · 剩余天数暂不可用";
        bar.innerHTML = `<span class="home-md-mark">会员</span>
          <span class="muted home-md-sub">${esc(sub)}</span>
          <button type="button" class="btn ghost sm" id="homeMemberDaysGo">去会员</button>`;
      }
      const btn = $("#homeMemberDaysGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("member");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割条目编号一键复制 */
  async function ensureLegacyIdCopyButtons() {
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
      const id = it && it.id != null ? String(it.id) : el.dataset.id || "";
      if (!id || el.querySelector(".lg-copy-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.id || id);
        softBanner(ok ? "已复制交割编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘账号提示一键复制 */
  async function ensureAssetHintCopyButtons() {
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
      const hint = it ? String(it.account_hint || "").trim() : "";
      if (it) el.dataset.accountHint = hint;
      let btn = el.querySelector(".as-copy-hint");
      if (!hint) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint";
      btn.textContent = "复制账号提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.accountHint || "");
        softBanner(ok ? "已复制账号提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员温柔提示 */
  async function ensureCheckinGentleHintCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGentleHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGentleHintCopyCard";
      card.className = "checkin-gentle-hint-copy";
      const name = $("#checkinNameCopyCard");
      const phone = $("#checkinPhoneCopyCard");
      const days = $("#checkinMemberDaysCopyCard");
      if (name && name.parentNode) name.insertAdjacentElement("afterend", card);
      else if (phone && phone.parentNode) phone.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode) days.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hint = String((st.user || {}).member_gentle_hint || "").trim();
      const line = hint || "会员提示暂不可用（演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-gentle-hint-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinGentleHintCopyBtn"${
          hint ? "" : " disabled"
        }>复制会员温柔提示</button>`;
      const btn = $("#checkinGentleHintCopyBtn");
      if (btn && hint) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制会员温柔提示" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员温柔提示暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近一笔流水备注一键复制 */
  async function ensureTravelLatestNoteCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLatestNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLatestNoteCopyCard";
      card.className = "travel-latest-note-copy";
      const upd = $("#travelUpdatedAtCopyCard");
      const shortfall = $("#travelShortfallCopyCard");
      const prog = $("#travelProgressCopyCard");
      if (upd && upd.parentNode) upd.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      const note = ledger.length ? String(ledger[0].note || "").trim() : "";
      const line = note || "暂无流水备注";
      card.innerHTML = `<p class="muted travel-latest-note-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelLatestNoteCopyBtn"${
          note ? "" : " disabled"
        }>复制最近流水备注</button>`;
      const btn = $("#travelLatestNoteCopyBtn");
      if (btn && note) {
        btn.onclick = async () => {
          const ok = await copyText(note);
          softBanner(ok ? "已复制最近流水备注" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水备注暂不可用</p>`;
    }
  }

  /* 6 · 善后上门偏好一键复制 */
  async function ensureAftercareVisitPrefCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim();
      el.dataset.visitPref = pref;
      let btn = el.querySelector(".ac-copy-visit");
      if (!pref) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit";
      btn.textContent = "复制上门偏好";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitPref || "");
        softBanner(ok ? "已复制上门偏好" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频当前生效编号一键复制 */
  async function ensureAuthActiveIdCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveIdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveIdCopyCard";
      card.className = "av-active-id-copy";
      const vis = $("#avVisibleCountBar");
      const complete = $("#avCompleteLabelCopyCard");
      const titles = $("#avScriptTitlesCopyCard");
      if (vis && vis.parentNode) vis.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (titles && titles.parentNode)
        titles.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const id =
        st.current_active_id != null
          ? String(st.current_active_id)
          : st.current_active && st.current_active.id != null
            ? String(st.current_active.id)
            : "";
      const line = id
        ? "当前生效视频编号 · " + id + "（电子继承 · 演示）"
        : "暂无生效视频编号";
      card.innerHTML = `<p class="muted av-active-id-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avActiveIdCopyBtn"${
          id ? "" : " disabled"
        }>复制生效编号</button>`;
      const btn = $("#avActiveIdCopyBtn");
      if (btn && id) {
        btn.onclick = async () => {
          const ok = await copyText(id);
          softBanner(ok ? "已复制生效编号" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效编号暂不可用</p>`;
    }
  }

  /* 8 · 受益人当前可见条数回显 */
  function paintHeirsVisibleCount() {
    const box = $("#heirsBox");
    if (!box) return;
    let bar = $("#bnVisibleCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "bnVisibleCountBar";
      bar.className = "muted bn-visible-count";
      bar.setAttribute("role", "status");
      const card = box.querySelector(".card");
      if (card) {
        const list = card.querySelector(".list");
        if (list) list.insertAdjacentElement("beforebegin", bar);
        else card.insertBefore(bar, card.firstChild);
      } else {
        box.insertBefore(bar, box.firstChild);
      }
    }
    const n = $$("#heirsBox .item")
      .filter((el) => el.querySelector("strong") && !el.hidden).length;
    bar.textContent = "当前可见 " + n + " 位 · 只读";
  }

  function bindHeirsVisibleCountObserver() {
    const box = $("#heirsBox");
    if (!box || box._r38VisObs) return;
    const obs = new MutationObserver(() => paintHeirsVisibleCount());
    obs.observe(box, { childList: true, subtree: true, attributes: true });
    box._r38VisObs = obs;
  }

  /* 9 · 手册受益人人数一键复制 */
  async function ensureHandoverBeneCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBeneCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBeneCountCopyCard";
      card.className = "hand-bene-count-copy";
      const note = $("#handNoteCopyCard");
      const share = $("#handShareHintCopyCard");
      const gen = $("#handGeneratedAtCopyCard");
      if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (share && share.parentNode) share.insertAdjacentElement("afterend", card);
      else if (gen && gen.parentNode) gen.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const n =
        data.beneficiary_count != null
          ? Number(data.beneficiary_count)
          : (data.heirs || []).length;
      const line = "手册受益人 " + (Number.isNaN(n) ? 0 : n) + " 位（电子继承 · 演示）";
      card.innerHTML = `<p class="muted hand-bene-count-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handBeneCountCopyBtn">复制受益人人数</button>`;
      const btn = $("#handBeneCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制手册受益人人数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">受益人人数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制手册对齐说明 + round 层含 38 */
  async function paintExportAlignCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#exportAlignCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "exportAlignCopyCard";
      card.className = "card export-align-copy-card";
      const slogan = $("#sloganCopyCard");
      const zh = $("#zhBrandDomainCopyCard");
      const legal = $("#legalEntityCopyCard");
      const roundList = $("#roundLayerListCard");
      if (slogan && slogan.parentNode) slogan.insertAdjacentElement("beforebegin", card);
      else if (zh && zh.parentNode) zh.insertAdjacentElement("beforebegin", card);
      else if (legal && legal.parentNode) legal.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const data = await api("/api/handover");
      const line =
        String(data.export_align_note || "").trim() ||
        "手册条目与导出页对齐说明暂不可用";
      card.innerHTML = `<h3>手册对齐说明</h3>
        <p class="muted">一键复制手册与导出对齐说明（演示级）。</p>
        <p class="export-align-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="exportAlignCopyBtn">复制对齐说明</button>`;
      const btn = $("#exportAlignCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制手册对齐说明" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>手册对齐说明</h3><p class="muted">对齐说明暂不可用</p>`;
    }
  }

  function paintRoundLayerList38() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 38;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 38); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round38 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMemberDays().catch(() => {}), 210);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdCopyButtons().catch(() => {}), 120);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetHintCopyButtons().catch(() => {}), 120);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinGentleHintCopy().catch(() => {}), 110);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLatestNoteCopy().catch(() => {}), 130);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareVisitPrefCopyButtons().catch(() => {}), 120);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveIdCopy().catch(() => {}), 90);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => {
      bindHeirsVisibleCountObserver();
      paintHeirsVisibleCount();
    }, 120);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBeneCountCopy().catch(() => {}), 130);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeMemberDays().catch(() => {}), 210);
    if (id === "legacy") setTimeout(() => ensureLegacyIdCopyButtons().catch(() => {}), 140);
    if (id === "assets") setTimeout(() => ensureAssetHintCopyButtons().catch(() => {}), 130);
    if (id === "checkin")
      setTimeout(() => ensureCheckinGentleHintCopy().catch(() => {}), 130);
    if (id === "travel") setTimeout(() => ensureTravelLatestNoteCopy().catch(() => {}), 150);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareVisitPrefCopyButtons().catch(() => {}), 140);
    if (id === "authvideo") setTimeout(() => ensureAuthActiveIdCopy().catch(() => {}), 110);
    if (id === "heirs") {
      setTimeout(() => {
        bindHeirsVisibleCountObserver();
        paintHeirsVisibleCount();
      }, 130);
    }
    if (id === "handover")
      setTimeout(() => ensureHandoverBeneCountCopy().catch(() => {}), 140);
    if (id === "settings") {
      setTimeout(() => {
        paintExportAlignCopyCard().catch(() => {});
        paintRoundLayerList38();
      }, 180);
      setTimeout(() => {
        paintExportAlignCopyCard().catch(() => {});
        paintRoundLayerList38();
      }, 540);
    }
  };

  // Boot
  setTimeout(() => paintHomeMemberDays().catch(() => {}), 270);
  setTimeout(() => ensureLegacyIdCopyButtons().catch(() => {}), 290);
  setTimeout(() => ensureAssetHintCopyButtons().catch(() => {}), 310);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGentleHintCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLatestNoteCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitPrefCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveIdCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    bindHeirsVisibleCountObserver();
    paintHeirsVisibleCount();
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBeneCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintExportAlignCopyCard().catch(() => {});
      paintRoundLayerList38();
    }, 200);
  }
})();
