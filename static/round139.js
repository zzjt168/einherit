/* 电子继承 · 第一百三十九批增量（叠在 round138…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round139SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+域名+版本冷静条 */
  async function paintHomeBrandDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainVersionCalmBarR139");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainVersionCalmBarR139";
      bar.className = "home-brand-domain-version-calm-r139";
      bar.setAttribute("role", "status");
      const okEn = $("#homeOkBrandEnVersionCalmBarR138");
      const domVer = $("#homeDomainVersionBrandCalmBarR137");
      const verEn = $("#homeVersionBrandEnOkCalmBarR136");
      if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = brand + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r139-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r139-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR139">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR139");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r139-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r139-sub">品牌域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR139">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR139");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+状态+标题组合复制 */
  async function ensureLegacyDispositionStatusTitleCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const title = String(it.title || "").trim() || "无标题";
      const line = disposition + " · " + status + " · " + title;
      el.dataset.dispositionStatusTitle = line;
      if (el.querySelector(".lg-copy-disposition-status-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-status-title";
      btn.textContent = "复制处置状态标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionStatusTitle || "");
        softBanner(ok ? "已复制处置状态标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+平台+分类组合复制 */
  async function ensureAssetSummaryPlatformCategoryCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const platform = String(it.platform || "").trim() || "未填平台";
      const category =
        String(it.category || it.tag || "").trim() || "未填分类";
      const line = summary + " · " + platform + " · " + category;
      el.dataset.summaryPlatformCategory = line;
      if (el.querySelector(".as-copy-summary-platform-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-platform-category";
      btn.textContent = "复制摘要平台分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryPlatformCategory || "");
        softBanner(ok ? "已复制摘要平台分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+距上次标签 */
  async function ensureCheckinWindowEndsLastAgoPlainR139Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsLastAgoPlainR139CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsLastAgoPlainR139CopyCard";
      card.className = "checkin-window-ends-last-ago-plain-r139-copy";
      const statusAgo = $("#checkinStatusLabelLastAgoPlainR138CopyCard");
      const lastNext = $("#checkinLastAgoNextAtPlainR137CopyCard");
      const statusWin = $("#checkinStatusLabelWindowEndsPlainR136CopyCard");
      if (statusAgo && statusAgo.parentNode)
        statusAgo.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
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
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const lastAgo =
        String(cd.last_ago_label || st.last_ago_label || "").trim() || "—";
      const combo = windowEnds + " · " + lastAgo;
      const line =
        "窗口截止 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-last-ago-plain-r139-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsLastAgoPlainR139CopyBtn">复制窗口距上次R139</button>`;
      const btn = $("#checkinWindowEndsLastAgoPlainR139CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口距上次R139" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+短差+达标三元复制 */
  async function ensureTravelDepositedShortfallMetPlainR139Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallMetPlainR139CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallMetPlainR139CopyCard";
      card.className = "travel-deposited-shortfall-met-plain-r139-copy";
      const thrProg = $("#travelThresholdProgressMetPlainR138CopyCard");
      const progDep = $("#travelProgressDepositedBalancePlainR137CopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainR136CopyCard");
      if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
      else if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = deposited + " · " + short + " · " + met;
      const line =
        "差旅已存 · 缺口 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-shortfall-met-plain-r139-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallMetPlainR139CopyBtn">复制已存缺口达标</button>`;
      const btn = $("#travelDepositedShortfallMetPlainR139CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存缺口达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存缺口达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+科室+服务类型组合复制 */
  async function ensureAftercareIdDepartmentServiceCopyButtons() {
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
      const id = String(it.id);
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = "#" + id + " · " + department + " · " + service;
      el.dataset.idDepartmentService = line;
      if (el.querySelector(".ac-copy-id-department-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-department-service";
      btn.textContent = "复制编号科室服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDepartmentService || "");
        softBanner(ok ? "已复制编号科室服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+缺失项+标题组合复制 */
  async function ensureAuthCompleteMissingTitleCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingTitleCopyR139Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingTitleCopyR139Card";
      card.className = "av-complete-missing-title-copy-r139";
      const missDur = $("#avMissingDurationReadyCopyR138Card");
      const titleReady = $("#avTitleReadyCompleteCopyR137Card");
      const durMiss = $("#avDurationMissingCompleteCopyR136Card");
      if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (titleReady && titleReady.parentNode)
        titleReady.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
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
      const combo = complete + " · " + missLabel + " · " + title;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-title-copy-r139-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingTitleCopyR139Btn">复制完成缺失标题</button>`;
      const btn = $("#avCompleteMissingTitleCopyR139Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+口令提示组合复制 */
  async function ensureHeirRelationNamePassphraseCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const line = relation + " · " + name + " · " + passphrase;
      if (el.querySelector(".bn-copy-relation-name-passphrase")) return;
      el.dataset.relationNamePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-passphrase";
      btn.textContent = "复制关系姓名口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNamePassphrase || "");
        softBanner(ok ? "已复制关系姓名口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+进度百分比+章节数组合复制 */
  async function ensureHandoverBrandProgressSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandProgressSectionsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandProgressSectionsCopyCard";
      card.className = "hand-brand-progress-sections-copy";
      const progDom = $("#handProgressDomainSectionsCopyCard");
      const doneSec = $("#handDoneSectionsBrandCopyCard");
      const secBrand = $("#handSectionsBrandDomainCopyCard");
      if (progDom && progDom.parentNode)
        progDom.insertAdjacentElement("afterend", card);
      else if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = brand + " · " + pct + "% · " + sectionsCount;
      const line = "手册品牌 · 进度 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-progress-sections-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandProgressSectionsCopyBtn">复制品牌进度章节</button>`;
      const btn = $("#handBrandProgressSectionsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌进度章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌进度章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+域名+就绪四元复制 + round 层含 139 */
  async function paintBrandBrandEnDomainOkR139CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandBrandEnDomainOkR139CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandBrandEnDomainOkR139CopyCard";
      card.className = "card settings-brand-brand-en-domain-ok-r139-copy-card";
      const okVer = $("#settingsOkVersionDomainBrandEnR138CopyCard");
      const domVer = $("#settingsDomainVersionBrandEnBrandR137CopyCard");
      const verOk = $("#settingsVersionBrandEnBrandOkR136CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = brand + " · " + en + " · " + domain + " · " + ready;
      card.innerHTML = `<h3>品牌 · 英文 · 域名 · 就绪</h3>
        <p class="muted">一键复制中文品牌、英文品牌、域名与就绪状态（演示级）。</p>
        <p class="settings-brand-brand-en-domain-ok-r139-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandBrandEnDomainOkR139CopyBtn">复制品牌英文域名就绪</button>`;
      const btn = $("#settingsBrandBrandEnDomainOkR139CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌英文域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 英文 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList139() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 139;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 139); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round139 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 860);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionStatusTitleCopyButtons().catch(() => {}),
      690
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryPlatformCategoryCopyButtons().catch(() => {}),
      690
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsLastAgoPlainR139Copy().catch(() => {}),
      680
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedShortfallMetPlainR139Copy().catch(() => {}),
      700
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdDepartmentServiceCopyButtons().catch(() => {}),
      690
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingTitleCopy().catch(() => {}),
      660
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNamePassphraseCopyButtons().catch(() => {}),
      690
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandProgressSectionsCopy().catch(() => {}),
      700
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 860);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDispositionStatusTitleCopyButtons().catch(() => {}),
        710
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryPlatformCategoryCopyButtons().catch(() => {}),
        700
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsLastAgoPlainR139Copy().catch(() => {}),
        700
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallMetPlainR139Copy().catch(() => {}),
        720
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdDepartmentServiceCopyButtons().catch(() => {}),
        710
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingTitleCopy().catch(() => {}),
        680
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNamePassphraseCopyButtons().catch(() => {}),
        700
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandProgressSectionsCopy().catch(() => {}),
        710
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandBrandEnDomainOkR139CopyCard().catch(() => {});
        paintRoundLayerList139();
      }, 750);
      setTimeout(() => {
        paintBrandBrandEnDomainOkR139CopyCard().catch(() => {});
        paintRoundLayerList139();
      }, 1430);
    }
  };

  setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 910);
  setTimeout(
    () => ensureLegacyDispositionStatusTitleCopyButtons().catch(() => {}),
    930
  );
  setTimeout(
    () => ensureAssetSummaryPlatformCategoryCopyButtons().catch(() => {}),
    950
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsLastAgoPlainR139Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallMetPlainR139Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdDepartmentServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingTitleCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNamePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandProgressSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandBrandEnDomainOkR139CopyCard().catch(() => {});
      paintRoundLayerList139();
    }, 770);
  }
})();
