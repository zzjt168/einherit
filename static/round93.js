/* 电子继承 · 第九十三批增量（叠在 round92…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round93SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用就绪域名冷静条 */
  async function paintHomeAppOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppOkDomainCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppOkDomainCalmBar";
      bar.className = "home-app-ok-domain-calm-bar";
      bar.setAttribute("role", "status");
      const domVer = $("#homeDomainVersionCalmBar");
      const okEn = $("#homeOkBrandEnCalmBar");
      const appVer = $("#homeAppVersionCalmBar");
      if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = app + " · " + okPart + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-domain-calm-mark">概览</span>
        <span class="muted home-app-ok-domain-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppOkDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppOkDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-domain-calm-mark">概览</span>
        <span class="muted home-app-ok-domain-calm-sub">应用就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppOkDomainCalmGo">去设置</button>`;
      const btn = $("#homeAppOkDomainCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+处置+受益人组合复制 */
  async function ensureLegacyCategoryActionBeneficiaryCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const action = String(it.action || "").trim() || "未填处置";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = cat + " · " + action + " · " + ben;
      el.dataset.categoryActionBeneficiary = line;
      if (el.querySelector(".lg-copy-category-action-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-action-beneficiary";
      btn.textContent = "复制分类处置受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryActionBeneficiary || "");
        softBanner(ok ? "已复制分类处置受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+部门组合复制 */
  async function ensureAssetTagVisDeptCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const vis = visibilityLabel(it.visibility);
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = tag + " · " + vis + " · " + dept;
      el.dataset.tagVisDept = line;
      if (el.querySelector(".as-copy-tag-vis-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-vis-dept";
      btn.textContent = "复制标签可见部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisDept || "");
        softBanner(ok ? "已复制标签可见部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制可读说明文案 */
  async function ensureCheckinReadablePlainR93Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinReadablePlainR93CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinReadablePlainR93CopyCard";
      card.className = "checkin-readable-plain-r93-copy";
      const lastAgo = $("#checkinLastAgoPlainR92CopyCard");
      const hours = $("#checkinHoursRemainingPlainR91CopyCard");
      const due = $("#checkinDueSoonPlainR90CopyCard");
      if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const plain =
        String((st.countdown || {}).readable || "").trim() || "—";
      const line =
        "报备可读 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-readable-plain-r93-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinReadablePlainR93CopyBtn">复制可读说明文案</button>`;
      const btn = $("#checkinReadablePlainR93CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制可读说明文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">可读说明文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与门槛组合复制 */
  async function ensureTravelMetThresholdPlainR93Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetThresholdPlainR93CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetThresholdPlainR93CopyCard";
      card.className = "travel-met-threshold-plain-r93-copy";
      const pctThr = $("#travelProgressPctThresholdPlainCopyCard");
      const shortMet = $("#travelShortfallMetPlainCopyCard");
      const metPct = $("#travelMetProgressPctPlainCopyCard");
      if (pctThr && pctThr.parentNode)
        pctThr.insertAdjacentElement("afterend", card);
      else if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + thr;
      const line = "差旅达标 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-threshold-plain-r93-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetThresholdPlainR93CopyBtn">复制达标门槛文案</button>`;
      const btn = $("#travelMetThresholdPlainR93CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标门槛文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+阶段+备注组合复制 */
  async function ensureAftercareIdPhaseNotesCopyButtons() {
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
      const phase = String(it.phase || "").trim() || "未填阶段";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + phase + " · " + notes;
      el.dataset.idPhaseNotes = line;
      if (el.querySelector(".ac-copy-id-phase-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-phase-notes";
      btn.textContent = "复制编号阶段备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPhaseNotes || "");
        softBanner(ok ? "已复制编号阶段备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频进度与完成文案组合复制 */
  async function ensureAuthProgressCompleteLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressCompleteLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressCompleteLabelCopyCard";
      card.className = "av-progress-complete-label-copy";
      const gate = $("#avGateCompleteComboCopyCard");
      const miss = $("#avMissingLabelsCompleteCopyCard");
      const checklist = $("#avChecklistCompleteCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const label =
        String(data.complete_label || "").trim() ||
        (truthyFlag(data.complete) ? "已完成" : "未完成");
      const combo = done + "/" + total + " · " + label;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-progress-complete-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressCompleteLabelCopyBtn">复制进度完成文案</button>`;
      const btn = $("#avProgressCompleteLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成文案" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度与完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+姓名+关系组合复制 */
  async function ensureHeirContactNameRelationCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation")) return;
      el.dataset.contactNameRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation";
      btn.textContent = "复制联系姓名关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelation || "");
        softBanner(ok ? "已复制联系姓名关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径与分享提示组合复制 */
  async function ensureHandoverExportPathShareHintR93Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathShareHintR93CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathShareHintR93CopyCard";
      card.className = "hand-export-path-share-hint-r93-copy";
      const itemDom = $("#handItemCountDomainR92CopyCard");
      const pctShare = $("#handProgressPctShareHintCopyCard");
      const genBrand = $("#handGeneratedAtBrandCopyCard");
      if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else if (pctShare && pctShare.parentNode)
        pctShare.insertAdjacentElement("afterend", card);
      else if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "").trim() || "无导出路径";
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = path + " · " + hint;
      const line = "手册导出 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-export-path-share-hint-r93-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportPathShareHintR93CopyBtn">复制手册导出分享</button>`;
      const btn = $("#handExportPathShareHintR93CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册导出分享" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出路径与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+域名+英文品牌组合复制 + round 层含 93 */
  async function paintOkDomainBrandEnR93CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okDomainBrandEnR93CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okDomainBrandEnR93CopyCard";
      card.className = "card ok-domain-brand-en-r93-copy-card";
      const verDom = $("#versionDomainBrandEnR92CopyCard");
      const appDom = $("#appDomainBrandEnR91CopyCard");
      const domVer = $("#domainVersionOkR90CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = "ok·" + okPart + " · " + domain + " · " + en;
      card.innerHTML = `<h3>就绪 · 域名 · 英文品牌</h3>
        <p class="muted">一键复制就绪状态、域名与英文品牌（演示级）。</p>
        <p class="ok-domain-brand-en-r93-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okDomainBrandEnR93CopyBtn">复制就绪域名英文</button>`;
      const btn = $("#okDomainBrandEnR93CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList93() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 93;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 93); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round93 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 760);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyCategoryActionBeneficiaryCopyButtons().catch(() => {}),
      590
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetTagVisDeptCopyButtons().catch(() => {}), 590);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinReadablePlainR93Copy().catch(() => {}),
      580
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetThresholdPlainR93Copy().catch(() => {}),
      600
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdPhaseNotesCopyButtons().catch(() => {}),
      590
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthProgressCompleteLabelCopy().catch(() => {}),
      560
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
      590
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportPathShareHintR93Copy().catch(() => {}),
      600
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 760);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyCategoryActionBeneficiaryCopyButtons().catch(() => {}),
        610
      );
    if (id === "assets")
      setTimeout(() => ensureAssetTagVisDeptCopyButtons().catch(() => {}), 600);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinReadablePlainR93Copy().catch(() => {}),
        600
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetThresholdPlainR93Copy().catch(() => {}),
        620
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdPhaseNotesCopyButtons().catch(() => {}),
        610
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthProgressCompleteLabelCopy().catch(() => {}),
        580
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
        600
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportPathShareHintR93Copy().catch(() => {}),
        610
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainBrandEnR93CopyCard().catch(() => {});
        paintRoundLayerList93();
      }, 650);
      setTimeout(() => {
        paintOkDomainBrandEnR93CopyCard().catch(() => {});
        paintRoundLayerList93();
      }, 1330);
    }
  };

  setTimeout(() => paintHomeAppOkDomain().catch(() => {}), 810);
  setTimeout(
    () => ensureLegacyCategoryActionBeneficiaryCopyButtons().catch(() => {}),
    830
  );
  setTimeout(() => ensureAssetTagVisDeptCopyButtons().catch(() => {}), 850);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinReadablePlainR93Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetThresholdPlainR93Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdPhaseNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressCompleteLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathShareHintR93Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainBrandEnR93CopyCard().catch(() => {});
      paintRoundLayerList93();
    }, 670);
  }
})();
