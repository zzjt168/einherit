/* 电子继承 · 第一百五十四批增量（叠在 round153…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round154SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+域名+中文品牌冷静条 */
  async function paintHomeOkDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkDomainBrandCalmBarR154");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkDomainBrandCalmBarR154";
      bar.className = "home-ok-domain-brand-calm-r154";
      bar.setAttribute("role", "status");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR153");
      const enOk = $("#homeBrandEnOkDomainCalmBarR152");
      const brandDom = $("#homeBrandDomainOkCalmBarR151");
      if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = okLabel + " · " + domain + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-brand-calm-r154-mark">就绪</span>
        <span class="muted home-ok-domain-brand-calm-r154-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainBrandCalmGoR154">去设置</button>`;
      const btn = $("#homeOkDomainBrandCalmGoR154");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-brand-calm-r154-mark">就绪</span>
        <span class="muted home-ok-domain-brand-calm-r154-sub">就绪域名品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainBrandCalmGoR154">去设置</button>`;
      const btn = $("#homeOkDomainBrandCalmGoR154");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+受益人+标题组合复制 */
  async function ensureLegacyIdBeneficiaryTitleCopyButtons() {
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
      const id = it.id != null ? String(it.id) : "—";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const line = id + " · " + beneficiary + " · " + title;
      el.dataset.idBeneficiaryTitle = line;
      if (el.querySelector(".lg-copy-id-beneficiary-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-beneficiary-title";
      btn.textContent = "复制编号受益人标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idBeneficiaryTitle || "");
        softBanner(ok ? "已复制编号受益人标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+分类+标题组合复制 */
  async function ensureAssetTagCategoryTitleCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const title =
        String(it.title || it.platform || it.summary || "").trim() ||
        "无标题";
      const line = tag + " · " + category + " · " + title;
      el.dataset.tagCategoryTitle = line;
      if (el.querySelector(".as-copy-tag-category-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-category-title";
      btn.textContent = "复制标签分类标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagCategoryTitle || "");
        softBanner(ok ? "已复制标签分类标题" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+状态标签 */
  async function ensureCheckinWindowEndsStatusLabelPlainR154Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsStatusLabelPlainR154CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsStatusLabelPlainR154CopyCard";
      card.className = "checkin-window-ends-status-label-plain-r154-copy";
      const nextLast = $("#checkinNextAtLastAgoPlainR153CopyCard");
      const winLast = $("#checkinWindowEndsLastAgoPlainR152CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR151CopyCard");
      if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
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
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            cd.status ||
            ""
        ).trim() || "暂无状态";
      const combo = windowEnds + " · " + statusLabel;
      const line =
        "报备窗口截止 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-status-label-plain-r154-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsStatusLabelPlainR154CopyBtn">复制窗口状态R154</button>`;
      const btn = $("#checkinWindowEndsStatusLabelPlainR154CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口状态R154" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+余额+已存三元复制 */
  async function ensureTravelShortfallBalanceDepositedPlainR154Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallBalanceDepositedPlainR154CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallBalanceDepositedPlainR154CopyCard";
      card.className = "travel-shortfall-balance-deposited-plain-r154-copy";
      const balThr = $("#travelBalanceThresholdProgressPlainR153CopyCard");
      const progShort = $("#travelProgressShortfallDepositedPlainR152CopyCard");
      const depThr = $("#travelDepositedThresholdShortfallPlainR151CopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (progShort && progShort.parentNode)
        progShort.insertAdjacentElement("afterend", card);
      else if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = shortfall + " · " + bal + " · " + deposited;
      const line =
        "差旅短差 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-balance-deposited-plain-r154-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallBalanceDepositedPlainR154CopyBtn">复制短差余额已存</button>`;
      const btn = $("#travelShortfallBalanceDepositedPlainR154CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差余额已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+科室组合复制 */
  async function ensureAftercareCityHospitalDepartmentCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const hospital =
        String(it.hospital || it.facility || "").trim() || "未填医院";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = city + " · " + hospital + " · " + department;
      el.dataset.cityHospitalDepartment = line;
      if (el.querySelector(".ac-copy-city-hospital-department")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-hospital-department";
      btn.textContent = "复制城市医院科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityHospitalDepartment || "");
        softBanner(ok ? "已复制城市医院科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+缺失项+就绪组合复制 */
  async function ensureAuthDurationHintMissingReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintMissingReadyCopyR154Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintMissingReadyCopyR154Card";
      card.className = "av-duration-hint-missing-ready-copy-r154";
      const missReady = $("#avMissingReadyCompleteCopyR153Card");
      const readyComplete = $("#avReadyCompleteDurationCopyR152Card");
      const missDur = $("#avMissingDurationCompleteCopyR151Card");
      if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
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
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = duration + " · " + missLabel + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-missing-ready-copy-r154-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintMissingReadyCopyR154Btn">复制时长缺失就绪</button>`;
      const btn = $("#avDurationHintMissingReadyCopyR154Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长缺失就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长缺失就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+关系+编号组合复制 */
  async function ensureHeirPassphraseHintRelationIdCopyButtons() {
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
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const id = String(it.id);
      const line = phrase + " · " + relation + " · " + id;
      if (el.querySelector(".bn-copy-passphrase-hint-relation-id-r154")) return;
      el.dataset.passphraseHintRelationIdR154 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-hint-relation-id-r154";
      btn.textContent = "复制口令关系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseHintRelationIdR154 || "");
        softBanner(ok ? "已复制口令关系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+域名+章节数组合复制 */
  async function ensureHandoverProgressPctDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDomainSectionsCopyR154Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDomainSectionsCopyR154Card";
      card.className = "hand-progress-pct-domain-sections-copy-r154";
      const brandSec = $("#handBrandSectionsDoneCopyCard");
      const secDone = $("#handSectionsDonePctCopyCard");
      const doneBrand = $("#handDoneBrandDomainCopyCard");
      if (brandSec && brandSec.parentNode)
        brandSec.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = pct + " · " + domain + " · " + sectionsCount;
      const line = "手册进度 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-domain-sections-copy-r154-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDomainSectionsCopyR154Btn">复制进度域名章节</button>`;
      const btn = $("#handProgressPctDomainSectionsCopyR154Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度域名章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+中文品牌+域名+版本四元复制 + round 层含 154 */
  async function paintOkBrandDomainVersionR154CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandDomainVersionR154CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandDomainVersionR154CopyCard";
      card.className = "card settings-ok-brand-domain-version-r154-copy-card";
      const brandEn = $("#settingsBrandEnBrandVersionDomainR153CopyCard");
      const brandDom = $("#settingsBrandDomainVersionOkR152CopyCard");
      const domainOk = $("#settingsDomainOkVersionBrandEnR151CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = okLabel + " · " + brand + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>就绪 · 品牌 · 域名 · 版本</h3>
        <p class="muted">一键复制就绪态、中文品牌、域名与版本（演示级）。</p>
        <p class="settings-ok-brand-domain-version-r154-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandDomainVersionR154CopyBtn">复制就绪品牌域名版本</button>`;
      const btn = $("#settingsOkBrandDomainVersionR154CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪品牌域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 品牌 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList154() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 154;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 154); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round154 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdBeneficiaryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagCategoryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsStatusLabelPlainR154Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallBalanceDepositedPlainR154Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityHospitalDepartmentCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintMissingReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseHintRelationIdCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDomainSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdBeneficiaryTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagCategoryTitleCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsStatusLabelPlainR154Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallBalanceDepositedPlainR154Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalDepartmentCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintMissingReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirPassphraseHintRelationIdCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDomainSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandDomainVersionR154CopyCard().catch(() => {});
        paintRoundLayerList154();
      }, 890);
      setTimeout(() => {
        paintOkBrandDomainVersionR154CopyCard().catch(() => {});
        paintRoundLayerList154();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeOkDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyIdBeneficiaryTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagCategoryTitleCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsStatusLabelPlainR154Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallBalanceDepositedPlainR154Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintMissingReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseHintRelationIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandDomainVersionR154CopyCard().catch(() => {});
      paintRoundLayerList154();
    }, 910);
  }
})();
