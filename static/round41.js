/* 电子继承 · 第四十一批增量（叠在 round40…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round41SoftBanner_" + (hostId || "home");
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

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatTs(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  function formatDateOnly(raw) {
    if (raw == null || raw === "") return "";
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const t = parseTs(raw);
    if (!t) return s;
    try {
      return new Date(t * 1000).toISOString().slice(0, 10);
    } catch (_) {
      return s;
    }
  }

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    return shortMap[dept] || nameMap[dept] || String(dept || "");
  }

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  /* 1 · 首页执行人线索条数一句 */
  async function paintHomeExecutorLeads() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeExecutorLeadsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeExecutorLeadsBar";
      bar.className = "home-executor-leads-bar";
      bar.setAttribute("role", "status");
      const icu = $("#homeIcuCountBar");
      const med = $("#homeMedIntentsBar");
      const ex = $("#homeExecutorReadyBar");
      if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (med && med.parentNode === home) med.insertAdjacentElement("afterend", bar);
      else if (ex && ex.parentNode === home) ex.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/executor-lead").catch(() => ({ items: [] }));
      const n = (data.items || []).length;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-ex-mark">执行人加盟</span>
          <span class="muted home-ex-sub">可先了解 · 按自己节奏提交意向</span>
          <button type="button" class="btn ghost sm" id="homeExecLeadGo">去加盟</button>`;
      } else {
        bar.innerHTML = `<span class="home-ex-mark">执行人线索</span>
          <span class="muted home-ex-sub">已提交 ${n} 条 · 名单可随时补</span>
          <button type="button" class="btn ghost sm" id="homeExecLeadGo">去加盟</button>`;
      }
      const btn = $("#homeExecLeadGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("executor");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题+部门组合复制 */
  async function ensureLegacyTitleDeptCopyButtons() {
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
      const dept = deptLabel(it.dept) || String(it.dept || "");
      const line = title && dept ? title + " · " + dept : title || dept;
      el.dataset.titleDept = line;
      if (!line || el.querySelector(".lg-copy-title-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-dept";
      btn.textContent = "复制标题与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDept || "");
        softBanner(ok ? "已复制标题与部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘复习日一键复制 */
  async function ensureAssetReviewAtCopyButtons() {
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
      const day = formatDateOnly(it.review_at);
      el.dataset.reviewDay = day;
      let btn = el.querySelector(".as-copy-review");
      if (!day) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-review";
      btn.textContent = "复制复习日";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.reviewDay || "");
        softBanner(ok ? "已复制复习日" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员到期日 */
  async function ensureCheckinMemberUntilCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberUntilCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberUntilCopyCard";
      card.className = "checkin-member-until-copy";
      const hours = $("#checkinIntervalHoursCopyCard");
      const hard = $("#checkinHardDueCopyCard");
      const days = $("#checkinMemberDaysCopyCard");
      if (hours && hours.parentNode) hours.insertAdjacentElement("afterend", card);
      else if (hard && hard.parentNode) hard.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode) days.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const u = st.user || {};
      const until = String(u.member_until_iso || "").trim() || formatDateOnly(u.member_until);
      const line = until
        ? "会员到期日 · " + until + "（电子继承 · 演示）"
        : u.is_member
          ? "会员已开通 · 到期日暂不可用"
          : "会员未开通";
      card.innerHTML = `<p class="muted checkin-member-until-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberUntilCopyBtn"${
          until ? "" : " disabled"
        }>复制会员到期日</button>`;
      const btn = $("#checkinMemberUntilCopyBtn");
      if (btn && until) {
        btn.onclick = async () => {
          const ok = await copyText(until);
          softBanner(ok ? "已复制会员到期日" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员到期日暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水编号一键复制 */
  async function ensureTravelLatestIdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLatestIdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLatestIdCopyCard";
      card.className = "travel-latest-id-copy";
      const amt = $("#travelLatestAmountCopyCard");
      const kind = $("#travelKindLabelCopyCard");
      const note = $("#travelLatestNoteCopyCard");
      if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else if (kind && kind.parentNode) kind.insertAdjacentElement("afterend", card);
      else if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      const id = ledger[0] && ledger[0].id != null ? String(ledger[0].id) : "";
      const line = id ? "最近流水编号 · " + id : "暂无流水编号";
      card.innerHTML = `<p class="muted travel-latest-id-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelLatestIdCopyBtn"${
          id ? "" : " disabled"
        }>复制流水编号</button>`;
      const btn = $("#travelLatestIdCopyBtn");
      if (btn && id) {
        btn.onclick = async () => {
          const ok = await copyText(id);
          softBanner(ok ? "已复制流水编号" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水编号暂不可用</p>`;
    }
  }

  /* 6 · 善后预算标签一键复制 */
  async function ensureAftercareBudgetLabelCopyButtons() {
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
      const label =
        String(it.travel_budget_label || "").trim() ||
        (it.travel_budget != null ? "¥" + it.travel_budget : "");
      el.dataset.budgetLabel = label;
      let btn = el.querySelector(".ac-copy-budget-label");
      if (!label) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-label";
      btn.textContent = "复制预算标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetLabel || "");
        softBanner(ok ? "已复制预算标签" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门槛说明一键复制 */
  async function ensureAuthMissingTextCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingTextCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingTextCopyCard";
      card.className = "av-missing-text-copy";
      const note = $("#avActiveNoteCopyCard");
      const prog = $("#avProgressCopyCard");
      const complete = $("#avCompleteLabelCopyCard");
      if (note && note.parentNode) note.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const line =
        String(st.missing_text || "").trim() ||
        (st.ready || st.complete
          ? "三项已齐备，可按自己的节奏提交善后工单。"
          : "授权视频门槛说明暂不可用");
      card.innerHTML = `<p class="muted av-missing-text-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avMissingTextCopyBtn">复制门槛说明</button>`;
      const btn = $("#avMissingTextCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制门槛说明" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛说明暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+角色组合复制 */
  async function ensureHeirContactRoleCopyButtons() {
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
      const role = roleLabel(it.role);
      const line = contact && role ? contact + " · " + role : contact || role;
      el.dataset.contactRole = line;
      if (!line || el.querySelector(".bn-copy-contact-role")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-role";
      btn.textContent = "复制联系与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRole || "");
        softBanner(ok ? "已复制联系与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名一键复制 */
  async function ensureHandoverDomainOnlyCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainOnlyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainOnlyCopyCard";
      card.className = "hand-domain-only-copy";
      const brand = $("#handBrandOnlyCopyCard");
      const items = $("#handItemCountCopyCard");
      const execDom = $("#handExecutorDomainCopyCard");
      if (brand && brand.parentNode) brand.insertAdjacentElement("afterend", card);
      else if (items && items.parentNode) items.insertAdjacentElement("afterend", card);
      else if (execDom && execDom.parentNode)
        execDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "einherit.cn").trim();
      card.innerHTML = `<p class="muted hand-domain-only-copy-line">${esc(domain)}</p>
        <button type="button" class="btn ghost sm" id="handDomainOnlyCopyBtn">复制手册域名</button>`;
      const btn = $("#handDomainOnlyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(domain);
          softBanner(ok ? "已复制手册域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制中文品牌·域名·版本 + round 层含 41 */
  async function paintAppDomainVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainVersionCopyCard";
      card.className = "card app-domain-version-copy-card";
      const enVer = $("#enBrandVersionCopyCard");
      const ready = $("#serviceReadyCopyCard");
      const align = $("#exportAlignCopyCard");
      const roundList = $("#roundLayerListCard");
      if (enVer && enVer.parentNode) enVer.insertAdjacentElement("beforebegin", card);
      else if (ready && ready.parentNode) ready.insertAdjacentElement("beforebegin", card);
      else if (align && align.parentNode) align.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const app = h.app || "电子继承 App";
      const domain = h.domain || "einherit.cn";
      const ver = h.version || "0.5.0";
      const line = app + " · " + domain + " · v" + ver;
      card.innerHTML = `<h3>中文品牌 · 域名 · 版本</h3>
        <p class="muted">一键复制中文品牌、域名与版本（演示级）。</p>
        <p class="app-domain-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainVersionCopyBtn">复制品牌域名版本</button>`;
      const btn = $("#appDomainVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList41() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 41;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 41); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round41 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeExecutorLeads().catch(() => {}), 240);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyTitleDeptCopyButtons().catch(() => {}), 150);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetReviewAtCopyButtons().catch(() => {}), 150);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberUntilCopy().catch(() => {}), 140);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLatestIdCopy().catch(() => {}), 160);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareBudgetLabelCopyButtons().catch(() => {}), 150);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthMissingTextCopy().catch(() => {}), 120);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirContactRoleCopyButtons().catch(() => {}), 150);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverDomainOnlyCopy().catch(() => {}), 160);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeExecutorLeads().catch(() => {}), 240);
    if (id === "legacy")
      setTimeout(() => ensureLegacyTitleDeptCopyButtons().catch(() => {}), 170);
    if (id === "assets")
      setTimeout(() => ensureAssetReviewAtCopyButtons().catch(() => {}), 160);
    if (id === "checkin")
      setTimeout(() => ensureCheckinMemberUntilCopy().catch(() => {}), 160);
    if (id === "travel") setTimeout(() => ensureTravelLatestIdCopy().catch(() => {}), 180);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareBudgetLabelCopyButtons().catch(() => {}), 170);
    if (id === "authvideo")
      setTimeout(() => ensureAuthMissingTextCopy().catch(() => {}), 140);
    if (id === "heirs")
      setTimeout(() => ensureHeirContactRoleCopyButtons().catch(() => {}), 160);
    if (id === "handover")
      setTimeout(() => ensureHandoverDomainOnlyCopy().catch(() => {}), 170);
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainVersionCopyCard().catch(() => {});
        paintRoundLayerList41();
      }, 210);
      setTimeout(() => {
        paintAppDomainVersionCopyCard().catch(() => {});
        paintRoundLayerList41();
      }, 600);
    }
  };

  // Boot
  setTimeout(() => paintHomeExecutorLeads().catch(() => {}), 300);
  setTimeout(() => ensureLegacyTitleDeptCopyButtons().catch(() => {}), 320);
  setTimeout(() => ensureAssetReviewAtCopyButtons().catch(() => {}), 340);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberUntilCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLatestIdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetLabelCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingTextCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainOnlyCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainVersionCopyCard().catch(() => {});
      paintRoundLayerList41();
    }, 230);
  }
})();
