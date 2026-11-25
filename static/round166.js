/* 电子继承 · 第一百六十六批增量（叠在 round165…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round166SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+就绪+中文品牌冷静条 */
  async function paintHomeBrandEnOkBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnOkBrandCalmBarR166");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnOkBrandCalmBarR166";
      bar.className = "home-brand-en-ok-brand-calm-r166";
      bar.setAttribute("role", "status");
      const verBrand = $("#homeVersionBrandOkCalmBarR165");
      const brandDom = $("#homeBrandDomainBrandEnCalmBarR164");
      const okEn = $("#homeOkBrandEnVersionCalmBarR163");
      if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
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
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = en + " · " + okLabel + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-brand-calm-r166-mark">英文</span>
        <span class="muted home-brand-en-ok-brand-calm-r166-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkBrandCalmGoR166">去设置</button>`;
      const btn = $("#homeBrandEnOkBrandCalmGoR166");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-brand-calm-r166-mark">英文</span>
        <span class="muted home-brand-en-ok-brand-calm-r166-sub">英文就绪品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkBrandCalmGoR166">去设置</button>`;
      const btn = $("#homeBrandEnOkBrandCalmGoR166");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+设备归属+受益人组合复制 */
  async function ensureLegacyIdDeviceOwnerBeneficiaryCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = id + " · " + deviceOwner + " · " + beneficiary;
      el.dataset.idDeviceOwnerBeneficiaryR166 = line;
      if (el.querySelector(".lg-copy-id-device-owner-beneficiary-r166")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-device-owner-beneficiary-r166";
      btn.textContent = "复制编号归属受益人";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.idDeviceOwnerBeneficiaryR166 || ""
        );
        softBanner(ok ? "已复制编号归属受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+可见性+标题组合复制 */
  async function ensureAssetPlatformVisibilityTitleCopyButtons() {
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
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const title =
        String(it.title || it.platform || it.summary || "").trim() || "无标题";
      const line = platform + " · " + visibility + " · " + title;
      el.dataset.platformVisibilityTitleR166 = line;
      if (el.querySelector(".as-copy-platform-visibility-title-r166")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-visibility-title-r166";
      btn.textContent = "复制平台可见性标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformVisibilityTitleR166 || "");
        softBanner(ok ? "已复制平台可见性标题" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议 */
  async function ensureCheckinWindowEndsNextSuggestedPlainR166Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextSuggestedPlainR166CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextSuggestedPlainR166CopyCard";
      card.className = "checkin-window-ends-next-suggested-plain-r166-copy";
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR165CopyCard");
      const statusNext = $("#checkinStatusLabelNextSuggestedPlainR164CopyCard");
      const nextWin = $("#checkinNextSuggestedWindowEndsPlainR163CopyCard");
      if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
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
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const nextSuggested =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = windowEnds + " · " + nextSuggested;
      const line =
        "报备窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-suggested-plain-r166-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextSuggestedPlainR166CopyBtn">复制窗口下次建议</button>`;
      const btn = $("#checkinWindowEndsNextSuggestedPlainR166CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次建议" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+进度百分比+短差三元复制 */
  async function ensureTravelDepositedProgressShortfallPlainR166Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedProgressShortfallPlainR166CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedProgressShortfallPlainR166CopyCard";
      card.className = "travel-deposited-progress-shortfall-plain-r166-copy";
      const thrBal = $("#travelThresholdBalanceShortfallPlainR165CopyCard");
      const shortDep = $("#travelShortfallDepositedBalancePlainR164CopyCard");
      const balThr = $("#travelBalanceThresholdProgressPlainR163CopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
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
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = deposited + " · " + pct + " · " + shortfall;
      const line =
        "差旅已存 · 进度 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-progress-shortfall-plain-r166-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedProgressShortfallPlainR166CopyBtn">复制已存进度短差</button>`;
      const btn = $("#travelDepositedProgressShortfallPlainR166CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存进度短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存进度短差文案暂不可用</p>`;
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
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const line = city + " · " + hospital + " · " + department;
      el.dataset.cityHospitalDepartmentR166 = line;
      if (el.querySelector(".ac-copy-city-hospital-department-r166")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-hospital-department-r166";
      btn.textContent = "复制城市医院科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityHospitalDepartmentR166 || "");
        softBanner(ok ? "已复制城市医院科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+就绪+完成态组合复制 */
  async function ensureAuthMissingReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingReadyCompleteCopyR166Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingReadyCompleteCopyR166Card";
      card.className = "av-missing-ready-complete-copy-r166";
      const readyComplete = $("#avReadyCompleteDurationHintCopyR165Card");
      const durMiss = $("#avDurationHintMissingCompleteCopyR164Card");
      const completeReady = $("#avCompleteReadyMissingCopyR163Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
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
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = missLabel + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-ready-complete-copy-r166-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingReadyCompleteCopyR166Btn">复制缺失就绪完成</button>`;
      const btn = $("#avMissingReadyCompleteCopyR166Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+姓名+联系方式组合复制 */
  async function ensureHeirPassphraseHintNameContactCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = hint + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-passphrase-hint-name-contact-r166"))
        return;
      el.dataset.passphraseHintNameContactR166 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-hint-name-contact-r166";
      btn.textContent = "复制口令姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.passphraseHintNameContactR166 || ""
        );
        softBanner(ok ? "已复制口令姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+章节数组合复制 */
  async function ensureHandoverBrandDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainSectionsCopyR166Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainSectionsCopyR166Card";
      card.className = "hand-brand-domain-sections-copy-r166";
      const secDone = $("#handSectionsDoneProgressPctCopyR165Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR164Card");
      const domSec = $("#handDomainSectionsBrandCopyR163Card");
      if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const brand = String(data.brand || "").trim() || "电子继承 App";
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
      const combo = brand + " · " + domain + " · " + sections;
      const line = "手册品牌 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-sections-copy-r166-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainSectionsCopyR166Btn">复制品牌域名章节</button>`;
      const btn = $("#handBrandDomainSectionsCopyR166Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌域名章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+中文品牌+域名+就绪四元复制 + round 层含 166 */
  async function paintVersionBrandDomainOkR166CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionBrandDomainOkR166CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionBrandDomainOkR166CopyCard";
      card.className = "card settings-version-brand-domain-ok-r166-copy-card";
      const brandDom = $("#settingsBrandDomainOkBrandEnR165CopyCard");
      const brandEn = $("#settingsBrandEnVersionOkDomainR164CopyCard");
      const domainOk = $("#settingsDomainOkVersionBrandR163CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · " + brand + " · " + domain + " · " + okLabel;
      card.innerHTML = `<h3>版本 · 品牌 · 域名 · 就绪</h3>
        <p class="muted">一键复制版本、中文品牌、域名与就绪态（演示级）。</p>
        <p class="settings-version-brand-domain-ok-r166-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionBrandDomainOkR166CopyBtn">复制版本品牌域名就绪</button>`;
      const btn = $("#settingsVersionBrandDomainOkR166CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本品牌域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 品牌 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList166() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 166;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 166); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round166 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnOkBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyIdDeviceOwnerBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformVisibilityTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsNextSuggestedPlainR166Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedProgressShortfallPlainR166Copy().catch(
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
        ensureAftercareCityHospitalDepartmentCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirPassphraseHintNameContactCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnOkBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyIdDeviceOwnerBeneficiaryCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetPlatformVisibilityTitleCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsNextSuggestedPlainR166Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedProgressShortfallPlainR166Copy().catch(
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
        () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirPassphraseHintNameContactCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandDomainOkR166CopyCard().catch(() => {});
        paintRoundLayerList166();
      }, 890);
      setTimeout(() => {
        paintVersionBrandDomainOkR166CopyCard().catch(() => {});
        paintRoundLayerList166();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnOkBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyIdDeviceOwnerBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetPlatformVisibilityTitleCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextSuggestedPlainR166Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedProgressShortfallPlainR166Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseHintNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandDomainOkR166CopyCard().catch(() => {});
      paintRoundLayerList166();
    }, 910);
  }
})();
