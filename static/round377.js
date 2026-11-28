/* 电子继承 · 第三百六十六一批增量（叠在 round365…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round377SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+域名+中文品牌冷静条 */
  async function paintHomeVersionDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionBrandCalmBarR377");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR377";
      bar.className = "home-domain-version-brand-calm-r377";
      bar.setAttribute("role", "status");
      const prev = $("#homeBrandDomainVersionCalmBarR376");
      const r338 = $("#homeVersionBrandDomainCalmBarR375");
      const r337 = $("#homeDomainBrandVersionCalmBarR374");
      if (prev && prev.parentNode === home)
        prev.insertAdjacentElement("afterend", bar);
      else if (r338 && r338.parentNode === home)
        r338.insertAdjacentElement("afterend", bar);
      else if (r337 && r337.parentNode === home)
        r337.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || h.host || "einherit.cn").trim() || "einherit.cn";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r377-mark">品牌</span>
        <span class="muted home-domain-version-brand-calm-r377-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR377">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR377");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r377-mark">品牌</span>
        <span class="muted home-domain-version-brand-calm-r377-sub">版本域名中文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR377">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR377");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+处置+标题组合复制（三百六十六进位） */
  async function ensureLegacyDeviceOwnerDispositionTitleCopyButtons() {
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
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const title = String(it.title || "").trim() || "无标题";
      const line = title + " · " + disposition + " · " + deviceOwner;
      el.dataset.titleDispositionDeviceOwnerR377 = line;
      if (el.querySelector(".lg-copy-title-disposition-device-owner-r377")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-device-owner-r377";
      btn.textContent = "复制标题处置归属R377";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDispositionDeviceOwnerR377 || "");
        softBanner(ok ? "已复制标题处置归属R377" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+摘要+标签组合复制（三百六十六进位） */
  async function ensureAssetVisibilitySummaryTagCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = tag + " · " + summary + " · " + visibility;
      el.dataset.tagSummaryVisibilityR377 = line;
      if (el.querySelector(".as-copy-tag-summary-visibility-r377")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-summary-visibility-r377";
      btn.textContent = "复制标签摘要可见性R377";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.tagSummaryVisibilityR377 || ""
        );
        softBanner(ok ? "已复制标签摘要可见性R377" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+下次建议+上次距今（三百六十六进位） */
  async function ensureCheckinLastAgoNextSuggestedStatusPlainR377Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoNextSuggestedStatusPlainR377CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoNextSuggestedStatusPlainR377CopyCard";
      card.className =
        "checkin-last-ago-next-suggested-status-plain-r377-copy";
      const prevCk = $(
        "#checkinNextSuggestedStatusLastAgoPlainR376CopyCard"
      );
      const prevCk2 = $(
        "#checkinStatusLastAgoNextSuggestedPlainR375CopyCard"
      );
      const prevCk3 = $(
        "#checkinLastAgoStatusNextSuggestedPlainR374CopyCard"
      );
      if (prevCk && prevCk.parentNode)
        prevCk.insertAdjacentElement("afterend", card);
      else if (prevCk2 && prevCk2.parentNode)
        prevCk2.insertAdjacentElement("afterend", card);
      else if (prevCk3 && prevCk3.parentNode)
        prevCk3.insertAdjacentElement("afterend", card);
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
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = lastAgo + " · " + nextAt + " · " + status;
      const line =
        "报备状态 · 下次建议 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-next-suggested-status-plain-r377-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoNextSuggestedStatusPlainR377CopyBtn">复制上次距今下次建议状态R377</button>`;
      const btn = $("#checkinLastAgoNextSuggestedStatusPlainR377CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制上次距今下次建议状态R377" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次距今下次建议状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制（三百六十六进位） */
  async function ensureTravelDepositedBalanceThresholdPlainR377Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedBalanceThresholdPlainR377CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedBalanceThresholdPlainR377CopyCard";
      card.className = "travel-deposited-balance-threshold-plain-r377-copy";
      const prevTr = $(
        "#travelBalanceThresholdDepositedPlainR376CopyCard"
      );
      const prevTr2 = $(
        "#travelThresholdDepositedBalancePlainR375CopyCard"
      );
      const prevTr3 = $(
        "#travelDepositedThresholdBalancePlainR374CopyCard"
      );
      if (prevTr && prevTr.parentNode)
        prevTr.insertAdjacentElement("afterend", card);
      else if (prevTr2 && prevTr2.parentNode)
        prevTr2.insertAdjacentElement("afterend", card);
      else if (prevTr3 && prevTr3.parentNode)
        prevTr3.insertAdjacentElement("afterend", card);
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
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = deposited + " · " + balance + " · " + threshold;
      const line =
        "差旅门槛 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-balance-threshold-plain-r377-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedBalanceThresholdPlainR377CopyBtn">复制已存余额门槛R377</button>`;
      const btn = $("#travelDepositedBalanceThresholdPlainR377CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存余额门槛R377" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+城市+科室组合复制（三百六十六进位） */
  async function ensureAftercareDepartmentCityHospitalCopyButtonsR377() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospitalR377 = line;
      if (el.querySelector(".ac-copy-department-city-hospital-r377"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-department-city-hospital-r377";
      btn.textContent = "复制科室城市医院R377";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.departmentCityHospitalR377 || ""
        );
        softBanner(ok ? "已复制科室城市医院R377" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+时长提示+就绪组合复制（三百六十六进位） */
  async function ensureAuthDurationHintCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintCompleteReadyCopyR377Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintCompleteReadyCopyR377Card";
      card.className = "av-duration-hint-complete-ready-copy-r377";
      const prevAv = $("#avReadyDurationHintCompleteCopyR376Card");
      const prevAv2 = $("#avCompleteReadyDurationHintCopyR375Card");
      const prevAv3 = $("#avDurationHintReadyCompleteCopyR374Card");
      if (prevAv && prevAv.parentNode)
        prevAv.insertAdjacentElement("afterend", card);
      else if (prevAv2 && prevAv2.parentNode)
        prevAv2.insertAdjacentElement("afterend", card);
      else if (prevAv3 && prevAv3.parentNode)
        prevAv3.insertAdjacentElement("afterend", card);
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
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete != null
              ? latest.complete
              : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-complete-ready-copy-r377-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintCompleteReadyCopyR377Btn">复制时长完成就绪R377</button>`;
      const btn = $("#avDurationHintCompleteReadyCopyR377Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长完成就绪R377" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成就绪文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式+关系组合复制（三百六十六进位） */
  async function ensureHeirContactNameRelationCopyButtonsR377() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation-r377")) return;
      el.dataset.contactNameRelationR377 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation-r377";
      btn.textContent = "复制联系姓名关系R377";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelationR377 || "");
        softBanner(ok ? "已复制联系姓名关系R377" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+进度百分比+域名组合复制（三百六十六进位） */
  async function ensureHandoverProgressPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneDomainCopyR377Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneDomainCopyR377Card";
      card.className = "hand-progress-pct-done-domain-copy-r377";
      const prevHand = $("#handDomainProgressPctDoneCopyR376Card");
      const prevHand2 = $("#handDoneDomainProgressPctCopyR375Card");
      const prevHand3 = $("#handProgressPctDomainDoneCopyR374Card");
      if (prevHand && prevHand.parentNode)
        prevHand.insertAdjacentElement("afterend", card);
      else if (prevHand2 && prevHand2.parentNode)
        prevHand2.insertAdjacentElement("afterend", card);
      else if (prevHand3 && prevHand3.parentNode)
        prevHand3.insertAdjacentElement("afterend", card);
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
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
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
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-domain-copy-r377-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneDomainCopyR377Btn">复制域名进度完成数R377</button>`;
      const btn = $("#handProgressPctDoneDomainCopyR377Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度完成数R377" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名进度完成文案暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+就绪+中文品牌+版本四元复制（再进位） + round 层含 340 */
  async function paintBrandVersionBrandEnOkR377CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandVersionBrandEnOkR377CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandVersionBrandEnOkR377CopyCard";
      card.className = "card settings-brand-version-brand-en-ok-r377-copy-card";
      const prevSet = $("#settingsOkBrandEnBrandVersionR376CopyCard");
      const prevSet2 = $("#settingsBrandEnOkVersionBrandR375CopyCard");
      const prevSet3 = $("#settingsOkBrandBrandEnVersionR374CopyCard");
      const roundList = $("#roundLayerListCard");
      if (prevSet && prevSet.parentNode)
        prevSet.insertAdjacentElement("beforebegin", card);
      else if (prevSet2 && prevSet2.parentNode)
        prevSet2.insertAdjacentElement("beforebegin", card);
      else if (prevSet3 && prevSet3.parentNode)
        prevSet3.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = brand + " · " + ver + " · " + brandEn + " · " + okLabel;
      card.innerHTML = `<h3>中文 · 版本 · 英文 · 就绪</h3>
        <p class="muted">一键复制英文品牌、就绪态、版本与中文品牌（演示级）。</p>
        <p class="settings-brand-version-brand-en-ok-r377-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandVersionBrandEnOkR377CopyBtn">复制英文就绪版本中文R377</button>`;
      const btn = $("#settingsBrandVersionBrandEnOkR377CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪版本中文R377" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文 · 版本 · 英文 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList377() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 340); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round377 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinLastAgoNextSuggestedStatusPlainR377Copy().catch(
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
        ensureTravelDepositedBalanceThresholdPlainR377Copy().catch(
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
        ensureAftercareDepartmentCityHospitalCopyButtonsR377().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintCompleteReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtonsR377().catch(() => {}),
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
      setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoNextSuggestedStatusPlainR377Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedBalanceThresholdPlainR377Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtonsR377().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintCompleteReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameRelationCopyButtonsR377().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandVersionBrandEnOkR377CopyCard().catch(() => {});
        paintRoundLayerList377();
      }, 890);
      setTimeout(() => {
        paintBrandVersionBrandEnOkR377CopyCard().catch(() => {});
        paintRoundLayerList377();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoNextSuggestedStatusPlainR377Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedBalanceThresholdPlainR377Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtonsR377().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtonsR377().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandVersionBrandEnOkR377CopyCard().catch(() => {});
      paintRoundLayerList377();
    }, 910);
  }
})();