/* 电子继承 · 第八十二批增量（叠在 round81…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round82SoftBanner_" + (hostId || "home");
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

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
  }

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
  }

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

  /* 1 · 首页英文品牌冷静条 */
  async function paintHomeEnglishBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeEnglishBrandBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeEnglishBrandBar";
      bar.className = "home-english-brand-bar";
      bar.setAttribute("role", "status");
      const domain = $("#homeDomainOnlyBar");
      const uid = $("#homeUserIdCalmBar");
      const brand = $("#homeBrandDomainBar");
      if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (uid && uid.parentNode === home)
        uid.insertAdjacentElement("afterend", bar);
      else if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      let en = "";
      try {
        const st = await api("/api/checkin/status");
        en = String((st.user || {}).brand_en || "").trim();
      } catch (_) {}
      if (!en) {
        const h = await api("/api/health");
        en = String(h.brand_en || "E-Inherit").trim();
      }
      const sub = "英文品牌 · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-english-brand-mark">品牌</span>
        <span class="muted home-english-brand-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeEnglishBrandGo">去设置</button>`;
      const btn = $("#homeEnglishBrandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-english-brand-mark">品牌</span>
        <span class="muted home-english-brand-sub">英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeEnglishBrandGo">去设置</button>`;
      const btn = $("#homeEnglishBrandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+分类+处置组合复制 */
  async function ensureLegacyNotesCategoryActionCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const cat = String(it.category || "").trim() || "未填分类";
      const action = String(it.action || "").trim() || "未填处置";
      const line = notes + " · " + cat + " · " + action;
      el.dataset.notesCategoryAction = line;
      if (el.querySelector(".lg-copy-notes-category-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-category-action";
      btn.textContent = "复制备注分类处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesCategoryAction || "");
        softBanner(ok ? "已复制备注分类处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签+可见性组合复制 */
  async function ensureAssetPlatformTagVisCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const tag = String(it.tag || "").trim() || "未填标签";
      const vis = visibilityLabel(it.visibility);
      const line = platform + " · " + tag + " · " + vis;
      el.dataset.platformTagVis = line;
      if (el.querySelector(".as-copy-platform-tag-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag-vis";
      btn.textContent = "复制平台标签可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTagVis || "");
        softBanner(ok ? "已复制平台标签可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议文案 */
  async function ensureCheckinNextSuggestedPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedPlainCopyCard";
      card.className = "checkin-next-suggested-plain-copy";
      const last = $("#checkinLastAgoLabelPlainCopyCard");
      const cd = $("#checkinCountdownLabelPlainCopyCard");
      const soft = $("#checkinSoftOverduePlainCopyCard");
      if (last && last.parentNode) last.insertAdjacentElement("afterend", card);
      else if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else if (soft && soft.parentNode)
        soft.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).next_suggested_label || "").trim() ||
        "暂无下次建议";
      const line =
        "下次建议 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedPlainCopyBtn">复制下次建议文案</button>`;
      const btn = $("#checkinNextSuggestedPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制下次建议文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差与门槛组合复制 */
  async function ensureTravelShortfallThresholdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdCopyCard";
      card.className = "travel-shortfall-threshold-copy";
      const metProg = $("#travelMetProgressLabelCopyCard");
      const pctMet = $("#travelProgressPctMetCopyCard");
      const metAmt = $("#travelMetThresholdAmountCopyCard");
      if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
      else if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (metAmt && metAmt.parentNode)
        metAmt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = short + " · " + thr;
      const line = "差旅短差 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdCopyBtn">复制短差与门槛</button>`;
      const btn = $("#travelShortfallThresholdCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差与门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差与门槛暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+阶段+城市组合复制 */
  async function ensureAftercareStatusPhaseCityCopyButtons() {
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
      if (!it) return;
      const status = String(it.status || "").trim() || "未填状态";
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const city = String(it.city || "").trim() || "未填城市";
      const line = status + " · " + phase + " · " + city;
      el.dataset.statusPhaseCity = line;
      if (el.querySelector(".ac-copy-status-phase-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-phase-city";
      btn.textContent = "复制状态阶段城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusPhaseCity || "");
        softBanner(ok ? "已复制状态阶段城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪与齐备文案组合复制 */
  async function ensureAuthReadyCompleteLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteLabelCopyCard";
      card.className = "av-ready-complete-label-copy";
      const gateReady = $("#avGateReadyComboCopyCard");
      const scriptReady = $("#avScriptCountReadyCopyCard");
      const prog = $("#avProgressDoneTotalCopyCard");
      if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (scriptReady && scriptReady.parentNode)
        scriptReady.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const complete =
        String(data.complete_label || "").trim() || "无齐备说明";
      const combo = ready + " · " + complete;
      const line = "授权视频就绪 · 齐备 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteLabelCopyBtn">复制就绪齐备文案</button>`;
      const btn = $("#avReadyCompleteLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪齐备文案" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪齐备文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+口令+角色组合复制 */
  async function ensureHeirRelationPassphraseRoleCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const line = relation + " · " + phrase + " · " + role;
      if (el.querySelector(".bn-copy-relation-passphrase-role")) return;
      el.dataset.relationPassphraseRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-passphrase-role";
      btn.textContent = "复制关系口令角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPassphraseRole || "");
        softBanner(ok ? "已复制关系口令角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比与品牌组合复制 */
  async function ensureHandoverProgressPctBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctBrandCopyCard";
      card.className = "hand-progress-pct-brand-copy";
      const exportBrand = $("#handExportPathBrandCopyCard");
      const shareDom = $("#handShareHintDomainCopyCard");
      const todoBrand = $("#handTodoCountBrandCopyCard");
      if (exportBrand && exportBrand.parentNode)
        exportBrand.insertAdjacentElement("afterend", card);
      else if (shareDom && shareDom.parentNode)
        shareDom.insertAdjacentElement("afterend", card);
      else if (todoBrand && todoBrand.parentNode)
        todoBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct =
        prog.pct == null ? "—" : String(Math.round(Number(prog.pct))) + "%";
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = pct + " · " + brand;
      const line = "手册进度 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctBrandCopyBtn">复制进度百分比品牌</button>`;
      const btn = $("#handProgressPctBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度百分比品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度百分比与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+版本+就绪组合复制 + round 层含 82 */
  async function paintBrandEnVersionOkR82CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnVersionOkR82CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnVersionOkR82CopyCard";
      card.className = "card brand-en-version-ok-r82-copy-card";
      const appOk = $("#appOkDomainR81CopyCard");
      const server = $("#serverVersionOkDomainR80CopyCard");
      const verOk = $("#versionOkDomainR79CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + ver + " · ok·" + okPart;
      card.innerHTML = `<h3>英文品牌 · 版本 · 就绪</h3>
        <p class="muted">一键复制英文品牌、版本与就绪状态（演示级）。</p>
        <p class="brand-en-version-ok-r82-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnVersionOkR82CopyBtn">复制英文版本就绪</button>`;
      const btn = $("#brandEnVersionOkR82CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList82() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 82;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 82); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round82 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeEnglishBrand().catch(() => {}), 650);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesCategoryActionCopyButtons().catch(() => {}),
      480
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagVisCopyButtons().catch(() => {}),
      480
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextSuggestedPlainCopy().catch(() => {}),
      470
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallThresholdCopy().catch(() => {}), 490);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusPhaseCityCopyButtons().catch(() => {}),
      480
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthReadyCompleteLabelCopy().catch(() => {}), 450);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPassphraseRoleCopyButtons().catch(() => {}),
      480
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverProgressPctBrandCopy().catch(() => {}), 490);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeEnglishBrand().catch(() => {}), 650);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesCategoryActionCopyButtons().catch(() => {}),
        500
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagVisCopyButtons().catch(() => {}),
        490
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextSuggestedPlainCopy().catch(() => {}),
        490
      );
    if (id === "travel")
      setTimeout(() => ensureTravelShortfallThresholdCopy().catch(() => {}), 510);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusPhaseCityCopyButtons().catch(() => {}),
        500
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthReadyCompleteLabelCopy().catch(() => {}), 470);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPassphraseRoleCopyButtons().catch(() => {}),
        490
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverProgressPctBrandCopy().catch(() => {}), 500);
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionOkR82CopyCard().catch(() => {});
        paintRoundLayerList82();
      }, 540);
      setTimeout(() => {
        paintBrandEnVersionOkR82CopyCard().catch(() => {});
        paintRoundLayerList82();
      }, 1160);
    }
  };

  setTimeout(() => paintHomeEnglishBrand().catch(() => {}), 700);
  setTimeout(
    () => ensureLegacyNotesCategoryActionCopyButtons().catch(() => {}),
    720
  );
  setTimeout(() => ensureAssetPlatformTagVisCopyButtons().catch(() => {}), 740);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusPhaseCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPassphraseRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionOkR82CopyCard().catch(() => {});
      paintRoundLayerList82();
    }, 560);
  }
})();
