/* 电子继承 · 第一百三十一批增量（叠在 round130…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round131SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+版本+域名冷静条 */
  async function paintHomeOkVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkVersionDomainCalmBarR131");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkVersionDomainCalmBarR131";
      bar.className = "home-ok-version-domain-calm-r131";
      bar.setAttribute("role", "status");
      const brandOk = $("#homeBrandBrandEnOkCalmBarR130");
      const domEn = $("#homeDomainBrandEnVersionCalmBarR129");
      const okApp = $("#homeOkAppDomainCalmBarR128");
      if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (domEn && domEn.parentNode === home)
        domEn.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ready + " · " + ver + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-domain-calm-r131-mark">就绪</span>
        <span class="muted home-ok-version-domain-calm-r131-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionDomainCalmGoR131">去设置</button>`;
      const btn = $("#homeOkVersionDomainCalmGoR131");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-domain-calm-r131-mark">就绪</span>
        <span class="muted home-ok-version-domain-calm-r131-sub">就绪版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionDomainCalmGoR131">去设置</button>`;
      const btn = $("#homeOkVersionDomainCalmGoR131");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割状态+受益人+处置组合复制 */
  async function ensureLegacyStatusBeneficiaryDispositionCopyButtons() {
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
      const status =
        String(it.status || it.category || "").trim() || "未填状态";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = status + " · " + bene + " · " + disposition;
      el.dataset.statusBeneficiaryDisposition = line;
      if (el.querySelector(".lg-copy-status-beneficiary-disposition")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-status-beneficiary-disposition";
      btn.textContent = "复制状态受益人处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusBeneficiaryDisposition || "");
        softBanner(ok ? "已复制状态受益人处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标题+分类+平台组合复制 */
  async function ensureAssetTitleCategoryPlatformCopyButtons() {
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
      const title =
        String(it.title || it.summary || "").trim() || "无标题";
      const category =
        String(it.category || it.tag || "").trim() || "未填分类";
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = title + " · " + category + " · " + platform;
      el.dataset.titleCategoryPlatform = line;
      if (el.querySelector(".as-copy-title-category-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-title-category-platform";
      btn.textContent = "复制标题分类平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategoryPlatform || "");
        softBanner(ok ? "已复制标题分类平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+状态标签 */
  async function ensureCheckinWindowEndsStatusLabelPlainR131Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsStatusLabelPlainR131CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsStatusLabelPlainR131CopyCard";
      card.className = "checkin-window-ends-status-label-plain-r131-copy";
      const nextAgo = $("#checkinNextAtLastAgoPlainR130CopyCard");
      const graceHrs = $("#checkinGraceHoursRemainingPlainR129CopyCard");
      const hrsInt = $("#checkinHoursRemainingIntervalPlainR128CopyCard");
      if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
      else if (graceHrs && graceHrs.parentNode)
        graceHrs.insertAdjacentElement("afterend", card);
      else if (hrsInt && hrsInt.parentNode)
        hrsInt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const user = st.user || {};
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : cd.next_suggested_at != null
              ? String(cd.next_suggested_at)
              : String(cd.next_suggested_label || "").trim() || "—";
      const statusLabel =
        String(
          cd.status_label ||
            cd.countdown_label ||
            user.escalation_state ||
            ""
        ).trim() || "—";
      const combo = windowEnds + " · " + statusLabel;
      const line =
        "窗口截止 · 状态标签 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-status-label-plain-r131-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsStatusLabelPlainR131CopyBtn">复制窗口状态R131</button>`;
      const btn = $("#checkinWindowEndsStatusLabelPlainR131CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口状态R131" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+门槛+已存三元复制 */
  async function ensureTravelShortfallThresholdDepositedPlainR131Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdDepositedPlainR131CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdDepositedPlainR131CopyCard";
      card.className = "travel-shortfall-threshold-deposited-plain-r131-copy";
      const metProg = $("#travelMetProgressBalancePlainR130CopyCard");
      const balMet = $("#travelBalanceMetProgressPlainR129CopyCard");
      const shortProg = $("#travelShortfallProgressThresholdPlainR128CopyCard");
      if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (shortProg && shortProg.parentNode)
        shortProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const combo = short + " · " + thr + " · " + deposited;
      const line =
        "差旅缺口 · 门槛 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-deposited-plain-r131-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdDepositedPlainR131CopyBtn">复制缺口门槛已存</button>`;
      const btn = $("#travelShortfallThresholdDepositedPlainR131CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口门槛已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院名+科室+编号组合复制 */
  async function ensureAftercareHospitalDepartmentIdCopyButtons() {
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
      const hospital =
        String(it.hospital || it.city || it.title || "").trim() || "未填医院";
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const id = String(it.id);
      const line = hospital + " · " + department + " · #" + id;
      el.dataset.hospitalDepartmentId = line;
      if (el.querySelector(".ac-copy-hospital-department-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-department-id";
      btn.textContent = "复制医院科室编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalDepartmentId || "");
        softBanner(ok ? "已复制医院科室编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频标题+时长提示+就绪组合复制 */
  async function ensureAuthTitleDurationReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avTitleDurationReadyCopyR131Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avTitleDurationReadyCopyR131Card";
      card.className = "av-title-duration-ready-copy-r131";
      const completeReady = $("#avCompleteReadyMissingCopyR130Card");
      const completeGate = $("#avCompleteMissingGateCountR129CopyCard");
      const gateReady = $("#avGateReadyChecklistCountR128CopyCard");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const title =
        String(
          data.title ||
            latest.original_name ||
            latest.active_label ||
            (script0 && script0.title) ||
            ""
        ).trim() || "授权视频";
      const prog = data.progress || {};
      const durationHint =
        String(
          data.duration_hint ||
            (prog.done != null && prog.total != null
              ? prog.done + "/" + prog.total
              : "") ||
            (script0 && script0.hint) ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = title + " · " + durationHint + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-title-duration-ready-copy-r131-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avTitleDurationReadyCopyR131Btn">复制标题时长就绪</button>`;
      const btn = $("#avTitleDurationReadyCopyR131Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制标题时长就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">标题时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+联系方式组合复制 */
  async function ensureHeirNameRelationContactCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact-r131")) return;
      el.dataset.nameRelationContactR131 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact-r131";
      btn.textContent = "复制姓名关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContactR131 || "");
        softBanner(ok ? "已复制姓名关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+进度百分比组合复制 */
  async function ensureHandoverSectionsDoneProgressCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDoneProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDoneProgressCopyCard";
      card.className = "hand-sections-done-progress-copy";
      const brandProg = $("#handBrandProgressDomainCopyCard");
      const domItem = $("#handDomainItemCountVersionCopyCard");
      const todosDom = $("#handTodosDomainBrandCopyCard");
      if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
      else if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else if (todosDom && todosDom.parentNode)
        todosDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.total_types != null
            ? String(prog.total_types)
            : Array.isArray(prog.by_action)
              ? String(prog.by_action.length)
              : "—";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const combo = sections + " · " + done + " · " + pct + "%";
      const line = "手册章节 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-progress-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDoneProgressCopyBtn">复制章节完成进度</button>`;
      const btn = $("#handSectionsDoneProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节完成进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+版本+域名+就绪四元复制 + round 层含 131 */
  async function paintBrandEnVersionDomainOkR131CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnVersionDomainOkR131CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnVersionDomainOkR131CopyCard";
      card.className = "card settings-brand-en-version-domain-ok-r131-copy-card";
      const okBrand = $("#settingsOkBrandVersionDomainR130CopyCard");
      const verApp = $("#settingsVersionAppBrandEnOkR129CopyCard");
      const okEn = $("#settingsOkBrandEnDomainAppR128CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + ver + " · " + domain + " · " + ready;
      card.innerHTML = `<h3>英文 · 版本 · 域名 · 就绪</h3>
        <p class="muted">一键复制英文品牌、版本、域名与就绪状态（演示级）。</p>
        <p class="settings-brand-en-version-domain-ok-r131-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnVersionDomainOkR131CopyBtn">复制英文版本域名就绪</button>`;
      const btn = $("#settingsBrandEnVersionDomainOkR131CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文版本域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 版本 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList131() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 131;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 131); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round131 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkVersionDomain().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyStatusBeneficiaryDispositionCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTitleCategoryPlatformCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsStatusLabelPlainR131Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallThresholdDepositedPlainR131Copy().catch(
          () => {}
        ),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareHospitalDepartmentIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthTitleDurationReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDoneProgressCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkVersionDomain().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyStatusBeneficiaryDispositionCopyButtons().catch(
            () => {}
          ),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTitleCategoryPlatformCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsStatusLabelPlainR131Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdDepositedPlainR131Copy().catch(
            () => {}
          ),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthTitleDurationReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDoneProgressCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionDomainOkR131CopyCard().catch(() => {});
        paintRoundLayerList131();
      }, 710);
      setTimeout(() => {
        paintBrandEnVersionDomainOkR131CopyCard().catch(() => {});
        paintRoundLayerList131();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeOkVersionDomain().catch(() => {}), 870);
  setTimeout(
    () =>
      ensureLegacyStatusBeneficiaryDispositionCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetTitleCategoryPlatformCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsStatusLabelPlainR131Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdDepositedPlainR131Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthTitleDurationReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDoneProgressCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionDomainOkR131CopyCard().catch(() => {});
      paintRoundLayerList131();
    }, 730);
  }
})();
