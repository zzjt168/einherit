/* 电子继承 · 第一百五十二批增量（叠在 round151…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round152SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+就绪+域名冷静条 */
  async function paintHomeBrandEnOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnOkDomainCalmBarR152");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnOkDomainCalmBarR152";
      bar.className = "home-brand-en-ok-domain-calm-r152";
      bar.setAttribute("role", "status");
      const brandDom = $("#homeBrandDomainOkCalmBarR151");
      const okVer = $("#homeOkVersionBrandEnCalmBarR150");
      const enBrand = $("#homeBrandEnBrandVersionCalmBarR149");
      if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (enBrand && enBrand.parentNode === home)
        enBrand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + ready + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-r152-mark">英文</span>
        <span class="muted home-brand-en-ok-domain-calm-r152-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGoR152">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGoR152");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-r152-mark">英文</span>
        <span class="muted home-brand-en-ok-domain-calm-r152-sub">英文就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGoR152">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGoR152");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+受益人+处置方式组合复制 */
  async function ensureLegacyDeviceOwnerBeneficiaryDispositionCopyButtons() {
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
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const beneficiary =
        String(it.beneficiary || "").trim() || "未填受益人";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = owner + " · " + beneficiary + " · " + disposition;
      el.dataset.deviceOwnerBeneficiaryDisposition = line;
      if (el.querySelector(".lg-copy-device-owner-beneficiary-disposition")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-beneficiary-disposition";
      btn.textContent = "复制归属受益人处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerBeneficiaryDisposition || "");
        softBanner(ok ? "已复制归属受益人处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+标题+标签组合复制 */
  async function ensureAssetVisibilityTitleTagCopyButtons() {
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
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const tag =
        String(it.tag || it.category || it.dept || "").trim() || "未填标签";
      const line = visibility + " · " + title + " · " + tag;
      el.dataset.visibilityTitleTag = line;
      if (el.querySelector(".as-copy-visibility-title-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-title-tag";
      btn.textContent = "复制可见标题标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityTitleTag || "");
        softBanner(ok ? "已复制可见标题标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+距上次标签 */
  async function ensureCheckinWindowEndsLastAgoPlainR152Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsLastAgoPlainR152CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsLastAgoPlainR152CopyCard";
      card.className = "checkin-window-ends-last-ago-plain-r152-copy";
      const nextStatus = $("#checkinNextAtStatusLabelPlainR151CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR150CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR149CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
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
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(cd.window_ends_label || st.window_ends_at || "").trim() ||
            "—";
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
      card.innerHTML = `<p class="muted checkin-window-ends-last-ago-plain-r152-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsLastAgoPlainR152CopyBtn">复制窗口距上次R152</button>`;
      const btn = $("#checkinWindowEndsLastAgoPlainR152CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口距上次R152" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+短差+已存三元复制 */
  async function ensureTravelProgressShortfallDepositedPlainR152Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressShortfallDepositedPlainR152CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressShortfallDepositedPlainR152CopyCard";
      card.className = "travel-progress-shortfall-deposited-plain-r152-copy";
      const depThr = $("#travelDepositedThresholdShortfallPlainR151CopyCard");
      const thrProg = $("#travelThresholdProgressBalancePlainR150CopyCard");
      const balShort = $("#travelBalanceShortfallDepositedPlainR149CopyCard");
      if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
      else if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = pct + " · " + shortfall + " · " + deposited;
      const line =
        "差旅进度 · 短差 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-shortfall-deposited-plain-r152-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressShortfallDepositedPlainR152CopyBtn">复制进度短差已存</button>`;
      const btn = $("#travelProgressShortfallDepositedPlainR152CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度短差已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度短差已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅/善后科室+医院+城市组合复制 */
  async function ensureAftercareDepartmentHospitalCityCopyButtons() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const hospital =
        String(it.hospital || it.facility || "").trim() || "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const line = department + " · " + hospital + " · " + city;
      el.dataset.departmentHospitalCity = line;
      if (el.querySelector(".ac-copy-department-hospital-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-hospital-city";
      btn.textContent = "复制科室医院城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentHospitalCity || "");
        softBanner(ok ? "已复制科室医院城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+时长提示组合复制 */
  async function ensureAuthReadyCompleteDurationCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteDurationCopyR152Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteDurationCopyR152Card";
      card.className = "av-ready-complete-duration-copy-r152";
      const missDur = $("#avMissingDurationCompleteCopyR151Card");
      const durComplete = $("#avDurationCompleteReadyCopyR150Card");
      const completeReady = $("#avCompleteReadyMissingCopyR149Card");
      if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "未填时长";
      const combo = ready + " · " + complete + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-duration-copy-r152-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteDurationCopyR152Btn">复制就绪完成时长</button>`;
      const btn = $("#avReadyCompleteDurationCopyR152Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+编号+口令提示组合复制 */
  async function ensureHeirNameIdPassphraseCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const id = String(it.id);
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const line = name + " · #" + id + " · " + passphrase;
      if (el.querySelector(".bn-copy-name-id-passphrase")) return;
      el.dataset.nameIdPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-id-passphrase";
      btn.textContent = "复制姓名编号口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameIdPassphrase || "");
        softBanner(ok ? "已复制姓名编号口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+进度百分比组合复制 */
  async function ensureHandoverSectionsDonePctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDonePctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDonePctCopyCard";
      card.className = "hand-sections-done-pct-copy";
      const doneBrand = $("#handDoneBrandDomainCopyCard");
      const domainPct = $("#handDomainPctBrandCopyCard");
      const pctDone = $("#handPctDoneSectionsCopyCard");
      if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else if (domainPct && domainPct.parentNode)
        domainPct.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
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
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (data.progress_pct != null) pct = String(data.progress_pct) + "%";
      else if (typeof data.progress === "number")
        pct = String(data.progress) + "%";
      const combo = sectionsCount + " · " + done + " · " + pct;
      const line = "手册章节 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDonePctCopyBtn">复制章节完成进度</button>`;
      const btn = $("#handSectionsDonePctCopyBtn");
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

  /* 10 · 设置·中文品牌+域名+版本+就绪四元复制 + round 层含 152 */
  async function paintBrandDomainVersionOkR152CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandDomainVersionOkR152CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandDomainVersionOkR152CopyCard";
      card.className = "card settings-brand-domain-version-ok-r152-copy-card";
      const domainOk = $("#settingsDomainOkVersionBrandEnR151CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR150CopyCard");
      const brandEn = $("#settingsBrandBrandEnOkDomainR149CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = brand + " · " + domain + " · " + ver + " · " + ready;
      card.innerHTML = `<h3>品牌 · 域名 · 版本 · 就绪</h3>
        <p class="muted">一键复制中文品牌、域名、版本与就绪状态（演示级）。</p>
        <p class="settings-brand-domain-version-ok-r152-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandDomainVersionOkR152CopyBtn">复制品牌域名版本就绪</button>`;
      const btn = $("#settingsBrandDomainVersionOkR152CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList152() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 152;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 152); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round152 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 990);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDeviceOwnerBeneficiaryDispositionCopyButtons().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityTitleTagCopyButtons().catch(() => {}),
      820
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsLastAgoPlainR152Copy().catch(() => {}),
      810
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressShortfallDepositedPlainR152Copy().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {}),
      820
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteDurationCopy().catch(() => {}),
      790
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameIdPassphraseCopyButtons().catch(() => {}),
      820
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDonePctCopy().catch(() => {}),
      830
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 990);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerBeneficiaryDispositionCopyButtons().catch(
            () => {}
          ),
        840
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityTitleTagCopyButtons().catch(() => {}),
        830
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsLastAgoPlainR152Copy().catch(() => {}),
        830
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressShortfallDepositedPlainR152Copy().catch(
            () => {}
          ),
        850
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {}),
        840
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteDurationCopy().catch(() => {}),
        810
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameIdPassphraseCopyButtons().catch(() => {}),
        830
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDonePctCopy().catch(() => {}),
        840
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandDomainVersionOkR152CopyCard().catch(() => {});
        paintRoundLayerList152();
      }, 880);
      setTimeout(() => {
        paintBrandDomainVersionOkR152CopyCard().catch(() => {});
        paintRoundLayerList152();
      }, 1560);
    }
  };

  setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 1040);
  setTimeout(
    () =>
      ensureLegacyDeviceOwnerBeneficiaryDispositionCopyButtons().catch(
        () => {}
      ),
    1060
  );
  setTimeout(
    () => ensureAssetVisibilityTitleTagCopyButtons().catch(() => {}),
    1080
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsLastAgoPlainR152Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressShortfallDepositedPlainR152Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteDurationCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameIdPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDonePctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandDomainVersionOkR152CopyCard().catch(() => {});
      paintRoundLayerList152();
    }, 900);
  }
})();
