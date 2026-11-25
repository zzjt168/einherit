/* 电子继承 · 第四十五批增量（叠在 round44…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round45SoftBanner_" + (hostId || "home");
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

  function serviceLabel(raw) {
    const map =
      typeof SERVICE_LABEL === "object" && SERVICE_LABEL
        ? SERVICE_LABEL
        : {
            delete_data: "删除电子数据",
            field_visit: "上门执行",
          };
    const k = String(raw || "");
    return map[k] || k || "未指定类型";
  }

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1" || v === "true";
  }

  /* 1 · 首页公司五部门已填数一句 */
  async function paintHomeCompanyFilled() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeCompanyFilledBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeCompanyFilledBar";
      bar.className = "home-company-filled-bar";
      bar.setAttribute("role", "status");
      const cover = $("#homeHandoverActionCoverBar");
      const counts = $("#homeCountsSummaryBar");
      const audit = $("#homeAuditCountBar");
      if (cover && cover.parentNode === home)
        cover.insertAdjacentElement("afterend", bar);
      else if (counts && counts.parentNode === home)
        counts.insertAdjacentElement("afterend", bar);
      else if (audit && audit.parentNode === home)
        audit.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/company").catch(() => ({}));
      const prog = data.progress || {};
      const filled = Number(prog.filled != null ? prog.filled : 0);
      const total = Number(prog.total != null ? prog.total : 5) || 5;
      bar.hidden = false;
      if (!filled) {
        bar.innerHTML = `<span class="home-company-filled-mark">公司盘点</span>
          <span class="muted home-company-filled-sub">五部门还可慢慢填 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeCompanyFilledGo">去公司</button>`;
      } else {
        bar.innerHTML = `<span class="home-company-filled-mark">公司盘点</span>
          <span class="muted home-company-filled-sub">五部门已填 ${filled}/${total} · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeCompanyFilledGo">去公司</button>`;
      }
      const btn = $("#homeCompanyFilledGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("company");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割出厂重置状态一键复制 */
  async function ensureLegacyFactoryResetCopyButtons() {
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
      const line = truthyFlag(it.factory_reset)
        ? "已勾出厂重置"
        : "未勾出厂重置";
      el.dataset.factoryResetLabel = line;
      if (el.querySelector(".lg-copy-factory-reset")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-factory-reset";
      btn.textContent = "复制出厂重置状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.factoryResetLabel || "");
        softBanner(ok ? "已复制出厂重置状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要纯文本一键复制 */
  async function ensureAssetSummaryOnlyCopyButtons() {
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
      const summary = String(it.summary || "").trim();
      el.dataset.summaryOnly = summary;
      if (!summary || el.querySelector(".as-copy-summary-only")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-only";
      btn.textContent = "复制摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryOnly || "");
        softBanner(ok ? "已复制摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制备用联系人首位电话 */
  async function ensureCheckinBackupPhoneCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinBackupPhoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinBackupPhoneCopyCard";
      card.className = "checkin-backup-phone-copy";
      const overdue = $("#checkinOverdueCalmCopyCard");
      const backup = $("#checkinBackupFirstCopyCard");
      const escCard = $("#checkinEscalationCopyCard");
      if (overdue && overdue.parentNode)
        overdue.insertAdjacentElement("afterend", card);
      else if (backup && backup.parentNode)
        backup.insertAdjacentElement("afterend", card);
      else if (escCard && escCard.parentNode)
        escCard.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const backups = (st.user || {}).backup_contacts || [];
      const first = backups[0] || {};
      const phone = String(first.phone || first.contact || "").trim();
      if (!phone) {
        card.innerHTML = `<p class="muted">暂无备用联系人电话 · 可先在设置里补充（演示）</p>`;
        return;
      }
      const line =
        "备用联系人首位电话 · " +
        phone +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-backup-phone-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinBackupPhoneCopyBtn">复制备用首位电话</button>`;
      const btn = $("#checkinBackupPhoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(phone);
          softBanner(ok ? "已复制备用首位电话" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">备用电话暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额纯数字一键复制 */
  async function ensureTravelBalanceNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceNumCopyCard";
      card.className = "travel-balance-num-copy";
      const pct = $("#travelProgressPctNumCopyCard");
      const ref = $("#travelAftercareRefCopyCard");
      const thr = $("#travelThresholdNumCopyCard");
      if (pct && pct.parentNode) pct.insertAdjacentElement("afterend", card);
      else if (ref && ref.parentNode)
        ref.insertAdjacentElement("afterend", card);
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
      const bal = Number(fund.balance != null ? fund.balance : 0);
      const num = String(Math.round(bal));
      const line = "差旅余额数字 · " + num;
      card.innerHTML = `<p class="muted travel-balance-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceNumCopyBtn">复制余额数字</button>`;
      const btn = $("#travelBalanceNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制余额数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额数字暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+服务类型组合复制 */
  async function ensureAftercareTitleServiceCopyButtons() {
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
      const title = String(it.title || "").trim();
      const svc = serviceLabel(it.service_type);
      const line = title && svc ? title + " · " + svc : title || svc;
      el.dataset.titleService = line;
      if (!line || el.querySelector(".ac-copy-title-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-service";
      btn.textContent = "复制标题与类型";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleService || "");
        softBanner(ok ? "已复制标题与类型" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门槛通过状态一键复制 */
  async function ensureAuthThresholdPassedCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avThresholdPassedCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avThresholdPassedCopyCard";
      card.className = "av-threshold-passed-copy";
      const label = $("#avActiveLabelCopyCard");
      const orig = $("#avOriginalNameCopyCard");
      const fnId = $("#avFilenameIdCopyCard");
      if (label && label.parentNode)
        label.insertAdjacentElement("afterend", card);
      else if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else if (fnId && fnId.parentNode)
        fnId.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const items = data.items || [];
      const active =
        (typeof data.current_active === "object" && data.current_active) ||
        data.latest ||
        items.find((it) => it.current_active) ||
        items[0] ||
        null;
      let passed = null;
      if (active && active.threshold_passed != null)
        passed = truthyFlag(active.threshold_passed);
      else if (data.ready != null) passed = !!data.ready;
      else if (data.complete != null) passed = !!data.complete;
      const status = passed ? "门槛已通过" : "门槛未通过";
      const line = "授权视频门槛 · " + status;
      card.innerHTML = `<p class="muted av-threshold-passed-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avThresholdPassedCopyBtn">复制门槛状态</button>`;
      const btn = $("#avThresholdPassedCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制门槛状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名组合复制 */
  async function ensureHeirIdNameCopyButtons() {
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
      const name = String(it.name || "").trim();
      const line = name ? "#" + it.id + " · " + name : "#" + it.id;
      el.dataset.idName = line;
      if (el.querySelector(".bn-copy-id-name")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name";
      btn.textContent = "复制编号与姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idName || "");
        softBanner(ok ? "已复制编号与姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册处置动作计数摘要一键复制 */
  async function ensureHandoverByActionCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handByActionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handByActionCopyCard";
      card.className = "hand-by-action-copy";
      const byDept = $("#handByDeptCopyCard");
      const member = $("#handMemberStatusCopyCard");
      const exportDom = $("#handExportDomainCopyCard");
      if (byDept && byDept.parentNode)
        byDept.insertAdjacentElement("afterend", card);
      else if (member && member.parentNode)
        member.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const rows = prog.by_action || [];
      const parts = rows.map((r) => {
        const action = String(r.action || "").trim();
        const n = Number(r.count != null ? r.count : 0);
        return action + " " + n;
      });
      const line = parts.length
        ? parts.join(" · ")
        : "处置动作计数暂无数据";
      card.innerHTML = `<p class="muted hand-by-action-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handByActionCopyBtn"${
          parts.length ? "" : " disabled"
        }>复制处置动作计数</button>`;
      const btn = $("#handByActionCopyBtn");
      if (btn && parts.length) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制处置动作计数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">处置动作计数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制应用版本+服务端版本 + round 层含 45 */
  async function paintAppServerVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appServerVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appServerVersionCopyCard";
      card.className = "card app-server-version-copy-card";
      const cnEn = $("#cnEnDomainCopyCard");
      const enDom = $("#enDomainServerCopyCard");
      const serverApp = $("#serverAppCopyCard");
      const roundList = $("#roundLayerListCard");
      if (cnEn && cnEn.parentNode)
        cnEn.insertAdjacentElement("beforebegin", card);
      else if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").replace(/^v/i, "");
      const sv = h.server_version || "EInherit/0.5";
      const line = "v" + ver + " · " + sv;
      card.innerHTML = `<h3>应用版本 · 服务端版本</h3>
        <p class="muted">一键复制应用版本号 + 服务端版本（演示级）。</p>
        <p class="app-server-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appServerVersionCopyBtn">复制应用与服务端版本</button>`;
      const btn = $("#appServerVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用与服务端版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本 · 服务端版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList45() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 45;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 45); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round45 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeCompanyFilled().catch(() => {}), 280);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyFactoryResetCopyButtons().catch(() => {}), 190);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetSummaryOnlyCopyButtons().catch(() => {}), 190);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinBackupPhoneCopy().catch(() => {}), 180);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceNumCopy().catch(() => {}), 200);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleServiceCopyButtons().catch(() => {}),
      190
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthThresholdPassedCopy().catch(() => {}), 160);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdNameCopyButtons().catch(() => {}), 190);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverByActionCopy().catch(() => {}), 200);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeCompanyFilled().catch(() => {}), 280);
    if (id === "legacy")
      setTimeout(() => ensureLegacyFactoryResetCopyButtons().catch(() => {}), 210);
    if (id === "assets")
      setTimeout(() => ensureAssetSummaryOnlyCopyButtons().catch(() => {}), 200);
    if (id === "checkin")
      setTimeout(() => ensureCheckinBackupPhoneCopy().catch(() => {}), 200);
    if (id === "travel")
      setTimeout(() => ensureTravelBalanceNumCopy().catch(() => {}), 220);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleServiceCopyButtons().catch(() => {}),
        210
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthThresholdPassedCopy().catch(() => {}), 180);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdNameCopyButtons().catch(() => {}), 200);
    if (id === "handover")
      setTimeout(() => ensureHandoverByActionCopy().catch(() => {}), 210);
    if (id === "settings") {
      setTimeout(() => {
        paintAppServerVersionCopyCard().catch(() => {});
        paintRoundLayerList45();
      }, 250);
      setTimeout(() => {
        paintAppServerVersionCopyCard().catch(() => {});
        paintRoundLayerList45();
      }, 680);
    }
  };

  // Boot
  setTimeout(() => paintHomeCompanyFilled().catch(() => {}), 340);
  setTimeout(() => ensureLegacyFactoryResetCopyButtons().catch(() => {}), 360);
  setTimeout(() => ensureAssetSummaryOnlyCopyButtons().catch(() => {}), 380);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinBackupPhoneCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthThresholdPassedCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverByActionCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppServerVersionCopyCard().catch(() => {});
      paintRoundLayerList45();
    }, 270);
  }
})();
