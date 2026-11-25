/* 电子继承 · 第七十七批增量（叠在 round76…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round77SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页用户姓名冷静条 */
  async function paintHomeName() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeNameBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeNameBar";
      bar.className = "home-name-bar";
      bar.setAttribute("role", "status");
      const until = $("#homeMemberUntilBar");
      const inGrace = $("#homeInGraceBar");
      const interval = $("#homeIntervalHoursBar");
      if (until && until.parentNode === home)
        until.insertAdjacentElement("afterend", bar);
      else if (inGrace && inGrace.parentNode === home)
        inGrace.insertAdjacentElement("afterend", bar);
      else if (interval && interval.parentNode === home)
        interval.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const name = String((st.user || {}).name || "").trim() || "未填姓名";
      const sub = "姓名 · " + name;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-name-mark">姓名</span>
        <span class="muted home-name-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeNameGo">去报备</button>`;
      const btn = $("#homeNameGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-name-mark">姓名</span>
        <span class="muted home-name-sub">姓名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeNameGo">去报备</button>`;
      const btn = $("#homeNameGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+受益人+部门组合复制 */
  async function ensureLegacyIdBeneficiaryDeptCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + ben + " · " + dept;
      el.dataset.idBeneficiaryDept = line;
      if (el.querySelector(".lg-copy-id-beneficiary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-beneficiary-dept";
      btn.textContent = "复制编号受益人部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idBeneficiaryDept || "");
        softBanner(ok ? "已复制编号受益人部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘账号提示+标签+可见性组合复制 */
  async function ensureAssetHintTagVisCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const tag = String(it.tag || "").trim() || "无标签";
      const vis = visibilityLabel(it.visibility);
      const line = hint + " · " + tag + " · " + vis;
      el.dataset.hintTagVis = line;
      if (el.querySelector(".as-copy-hint-tag-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-tag-vis";
      btn.textContent = "复制账号提示标签可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintTagVis || "");
        softBanner(ok ? "已复制账号提示标签可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制倒计时剩余小时 */
  async function ensureCheckinHoursRemainingPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingPlainCopyCard";
      card.className = "checkin-hours-remaining-plain-copy";
      const hint = $("#checkinMemberGentleHintPlainCopyCard");
      const inGrace = $("#checkinInGracePlainCopyCard");
      const interval = $("#checkinIntervalHoursPlainCopyCard");
      if (hint && hint.parentNode)
        hint.insertAdjacentElement("afterend", card);
      else if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = (st.countdown || {}).hours_remaining;
      if (hours == null) {
        card.innerHTML = `<p class="muted">倒计时剩余小时暂不可用</p>`;
        return;
      }
      const combo = String(Math.round(Number(hours) * 100) / 100);
      const line =
        "倒计时剩余小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingPlainCopyBtn">复制倒计时剩余小时</button>`;
      const btn = $("#checkinHoursRemainingPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制倒计时剩余小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">倒计时剩余小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近退款金额+种类组合复制 */
  async function ensureTravelRefundAmountKindCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundAmountKindCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundAmountKindCopyCard";
      card.className = "travel-refund-amount-kind-copy";
      const ledger = $("#travelLedgerIdAmountCopyCard");
      const refund = $("#travelRefundIdKindCopyCard");
      const metPct = $("#travelMetProgressPctCopyCard");
      if (ledger && ledger.parentNode)
        ledger.insertAdjacentElement("afterend", card);
      else if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
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
      const refund = fund.last_refund || {};
      if (refund.amount == null && !refund.kind) {
        card.innerHTML = `<p class="muted">退款金额与种类暂不可用</p>`;
        return;
      }
      const amtPart =
        refund.amount == null
          ? "—"
          : String(Math.round(Number(refund.amount)));
      const kind = String(refund.kind || "").trim() || "未填种类";
      const combo = amtPart + " · " + kind;
      const line = "差旅退款金额 · 种类 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-refund-amount-kind-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundAmountKindCopyBtn">复制退款金额与种类</button>`;
      const btn = $("#travelRefundAmountKindCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制退款金额与种类" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款金额与种类暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+到访偏好+城市组合复制 */
  async function ensureAftercareIdVisitCityCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim() || "未填到访偏好";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + pref + " · " + city;
      el.dataset.idVisitCity = line;
      if (el.querySelector(".ac-copy-id-visit-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-visit-city";
      btn.textContent = "复制编号到访城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisitCity || "");
        softBanner(ok ? "已复制编号到访城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效标签与就绪布尔组合复制 */
  async function ensureAuthActiveLabelReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveLabelReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveLabelReadyCopyCard";
      card.className = "av-active-label-ready-copy";
      const checklist = $("#avChecklistCountReadyCopyCard");
      const missing = $("#avMissingCountReadyCopyCard");
      const script = $("#avScriptReadyCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const label =
        String(active.active_label || "").trim() || "无生效标签";
      const ready = yn(data.ready);
      const combo = label + " · 就绪·" + ready;
      const line = "授权视频生效 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-active-label-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avActiveLabelReadyCopyBtn">复制生效标签与就绪</button>`;
      const btn = $("#avActiveLabelReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生效标签与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效标签与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+编号+联系组合复制 */
  async function ensureHeirNameIdContactCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · #" + it.id + " · " + contact;
      if (el.querySelector(".bn-copy-name-id-contact")) return;
      el.dataset.nameIdContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-id-contact";
      btn.textContent = "复制姓名编号联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameIdContact || "");
        softBanner(ok ? "已复制姓名编号联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册会员状态与品牌组合复制 */
  async function ensureHandoverMemberBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handMemberBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handMemberBrandCopyCard";
      card.className = "hand-member-brand-copy";
      const pctDom = $("#handPctDomainCopyCard");
      const execBrand = $("#handExecutorBrandCopyCard");
      const shareBrand = $("#handShareBrandCopyCard");
      if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (execBrand && execBrand.parentNode)
        execBrand.insertAdjacentElement("afterend", card);
      else if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const memberPart = "会员·" + yn(data.member);
      const brand = String(data.brand || "").trim();
      const combo = brand ? memberPart + " · " + brand : memberPart;
      const line = "手册会员 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-member-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handMemberBrandCopyBtn">复制手册会员品牌</button>`;
      const btn = $("#handMemberBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册会员品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册会员与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用版本+域名组合复制 + round 层含 77 */
  async function paintAppVersionDomainR77CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appVersionDomainR77CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appVersionDomainR77CopyCard";
      card.className = "card app-version-domain-r77-copy-card";
      const serverEn = $("#serverBrandEnR76CopyCard");
      const appOk = $("#appBrandOkR75CopyCard");
      const enVer = $("#brandEnVersionR74CopyCard");
      const roundList = $("#roundLayerListCard");
      if (serverEn && serverEn.parentNode)
        serverEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · " + domain;
      card.innerHTML = `<h3>应用版本与域名</h3>
        <p class="muted">一键复制应用版本与域名（演示级）。</p>
        <p class="app-version-domain-r77-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appVersionDomainR77CopyBtn">复制应用版本域名</button>`;
      const btn = $("#appVersionDomainR77CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList77() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 77;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 77); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round77 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeName().catch(() => {}), 600);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdBeneficiaryDeptCopyButtons().catch(() => {}),
      430
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetHintTagVisCopyButtons().catch(() => {}), 430);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingPlainCopy().catch(() => {}),
      420
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundAmountKindCopy().catch(() => {}), 440);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdVisitCityCopyButtons().catch(() => {}),
      430
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveLabelReadyCopy().catch(() => {}), 400);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameIdContactCopyButtons().catch(() => {}),
      430
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverMemberBrandCopy().catch(() => {}), 440);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeName().catch(() => {}), 600);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdBeneficiaryDeptCopyButtons().catch(() => {}),
        450
      );
    if (id === "assets")
      setTimeout(() => ensureAssetHintTagVisCopyButtons().catch(() => {}), 440);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingPlainCopy().catch(() => {}),
        440
      );
    if (id === "travel")
      setTimeout(() => ensureTravelRefundAmountKindCopy().catch(() => {}), 460);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdVisitCityCopyButtons().catch(() => {}),
        450
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveLabelReadyCopy().catch(() => {}), 420);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameIdContactCopyButtons().catch(() => {}),
        440
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverMemberBrandCopy().catch(() => {}), 450);
    if (id === "settings") {
      setTimeout(() => {
        paintAppVersionDomainR77CopyCard().catch(() => {});
        paintRoundLayerList77();
      }, 490);
      setTimeout(() => {
        paintAppVersionDomainR77CopyCard().catch(() => {});
        paintRoundLayerList77();
      }, 1070);
    }
  };

  setTimeout(() => paintHomeName().catch(() => {}), 650);
  setTimeout(
    () => ensureLegacyIdBeneficiaryDeptCopyButtons().catch(() => {}),
    670
  );
  setTimeout(() => ensureAssetHintTagVisCopyButtons().catch(() => {}), 690);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundAmountKindCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdVisitCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveLabelReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameIdContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverMemberBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppVersionDomainR77CopyCard().catch(() => {});
      paintRoundLayerList77();
    }, 510);
  }
})();
