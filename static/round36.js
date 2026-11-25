/* 电子继承 · 第三十六批增量（叠在 round35…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round36SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页快照份数一句 */
  async function paintHomeSnapshotCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeSnapshotCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeSnapshotCountBar";
      bar.className = "home-snapshot-count-bar";
      bar.setAttribute("role", "status");
      const hand = $("#homeHandProgressBar");
      const tf = $("#homeTravelThresholdBar");
      const mb = $("#homeMemberStatusBar");
      if (hand && hand.parentNode === home) hand.insertAdjacentElement("afterend", bar);
      else if (tf && tf.parentNode === home) tf.insertAdjacentElement("afterend", bar);
      else if (mb && mb.parentNode === home) mb.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/snapshots").catch(() => ({ items: [] }));
      const n = (data.items || []).length;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-snap-mark">手册快照</span>
          <span class="muted home-snap-sub">可先存一份 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeSnapGo">去手册</button>`;
      } else {
        bar.innerHTML = `<span class="home-snap-mark">手册快照</span>
          <span class="muted home-snap-sub">历史共 ${n} 份 · 可随时再存</span>
          <button type="button" class="btn ghost sm" id="homeSnapGo">去手册</button>`;
      }
      const btn = $("#homeSnapGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割缺接收人温和角标 */
  async function ensureLegacyMissingBeneBadges() {
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
      let badge = el.querySelector(".lg-missing-bene");
      if (bene) {
        if (badge) badge.remove();
        return;
      }
      if (!it) return;
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "tag lg-missing-bene";
        badge.textContent = "待补接收人";
        el.appendChild(badge);
      }
    });
  }

  /* 3 · 备忘草稿/正式状态一键复制 */
  async function ensureAssetDraftStatusCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim();
      const isDraft =
        it.draft === true || it.draft === 1 || it.draft === "1" || !dispose;
      const label = isDraft ? "草稿" : "正式";
      el.dataset.draftStatus = label;
      if (el.querySelector(".as-copy-draft-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-draft-status";
      btn.textContent = "复制状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.draftStatus || "");
        softBanner(ok ? "已复制备忘状态" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制登记手机号 */
  async function ensureCheckinPhoneCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinPhoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinPhoneCopyCard";
      card.className = "checkin-phone-copy";
      const days = $("#checkinMemberDaysCopyCard");
      const lastNext = $("#checkinLastNextCopyCard");
      const due = $("#checkinDueCopyCard");
      if (days && days.parentNode) days.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode) due.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const phone = String((st.user || {}).phone || "").trim();
      const line = phone
        ? "登记手机 · " + phone + "（电子继承 · 演示）"
        : "尚未登记手机号";
      card.innerHTML = `<p class="muted checkin-phone-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinPhoneCopyBtn"${
          phone ? "" : " disabled"
        }>复制登记手机号</button>`;
      const btn = $("#checkinPhoneCopyBtn");
      if (btn && phone) {
        btn.onclick = async () => {
          const ok = await copyText(phone);
          softBanner(ok ? "已复制登记手机号" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">登记手机号暂不可用</p>`;
    }
  }

  /* 5 · 差旅还差金额一键复制 */
  async function ensureTravelShortfallCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallCopyCard";
      card.className = "travel-shortfall-copy";
      const prog = $("#travelProgressCopyCard");
      const balNum = $("#travelBalanceNumCopyCard");
      const amt = $("#travelThresholdAmtCopyCard");
      if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else if (balNum && balNum.parentNode)
        balNum.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const bal = Number(fund.balance || 0);
      let shortfall = Number(
        fund.shortfall != null ? fund.shortfall : Math.max(0, thr - bal)
      );
      if (fund.meets_threshold || fund.met) shortfall = 0;
      const line =
        shortfall > 0
          ? "差旅还差 ¥" + Math.ceil(shortfall) + "（电子继承 · 演示）"
          : "差旅已无需补足（电子继承 · 演示）";
      card.innerHTML = `<p class="muted travel-shortfall-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallCopyBtn">复制还差金额</button>`;
      const btn = $("#travelShortfallCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制还差金额说明" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">还差金额暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段标签一键复制 */
  async function ensureAftercarePhaseCopyButtons() {
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
      const phase = String(it.phase_label || it.phase_key || "").trim();
      el.dataset.phaseLabel = phase;
      if (!phase) {
        const old = el.querySelector(".ac-copy-phase");
        if (old) old.remove();
        return;
      }
      if (el.querySelector(".ac-copy-phase")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase";
      btn.textContent = "复制阶段";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseLabel || "");
        softBanner(ok ? "已复制善后阶段" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完整度说明一键复制 */
  async function ensureAuthCompleteLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteLabelCopyCard";
      card.className = "av-complete-label-copy";
      const titles = $("#avScriptTitlesCopyCard");
      const ready = $("#avReadyCopyCard");
      const miss = $("#avMissingCopyCard");
      if (titles && titles.parentNode) titles.insertAdjacentElement("afterend", card);
      else if (ready && ready.parentNode) ready.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode) miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const line =
        String(st.complete_label || "").trim() ||
        (st.ready || st.complete
          ? "三项齐备，可提交善后工单"
          : "授权视频尚未齐备，可按自己节奏补录");
      card.innerHTML = `<p class="muted av-complete-label-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avCompleteLabelCopyBtn">复制完整度说明</button>`;
      const btn = $("#avCompleteLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制完整度说明" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完整度说明暂不可用</p>`;
    }
  }

  /* 8 · 受益人备注一键复制 */
  async function ensureHeirNoteCopyButtons() {
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
      el.dataset.note = note;
      let btn = el.querySelector(".bn-copy-note");
      if (!note) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-note";
      btn.textContent = "复制备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.note || "");
        softBanner(ok ? "已复制受益人备注" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册分享提示一键复制 */
  async function ensureHandoverShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handShareHintCopyCard";
      card.className = "hand-share-hint-copy";
      const gen = $("#handGeneratedAtCopyCard");
      const execDom = $("#handExecutorDomainCopyCard");
      const exportPath = $("#handExportPathCopyCard");
      if (gen && gen.parentNode) gen.insertAdjacentElement("afterend", card);
      else if (execDom && execDom.parentNode)
        execDom.insertAdjacentElement("afterend", card);
      else if (exportPath && exportPath.parentNode)
        exportPath.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const hint =
        String(data.share_hint || "").trim() ||
        "仅执行人持有，勿转发至群聊或公开渠道。";
      card.innerHTML = `<p class="muted hand-share-hint-copy-line">${esc(hint)}</p>
        <button type="button" class="btn ghost sm" id="handShareHintCopyBtn">复制分享提示</button>`;
      const btn = $("#handShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制分享提示" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制中文品牌+域名 + round 层含 36 */
  async function paintZhBrandDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#zhBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "zhBrandDomainCopyCard";
      card.className = "card zh-brand-domain-copy-card";
      const legal = $("#legalEntityCopyCard");
      const sv = $("#serverVersionCopyCard");
      const zhEn = $("#zhEnBrandCopyCard");
      const roundList = $("#roundLayerListCard");
      if (legal && legal.parentNode) legal.insertAdjacentElement("beforebegin", card);
      else if (sv && sv.parentNode) sv.insertAdjacentElement("beforebegin", card);
      else if (zhEn && zhEn.parentNode) zhEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const app = h.app || "电子继承 App";
      const domain = h.domain || "einherit.cn";
      const line = app + " · " + domain;
      card.innerHTML = `<h3>中文品牌与域名</h3>
        <p class="muted">一键复制中文品牌 + 域名（演示级）。</p>
        <p class="zh-brand-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="zhBrandDomainCopyBtn">复制中文品牌与域名</button>`;
      const btn = $("#zhBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制中文品牌与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌与域名</h3><p class="muted">品牌信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList36() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 36;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 36); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round36 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeSnapshotCount().catch(() => {}), 190);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyMissingBeneBadges().catch(() => {}), 100);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDraftStatusCopyButtons().catch(() => {}), 100);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinPhoneCopy().catch(() => {}), 90);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallCopy().catch(() => {}), 110);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercarePhaseCopyButtons().catch(() => {}), 100);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthCompleteLabelCopy().catch(() => {}), 70);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNoteCopyButtons().catch(() => {}), 100);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverShareHintCopy().catch(() => {}), 110);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeSnapshotCount().catch(() => {}), 190);
    if (id === "legacy")
      setTimeout(() => ensureLegacyMissingBeneBadges().catch(() => {}), 120);
    if (id === "assets")
      setTimeout(() => ensureAssetDraftStatusCopyButtons().catch(() => {}), 110);
    if (id === "checkin") setTimeout(() => ensureCheckinPhoneCopy().catch(() => {}), 110);
    if (id === "travel") setTimeout(() => ensureTravelShortfallCopy().catch(() => {}), 130);
    if (id === "aftercare")
      setTimeout(() => ensureAftercarePhaseCopyButtons().catch(() => {}), 120);
    if (id === "authvideo")
      setTimeout(() => ensureAuthCompleteLabelCopy().catch(() => {}), 90);
    if (id === "heirs") setTimeout(() => ensureHeirNoteCopyButtons().catch(() => {}), 110);
    if (id === "handover")
      setTimeout(() => ensureHandoverShareHintCopy().catch(() => {}), 120);
    if (id === "settings") {
      setTimeout(() => {
        paintZhBrandDomainCopyCard().catch(() => {});
        paintRoundLayerList36();
      }, 160);
      setTimeout(() => {
        paintZhBrandDomainCopyCard().catch(() => {});
        paintRoundLayerList36();
      }, 500);
    }
  };

  // Boot
  setTimeout(() => paintHomeSnapshotCount().catch(() => {}), 250);
  setTimeout(() => ensureLegacyMissingBeneBadges().catch(() => {}), 270);
  setTimeout(() => ensureAssetDraftStatusCopyButtons().catch(() => {}), 290);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinPhoneCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNoteCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintZhBrandDomainCopyCard().catch(() => {});
      paintRoundLayerList36();
    }, 180);
  }
})();
