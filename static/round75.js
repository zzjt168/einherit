/* 电子继承 · 第七十五批增量（叠在 round74…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round75SoftBanner_" + (hostId || "home");
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

  function yn(v) {
    return truthyFlag(v) ? "是" : "否";
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

  /* 1 · 首页宽限期内冷静条 */
  async function paintHomeInGrace() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeInGraceBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeInGraceBar";
      bar.className = "home-in-grace-bar";
      bar.setAttribute("role", "status");
      const interval = $("#homeIntervalHoursBar");
      const grace = $("#homeGraceHoursBar");
      const member = $("#homeIsMemberDaysBar");
      if (interval && interval.parentNode === home)
        interval.insertAdjacentElement("afterend", bar);
      else if (grace && grace.parentNode === home)
        grace.insertAdjacentElement("afterend", bar);
      else if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const inGrace = yn((st.user || {}).checkin_in_grace);
      const sub = "宽限内 · " + inGrace;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-in-grace-mark">宽限内</span>
        <span class="muted home-in-grace-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeInGraceGo">去报备</button>`;
      const btn = $("#homeInGraceGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-in-grace-mark">宽限内</span>
        <span class="muted home-in-grace-sub">宽限状态暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeInGraceGo">去报备</button>`;
      const btn = $("#homeInGraceGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+备注+出厂重置组合复制 */
  async function ensureLegacyIdNotesFactoryCopyButtons() {
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
      if (!it || it.id == null) return;
      const notes = String(it.notes || "").trim() || "无备注";
      const factory = truthyFlag(it.factory_reset)
        ? "已勾出厂重置"
        : "未勾出厂重置";
      const line = "#" + it.id + " · " + notes + " · " + factory;
      el.dataset.idNotesFactory = line;
      if (el.querySelector(".lg-copy-id-notes-factory")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-notes-factory";
      btn.textContent = "复制编号备注出厂";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNotesFactory || "");
        softBanner(ok ? "已复制编号备注出厂" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+处置备注组合复制 */
  async function ensureAssetPlatformDisposeCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const line = platform + " · " + dispose;
      el.dataset.platformDispose = line;
      if (el.querySelector(".as-copy-platform-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-dispose";
      btn.textContent = "复制平台与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformDispose || "");
        softBanner(ok ? "已复制平台与处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限内布尔 */
  async function ensureCheckinInGracePlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinInGracePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinInGracePlainCopyCard";
      card.className = "checkin-in-grace-plain-copy";
      const interval = $("#checkinIntervalHoursPlainCopyCard");
      const grace = $("#checkinGraceHoursPlainCopyCard");
      const days = $("#checkinMemberDaysLeftPlainCopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const combo = "宽限内·" + yn((st.user || {}).checkin_in_grace);
      const line =
        "报备宽限状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-in-grace-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinInGracePlainCopyBtn">复制宽限内布尔</button>`;
      const btn = $("#checkinInGracePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制宽限内布尔" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限内状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近退款编号+种类组合复制 */
  async function ensureTravelRefundIdKindCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundIdKindCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundIdKindCopyCard";
      card.className = "travel-refund-id-kind-copy";
      const metPct = $("#travelMetProgressPctCopyCard");
      const prog = $("#travelProgressPctLabelCopyCard");
      const balThr = $("#travelBalanceThresholdPlainCopyCard");
      if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const refund = fund.last_refund || {};
      if (refund.id == null && !refund.kind) {
        card.innerHTML = `<p class="muted">退款编号与种类暂不可用</p>`;
        return;
      }
      const idPart = refund.id == null ? "—" : "#" + String(refund.id);
      const kind = String(refund.kind || "").trim() || "未填种类";
      const combo = idPart + " · " + kind;
      const line = "差旅退款编号 · 种类 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-refund-id-kind-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundIdKindCopyBtn">复制退款编号与种类</button>`;
      const btn = $("#travelRefundIdKindCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制退款编号与种类" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款编号与种类暂不可用</p>`;
    }
  }

  /* 6 · 善后到访偏好+预算组合复制 */
  async function ensureAftercareVisitBudgetCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim() || "未填到访偏好";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = pref + " · " + budget;
      el.dataset.visitBudget = line;
      if (el.querySelector(".ac-copy-visit-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-visit-budget";
      btn.textContent = "复制到访与预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visitBudget || "");
        softBanner(ok ? "已复制到访与预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项数与就绪布尔组合复制 */
  async function ensureAuthMissingCountReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCountReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCountReadyCopyCard";
      card.className = "av-missing-count-ready-copy";
      const script = $("#avScriptReadyCopyCard");
      const complete = $("#avCompleteLabelReadyCopyCard");
      const gate = $("#avGateLabelReadyCopyCard");
      if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = data.missing;
      const n = Array.isArray(missing)
        ? missing.length
        : Array.isArray(data.missing_labels)
        ? data.missing_labels.length
        : 0;
      const ready = yn(data.ready);
      const combo = "缺失·" + String(n) + " 项 · 就绪·" + ready;
      const line = "授权视频缺失 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-missing-count-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCountReadyCopyBtn">复制缺失数与就绪</button>`;
      const btn = $("#avMissingCountReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失数与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失数与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+角色组合复制 */
  async function ensureHeirIdRelationRoleCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const role = String(it.role || "").trim() || "未填角色";
      const line = "#" + it.id + " · " + relation + " · " + role;
      if (el.querySelector(".bn-copy-id-relation-role")) return;
      el.dataset.idRelationRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-role";
      btn.textContent = "复制编号关系角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationRole || "");
        softBanner(ok ? "已复制编号关系角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册执行人与品牌组合复制 */
  async function ensureHandoverExecutorBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExecutorBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExecutorBrandCopyCard";
      card.className = "hand-executor-brand-copy";
      const shareBrand = $("#handShareBrandCopyCard");
      const genBrand = $("#handGeneratedBrandCopyCard");
      const itemBrand = $("#handItemCountBrandCopyCard");
      if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const executor =
        String(data.executor || data.executor_name || "").trim() ||
        "未填执行人";
      const brand = String(data.brand || "").trim();
      const combo = brand ? executor + " · " + brand : executor;
      const line = "手册执行人 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-executor-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExecutorBrandCopyBtn">复制执行人与品牌</button>`;
      const btn = $("#handExecutorBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制执行人与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">执行人与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+就绪组合复制 + round 层含 75 */
  async function paintAppBrandOkR75CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appBrandOkR75CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appBrandOkR75CopyCard";
      card.className = "card app-brand-ok-r75-copy-card";
      const enVer = $("#brandEnVersionR74CopyCard");
      const verOk = $("#versionOkR73CopyCard");
      const okDom = $("#okDomainR72CopyCard");
      const roundList = $("#roundLayerListCard");
      if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · ok·" + okPart;
      card.innerHTML = `<h3>中文品牌与就绪</h3>
        <p class="muted">一键复制中文品牌与服务就绪（演示级）。</p>
        <p class="app-brand-ok-r75-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appBrandOkR75CopyBtn">复制应用品牌就绪</button>`;
      const btn = $("#appBrandOkR75CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用品牌就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌与就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList75() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 75;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 75); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round75 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeInGrace().catch(() => {}), 580);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdNotesFactoryCopyButtons().catch(() => {}),
      410
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformDisposeCopyButtons().catch(() => {}),
      410
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinInGracePlainCopy().catch(() => {}), 400);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundIdKindCopy().catch(() => {}), 420);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareVisitBudgetCopyButtons().catch(() => {}),
      410
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthMissingCountReadyCopy().catch(() => {}), 380);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationRoleCopyButtons().catch(() => {}),
      410
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExecutorBrandCopy().catch(() => {}), 420);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeInGrace().catch(() => {}), 580);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdNotesFactoryCopyButtons().catch(() => {}),
        430
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformDisposeCopyButtons().catch(() => {}),
        420
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinInGracePlainCopy().catch(() => {}), 420);
    if (id === "travel")
      setTimeout(() => ensureTravelRefundIdKindCopy().catch(() => {}), 440);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareVisitBudgetCopyButtons().catch(() => {}),
        430
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthMissingCountReadyCopy().catch(() => {}), 400);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationRoleCopyButtons().catch(() => {}),
        420
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverExecutorBrandCopy().catch(() => {}), 430);
    if (id === "settings") {
      setTimeout(() => {
        paintAppBrandOkR75CopyCard().catch(() => {});
        paintRoundLayerList75();
      }, 470);
      setTimeout(() => {
        paintAppBrandOkR75CopyCard().catch(() => {});
        paintRoundLayerList75();
      }, 1050);
    }
  };

  setTimeout(() => paintHomeInGrace().catch(() => {}), 630);
  setTimeout(() => ensureLegacyIdNotesFactoryCopyButtons().catch(() => {}), 650);
  setTimeout(() => ensureAssetPlatformDisposeCopyButtons().catch(() => {}), 670);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinInGracePlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundIdKindCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareVisitBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCountReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExecutorBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppBrandOkR75CopyCard().catch(() => {});
      paintRoundLayerList75();
    }, 490);
  }
})();
