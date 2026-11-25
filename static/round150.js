/* 电子继承 · 第一百五十批增量（叠在 round149…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round150SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+版本+英文品牌冷静条 */
  async function paintHomeOkVersionBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkVersionBrandEnCalmBarR150");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkVersionBrandEnCalmBarR150";
      bar.className = "home-ok-version-brand-en-calm-r150";
      bar.setAttribute("role", "status");
      const enBrand = $("#homeBrandEnBrandVersionCalmBarR149");
      const verDom = $("#homeVersionDomainOkCalmBarR148");
      const okEn = $("#homeOkBrandEnBrandCalmBarR147");
      if (enBrand && enBrand.parentNode === home)
        enBrand.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ready + " · " + ver + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-brand-en-calm-r150-mark">就绪</span>
        <span class="muted home-ok-version-brand-en-calm-r150-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionBrandEnCalmGoR150">去设置</button>`;
      const btn = $("#homeOkVersionBrandEnCalmGoR150");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-brand-en-calm-r150-mark">就绪</span>
        <span class="muted home-ok-version-brand-en-calm-r150-sub">就绪版本英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionBrandEnCalmGoR150">去设置</button>`;
      const btn = $("#homeOkVersionBrandEnCalmGoR150");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+设备归属+处置方式组合复制 */
  async function ensureLegacyIdDeviceOwnerDispositionCopyButtons() {
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
      const id = String(it.id);
      const owner =
        String(it.device_owner || it.dept || it.beneficiary || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = "#" + id + " · " + owner + " · " + disposition;
      el.dataset.idDeviceOwnerDisposition = line;
      if (el.querySelector(".lg-copy-id-device-owner-disposition")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-device-owner-disposition";
      btn.textContent = "复制编号归属处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDeviceOwnerDisposition || "");
        softBanner(ok ? "已复制编号归属处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标题+标签+可见性组合复制 */
  async function ensureAssetTitleTagVisibilityCopyButtons() {
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
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const tag =
        String(it.tag || it.category || it.dept || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = title + " · " + tag + " · " + visibility;
      el.dataset.titleTagVisibility = line;
      if (el.querySelector(".as-copy-title-tag-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-title-tag-visibility";
      btn.textContent = "复制标题标签可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleTagVisibility || "");
        softBanner(ok ? "已复制标题标签可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+距上次标签 */
  async function ensureCheckinStatusLabelLastAgoPlainR150Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelLastAgoPlainR150CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelLastAgoPlainR150CopyCard";
      card.className = "checkin-status-label-last-ago-plain-r150-copy";
      const nextWin = $("#checkinNextAtWindowEndsPlainR149CopyCard");
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR148CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR147CopyCard");
      if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
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
        ).trim() || "未标注";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = statusLabel + " · " + lastAgo;
      const line =
        "报备状态 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-last-ago-plain-r150-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelLastAgoPlainR150CopyBtn">复制状态距上次R150</button>`;
      const btn = $("#checkinStatusLabelLastAgoPlainR150CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距上次R150" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+进度百分比+余额三元复制 */
  async function ensureTravelThresholdProgressBalancePlainR150Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdProgressBalancePlainR150CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdProgressBalancePlainR150CopyCard";
      card.className = "travel-threshold-progress-balance-plain-r150-copy";
      const balShort = $("#travelBalanceShortfallDepositedPlainR149CopyCard");
      const progDep = $("#travelProgressDepositedThresholdPlainR148CopyCard");
      const thrShort = $("#travelThresholdShortfallBalancePlainR147CopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = thr + " · " + pct + " · " + bal;
      const line =
        "差旅门槛 · 进度 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-progress-balance-plain-r150-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdProgressBalancePlainR150CopyBtn">复制门槛进度余额</button>`;
      const btn = $("#travelThresholdProgressBalancePlainR150CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛进度余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛进度余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅/善后医院+城市+科室组合复制 */
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
        String(it.hospital || it.facility || "").trim() || "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const line = hospital + " · " + city + " · " + department;
      el.dataset.hospitalCityDepartment = line;
      if (el.querySelector(".ac-copy-hospital-city-department")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-city-department";
      btn.textContent = "复制医院城市科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalCityDepartment || "");
        softBanner(ok ? "已复制医院城市科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+完成态+就绪组合复制 */
  async function ensureAuthDurationCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationCompleteReadyCopyR150Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationCompleteReadyCopyR150Card";
      card.className = "av-duration-complete-ready-copy-r150";
      const completeReady = $("#avCompleteReadyMissingCopyR149Card");
      const readyMiss = $("#avReadyMissingDurationCopyR148Card");
      const completeDur = $("#avCompleteDurationReadyCopyR147Card");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "未填时长";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = duration + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-complete-ready-copy-r150-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationCompleteReadyCopyR150Btn">复制时长完成就绪</button>`;
      const btn = $("#avDurationCompleteReadyCopyR150Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+编号+关系组合复制 */
  async function ensureHeirContactIdRelationCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · #" + id + " · " + relation;
      if (el.querySelector(".bn-copy-contact-id-relation-r150")) return;
      el.dataset.contactIdRelationR150 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-id-relation-r150";
      btn.textContent = "复制联系编号关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactIdRelationR150 || "");
        softBanner(ok ? "已复制联系编号关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+进度百分比+品牌组合复制 */
  async function ensureHandoverDomainPctBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainPctBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainPctBrandCopyCard";
      card.className = "hand-domain-pct-brand-copy";
      const pctDone = $("#handPctDoneSectionsCopyCard");
      const brandDom = $("#handBrandDomainSectionsCopyR148Card");
      const secPct = $("#handSectionsPctDoneCopyCard");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
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
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (data.progress_pct != null) pct = String(data.progress_pct) + "%";
      else if (typeof data.progress === "number")
        pct = String(data.progress) + "%";
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const combo = domain + " · " + pct + " · " + brand;
      const line = "手册域名 · 进度 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-pct-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainPctBrandCopyBtn">复制域名进度品牌</button>`;
      const btn = $("#handDomainPctBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名进度品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+版本+英文品牌+中文品牌四元复制 + round 层含 150 */
  async function paintOkVersionBrandEnBrandR150CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandEnBrandR150CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandEnBrandR150CopyCard";
      card.className = "card settings-ok-version-brand-en-brand-r150-copy-card";
      const brandEn = $("#settingsBrandBrandEnOkDomainR149CopyCard");
      const verDom = $("#settingsVersionDomainOkBrandR148CopyCard");
      const brandEnOk = $("#settingsBrandEnOkVersionDomainR147CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk && brandEnOk.parentNode)
        brandEnOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = ready + " · " + ver + " · " + en + " · " + brand;
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3>
        <p class="muted">一键复制就绪状态、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-ok-version-brand-en-brand-r150-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandEnBrandR150CopyBtn">复制就绪版本英文品牌</button>`;
      const btn = $("#settingsOkVersionBrandEnBrandR150CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList150() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 150;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 150); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round150 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 970);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyIdDeviceOwnerDispositionCopyButtons().catch(() => {}),
      800
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTitleTagVisibilityCopyButtons().catch(() => {}),
      800
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelLastAgoPlainR150Copy().catch(() => {}),
      790
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdProgressBalancePlainR150Copy().catch(() => {}),
      810
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {}),
      800
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationCompleteReadyCopy().catch(() => {}),
      770
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactIdRelationCopyButtons().catch(() => {}),
      800
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainPctBrandCopy().catch(() => {}),
      810
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 970);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyIdDeviceOwnerDispositionCopyButtons().catch(() => {}),
        820
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTitleTagVisibilityCopyButtons().catch(() => {}),
        810
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelLastAgoPlainR150Copy().catch(() => {}),
        810
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdProgressBalancePlainR150Copy().catch(
            () => {}
          ),
        830
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {}),
        820
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationCompleteReadyCopy().catch(() => {}),
        790
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactIdRelationCopyButtons().catch(() => {}),
        810
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainPctBrandCopy().catch(() => {}),
        820
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandEnBrandR150CopyCard().catch(() => {});
        paintRoundLayerList150();
      }, 860);
      setTimeout(() => {
        paintOkVersionBrandEnBrandR150CopyCard().catch(() => {});
        paintRoundLayerList150();
      }, 1540);
    }
  };

  setTimeout(() => paintHomeOkVersionBrandEn().catch(() => {}), 1020);
  setTimeout(
    () => ensureLegacyIdDeviceOwnerDispositionCopyButtons().catch(() => {}),
    1040
  );
  setTimeout(
    () => ensureAssetTitleTagVisibilityCopyButtons().catch(() => {}),
    1060
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelLastAgoPlainR150Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdProgressBalancePlainR150Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalCityDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactIdRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainPctBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandEnBrandR150CopyCard().catch(() => {});
      paintRoundLayerList150();
    }, 880);
  }
})();
