/* 电子继承 · 第一百七十五批增量（叠在 round174…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round175SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+域名+英文品牌冷静条 */
  async function paintHomeVersionDomainBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionDomainBrandEnCalmBarR175");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionDomainBrandEnCalmBarR175";
      bar.className = "home-version-domain-brand-en-calm-r175";
      bar.setAttribute("role", "status");
      const brandEnVer = $("#homeBrandEnVersionBrandCalmBarR174");
      const domVer = $("#homeDomainVersionBrandCalmBarR173");
      const brandEn = $("#homeBrandBrandEnDomainCalmBarR172");
      if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ver + " · " + domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-en-calm-r175-mark">版本</span>
        <span class="muted home-version-domain-brand-en-calm-r175-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandEnCalmGoR175">去设置</button>`;
      const btn = $("#homeVersionDomainBrandEnCalmGoR175");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-en-calm-r175-mark">版本</span>
        <span class="muted home-version-domain-brand-en-calm-r175-sub">版本域名英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandEnCalmGoR175">去设置</button>`;
      const btn = $("#homeVersionDomainBrandEnCalmGoR175");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+处置意向组合复制（进位） */
  async function ensureLegacyDeviceOwnerTitleDispositionCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = deviceOwner + " · " + title + " · " + disposition;
      el.dataset.deviceOwnerTitleDispositionR175 = line;
      if (el.querySelector(".lg-copy-device-owner-title-disposition-r175"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-device-owner-title-disposition-r175";
      btn.textContent = "复制归属标题处置";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.deviceOwnerTitleDispositionR175 || ""
        );
        softBanner(ok ? "已复制归属标题处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+摘要+标签组合复制（进位） */
  async function ensureAssetCategorySummaryTagCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.label || "").trim() || "未填标签";
      const line = category + " · " + summary + " · " + tag;
      el.dataset.categorySummaryTagR175 = line;
      if (el.querySelector(".as-copy-category-summary-tag-r175")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-summary-tag-r175";
      btn.textContent = "复制分类摘要标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categorySummaryTagR175 || "");
        softBanner(ok ? "已复制分类摘要标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今+窗口截止（进位） */
  async function ensureCheckinLastAgoWindowEndsPlainR175Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoWindowEndsPlainR175CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoWindowEndsPlainR175CopyCard";
      card.className = "checkin-last-ago-window-ends-plain-r175-copy";
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR174CopyCard");
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR173CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR172CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const combo = lastAgo + " · " + windowEnds;
      const line =
        "报备距上次 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-window-ends-plain-r175-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoWindowEndsPlainR175CopyBtn">复制距上次窗口截止</button>`;
      const btn = $("#checkinLastAgoWindowEndsPlainR175CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次窗口截止" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次窗口截止文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制（进位） */
  async function ensureTravelThresholdBalanceDepositedPlainR175Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceDepositedPlainR175CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceDepositedPlainR175CopyCard";
      card.className = "travel-threshold-balance-deposited-plain-r175-copy";
      const balDep = $("#travelBalanceDepositedShortfallPlainR174CopyCard");
      const depShort = $("#travelDepositedShortfallThresholdPlainR173CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR172CopyCard");
      if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const combo = thr + " · " + balance + " · " + deposited;
      const line =
        "差旅门槛 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-deposited-plain-r175-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceDepositedPlainR175CopyBtn">复制门槛余额已存R175</button>`;
      const btn = $("#travelThresholdBalanceDepositedPlainR175CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额已存R175" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+服务类型组合复制（进位） */
  async function ensureAftercareCityHospitalServiceTypeCopyButtonsR175() {
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
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const line = city + " · " + hospital + " · " + serviceType;
      el.dataset.cityHospitalServiceTypeR175 = line;
      if (el.querySelector(".ac-copy-city-hospital-service-type-r175")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-hospital-service-type-r175";
      btn.textContent = "复制城市医院服务R175";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityHospitalServiceTypeR175 || "");
        softBanner(ok ? "已复制城市医院服务R175" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+时长提示+就绪组合复制（进位） */
  async function ensureAuthMissingDurationHintReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingDurationHintReadyCopyR175Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingDurationHintReadyCopyR175Card";
      card.className = "av-missing-duration-hint-ready-copy-r175";
      const durReady = $("#avDurationHintReadyCompleteCopyR174Card");
      const readyComplete = $("#avReadyCompleteMissingCopyR173Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR172Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
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
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const combo = missLabel + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-duration-hint-ready-copy-r175-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingDurationHintReadyCopyR175Btn">复制缺失时长就绪</button>`;
      const btn = $("#avMissingDurationHintReadyCopyR175Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失时长就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+编号组合复制（进位） */
  async function ensureHeirNameRelationIdCopyButtonsR175() {
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
      const idLabel = String(it.id);
      const line = name + " · " + relation + " · " + idLabel;
      if (el.querySelector(".bn-copy-name-relation-id-r175")) return;
      el.dataset.nameRelationIdR175 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-id-r175";
      btn.textContent = "复制姓名关系编号R175";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationIdR175 || "");
        softBanner(ok ? "已复制姓名关系编号R175" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+域名组合复制（进位） */
  async function ensureHandoverProgressPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneDomainCopyR175Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneDomainCopyR175Card";
      card.className = "hand-progress-pct-done-domain-copy-r175";
      const doneDom = $("#handDoneDomainSectionsCopyR174Card");
      const domSec = $("#handDomainSectionsProgressPctCopyR173Card");
      const secPct = $("#handSectionsProgressPctDoneCopyR172Card");
      if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
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
      let domain = "einherit.cn";
      try {
        const h = await api("/api/health");
        domain = String(h.domain || data.domain || "einherit.cn").trim();
      } catch (_) {
        domain = String(data.domain || "einherit.cn").trim();
      }
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-domain-copy-r175-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneDomainCopyR175Btn">复制进度完成域名</button>`;
      const btn = $("#handProgressPctDoneDomainCopyR175Btn");
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

  /* 10 · 设置·中文品牌+域名+ok+版本四元复制 + round 层含 175 */
  async function paintBrandDomainOkVersionR175CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandDomainOkVersionR175CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandDomainOkVersionR175CopyCard";
      card.className = "card settings-brand-domain-ok-version-r175-copy-card";
      const domOk = $("#settingsDomainOkVersionBrandEnR174CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR173CopyCard");
      const verEn = $("#settingsVersionBrandEnBrandOkR172CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const line = brand + " · " + domain + " · " + okLabel + " · " + ver;
      card.innerHTML = `<h3>品牌 · 域名 · 就绪 · 版本</h3>
        <p class="muted">一键复制中文品牌、域名、就绪态与版本（演示级）。</p>
        <p class="settings-brand-domain-ok-version-r175-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandDomainOkVersionR175CopyBtn">复制品牌域名就绪版本</button>`;
      const btn = $("#settingsBrandDomainOkVersionR175CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList175() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 175;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 175); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round175 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainBrandEn().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoWindowEndsPlainR175Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdBalanceDepositedPlainR175Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityHospitalServiceTypeCopyButtonsR175().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingDurationHintReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationIdCopyButtonsR175().catch(() => {}),
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
      setTimeout(() => paintHomeVersionDomainBrandEn().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoWindowEndsPlainR175Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceDepositedPlainR175Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalServiceTypeCopyButtonsR175().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingDurationHintReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationIdCopyButtonsR175().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandDomainOkVersionR175CopyCard().catch(() => {});
        paintRoundLayerList175();
      }, 890);
      setTimeout(() => {
        paintBrandDomainOkVersionR175CopyCard().catch(() => {});
        paintRoundLayerList175();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionDomainBrandEn().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoWindowEndsPlainR175Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceDepositedPlainR175Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalServiceTypeCopyButtonsR175().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingDurationHintReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationIdCopyButtonsR175().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandDomainOkVersionR175CopyCard().catch(() => {});
      paintRoundLayerList175();
    }, 910);
  }
})();
