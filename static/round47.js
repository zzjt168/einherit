/* 电子继承 · 第四十七批增量（叠在 round46…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round47SoftBanner_" + (hostId || "home");
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
    return v === true || v === 1 || v === "1" || v === "true";
  }

  /* 1 · 首页交割已填处置数一句 */
  async function paintHomeLegacyFilled() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeLegacyFilledBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeLegacyFilledBar";
      bar.className = "home-legacy-filled-bar";
      bar.setAttribute("role", "status");
      const ac = $("#homeAftercareCountBar");
      const company = $("#homeCompanyFilledBar");
      const cover = $("#homeHandoverActionCoverBar");
      if (ac && ac.parentNode === home)
        ac.insertAdjacentElement("afterend", bar);
      else if (company && company.parentNode === home)
        company.insertAdjacentElement("afterend", bar);
      else if (cover && cover.parentNode === home)
        cover.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/counts-summary").catch(() => ({}));
      const counts = data.counts || {};
      const filled = Number(
        counts.legacy_filled != null ? counts.legacy_filled : counts.legacy || 0
      );
      const total = Number(counts.legacy != null ? counts.legacy : filled);
      bar.hidden = false;
      if (!total) {
        bar.innerHTML = `<span class="home-legacy-filled-mark">交割处置</span>
          <span class="muted home-legacy-filled-sub">可先记一条 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeLegacyFilledGo">去交割</button>`;
      } else {
        bar.innerHTML = `<span class="home-legacy-filled-mark">交割处置</span>
          <span class="muted home-legacy-filled-sub">已填处置 ${filled}/${total} · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeLegacyFilledGo">去交割</button>`;
      }
      const btn = $("#homeLegacyFilledGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("legacy");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割清除聊天状态一键复制 */
  async function ensureLegacyClearChatsCopyButtons() {
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
      const line = truthyFlag(it.clear_chats)
        ? "已勾清除聊天"
        : "未勾清除聊天";
      el.dataset.clearChatsLabel = line;
      if (el.querySelector(".lg-copy-clear-chats")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-clear-chats";
      btn.textContent = "复制清除聊天状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.clearChatsLabel || "");
        softBanner(ok ? "已复制清除聊天状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+标签组合复制 */
  async function ensureAssetIdTagCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      const line = tag ? "#" + it.id + " · " + tag : "#" + it.id;
      el.dataset.idTag = line;
      if (el.querySelector(".as-copy-id-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-tag";
      btn.textContent = "复制编号与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTag || "");
        softBanner(ok ? "已复制编号与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制倒计时冷静句 */
  async function ensureCheckinCountdownLabelCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinCountdownLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinCountdownLabelCopyCard";
      card.className = "checkin-countdown-label-copy";
      const rel = $("#checkinBackupRelationCopyCard");
      const phone = $("#checkinBackupPhoneCopyCard");
      const overdue = $("#checkinOverdueCalmCopyCard");
      if (rel && rel.parentNode) rel.insertAdjacentElement("afterend", card);
      else if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else if (overdue && overdue.parentNode)
        overdue.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const label = String(
        cd.countdown_label || cd.readable || ""
      ).trim();
      if (!label) {
        card.innerHTML = `<p class="muted">倒计时说明暂不可用</p>`;
        return;
      }
      const line = label + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-countdown-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinCountdownLabelCopyBtn">复制倒计时说明</button>`;
      const btn = $("#checkinCountdownLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制倒计时说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">倒计时说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅是否达门槛一键复制 */
  async function ensureTravelMeetsThresholdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMeetsThresholdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMeetsThresholdCopyCard";
      card.className = "travel-meets-threshold-copy";
      const shortfall = $("#travelShortfallNumCopyCard");
      const bal = $("#travelBalanceNumCopyCard");
      const thr = $("#travelThresholdNumCopyCard");
      if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode)
        thr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met =
        fund.meets_threshold != null
          ? !!fund.meets_threshold
          : fund.met != null
            ? !!fund.met
            : Number(fund.balance || 0) >= Number(fund.threshold || 2000);
      const status = met ? "已达建议门槛" : "未达建议门槛";
      const line = "差旅门槛 · " + status;
      card.innerHTML = `<p class="muted travel-meets-threshold-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMeetsThresholdCopyBtn">复制门槛达标状态</button>`;
      const btn = $("#travelMeetsThresholdCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制门槛达标状态" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛达标状态暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+标题组合复制 */
  async function ensureAftercareIdTitleCopyButtons() {
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
      const title = String(it.title || "").trim();
      const line = title ? "#" + it.id + " · " + title : "#" + it.id;
      el.dataset.idTitle = line;
      if (el.querySelector(".ac-copy-id-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-title";
      btn.textContent = "复制编号与标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitle || "");
        softBanner(ok ? "已复制编号与标题" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频首段脚本提示一键复制 */
  async function ensureAuthScriptHint0Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptHint0CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptHint0CopyCard";
      card.className = "av-script-hint0-copy";
      const status = $("#avStatusCopyCard");
      const thr = $("#avThresholdPassedCopyCard");
      const label = $("#avActiveLabelCopyCard");
      if (status && status.parentNode)
        status.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode)
        thr.insertAdjacentElement("afterend", card);
      else if (label && label.parentNode)
        label.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const hint = String((script[0] && script[0].hint) || "").trim();
      if (!hint) {
        card.innerHTML = `<p class="muted">首段脚本提示暂不可用</p>`;
        return;
      }
      const line = "授权视频首段提示 · " + hint;
      card.innerHTML = `<p class="muted av-script-hint0-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptHint0CopyBtn">复制首段提示</button>`;
      const btn = $("#avScriptHint0CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制首段提示" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">首段提示暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系方式组合复制 */
  async function ensureHeirRelationContactCopyButtons() {
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
      const relation = String(it.relation || "").trim();
      const contact = String(it.contact || "").trim();
      const line =
        relation && contact
          ? relation + " · " + contact
          : relation || contact;
      el.dataset.relationContact = line;
      if (!line || el.querySelector(".bn-copy-relation-contact")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact";
      btn.textContent = "复制关系与联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContact || "");
        softBanner(ok ? "已复制关系与联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数纯数字一键复制 */
  async function ensureHandoverItemCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountNumCopyCard";
      card.className = "hand-item-count-num-copy";
      const bn = $("#handBeneficiaryCountNumCopyCard");
      const byAction = $("#handByActionCopyCard");
      const byDept = $("#handByDeptCopyCard");
      if (bn && bn.parentNode) bn.insertAdjacentElement("afterend", card);
      else if (byAction && byAction.parentNode)
        byAction.insertAdjacentElement("afterend", card);
      else if (byDept && byDept.parentNode)
        byDept.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const n = Number(
        data.item_count != null
          ? data.item_count
          : (data.todos || []).length
      );
      const num = String(Math.max(0, Math.round(n)));
      const line = "手册条目数数字 · " + num;
      card.innerHTML = `<p class="muted hand-item-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountNumCopyBtn">复制条目数</button>`;
      const btn = $("#handItemCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制条目数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制中文品牌·服务端版本·域名 + round 层含 47 */
  async function paintAppServerDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appServerDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appServerDomainCopyCard";
      card.className = "card app-server-domain-copy-card";
      const ready = $("#readyDomainVersionCopyCard");
      const appSv = $("#appServerVersionCopyCard");
      const cnEn = $("#cnEnDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (ready && ready.parentNode)
        ready.insertAdjacentElement("beforebegin", card);
      else if (appSv && appSv.parentNode)
        appSv.insertAdjacentElement("beforebegin", card);
      else if (cnEn && cnEn.parentNode)
        cnEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = h.app || "电子继承 App";
      const sv = h.server_version || "EInherit/0.5";
      const domain = h.domain || "einherit.cn";
      const line = app + " · " + sv + " · " + domain;
      card.innerHTML = `<h3>中文品牌 · 服务端版本 · 域名</h3>
        <p class="muted">一键复制中文品牌 + 服务端版本 + 域名（演示级）。</p>
        <p class="app-server-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appServerDomainCopyBtn">复制品牌·服务端·域名</button>`;
      const btn = $("#appServerDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌·服务端·域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 服务端版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList47() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 47;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 47); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round47 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeLegacyFilled().catch(() => {}), 300);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyClearChatsCopyButtons().catch(() => {}), 210);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdTagCopyButtons().catch(() => {}), 210);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinCountdownLabelCopy().catch(() => {}), 200);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMeetsThresholdCopy().catch(() => {}), 220);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareIdTitleCopyButtons().catch(() => {}), 210);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptHint0Copy().catch(() => {}), 180);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactCopyButtons().catch(() => {}),
      210
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverItemCountNumCopy().catch(() => {}), 220);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeLegacyFilled().catch(() => {}), 300);
    if (id === "legacy")
      setTimeout(() => ensureLegacyClearChatsCopyButtons().catch(() => {}), 230);
    if (id === "assets")
      setTimeout(() => ensureAssetIdTagCopyButtons().catch(() => {}), 220);
    if (id === "checkin")
      setTimeout(() => ensureCheckinCountdownLabelCopy().catch(() => {}), 220);
    if (id === "travel")
      setTimeout(() => ensureTravelMeetsThresholdCopy().catch(() => {}), 240);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareIdTitleCopyButtons().catch(() => {}), 230);
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptHint0Copy().catch(() => {}), 200);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactCopyButtons().catch(() => {}),
        220
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverItemCountNumCopy().catch(() => {}), 230);
    if (id === "settings") {
      setTimeout(() => {
        paintAppServerDomainCopyCard().catch(() => {});
        paintRoundLayerList47();
      }, 270);
      setTimeout(() => {
        paintAppServerDomainCopyCard().catch(() => {});
        paintRoundLayerList47();
      }, 720);
    }
  };

  // Boot
  setTimeout(() => paintHomeLegacyFilled().catch(() => {}), 360);
  setTimeout(() => ensureLegacyClearChatsCopyButtons().catch(() => {}), 380);
  setTimeout(() => ensureAssetIdTagCopyButtons().catch(() => {}), 400);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinCountdownLabelCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMeetsThresholdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdTitleCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptHint0Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppServerDomainCopyCard().catch(() => {});
      paintRoundLayerList47();
    }, 290);
  }
})();
