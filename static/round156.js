/* 电子继承 · 第一百五十六批增量（叠在 round155…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round156SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+中文品牌+版本冷静条 */
  async function paintHomeDomainBrandVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandVersionCalmBarR156");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandVersionCalmBarR156";
      bar.className = "home-domain-brand-version-calm-r156";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnVersionOkCalmBarR155");
      const okDom = $("#homeOkDomainBrandCalmBarR154");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR153");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + brand + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-version-calm-r156-mark">域名</span>
        <span class="muted home-domain-brand-version-calm-r156-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandVersionCalmGoR156">去设置</button>`;
      const btn = $("#homeDomainBrandVersionCalmGoR156");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-version-calm-r156-mark">域名</span>
        <span class="muted home-domain-brand-version-calm-r156-sub">域名品牌版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandVersionCalmGoR156">去设置</button>`;
      const btn = $("#homeDomainBrandVersionCalmGoR156");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置方式+受益人+设备归属组合复制 */
  async function ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const line = disposition + " · " + beneficiary + " · " + owner;
      el.dataset.dispositionBeneficiaryDeviceOwner = line;
      if (el.querySelector(".lg-copy-disposition-beneficiary-device-owner"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-beneficiary-device-owner";
      btn.textContent = "复制处置受益人归属";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryDeviceOwner || ""
        );
        softBanner(ok ? "已复制处置受益人归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+可见性+摘要组合复制 */
  async function ensureAssetCategoryVisibilitySummaryCopyButtons() {
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
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = category + " · " + visibility + " · " + summary;
      el.dataset.categoryVisibilitySummary = line;
      if (el.querySelector(".as-copy-category-visibility-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-visibility-summary";
      btn.textContent = "复制分类可见摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryVisibilitySummary || "");
        softBanner(ok ? "已复制分类可见摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+下次建议 */
  async function ensureCheckinStatusLabelNextAtPlainR156Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelNextAtPlainR156CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelNextAtPlainR156CopyCard";
      card.className = "checkin-status-label-next-at-plain-r156-copy";
      const nextWin = $("#checkinNextAtWindowEndsPlainR155CopyCard");
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR154CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR153CopyCard");
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
            cd.status ||
            ""
        ).trim() || "暂无状态";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = statusLabel + " · " + nextAt;
      const line =
        "报备状态 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-next-at-plain-r156-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelNextAtPlainR156CopyBtn">复制状态下次R156</button>`;
      const btn = $("#checkinStatusLabelNextAtPlainR156CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态下次R156" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+门槛+短差三元复制 */
  async function ensureTravelProgressThresholdShortfallPlainR156Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressThresholdShortfallPlainR156CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressThresholdShortfallPlainR156CopyCard";
      card.className = "travel-progress-threshold-shortfall-plain-r156-copy";
      const thrDep = $("#travelThresholdDepositedBalancePlainR155CopyCard");
      const shortBal = $("#travelShortfallBalanceDepositedPlainR154CopyCard");
      const balThr = $("#travelBalanceThresholdProgressPlainR153CopyCard");
      if (thrDep && thrDep.parentNode)
        thrDep.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
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
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = pct + " · " + thr + " · " + shortfall;
      const line =
        "差旅进度 · 门槛 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-threshold-shortfall-plain-r156-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressThresholdShortfallPlainR156CopyBtn">复制进度门槛短差</button>`;
      const btn = $("#travelProgressThresholdShortfallPlainR156CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度门槛短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度门槛短差文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+城市+医院组合复制 */
  async function ensureAftercareDepartmentCityHospitalCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospital = line;
      if (el.querySelector(".ac-copy-department-city-hospital")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-city-hospital";
      btn.textContent = "复制科室城市医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentCityHospital || "");
        softBanner(ok ? "已复制科室城市医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+缺失项+完成态组合复制 */
  async function ensureAuthReadyMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingCompleteCopyR156Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingCompleteCopyR156Card";
      card.className = "av-ready-missing-complete-copy-r156";
      const completeDur = $("#avCompleteDurationHintMissingCopyR155Card");
      const durMiss = $("#avDurationHintMissingReadyCopyR154Card");
      const missReady = $("#avMissingReadyCompleteCopyR153Card");
      if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
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
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = ready + " · " + missLabel + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-complete-copy-r156-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingCompleteCopyR156Btn">复制就绪缺失完成</button>`;
      const btn = $("#avReadyMissingCompleteCopyR156Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪缺失完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+关系组合复制 */
  async function ensureHeirIdNameRelationCopyButtons() {
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
      const id = String(it.id);
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = id + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-id-name-relation-r156")) return;
      el.dataset.idNameRelationR156 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-relation-r156";
      btn.textContent = "复制编号姓名关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameRelationR156 || "");
        softBanner(ok ? "已复制编号姓名关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+完成数+章节数组合复制 */
  async function ensureHandoverDomainDoneSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainDoneSectionsCopyR156Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainDoneSectionsCopyR156Card";
      card.className = "hand-domain-done-sections-copy-r156";
      const donePct = $("#handDoneProgressPctBrandCopyR155Card");
      const pctDom = $("#handProgressPctDomainSectionsCopyR154Card");
      const brandSec = $("#handBrandSectionsDoneCopyCard");
      if (donePct && donePct.parentNode)
        donePct.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (brandSec && brandSec.parentNode)
        brandSec.insertAdjacentElement("afterend", card);
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
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = domain + " · " + done + " · " + sectionsCount;
      const line = "手册域名 · 完成 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-done-sections-copy-r156-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainDoneSectionsCopyR156Btn">复制域名完成章节</button>`;
      const btn = $("#handDomainDoneSectionsCopyR156Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名完成章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名完成章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+版本+中文品牌+英文品牌四元复制 + round 层含 156 */
  async function paintDomainVersionBrandBrandEnR156CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainVersionBrandBrandEnR156CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainVersionBrandBrandEnR156CopyCard";
      card.className =
        "card settings-domain-version-brand-brand-en-r156-copy-card";
      const verEn = $("#settingsVersionBrandEnOkBrandR155CopyCard");
      const okBrand = $("#settingsOkBrandDomainVersionR154CopyCard");
      const brandEn = $("#settingsBrandEnBrandVersionDomainR153CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + ver + " · " + brand + " · " + en;
      card.innerHTML = `<h3>域名 · 版本 · 品牌 · 英文</h3>
        <p class="muted">一键复制域名、版本、中文品牌与英文品牌（演示级）。</p>
        <p class="settings-domain-version-brand-brand-en-r156-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainVersionBrandBrandEnR156CopyBtn">复制域名版本品牌英文</button>`;
      const btn = $("#settingsDomainVersionBrandBrandEnR156CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名版本品牌英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 版本 · 品牌 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList156() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 156;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 156); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round156 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryVisibilitySummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelNextAtPlainR156Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressThresholdShortfallPlainR156Copy().catch(
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
        ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNameRelationCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainDoneSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetCategoryVisibilitySummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelNextAtPlainR156Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressThresholdShortfallPlainR156Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNameRelationCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainDoneSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainVersionBrandBrandEnR156CopyCard().catch(() => {});
        paintRoundLayerList156();
      }, 890);
      setTimeout(() => {
        paintDomainVersionBrandBrandEnR156CopyCard().catch(() => {});
        paintRoundLayerList156();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
        () => {}
      ),
    1070
  );
  setTimeout(
    () => ensureAssetCategoryVisibilitySummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelNextAtPlainR156Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressThresholdShortfallPlainR156Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainDoneSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainVersionBrandBrandEnR156CopyCard().catch(() => {});
      paintRoundLayerList156();
    }, 910);
  }
})();
