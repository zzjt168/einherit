/* 电子继承 · 第七十二批增量（叠在 round71…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round72SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页会员身份与剩余天冷静条 */
  async function paintHomeIsMemberDays() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeIsMemberDaysBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeIsMemberDaysBar";
      bar.className = "home-is-member-days-bar";
      bar.setAttribute("role", "status");
      const phone = $("#homePhoneBar");
      const brand = $("#homeBrandAppBar");
      const exec = $("#homeExecutorNameBar");
      if (phone && phone.parentNode === home)
        phone.insertAdjacentElement("afterend", bar);
      else if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else if (exec && exec.parentNode === home)
        exec.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const u = st.user || {};
      const member = truthyFlag(u.is_member) ? "是" : "否";
      const days =
        u.member_days_left == null
          ? "—"
          : String(Math.round(Number(u.member_days_left)));
      const sub = "会员 · " + member + " · 剩余 " + days + " 天";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-is-member-days-mark">会员</span>
        <span class="muted home-is-member-days-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeIsMemberDaysGo">去报备</button>`;
      const btn = $("#homeIsMemberDaysGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-is-member-days-mark">会员</span>
        <span class="muted home-is-member-days-sub">会员信息暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeIsMemberDaysGo">去报备</button>`;
      const btn = $("#homeIsMemberDaysGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割分类+受益人组合复制 */
  async function ensureLegacyCategoryBeneficiaryCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = cat + " · " + ben;
      el.dataset.categoryBeneficiary = line;
      if (el.querySelector(".lg-copy-category-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-beneficiary";
      btn.textContent = "复制分类与受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryBeneficiary || "");
        softBanner(ok ? "已复制分类与受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+平台+标签组合复制 */
  async function ensureAssetIdPlatformTagCopyButtons() {
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
      if (!it || it.id == null) return;
      const platform = String(it.platform || "").trim() || "未填平台";
      const tag = String(it.tag || "").trim() || "无标签";
      const line = "#" + it.id + " · " + platform + " · " + tag;
      el.dataset.idPlatformTag = line;
      if (el.querySelector(".as-copy-id-platform-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-platform-tag";
      btn.textContent = "复制编号平台标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlatformTag || "");
        softBanner(ok ? "已复制编号平台标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员剩余天纯数字 */
  async function ensureCheckinMemberDaysLeftPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberDaysLeftPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberDaysLeftPlainCopyCard";
      card.className = "checkin-member-days-left-plain-copy";
      const ago = $("#checkinLastAgoPlainCopyCard");
      const phone = $("#checkinPhonePlainCopyCard");
      const softHard = $("#checkinSoftHardDueCopyCard");
      if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else if (softHard && softHard.parentNode)
        softHard.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const days = (st.user || {}).member_days_left;
      if (days == null) {
        card.innerHTML = `<p class="muted">会员剩余天暂不可用</p>`;
        return;
      }
      const combo = String(Math.round(Number(days)));
      const line =
        "会员剩余天 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-member-days-left-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberDaysLeftPlainCopyBtn">复制剩余会员天纯</button>`;
      const btn = $("#checkinMemberDaysLeftPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余会员天" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员剩余天暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与门槛组合复制 */
  async function ensureTravelBalanceThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdPlainCopyCard";
      card.className = "travel-balance-threshold-plain-copy";
      const shortfall = $("#travelShortfallMetCopyCard");
      const aftercare = $("#travelHasAftercareAmountCopyCard");
      const refund = $("#travelRefundKindNoteCopyCard");
      if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (aftercare && aftercare.parentNode)
        aftercare.insertAdjacentElement("afterend", card);
      else if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal = fund.balance;
      const thr = fund.threshold;
      if (bal == null && thr == null) {
        card.innerHTML = `<p class="muted">余额与门槛暂不可用</p>`;
        return;
      }
      const balPart = bal == null ? "—" : String(Math.round(Number(bal)));
      const thrPart = thr == null ? "—" : String(Math.round(Number(thr)));
      const combo = balPart + " · " + thrPart;
      const line = "差旅余额 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdPlainCopyBtn">复制余额门槛纯</button>`;
      const btn = $("#travelBalanceThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额与门槛暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段文案+预算组合复制 */
  async function ensureAftercarePhaseBudgetCopyButtons() {
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
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = phase + " · " + budget;
      el.dataset.phaseBudget = line;
      if (el.querySelector(".ac-copy-phase-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-budget";
      btn.textContent = "复制阶段与预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseBudget || "");
        softBanner(ok ? "已复制阶段与预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门闩文案与就绪布尔组合复制 */
  async function ensureAuthGateLabelReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateLabelReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateLabelReadyCopyCard";
      card.className = "av-gate-label-ready-copy";
      const prog = $("#avProgressMissingCopyCard");
      const active = $("#avActiveIdStatusCopyCard");
      const thresh = $("#avThresholdReadyCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (thresh && thresh.parentNode)
        thresh.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无门闩说明";
      const ready = truthyFlag(data.ready) ? "是" : "否";
      const combo = gate + " · 就绪·" + ready;
      const line = "授权视频门闩 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-gate-label-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateLabelReadyCopyBtn">复制门闩与就绪</button>`;
      const btn = $("#avGateLabelReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门闩与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门闩与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+联系组合复制 */
  async function ensureHeirIdNameContactCopyButtons() {
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
      const line = "#" + it.id + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-id-name-contact")) return;
      el.dataset.idNameContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-contact";
      btn.textContent = "复制编号姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameContact || "");
        softBanner(ok ? "已复制编号姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目总数与品牌组合复制 */
  async function ensureHandoverItemCountBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountBrandCopyCard";
      card.className = "hand-item-count-brand-copy";
      const brandDom = $("#handBrandDomainCopyCard");
      const itemDom = $("#handItemCountDomainCopyCard");
      const share = $("#handShareDomainCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else if (share && share.parentNode)
        share.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count = data.item_count;
      const brand = String(data.brand || "").trim();
      if (count == null && !brand) {
        card.innerHTML = `<p class="muted">条目与品牌暂不可用</p>`;
        return;
      }
      const countPart = count == null ? "—" : String(count);
      const combo = brand ? countPart + " · " + brand : countPart;
      const line = "手册条目 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountBrandCopyBtn">复制条目与品牌</button>`;
      const btn = $("#handItemCountBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪与域名组合复制 + round 层含 72 */
  async function paintOkDomainR72CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okDomainR72CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okDomainR72CopyCard";
      card.className = "card ok-domain-r72-copy-card";
      const serverVer = $("#serverVerOkR71CopyCard");
      const brandTriple = $("#appBrandDomainEnR70CopyCard");
      const brandOk = $("#brandEnOkR69CopyCard");
      const roundList = $("#roundLayerListCard");
      if (serverVer && serverVer.parentNode)
        serverVer.insertAdjacentElement("beforebegin", card);
      else if (brandTriple && brandTriple.parentNode)
        brandTriple.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = "ok·" + okPart + " · " + domain;
      card.innerHTML = `<h3>就绪与域名</h3>
        <p class="muted">一键复制服务就绪与域名（演示级）。</p>
        <p class="ok-domain-r72-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okDomainR72CopyBtn">复制就绪域名态</button>`;
      const btn = $("#okDomainR72CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名态" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList72() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 72;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 72); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round72 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeIsMemberDays().catch(() => {}), 550);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryBeneficiaryCopyButtons().catch(() => {}),
      380
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdPlatformTagCopyButtons().catch(() => {}),
      380
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberDaysLeftPlainCopy().catch(() => {}), 370);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceThresholdPlainCopy().catch(() => {}),
      390
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseBudgetCopyButtons().catch(() => {}),
      380
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateLabelReadyCopy().catch(() => {}), 350);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNameContactCopyButtons().catch(() => {}),
      380
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverItemCountBrandCopy().catch(() => {}), 390);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeIsMemberDays().catch(() => {}), 550);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryBeneficiaryCopyButtons().catch(() => {}),
        400
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdPlatformTagCopyButtons().catch(() => {}),
        390
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinMemberDaysLeftPlainCopy().catch(() => {}), 390);
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceThresholdPlainCopy().catch(() => {}),
        410
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseBudgetCopyButtons().catch(() => {}),
        400
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateLabelReadyCopy().catch(() => {}), 370);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNameContactCopyButtons().catch(() => {}),
        390
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverItemCountBrandCopy().catch(() => {}), 400);
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainR72CopyCard().catch(() => {});
        paintRoundLayerList72();
      }, 440);
      setTimeout(() => {
        paintOkDomainR72CopyCard().catch(() => {});
        paintRoundLayerList72();
      }, 1020);
    }
  };

  setTimeout(() => paintHomeIsMemberDays().catch(() => {}), 600);
  setTimeout(
    () => ensureLegacyCategoryBeneficiaryCopyButtons().catch(() => {}),
    620
  );
  setTimeout(() => ensureAssetIdPlatformTagCopyButtons().catch(() => {}), 640);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberDaysLeftPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateLabelReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainR72CopyCard().catch(() => {});
      paintRoundLayerList72();
    }, 460);
  }
})();
