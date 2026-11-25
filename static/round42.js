/* 电子继承 · 第四十二批增量（叠在 round41…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round42SoftBanner_" + (hostId || "home");
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

  function escalationLabel(raw) {
    const s = String(raw || "").toLowerCase();
    if (!s || s === "ok" || s === "normal") return "报备节奏 · 正常";
    if (s.indexOf("grace") >= 0) return "报备节奏 · 宽限中";
    if (s.indexOf("call") >= 0) return "报备节奏 · 跟进中";
    if (s.indexOf("review") >= 0 || s.indexOf("manual") >= 0)
      return "报备节奏 · 人工核对";
    return "报备节奏 · " + String(raw || "正常");
  }

  /* 1 · 首页审计条数一句 */
  async function paintHomeAuditCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAuditCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAuditCountBar";
      bar.className = "home-audit-count-bar";
      bar.setAttribute("role", "status");
      const ex = $("#homeExecutorLeadsBar");
      const icu = $("#homeIcuCountBar");
      const med = $("#homeMedIntentsBar");
      if (ex && ex.parentNode === home) ex.insertAdjacentElement("afterend", bar);
      else if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (med && med.parentNode === home) med.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/audit").catch(() => ({ items: [] }));
      const n = (data.items || []).length;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-audit-mark">操作审计</span>
          <span class="muted home-audit-sub">暂无记录 · 按自己节奏使用即可</span>
          <button type="button" class="btn ghost sm" id="homeAuditGo">去查看</button>`;
      } else {
        bar.innerHTML = `<span class="home-audit-mark">操作审计</span>
          <span class="muted home-audit-sub">已记 ${n} 条 · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeAuditGo">去查看</button>`;
      }
      const btn = $("#homeAuditGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("heirs");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割编号+标题组合复制 */
  async function ensureLegacyIdTitleCopyButtons() {
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
      const title = String(it.title || "").trim();
      const line = title ? "#" + it.id + " · " + title : "#" + it.id;
      el.dataset.idTitle = line;
      if (el.querySelector(".lg-copy-id-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title";
      btn.textContent = "复制编号与标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitle || "");
        softBanner(ok ? "已复制编号与标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+平台组合复制 */
  async function ensureAssetTagPlatformCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      const platform = String(it.platform || "").trim();
      const line = tag && platform ? tag + " · " + platform : tag || platform;
      el.dataset.tagPlatform = line;
      if (!line || el.querySelector(".as-copy-tag-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-platform";
      btn.textContent = "复制标签与平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagPlatform || "");
        softBanner(ok ? "已复制标签与平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制报备节奏状态 */
  async function ensureCheckinEscalationCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinEscalationCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinEscalationCopyCard";
      card.className = "checkin-escalation-copy";
      const until = $("#checkinMemberUntilCopyCard");
      const hours = $("#checkinIntervalHoursCopyCard");
      const hard = $("#checkinHardDueCopyCard");
      if (until && until.parentNode) until.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode) hours.insertAdjacentElement("afterend", card);
      else if (hard && hard.parentNode) hard.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.user || {}).escalation_state;
      const line =
        escalationLabel(raw) + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-escalation-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinEscalationCopyBtn">复制报备节奏</button>`;
      const btn = $("#checkinEscalationCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制报备节奏" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备节奏暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛金额纯数字一键复制 */
  async function ensureTravelThresholdNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdNumCopyCard";
      card.className = "travel-threshold-num-copy";
      const lid = $("#travelLatestIdCopyCard");
      const amt = $("#travelLatestAmountCopyCard");
      const thrAmt = $("#travelThresholdAmtCopyCard");
      if (lid && lid.parentNode) lid.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else if (thrAmt && thrAmt.parentNode)
        thrAmt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const num = String(Math.round(thr));
      const line = "差旅建议门槛数字 · " + num;
      card.innerHTML = `<p class="muted travel-threshold-num-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdNumCopyBtn">复制门槛数字</button>`;
      const btn = $("#travelThresholdNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制门槛数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛数字暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+城市组合复制 */
  async function ensureAftercareTitleCityCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#acList .item").forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const title = String(it.title || "").trim();
      const city = String(it.city || "").trim();
      const line = title && city ? title + " · " + city : title;
      el.dataset.titleCity = line;
      if (!line || el.querySelector(".ac-copy-title-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-city";
      btn.textContent = "复制标题与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCity || "");
        softBanner(ok ? "已复制标题与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效文件名+编号组合复制 */
  async function ensureAuthFilenameIdCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avFilenameIdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avFilenameIdCopyCard";
      card.className = "av-filename-id-copy";
      const miss = $("#avMissingTextCopyCard");
      const note = $("#avActiveNoteCopyCard");
      const active = $("#avActiveIdCopyCard");
      if (miss && miss.parentNode) miss.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const active = st.current_active || st.latest || {};
      const name = String(active.original_name || active.filename || "").trim();
      const id = active.id != null ? String(active.id) : "";
      let line = "";
      if (name && id) line = name + " · #" + id;
      else if (name) line = name;
      else if (id) line = "#" + id;
      card.innerHTML = `<p class="muted av-filename-id-copy-line">${esc(
        line || "暂无生效视频"
      )}</p>
        <button type="button" class="btn ghost sm" id="avFilenameIdCopyBtn"${
          line ? "" : " disabled"
        }>复制文件名与编号</button>`;
      const btn = $("#avFilenameIdCopyBtn");
      if (btn && line) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制文件名与编号" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效视频信息暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系组合复制 */
  async function ensureHeirNameRelationCopyButtons() {
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
      const name = String(it.name || "").trim();
      const relation = String(it.relation || "").trim();
      const line = name && relation ? name + " · " + relation : name;
      el.dataset.nameRelation = line;
      if (!line || el.querySelector(".bn-copy-name-relation")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation";
      btn.textContent = "复制姓名与关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelation || "");
        softBanner(ok ? "已复制姓名与关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+域名组合复制 */
  async function ensureHandoverExportDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportDomainCopyCard";
      card.className = "hand-export-domain-copy";
      const domain = $("#handDomainOnlyCopyCard");
      const exportPath = $("#handExportPathCopyCard");
      const brand = $("#handBrandOnlyCopyCard");
      if (domain && domain.parentNode) domain.insertAdjacentElement("afterend", card);
      else if (exportPath && exportPath.parentNode)
        exportPath.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode) brand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "/export/handover.html").trim();
      const domain = String(data.domain || "einherit.cn").trim();
      const line = path + " · " + domain;
      card.innerHTML = `<p class="muted hand-export-domain-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handExportDomainCopyBtn">复制导出路径与域名</button>`;
      const btn = $("#handExportDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制导出路径与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出路径与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务端版本+中文品牌 + round 层含 42 */
  async function paintServerAppCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverAppCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverAppCopyCard";
      card.className = "card server-app-copy-card";
      const adv = $("#appDomainVersionCopyCard");
      const enVer = $("#enBrandVersionCopyCard");
      const ready = $("#serviceReadyCopyCard");
      const roundList = $("#roundLayerListCard");
      if (adv && adv.parentNode) adv.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode) enVer.insertAdjacentElement("beforebegin", card);
      else if (ready && ready.parentNode) ready.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const sv = h.server_version || "EInherit/0.5";
      const app = h.app || "电子继承 App";
      const line = sv + " · " + app;
      card.innerHTML = `<h3>服务端版本与中文品牌</h3>
        <p class="muted">一键复制服务端版本 + 中文品牌（演示级）。</p>
        <p class="server-app-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverAppCopyBtn">复制服务端版本与品牌</button>`;
      const btn = $("#serverAppCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务端版本与品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端版本与中文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList42() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 42;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 42); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round42 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAuditCount().catch(() => {}), 250);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdTitleCopyButtons().catch(() => {}), 160);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetTagPlatformCopyButtons().catch(() => {}), 160);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinEscalationCopy().catch(() => {}), 150);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelThresholdNumCopy().catch(() => {}), 170);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareTitleCityCopyButtons().catch(() => {}), 160);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthFilenameIdCopy().catch(() => {}), 130);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNameRelationCopyButtons().catch(() => {}), 160);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExportDomainCopy().catch(() => {}), 170);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeAuditCount().catch(() => {}), 250);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdTitleCopyButtons().catch(() => {}), 180);
    if (id === "assets")
      setTimeout(() => ensureAssetTagPlatformCopyButtons().catch(() => {}), 170);
    if (id === "checkin")
      setTimeout(() => ensureCheckinEscalationCopy().catch(() => {}), 170);
    if (id === "travel")
      setTimeout(() => ensureTravelThresholdNumCopy().catch(() => {}), 190);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareTitleCityCopyButtons().catch(() => {}), 180);
    if (id === "authvideo")
      setTimeout(() => ensureAuthFilenameIdCopy().catch(() => {}), 150);
    if (id === "heirs")
      setTimeout(() => ensureHeirNameRelationCopyButtons().catch(() => {}), 170);
    if (id === "handover")
      setTimeout(() => ensureHandoverExportDomainCopy().catch(() => {}), 180);
    if (id === "settings") {
      setTimeout(() => {
        paintServerAppCopyCard().catch(() => {});
        paintRoundLayerList42();
      }, 220);
      setTimeout(() => {
        paintServerAppCopyCard().catch(() => {});
        paintRoundLayerList42();
      }, 620);
    }
  };

  // Boot
  setTimeout(() => paintHomeAuditCount().catch(() => {}), 310);
  setTimeout(() => ensureLegacyIdTitleCopyButtons().catch(() => {}), 330);
  setTimeout(() => ensureAssetTagPlatformCopyButtons().catch(() => {}), 350);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinEscalationCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthFilenameIdCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerAppCopyCard().catch(() => {});
      paintRoundLayerList42();
    }, 240);
  }
})();
