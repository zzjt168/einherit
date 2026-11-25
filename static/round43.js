/* 电子继承 · 第四十三批增量（叠在 round42…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round43SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页数据体量一句 */
  async function paintHomeCountsSummary() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeCountsSummaryBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeCountsSummaryBar";
      bar.className = "home-counts-summary-bar";
      bar.setAttribute("role", "status");
      const audit = $("#homeAuditCountBar");
      const ex = $("#homeExecutorLeadsBar");
      const icu = $("#homeIcuCountBar");
      if (audit && audit.parentNode === home)
        audit.insertAdjacentElement("afterend", bar);
      else if (ex && ex.parentNode === home)
        ex.insertAdjacentElement("afterend", bar);
      else if (icu && icu.parentNode === home)
        icu.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/counts-summary").catch(() => ({}));
      const text = String(data.text || "").trim();
      const n =
        (data.counts && Number(data.counts.legacy)) ||
        (data.counts && Number(data.counts.assets)) ||
        0;
      bar.hidden = false;
      if (!text && !n) {
        bar.innerHTML = `<span class="home-counts-mark">数据体量</span>
          <span class="muted home-counts-sub">可先记一条 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeCountsGo">去设置</button>`;
      } else {
        bar.innerHTML = `<span class="home-counts-mark">数据体量</span>
          <span class="muted home-counts-sub">${esc(
            text || "本机数据已就绪"
          )}</span>
          <button type="button" class="btn ghost sm" id="homeCountsGo">去设置</button>`;
      }
      const btn = $("#homeCountsGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割部门+处置组合复制 */
  async function ensureLegacyDeptActionCopyButtons() {
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
      const action = String(it.action || "").trim();
      const line =
        dept && action ? dept + " · " + action : dept || action;
      el.dataset.deptAction = line;
      if (!line || el.querySelector(".lg-copy-dept-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-action";
      btn.textContent = "复制部门与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptAction || "");
        softBanner(ok ? "已复制部门与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘部门+标签组合复制 */
  async function ensureAssetDeptTagCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      const line = dept && tag ? dept + " · " + tag : dept || tag;
      el.dataset.deptTag = line;
      if (!line || el.querySelector(".as-copy-dept-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dept-tag";
      btn.textContent = "复制部门与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptTag || "");
        softBanner(ok ? "已复制部门与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制备用联系人首位姓名 */
  async function ensureCheckinBackupFirstCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinBackupFirstCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinBackupFirstCopyCard";
      card.className = "checkin-backup-first-copy";
      const escCard = $("#checkinEscalationCopyCard");
      const until = $("#checkinMemberUntilCopyCard");
      const hours = $("#checkinIntervalHoursCopyCard");
      if (escCard && escCard.parentNode)
        escCard.insertAdjacentElement("afterend", card);
      else if (until && until.parentNode)
        until.insertAdjacentElement("afterend", card);
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
      const backups = (st.user || {}).backup_contacts || [];
      const first = backups[0] || {};
      const name = String(first.name || "").trim();
      if (!name) {
        card.innerHTML = `<p class="muted">暂无备用联系人姓名 · 可先在设置里补充（演示）</p>`;
        return;
      }
      const line =
        "备用联系人首位 · " + name + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-backup-first-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinBackupFirstCopyBtn">复制备用首位姓名</button>`;
      const btn = $("#checkinBackupFirstCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(name);
          softBanner(ok ? "已复制备用首位姓名" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">备用联系人暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水关联善后编号一键复制 */
  async function ensureTravelAftercareRefCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelAftercareRefCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelAftercareRefCopyCard";
      card.className = "travel-aftercare-ref-copy";
      const thr = $("#travelThresholdNumCopyCard");
      const lid = $("#travelLatestIdCopyCard");
      const amt = $("#travelLatestAmountCopyCard");
      if (thr && thr.parentNode) thr.insertAdjacentElement("afterend", card);
      else if (lid && lid.parentNode)
        lid.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode)
        amt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      const row = ledger[0] || {};
      const ref =
        row.aftercare_id != null
          ? row.aftercare_id
          : row.order_ref != null
            ? row.order_ref
            : row.order_id != null
              ? row.order_id
              : null;
      if (ref == null || ref === "") {
        card.innerHTML = `<p class="muted">最近流水暂无关联善后编号</p>`;
        return;
      }
      const num = String(ref);
      const line = "最近流水关联善后 · #" + num;
      card.innerHTML = `<p class="muted travel-aftercare-ref-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelAftercareRefCopyBtn">复制关联善后编号</button>`;
      const btn = $("#travelAftercareRefCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制关联善后编号" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">关联善后编号暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型一键复制 */
  async function ensureAftercareServiceTypeCopyButtons() {
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
      const label = serviceLabel(it.service_type);
      el.dataset.serviceTypeLabel = label;
      if (!label || el.querySelector(".ac-copy-service-type")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type";
      btn.textContent = "复制服务类型";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceTypeLabel || "");
        softBanner(ok ? "已复制服务类型" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频原文件名一键复制 */
  async function ensureAuthOriginalNameCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avOriginalNameCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avOriginalNameCopyCard";
      card.className = "av-original-name-copy";
      const fnId = $("#avFilenameIdCopyCard");
      const miss = $("#avMissingTextCopyCard");
      const note = $("#avActiveNoteCopyCard");
      if (fnId && fnId.parentNode) fnId.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode)
        note.insertAdjacentElement("afterend", card);
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
      const name = active
        ? String(active.original_name || active.filename || "").trim()
        : "";
      if (!name) {
        card.innerHTML = `<p class="muted">暂无生效视频原文件名</p>`;
        return;
      }
      const line = "生效视频原文件名 · " + name;
      card.innerHTML = `<p class="muted av-original-name-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avOriginalNameCopyBtn">复制原文件名</button>`;
      const btn = $("#avOriginalNameCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(name);
          softBanner(ok ? "已复制原文件名" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">原文件名暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式组合复制 */
  async function ensureHeirNameContactCopyButtons() {
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
      const contact = String(it.contact || "").trim();
      const line =
        name && contact ? name + " · " + contact : name || contact;
      el.dataset.nameContact = line;
      if (!line || el.querySelector(".bn-copy-name-contact")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact";
      btn.textContent = "复制姓名与联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContact || "");
        softBanner(ok ? "已复制姓名与联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册会员状态一键复制 */
  async function ensureHandoverMemberStatusCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handMemberStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handMemberStatusCopyCard";
      card.className = "hand-member-status-copy";
      const exportDom = $("#handExportDomainCopyCard");
      const domain = $("#handDomainOnlyCopyCard");
      const brand = $("#handBrandOnlyCopyCard");
      if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (domain && domain.parentNode)
        domain.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode)
        brand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const member = !!data.member;
      const status = member ? "会员已开通" : "会员未开通";
      const line = "手册会员状态 · " + status;
      card.innerHTML = `<p class="muted hand-member-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handMemberStatusCopyBtn">复制会员状态</button>`;
      const btn = $("#handMemberStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制会员状态" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员状态暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制英文品牌·域名·服务端版本 + round 层含 43 */
  async function paintEnDomainServerCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#enDomainServerCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "enDomainServerCopyCard";
      card.className = "card en-domain-server-copy-card";
      const serverApp = $("#serverAppCopyCard");
      const adv = $("#appDomainVersionCopyCard");
      const enVer = $("#enBrandVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (adv && adv.parentNode)
        adv.insertAdjacentElement("beforebegin", card);
      else if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = h.brand_en || "E-Inherit";
      const domain = h.domain || "einherit.cn";
      const sv = h.server_version || "EInherit/0.5";
      const line = en + " · " + domain + " · " + sv;
      card.innerHTML = `<h3>英文品牌 · 域名 · 服务端版本</h3>
        <p class="muted">一键复制英文品牌 + 域名 + 服务端版本（演示级）。</p>
        <p class="en-domain-server-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="enDomainServerCopyBtn">复制英文品牌·域名·版本</button>`;
      const btn = $("#enDomainServerCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌·域名·版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 域名 · 服务端版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList43() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 43;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 43); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round43 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeCountsSummary().catch(() => {}), 260);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyDeptActionCopyButtons().catch(() => {}), 170);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDeptTagCopyButtons().catch(() => {}), 170);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinBackupFirstCopy().catch(() => {}), 160);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelAftercareRefCopy().catch(() => {}), 180);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceTypeCopyButtons().catch(() => {}),
      170
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthOriginalNameCopy().catch(() => {}), 140);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNameContactCopyButtons().catch(() => {}), 170);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverMemberStatusCopy().catch(() => {}), 180);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeCountsSummary().catch(() => {}), 260);
    if (id === "legacy")
      setTimeout(() => ensureLegacyDeptActionCopyButtons().catch(() => {}), 190);
    if (id === "assets")
      setTimeout(() => ensureAssetDeptTagCopyButtons().catch(() => {}), 180);
    if (id === "checkin")
      setTimeout(() => ensureCheckinBackupFirstCopy().catch(() => {}), 180);
    if (id === "travel")
      setTimeout(() => ensureTravelAftercareRefCopy().catch(() => {}), 200);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceTypeCopyButtons().catch(() => {}),
        190
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthOriginalNameCopy().catch(() => {}), 160);
    if (id === "heirs")
      setTimeout(() => ensureHeirNameContactCopyButtons().catch(() => {}), 180);
    if (id === "handover")
      setTimeout(() => ensureHandoverMemberStatusCopy().catch(() => {}), 190);
    if (id === "settings") {
      setTimeout(() => {
        paintEnDomainServerCopyCard().catch(() => {});
        paintRoundLayerList43();
      }, 230);
      setTimeout(() => {
        paintEnDomainServerCopyCard().catch(() => {});
        paintRoundLayerList43();
      }, 640);
    }
  };

  // Boot
  setTimeout(() => paintHomeCountsSummary().catch(() => {}), 320);
  setTimeout(() => ensureLegacyDeptActionCopyButtons().catch(() => {}), 340);
  setTimeout(() => ensureAssetDeptTagCopyButtons().catch(() => {}), 360);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinBackupFirstCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelAftercareRefCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthOriginalNameCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverMemberStatusCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintEnDomainServerCopyCard().catch(() => {});
      paintRoundLayerList43();
    }, 250);
  }
})();
