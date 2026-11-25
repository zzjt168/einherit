/* 电子继承 · 第一百九十七批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round197SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+版本+中文品牌冷静条 */
  async function paintHomeDomainVersionBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionBrandCalmBarR197");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR197";
      bar.className = "home-domain-version-brand-calm-r197";
      bar.setAttribute("role", "status");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR196");
      const brandEnDom = $("#homeBrandEnBrandDomainCalmBarR195");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR194");
      if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (brandEnDom && brandEnDom.parentNode === home)
        brandEnDom.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r197-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r197-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR197">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR197");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r197-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r197-sub">域名版本品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR197">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR197");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+受益人组合复制（四进位） */
  async function ensureLegacyDeviceOwnerTitleBeneficiaryCopyButtons() {
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
        ).trim() || "未填归属";
      const title = String(it.title || "").trim() || "无标题";
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const line = deviceOwner + " · " + title + " · " + beneficiary;
      el.dataset.deviceOwnerTitleBeneficiaryR197 = line;
      if (el.querySelector(".lg-copy-device-owner-title-beneficiary-r197")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-title-beneficiary-r197";
      btn.textContent = "复制归属标题受益人R197";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerTitleBeneficiaryR197 || "");
        softBanner(ok ? "已复制归属标题受益人R197" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+可见性+更新时间组合复制（四进位） */
  async function ensureAssetCategoryVisibilityUpdatedCopyButtons() {
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
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const updated =
        String(
          it.updated_at || it.updated || it.modified_at || it.created_at || ""
        ).trim() || "无更新时间";
      const line = category + " · " + visibility + " · " + updated;
      el.dataset.categoryVisibilityUpdatedR197 = line;
      if (el.querySelector(".as-copy-category-visibility-updated-r197")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-visibility-updated-r197";
      btn.textContent = "复制分类可见性更新R197";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.categoryVisibilityUpdatedR197 || ""
        );
        softBanner(ok ? "已复制分类可见性更新R197" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议+上次距今（四进位） */
  async function ensureCheckinWindowEndsNextSuggestedLastAgoPlainR197Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextSuggestedLastAgoPlainR197CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextSuggestedLastAgoPlainR197CopyCard";
      card.className =
        "checkin-window-ends-next-suggested-last-ago-plain-r197-copy";
      const nextLast = $(
        "#checkinNextSuggestedLastAgoStatusPlainR196CopyCard"
      );
      const statusLast = $(
        "#checkinStatusLastAgoWindowEndsPlainR195CopyCard"
      );
      const lastNext = $(
        "#checkinLastAgoNextSuggestedWindowEndsPlainR194CopyCard"
      );
      if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
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
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = windowEnds + " · " + nextAt + " · " + lastAgo;
      const line =
        "报备窗口截止 · 下次建议 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-suggested-last-ago-plain-r197-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextSuggestedLastAgoPlainR197CopyBtn">复制窗口下次距今R197</button>`;
      const btn = $("#checkinWindowEndsNextSuggestedLastAgoPlainR197CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次距今R197" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+已存+门槛三元复制（四进位） */
  async function ensureTravelBalanceDepositedThresholdPlainR197Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceDepositedThresholdPlainR197CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceDepositedThresholdPlainR197CopyCard";
      card.className = "travel-balance-deposited-threshold-plain-r197-copy";
      const depShort = $(
        "#travelDepositedShortfallBalancePlainR196CopyCard"
      );
      const thrBal = $(
        "#travelThresholdBalanceDepositedPlainR195CopyCard"
      );
      const shortBal = $(
        "#travelShortfallBalanceDepositedPlainR194CopyCard"
      );
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
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
      const combo = balance + " · " + deposited + " · " + threshold;
      const line =
        "差旅余额 · 已存 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-deposited-threshold-plain-r197-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceDepositedThresholdPlainR197CopyBtn">复制余额已存门槛R197</button>`;
      const btn = $("#travelBalanceDepositedThresholdPlainR197CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额已存门槛R197" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额已存门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+科室+医院组合复制（四进位） */
  async function ensureAftercareServiceTypeDepartmentHospitalCopyButtonsR197() {
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
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = serviceType + " · " + department + " · " + hospital;
      el.dataset.serviceTypeDepartmentHospitalR197 = line;
      if (el.querySelector(".ac-copy-service-type-department-hospital-r197"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-service-type-department-hospital-r197";
      btn.textContent = "复制服务科室医院R197";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeDepartmentHospitalR197 || ""
        );
        softBanner(ok ? "已复制服务科室医院R197" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成组合复制（四进位） */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR197Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR197Card";
      card.className = "av-duration-hint-ready-complete-copy-r197";
      const readyDur = $("#avReadyDurationHintMissingCopyR196Card");
      const missComplete = $("#avMissingCompleteReadyCopyR195Card");
      const completeReady = $("#avCompleteReadyDurationHintCopyR194Card");
      if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
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
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r197-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR197Btn">复制时长就绪完成R197</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR197Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成R197" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式+关系组合复制（四进位） */
  async function ensureHeirIdContactRelationCopyButtonsR197() {
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
      const idLabel = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const line = idLabel + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-id-contact-relation-r197")) return;
      el.dataset.idContactRelationR197 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-relation-r197";
      btn.textContent = "复制编号联系关系R197";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactRelationR197 || "");
        softBanner(ok ? "已复制编号联系关系R197" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+进度百分比+章节数组合复制（四进位） */
  async function ensureHandoverDoneProgressPctSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneProgressPctSectionsCopyR197Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneProgressPctSectionsCopyR197Card";
      card.className = "hand-done-progress-pct-sections-copy-r197";
      const secDone = $("#handSectionsDoneDomainCopyR196Card");
      const pctDone = $("#handProgressPctDoneSectionsCopyR195Card");
      const domDone = $("#handDomainDoneProgressPctCopyR194Card");
      if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (domDone && domDone.parentNode)
        domDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
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
      const combo = done + " · " + pct + " · " + sections;
      const line = "手册完成 · 进度 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-done-progress-pct-sections-copy-r197-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneProgressPctSectionsCopyR197Btn">复制完成进度章节R197</button>`;
      const btn = $("#handDoneProgressPctSectionsCopyR197Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成进度章节R197" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintVersionDomainBrandEnOkR197CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionDomainBrandEnOkR197CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionDomainBrandEnOkR197CopyCard";
      card.className = "card settings-version-domain-brand-en-ok-r197-copy-card";
      const brandOk = $("#settingsBrandOkBrandEnDomainR196CopyCard");
      const domVer = $("#settingsDomainVersionOkBrandEnR195CopyCard");
      const brandEnOk2 = $("#settingsBrandEnOkBrandVersionR194CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk2 && brandEnOk2.parentNode)
        brandEnOk2.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = ver + " · " + domain + " · " + en + " · " + okLabel;
      card.innerHTML = `<h3>版本 · 域名 · 英文 · ok</h3>
        <p class="muted">一键复制版本、域名、英文品牌与健康态（演示级）。</p>
        <p class="settings-version-domain-brand-en-ok-r197-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionDomainBrandEnOkR197CopyBtn">复制版本域名英文就绪R197</button>`;
      const btn = $("#settingsVersionDomainBrandEnOkR197CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名英文就绪R197" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 英文 · ok</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList197() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 197); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round197 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerTitleBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetCategoryVisibilityUpdatedCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsNextSuggestedLastAgoPlainR197Copy().catch(
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
        ensureTravelBalanceDepositedThresholdPlainR197Copy().catch(
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
        ensureAftercareServiceTypeDepartmentHospitalCopyButtonsR197().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdContactRelationCopyButtonsR197().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneProgressPctSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerTitleBeneficiaryCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetCategoryVisibilityUpdatedCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsNextSuggestedLastAgoPlainR197Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceDepositedThresholdPlainR197Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeDepartmentHospitalCopyButtonsR197().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdContactRelationCopyButtonsR197().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneProgressPctSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainBrandEnOkR197CopyCard().catch(() => {});
        paintRoundLayerList197();
      }, 890);
      setTimeout(() => {
        paintVersionDomainBrandEnOkR197CopyCard().catch(() => {});
        paintRoundLayerList197();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerTitleBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategoryVisibilityUpdatedCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextSuggestedLastAgoPlainR197Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceDepositedThresholdPlainR197Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeDepartmentHospitalCopyButtonsR197().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactRelationCopyButtonsR197().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneProgressPctSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainBrandEnOkR197CopyCard().catch(() => {});
      paintRoundLayerList197();
    }, 910);
  }
})();
