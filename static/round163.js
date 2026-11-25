/* 电子继承 · 第一百六十三批增量（叠在 round162…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round163SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+英文品牌+版本冷静条 */
  async function paintHomeOkBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnVersionCalmBarR163");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnVersionCalmBarR163";
      bar.className = "home-ok-brand-en-version-calm-r163";
      bar.setAttribute("role", "status");
      const domainVer = $("#homeDomainVersionBrandCalmBarR162");
      const brandEn = $("#homeBrandBrandEnOkCalmBarR161");
      const verOk = $("#homeVersionOkDomainCalmBarR160");
      if (domainVer && domainVer.parentNode === home)
        domainVer.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = okLabel + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r163-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r163-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR163">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR163");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r163-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r163-sub">就绪英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR163">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR163");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+设备归属+处置方式组合复制 */
  async function ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = beneficiary + " · " + deviceOwner + " · " + disposition;
      el.dataset.beneficiaryDeviceOwnerDispositionR163 = line;
      if (el.querySelector(".lg-copy-beneficiary-device-owner-disposition-r163"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-beneficiary-device-owner-disposition-r163";
      btn.textContent = "复制受益人归属处置";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.beneficiaryDeviceOwnerDispositionR163 || ""
        );
        softBanner(ok ? "已复制受益人归属处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+平台+标签组合复制 */
  async function ensureAssetVisibilityPlatformTagCopyButtons() {
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
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const tag = String(it.tag || it.category || "").trim() || "未填标签";
      const line = visibility + " · " + platform + " · " + tag;
      el.dataset.visibilityPlatformTagR163 = line;
      if (el.querySelector(".as-copy-visibility-platform-tag-r163")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-platform-tag-r163";
      btn.textContent = "复制可见性平台标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityPlatformTagR163 || "");
        softBanner(ok ? "已复制可见性平台标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止 */
  async function ensureCheckinNextSuggestedWindowEndsPlainR163Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedWindowEndsPlainR163CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedWindowEndsPlainR163CopyCard";
      card.className = "checkin-next-suggested-window-ends-plain-r163-copy";
      const winLast = $("#checkinWindowEndsLastAgoPlainR162CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR161CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR160CopyCard");
      if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
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
      const nextSuggested =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const combo = nextSuggested + " · " + windowEnds;
      const line =
        "报备下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-window-ends-plain-r163-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedWindowEndsPlainR163CopyBtn">复制下次建议窗口</button>`;
      const btn = $("#checkinNextSuggestedWindowEndsPlainR163CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议窗口" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+进度百分比三元复制 */
  async function ensureTravelBalanceThresholdProgressPlainR163Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdProgressPlainR163CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdProgressPlainR163CopyCard";
      card.className = "travel-balance-threshold-progress-plain-r163-copy";
      const progDep = $("#travelProgressDepositedThresholdPlainR162CopyCard");
      const thrShort = $("#travelThresholdShortfallDepositedPlainR161CopyCard");
      const depBal = $("#travelDepositedBalanceShortfallPlainR160CopyCard");
      if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const combo = balance + " · " + thr + " · " + pct;
      const line =
        "差旅余额 · 门槛 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-progress-plain-r163-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdProgressPlainR163CopyBtn">复制余额门槛进度</button>`;
      const btn = $("#travelBalanceThresholdProgressPlainR163CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+医院+状态组合复制 */
  async function ensureAftercareServiceTypeHospitalStatusCopyButtons() {
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
      const serviceType =
        String(it.service_type || it.service || it.department || "").trim() ||
        "未填服务类型";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const status =
        String(it.status || it.state || it.visit_pref || "").trim() ||
        "未填状态";
      const line = serviceType + " · " + hospital + " · " + status;
      el.dataset.serviceTypeHospitalStatusR163 = line;
      if (el.querySelector(".ac-copy-service-type-hospital-status-r163")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type-hospital-status-r163";
      btn.textContent = "复制类型医院状态";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeHospitalStatusR163 || ""
        );
        softBanner(ok ? "已复制类型医院状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+就绪+缺失项组合复制 */
  async function ensureAuthCompleteReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyMissingCopyR163Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyMissingCopyR163Card";
      card.className = "av-complete-ready-missing-copy-r163";
      const readyMiss = $("#avReadyMissingDurationHintCopyR162Card");
      const durComplete = $("#avDurationHintCompleteReadyCopyR161Card");
      const missComplete = $("#avMissingCompleteReadyCopyR160Card");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
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
      const combo = complete + " · " + ready + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-missing-copy-r163-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyMissingCopyR163Btn">复制完成就绪缺失</button>`;
      const btn = $("#avCompleteReadyMissingCopyR163Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+编号+联系方式组合复制 */
  async function ensureHeirPassphraseHintIdContactCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.hint || "").trim() || "无口令提示";
      const id = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = hint + " · " + id + " · " + contact;
      if (el.querySelector(".bn-copy-passphrase-hint-id-contact-r163")) return;
      el.dataset.passphraseHintIdContactR163 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-hint-id-contact-r163";
      btn.textContent = "复制口令编号联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseHintIdContactR163 || "");
        softBanner(ok ? "已复制口令编号联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+品牌组合复制 */
  async function ensureHandoverDomainSectionsBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsBrandCopyR163Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsBrandCopyR163Card";
      card.className = "hand-domain-sections-brand-copy-r163";
      const doneBrand = $("#handDoneBrandProgressPctCopyR162Card");
      const secDom = $("#handSectionsDomainDoneCopyR161Card");
      const brandPct = $("#handBrandProgressPctDomainCopyR160Card");
      if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else if (secDom && secDom.parentNode)
        secDom.insertAdjacentElement("afterend", card);
      else if (brandPct && brandPct.parentNode)
        brandPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain = String(data.domain || "einherit.cn").trim();
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.sections != null
            ? String(prog.sections)
            : prog.total_types != null
              ? String(prog.total_types)
              : data.total != null
                ? String(data.total)
                : "—";
      const brand = String(data.brand || "").trim() || "电子继承 App";
      const combo = domain + " · " + sections + " · " + brand;
      const line = "手册域名 · 章节 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-sections-brand-copy-r163-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsBrandCopyR163Btn">复制域名章节品牌</button>`;
      const btn = $("#handDomainSectionsBrandCopyR163Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+版本+中文品牌四元复制 + round 层含 163 */
  async function paintDomainOkVersionBrandR163CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainOkVersionBrandR163CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainOkVersionBrandR163CopyCard";
      card.className = "card settings-domain-ok-version-brand-r163-copy-card";
      const okBrand = $("#settingsOkBrandBrandEnVersionR162CopyCard");
      const brandVer = $("#settingsBrandVersionDomainBrandEnR161CopyCard");
      const verOk = $("#settingsVersionOkBrandEnDomainR160CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = domain + " · " + okLabel + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 品牌</h3>
        <p class="muted">一键复制域名、就绪态、版本与中文品牌（演示级）。</p>
        <p class="settings-domain-ok-version-brand-r163-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainOkVersionBrandR163CopyBtn">复制域名就绪版本品牌</button>`;
      const btn = $("#settingsDomainOkVersionBrandR163CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪版本品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList163() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 163;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 163); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round163 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityPlatformTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedWindowEndsPlainR163Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceThresholdProgressPlainR163Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareServiceTypeHospitalStatusCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseHintIdContactCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainSectionsBrandCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityPlatformTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedWindowEndsPlainR163Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceThresholdProgressPlainR163Copy().catch(() => {}),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeHospitalStatusCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseHintIdContactCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsBrandCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkVersionBrandR163CopyCard().catch(() => {});
        paintRoundLayerList163();
      }, 890);
      setTimeout(() => {
        paintDomainOkVersionBrandR163CopyCard().catch(() => {});
        paintRoundLayerList163();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(
        () => {}
      ),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityPlatformTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedWindowEndsPlainR163Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdProgressPlainR163Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeHospitalStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseHintIdContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkVersionBrandR163CopyCard().catch(() => {});
      paintRoundLayerList163();
    }, 910);
  }
})();
