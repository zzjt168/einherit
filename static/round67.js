/* 电子继承 · 第六十七批增量（叠在 round66…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round67SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页报备硬逾期冷静条 */
  async function paintHomeOverdue() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOverdueBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOverdueBar";
      bar.className = "home-overdue-bar";
      bar.setAttribute("role", "status");
      const domain = $("#homeDomainBrandBar");
      const member = $("#homeIsMemberBar");
      const soft = $("#homeSoftOverdueBar");
      if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else if (soft && soft.parentNode === home)
        soft.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const overdue = !!(st.user || {}).checkin_overdue;
      const sub = overdue
        ? "报备节奏 · 需要留意一下时间"
        : "报备节奏 · 目前从容";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-overdue-mark">报备</span>
        <span class="muted home-overdue-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOverdueGo">去报备</button>`;
      const btn = $("#homeOverdueGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-overdue-mark">报备</span>
        <span class="muted home-overdue-sub">报备节奏暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOverdueGo">去报备</button>`;
      const btn = $("#homeOverdueGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割双清除状态组合复制 */
  async function ensureLegacyClearBothCopyButtons() {
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
      const photos = truthyFlag(it.clear_photos)
        ? "已勾清除照片"
        : "未勾清除照片";
      const chats = truthyFlag(it.clear_chats)
        ? "已勾清除聊天"
        : "未勾清除聊天";
      const line = photos + " · " + chats;
      el.dataset.clearBoth = line;
      if (el.querySelector(".lg-copy-clear-both")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-clear-both";
      btn.textContent = "复制双清除状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.clearBoth || "");
        softBanner(ok ? "已复制双清除状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘账号提示+标签组合复制 */
  async function ensureAssetHintTagCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      const line = tag ? hint + " · " + tag : hint;
      el.dataset.hintTag = line;
      if (el.querySelector(".as-copy-hint-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-tag";
      btn.textContent = "复制账号提示与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintTag || "");
        softBanner(ok ? "已复制账号提示与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员到期日与剩余天 */
  async function ensureCheckinMemberUntilDaysCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberUntilDaysCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberUntilDaysCopyCard";
      card.className = "checkin-member-until-days-copy";
      const due = $("#checkinDueSoonHoursCopyCard");
      const ago = $("#checkinLastAgoHoursSinceCopyCard");
      const interval = $("#checkinIntervalGraceNumCopyCard");
      if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
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
      const user = st.user || {};
      const until = String(user.member_until_iso || "").trim();
      const days = user.member_days_left;
      if (!until && days == null) {
        card.innerHTML = `<p class="muted">到期日与剩余天暂不可用</p>`;
        return;
      }
      const daysPart =
        days == null ? "—" : String(Math.round(Number(days)));
      const combo = until ? until + " · " + daysPart : daysPart;
      const line =
        "会员到期日 · 剩余天 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-member-until-days-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberUntilDaysCopyBtn">复制会员到期日与剩余天</button>`;
      const btn = $("#checkinMemberUntilDaysCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制会员到期日与剩余天" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">到期日与剩余天暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与达标组合复制 */
  async function ensureTravelBalanceMetCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetCopyCard";
      card.className = "travel-balance-met-copy";
      const metShort = $("#travelMetShortfallCopyCard");
      const prog = $("#travelProgressLabelPctCopyCard");
      const refund = $("#travelRefundIdAmountCopyCard");
      if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
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
      const meets = !!(fund.meets_threshold || fund.met);
      if (bal == null) {
        card.innerHTML = `<p class="muted">余额与达标暂不可用</p>`;
        return;
      }
      const status = meets ? "已达标" : "未达标";
      const combo =
        String(Math.round(Number(bal))) + " · " + status;
      const line = "差旅余额 · 达标 · " + combo;
      card.innerHTML = `<p class="muted travel-balance-met-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetCopyBtn">复制余额与达标</button>`;
      const btn = $("#travelBalanceMetCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额与达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额与达标暂不可用</p>`;
    }
  }

  /* 6 · 善后状态语气+状态键组合复制 */
  async function ensureAftercareStatusToneKeyCopyButtons() {
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
      const tone = String(it.status_tone || "").trim();
      const key = String(it.status_key || "").trim();
      const line = tone && key ? tone + " · " + key : tone || key;
      el.dataset.statusToneKey = line;
      if (!line || el.querySelector(".ac-copy-status-tone-key")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-tone-key";
      btn.textContent = "复制语气与状态键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusToneKey || "");
        softBanner(ok ? "已复制语气与状态键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频齐备与就绪布尔组合复制 */
  async function ensureAuthCompleteReadyBoolCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyBoolCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyBoolCopyCard";
      card.className = "av-complete-ready-bool-copy";
      const missing = $("#avMissingLabelsCopyCard");
      const gate = $("#avGateCopyCard");
      const keys = $("#avChecklistDoneKeysCopyCard");
      if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (keys && keys.parentNode)
        keys.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      if (data.complete == null && data.ready == null) {
        card.innerHTML = `<p class="muted">齐备与就绪布尔暂不可用</p>`;
        return;
      }
      const completePart =
        data.complete == null ? "—" : data.complete ? "true" : "false";
      const readyPart =
        data.ready == null ? "—" : data.ready ? "true" : "false";
      const combo = completePart + " · " + readyPart;
      const line = "授权视频齐备 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-bool-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyBoolCopyBtn">复制齐备与就绪布尔</button>`;
      const btn = $("#avCompleteReadyBoolCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制齐备与就绪布尔" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">齐备与就绪布尔暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+口令提示组合复制 */
  async function ensureHeirContactPassphraseCopyButtons() {
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
      const contact = String(it.contact || "").trim();
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = contact ? contact + " · " + hint : hint;
      if (!line || el.querySelector(".bn-copy-contact-passphrase")) return;
      el.dataset.contactPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-passphrase";
      btn.textContent = "复制联系与口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactPassphrase || "");
        softBanner(ok ? "已复制联系与口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目总数与覆盖百分比组合复制 */
  async function ensureHandoverItemPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemPctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemPctCopyCard";
      card.className = "hand-item-pct-copy";
      const brand = $("#handBrandMemberCopyCard");
      const domain = $("#handDomainExecutorCopyCard");
      const bene = $("#handBeneCountItemCopyCard");
      if (brand && brand.parentNode)
        brand.insertAdjacentElement("afterend", card);
      else if (domain && domain.parentNode)
        domain.insertAdjacentElement("afterend", card);
      else if (bene && bene.parentNode)
        bene.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let items = data.item_count;
      if (items == null) items = prog.total_items;
      let pct = prog.pct;
      if (pct == null && prog.filled_types != null && prog.total_types) {
        pct = Math.round(
          (Number(prog.filled_types) / Number(prog.total_types)) * 100
        );
      }
      if (items == null && pct == null) {
        card.innerHTML = `<p class="muted">条目与覆盖暂不可用</p>`;
        return;
      }
      const itemPart =
        items == null ? "—" : String(Math.round(Number(items)));
      const pctPart =
        pct == null ? "—" : String(Math.round(Number(pct)));
      const combo = itemPart + " · " + pctPart;
      const line = "手册条目 · 覆盖 · " + combo;
      card.innerHTML = `<p class="muted hand-item-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemPctCopyBtn">复制条目与覆盖</button>`;
      const btn = $("#handItemPctCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目与覆盖" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目与覆盖暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+服务端版本组合复制 + round 层含 67 */
  async function paintEnServerCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#enServerCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "enServerCopyCard";
      card.className = "card en-server-copy-card";
      const okVer = $("#okVersionCopyCard");
      const serverDomain = $("#serverVersionDomainCopyCard");
      const appDomain = $("#appDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (serverDomain && serverDomain.parentNode)
        serverDomain.insertAdjacentElement("beforebegin", card);
      else if (appDomain && appDomain.parentNode)
        appDomain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const sv = String(h.server_version || "EInherit/0.5").trim();
      const line = en + " · " + sv;
      card.innerHTML = `<h3>英文品牌与服务端</h3>
        <p class="muted">一键复制英文品牌与服务端版本（演示级）。</p>
        <p class="en-server-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="enServerCopyBtn">复制英文与服务端</button>`;
      const btn = $("#enServerCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文与服务端" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌与服务端</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList67() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 67;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 67); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round67 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOverdue().catch(() => {}), 500);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyClearBothCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetHintTagCopyButtons().catch(() => {}), 340);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberUntilDaysCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceMetCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusToneKeyCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthCompleteReadyBoolCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactPassphraseCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverItemPctCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOverdue().catch(() => {}), 500);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyClearBothCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(() => ensureAssetHintTagCopyButtons().catch(() => {}), 350);
    if (id === "checkin")
      setTimeout(() => ensureCheckinMemberUntilDaysCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelBalanceMetCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusToneKeyCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthCompleteReadyBoolCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactPassphraseCopyButtons().catch(() => {}),
        350
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverItemPctCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintEnServerCopyCard().catch(() => {});
        paintRoundLayerList67();
      }, 400);
      setTimeout(() => {
        paintEnServerCopyCard().catch(() => {});
        paintRoundLayerList67();
      }, 980);
    }
  };

  setTimeout(() => paintHomeOverdue().catch(() => {}), 550);
  setTimeout(() => ensureLegacyClearBothCopyButtons().catch(() => {}), 570);
  setTimeout(() => ensureAssetHintTagCopyButtons().catch(() => {}), 590);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberUntilDaysCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusToneKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyBoolCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintEnServerCopyCard().catch(() => {});
      paintRoundLayerList67();
    }, 420);
  }
})();
