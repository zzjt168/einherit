/* 电子继承 · 第五十七批增量（叠在 round56…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round57SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用版本号一句 */
  async function paintHomeAppVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppVersionBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppVersionBar";
      bar.className = "home-app-version-bar";
      bar.setAttribute("role", "status");
      const domain = $("#homeDomainBar");
      const bene = $("#homeBeneCountBar");
      const slogan = $("#homeCompanySloganBar");
      if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (bene && bene.parentNode === home)
        bene.insertAdjacentElement("afterend", bar);
      else if (slogan && slogan.parentNode === home)
        slogan.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      let ver = String(h.version || "0.5.0").trim();
      if (ver && !/^v/i.test(ver)) ver = "v" + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-version-mark">版本</span>
        <span class="muted home-app-version-sub">应用 ${esc(ver)}</span>
        <button type="button" class="btn ghost sm" id="homeAppVersionGo">去设置</button>`;
      const btn = $("#homeAppVersionGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题纯文本一键复制 */
  async function ensureLegacyTitlePlainCopyButtons() {
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
      const title = String(it.title || "").trim();
      if (!title || el.querySelector(".lg-copy-title-plain")) return;
      el.dataset.titlePlain = title;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-plain";
      btn.textContent = "复制标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titlePlain || "");
        softBanner(ok ? "已复制标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台纯文本一键复制 */
  async function ensureAssetPlatformPlainCopyButtons() {
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
      const platform = String(it.platform || "").trim();
      if (!platform || el.querySelector(".as-copy-platform-plain")) return;
      el.dataset.platformPlain = platform;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-plain";
      btn.textContent = "复制平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformPlain || "");
        softBanner(ok ? "已复制平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距建议剩余秒纯数字 */
  async function ensureCheckinSecondsRemainingNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSecondsRemainingNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSecondsRemainingNumCopyCard";
      card.className = "checkin-seconds-remaining-num-copy";
      const due = $("#checkinDueSoonCopyCard");
      const hours = $("#checkinHoursSinceNumCopyCard");
      const last = $("#checkinLastLabelCopyCard");
      if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const sec = (st.countdown || {}).seconds_remaining;
      if (sec == null) {
        card.innerHTML = `<p class="muted">剩余秒数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(sec)));
      const line =
        "距建议剩余秒 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-seconds-remaining-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSecondsRemainingNumCopyBtn">复制剩余秒</button>`;
      const btn = $("#checkinSecondsRemainingNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制剩余秒" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余秒暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水金额纯数字一键复制 */
  async function ensureTravelLedgerAmountNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerAmountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerAmountNumCopyCard";
      card.className = "travel-ledger-amount-num-copy";
      const note = $("#travelRefundNoteCopyCard");
      const kind = $("#travelRefundKindCopyCard");
      const bal = $("#travelBalanceThresholdCopyCard");
      if (note && note.parentNode)
        note.insertAdjacentElement("afterend", card);
      else if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0];
      if (!row || row.amount == null) {
        card.innerHTML = `<p class="muted">最近流水金额暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Math.abs(Number(row.amount))));
      const line = "最近流水金额数字 · " + num;
      card.innerHTML = `<p class="muted travel-ledger-amount-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerAmountNumCopyBtn">复制金额数字</button>`;
      const btn = $("#travelLedgerAmountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制金额数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">金额数字暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段英文键一键复制 */
  async function ensureAftercarePhaseKeyCopyButtons() {
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
      const key = String(it.phase_key || "").trim();
      if (!key || el.querySelector(".ac-copy-phase-key")) return;
      el.dataset.phaseKey = key;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-key";
      btn.textContent = "复制阶段键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseKey || "");
        softBanner(ok ? "已复制阶段键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第二段脚本键一键复制 */
  async function ensureAuthScriptKey1Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptKey1CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptKey1CopyCard";
      card.className = "av-script-key1-copy";
      const k0 = $("#avScriptKey0CopyCard");
      const total = $("#avProgressTotalNumCopyCard");
      const t1 = $("#avScriptTitle1CopyCard");
      if (k0 && k0.parentNode) k0.insertAdjacentElement("afterend", card);
      else if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else if (t1 && t1.parentNode)
        t1.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const key = String((script[1] && script[1].key) || "").trim();
      if (!key) {
        card.innerHTML = `<p class="muted">授权段脚本键暂不可用</p>`;
        return;
      }
      const line = "授权视频授权段脚本键 · " + key;
      card.innerHTML = `<p class="muted av-script-key1-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptKey1CopyBtn">复制脚本键</button>`;
      const btn = $("#avScriptKey1CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(key);
          softBanner(ok ? "已复制脚本键" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本键暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色键+姓名组合复制 */
  async function ensureHeirRoleNameCopyButtons() {
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
      const name = String(it.name || "").trim();
      const line = role && name ? role + " · " + name : role || name;
      if (!line || el.querySelector(".bn-copy-role-name")) return;
      el.dataset.roleName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-name";
      btn.textContent = "复制角色与姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleName || "");
        softBanner(ok ? "已复制角色与姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册变现条数纯数字一键复制 */
  async function ensureHandoverSaleCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSaleCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSaleCountNumCopyCard";
      card.className = "hand-sale-count-num-copy";
      const destroy = $("#handDestroyCountNumCopyCard");
      const gift = $("#handGiftCountNumCopyCard");
      const executor = $("#handExecutorCopyCard");
      if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else if (executor && executor.parentNode)
        executor.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let sale = (prog.action_counts || {}).sale;
      if (sale == null && Array.isArray(prog.by_action)) {
        const row = prog.by_action.find((x) => {
          const a = String(x.action || "");
          return a === "销售变现" || a === "变现" || a === "sale";
        });
        if (row) sale = row.count;
      }
      if (sale == null) {
        card.innerHTML = `<p class="muted">变现条数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(sale)));
      const line = "手册变现条数 · " + num;
      card.innerHTML = `<p class="muted hand-sale-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSaleCountNumCopyBtn">复制变现条数</button>`;
      const btn = $("#handSaleCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制变现条数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">变现条数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制带 v 前缀应用版本 + round 层含 57 */
  async function paintVersionPrefixedCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionPrefixedCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionPrefixedCopyCard";
      card.className = "card version-prefixed-copy-card";
      const okPlain = $("#healthOkPlainCopyCard");
      const sv = $("#serverVersionPlainCopyCard");
      const verPlain = $("#versionPlainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (okPlain && okPlain.parentNode)
        okPlain.insertAdjacentElement("beforebegin", card);
      else if (sv && sv.parentNode)
        sv.insertAdjacentElement("beforebegin", card);
      else if (verPlain && verPlain.parentNode)
        verPlain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      let ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const withV = "v" + ver;
      card.innerHTML = `<h3>应用版本（含 v）</h3>
        <p class="muted">一键复制带 v 前缀的应用版本（演示级）。</p>
        <p class="version-prefixed-copy-preview">${esc(withV)}</p>
        <button type="button" class="btn ghost sm" id="versionPrefixedCopyBtn">复制版本</button>`;
      const btn = $("#versionPrefixedCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(withV);
          softBanner(ok ? "已复制版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本（含 v）</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList57() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 57;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 57); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round57 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppVersion().catch(() => {}), 400);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitlePlainCopyButtons().catch(() => {}),
      310
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformPlainCopyButtons().catch(() => {}),
      310
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinSecondsRemainingNumCopy().catch(() => {}),
      300
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerAmountNumCopy().catch(() => {}), 320);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseKeyCopyButtons().catch(() => {}),
      310
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptKey1Copy().catch(() => {}), 280);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleNameCopyButtons().catch(() => {}), 310);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverSaleCountNumCopy().catch(() => {}), 320);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppVersion().catch(() => {}), 400);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitlePlainCopyButtons().catch(() => {}),
        330
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformPlainCopyButtons().catch(() => {}),
        320
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinSecondsRemainingNumCopy().catch(() => {}),
        320
      );
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerAmountNumCopy().catch(() => {}), 340);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseKeyCopyButtons().catch(() => {}),
        330
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptKey1Copy().catch(() => {}), 300);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleNameCopyButtons().catch(() => {}), 320);
    if (id === "handover")
      setTimeout(() => ensureHandoverSaleCountNumCopy().catch(() => {}), 330);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionPrefixedCopyCard().catch(() => {});
        paintRoundLayerList57();
      }, 370);
      setTimeout(() => {
        paintVersionPrefixedCopyCard().catch(() => {});
        paintRoundLayerList57();
      }, 920);
    }
  };

  setTimeout(() => paintHomeAppVersion().catch(() => {}), 460);
  setTimeout(() => ensureLegacyTitlePlainCopyButtons().catch(() => {}), 480);
  setTimeout(() => ensureAssetPlatformPlainCopyButtons().catch(() => {}), 500);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSecondsRemainingNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerAmountNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptKey1Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSaleCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionPrefixedCopyCard().catch(() => {});
      paintRoundLayerList57();
    }, 390);
  }
})();
