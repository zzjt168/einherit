/* 电子继承 · 第五十八批增量（叠在 round57…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round58SoftBanner_" + (hostId || "home");
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

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    const fallback = {
      production: "生产部",
      finance: "财务部",
      ip: "知识产权部",
      admin: "行政部",
      hr: "人事部",
    };
    return (
      shortMap[dept] || nameMap[dept] || fallback[dept] || String(dept || "")
    );
  }

  /* 1 · 首页差旅余额一句 */
  async function paintHomeTravelBalance() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeTravelBalanceBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeTravelBalanceBar";
      bar.className = "home-travel-balance-bar";
      bar.setAttribute("role", "status");
      const ver = $("#homeAppVersionBar");
      const domain = $("#homeDomainBar");
      const bene = $("#homeBeneCountBar");
      if (ver && ver.parentNode === home)
        ver.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (bene && bene.parentNode === home)
        bene.insertAdjacentElement("afterend", bar);
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
      const bal = fund.balance;
      const num =
        bal == null ? "—" : String(Math.round(Number(bal)));
      bar.hidden = false;
      bar.innerHTML = `<span class="home-travel-balance-mark">差旅</span>
        <span class="muted home-travel-balance-sub">预存余额 ${esc(
          num
        )}</span>
        <button type="button" class="btn ghost sm" id="homeTravelBalanceGo">去差旅</button>`;
      const btn = $("#homeTravelBalanceGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("travel");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割部门短名纯文本一键复制 */
  async function ensureLegacyDeptPlainCopyButtons() {
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
      const dept = deptLabel(it.dept);
      if (!dept || el.querySelector(".lg-copy-dept-plain")) return;
      el.dataset.deptPlain = dept;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-plain";
      btn.textContent = "复制部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptPlain || "");
        softBanner(ok ? "已复制部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘部门短名纯文本一键复制 */
  async function ensureAssetDeptPlainCopyButtons() {
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
      const dept = deptLabel(it.dept);
      if (!dept || el.querySelector(".as-copy-dept-plain")) return;
      el.dataset.deptPlain = dept;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dept-plain";
      btn.textContent = "复制部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptPlain || "");
        softBanner(ok ? "已复制部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制冷静期剩余秒纯数字 */
  async function ensureCheckinGraceRemainSecNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceRemainSecNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceRemainSecNumCopyCard";
      card.className = "checkin-grace-remain-sec-num-copy";
      const sec = $("#checkinSecondsRemainingNumCopyCard");
      const due = $("#checkinDueSoonCopyCard");
      const hours = $("#checkinHoursSinceNumCopyCard");
      if (sec && sec.parentNode)
        sec.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const rem = (st.user || {}).grace_remaining_seconds;
      if (rem == null) {
        card.innerHTML = `<p class="muted">冷静期剩余秒暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(rem)));
      const line =
        "冷静期剩余秒 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-remain-sec-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceRemainSecNumCopyBtn">复制剩余秒</button>`;
      const btn = $("#checkinGraceRemainSecNumCopyBtn");
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

  /* 5 · 差旅最近流水种类键+中文标签组合复制 */
  async function ensureTravelLedgerKindComboCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerKindComboCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerKindComboCopyCard";
      card.className = "travel-ledger-kind-combo-copy";
      const amt = $("#travelLedgerAmountNumCopyCard");
      const note = $("#travelRefundNoteCopyCard");
      const kind = $("#travelRefundKindCopyCard");
      if (amt && amt.parentNode)
        amt.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode)
        note.insertAdjacentElement("afterend", card);
      else if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const row = (data.ledger || [])[0] || {};
      const k = String(row.kind || "").trim();
      const label = String(row.kind_label || "").trim();
      const line = k && label ? k + " · " + label : k || label;
      if (!line) {
        card.innerHTML = `<p class="muted">流水种类组合暂不可用</p>`;
        return;
      }
      const preview = "最近流水种类 · " + line;
      card.innerHTML = `<p class="muted travel-ledger-kind-combo-copy-line">${esc(
        preview
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerKindComboCopyBtn">复制种类组合</button>`;
      const btn = $("#travelLedgerKindComboCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制种类组合" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">种类组合暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段序号纯数字一键复制 */
  async function ensureAftercarePhaseIndexCopyButtons() {
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
      if (!it || it.phase_index == null) return;
      if (el.querySelector(".ac-copy-phase-index")) return;
      const num = String(Math.round(Number(it.phase_index)));
      el.dataset.phaseIndex = num;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-index";
      btn.textContent = "复制阶段序号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseIndex || "");
        softBanner(ok ? "已复制阶段序号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第三段脚本键一键复制 */
  async function ensureAuthScriptKey2Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptKey2CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptKey2CopyCard";
      card.className = "av-script-key2-copy";
      const k1 = $("#avScriptKey1CopyCard");
      const k0 = $("#avScriptKey0CopyCard");
      const t2 = $("#avScriptTitle2CopyCard");
      if (k1 && k1.parentNode) k1.insertAdjacentElement("afterend", card);
      else if (k0 && k0.parentNode)
        k0.insertAdjacentElement("afterend", card);
      else if (t2 && t2.parentNode)
        t2.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const key = String((script[2] && script[2].key) || "").trim();
      if (!key) {
        card.innerHTML = `<p class="muted">处置思路段脚本键暂不可用</p>`;
        return;
      }
      const line = "授权视频处置思路段脚本键 · " + key;
      card.innerHTML = `<p class="muted av-script-key2-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptKey2CopyBtn">复制脚本键</button>`;
      const btn = $("#avScriptKey2CopyBtn");
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

  /* 8 · 受益人关系+角色键组合复制 */
  async function ensureHeirRelationRoleKeyCopyButtons() {
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
      const role = String(it.role || "").trim().toLowerCase();
      const line =
        relation && role ? relation + " · " + role : relation || role;
      if (!line || el.querySelector(".bn-copy-relation-role-key")) return;
      el.dataset.relationRoleKey = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-role-key";
      btn.textContent = "复制关系与角色键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationRoleKey || "");
        softBanner(ok ? "已复制关系与角色键" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册清除类条数纯数字一键复制 */
  async function ensureHandoverClearCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handClearCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handClearCountNumCopyCard";
      card.className = "hand-clear-count-num-copy";
      const sale = $("#handSaleCountNumCopyCard");
      const destroy = $("#handDestroyCountNumCopyCard");
      const gift = $("#handGiftCountNumCopyCard");
      if (sale && sale.parentNode)
        sale.insertAdjacentElement("afterend", card);
      else if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let clear = (prog.action_counts || {}).clear;
      if (clear == null && Array.isArray(prog.by_action)) {
        const row = prog.by_action.find((x) => {
          const a = String(x.action || "");
          return a === "清除" || a === "clear" || a.indexOf("清除") >= 0;
        });
        if (row) clear = row.count;
      }
      if (clear == null) {
        card.innerHTML = `<p class="muted">清除类条数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(clear)));
      const line = "手册清除类条数 · " + num;
      card.innerHTML = `<p class="muted hand-clear-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handClearCountNumCopyBtn">复制清除条数</button>`;
      const btn = $("#handClearCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制清除条数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清除条数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制域名+英文品牌 + round 层含 58 */
  async function paintDomainBrandEnCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainBrandEnCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainBrandEnCopyCard";
      card.className = "card domain-brand-en-copy-card";
      const verP = $("#versionPrefixedCopyCard");
      const okPlain = $("#healthOkPlainCopyCard");
      const brandEn = $("#brandEnPlainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (verP && verP.parentNode)
        verP.insertAdjacentElement("beforebegin", card);
      else if (okPlain && okPlain.parentNode)
        okPlain.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + en;
      card.innerHTML = `<h3>域名与英文品牌</h3>
        <p class="muted">一键复制域名与英文品牌（演示级）。</p>
        <p class="domain-brand-en-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainBrandEnCopyBtn">复制域名与英文品牌</button>`;
      const btn = $("#domainBrandEnCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名与英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名与英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList58() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 58;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 58); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round58 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeTravelBalance().catch(() => {}), 410);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyDeptPlainCopyButtons().catch(() => {}), 320);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDeptPlainCopyButtons().catch(() => {}), 320);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceRemainSecNumCopy().catch(() => {}),
      310
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerKindComboCopy().catch(() => {}), 330);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseIndexCopyButtons().catch(() => {}),
      320
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptKey2Copy().catch(() => {}), 290);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationRoleKeyCopyButtons().catch(() => {}),
      320
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverClearCountNumCopy().catch(() => {}), 330);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeTravelBalance().catch(() => {}), 410);
    if (id === "legacy")
      setTimeout(() => ensureLegacyDeptPlainCopyButtons().catch(() => {}), 340);
    if (id === "assets")
      setTimeout(() => ensureAssetDeptPlainCopyButtons().catch(() => {}), 330);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceRemainSecNumCopy().catch(() => {}),
        330
      );
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerKindComboCopy().catch(() => {}), 350);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseIndexCopyButtons().catch(() => {}),
        340
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptKey2Copy().catch(() => {}), 310);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationRoleKeyCopyButtons().catch(() => {}),
        330
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverClearCountNumCopy().catch(() => {}), 340);
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandEnCopyCard().catch(() => {});
        paintRoundLayerList58();
      }, 380);
      setTimeout(() => {
        paintDomainBrandEnCopyCard().catch(() => {});
        paintRoundLayerList58();
      }, 940);
    }
  };

  setTimeout(() => paintHomeTravelBalance().catch(() => {}), 470);
  setTimeout(() => ensureLegacyDeptPlainCopyButtons().catch(() => {}), 490);
  setTimeout(() => ensureAssetDeptPlainCopyButtons().catch(() => {}), 510);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceRemainSecNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerKindComboCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseIndexCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptKey2Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationRoleKeyCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverClearCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandEnCopyCard().catch(() => {});
      paintRoundLayerList58();
    }, 400);
  }
})();
