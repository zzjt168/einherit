/* 电子继承 · 第二百批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round200SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌+版本冷静条 */
  async function paintHomeDomainBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnVersionCalmBarR200");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnVersionCalmBarR200";
      bar.className = "home-domain-brand-en-version-calm-r200";
      bar.setAttribute("role", "status");
      const verEn = $("#homeVersionBrandEnBrandCalmBarR199");
      const brandEnDom2 = $("#homeBrandEnDomainBrandCalmBarR198");
      const domainVer = $("#homeDomainVersionBrandCalmBarR197");
      if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (brandEnDom2 && brandEnDom2.parentNode === home)
        brandEnDom2.insertAdjacentElement("afterend", bar);
      else if (domainVer && domainVer.parentNode === home)
        domainVer.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r200-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r200-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR200">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR200");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r200-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r200-sub">域名英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR200">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR200");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+标题+备注组合复制（四进位） */
  async function ensureLegacyDispositionTitleNotesCopyButtons() {
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
        String(
          it.disposition || it.action || it.dispose || it.dispose_action || ""
        ).trim() || "未填处置";
      const title = String(it.title || "").trim() || "无标题";
      const notes = String(it.notes || it.note || "").trim() || "无备注";
      const line = disposition + " · " + title + " · " + notes;
      el.dataset.dispositionTitleNotesR200 = line;
      if (el.querySelector(".lg-copy-disposition-title-notes-r200")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-title-notes-r200";
      btn.textContent = "复制处置标题备注R200";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionTitleNotesR200 || "");
        softBanner(ok ? "已复制处置标题备注R200" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+更新时间+分类组合复制（四进位） */
  async function ensureAssetTagUpdatedCategoryCopyButtons() {
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
      const tag = String(it.tag || it.tags || "").trim() || "无标签";
      const updated =
        String(
          it.updated_at || it.updated || it.modified_at || it.created_at || ""
        ).trim() || "无更新时间";
      const category =
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const line = tag + " · " + updated + " · " + category;
      el.dataset.tagUpdatedCategoryR200 = line;
      if (el.querySelector(".as-copy-tag-updated-category-r200")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-updated-category-r200";
      btn.textContent = "复制标签更新分类R200";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.tagUpdatedCategoryR200 || ""
        );
        softBanner(ok ? "已复制标签更新分类R200" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+上次距今+状态（四进位） */
  async function ensureCheckinWindowEndsLastAgoStatusPlainR200Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsLastAgoStatusPlainR200CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsLastAgoStatusPlainR200CopyCard";
      card.className =
        "checkin-window-ends-last-ago-status-plain-r200-copy";
      const lastStatus = $(
        "#checkinLastAgoStatusNextSuggestedPlainR199CopyCard"
      );
      const statusWin = $(
        "#checkinStatusWindowEndsNextSuggestedPlainR198CopyCard"
      );
      const winNext = $(
        "#checkinWindowEndsNextSuggestedLastAgoPlainR197CopyCard"
      );
      if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
      else if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            st.window_end ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const combo = windowEnds + " · " + lastAgo + " · " + status;
      const line =
        "报备窗口截止 · 上次距今 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-last-ago-status-plain-r200-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsLastAgoStatusPlainR200CopyBtn">复制窗口距今状态R200</button>`;
      const btn = $("#checkinWindowEndsLastAgoStatusPlainR200CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口距今状态R200" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口距今状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+门槛+缺口三元复制（四进位） */
  async function ensureTravelDepositedThresholdShortfallPlainR200Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedThresholdShortfallPlainR200CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedThresholdShortfallPlainR200CopyCard";
      card.className = "travel-deposited-threshold-shortfall-plain-r200-copy";
      const thrDep = $(
        "#travelThresholdDepositedShortfallPlainR199CopyCard"
      );
      const shortThr = $(
        "#travelShortfallThresholdBalancePlainR198CopyCard"
      );
      const balDep = $(
        "#travelBalanceDepositedThresholdPlainR197CopyCard"
      );
      if (thrDep && thrDep.parentNode)
        thrDep.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
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
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = deposited + " · " + threshold + " · " + shortfall;
      const line =
        "差旅已存 · 门槛 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-threshold-shortfall-plain-r200-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedThresholdShortfallPlainR200CopyBtn">复制已存门槛缺口R200</button>`;
      const btn = $("#travelDepositedThresholdShortfallPlainR200CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存门槛缺口R200" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存门槛缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+服务类型+科室组合复制（四进位） */
  async function ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR200() {
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
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = hospital + " · " + serviceType + " · " + department;
      el.dataset.hospitalServiceTypeDepartmentR200 = line;
      if (el.querySelector(".ac-copy-hospital-service-type-department-r200"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-service-type-department-r200";
      btn.textContent = "复制医院服务科室R200";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalServiceTypeDepartmentR200 || ""
        );
        softBanner(ok ? "已复制医院服务科室R200" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成+时长提示组合复制（四进位） */
  async function ensureAuthReadyCompleteDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteDurationHintCopyR200Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteDurationHintCopyR200Card";
      card.className = "av-ready-complete-duration-hint-copy-r200";
      const missDur = $("#avMissingDurationHintReadyCopyR199Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR198Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR197Card");
      if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete
      )
        ? "已完成"
        : "未完成";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = ready + " · " + complete + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-duration-hint-copy-r200-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteDurationHintCopyR200Btn">复制就绪完成时长R200</button>`;
      const btn = $("#avReadyCompleteDurationHintCopyR200Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成时长R200" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+姓名组合复制（四进位） */
  async function ensureHeirRelationIdNameCopyButtonsR200() {
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
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const idLabel = String(it.id);
      const name = String(it.name || "").trim() || "未填姓名";
      const line = relation + " · " + idLabel + " · " + name;
      if (el.querySelector(".bn-copy-relation-id-name-r200")) return;
      el.dataset.relationIdNameR200 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-name-r200";
      btn.textContent = "复制关系编号姓名R200";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdNameR200 || "");
        softBanner(ok ? "已复制关系编号姓名R200" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+进度百分比+完成数组合复制（四进位） */
  async function ensureHandoverSectionsProgressPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsProgressPctDoneCopyR200Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsProgressPctDoneCopyR200Card";
      card.className = "hand-sections-progress-pct-done-copy-r200";
      const pctDom = $("#handProgressPctDomainSectionsCopyR199Card");
      const domSec = $("#handDomainSectionsDoneCopyR198Card");
      const donePct = $("#handDoneProgressPctSectionsCopyR197Card");
      if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (donePct && donePct.parentNode)
        donePct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
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
      const pctRaw =
        prog.pct != null
          ? prog.pct
          : prog.percent != null
            ? prog.percent
            : data.progress_pct;
      const pct =
        pctRaw == null
          ? "—"
          : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = sections + " · " + pct + " · " + done;
      const line = "手册章节 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-progress-pct-done-copy-r200-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsProgressPctDoneCopyR200Btn">复制章节进度完成R200</button>`;
      const btn = $("#handSectionsProgressPctDoneCopyR200Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节进度完成R200" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节进度完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintBrandEnDomainBrandVersionR200CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnDomainBrandVersionR200CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnDomainBrandVersionR200CopyCard";
      card.className = "card settings-brand-en-domain-brand-version-r200-copy-card";
      const brandVer = $("#settingsBrandVersionDomainOkR199CopyCard");
      const okEn = $("#settingsOkBrandEnVersionBrandR198CopyCard");
      const verDom = $("#settingsVersionDomainBrandEnOkR197CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = en + " · " + domain + " · " + brand + " · " + ver;
      card.innerHTML = `<h3>英文 · 域名 · 品牌 · 版本</h3>
        <p class="muted">一键复制英文品牌、域名、中文品牌与版本（演示级）。</p>
        <p class="settings-brand-en-domain-brand-version-r200-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnDomainBrandVersionR200CopyBtn">复制英文域名品牌版本R200</button>`;
      const btn = $("#settingsBrandEnDomainBrandVersionR200CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文域名品牌版本R200" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 域名 · 品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList200() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 200); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round200 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionTitleNotesCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetTagUpdatedCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsLastAgoStatusPlainR200Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedThresholdShortfallPlainR200Copy().catch(
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
        ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR200().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdNameCopyButtonsR200().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsProgressPctDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionTitleNotesCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetTagUpdatedCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsLastAgoStatusPlainR200Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedThresholdShortfallPlainR200Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR200().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdNameCopyButtonsR200().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsProgressPctDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnDomainBrandVersionR200CopyCard().catch(() => {});
        paintRoundLayerList200();
      }, 890);
      setTimeout(() => {
        paintBrandEnDomainBrandVersionR200CopyCard().catch(() => {});
        paintRoundLayerList200();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionTitleNotesCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagUpdatedCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsLastAgoStatusPlainR200Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedThresholdShortfallPlainR200Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalServiceTypeDepartmentCopyButtonsR200().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdNameCopyButtonsR200().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsProgressPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnDomainBrandVersionR200CopyCard().catch(() => {});
      paintRoundLayerList200();
    }, 910);
  }
})();
