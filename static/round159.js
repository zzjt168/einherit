/* 电子继承 · 第一百五十九批增量（叠在 round158…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round159SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌+中文品牌冷静条 */
  async function paintHomeDomainBrandEnBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnBrandCalmBarR159");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnBrandCalmBarR159";
      bar.className = "home-domain-brand-en-brand-calm-r159";
      bar.setAttribute("role", "status");
      const brandOk = $("#homeBrandOkVersionCalmBarR158");
      const okEn = $("#homeOkBrandEnDomainCalmBarR157");
      const domainBrand = $("#homeDomainBrandVersionCalmBarR156");
      if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (domainBrand && domainBrand.parentNode === home)
        domainBrand.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + en + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r159-mark">域名</span>
        <span class="muted home-domain-brand-en-brand-calm-r159-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR159">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR159");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-brand-calm-r159-mark">域名</span>
        <span class="muted home-domain-brand-en-brand-calm-r159-sub">域名中英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnBrandCalmGoR159">去设置</button>`;
      const btn = $("#homeDomainBrandEnBrandCalmGoR159");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+处置方式+设备归属组合复制 */
  async function ensureLegacyIdDispositionDeviceOwnerCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const line = id + " · " + disposition + " · " + owner;
      el.dataset.idDispositionDeviceOwner = line;
      if (el.querySelector(".lg-copy-id-disposition-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-disposition-device-owner";
      btn.textContent = "复制编号处置归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDispositionDeviceOwner || "");
        softBanner(ok ? "已复制编号处置归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+分类+标题组合复制 */
  async function ensureAssetVisibilityCategoryTitleCopyButtons() {
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
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const title =
        String(it.title || it.platform || it.summary || "").trim() ||
        "无标题";
      const line = visibility + " · " + category + " · " + title;
      el.dataset.visibilityCategoryTitle = line;
      if (el.querySelector(".as-copy-visibility-category-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-category-title";
      btn.textContent = "复制可见分类标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityCategoryTitle || "");
        softBanner(ok ? "已复制可见分类标题" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议 */
  async function ensureCheckinWindowEndsNextAtPlainR159Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextAtPlainR159CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextAtPlainR159CopyCard";
      card.className = "checkin-window-ends-next-at-plain-r159-copy";
      const nextLast = $("#checkinNextAtLastAgoPlainR158CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR157CopyCard");
      const statusNext = $("#checkinStatusLabelNextAtPlainR156CopyCard");
      if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = windowEnds + " · " + nextAt;
      const line =
        "报备窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-at-plain-r159-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextAtPlainR159CopyBtn">复制窗口下次R159</button>`;
      const btn = $("#checkinWindowEndsNextAtPlainR159CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次R159" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+门槛+余额三元复制 */
  async function ensureTravelShortfallThresholdBalancePlainR159Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdBalancePlainR159CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdBalancePlainR159CopyCard";
      card.className = "travel-shortfall-threshold-balance-plain-r159-copy";
      const balProg = $("#travelBalanceProgressThresholdPlainR158CopyCard");
      const depShort = $("#travelDepositedShortfallProgressPlainR157CopyCard");
      const progThr = $("#travelProgressThresholdShortfallPlainR156CopyCard");
      if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = shortfall + " · " + thr + " · " + bal;
      const line =
        "差旅短差 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-balance-plain-r159-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdBalancePlainR159CopyBtn">复制短差门槛余额</button>`;
      const btn = $("#travelShortfallThresholdBalancePlainR159CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差门槛余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+服务类型+状态组合复制 */
  async function ensureAftercareHospitalServiceStatusCopyButtons() {
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
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status =
        String(
          it.status_label || it.status || it.status_key || it.title || ""
        ).trim() || "未填状态";
      const line = hospital + " · " + service + " · " + status;
      el.dataset.hospitalServiceStatus = line;
      if (el.querySelector(".ac-copy-hospital-service-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-service-status";
      btn.textContent = "复制医院服务状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalServiceStatus || "");
        softBanner(ok ? "已复制医院服务状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+时长提示+缺失项组合复制 */
  async function ensureAuthReadyDurationHintMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyDurationHintMissingCopyR159Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyDurationHintMissingCopyR159Card";
      card.className = "av-ready-duration-hint-missing-copy-r159";
      const completeMiss = $("#avCompleteMissingDurationHintCopyR158Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR157Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR156Card");
      if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
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
      const combo = ready + " · " + duration + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-duration-hint-missing-copy-r159-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyDurationHintMissingCopyR159Btn">复制就绪时长缺失</button>`;
      const btn = $("#avReadyDurationHintMissingCopyR159Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪时长缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪时长缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+编号组合复制 */
  async function ensureHeirNameRelationIdCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const id = String(it.id);
      const line = name + " · " + relation + " · " + id;
      if (el.querySelector(".bn-copy-name-relation-id-r159")) return;
      el.dataset.nameRelationIdR159 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-id-r159";
      btn.textContent = "复制姓名关系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationIdR159 || "");
        softBanner(ok ? "已复制姓名关系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+章节数+完成数组合复制 */
  async function ensureHandoverProgressPctSectionsDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctSectionsDoneCopyR159Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctSectionsDoneCopyR159Card";
      card.className = "hand-progress-pct-sections-done-copy-r159";
      const doneDom = $("#handDoneDomainSectionsCopyR158Card");
      const secBrand = $("#handSectionsBrandProgressPctCopyR157Card");
      const domainDone = $("#handDomainDoneSectionsCopyR156Card");
      if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else if (domainDone && domainDone.parentNode)
        domainDone.insertAdjacentElement("afterend", card);
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
      const combo = pct + " · " + sectionsCount + " · " + done;
      const line = "手册进度 · 章节 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-sections-done-copy-r159-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctSectionsDoneCopyR159Btn">复制进度章节完成</button>`;
      const btn = $("#handProgressPctSectionsDoneCopyR159Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度章节完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度章节完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+域名+中文品牌+就绪四元复制 + round 层含 159 */
  async function paintBrandEnDomainBrandOkR159CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnDomainBrandOkR159CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnDomainBrandOkR159CopyCard";
      card.className = "card settings-brand-en-domain-brand-ok-r159-copy-card";
      const brandOk = $("#settingsBrandOkVersionDomainR158CopyCard");
      const okDom = $("#settingsOkDomainBrandEnVersionR157CopyCard");
      const domainVer = $("#settingsDomainVersionBrandBrandEnR156CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (domainVer && domainVer.parentNode)
        domainVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + domain + " · " + brand + " · " + okLabel;
      card.innerHTML = `<h3>英文 · 域名 · 品牌 · 就绪</h3>
        <p class="muted">一键复制英文品牌、域名、中文品牌与就绪态（演示级）。</p>
        <p class="settings-brand-en-domain-brand-ok-r159-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnDomainBrandOkR159CopyBtn">复制英文域名品牌就绪</button>`;
      const btn = $("#settingsBrandEnDomainBrandOkR159CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文域名品牌就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 域名 · 品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList159() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 159;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 159); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round159 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdDispositionDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityCategoryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsNextAtPlainR159Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallThresholdBalancePlainR159Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalServiceStatusCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyDurationHintMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationIdCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctSectionsDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyIdDispositionDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityCategoryTitleCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsNextAtPlainR159Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdBalancePlainR159Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalServiceStatusCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyDurationHintMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationIdCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctSectionsDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnDomainBrandOkR159CopyCard().catch(() => {});
        paintRoundLayerList159();
      }, 890);
      setTimeout(() => {
        paintBrandEnDomainBrandOkR159CopyCard().catch(() => {});
        paintRoundLayerList159();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyIdDispositionDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityCategoryTitleCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextAtPlainR159Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdBalancePlainR159Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalServiceStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyDurationHintMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctSectionsDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnDomainBrandOkR159CopyCard().catch(() => {});
      paintRoundLayerList159();
    }, 910);
  }
})();
