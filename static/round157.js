/* 电子继承 · 第一百五十七批增量（叠在 round156…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round157SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+英文品牌+域名冷静条 */
  async function paintHomeOkBrandEnDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnDomainCalmBarR157");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnDomainCalmBarR157";
      bar.className = "home-ok-brand-en-domain-calm-r157";
      bar.setAttribute("role", "status");
      const domainBrand = $("#homeDomainBrandVersionCalmBarR156");
      const brandEn = $("#homeBrandEnVersionOkCalmBarR155");
      const okDom = $("#homeOkDomainBrandCalmBarR154");
      if (domainBrand && domainBrand.parentNode === home)
        domainBrand.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = okLabel + " · " + en + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-domain-calm-r157-mark">就绪</span>
        <span class="muted home-ok-brand-en-domain-calm-r157-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnDomainCalmGoR157">去设置</button>`;
      const btn = $("#homeOkBrandEnDomainCalmGoR157");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-domain-calm-r157-mark">就绪</span>
        <span class="muted home-ok-brand-en-domain-calm-r157-sub">就绪英文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnDomainCalmGoR157">去设置</button>`;
      const btn = $("#homeOkBrandEnDomainCalmGoR157");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置方式+编号组合复制 */
  async function ensureLegacyTitleDispositionIdCopyButtons() {
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
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const id = it.id != null ? String(it.id) : "—";
      const line = title + " · " + disposition + " · " + id;
      el.dataset.titleDispositionId = line;
      if (el.querySelector(".lg-copy-title-disposition-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-id";
      btn.textContent = "复制标题处置编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDispositionId || "");
        softBanner(ok ? "已复制标题处置编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标题+平台+分类组合复制 */
  async function ensureAssetTitlePlatformCategoryCopyButtons() {
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
        String(it.title || it.summary || it.platform || "").trim() ||
        "无标题";
      const platform =
        String(it.platform || "").trim() || "未填平台";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const line = title + " · " + platform + " · " + category;
      el.dataset.titlePlatformCategory = line;
      if (el.querySelector(".as-copy-title-platform-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-title-platform-category";
      btn.textContent = "复制标题平台分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titlePlatformCategory || "");
        softBanner(ok ? "已复制标题平台分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+窗口截止 */
  async function ensureCheckinLastAgoWindowEndsPlainR157Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoWindowEndsPlainR157CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoWindowEndsPlainR157CopyCard";
      card.className = "checkin-last-ago-window-ends-plain-r157-copy";
      const statusNext = $("#checkinStatusLabelNextAtPlainR156CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR155CopyCard");
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR154CopyCard");
      if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const combo = lastAgo + " · " + windowEnds;
      const line =
        "报备距上次 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-window-ends-plain-r157-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoWindowEndsPlainR157CopyBtn">复制距上次窗口R157</button>`;
      const btn = $("#checkinLastAgoWindowEndsPlainR157CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次窗口R157" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+短差+进度百分比三元复制 */
  async function ensureTravelDepositedShortfallProgressPlainR157Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallProgressPlainR157CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallProgressPlainR157CopyCard";
      card.className = "travel-deposited-shortfall-progress-plain-r157-copy";
      const progThr = $("#travelProgressThresholdShortfallPlainR156CopyCard");
      const thrDep = $("#travelThresholdDepositedBalancePlainR155CopyCard");
      const shortBal = $("#travelShortfallBalanceDepositedPlainR154CopyCard");
      if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else if (thrDep && thrDep.parentNode)
        thrDep.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const combo = deposited + " · " + shortfall + " · " + pct;
      const line =
        "差旅已存 · 短差 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-shortfall-progress-plain-r157-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallProgressPlainR157CopyBtn">复制已存短差进度</button>`;
      const btn = $("#travelDepositedShortfallProgressPlainR157CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存短差进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存短差进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+状态+医院组合复制 */
  async function ensureAftercareServiceStatusHospitalCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status =
        String(
          it.status_label || it.status || it.status_key || it.title || ""
        ).trim() || "未填状态";
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const line = service + " · " + status + " · " + hospital;
      el.dataset.serviceStatusHospitalR157 = line;
      if (el.querySelector(".ac-copy-service-status-hospital-r157")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-status-hospital-r157";
      btn.textContent = "复制服务状态医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceStatusHospitalR157 || "");
        softBanner(ok ? "已复制服务状态医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成态组合复制 */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR157Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR157Card";
      card.className = "av-duration-hint-ready-complete-copy-r157";
      const readyMiss = $("#avReadyMissingCompleteCopyR156Card");
      const completeDur = $("#avCompleteDurationHintMissingCopyR155Card");
      const durMiss = $("#avDurationHintMissingReadyCopyR154Card");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r157-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR157Btn">复制时长就绪完成</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR157Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+口令提示+姓名组合复制 */
  async function ensureHeirContactPassphraseHintNameCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = contact + " · " + phrase + " · " + name;
      if (el.querySelector(".bn-copy-contact-passphrase-hint-name-r157"))
        return;
      el.dataset.contactPassphraseHintNameR157 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-passphrase-hint-name-r157";
      btn.textContent = "复制联系口令姓名";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.contactPassphraseHintNameR157 || ""
        );
        softBanner(ok ? "已复制联系口令姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+品牌+进度百分比组合复制 */
  async function ensureHandoverSectionsBrandProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsBrandProgressPctCopyR157Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsBrandProgressPctCopyR157Card";
      card.className = "hand-sections-brand-progress-pct-copy-r157";
      const domainDone = $("#handDomainDoneSectionsCopyR156Card");
      const donePct = $("#handDoneProgressPctBrandCopyR155Card");
      const pctDom = $("#handProgressPctDomainSectionsCopyR154Card");
      if (domainDone && domainDone.parentNode)
        domainDone.insertAdjacentElement("afterend", card);
      else if (donePct && donePct.parentNode)
        donePct.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const combo = sectionsCount + " · " + brand + " · " + pct;
      const line = "手册章节 · 品牌 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-brand-progress-pct-copy-r157-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsBrandProgressPctCopyR157Btn">复制章节品牌进度</button>`;
      const btn = $("#handSectionsBrandProgressPctCopyR157Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节品牌进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节品牌进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+域名+英文品牌+版本四元复制 + round 层含 157 */
  async function paintOkDomainBrandEnVersionR157CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkDomainBrandEnVersionR157CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkDomainBrandEnVersionR157CopyCard";
      card.className = "card settings-ok-domain-brand-en-version-r157-copy-card";
      const domainVer = $("#settingsDomainVersionBrandBrandEnR156CopyCard");
      const verEn = $("#settingsVersionBrandEnOkBrandR155CopyCard");
      const okBrand = $("#settingsOkBrandDomainVersionR154CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domainVer && domainVer.parentNode)
        domainVer.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = okLabel + " · " + domain + " · " + en + " · " + ver;
      card.innerHTML = `<h3>就绪 · 域名 · 英文 · 版本</h3>
        <p class="muted">一键复制就绪态、域名、英文品牌与版本（演示级）。</p>
        <p class="settings-ok-domain-brand-en-version-r157-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkDomainBrandEnVersionR157CopyBtn">复制就绪域名英文版本</button>`;
      const btn = $("#settingsOkDomainBrandEnVersionR157CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 英文 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList157() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 157;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 157); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round157 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDispositionIdCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTitlePlatformCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoWindowEndsPlainR157Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedShortfallProgressPlainR157Copy().catch(
          () => {}
        ),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirContactPassphraseHintNameCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsBrandProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleDispositionIdCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTitlePlatformCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoWindowEndsPlainR157Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallProgressPlainR157Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirContactPassphraseHintNameCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsBrandProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainBrandEnVersionR157CopyCard().catch(() => {});
        paintRoundLayerList157();
      }, 890);
      setTimeout(() => {
        paintOkDomainBrandEnVersionR157CopyCard().catch(() => {});
        paintRoundLayerList157();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeOkBrandEnDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleDispositionIdCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTitlePlatformCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoWindowEndsPlainR157Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallProgressPlainR157Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactPassphraseHintNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsBrandProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainBrandEnVersionR157CopyCard().catch(() => {});
      paintRoundLayerList157();
    }, 910);
  }
})();
