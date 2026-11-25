/* 电子继承 · 第一百五十八批增量（叠在 round157…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round158SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+就绪+版本冷静条 */
  async function paintHomeBrandOkVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandOkVersionCalmBarR158");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandOkVersionCalmBarR158";
      bar.className = "home-brand-ok-version-calm-r158";
      bar.setAttribute("role", "status");
      const okEn = $("#homeOkBrandEnDomainCalmBarR157");
      const domainBrand = $("#homeDomainBrandVersionCalmBarR156");
      const brandEn = $("#homeBrandEnVersionOkCalmBarR155");
      if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (domainBrand && domainBrand.parentNode === home)
        domainBrand.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
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
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = brand + " · " + okLabel + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-ok-version-calm-r158-mark">品牌</span>
        <span class="muted home-brand-ok-version-calm-r158-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandOkVersionCalmGoR158">去设置</button>`;
      const btn = $("#homeBrandOkVersionCalmGoR158");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-ok-version-calm-r158-mark">品牌</span>
        <span class="muted home-brand-ok-version-calm-r158-sub">品牌就绪版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandOkVersionCalmGoR158">去设置</button>`;
      const btn = $("#homeBrandOkVersionCalmGoR158");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+设备归属+标题组合复制 */
  async function ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const line = beneficiary + " · " + owner + " · " + title;
      el.dataset.beneficiaryDeviceOwnerTitle = line;
      if (el.querySelector(".lg-copy-beneficiary-device-owner-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-device-owner-title";
      btn.textContent = "复制受益人归属标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryDeviceOwnerTitle || "");
        softBanner(ok ? "已复制受益人归属标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+平台组合复制 */
  async function ensureAssetSummaryTagPlatformCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || "").trim() || "未填标签";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const line = summary + " · " + tag + " · " + platform;
      el.dataset.summaryTagPlatform = line;
      if (el.querySelector(".as-copy-summary-tag-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-platform";
      btn.textContent = "复制摘要标签平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagPlatform || "");
        softBanner(ok ? "已复制摘要标签平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+距上次标签 */
  async function ensureCheckinNextAtLastAgoPlainR158Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtLastAgoPlainR158CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtLastAgoPlainR158CopyCard";
      card.className = "checkin-next-at-last-ago-plain-r158-copy";
      const lastWin = $("#checkinLastAgoWindowEndsPlainR157CopyCard");
      const statusNext = $("#checkinStatusLabelNextAtPlainR156CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR155CopyCard");
      if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
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
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = nextAt + " · " + lastAgo;
      const line =
        "报备下次建议 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-last-ago-plain-r158-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtLastAgoPlainR158CopyBtn">复制下次距上次R158</button>`;
      const btn = $("#checkinNextAtLastAgoPlainR158CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距上次R158" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+进度百分比+门槛三元复制 */
  async function ensureTravelBalanceProgressThresholdPlainR158Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceProgressThresholdPlainR158CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceProgressThresholdPlainR158CopyCard";
      card.className = "travel-balance-progress-threshold-plain-r158-copy";
      const depShort = $("#travelDepositedShortfallProgressPlainR157CopyCard");
      const progThr = $("#travelProgressThresholdShortfallPlainR156CopyCard");
      const thrDep = $("#travelThresholdDepositedBalancePlainR155CopyCard");
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else if (thrDep && thrDep.parentNode)
        thrDep.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = bal + " · " + pct + " · " + thr;
      const line =
        "差旅余额 · 进度 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-progress-threshold-plain-r158-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceProgressThresholdPlainR158CopyBtn">复制余额进度门槛</button>`;
      const btn = $("#travelBalanceProgressThresholdPlainR158CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额进度门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额进度门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+城市组合复制 */
  async function ensureAftercareHospitalDepartmentCityCopyButtons() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const line = hospital + " · " + department + " · " + city;
      el.dataset.hospitalDepartmentCity = line;
      if (el.querySelector(".ac-copy-hospital-department-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-department-city";
      btn.textContent = "复制医院科室城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalDepartmentCity || "");
        softBanner(ok ? "已复制医院科室城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+缺失项+时长提示组合复制 */
  async function ensureAuthCompleteMissingDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingDurationHintCopyR158Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingDurationHintCopyR158Card";
      card.className = "av-complete-missing-duration-hint-copy-r158";
      const durReady = $("#avDurationHintReadyCompleteCopyR157Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR156Card");
      const completeDur = $("#avCompleteDurationHintMissingCopyR155Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
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
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = complete + " · " + missLabel + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-duration-hint-copy-r158-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingDurationHintCopyR158Btn">复制完成缺失时长</button>`;
      const btn = $("#avCompleteMissingDurationHintCopyR158Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+口令提示组合复制 */
  async function ensureHeirRelationIdPassphraseHintCopyButtons() {
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
      const id = String(it.id);
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = relation + " · " + id + " · " + phrase;
      if (el.querySelector(".bn-copy-relation-id-passphrase-hint-r158")) return;
      el.dataset.relationIdPassphraseHintR158 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-passphrase-hint-r158";
      btn.textContent = "复制关系编号口令";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.relationIdPassphraseHintR158 || ""
        );
        softBanner(ok ? "已复制关系编号口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+章节数组合复制 */
  async function ensureHandoverDoneDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainSectionsCopyR158Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainSectionsCopyR158Card";
      card.className = "hand-done-domain-sections-copy-r158";
      const secBrand = $("#handSectionsBrandProgressPctCopyR157Card");
      const domainDone = $("#handDomainDoneSectionsCopyR156Card");
      const donePct = $("#handDoneProgressPctBrandCopyR155Card");
      if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else if (domainDone && domainDone.parentNode)
        domainDone.insertAdjacentElement("afterend", card);
      else if (donePct && donePct.parentNode)
        donePct.insertAdjacentElement("afterend", card);
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
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = done + " · " + domain + " · " + sectionsCount;
      const line = "手册完成 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-sections-copy-r158-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainSectionsCopyR158Btn">复制完成域名章节</button>`;
      const btn = $("#handDoneDomainSectionsCopyR158Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+就绪+版本+域名四元复制 + round 层含 158 */
  async function paintBrandOkVersionDomainR158CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandOkVersionDomainR158CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandOkVersionDomainR158CopyCard";
      card.className = "card settings-brand-ok-version-domain-r158-copy-card";
      const okDom = $("#settingsOkDomainBrandEnVersionR157CopyCard");
      const domainVer = $("#settingsDomainVersionBrandBrandEnR156CopyCard");
      const verEn = $("#settingsVersionBrandEnOkBrandR155CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (domainVer && domainVer.parentNode)
        domainVer.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = brand + " · " + okLabel + " · " + ver + " · " + domain;
      card.innerHTML = `<h3>品牌 · 就绪 · 版本 · 域名</h3>
        <p class="muted">一键复制中文品牌、就绪态、版本与域名（演示级）。</p>
        <p class="settings-brand-ok-version-domain-r158-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandOkVersionDomainR158CopyBtn">复制品牌就绪版本域名</button>`;
      const btn = $("#settingsBrandOkVersionDomainR158CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌就绪版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 就绪 · 版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList158() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 158;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 158); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round158 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandOkVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagPlatformCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtLastAgoPlainR158Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceProgressThresholdPlainR158Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalDepartmentCityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdPassphraseHintCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandOkVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagPlatformCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtLastAgoPlainR158Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceProgressThresholdPlainR158Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentCityCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirRelationIdPassphraseHintCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandOkVersionDomainR158CopyCard().catch(() => {});
        paintRoundLayerList158();
      }, 890);
      setTimeout(() => {
        paintBrandOkVersionDomainR158CopyCard().catch(() => {});
        paintRoundLayerList158();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandOkVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryTagPlatformCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtLastAgoPlainR158Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceProgressThresholdPlainR158Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdPassphraseHintCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandOkVersionDomainR158CopyCard().catch(() => {});
      paintRoundLayerList158();
    }, 910);
  }
})();
