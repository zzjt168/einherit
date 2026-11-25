/* 电子继承 · 第一百六十四批增量（叠在 round163…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round164SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+域名+英文品牌冷静条 */
  async function paintHomeBrandDomainBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainBrandEnCalmBarR164");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainBrandEnCalmBarR164";
      bar.className = "home-brand-domain-brand-en-calm-r164";
      bar.setAttribute("role", "status");
      const okEn = $("#homeOkBrandEnVersionCalmBarR163");
      const domainVer = $("#homeDomainVersionBrandCalmBarR162");
      const brandEn = $("#homeBrandBrandEnOkCalmBarR161");
      if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (domainVer && domainVer.parentNode === home)
        domainVer.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = brand + " · " + domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-brand-en-calm-r164-mark">品牌</span>
        <span class="muted home-brand-domain-brand-en-calm-r164-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainBrandEnCalmGoR164">去设置</button>`;
      const btn = $("#homeBrandDomainBrandEnCalmGoR164");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-brand-en-calm-r164-mark">品牌</span>
        <span class="muted home-brand-domain-brand-en-calm-r164-sub">品牌域名英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainBrandEnCalmGoR164">去设置</button>`;
      const btn = $("#homeBrandDomainBrandEnCalmGoR164");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+编号+设备归属组合复制 */
  async function ensureLegacyTitleIdDeviceOwnerCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const id = it.id != null ? String(it.id) : "—";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const line = title + " · " + id + " · " + deviceOwner;
      el.dataset.titleIdDeviceOwnerR164 = line;
      if (el.querySelector(".lg-copy-title-id-device-owner-r164")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-id-device-owner-r164";
      btn.textContent = "复制标题编号归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleIdDeviceOwnerR164 || "");
        softBanner(ok ? "已复制标题编号归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+分类+可见性组合复制 */
  async function ensureAssetSummaryCategoryVisibilityCopyButtons() {
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
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = summary + " · " + category + " · " + visibility;
      el.dataset.summaryCategoryVisibilityR164 = line;
      if (el.querySelector(".as-copy-summary-category-visibility-r164")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-category-visibility-r164";
      btn.textContent = "复制摘要分类可见性";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryCategoryVisibilityR164 || ""
        );
        softBanner(ok ? "已复制摘要分类可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+下次建议 */
  async function ensureCheckinStatusLabelNextSuggestedPlainR164Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelNextSuggestedPlainR164CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelNextSuggestedPlainR164CopyCard";
      card.className = "checkin-status-label-next-suggested-plain-r164-copy";
      const nextWin = $("#checkinNextSuggestedWindowEndsPlainR163CopyCard");
      const winLast = $("#checkinWindowEndsLastAgoPlainR162CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR161CopyCard");
      if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "暂无状态";
      const nextSuggested =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = statusLabel + " · " + nextSuggested;
      const line =
        "报备状态 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-next-suggested-plain-r164-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelNextSuggestedPlainR164CopyBtn">复制状态下次建议</button>`;
      const btn = $("#checkinStatusLabelNextSuggestedPlainR164CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态下次建议" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+已存+余额三元复制 */
  async function ensureTravelShortfallDepositedBalancePlainR164Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallDepositedBalancePlainR164CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallDepositedBalancePlainR164CopyCard";
      card.className = "travel-shortfall-deposited-balance-plain-r164-copy";
      const balThr = $("#travelBalanceThresholdProgressPlainR163CopyCard");
      const progDep = $("#travelProgressDepositedThresholdPlainR162CopyCard");
      const thrShort = $("#travelThresholdShortfallDepositedPlainR161CopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
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
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const combo = shortfall + " · " + deposited + " · " + balance;
      const line =
        "差旅短差 · 已存 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-deposited-balance-plain-r164-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallDepositedBalancePlainR164CopyBtn">复制短差已存余额</button>`;
      const btn = $("#travelShortfallDepositedBalancePlainR164CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差已存余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差已存余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+医院+城市组合复制 */
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
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const line = department + " · " + hospital + " · " + city;
      el.dataset.departmentHospitalCityR164 = line;
      if (el.querySelector(".ac-copy-department-hospital-city-r164")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-hospital-city-r164";
      btn.textContent = "复制科室医院城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentHospitalCityR164 || "");
        softBanner(ok ? "已复制科室医院城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+缺失项+完成态组合复制 */
  async function ensureAuthDurationHintMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintMissingCompleteCopyR164Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintMissingCompleteCopyR164Card";
      card.className = "av-duration-hint-missing-complete-copy-r164";
      const completeReady = $("#avCompleteReadyMissingCopyR163Card");
      const readyMiss = $("#avReadyMissingDurationHintCopyR162Card");
      const durComplete = $("#avDurationHintCompleteReadyCopyR161Card");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
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
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + missLabel + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-missing-complete-copy-r164-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintMissingCompleteCopyR164Btn">复制时长缺失完成</button>`;
      const btn = $("#avDurationHintMissingCompleteCopyR164Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长缺失完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+口令提示+关系组合复制 */
  async function ensureHeirNamePassphraseHintRelationCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.hint || "").trim() || "无口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = name + " · " + hint + " · " + relation;
      if (el.querySelector(".bn-copy-name-passphrase-hint-relation-r164"))
        return;
      el.dataset.namePassphraseHintRelationR164 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-passphrase-hint-relation-r164";
      btn.textContent = "复制姓名口令关系";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.namePassphraseHintRelationR164 || ""
        );
        softBanner(ok ? "已复制姓名口令关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+域名组合复制 */
  async function ensureHandoverProgressPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneDomainCopyR164Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneDomainCopyR164Card";
      card.className = "hand-progress-pct-done-domain-copy-r164";
      const domSec = $("#handDomainSectionsBrandCopyR163Card");
      const doneBrand = $("#handDoneBrandProgressPctCopyR162Card");
      const secDom = $("#handSectionsDomainDoneCopyR161Card");
      if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else if (secDom && secDom.parentNode)
        secDom.insertAdjacentElement("afterend", card);
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
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const domain = String(data.domain || "einherit.cn").trim();
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-domain-copy-r164-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneDomainCopyR164Btn">复制进度完成域名</button>`;
      const btn = $("#handProgressPctDoneDomainCopyR164Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+版本+就绪+域名四元复制 + round 层含 164 */
  async function paintBrandEnVersionOkDomainR164CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnVersionOkDomainR164CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnVersionOkDomainR164CopyCard";
      card.className = "card settings-brand-en-version-ok-domain-r164-copy-card";
      const domainOk = $("#settingsDomainOkVersionBrandR163CopyCard");
      const okBrand = $("#settingsOkBrandBrandEnVersionR162CopyCard");
      const brandVer = $("#settingsBrandVersionDomainBrandEnR161CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + ver + " · " + okLabel + " · " + domain;
      card.innerHTML = `<h3>英文 · 版本 · 就绪 · 域名</h3>
        <p class="muted">一键复制英文品牌、版本、就绪态与域名（演示级）。</p>
        <p class="settings-brand-en-version-ok-domain-r164-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnVersionOkDomainR164CopyBtn">复制英文版本就绪域名</button>`;
      const btn = $("#settingsBrandEnVersionOkDomainR164CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文版本就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 版本 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList164() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 164;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 164); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round164 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomainBrandEn().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleIdDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetSummaryCategoryVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusLabelNextSuggestedPlainR164Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallDepositedBalancePlainR164Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintMissingCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirNamePassphraseHintRelationCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomainBrandEn().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleIdDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryCategoryVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLabelNextSuggestedPlainR164Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallDepositedBalancePlainR164Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintMissingCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirNamePassphraseHintRelationCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionOkDomainR164CopyCard().catch(() => {});
        paintRoundLayerList164();
      }, 890);
      setTimeout(() => {
        paintBrandEnVersionOkDomainR164CopyCard().catch(() => {});
        paintRoundLayerList164();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandDomainBrandEn().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleIdDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryCategoryVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelNextSuggestedPlainR164Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallDepositedBalancePlainR164Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentHospitalCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePassphraseHintRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionOkDomainR164CopyCard().catch(() => {});
      paintRoundLayerList164();
    }, 910);
  }
})();
