/* 电子继承 · 第五十九批增量（叠在 round58…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round59SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页差旅进度百分比一句 */
  async function paintHomeTravelPct() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeTravelPctBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeTravelPctBar";
      bar.className = "home-travel-pct-bar";
      bar.setAttribute("role", "status");
      const bal = $("#homeTravelBalanceBar");
      const ver = $("#homeAppVersionBar");
      const domain = $("#homeDomainBar");
      if (bal && bal.parentNode === home)
        bal.insertAdjacentElement("afterend", bar);
      else if (ver && ver.parentNode === home)
        ver.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/travel-fund").catch(() => ({}));
      const fund = data.fund || data;
      let pct = fund.progress_pct;
      if (pct == null && fund.threshold) {
        const bal = Number(fund.balance || 0);
        const thr = Number(fund.threshold) || 1;
        pct = Math.min(100, Math.round((bal / thr) * 100));
      }
      const num = pct == null ? "—" : String(Math.round(Number(pct)));
      bar.hidden = false;
      bar.innerHTML = `<span class="home-travel-pct-mark">差旅</span>
        <span class="muted home-travel-pct-sub">预存进度 ${esc(num)}%</span>
        <button type="button" class="btn ghost sm" id="homeTravelPctGo">去差旅</button>`;
      const btn = $("#homeTravelPctGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("travel");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割编号纯数字一键复制 */
  async function ensureLegacyIdPlainCopyButtons() {
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
      if (el.querySelector(".lg-copy-id-plain")) return;
      const num = String(it.id);
      el.dataset.idPlain = num;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-plain";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlain || "");
        softBanner(ok ? "已复制编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性英文键一键复制 */
  async function ensureAssetVisibilityKeyCopyButtons() {
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
      let key = String(it.visibility || "private").trim().toLowerCase();
      if (!key) key = "private";
      if (el.querySelector(".as-copy-visibility-key")) return;
      el.dataset.visibilityKey = key;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-key";
      btn.textContent = "复制可见性键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityKey || "");
        softBanner(ok ? "已复制可见性键" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制是否处于冷静期 */
  async function ensureCheckinInGraceStatusCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinInGraceStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinInGraceStatusCopyCard";
      card.className = "checkin-in-grace-status-copy";
      const graceSec = $("#checkinGraceRemainSecNumCopyCard");
      const sec = $("#checkinSecondsRemainingNumCopyCard");
      const due = $("#checkinDueSoonCopyCard");
      if (graceSec && graceSec.parentNode)
        graceSec.insertAdjacentElement("afterend", card);
      else if (sec && sec.parentNode)
        sec.insertAdjacentElement("afterend", card);
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
      const user = st.user || {};
      if (!("checkin_in_grace" in user)) {
        card.innerHTML = `<p class="muted">冷静期状态暂不可用</p>`;
        return;
      }
      const status = user.checkin_in_grace ? "冷静期内" : "非冷静期";
      const line =
        "报备冷静期 · " +
        status +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-in-grace-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinInGraceStatusCopyBtn">复制冷静期状态</button>`;
      const btn = $("#checkinInGraceStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制冷静期状态" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">冷静期状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水编号+种类键组合复制 */
  async function ensureTravelLedgerIdKindCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerIdKindCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerIdKindCopyCard";
      card.className = "travel-ledger-id-kind-copy";
      const combo = $("#travelLedgerKindComboCopyCard");
      const amt = $("#travelLedgerAmountNumCopyCard");
      const note = $("#travelRefundNoteCopyCard");
      if (combo && combo.parentNode)
        combo.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode)
        amt.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode)
        note.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0];
      if (!row || row.id == null) {
        card.innerHTML = `<p class="muted">流水编号与种类暂不可用</p>`;
        return;
      }
      const kind = String(row.kind || "").trim();
      const line = kind ? "#" + row.id + " · " + kind : "#" + row.id;
      const preview = "最近流水 · " + line;
      card.innerHTML = `<p class="muted travel-ledger-id-kind-copy-line">${esc(
        preview
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerIdKindCopyBtn">复制编号与种类键</button>`;
      const btn = $("#travelLedgerIdKindCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制编号与种类键" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">编号与种类键暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型英文键一键复制 */
  async function ensureAftercareServiceTypeKeyCopyButtons() {
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
      const key = String(it.service_type || "").trim();
      if (!key || el.querySelector(".ac-copy-service-type-key")) return;
      el.dataset.serviceTypeKey = key;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type-key";
      btn.textContent = "复制服务类型键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceTypeKey || "");
        softBanner(ok ? "已复制服务类型键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效文件名纯文本一键复制 */
  async function ensureAuthFilenamePlainCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avFilenamePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avFilenamePlainCopyCard";
      card.className = "av-filename-plain-copy";
      const k2 = $("#avScriptKey2CopyCard");
      const k1 = $("#avScriptKey1CopyCard");
      const complete = $("#avCompleteLabelCopyCard");
      if (k2 && k2.parentNode) k2.insertAdjacentElement("afterend", card);
      else if (k1 && k1.parentNode)
        k1.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active = data.current_active || data.latest || {};
      const filename = String(active.filename || "").trim();
      if (!filename) {
        card.innerHTML = `<p class="muted">生效文件名暂不可用</p>`;
        return;
      }
      const line = "授权视频生效文件名 · " + filename;
      card.innerHTML = `<p class="muted av-filename-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avFilenamePlainCopyBtn">复制文件名</button>`;
      const btn = $("#avFilenamePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(filename);
          softBanner(ok ? "已复制文件名" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">文件名暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色键+关系组合复制 */
  async function ensureHeirRoleRelationKeyCopyButtons() {
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
      const role = String(it.role || "").trim().toLowerCase();
      const relation = String(it.relation || "").trim();
      const line =
        role && relation ? role + " · " + relation : role || relation;
      if (!line || el.querySelector(".bn-copy-role-relation-key")) return;
      el.dataset.roleRelationKey = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-relation-key";
      btn.textContent = "复制角色键与关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleRelationKey || "");
        softBanner(ok ? "已复制角色键与关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册处置计数英文键摘要一键复制 */
  async function ensureHandoverActionCountsEnCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handActionCountsEnCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handActionCountsEnCopyCard";
      card.className = "hand-action-counts-en-copy";
      const clear = $("#handClearCountNumCopyCard");
      const sale = $("#handSaleCountNumCopyCard");
      const destroy = $("#handDestroyCountNumCopyCard");
      if (clear && clear.parentNode)
        clear.insertAdjacentElement("afterend", card);
      else if (sale && sale.parentNode)
        sale.insertAdjacentElement("afterend", card);
      else if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const counts = (data.progress || {}).action_counts || {};
      const keys = ["destroy", "sale", "gift", "clear"];
      const parts = keys.map((k) => {
        const n = counts[k];
        return k + ":" + (n == null ? "0" : String(Math.round(Number(n))));
      });
      const line = parts.join(" · ");
      const preview = "手册处置计数 · " + line;
      card.innerHTML = `<p class="muted hand-action-counts-en-copy-line">${esc(
        preview
      )}</p>
        <button type="button" class="btn ghost sm" id="handActionCountsEnCopyBtn">复制处置计数</button>`;
      const btn = $("#handActionCountsEnCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制处置计数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">处置计数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务端版本+应用版本纯号 + round 层含 59 */
  async function paintServerAppVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverAppVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverAppVersionCopyCard";
      card.className = "card server-app-version-copy-card";
      const domainEn = $("#domainBrandEnCopyCard");
      const verP = $("#versionPrefixedCopyCard");
      const okPlain = $("#healthOkPlainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (domainEn && domainEn.parentNode)
        domainEn.insertAdjacentElement("beforebegin", card);
      else if (verP && verP.parentNode)
        verP.insertAdjacentElement("beforebegin", card);
      else if (okPlain && okPlain.parentNode)
        okPlain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const sv = String(h.server_version || "EInherit/0.5").trim();
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const line = sv + " · " + ver;
      card.innerHTML = `<h3>服务端与应用版本</h3>
        <p class="muted">一键复制服务端版本与应用版本纯号（演示级）。</p>
        <p class="server-app-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverAppVersionCopyBtn">复制双版本</button>`;
      const btn = $("#serverAppVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制双版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端与应用版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList59() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 59;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 59); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round59 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeTravelPct().catch(() => {}), 420);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdPlainCopyButtons().catch(() => {}), 330);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityKeyCopyButtons().catch(() => {}),
      330
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinInGraceStatusCopy().catch(() => {}), 320);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerIdKindCopy().catch(() => {}), 340);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceTypeKeyCopyButtons().catch(() => {}),
      330
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthFilenamePlainCopy().catch(() => {}), 300);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRoleRelationKeyCopyButtons().catch(() => {}),
      330
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverActionCountsEnCopy().catch(() => {}), 340);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeTravelPct().catch(() => {}), 420);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdPlainCopyButtons().catch(() => {}), 350);
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityKeyCopyButtons().catch(() => {}),
        340
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinInGraceStatusCopy().catch(() => {}), 340);
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerIdKindCopy().catch(() => {}), 360);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceTypeKeyCopyButtons().catch(() => {}),
        350
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthFilenamePlainCopy().catch(() => {}), 320);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRoleRelationKeyCopyButtons().catch(() => {}),
        340
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverActionCountsEnCopy().catch(() => {}), 350);
    if (id === "settings") {
      setTimeout(() => {
        paintServerAppVersionCopyCard().catch(() => {});
        paintRoundLayerList59();
      }, 390);
      setTimeout(() => {
        paintServerAppVersionCopyCard().catch(() => {});
        paintRoundLayerList59();
      }, 960);
    }
  };

  setTimeout(() => paintHomeTravelPct().catch(() => {}), 480);
  setTimeout(() => ensureLegacyIdPlainCopyButtons().catch(() => {}), 500);
  setTimeout(() => ensureAssetVisibilityKeyCopyButtons().catch(() => {}), 520);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinInGraceStatusCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerIdKindCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthFilenamePlainCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleRelationKeyCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverActionCountsEnCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerAppVersionCopyCard().catch(() => {});
      paintRoundLayerList59();
    }, 410);
  }
})();
