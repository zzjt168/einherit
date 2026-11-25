/* 电子继承 · 第一百四十八批增量（叠在 round147…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round148SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+域名+就绪冷静条 */
  async function paintHomeVersionDomainOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionDomainOkCalmBarR148");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionDomainOkCalmBarR148";
      bar.className = "home-version-domain-ok-calm-r148";
      bar.setAttribute("role", "status");
      const okEn = $("#homeOkBrandEnBrandCalmBarR147");
      const enVer = $("#homeBrandEnVersionDomainCalmBarR146");
      const domainOk = $("#homeDomainOkBrandCalmBarR145");
      if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (enVer && enVer.parentNode === home)
        enVer.insertAdjacentElement("afterend", bar);
      else if (domainOk && domainOk.parentNode === home)
        domainOk.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = ver + " · " + domain + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-ok-calm-r148-mark">版本</span>
        <span class="muted home-version-domain-ok-calm-r148-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainOkCalmGoR148">去设置</button>`;
      const btn = $("#homeVersionDomainOkCalmGoR148");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-ok-calm-r148-mark">版本</span>
        <span class="muted home-version-domain-ok-calm-r148-sub">版本域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainOkCalmGoR148">去设置</button>`;
      const btn = $("#homeVersionDomainOkCalmGoR148");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置方式+编号+设备归属组合复制 */
  async function ensureLegacyDispositionIdDeviceOwnerCopyButtons() {
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
      if (!it || it.id == null) return;
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const id = String(it.id);
      const owner =
        String(it.device_owner || it.dept || it.beneficiary || "").trim() ||
        "未填归属";
      const line = disposition + " · #" + id + " · " + owner;
      el.dataset.dispositionIdDeviceOwner = line;
      if (el.querySelector(".lg-copy-disposition-id-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-id-device-owner";
      btn.textContent = "复制处置编号归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionIdDeviceOwner || "");
        softBanner(ok ? "已复制处置编号归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+平台+可见性组合复制 */
  async function ensureAssetTagPlatformVisibilityR148CopyButtons() {
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
      const tag =
        String(it.tag || it.category || it.dept || "").trim() || "未填标签";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = tag + " · " + platform + " · " + visibility;
      el.dataset.tagPlatformVisibilityR148 = line;
      if (el.querySelector(".as-copy-tag-platform-visibility-r148")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-platform-visibility-r148";
      btn.textContent = "复制标签平台可见R148";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagPlatformVisibilityR148 || "");
        softBanner(ok ? "已复制标签平台可见R148" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+状态标签 */
  async function ensureCheckinWindowEndsStatusLabelPlainR148Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsStatusLabelPlainR148CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsStatusLabelPlainR148CopyCard";
      card.className = "checkin-window-ends-status-label-plain-r148-copy";
      const nextLast = $("#checkinNextAtLastAgoPlainR147CopyCard");
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR146CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR145CopyCard");
      if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const combo = windowEnds + " · " + statusLabel;
      const line =
        "报备窗口截止 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-status-label-plain-r148-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsStatusLabelPlainR148CopyBtn">复制窗口状态R148</button>`;
      const btn = $("#checkinWindowEndsStatusLabelPlainR148CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口状态R148" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+已存+门槛三元复制 */
  async function ensureTravelProgressDepositedThresholdPlainR148Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressDepositedThresholdPlainR148CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressDepositedThresholdPlainR148CopyCard";
      card.className = "travel-progress-deposited-threshold-plain-r148-copy";
      const thrShort = $("#travelThresholdShortfallBalancePlainR147CopyCard");
      const progMet = $("#travelProgressMetDepositedPlainR146CopyCard");
      const depBal = $("#travelDepositedBalanceShortfallPlainR145CopyCard");
      if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (progMet && progMet.parentNode)
        progMet.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted travel-progress-deposited-threshold-plain-r148-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressDepositedThresholdPlainR148CopyBtn">复制进度已存门槛</button>`;
      const btn = $("#travelProgressDepositedThresholdPlainR148CopyBtn");
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

  /* 6 · 医旅/善后城市+科室+医院组合复制 */
  async function ensureAftercareCityDepartmentHospitalR148CopyButtons() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const hospital =
        String(it.hospital || it.facility || "").trim() || "未填医院";
      const line = city + " · " + department + " · " + hospital;
      el.dataset.cityDepartmentHospitalR148 = line;
      if (el.querySelector(".ac-copy-city-department-hospital-r148")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-department-hospital-r148";
      btn.textContent = "复制城市科室医院R148";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityDepartmentHospitalR148 || "");
        softBanner(ok ? "已复制城市科室医院R148" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+缺失项+时长提示组合复制 */
  async function ensureAuthReadyMissingDurationCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingDurationCopyR148Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingDurationCopyR148Card";
      card.className = "av-ready-missing-duration-copy-r148";
      const completeDur = $("#avCompleteDurationReadyCopyR147Card");
      const durReady = $("#avDurationReadyMissingCopyR146Card");
      const missComplete = $("#avMissingCompleteReadyCopyR145Card");
      if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
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
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "未填时长";
      const combo = ready + " · " + missLabel + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-duration-copy-r148-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingDurationCopyR148Btn">复制就绪缺失时长</button>`;
      const btn = $("#avReadyMissingDurationCopyR148Btn");
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

  /* 8 · 受益人姓名+关系+联系方式组合复制 */
  async function ensureHeirNameRelationContactCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact-r148")) return;
      el.dataset.nameRelationContactR148 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact-r148";
      btn.textContent = "复制姓名关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContactR148 || "");
        softBanner(ok ? "已复制姓名关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+章节数组合复制 */
  async function ensureHandoverBrandDomainSectionsR148Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainSectionsCopyR148Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainSectionsCopyR148Card";
      card.className = "hand-brand-domain-sections-copy-r148";
      const secPct = $("#handSectionsPctDoneCopyCard");
      const brandDom = $("#handBrandDomainSectionsCopyCard");
      const pctDone = $("#handPctDoneDomainCopyCard");
      if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
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
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = brand + " · " + domain + " · " + sectionsCount;
      const line = "手册品牌 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-sections-copy-r148-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainSectionsCopyR148Btn">复制品牌域名章节R148</button>`;
      const btn = $("#handBrandDomainSectionsCopyR148Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌域名章节R148" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+就绪+中文品牌四元复制 + round 层含 148 */
  async function paintVersionDomainOkBrandR148CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionDomainOkBrandR148CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionDomainOkBrandR148CopyCard";
      card.className = "card settings-version-domain-ok-brand-r148-copy-card";
      const brandEn = $("#settingsBrandEnOkVersionDomainR147CopyCard");
      const verDom = $("#settingsVersionDomainOkBrandR146CopyCard");
      const domainOk = $("#settingsDomainOkBrandEnBrandR145CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = ver + " · " + domain + " · " + ready + " · " + brand;
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 品牌</h3>
        <p class="muted">一键复制版本、域名、就绪状态与中文品牌（演示级 · R148）。</p>
        <p class="settings-version-domain-ok-brand-r148-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionDomainOkBrandR148CopyBtn">复制版本域名就绪品牌R148</button>`;
      const btn = $("#settingsVersionDomainOkBrandR148CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名就绪品牌R148" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList148() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 148;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 148); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round148 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 950);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDispositionIdDeviceOwnerCopyButtons().catch(() => {}),
      780
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagPlatformVisibilityR148CopyButtons().catch(() => {}),
      780
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsStatusLabelPlainR148Copy().catch(() => {}),
      770
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressDepositedThresholdPlainR148Copy().catch(
          () => {}
        ),
      790
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityDepartmentHospitalR148CopyButtons().catch(
          () => {}
        ),
      780
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingDurationCopy().catch(() => {}),
      750
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
      780
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainSectionsR148Copy().catch(() => {}),
      790
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 950);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionIdDeviceOwnerCopyButtons().catch(() => {}),
        800
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetTagPlatformVisibilityR148CopyButtons().catch(() => {}),
        790
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsStatusLabelPlainR148Copy().catch(() => {}),
        790
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressDepositedThresholdPlainR148Copy().catch(
            () => {}
          ),
        810
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentHospitalR148CopyButtons().catch(
            () => {}
          ),
        800
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingDurationCopy().catch(() => {}),
        770
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
        790
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainSectionsR148Copy().catch(() => {}),
        800
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainOkBrandR148CopyCard().catch(() => {});
        paintRoundLayerList148();
      }, 840);
      setTimeout(() => {
        paintVersionDomainOkBrandR148CopyCard().catch(() => {});
        paintRoundLayerList148();
      }, 1520);
    }
  };

  setTimeout(() => paintHomeVersionDomainOk().catch(() => {}), 1000);
  setTimeout(
    () => ensureLegacyDispositionIdDeviceOwnerCopyButtons().catch(() => {}),
    1020
  );
  setTimeout(
    () => ensureAssetTagPlatformVisibilityR148CopyButtons().catch(() => {}),
    1040
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsStatusLabelPlainR148Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressDepositedThresholdPlainR148Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentHospitalR148CopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingDurationCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainSectionsR148Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainOkBrandR148CopyCard().catch(() => {});
      paintRoundLayerList148();
    }, 860);
  }
})();
