/* 电子继承 · 第一百四十三批增量（叠在 round142…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round143SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+版本+英文品牌冷静条 */
  async function paintHomeBrandVersionBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandVersionBrandEnCalmBarR143");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandVersionBrandEnCalmBarR143";
      bar.className = "home-brand-version-brand-en-calm-r143";
      bar.setAttribute("role", "status");
      const enOk = $("#homeBrandEnOkDomainCalmBarR142");
      const verBrand = $("#homeVersionBrandOkCalmBarR141");
      const okDom = $("#homeOkDomainBrandEnCalmBarR140");
      if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = brand + " · " + ver + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r143-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r143-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR143">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR143");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r143-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r143-sub">品牌版本英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR143">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR143");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+处置组合复制 */
  async function ensureLegacyIdTitleDispositionCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = "#" + id + " · " + title + " · " + disposition;
      el.dataset.idTitleDisposition = line;
      if (el.querySelector(".lg-copy-id-title-disposition")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-disposition";
      btn.textContent = "复制编号标题处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleDisposition || "");
        softBanner(ok ? "已复制编号标题处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要+标签组合复制 */
  async function ensureAssetPlatformSummaryTagCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const summary = String(it.summary || "").trim() || "无摘要";
      const tag = String(it.tag || "").trim() || "无标签";
      const line = platform + " · " + summary + " · " + tag;
      el.dataset.platformSummaryTag = line;
      if (el.querySelector(".as-copy-platform-summary-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary-tag";
      btn.textContent = "复制平台摘要标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformSummaryTag || "");
        softBanner(ok ? "已复制平台摘要标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止 */
  async function ensureCheckinNextAtWindowEndsPlainR143Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtWindowEndsPlainR143CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtWindowEndsPlainR143CopyCard";
      card.className = "checkin-next-at-window-ends-plain-r143-copy";
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR142CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR141CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR140CopyCard");
      if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const combo = nextAt + " · " + windowEnds;
      const line =
        "下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-window-ends-plain-r143-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtWindowEndsPlainR143CopyBtn">复制下次窗口R143</button>`;
      const btn = $("#checkinNextAtWindowEndsPlainR143CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口R143" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+门槛+进度百分比三元复制 */
  async function ensureTravelShortfallThresholdProgressPlainR143Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdProgressPlainR143CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdProgressPlainR143CopyCard";
      card.className = "travel-shortfall-threshold-progress-plain-r143-copy";
      const metDep = $("#travelMetDepositedProgressPlainR142CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR141CopyCard");
      const balProg = $("#travelBalanceProgressShortfallPlainR140CopyCard");
      if (metDep && metDep.parentNode)
        metDep.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const pct =
        fund.progress_pct != null
          ? String(Math.round(Number(fund.progress_pct)))
          : fund.progress != null
            ? String(Math.round(Number(fund.progress)))
            : "—";
      const combo = short + " · " + thr + " · " + pct + "%";
      const line =
        "差旅缺口 · 门槛 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-progress-plain-r143-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdProgressPlainR143CopyBtn">复制缺口门槛进度</button>`;
      const btn = $("#travelShortfallThresholdProgressPlainR143CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口门槛进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口门槛进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+医院+科室组合复制 */
  async function ensureAftercareServiceHospitalDepartmentCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const line = service + " · " + hospital + " · " + department;
      el.dataset.serviceHospitalDepartment = line;
      if (el.querySelector(".ac-copy-service-hospital-department")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-hospital-department";
      btn.textContent = "复制服务医院科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceHospitalDepartment || "");
        softBanner(ok ? "已复制服务医院科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+完成态+标题组合复制 */
  async function ensureAuthDurationCompleteTitleCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationCompleteTitleCopyR143Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationCompleteTitleCopyR143Card";
      card.className = "av-duration-complete-title-copy-r143";
      const completeReady = $("#avCompleteReadyMissingCopyR142Card");
      const titleMiss = $("#avTitleMissingDurationCopyR141Card");
      const readyDur = $("#avReadyDurationCompleteCopyR140Card");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (titleMiss && titleMiss.parentNode)
        titleMiss.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const latest = data.latest || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const title =
        String(
          data.title ||
            latest.original_name ||
            latest.active_label ||
            (script0 && script0.title) ||
            ""
        ).trim() || "授权视频";
      const combo = duration + " · " + complete + " · " + title;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-complete-title-copy-r143-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationCompleteTitleCopyR143Btn">复制时长完成标题</button>`;
      const btn = $("#avDurationCompleteTitleCopyR143Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长完成标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成标题暂不可用</p>`;
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
      const line = name + " · " + relation + " · #" + id;
      if (el.querySelector(".bn-copy-name-relation-id")) return;
      el.dataset.nameRelationId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-id";
      btn.textContent = "复制姓名关系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationId || "");
        softBanner(ok ? "已复制姓名关系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+进度百分比组合复制 */
  async function ensureHandoverDomainSectionsProgressCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsProgressCopyCard";
      card.className = "hand-domain-sections-progress-copy";
      const progBrand = $("#handProgressBrandDoneCopyCard");
      const secDone = $("#handSectionsDoneDomainCopyCard");
      const doneDom = $("#handDoneDomainProgressCopyCard");
      if (progBrand && progBrand.parentNode)
        progBrand.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain = String(data.domain || "").trim() || "无域名";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const combo = domain + " · " + sectionsCount + " · " + pct + "%";
      const line = "手册域名 · 章节 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-sections-progress-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsProgressCopyBtn">复制域名章节进度</button>`;
      const btn = $("#handDomainSectionsProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+版本+英文品牌+域名四元复制 + round 层含 143 */
  async function paintBrandVersionBrandEnDomainR143CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandVersionBrandEnDomainR143CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandVersionBrandEnDomainR143CopyCard";
      card.className = "card settings-brand-version-brand-en-domain-r143-copy-card";
      const enDom = $("#settingsBrandEnDomainOkVersionR142CopyCard");
      const domBrand = $("#settingsDomainBrandVersionOkR141CopyCard");
      const verOk = $("#settingsVersionOkBrandBrandEnR140CopyCard");
      const roundList = $("#roundLayerListCard");
      if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = brand + " · " + ver + " · " + en + " · " + domain;
      card.innerHTML = `<h3>品牌 · 版本 · 英文 · 域名</h3>
        <p class="muted">一键复制中文品牌、版本、英文品牌与域名（演示级）。</p>
        <p class="settings-brand-version-brand-en-domain-r143-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandVersionBrandEnDomainR143CopyBtn">复制品牌版本英文域名</button>`;
      const btn = $("#settingsBrandVersionBrandEnDomainR143CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌版本英文域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 版本 · 英文 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList143() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 143;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 143); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round143 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 900);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleDispositionCopyButtons().catch(() => {}),
      730
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformSummaryTagCopyButtons().catch(() => {}),
      730
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtWindowEndsPlainR143Copy().catch(() => {}),
      720
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallThresholdProgressPlainR143Copy().catch(() => {}),
      740
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareServiceHospitalDepartmentCopyButtons().catch(() => {}),
      730
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationCompleteTitleCopy().catch(() => {}),
      700
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationIdCopyButtons().catch(() => {}),
      730
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainSectionsProgressCopy().catch(() => {}),
      740
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 900);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleDispositionCopyButtons().catch(() => {}),
        750
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformSummaryTagCopyButtons().catch(() => {}),
        740
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtWindowEndsPlainR143Copy().catch(() => {}),
        740
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdProgressPlainR143Copy().catch(
            () => {}
          ),
        760
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceHospitalDepartmentCopyButtons().catch(
            () => {}
          ),
        750
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationCompleteTitleCopy().catch(() => {}),
        720
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationIdCopyButtons().catch(() => {}),
        740
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsProgressCopy().catch(() => {}),
        750
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandVersionBrandEnDomainR143CopyCard().catch(() => {});
        paintRoundLayerList143();
      }, 790);
      setTimeout(() => {
        paintBrandVersionBrandEnDomainR143CopyCard().catch(() => {});
        paintRoundLayerList143();
      }, 1470);
    }
  };

  setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 950);
  setTimeout(
    () => ensureLegacyIdTitleDispositionCopyButtons().catch(() => {}),
    970
  );
  setTimeout(
    () => ensureAssetPlatformSummaryTagCopyButtons().catch(() => {}),
    990
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtWindowEndsPlainR143Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdProgressPlainR143Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceHospitalDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationCompleteTitleCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsProgressCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandVersionBrandEnDomainR143CopyCard().catch(() => {});
      paintRoundLayerList143();
    }, 810);
  }
})();
