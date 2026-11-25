/* 电子继承 · 第一百四十六批增量（叠在 round145…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round146SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+版本+域名冷静条 */
  async function paintHomeBrandEnVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionDomainCalmBarR146");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionDomainCalmBarR146";
      bar.className = "home-brand-en-version-domain-calm-r146";
      bar.setAttribute("role", "status");
      const domainOk = $("#homeDomainOkBrandCalmBarR145");
      const okBrand = $("#homeOkBrandVersionCalmBarR144");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR143");
      if (domainOk && domainOk.parentNode === home)
        domainOk.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + ver + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r146-mark">英文</span>
        <span class="muted home-brand-en-version-domain-calm-r146-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR146">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR146");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r146-mark">英文</span>
        <span class="muted home-brand-en-version-domain-calm-r146-sub">英文版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR146">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR146");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+编号+受益人组合复制 */
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
      if (!it || it.id == null) return;
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const id = String(it.id);
      const beneficiary =
        String(it.beneficiary || it.device_owner || "").trim() || "未填受益人";
      const line = disposition + " · #" + id + " · " + beneficiary;
      el.dataset.dispositionIdBeneficiary = line;
      if (el.querySelector(".lg-copy-disposition-id-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-id-beneficiary";
      btn.textContent = "复制处置编号受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionIdBeneficiary || "");
        softBanner(ok ? "已复制处置编号受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+平台+可见性组合复制 */
  async function ensureAssetTagPlatformVisibilityCopyButtons() {
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
      const tag = String(it.tag || it.category || it.dept || "").trim() || "未填标签";
      const platform = String(it.platform || it.title || "").trim() || "未填平台";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = tag + " · " + platform + " · " + visibility;
      el.dataset.tagPlatformVisibility = line;
      if (el.querySelector(".as-copy-tag-platform-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-platform-visibility";
      btn.textContent = "复制标签平台可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagPlatformVisibility || "");
        softBanner(ok ? "已复制标签平台可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+状态标签 */
  async function ensureCheckinWindowEndsStatusLabelPlainR146Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsStatusLabelPlainR146CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsStatusLabelPlainR146CopyCard";
      card.className = "checkin-window-ends-status-label-plain-r146-copy";
      const lastWin = $("#checkinLastAgoWindowEndsPlainR145CopyCard");
      const statusNext = $("#checkinStatusLabelNextAtPlainR144CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR143CopyCard");
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
      card.innerHTML = `<p class="muted checkin-window-ends-status-label-plain-r146-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsStatusLabelPlainR146CopyBtn">复制窗口状态R146</button>`;
      const btn = $("#checkinWindowEndsStatusLabelPlainR146CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口状态R146" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+达标+已存三元复制 */
  async function ensureTravelProgressMetDepositedPlainR146Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressMetDepositedPlainR146CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressMetDepositedPlainR146CopyCard";
      card.className = "travel-progress-met-deposited-plain-r146-copy";
      const depBal = $("#travelDepositedBalanceShortfallPlainR145CopyCard");
      const balMet = $("#travelBalanceMetThresholdPlainR144CopyCard");
      const shortThr = $("#travelShortfallThresholdProgressPlainR143CopyCard");
      if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = pct + " · " + met + " · " + deposited;
      const line =
        "差旅进度 · 达标 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-met-deposited-plain-r146-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressMetDepositedPlainR146CopyBtn">复制进度达标已存</button>`;
      const btn = $("#travelProgressMetDepositedPlainR146CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度达标已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度达标已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+科室+医院组合复制 */
  async function ensureAftercareCityDepartmentHospitalCopyButtons() {
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
      el.dataset.cityDepartmentHospital = line;
      if (el.querySelector(".ac-copy-city-department-hospital-r146")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-department-hospital-r146";
      btn.textContent = "复制城市科室医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityDepartmentHospital || "");
        softBanner(ok ? "已复制城市科室医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+缺失项组合复制 */
  async function ensureAuthDurationReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationReadyMissingCopyR146Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationReadyMissingCopyR146Card";
      card.className = "av-duration-ready-missing-copy-r146";
      const missComplete = $("#avMissingCompleteReadyCopyR145Card");
      const readyTitle = $("#avReadyTitleMissingCopyR144Card");
      const durComplete = $("#avDurationCompleteTitleCopyR143Card");
      if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (readyTitle && readyTitle.parentNode)
        readyTitle.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
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
      const combo = duration + " · " + ready + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-ready-missing-copy-r146-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationReadyMissingCopyR146Btn">复制时长就绪缺失</button>`;
      const btn = $("#avDurationReadyMissingCopyR146Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+姓名+关系组合复制 */
  async function ensureHeirContactNameRelationCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation-r146")) return;
      el.dataset.contactNameRelationR146 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation-r146";
      btn.textContent = "复制联系姓名关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelationR146 || "");
        softBanner(ok ? "已复制联系姓名关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+章节数组合复制 */
  async function ensureHandoverBrandDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainSectionsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainSectionsCopyCard";
      card.className = "hand-brand-domain-sections-copy";
      const pctDone = $("#handPctDoneDomainCopyCard");
      const doneBrand = $("#handDoneBrandSectionsCopyCard");
      const domSec = $("#handDomainSectionsProgressCopyCard");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted hand-brand-domain-sections-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainSectionsCopyBtn">复制品牌域名章节</button>`;
      const btn = $("#handBrandDomainSectionsCopyBtn");
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

  /* 10 · 设置·版本+域名+就绪+中文品牌四元复制 + round 层含 146 */
  async function paintVersionDomainOkBrandR146CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionDomainOkBrandR146CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionDomainOkBrandR146CopyCard";
      card.className = "card settings-version-domain-ok-brand-r146-copy-card";
      const domainOk = $("#settingsDomainOkBrandEnBrandR145CopyCard");
      const okBrand = $("#settingsOkBrandEnBrandVersionR144CopyCard");
      const brandVer = $("#settingsBrandVersionBrandEnDomainR143CopyCard");
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = ver + " · " + domain + " · " + ready + " · " + brand;
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 品牌</h3>
        <p class="muted">一键复制版本、域名、就绪状态与中文品牌（演示级）。</p>
        <p class="settings-version-domain-ok-brand-r146-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionDomainOkBrandR146CopyBtn">复制版本域名就绪品牌</button>`;
      const btn = $("#settingsVersionDomainOkBrandR146CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名就绪品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList146() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 146;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 146); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round146 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 930);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
      760
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagPlatformVisibilityCopyButtons().catch(() => {}),
      760
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsStatusLabelPlainR146Copy().catch(() => {}),
      750
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressMetDepositedPlainR146Copy().catch(() => {}),
      770
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
      760
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationReadyMissingCopy().catch(() => {}),
      730
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
      760
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainSectionsCopy().catch(() => {}),
      770
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 930);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
        780
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagPlatformVisibilityCopyButtons().catch(() => {}),
        770
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsStatusLabelPlainR146Copy().catch(() => {}),
        770
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressMetDepositedPlainR146Copy().catch(() => {}),
        790
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
        780
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationReadyMissingCopy().catch(() => {}),
        750
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
        770
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainSectionsCopy().catch(() => {}),
        780
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainOkBrandR146CopyCard().catch(() => {});
        paintRoundLayerList146();
      }, 820);
      setTimeout(() => {
        paintVersionDomainOkBrandR146CopyCard().catch(() => {});
        paintRoundLayerList146();
      }, 1500);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 980);
  setTimeout(
    () => ensureLegacyDispositionIdBeneficiaryCopyButtons().catch(() => {}),
    1000
  );
  setTimeout(
    () => ensureAssetTagPlatformVisibilityCopyButtons().catch(() => {}),
    1020
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsStatusLabelPlainR146Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressMetDepositedPlainR146Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainOkBrandR146CopyCard().catch(() => {});
      paintRoundLayerList146();
    }, 840);
  }
})();
