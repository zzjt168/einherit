/* 电子继承 · 第一百六十二批增量（叠在 round161…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round162SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+版本+中文品牌冷静条 */
  async function paintHomeDomainVersionBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionBrandCalmBarR162");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR162";
      bar.className = "home-domain-version-brand-calm-r162";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandBrandEnOkCalmBarR161");
      const verOk = $("#homeVersionOkDomainCalmBarR160");
      const domainEn = $("#homeDomainBrandEnBrandCalmBarR159");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r162-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r162-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR162">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR162");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r162-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r162-sub">域名版本品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR162">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR162");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置方式+编号+受益人组合复制 */
  async function ensureLegacyDispositionIdBeneficiaryCopyButtons() {
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
      const id = it.id != null ? String(it.id) : "—";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = disposition + " · " + id + " · " + beneficiary;
      el.dataset.dispositionIdBeneficiaryR162 = line;
      if (el.querySelector(".lg-copy-disposition-id-beneficiary-r162")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-id-beneficiary-r162";
      btn.textContent = "复制处置编号受益人";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionIdBeneficiaryR162 || ""
        );
        softBanner(ok ? "已复制处置编号受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+标题+摘要组合复制 */
  async function ensureAssetCategoryTitleSummaryCopyButtons() {
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
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const title =
        String(it.title || it.platform || it.summary || "").trim() ||
        "无标题";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = category + " · " + title + " · " + summary;
      el.dataset.categoryTitleSummary = line;
      if (el.querySelector(".as-copy-category-title-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-title-summary";
      btn.textContent = "复制分类标题摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryTitleSummary || "");
        softBanner(ok ? "已复制分类标题摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+距上次标签 */
  async function ensureCheckinWindowEndsLastAgoPlainR162Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsLastAgoPlainR162CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsLastAgoPlainR162CopyCard";
      card.className = "checkin-window-ends-last-ago-plain-r162-copy";
      const nextStatus = $("#checkinNextAtStatusLabelPlainR161CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR160CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR159CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = windowEnds + " · " + lastAgo;
      const line =
        "报备窗口截止 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-last-ago-plain-r162-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsLastAgoPlainR162CopyBtn">复制窗口距上次R162</button>`;
      const btn = $("#checkinWindowEndsLastAgoPlainR162CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口距上次R162" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+已存+门槛三元复制 */
  async function ensureTravelProgressDepositedThresholdPlainR162Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressDepositedThresholdPlainR162CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressDepositedThresholdPlainR162CopyCard";
      card.className = "travel-progress-deposited-threshold-plain-r162-copy";
      const thrShort = $("#travelThresholdShortfallDepositedPlainR161CopyCard");
      const depBal = $("#travelDepositedBalanceShortfallPlainR160CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR159CopyCard");
      if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = pct + " · " + deposited + " · " + thr;
      const line =
        "差旅进度 · 已存 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-deposited-threshold-plain-r162-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressDepositedThresholdPlainR162CopyBtn">复制进度已存门槛</button>`;
      const btn = $("#travelProgressDepositedThresholdPlainR162CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度已存门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度已存门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+城市+科室组合复制 */
  async function ensureAftercareHospitalCityDepartmentCopyButtons() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const line = hospital + " · " + city + " · " + department;
      el.dataset.hospitalCityDepartmentR162 = line;
      if (el.querySelector(".ac-copy-hospital-city-department-r162")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-city-department-r162";
      btn.textContent = "复制医院城市科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalCityDepartmentR162 || "");
        softBanner(ok ? "已复制医院城市科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+缺失项+时长提示组合复制 */
  async function ensureAuthReadyMissingDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingDurationHintCopyR162Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingDurationHintCopyR162Card";
      card.className = "av-ready-missing-duration-hint-copy-r162";
      const durComplete = $("#avDurationHintCompleteReadyCopyR161Card");
      const missComplete = $("#avMissingCompleteReadyCopyR160Card");
      const readyDur = $("#avReadyDurationHintMissingCopyR159Card");
      if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = ready + " · " + missLabel + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-duration-hint-copy-r162-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingDurationHintCopyR162Btn">复制就绪缺失时长</button>`;
      const btn = $("#avReadyMissingDurationHintCopyR162Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪缺失时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪缺失时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+姓名组合复制 */
  async function ensureHeirIdRelationNameCopyButtons() {
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
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = id + " · " + relation + " · " + name;
      if (el.querySelector(".bn-copy-id-relation-name-r162")) return;
      el.dataset.idRelationNameR162 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-name-r162";
      btn.textContent = "复制编号关系姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationNameR162 || "");
        softBanner(ok ? "已复制编号关系姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+品牌+进度百分比组合复制 */
  async function ensureHandoverDoneBrandProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneBrandProgressPctCopyR162Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneBrandProgressPctCopyR162Card";
      card.className = "hand-done-brand-progress-pct-copy-r162";
      const secDom = $("#handSectionsDomainDoneCopyR161Card");
      const brandPct = $("#handBrandProgressPctDomainCopyR160Card");
      const pctSec = $("#handProgressPctSectionsDoneCopyR159Card");
      if (secDom && secDom.parentNode)
        secDom.insertAdjacentElement("afterend", card);
      else if (brandPct && brandPct.parentNode)
        brandPct.insertAdjacentElement("afterend", card);
      else if (pctSec && pctSec.parentNode)
        pctSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const combo = done + " · " + brand + " · " + pct;
      const line = "手册完成 · 品牌 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-brand-progress-pct-copy-r162-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneBrandProgressPctCopyR162Btn">复制完成品牌进度</button>`;
      const btn = $("#handDoneBrandProgressPctCopyR162Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成品牌进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成品牌进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+中文品牌+英文品牌+版本四元复制 + round 层含 162 */
  async function paintOkBrandBrandEnVersionR162CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandBrandEnVersionR162CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandBrandEnVersionR162CopyCard";
      card.className = "card settings-ok-brand-brand-en-version-r162-copy-card";
      const brandVer = $("#settingsBrandVersionDomainBrandEnR161CopyCard");
      const verOk = $("#settingsVersionOkBrandEnDomainR160CopyCard");
      const brandEn = $("#settingsBrandEnDomainBrandOkR159CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = okLabel + " · " + brand + " · " + en + " · " + ver;
      card.innerHTML = `<h3>就绪 · 品牌 · 英文 · 版本</h3>
        <p class="muted">一键复制就绪态、中文品牌、英文品牌与版本（演示级）。</p>
        <p class="settings-ok-brand-brand-en-version-r162-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandBrandEnVersionR162CopyBtn">复制就绪品牌英文版本</button>`;
      const btn = $("#settingsOkBrandBrandEnVersionR162CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪品牌英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 品牌 · 英文 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList162() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 162;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 162); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round162 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryTitleSummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsLastAgoPlainR162Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressDepositedThresholdPlainR162Copy().catch(
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
        ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationNameCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneBrandProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategoryTitleSummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsLastAgoPlainR162Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressDepositedThresholdPlainR162Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationNameCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneBrandProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandBrandEnVersionR162CopyCard().catch(() => {});
        paintRoundLayerList162();
      }, 890);
      setTimeout(() => {
        paintOkBrandBrandEnVersionR162CopyCard().catch(() => {});
        paintRoundLayerList162();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategoryTitleSummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsLastAgoPlainR162Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressDepositedThresholdPlainR162Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneBrandProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandBrandEnVersionR162CopyCard().catch(() => {});
      paintRoundLayerList162();
    }, 910);
  }
})();
